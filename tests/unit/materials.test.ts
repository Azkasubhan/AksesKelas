import { describe, it, expect } from "vitest";
import {
  normalizeSourceText,
  splitParagraphsIntoBlocks,
  computeSha256,
} from "@/server/extraction/source-blocks";
import { createMaterialSchema } from "@/shared/schemas/materials";
import { DEMO_MATERIAL_FIXTURE } from "../../fixtures/demo/sistem-pencernaan";

describe("Source Extraction & Block Normalizer", () => {
  it("membersihkan teks kontrol tanpa merusak tanda baca, satuan ilmiah, dan angka", () => {
    const raw = "Sistem lambung memiliki pH 1,5 hingga 2,5.\r\nPanjangnya sekitar 25 cm.\x00\x08";
    const normalized = normalizeSourceText(raw);
    expect(normalized).toBe(
      "Sistem lambung memiliki pH 1,5 hingga 2,5.\nPanjangnya sekitar 25 cm.",
    );
  });

  it("memecah paragraf menjadi source blocks berurutan dengan ordinal dan nomor halaman", () => {
    const sample = `Paragraf pertama tentang bolus makanan.

Paragraf kedua tentang lambung dan enzim pepsin.

Paragraf ketiga tentang gerak peristaltik esofagus.`;

    const blocks = splitParagraphsIntoBlocks(sample, 1);
    expect(blocks.length).toBe(3);
    expect(blocks[0].text).toContain("bolus makanan");
    expect(blocks[0].pageNumber).toBe(1);
    expect(blocks[1].text).toContain("lambung dan enzim pepsin");
    expect(blocks[2].text).toContain("gerak peristaltik esofagus");
  });

  it("menghitung hash SHA-256 yang deterministik", () => {
    const hash1 = computeSha256("Halo AksesKelas");
    const hash2 = computeSha256("Halo AksesKelas");
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });
});

describe("Create Material Schema Validation", () => {
  it("menerima fixture materi resmi Sistem Pencernaan", () => {
    const parsed = createMaterialSchema.safeParse(DEMO_MATERIAL_FIXTURE);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBe(DEMO_MATERIAL_FIXTURE.title);
      expect(parsed.data.consent).toBe(true);
    }
  });

  it("menolak jika persetujuan izin (consent) belum dicentang", () => {
    const noConsent = createMaterialSchema.safeParse({
      ...DEMO_MATERIAL_FIXTURE,
      consent: false,
    });
    expect(noConsent.success).toBe(false);
  });

  it("menolak teks materi yang terlalu pendek (< 200 karakter)", () => {
    const tooShort = createMaterialSchema.safeParse({
      title: "Materi Singkat",
      subject: "Biologi",
      inputType: "text",
      text: "Hanya satu kalimat pendek saja.",
      consent: true,
    });
    expect(tooShort.success).toBe(false);
  });

  it("menolak judul materi yang terlalu pendek (< 3 karakter)", () => {
    const invalidTitle = createMaterialSchema.safeParse({
      ...DEMO_MATERIAL_FIXTURE,
      title: "AB",
    });
    expect(invalidTitle.success).toBe(false);
  });
});
