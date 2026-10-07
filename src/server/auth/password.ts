import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * Password hashing dengan crypto.scrypt (PRD bagian 18).
 * Format versioned: scrypt$v1$N$r$p$<salt b64>$<hash b64>
 * Parameter tersimpan di hash sehingga dapat dinaikkan tanpa memutus akun lama.
 */
const PARAMS = { N: 16384, r: 8, p: 1, keylen: 64 } as const;

function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const { N, r, p, keylen } = PARAMS;
  const key = await scryptAsync(password.normalize("NFKC"), salt, keylen, {
    N,
    r,
    p,
    maxmem: 128 * N * r * 2,
  });
  return [
    "scrypt",
    "v1",
    N,
    r,
    p,
    salt.toString("base64"),
    key.toString("base64"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 7 || parts[0] !== "scrypt" || parts[1] !== "v1") {
    return false;
  }
  const N = Number(parts[2]);
  const r = Number(parts[3]);
  const p = Number(parts[4]);
  if (![N, r, p].every((n) => Number.isInteger(n) && n > 0)) return false;
  const salt = Buffer.from(parts[5], "base64");
  const expected = Buffer.from(parts[6], "base64");
  const actual = await scryptAsync(
    password.normalize("NFKC"),
    salt,
    expected.length,
    { N, r, p, maxmem: 128 * N * r * 2 },
  );
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * Hash palsu untuk menyamakan waktu respons ketika email tidak ditemukan,
 * sehingga login tidak membocorkan keberadaan akun lewat timing.
 */
let dummy: Promise<string> | null = null;
export function dummyHash(): Promise<string> {
  dummy ??= hashPassword("dummy-password-for-timing-equalization");
  return dummy;
}
