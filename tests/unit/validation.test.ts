import { describe, it, expect } from "vitest";
import { validatePdfFile, isPdfMagicBytes, MAX_PDF_SIZE_BYTES } from "@/shared/schemas/files";
import {
  positiveIntSchema,
  pageNumberSchema,
  fontSizeSchema,
  speechRateSchema,
} from "@/shared/schemas/numbers";
import { validateWithSchema } from "@/lib/validation";
import { joinClassSchema, loginSchema } from "@/shared/schemas/auth-classes";

describe("Strict PDF File Validation (Anti-tamper / Anti-zip / Anti-docx)", () => {
  it("menerima berkas PDF yang valid", () => {
    const valid = validatePdfFile({
      name: "Sistem_Pencernaan_Bab4.pdf",
      size: 1024 * 500, // 500 KB
      type: "application/pdf",
    });
    expect(valid.valid).toBe(true);
    expect(valid.error).toBeUndefined();
  });

  it("menerima berkas PDF dengan huruf kapital pada ekstensi (.PDF)", () => {
    const valid = validatePdfFile({
      name: "MATERI_IPA.PDF",
      size: 1024 * 1024,
      type: "application/pdf",
    });
    expect(valid.valid).toBe(true);
  });

  it("menolak keras berkas arsip seperti .zip atau .tar", () => {
    const zip = validatePdfFile({
      name: "dokumen_tugas.zip",
      size: 1024 * 100,
      type: "application/zip",
    });
    expect(zip.valid).toBe(false);
    expect(zip.error).toContain(".zip");
    expect(zip.error).toContain("Hanya dokumen PDF (.pdf) yang diperbolehkan");
  });

  it("menolak keras berkas Word/Docx", () => {
    const docx = validatePdfFile({
      name: "Rencana_Pelaksanaan_Pembelajaran.docx",
      size: 1024 * 200,
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    expect(docx.valid).toBe(false);
    expect(docx.error).toContain(".docx");
  });

  it("menolak berkas tanpa ekstensi", () => {
    const noExt = validatePdfFile({
      name: "dokumen_tanpa_ekstensi",
      size: 1024,
      type: "application/pdf",
    });
    expect(noExt.valid).toBe(false);
    expect(noExt.error).toContain("tidak memiliki ekstensi");
  });

  it("menolak berkas berukuran 0 byte", () => {
    const empty = validatePdfFile({
      name: "kosong.pdf",
      size: 0,
      type: "application/pdf",
    });
    expect(empty.valid).toBe(false);
    expect(empty.error).toContain("0 byte");
  });

  it("menolak berkas yang melebihi batas 20 MB", () => {
    const oversized = validatePdfFile({
      name: "buku_sangat_besar.pdf",
      size: MAX_PDF_SIZE_BYTES + 1024,
      type: "application/pdf",
    });
    expect(oversized.valid).toBe(false);
    expect(oversized.error).toContain("terlalu besar");
  });

  it("memverifikasi header magic bytes %PDF secara biner", () => {
    // %PDF-1.7
    const validPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
    expect(isPdfMagicBytes(validPdfBytes)).toBe(true);

    // PK.. (ZIP / DOCX file header)
    const zipBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
    expect(isPdfMagicBytes(zipBytes)).toBe(false);

    // PNG header
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    expect(isPdfMagicBytes(pngBytes)).toBe(false);
  });
});

describe("Strict Numeric Validation", () => {
  it("memvalidasi skema angka bulat positif dan menolak string huruf / NaN", () => {
    expect(positiveIntSchema.safeParse(5).success).toBe(true);
    expect(positiveIntSchema.safeParse("10").success).toBe(true);

    // Menolak string huruf
    const nonNumeric = positiveIntSchema.safeParse("abc");
    expect(nonNumeric.success).toBe(false);

    // Menolak desimal
    const decimal = positiveIntSchema.safeParse(3.14);
    expect(decimal.success).toBe(false);

    // Menolak 0 atau negatif
    expect(positiveIntSchema.safeParse(0).success).toBe(false);
    expect(positiveIntSchema.safeParse(-2).success).toBe(false);
  });

  it("memvalidasi nomor halaman dalam rentang 1 - 9999", () => {
    expect(pageNumberSchema.safeParse(1).success).toBe(true);
    expect(pageNumberSchema.safeParse(42).success).toBe(true);
    expect(pageNumberSchema.safeParse(0).success).toBe(false);
    expect(pageNumberSchema.safeParse(10000).success).toBe(false);
    expect(pageNumberSchema.safeParse("xyz").success).toBe(false);
  });

  it("memvalidasi ukuran font pembaca (12px - 36px)", () => {
    expect(fontSizeSchema.safeParse(16).success).toBe(true);
    expect(fontSizeSchema.safeParse(36).success).toBe(true);
    expect(fontSizeSchema.safeParse(11).success).toBe(false);
    expect(fontSizeSchema.safeParse(40).success).toBe(false);
  });

  it("memvalidasi kecepatan suara (0.5x - 2.0x)", () => {
    expect(speechRateSchema.safeParse(1.0).success).toBe(true);
    expect(speechRateSchema.safeParse(1.5).success).toBe(true);
    expect(speechRateSchema.safeParse(0.3).success).toBe(false);
    expect(speechRateSchema.safeParse(2.5).success).toBe(false);
  });
});

describe("Clean Client-Side Schema Validation Utility", () => {
  it("mengembalikan data sukses jika valid", () => {
    const result = validateWithSchema(loginSchema, {
      email: "guru@sekolah.id",
      password: "password123456",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("guru@sekolah.id");
    }
  });

  it("mengembalikan pesan error terstruktur jika tidak valid", () => {
    const result = validateWithSchema(loginSchema, {
      email: "bukan-email",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.email).toBeDefined();
      expect(result.fieldErrors.password).toBeDefined();
    }
  });

  it("memvalidasi kode akses kelas 12 karakter alfanumerik", () => {
    const valid = validateWithSchema(joinClassSchema, {
      code: "ZDNQ-GEZH-31JA",
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.code).toBe("ZDNQGEZH31JA");
    }

    const invalidShort = validateWithSchema(joinClassSchema, {
      code: "ABC",
    });
    expect(invalidShort.success).toBe(false);
  });
});
