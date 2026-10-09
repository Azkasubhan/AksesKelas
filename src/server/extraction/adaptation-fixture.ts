import { randomUUID } from "node:crypto";
import type { DraftContentDto, SectionDto } from "@/shared/schemas/drafts-reader";

interface SourceBlockRef {
  id: string;
  ordinal: number;
  text: string;
}

/**
 * Menghasilkan struktur adaptasi multi-modal awal (Milestone 2 fixture generator).
 * Memecah materi menjadi bagian-bagian terstruktur dengan:
 * - Teks Standard
 * - Teks Easy Read
 * - Paired Focus Cards (originalText & easyText)
 * - Glosarium istilah sulit
 */
export function buildInitialAdaptation(
  title: string,
  blocks: SourceBlockRef[],
): DraftContentDto {
  // Jika blok lebih dari 4, pecah menjadi 2 bagian untuk pengalaman adaptasi yang realistis
  const midPoint = Math.ceil(blocks.length / 2);
  const part1Blocks = blocks.slice(0, midPoint);
  const part2Blocks = blocks.slice(midPoint);

  const sections: SectionDto[] = [];

  // Bagian 1
  if (part1Blocks.length > 0) {
    const sec1Id = randomUUID();
    const sec1Refs = part1Blocks.map((b) => b.id);

    sections.push({
      id: sec1Id,
      key: "sec_1",
      revision: 1,
      title: blocks.length > 3 ? "Bagian 1: Kerongkongan dan Gerak Peristaltik" : title,
      sourceRefs: sec1Refs,
      standard: part1Blocks.map((b) => ({ text: b.text, sourceRefs: [b.id] })),
      easyRead: [
        {
          text: "Setelah dikunyah di mulut, makanan berubah menjadi gumpalan lembut bernama bolus.",
          sourceRefs: [part1Blocks[0].id],
        },
        {
          text: "Kerongkongan adalah saluran otot yang menyambungkan mulut ke lambung.",
          sourceRefs: [part1Blocks[0].id],
        },
        {
          text: "Otot kerongkongan meremas dan mendorong makanan secara bergelombang. Gerakan ini dinamakan gerak peristaltik.",
          sourceRefs: part1Blocks[1] ? [part1Blocks[1].id] : [part1Blocks[0].id],
        },
        {
          text: "Pintu klep di ujung bawah kerongkongan menjaga agar makanan dan asam tidak naik kembali ke atas.",
          sourceRefs: part1Blocks[2] ? [part1Blocks[2].id] : [part1Blocks[0].id],
        },
      ],
      cards: [
        {
          id: randomUUID(),
          key: "card_1_bolus",
          kind: "concept",
          title: "Dari Mulut ke Kerongkongan",
          originalText:
            "Makanan yang telah dikunyah dan bercampur air liur membentuk bolus, lalu ditelan masuk ke kerongkongan (saluran tabung berotot sepanjang ±25 cm).",
          easyText:
            "Makanan yang sudah dikunyah menjadi gumpalan lembut (bolus). Gumpalan ini lalu ditelan ke kerongkongan.",
          sourceRefs: [part1Blocks[0].id],
        },
        {
          id: randomUUID(),
          key: "card_1_peristaltik",
          kind: "concept",
          title: "Gerak Peristaltik Otot",
          originalText:
            "Dinding otot kerongkongan berkontraksi dan berelaksasi secara bergelombang (gerak peristaltik) untuk mendorong makanan menuju lambung secara aktif.",
          easyText:
            "Otot kerongkongan meremas dan bergerak seperti gelombang untuk mendorong makanan ke bawah menuju lambung.",
          sourceRefs: part1Blocks[1] ? [part1Blocks[1].id] : [part1Blocks[0].id],
        },
        {
          id: randomUUID(),
          key: "card_1_recap",
          kind: "recap",
          title: "Poin Kunci Bagian 1",
          originalText:
            "Makanan didorong oleh gerak peristaltik kerongkongan melewati pintu klep sfingter menuju organ lambung.",
          easyText:
            "Kerongkongan mendorong makanan ke lambung dengan gerakan otot teratur.",
          sourceRefs: sec1Refs,
        },
      ],
      glossary: [
        {
          term: "Bolus",
          definition: "Gumpalan makanan lunak hasil kunyahan di dalam mulut yang siap ditelan.",
          sourceRefs: [part1Blocks[0].id],
        },
        {
          term: "Gerak Peristaltik",
          definition:
            "Gerakan memijat dan meremas yang dilakukan dinding otot saluran pencernaan untuk mendorong makanan.",
          sourceRefs: part1Blocks[1] ? [part1Blocks[1].id] : [part1Blocks[0].id],
        },
        {
          term: "Sfingter",
          definition: "Otot cincin yang berfungsi sebagai klep atau pintu buka-tutup satu arah.",
          sourceRefs: part1Blocks[2] ? [part1Blocks[2].id] : [part1Blocks[0].id],
        },
      ],
      warnings: [],
    });
  }

  // Bagian 2 (jika materi memiliki blok lanjutan)
  if (part2Blocks.length > 0) {
    const sec2Id = randomUUID();
    const sec2Refs = part2Blocks.map((b) => b.id);

    sections.push({
      id: sec2Id,
      key: "sec_2",
      revision: 1,
      title: "Bagian 2: Fungsi Lambung dan Enzim Pencernaan",
      sourceRefs: sec2Refs,
      standard: part2Blocks.map((b) => ({ text: b.text, sourceRefs: [b.id] })),
      easyRead: [
        {
          text: "Lambung adalah kantung berotot di perut sebelah kiri yang menyerupai bentuk huruf J.",
          sourceRefs: [part2Blocks[0].id],
        },
        {
          text: "Di dalam lambung terjadi dua cara pencernaan: remasan otot (mekanik) dan bantuan zat kimia (kimiawi).",
          sourceRefs: [part2Blocks[0].id],
        },
        {
          text: "Makanan diaduk sampai menjadi bubur kental bernama kimus.",
          sourceRefs: part2Blocks[1] ? [part2Blocks[1].id] : [part2Blocks[0].id],
        },
        {
          text: "Cairan lambung berisi asam pembunuh kuman dan enzim pepsin pemecah zat protein.",
          sourceRefs: part2Blocks[2] ? [part2Blocks[2].id] : [part2Blocks[0].id],
        },
      ],
      cards: [
        {
          id: randomUUID(),
          key: "card_2_lambung",
          kind: "concept",
          title: "Organ Lambung",
          originalText:
            "Lambung adalah kantung berotot tebal menyerupai huruf J di rongga perut kiri atas tempat berlangsungnya pencernaan mekanik dan kimiawi.",
          easyText:
            "Lambung berbentuk seperti huruf J di perut kiri atas. Lambung bertugas mengolah makanan.",
          sourceRefs: [part2Blocks[0].id],
        },
        {
          id: randomUUID(),
          key: "card_2_kimus",
          kind: "concept",
          title: "Pencernaan Mekanik & Kimus",
          originalText:
            "Lapisan otot polos lambung mengaduk dan meremas bolus makanan selama 2–4 jam hingga menjadi bubur kental yang dinamakan kimus (chyme).",
          easyText:
            "Otot lambung meremas makanan sampai lembut seperti bubur. Bubur ini disebut kimus.",
          sourceRefs: part2Blocks[1] ? [part2Blocks[1].id] : [part2Blocks[0].id],
        },
        {
          id: randomUUID(),
          key: "card_2_getah",
          kind: "concept",
          title: "Asam Lambung & Enzim Pepsin",
          originalText:
            "Getah lambung menghasilkan Asam Klorida (HCl) untuk membasmi kuman, enzim pepsin untuk mengurai protein, dan lendir pelindung mukus.",
          easyText:
            "Cairan lambung sangat asam untuk membunuh kuman. Enzim di lambung membantu mencerna zat protein dari makanan.",
          sourceRefs: part2Blocks[2] ? [part2Blocks[2].id] : [part2Blocks[0].id],
        },
        {
          id: randomUUID(),
          key: "card_2_recap",
          kind: "recap",
          title: "Poin Kunci Bagian 2",
          originalText:
            "Lambung mencerna makanan secara mekanik dan kimiawi menjadi kimus sebelum disalurkan ke usus dua belas jari.",
          easyText:
            "Lambung menghaluskan makanan menjadi bubur kental dengan asam dan enzim sebelum diteruskan ke usus.",
          sourceRefs: sec2Refs,
        },
      ],
      glossary: [
        {
          term: "Kimus (Chyme)",
          definition: "Bentuk makanan yang sudah dilumatkan menjadi bubur kental di dalam lambung.",
          sourceRefs: part2Blocks[1] ? [part2Blocks[1].id] : [part2Blocks[0].id],
        },
        {
          term: "Asam Klorida (HCl)",
          definition:
            "Cairan asam kuat di lambung yang membunuh kuman penyakit pada makanan.",
          sourceRefs: part2Blocks[2] ? [part2Blocks[2].id] : [part2Blocks[0].id],
        },
        {
          term: "Pepsin",
          definition: "Enzim di lambung yang memecah molekul protein menjadi bentuk lebih sederhana.",
          sourceRefs: part2Blocks[2] ? [part2Blocks[2].id] : [part2Blocks[0].id],
        },
      ],
      warnings: [],
    });
  }

  return {
    schemaVersion: "1.0",
    sections,
  };
}
