import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { readingPreferences, users } from "../db/schema";
import { AppError, Errors } from "../errors";
import { consumeRateLimit, LIMITS } from "../auth/rate-limit";
import { dummyHash, hashPassword, verifyPassword } from "../auth/password";
import type { LoginInput, SignupInput } from "@/shared/schemas/auth-classes";
import { loginSchema, signupSchema } from "@/shared/schemas/auth-classes";

export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "23505"
  );
}

export async function signupUser(input: SignupInput, ip: string) {
  const data = signupSchema.parse(input);
  await consumeRateLimit(`signup:${ip}`, LIMITS.signup.limit, LIMITS.signup.windowSeconds);

  const passwordHash = await hashPassword(data.password);
  const id = randomUUID();
  try {
    await getDb().transaction(async (tx) => {
      await tx.insert(users).values({
        id,
        email: data.email,
        displayName: data.displayName,
        passwordHash,
        role: data.role,
      });
      await tx.insert(readingPreferences).values({ userId: id });
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      // Tidak mengonfirmasi data profil akun yang sudah ada.
      throw new AppError(
        "SIGNUP_UNAVAILABLE",
        409,
        "Pendaftaran dengan email ini tidak dapat dilanjutkan. Coba masuk, atau gunakan email lain.",
        { email: "Email ini tidak dapat dipakai untuk mendaftar" },
      );
    }
    throw err;
  }
  return { id, role: data.role };
}

export async function authenticateUser(input: LoginInput, ip: string) {
  const data = loginSchema.parse(input);
  await consumeRateLimit(
    `login:${ip}:${data.email}`,
    LIMITS.login.limit,
    LIMITS.login.windowSeconds,
  );

  const [user] = await getDb()
    .select()
    .from(users)
    .where(eq(sql`lower(${users.email})`, data.email))
    .limit(1);

  const valid = await verifyPassword(data.password, user?.passwordHash ?? (await dummyHash()));
  if (!user || !valid) {
    throw new AppError("INVALID_CREDENTIALS", 401, "Email atau kata sandi belum cocok. Periksa lagi lalu coba masuk kembali.");
  }
  return { id: user.id, role: user.role as "teacher" | "student" };
}

export async function getPreferencesFor(userId: string) {
  const [row] = await getDb()
    .select()
    .from(readingPreferences)
    .where(eq(readingPreferences.userId, userId))
    .limit(1);
  if (!row) throw Errors.notFound();
  return {
    structure: row.structure,
    easyRead: row.easyRead,
    fontFamily: row.fontFamily,
    fontSize: row.fontSize,
    lineHeight: Number(row.lineHeight),
    letterSpacing: Number(row.letterSpacing),
    lineWidth: row.lineWidth,
    theme: row.theme,
    motion: row.motion,
    listenEnabled: row.listenEnabled,
    speechRate: Number(row.speechRate),
    voiceUri: row.voiceUri,
  };
}
