import "server-only";
import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import { AppError, Errors } from "./errors";
import { appOrigin, getEnv } from "./env";
import { getCurrentSession, type CurrentSession, type Role } from "./auth/session";
import { verifyCsrfToken } from "./auth/tokens";

/**
 * Pembungkus Route Handler: request ID, Cache-Control private, pemeriksaan
 * Origin + CSRF pada mutation, otorisasi role dari session (bukan body),
 * dan bentuk error seragam (PRD bagian 11).
 */
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status, headers: PRIVATE_HEADERS });
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204, headers: PRIVATE_HEADERS });
}

function errorResponse(err: AppError, requestId: string): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: err.code,
        message: err.message,
        fieldErrors: err.fieldErrors,
        requestId,
      },
    },
    { status: err.status, headers: PRIVATE_HEADERS },
  );
}

function zodFieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

export async function parseJson<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw Errors.badRequest("Isi permintaan bukan JSON yang valid.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw Errors.validation(zodFieldErrors(parsed.error));
  return parsed.data;
}

/** IP klien hanya dipercaya dari header proxy bila TRUST_PROXY=true. */
export function clientIp(req: NextRequest): string {
  if (!getEnv().TRUST_PROXY) return "direct";
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}

function checkOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) throw Errors.csrf();
  const configured = appOrigin();
  if (origin === configured) return;

  // Dalam mode development, toleransi perbedaan penulisan localhost vs 127.0.0.1 pada port yang sama
  if (getEnv().NODE_ENV === "development") {
    try {
      const origUrl = new URL(origin);
      const confUrl = new URL(configured);
      const isLoopbackOrig = origUrl.hostname === "localhost" || origUrl.hostname === "127.0.0.1";
      const isLoopbackConf = confUrl.hostname === "localhost" || confUrl.hostname === "127.0.0.1";
      if (
        isLoopbackOrig &&
        isLoopbackConf &&
        origUrl.port === confUrl.port &&
        origUrl.protocol === confUrl.protocol
      ) {
        return;
      }
    } catch {}
  }

  throw Errors.csrf();
}

export interface RouteContext<P> {
  req: NextRequest;
  params: P;
  session: CurrentSession | null;
  requestId: string;
}

type Auth = "none" | "any" | Role;

export function route<P = Record<string, never>>(
  opts: { auth: Auth; mutation?: boolean },
  handler: (ctx: RouteContext<P>) => Promise<Response>,
) {
  return async (
    req: NextRequest,
    ctx: { params: Promise<P> },
  ): Promise<Response> => {
    const requestId = randomUUID();
    try {
      if (opts.mutation) checkOrigin(req);

      let session: CurrentSession | null = null;
      if (opts.auth !== "none") {
        session = await getCurrentSession();
        if (!session) throw Errors.unauthenticated();
        if (opts.auth !== "any" && session.user.role !== opts.auth) {
          throw Errors.forbidden();
        }
        if (opts.mutation && !verifyCsrfToken(session.sessionId, req.headers.get("x-csrf-token"))) {
          throw Errors.csrf();
        }
      }

      const params = (ctx?.params ? await ctx.params : {}) as P;
      const res = await handler({ req, params, session, requestId });
      return res;
    } catch (err) {
      if (err instanceof AppError) return errorResponse(err, requestId);
      if (err instanceof ZodError) {
        return errorResponse(Errors.validation(zodFieldErrors(err)), requestId);
      }
      // Jangan bocorkan stack, query, atau connection string.
      console.error(`[api] ${requestId} unhandled:`, err instanceof Error ? err.message : "unknown");
      return errorResponse(
        new AppError("INTERNAL_ERROR", 500, "Terjadi kesalahan di server. Coba lagi sebentar lagi."),
        requestId,
      );
    }
  };
}
