import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { generateSessionToken, hashToken, csrfTokenFor, verifyCsrfToken } from "@/server/auth/tokens";
import { signupSchema } from "@/shared/schemas/auth-classes";

describe("Password hashing & verification (scrypt v1)", () => {
  it("hashes password with scrypt format and verifies correctly", async () => {
    const raw = "KataSandiKuatMinimal12!";
    const hashed = await hashPassword(raw);

    expect(hashed).toMatch(/^scrypt\$v1\$16384\$8\$1\$/);

    const valid = await verifyPassword(raw, hashed);
    expect(valid).toBe(true);

    const invalid = await verifyPassword("SalahKataSandi", hashed);
    expect(invalid).toBe(false);
  });
});

describe("Session and CSRF tokens", () => {
  it("generates session tokens and computes deterministic hash", () => {
    const token = generateSessionToken();
    expect(token.length).toBeGreaterThanOrEqual(40);

    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("verifies CSRF token matching session ID", () => {
    process.env.CSRF_SECRET = "test-secret-at-least-16-chars";
    const sessionId = "sess_12345678";
    const csrf = csrfTokenFor(sessionId);

    expect(verifyCsrfToken(sessionId, csrf)).toBe(true);
    expect(verifyCsrfToken("different_sess", csrf)).toBe(false);
    expect(verifyCsrfToken(sessionId, "invalid_csrf")).toBe(false);
  });
});

describe("Auth Zod Schemas", () => {
  it("validates valid signup payload", () => {
    const parsed = signupSchema.safeParse({
      displayName: "Bu Guru Rani",
      email: "RANI@Sekolah.ID",
      password: "SangatKuatDanPanjang123",
      role: "teacher",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.email).toBe("rani@sekolah.id");
    }
  });

  it("rejects password shorter than 12 characters", () => {
    const parsed = signupSchema.safeParse({
      displayName: "Siswa Budi",
      email: "budi@contoh.test",
      password: "pendek",
      role: "student",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects unknown role", () => {
    const parsed = signupSchema.safeParse({
      displayName: "Admin",
      email: "admin@contoh.test",
      password: "SangatKuatDanPanjang123",
      role: "superadmin",
    });
    expect(parsed.success).toBe(false);
  });
});
