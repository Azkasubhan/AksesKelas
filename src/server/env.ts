import { z } from "zod";

/**
 * Validasi environment saat pertama kali dibaca (PRD bagian 19).
 * Mode live tanpa key/model gagal dengan pesan operator yang jelas;
 * tidak pernah diam-diam berpindah ke fixture.
 */
const boolString = z
  .enum(["true", "false"])
  .default("false")
  .transform((v) => v === "true");

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    APP_URL: z.url(),
    DATABASE_URL: z.string().min(1),
    DB_POOL_MAX: z.coerce.number().int().min(1).max(50).default(5),
    TRUST_PROXY: boolString,

    AI_MODE: z.enum(["fixture", "live"]).default("fixture"),
    GEMINI_API_KEY: z.string().optional().default(""),
    GEMINI_MODEL: z.string().optional().default(""),
    AI_PROMPT_VERSION: z.string().default("akseskelas-v1"),
    AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),
    AI_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(5).default(3),
    AI_GENERATIONS_PER_HOUR: z.coerce.number().int().positive().default(5),

    STORAGE_DRIVER: z.enum(["local"]).default("local"),
    UPLOAD_DIR: z.string().default("./storage/uploads"),
    MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(10485760),
    MAX_PDF_PAGES: z.coerce.number().int().positive().default(30),
    MAX_SOURCE_CHARACTERS: z.coerce.number().int().positive().default(60000),

    SESSION_TTL_DAYS: z.coerce.number().int().positive().default(7),
    CSRF_SECRET: z.string().min(16, "CSRF_SECRET minimal 16 karakter"),
    WORKER_CONCURRENCY: z.coerce.number().int().positive().default(1),
    WORKER_POLL_MS: z.coerce.number().int().positive().default(2000),
    WORKER_LEASE_SECONDS: z.coerce.number().int().positive().default(90),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  })
  .superRefine((env, ctx) => {
    if (env.AI_MODE === "live") {
      if (!env.GEMINI_API_KEY) {
        ctx.addIssue({
          code: "custom",
          path: ["GEMINI_API_KEY"],
          message: "AI_MODE=live memerlukan GEMINI_API_KEY",
        });
      }
      if (!env.GEMINI_MODEL) {
        ctx.addIssue({
          code: "custom",
          path: ["GEMINI_MODEL"],
          message: "AI_MODE=live memerlukan GEMINI_MODEL (ID model yang sudah dites)",
        });
      }
    }
    if (env.NODE_ENV === "production" && !env.APP_URL.startsWith("https://")) {
      ctx.addIssue({
        code: "custom",
        path: ["APP_URL"],
        message: "Production wajib memakai APP_URL berskema https",
      });
    }
  });

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map(
      (i) => `  - ${i.path.join(".") || "(env)"}: ${i.message}`,
    );
    throw new Error(
      `Konfigurasi environment tidak valid. Periksa .env (lihat .env.example):\n${lines.join("\n")}`,
    );
  }
  cached = parsed.data;
  return cached;
}

/** Origin dari APP_URL, dipakai untuk pemeriksaan Origin dan redirect. */
export function appOrigin(): string {
  return new URL(getEnv().APP_URL).origin;
}

/** Cookie Secure mengikuti skema APP_URL, bukan NODE_ENV (localhost HTTP eksplisit). */
export function cookieSecure(): boolean {
  return getEnv().APP_URL.startsWith("https://");
}
