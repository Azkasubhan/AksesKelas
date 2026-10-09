"use client";

import * as React from "react";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly fieldErrors: Record<string, string> = {},
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let activeCsrfToken = "";

export function setCsrfToken(token: string) {
  activeCsrfToken = token;
  if (typeof window !== "undefined") {
    (window as unknown as { __AK_CSRF__?: string }).__AK_CSRF__ = token;
  }
}

export function getCsrfToken(): string {
  if (activeCsrfToken) return activeCsrfToken;
  if (typeof window !== "undefined") {
    const winToken = (window as unknown as { __AK_CSRF__?: string }).__AK_CSRF__;
    if (winToken) {
      activeCsrfToken = winToken;
      return winToken;
    }
  }
  if (typeof document !== "undefined") {
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) {
      const val = meta.getAttribute("content");
      if (val) {
        activeCsrfToken = val;
        return val;
      }
    }
  }
  return "";
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: { method?: "GET" | "POST" | "PATCH" | "PUT"; body?: unknown; csrfToken?: string } = {},
): Promise<T> {
  const method = opts.method ?? "GET";
  const csrf = opts.csrfToken || (method !== "GET" ? getCsrfToken() : undefined);

  let res: Response;
  try {
    res = await fetch(`/api/v1${path}`, {
      method,
      credentials: "same-origin",
      headers: {
        ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(csrf ? { "x-csrf-token": csrf } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError(
      "NETWORK_ERROR",
      0,
      "Tidak dapat terhubung ke server. Periksa koneksi internet, lalu coba lagi.",
    );
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const e = json?.error;
    throw new ApiError(
      e?.code ?? "UNKNOWN",
      res.status,
      e?.message ?? "Terjadi kesalahan. Coba lagi sebentar lagi.",
      e?.fieldErrors ?? {},
      e?.requestId,
    );
  }
  return json.data as T;
}

const CsrfContext = React.createContext<string>("");

export function CsrfProvider({
  token,
  children,
}: {
  token: string;
  children: React.ReactNode;
}) {
  if (token) {
    setCsrfToken(token);
  }

  React.useEffect(() => {
    if (token) {
      setCsrfToken(token);
    }
  }, [token]);

  return (
    <CsrfContext.Provider value={token}>
      {token ? <meta name="csrf-token" content={token} /> : null}
      {children}
    </CsrfContext.Provider>
  );
}

export function useCsrf(): string {
  const ctx = React.useContext(CsrfContext);
  return ctx || getCsrfToken();
}
