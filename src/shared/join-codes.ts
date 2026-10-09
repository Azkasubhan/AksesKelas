import { randomInt } from "node:crypto";

/** Alfabet base32 Crockford (tanpa I, L, O, U) agar kode kelas mudah dibaca siswa dan guru. */
export const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const CODE_LENGTH = 12; // 60 bit entropi sesuai PRD FR-02

export function generateJoinCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}
