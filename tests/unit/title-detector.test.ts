import { describe, it, expect } from "vitest";
import {
  detectTitleAndSubject,
  cleanPageRunningHeaders,
} from "@/shared/utils/title-detector";

describe("Title & Subject Auto Detector", () => {
  it("mendeteksi judul dan mapel dari dokumen modul uji adaptasi (sampel PDF riil)", () => {
    const raw = `AKSESKELAS / MATERI IPA SMP MODUL UJI ADAPTASI MATERI Siklus Air dan Ketersediaan Air Bersih 1 / 3
MATERI PEMBELAJARAN | IPA KELAS VII
Siklus Air dan
Ketersediaan Air Bersih
Memahami perjalanan air di alam, hubungan antara air permukaan dan air tanah, serta tindakan untuk menjaga ketersediaan air bersih. Pertanyaan pemantik. Mengapa suatu daerah dapat mengalami banjir ketika hujan deras, tetapi kekurangan air bersih pada musim kemarau?`;

    const res = detectTitleAndSubject(raw);
    expect(res.title).toBe("Siklus Air dan Ketersediaan Air Bersih");
    expect(res.subject).toBe("IPA KELAS VII");
    expect(res.cleanedText.startsWith("Memahami perjalanan air di alam")).toBe(true);
    expect(res.cleanedText).not.toContain("AKSESKELAS");
    expect(res.cleanedText).not.toContain("MATERI PEMBELAJARAN");
  });

  it("mendeteksi format Markdown `# Judul` dan `Mata Pelajaran: ...`", () => {
    const raw = `# Struktur Bumi dan Lempeng Tektonik
Mata Pelajaran: IPA Terpadu Kelas 8
Bumi tempat kita berpijak memiliki lapisan-lapisan yang dinamis dan terus bergerak...`;

    const res = detectTitleAndSubject(raw);
    expect(res.title).toBe("Struktur Bumi dan Lempeng Tektonik");
    expect(res.subject).toBe("IPA Terpadu Kelas 8");
    expect(res.cleanedText.startsWith("Bumi tempat kita berpijak")).toBe(true);
  });

  it("mendeteksi format BAB dan mapel dengan huruf kapital", () => {
    const raw = `BAB 4: SISTEM PENCERNAAN PADA MANUSIA
Biologi X
Organ-organ pencernaan pada manusia bekerja sama secara mekanis dan kimiawi...`;

    const res = detectTitleAndSubject(raw);
    expect(res.title).toBe("Sistem Pencernaan Pada Manusia");
    expect(res.subject).toBe("Biologi X");
    expect(res.cleanedText.startsWith("Organ-organ pencernaan")).toBe(true);
  });

  it("mempertahankan teks utuh jika input sudah berupa paragraf isi tanpa header", () => {
    const raw = `Air terus bergerak di alam dalam siklus hidrologi yang tidak pernah berhenti. Matahari memanaskan air di laut, sungai, dan danau sehingga menguap ke atmosfer.`;

    const res = detectTitleAndSubject(raw);
    expect(res.title).toBeNull();
    expect(res.subject).toBeNull();
    expect(res.cleanedText).toBe(raw);
  });

  it("membersihkan running header halaman kedua PDF", () => {
    const page2Raw = `AKSESKELAS / MATERI IPA SMP MODUL UJI ADAPTASI MATERI Siklus Air dan Ketersediaan Air Bersih 2 / 3
Air tanah merupakan salah satu sumber air bersih yang sangat penting bagi kehidupan manusia.`;

    const cleaned = cleanPageRunningHeaders(page2Raw, 2, "Siklus Air dan Ketersediaan Air Bersih");
    expect(cleaned).toBe("Air tanah merupakan salah satu sumber air bersih yang sangat penting bagi kehidupan manusia.");
  });
});
