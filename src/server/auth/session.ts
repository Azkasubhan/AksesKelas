import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "../db/client";
import { sessions, users } from "../db/schema";
import { cookieSecure, getEnv } from "../env";
import { csrfTokenFor, generateSessionToken, hashToken } from "./tokens";

export const SESSION_COOKIE = "ak_session";

export type Role = "teacher" | "student";

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
}

export interface CurrentSession {
  sessionId: string;
  user: SessionUser;
  csrfToken: string;
}

export async function createSession(userId: string): Promise<void> {
  const env = getEnv();
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * 24 * 3600_000);
  await getDb().insert(sessions).values({
    id: randomUUID(),
    userId,
    tokenHash: hashToken(token),
    expiresAt,
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Membaca session dari cookie; satu query per request berkat React cache. */
export const getCurrentSession = cache(async (): Promise<CurrentSession | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [row] = await getDb()
    .select({
      sessionId: sessions.id,
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (!row) return null;

  return {
    sessionId: row.sessionId,
    csrfToken: csrfTokenFor(row.sessionId),
    user: {
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      role: row.role as Role,
    },
  };
});

export async function destroyCurrentSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await getDb().delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  }
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
