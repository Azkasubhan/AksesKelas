import { createHash } from "node:crypto";
import { lt, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { rateLimitBuckets } from "../db/schema";
import { Errors } from "../errors";

/**
 * Rate limit fixed-window di PostgreSQL (PRD bagian 18): atomic increment
 * sehingga konsisten lintas proses web. Key di-hash agar email/IP tidak
 * tersimpan mentah.
 */
export async function consumeRateLimit(
  rawKey: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  const windowMs = windowSeconds * 1000;
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  const key = createHash("sha256").update(rawKey).digest("hex");
  const db = getDb();

  const [row] = await db
    .insert(rateLimitBuckets)
    .values({ key, windowStart, requestCount: 1 })
    .onConflictDoUpdate({
      target: [rateLimitBuckets.key, rateLimitBuckets.windowStart],
      set: { requestCount: sql`${rateLimitBuckets.requestCount} + 1` },
    })
    .returning({ count: rateLimitBuckets.requestCount });

  // Purge bucket kedaluwarsa secara oportunistik (±1% request).
  if (Math.random() < 0.01) {
    void db
      .delete(rateLimitBuckets)
      .where(lt(rateLimitBuckets.windowStart, new Date(now - 24 * 3600_000)))
      .catch(() => undefined);
  }

  if (row.count > limit) {
    const retryAfter = Math.ceil((windowStart.getTime() + windowMs - now) / 1000);
    throw Errors.rateLimited(retryAfter);
  }
}

export const LIMITS = {
  login: { limit: 10, windowSeconds: 15 * 60 },
  signup: { limit: 10, windowSeconds: 15 * 60 },
  join: { limit: 10, windowSeconds: 10 * 60 },
} as const;
