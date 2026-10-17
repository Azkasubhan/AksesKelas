import { randomUUID } from "node:crypto";
import type { DraftContentDto, SectionDto } from "@/shared/schemas/drafts-reader";

interface SourceBlockRef {
  id: string;
  ordinal: number;
  text: string;
}

/**
 * Menghasilkan adaptasi multi-modal terstruktur langsung dari blok sumber teks asli.
 * Menganalisis paragraf, membagi ke bagian-bagian topik, menghasilkan kalimat Easy Read,
 * kartu konsep (Focus Cards), dan mengekstrak istilah glosarium dari konten sumber.
 */
export function buildInitialAdaptation(
  title: string,
  blocks: SourceBlockRef[],
): DraftContentDto {
  if (blocks.length === 0) {
    return { schemaVersion: "1.0", sections: [] };
  }

  // Bagi blok menjadi 1 - 3 bagian proporsional
  const parts: SourceBlockRef[][] = [];
  if (blocks.length <= 2) {
    parts.push(blocks);
  } else if (blocks.length <= 8) {
    const mid = Math.ceil(blocks.length / 2);
    parts.push(blocks.slice(0, mid), blocks.slice(mid));
  } else {
    const chunkSize = Math.ceil(blocks.length / 3);
    parts.push(
      blocks.slice(0, chunkSize),
      blocks.slice(chunkSize, chunkSize * 2),
      blocks.slice(chunkSize * 2),
    );
  }

  const sections: SectionDto[] = parts.map((partBlocks, pIdx) => {
    const secId = randomUUID();
    const secRefs = partBlocks.map((b) => b.id);

    // Judul bagian diambil dari heading/baris pertama jika cocok, atau format Bagian N: Title
    const firstParagraph = partBlocks[0]?.text.trim() || "";
    const firstLine = firstParagraph.split("\n")[0].trim();
    let secTitle = `Bagian ${pIdx + 1}: ${title}`;
    if (firstLine.length > 4 && firstLine.length < 50 && !firstLine.endsWith(".")) {
      secTitle = `Bagian ${pIdx + 1}: ${firstLine}`;
    } else if (parts.length > 1 && pIdx > 0) {
      secTitle = `Bagian ${pIdx + 1}: Penjelasan Lanjutan ${title}`;
    }

    // Teks Standard bersumber dari blok teks asli
    const standard = partBlocks.map((b) => ({ text: b.text, sourceRefs: [b.id] }));

    // Easy Read: Kalimat ringkas dan sederhana dari teks sumber
    const easyRead: Array<{ text: string; sourceRefs: string[] }> = [];
    for (const b of partBlocks) {
      const sentences = b.text
        .replace(/\n+/g, " ")
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 15 && s.length < 180);

      for (const sent of sentences) {
        if (easyRead.length < 5) {
          easyRead.push({
            text: sent,
            sourceRefs: [b.id],
          });
        }
      }
    }

    if (easyRead.length === 0 && partBlocks[0]) {
      easyRead.push({
        text: partBlocks[0].text.slice(0, 150) + "...",
        sourceRefs: [partBlocks[0].id],
      });
    }

    // Kartu Konsep (Cards): Konsep utama berpasangan (originalText & easyText)
    const cards = [];
    const maxConceptCards = Math.min(partBlocks.length, 3);
    for (let cIdx = 0; cIdx < maxConceptCards; cIdx++) {
      const b = partBlocks[cIdx];
      const sentences = b.text
        .replace(/\n+/g, " ")
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10);

      const original = sentences.slice(0, 2).join(" ") || b.text.slice(0, 180);
      const simplified = sentences[0] || b.text.slice(0, 100);

      // Ambil judul kartu dari kata-kata awal
      const words = simplified.split(/\s+/).slice(0, 4).join(" ").replace(/[,.:;]+$/, "");
      const cardTitle = words.length > 3 ? words : `Konsep ${cIdx + 1}`;

      cards.push({
        id: randomUUID(),
        key: `card_${pIdx + 1}_${cIdx + 1}`,
        kind: "concept" as const,
        title: cardTitle,
        originalText: original,
        easyText: simplified,
        sourceRefs: [b.id],
      });
    }

    // Kartu Rekapitulasi (Recap Card)
    cards.push({
      id: randomUUID(),
      key: `card_${pIdx + 1}_recap`,
      kind: "recap" as const,
      title: `Poin Kunci Bagian ${pIdx + 1}`,
      originalText: `Materi pada bagian ini mencakup pemahaman penting terkait topik ${title}.`,
      easyText: `Poin utama: pelajari dan pahami gagasan di bagian ini sebelum melanjutkan membaca bagian berikutnya.`,
      sourceRefs: secRefs,
    });

    // Glosarium: Deteksi istilah penting berbasis pola teks (X: Y atau X adalah/merupakan Y)
    const glossary: Array<{ term: string; definition: string; sourceRefs: string[] }> = [];
    for (const b of partBlocks) {
      // 1. Pola "Istilah: Penjelasan"
      const colonMatches = b.text.matchAll(/([A-Z][a-zA-Z\s]{2,25}):\s+([^.\n]{10,120})/g);
      for (const m of colonMatches) {
        const term = m[1].trim();
        const def = m[2].trim();
        if (glossary.length < 4 && !glossary.some((g) => g.term.toLowerCase() === term.toLowerCase())) {
          glossary.push({
            term,
            definition: def.endsWith(".") ? def : `${def}.`,
            sourceRefs: [b.id],
          });
        }
      }

      // 2. Pola "Istilah adalah / merupakan / ialah ..."
      const defMatches = b.text.matchAll(/([A-Z][a-zA-Z\s]{2,25})\s+(adalah|merupakan|ialah)\s+([^.\n]{10,120})/g);
      for (const m of defMatches) {
        const term = m[1].trim();
        const def = `${m[2]} ${m[3].trim()}`;
        if (glossary.length < 4 && !glossary.some((g) => g.term.toLowerCase() === term.toLowerCase())) {
          glossary.push({
            term,
            definition: def.endsWith(".") ? def : `${def}.`,
            sourceRefs: [b.id],
          });
        }
      }
    }

    return {
      id: secId,
      key: `sec_${pIdx + 1}`,
      revision: 1,
      title: secTitle,
      sourceRefs: secRefs,
      standard,
      easyRead,
      cards,
      glossary,
      warnings: [],
    };
  });

  return {
    schemaVersion: "1.0",
    sections,
  };
}
