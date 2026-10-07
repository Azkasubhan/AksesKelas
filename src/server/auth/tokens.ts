import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getEnv } from "../env";

/** Token session: 32 byte acak; hanya SHA-256 yang disimpan di DB. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * CSRF token terikat session: HMAC(CSRF_SECRET, sessionId).
 * Dikirim klien lewat header x-csrf-token pada setiap mutation.
 */
export function csrfTokenFor(sessionId: string): string {
  return createHmac("sha256", getEnv().CSRF_SECRET)
    .update(`csrf:${sessionId}`)
    .digest("base64url");
}

export function verifyCsrfToken(sessionId: string, provided: string | null): boolean {
  if (!provided) return false;
  const expected = Buffer.from(csrfTokenFor(sessionId));
  const actual = Buffer.from(provided);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
