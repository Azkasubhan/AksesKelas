import "server-only";
import { createHash } from "node:crypto";
import { extractText, getDocumentProxy } from "unpdf";
import { Errors } from "@/server/errors";
import { MAX_PDF_PAGES, MAX_TEXT_CHARS } from "@/shared/schemas/materials";

export interface ParsedBlock {
  text: string;
  pageNumber: number | null;
}

export interface ExtractionResult {
  blocks: ParsedBlock[];
  pageCount: number;
  totalChars: number;
  sha256: string;
}

/**
 * Normalisasi teks sumber tanpa menghilangkan angka, tanda baca, satuan ilmiah, atau list format.
 */
export function normalizeSourceText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Bersihkan karakter kontrol non-printable kecuali newline & tab
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Hapus spasi berlebih di akhir baris
    .replace(/[ \t]+$/gm, "")
    .trim();
}

/**
 * Menghitung digest SHA-256 untuk idempotency dan verifikasi integritas sumber.
 */
export function computeSha256(content: string | Buffer | Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Memecah teks satu halaman menjadi source blocks berurutan berbasis paragraf.
 */
export function splitParagraphsIntoBlocks(
  text: string,
  pageNumber: number | null = 1,
): ParsedBlock[] {
  const normalized = normalizeSourceText(text);
  if (!normalized) return [];

  // Pisahkan berdasarkan paragraf kosong ganda
  const rawParagraphs = normalized.split(/\n\s*\n+/);
  const blocks: ParsedBlock[] = [];

  for (const para of rawParagraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Jika satu paragraf sangat panjang (> 2000 karakter), pecah berdasarkan kalimat untuk kemudahan navigasi
    if (trimmed.length > 2000) {
      const sentences = trimmed.split(/(?<=[.!?])\s+(?=[A-Z0-9])/);
      let currentChunk = "";

      for (const sent of sentences) {
        if ((currentChunk + " " + sent).length > 1500 && currentChunk.length > 0) {
          blocks.push({ text: currentChunk.trim(), pageNumber });
          currentChunk = sent;
        } else {
          currentChunk = currentChunk ? `${currentChunk} ${sent}` : sent;
        }
      }
      if (currentChunk.trim().length > 0) {
        blocks.push({ text: currentChunk.trim(), pageNumber });
      }
    } else {
      blocks.push({ text: trimmed, pageNumber });
    }
  }

  return blocks;
}

/**
 * Ekstraksi teks dari PDF dengan pemetaan nomor halaman yang akurat.
 * Sesuai PRD FR-03: ekstraksi server-side, verifikasi halaman <= 30, deteksi PDF scan/kosong.
 */
export async function extractPdfSource(
  buffer: Uint8Array | ArrayBuffer,
): Promise<ExtractionResult> {
  const sha256 = computeSha256(
    Buffer.isBuffer(buffer) ? buffer : Buffer.from(new Uint8Array(buffer)),
  );

  let pdfDoc;
  try {
    pdfDoc = await getDocumentProxy(new Uint8Array(buffer));
  } catch {
    throw Errors.unprocessable(
      "Berkas PDF tidak dapat dibuka atau terenkripsi dengan kata sandi. Pastikan berkas PDF Anda tidak terkunci.",
    );
  }

  const pageCount = pdfDoc.numPages;
  if (pageCount <= 0) {
    throw Errors.unprocessable("Dokumen PDF tidak memiliki halaman.");
  }

  if (pageCount > MAX_PDF_PAGES) {
    throw Errors.badRequest(
      `Dokumen PDF memiliki ${pageCount} halaman. Batas maksimal untuk satu materi adalah ${MAX_PDF_PAGES} halaman.`,
    );
  }

  const { text: pagesText } = await extractText(pdfDoc, { mergePages: false });
  const allBlocks: ParsedBlock[] = [];
  let totalLength = 0;

  for (let i = 0; i < pagesText.length; i++) {
    const pageNum = i + 1;
    const pageContent = pagesText[i] || "";
    totalLength += pageContent.trim().length;

    const pageBlocks = splitParagraphsIntoBlocks(pageContent, pageNum);
    allBlocks.push(...pageBlocks);
  }

  // Jika teks hasil ekstraksi hampir kosong (kemungkinan besar PDF berupa scan gambar)
  if (totalLength < 50 || allBlocks.length === 0) {
    throw Errors.unprocessable(
      "Teks belum dapat dibaca dari dokumen PDF ini (kemungkinan berupa pindaian/scan gambar tanpa lapisan teks). Silakan gunakan PDF berbasis teks atau tempelkan materi langsung.",
    );
  }

  if (totalLength > MAX_TEXT_CHARS) {
    throw Errors.badRequest(
      `Total panjang teks hasil ekstraksi (${totalLength} karakter) melebihi batas maksimal ${MAX_TEXT_CHARS} karakter. Silakan unggah bab materi yang lebih ringkas.`,
    );
  }

  return {
    blocks: allBlocks,
    pageCount,
    totalChars: totalLength,
    sha256,
  };
}

/**
 * Ekstraksi dari teks yang ditempel langsung oleh guru.
 */
export function extractTextSource(rawText: string): ExtractionResult {
  const normalized = normalizeSourceText(rawText);
  const blocks = splitParagraphsIntoBlocks(normalized, 1);
  const sha256 = computeSha256(normalized);

  return {
    blocks,
    pageCount: 1,
    totalChars: normalized.length,
    sha256,
  };
}
