import { describe, expect, it } from "vitest";
import { parseRichText } from "@/shared/utils/rich-text";

describe("parseRichText", () => {
  it("mengenali sub-topik bernomor dan daftar poin pada Bagian 1", () => {
    const text =
      "Memahami perjalanan air di alam. Tujuan pembelajaran • Menjelaskan perubahan wujud. • Membedakan infiltrasi, perkolasi, dan limpasan. • Menghubungkan aktivitas manusia. 1. Air terus bergerak di alam Air dapat ditemukan di laut, danau, sungai. 2. Tahapan utama siklus air Penguapan (evaporasi). Panas Matahari menyebabkan air menguap.";
    const blocks = parseRichText(text);

    expect(blocks[0].type).toBe("p");
    expect(blocks[1].type).toBe("ul");

    const sub1 = blocks.find((b) => b.type === "sub-topic" && b.num === 1);
    expect(sub1).toBeDefined();
    if (sub1 && sub1.type === "sub-topic") {
      expect(sub1.title).toContain("Air terus bergerak");
      expect(sub1.body).toContain("Air dapat ditemukan di laut");
    }

    const sub2 = blocks.find((b) => b.type === "sub-topic" && b.num === 2);
    expect(sub2).toBeDefined();
    if (sub2 && sub2.type === "sub-topic") {
      expect(sub2.title).toContain("Tahapan utama siklus air");
      expect(sub2.body).toContain("Penguapan");
    }
  });

  it("mengenali section banner dan penomoran 3, 4, 5 pada Bagian 2", () => {
    const text =
      "BAGIAN 2 / PERPINDAHAN DAN PENYIMPANAN AIR 3. Ke mana air hujan pergi? Setelah mencapai permukaan Bumi, air hujan dapat mengikuti beberapa jalur. 4. Mengapa jenis permukaan berpengaruh? Jenis permukaan menentukan kecepatan infiltrasi. 5. Hubungan siklus air, banjir, dan kemarau Ketika limpasan permukaan meningkat lebih cepat...";
    const blocks = parseRichText(text);

    // Section banner
    expect(blocks[0]).toEqual({
      type: "section-banner",
      tag: "BAGIAN 2",
      title: "Perpindahan Dan Penyimpanan Air",
    });

    // Sub-topik 3
    const sub3 = blocks.find((b) => b.type === "sub-topic" && b.num === 3);
    expect(sub3).toBeDefined();
    if (sub3 && sub3.type === "sub-topic") {
      expect(sub3.title).toBe("Ke mana air hujan pergi?");
      expect(sub3.body).toContain("Setelah mencapai permukaan Bumi");
    }

    // Sub-topik 4
    const sub4 = blocks.find((b) => b.type === "sub-topic" && b.num === 4);
    expect(sub4).toBeDefined();
    if (sub4 && sub4.type === "sub-topic") {
      expect(sub4.title).toBe("Mengapa jenis permukaan berpengaruh?");
    }

    // Sub-topik 5
    const sub5 = blocks.find((b) => b.type === "sub-topic" && b.num === 5);
    expect(sub5).toBeDefined();
    if (sub5 && sub5.type === "sub-topic") {
      expect(sub5.title).toBe("Hubungan siklus air, banjir, dan kemarau");
    }
  });

  it("mengenali kotak contoh lingkungan (Callout)", () => {
    const text =
      "Contoh lingkungan: Dua halaman sekolah menerima hujan yang sama. Halaman A memiliki taman terbuka, sedangkan halaman B seluruhnya beton.";
    const blocks = parseRichText(text);

    expect(blocks[0]).toEqual({
      type: "callout",
      label: "Contoh Lingkungan",
      text: "Dua halaman sekolah menerima hujan yang sama. Halaman A memiliki taman terbuka, sedangkan halaman B seluruhnya beton.",
      variant: "example",
    });
  });

  it("mengenali keterangan tabel", () => {
    const text =
      "Tabel 1. Perbandingan umum perilaku air hujan pada dua jenis permukaan. Hasil nyata bergantung pada kondisi setempat.";
    const blocks = parseRichText(text);

    expect(blocks[0].type).toBe("table-note");
  });

  it("mengenali sub-topik 5, keterangan tabel, dan callout yang tersambung dalam satu paragraf", () => {
    const text =
      "Genangan meningkat jika drainase tidak memadai. Tabel 1. Perbandingan umum perilaku air hujan pada dua jenis permukaan. Hasil nyata bergantung pada kondisi setempat. 5. Hubungan siklus air, banjir, dan kemarau Ketika limpasan permukaan meningkat lebih cepat daripada kemampuan sungai atau saluran menampungnya, genangan dan banjir dapat terjadi. Sebaliknya, jika air hujan yang meresap terlalu sedikit, pengisian kembali cadangan air tanah dapat berkurang. Contoh lingkungan: Dua halaman sekolah menerima hujan yang sama. Halaman A memiliki taman terbuka.";
    const blocks = parseRichText(text);

    expect(blocks[0]).toEqual({
      type: "p",
      text: "Genangan meningkat jika drainase tidak memadai.",
    });

    expect(blocks[1].type).toBe("table-note");

    const sub5 = blocks.find((b) => b.type === "sub-topic" && b.num === 5);
    expect(sub5).toBeDefined();
    if (sub5 && sub5.type === "sub-topic") {
      expect(sub5.title).toBe("Hubungan siklus air, banjir, dan kemarau");
      expect(sub5.body).toContain("Ketika limpasan permukaan meningkat");
    }

    const callout = blocks.find((b) => b.type === "callout");
    expect(callout).toBeDefined();
    if (callout && callout.type === "callout") {
      expect(callout.label).toBe("Contoh Lingkungan");
      expect(callout.text).toContain("Dua halaman sekolah menerima hujan");
    }
  });
});
