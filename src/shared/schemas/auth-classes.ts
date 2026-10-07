import { z } from "zod";

/** Skema bersama klien + server (validasi form dan body API). */
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email wajib diisi")
  .max(254, "Email terlalu panjang")
  .pipe(z.email("Format email belum benar"))
  .transform((v) => v.toLowerCase());

export const passwordSchema = z
  .string()
  .min(12, "Kata sandi minimal 12 karakter")
  .max(200, "Kata sandi terlalu panjang");

export const signupSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(80, "Nama maksimal 80 karakter"),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["teacher", "student"], { error: "Pilih peran Anda" }),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Kata sandi wajib diisi").max(200),
});

export const createClassSchema = z.object({
  name: z.string().trim().min(2, "Nama kelas minimal 2 karakter").max(80, "Nama kelas maksimal 80 karakter"),
  description: z
    .string()
    .trim()
    .max(300, "Deskripsi maksimal 300 karakter")
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export const updateClassSchema = createClassSchema.partial();

export const joinClassSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Masukkan kode kelas")
    .max(32)
    .transform((v) => v.replace(/[\s-]/g, "").toUpperCase()),
});

export type SignupInput = z.input<typeof signupSchema>;
export type LoginInput = z.input<typeof loginSchema>;
export type CreateClassInput = z.input<typeof createClassSchema>;
export type JoinClassInput = z.input<typeof joinClassSchema>;

/** Tampilan kode berkelompok (ABCD-EFGH-JKMN); kode tersimpan tanpa tanda hubung. */
export function formatJoinCode(code: string): string {
  return code.match(/.{1,4}/g)?.join("-") ?? code;
}
