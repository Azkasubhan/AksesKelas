import { describe, expect, it } from "vitest";
import { parseRichText } from "@/shared/utils/rich-text";

describe("parseRichText", () => {
  it("memisahkan poin dan daftar bernomor yang tergabung dalam satu paragraf", () => {
    const text =
      "Memahami perjalanan air di alam. Tujuan pembelajaran • Menjelaskan perubahan wujud. • Membedakan infiltrasi, perkolasi, dan limpasan. • Menghubungkan aktivitas manusia. 1. Air terus bergerak di alam Air dapat ditemukan di laut. 2. Tahapan utama siklus air Penguapan (evaporasi). Panas Matahari menyebabkan air menguap.";
    const blocks = parseRichText(text);

    expect(blocks[0]).toEqual({
      type: "p",
      text: "Memahami perjalanan air di alam. Tujuan pembelajaran",
    });
    expect(blocks[1].type).toBe("ul");
    if (blocks[1].type === "ul") expect(blocks[1].items).toHaveLength(3);
    expect(blocks[2].type).toBe("ol");
    if (blocks[2].type === "ol") {
      expect(blocks[2].items).toHaveLength(2);
      expect(blocks[2].items[1].text).toContain("Tahapan utama siklus air");
    }
  });

  it("tidak salah mengenali angka biasa sebagai nomor daftar", () => {
    const blocks = parseRichText("Kurikulum berlaku sejak tahun 2016. Proses adaptasi berjalan.");
    expect(blocks).toEqual([
      { type: "p", text: "Kurikulum berlaku sejak tahun 2016. Proses adaptasi berjalan." },
    ]);
  });

  it("mengenali daftar per baris", () => {
    const blocks = parseRichText("Langkah:\n1. Siapkan alat\n2. Mulai percobaan\n3. Catat hasil");
    expect(blocks[1].type).toBe("ol");
    if (blocks[1].type === "ol") expect(blocks[1].items).toHaveLength(3);
  });
});
