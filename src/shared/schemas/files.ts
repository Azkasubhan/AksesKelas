import { z } from "zod";

export const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validasi ketat berkas PDF di sisi klien dan server.
 * Mencegah pengunggahan berkas berbahaya atau tidak didukung seperti .zip, .docx, .exe, gambar, dll.
 */
export function validatePdfFile(file: {
  name: string;
  size: number;
  type?: string;
}): FileValidationResult {
  // 1. Validasi nama dan ekstensi berkas
  if (!file.name || typeof file.name !== "string") {
    return { valid: false, error: "Nama berkas tidak valid" };
  }

  const cleanName = file.name.trim();
  const lastDot = cleanName.lastIndexOf(".");
  if (lastDot === -1 || lastDot === cleanName.length - 1) {
    return {
      valid: false,
      error: "Berkas tidak memiliki ekstensi. Hanya berkas PDF (.pdf) yang diperbolehkan.",
    };
  }

  const ext = cleanName.substring(lastDot).toLowerCase();
  if (ext !== ".pdf") {
    return {
      valid: false,
      error: `Format berkas "${ext}" ditolak. Hanya dokumen PDF (.pdf) yang diperbolehkan. Berkas seperti .zip, .docx, atau format lainnya tidak didukung.`,
    };
  }

  // 2. Validasi MIME Type jika tersedia
  if (file.type) {
    const mime = file.type.toLowerCase().trim();
    const allowedMimes = ["application/pdf", "application/x-pdf"];
    if (mime && !allowedMimes.includes(mime)) {
      return {
        valid: false,
        error: `Tipe konten "${mime}" tidak valid. Hanya berkas dokumen PDF yang didukung.`,
      };
    }
  }

  // 3. Validasi ukuran berkas
  if (file.size <= 0) {
    return { valid: false, error: "Berkas kosong (ukuran 0 byte)" };
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Ukuran berkas terlalu besar (${sizeMb} MB). Maksimal ukuran PDF adalah 20 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Memeriksa header magic bytes berkas apakah benar-benar PDF (%PDF).
 * Standar verifikasi zero-trust untuk berkas biner.
 */
export function isPdfMagicBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  // %PDF -> 0x25, 0x50, 0x44, 0x46
  return (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  );
}

/**
 * Zod schema untuk metadata berkas PDF
 */
export const pdfMetadataSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama berkas wajib diisi")
    .max(255, "Nama berkas terlalu panjang")
    .refine(
      (name) => name.toLowerCase().endsWith(".pdf"),
      "Berkas harus memiliki ekstensi .pdf",
    ),
  size: z
    .number()
    .int("Ukuran berkas harus berupa bilangan bulat")
    .positive("Ukuran berkas harus lebih dari 0")
    .max(MAX_PDF_SIZE_BYTES, "Ukuran berkas maksimal 20 MB"),
  type: z
    .string()
    .optional()
    .refine(
      (type) => !type || ["application/pdf", "application/x-pdf"].includes(type.toLowerCase()),
      "Tipe MIME harus application/pdf",
    ),
});
