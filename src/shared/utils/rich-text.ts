/**
 * Parser struktur teks dokumen pembelajaran Indonesia (Kurikulum Merdeka / 2013).
 * Mengenali:
 * 1. Banner Bagian / Bab (misal: "BAGIAN 2 / PERPINDAHAN DAN PENYIMPANAN AIR")
 * 2. Kotak Catatan / Contoh / Pemantik (misal: "Contoh lingkungan: ...", "Pertanyaan pemantik: ...")
 * 3. Sub-topik bernomor (misal: "3. Ke mana air hujan pergi?", "1. Air terus bergerak di alam")
 * 4. Daftar poin / bullets ("•", "●", "▪", "- ", "* ")
 * 5. Daftar bernomor berurutan (mulai dari angka berapa pun: 1, 2.. atau 3, 4, 5..)
 * 6. Keterangan tabel ("Tabel 1. Perbandingan...")
 */

export interface RichListItem {
  text: string;
  children?: string[];
}

export type RichBlock =
  | { type: "section-banner"; tag: string; title: string }
  | {
      type: "sub-topic";
      num: number;
      title: string;
      body?: string;
      bullets?: string[];
    }
  | {
      type: "callout";
      label: string;
      title?: string;
      text: string;
      variant: "example" | "question" | "info";
    }
  | { type: "p"; text: string }
  | { type: "ul"; lead?: string; items: RichListItem[] }
  | { type: "ol"; start: number; lead?: string; items: RichListItem[] }
  | { type: "table-note"; caption: string; body?: string };

const BULLET_CHARS = "•●▪◦‣∙";
const BULLET_SPLIT = new RegExp(`\\s*[${BULLET_CHARS}]\\s*`);
const LINE_DASH_BULLET = /(^|\n)[ \t]*[-–*][ \t]+/g;

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function toTitleCase(s: string): string {
  const lower = s.toLowerCase();
  return lower
    .split(" ")
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** Pecah teks menjadi [lead, ...butir] berdasarkan penanda bullet. */
export function splitBullets(text: string): { lead: string; bullets: string[] } {
  const prepared = text.replace(LINE_DASH_BULLET, (_m, p1) => `${p1}• `);
  if (!new RegExp(`[${BULLET_CHARS}]`).test(prepared)) {
    return { lead: clean(prepared), bullets: [] };
  }
  const parts = prepared.split(BULLET_SPLIT);
  const lead = clean(parts[0] ?? "");
  const bullets = parts.slice(1).map(clean).filter(Boolean);
  return { lead, bullets };
}

interface NumberMarker {
  index: number;
  end: number;
  n: number;
}

/** Cari penanda nomor berurutan (misal 1, 2.. ATAU 3, 4, 5..) */
function findSequentialNumbers(text: string): { start: number; markers: NumberMarker[] } | null {
  const re = /(^|[\n.!?]\s+|\s{2,})(\d{1,2})[.)]\s+(?=\S)/g;
  const all: NumberMarker[] = [];
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    const num = Number(m[2]);
    const numStart = m.index + m[1].length;
    all.push({ index: numStart, end: m.index + m[0].length, n: num });
  }

  if (all.length < 2) return null;

  // Cari rangkaian terpanjang yang berurutan (selisih +1)
  let bestRun: NumberMarker[] = [];
  let currentRun: NumberMarker[] = [all[0]];

  for (let i = 1; i < all.length; i++) {
    const prev = currentRun[currentRun.length - 1];
    const curr = all[i];
    if (curr.n === prev.n + 1) {
      currentRun.push(curr);
    } else {
      if (currentRun.length > bestRun.length) bestRun = currentRun;
      currentRun = [curr];
    }
  }
  if (currentRun.length > bestRun.length) bestRun = currentRun;

  if (bestRun.length >= 2) {
    return { start: bestRun[0].n, markers: bestRun };
  }

  return null;
}

/** Ekstraksi judul sub-topik (misal "Ke mana air hujan pergi?" atau "Air terus bergerak di alam") */
function extractTitleFromBody(text: string): { title: string; body: string } {
  // Pola 1: Berakhir dengan tanda tanya "?"
  const qMatch = text.match(/^([^?\n]{3,80}\?)\s*([\s\S]*)$/);
  if (qMatch) {
    return { title: clean(qMatch[1]), body: clean(qMatch[2]) };
  }

  // Pola 2: Berakhir dengan titik dua ":"
  const colonMatch = text.match(/^([^:\n]{3,60}:)\s*([\s\S]*)$/);
  if (colonMatch) {
    return { title: clean(colonMatch[1]), body: clean(colonMatch[2]) };
  }

  // Pola 3: Judul deklaratif pendek sebelum kalimat pertama berhuruf kapital
  // Contoh: "Air terus bergerak di alam Air dapat ditemukan di laut..."
  // Judul biasanya 3 - 6 kata pertama yang membentuk frasa topik
  const sentences = text.match(/^([A-Z][a-z0-9\s,–-]{4,55}?)(?=\s+[A-Z][a-z]{2,}\b|\.|$)([\s\S]*)$/);
  if (sentences && sentences[1].split(" ").length <= 8 && sentences[2].trim().length > 10) {
    return { title: clean(sentences[1]), body: clean(sentences[2]) };
  }

  // Fallback: Jika pendek (< 70 karakter), jadikan seluruhnya judul
  if (text.length <= 70) {
    return { title: clean(text), body: "" };
  }

  return { title: "", body: clean(text) };
}

/** Cek apakah teks berupa Callout box (Contoh lingkungan, Pertanyaan pemantik, Catatan) */
function parseCallout(text: string): RichBlock | null {
  const exampleMatch = text.match(
    /^(Contoh\s+lingkungan|Contoh\s+kasus|Contoh|Studi\s+kasus)\s*[:.]\s*([\s\S]+)$/i,
  );
  if (exampleMatch) {
    return {
      type: "callout",
      label: toTitleCase(exampleMatch[1]),
      text: clean(exampleMatch[2]),
      variant: "example",
    };
  }

  const questionMatch = text.match(
    /^(Pertanyaan\s+pemantik|Aktivitas|Pertanyaan)\s*[:.]\s*([\s\S]+)$/i,
  );
  if (questionMatch) {
    return {
      type: "callout",
      label: toTitleCase(questionMatch[1]),
      text: clean(questionMatch[2]),
      variant: "question",
    };
  }

  const noteMatch = text.match(
    /^(Catatan\s+penting|Catatan|Perhatian|Penting)\s*[:.]\s*([\s\S]+)$/i,
  );
  if (noteMatch) {
    return {
      type: "callout",
      label: toTitleCase(noteMatch[1]),
      text: clean(noteMatch[2]),
      variant: "info",
    };
  }

  return null;
}

/** Cek keterangan tabel (misal "Tabel 1. Perbandingan umum...") */
function parseTableNote(text: string): RichBlock | null {
  const match = text.match(/^(Tabel\s+\d+[.:]\s*[^.\n]+(?:\.[^.\n]+)?)([\s\S]*)$/i);
  if (match) {
    return {
      type: "table-note",
      caption: clean(match[1]),
      body: clean(match[2]) || undefined,
    };
  }
  return null;
}

/** Parser segmen teks tunggal */
function parseSegment(segment: string): RichBlock[] {
  const trimmed = segment.trim();
  if (!trimmed) return [];

  const blocks: RichBlock[] = [];
  let remaining = trimmed;

  // 1. Periksa Section Banner di awal: "BAGIAN 2 / PERPINDAHAN DAN PENYIMPANAN AIR"
  const bannerMatch = remaining.match(
    /^(BAGIAN|BAB|TOPIK|UNIT)\s+([0-9IVXLCDM]+)\s*[/:\-]?\s*([A-Z\s,–-]+?)(?=\s+\d+[.)]|\n|$)([\s\S]*)$/i,
  );
  if (bannerMatch) {
    const tag = `${bannerMatch[1].toUpperCase()} ${bannerMatch[2].toUpperCase()}`;
    const rawTitle = clean(bannerMatch[3]);
    if (rawTitle.length >= 3) {
      blocks.push({
        type: "section-banner",
        tag,
        title: rawTitle === rawTitle.toUpperCase() ? toTitleCase(rawTitle) : rawTitle,
      });
      remaining = clean(bannerMatch[4] || "");
    }
  }

  if (!remaining) return blocks;

  // 2. Periksa Callout Box utuh
  const callout = parseCallout(remaining);
  if (callout) {
    blocks.push(callout);
    return blocks;
  }

  // 3. Periksa Keterangan Tabel
  const tableNote = parseTableNote(remaining);
  if (tableNote) {
    blocks.push(tableNote);
    return blocks;
  }

  // 4. Periksa apakah segmen ini berisi rangkaian penomoran berurutan (misal 1..2 atau 3..5)
  const seq = findSequentialNumbers(remaining);
  if (seq) {
    // Teks sebelum angka pertama
    const beforeText = remaining.slice(0, seq.markers[0].index).trim();
    if (beforeText) {
      const calloutBefore = parseCallout(beforeText);
      if (calloutBefore) {
        blocks.push(calloutBefore);
      } else {
        const { lead, bullets } = splitBullets(beforeText);
        if (lead) blocks.push({ type: "p", text: lead });
        if (bullets.length > 0) {
          blocks.push({ type: "ul", items: bullets.map((t) => ({ text: t })) });
        }
      }
    }

    // Olah setiap item bernomor
    for (let i = 0; i < seq.markers.length; i++) {
      const mk = seq.markers[i];
      const stop = i + 1 < seq.markers.length ? seq.markers[i + 1].index : remaining.length;
      const body = remaining.slice(mk.end, stop).trim();

      // Coba ekstrak judul & body sub-topik
      const { title, body: itemBody } = extractTitleFromBody(body);
      const { lead, bullets } = splitBullets(itemBody);

      if (title) {
        blocks.push({
          type: "sub-topic",
          num: mk.n,
          title,
          body: lead || undefined,
          bullets: bullets.length > 0 ? bullets : undefined,
        });
      } else {
        // Jika tidak ada judul spesifik, buat sebagai item OL
        blocks.push({
          type: "ol",
          start: mk.n,
          items: [{ text: lead, children: bullets.length > 0 ? bullets : undefined }],
        });
      }
    }
    return blocks;
  }

  // 5. Cek apakah ini SATU sub-topik bernomor tunggal (misal hanya "3. Ke mana air hujan pergi? ...")
  const singleSubMatch = remaining.match(/^(\d{1,2})[.)]\s+([\s\S]+)$/);
  if (singleSubMatch) {
    const num = Number(singleSubMatch[1]);
    const { title, body } = extractTitleFromBody(singleSubMatch[2]);
    const { lead, bullets } = splitBullets(body);
    if (title) {
      blocks.push({
        type: "sub-topic",
        num,
        title,
        body: lead || undefined,
        bullets: bullets.length > 0 ? bullets : undefined,
      });
      return blocks;
    }
  }

  // 6. Cek daftar bullet
  const { lead, bullets } = splitBullets(remaining);
  if (lead) {
    const calloutLead = parseCallout(lead);
    if (calloutLead) {
      blocks.push(calloutLead);
    } else {
      blocks.push({ type: "p", text: lead });
    }
  }
  if (bullets.length > 0) {
    blocks.push({ type: "ul", items: bullets.map((t) => ({ text: t })) });
  }

  return blocks;
}

/**
 * Memastikan penanda struktur (Tabel, Sub-topik bernomor, Callout, Banner Bagian)
 * dipisahkan dengan jeda paragraf ganda meskipun dari PDF/database tersambung
 * dalam satu kalimat atau paragraf berkelanjutan.
 */
function splitIntoSemanticParagraphs(text: string): string[] {
  let prepared = text
    // 1. Keterangan tabel di tengah teks: ". Tabel 1." -> "\n\nTabel 1."
    .replace(/(?<=[.!?]\s+|\n|^)(Tabel\s+\d+[.:])/gi, "\n\n$1")
    // 2. Callout box di tengah teks: ". Contoh lingkungan:" -> "\n\nContoh lingkungan:"
    .replace(
      /(?<=[.!?]\s+|\n|^)((?:Contoh\s+lingkungan|Contoh\s+kasus|Contoh|Studi\s+kasus|Pertanyaan\s+pemantik|Aktivitas|Catatan\s+penting|Catatan|Perhatian|Penting)\s*[:.])/gi,
      "\n\n$1",
    )
    // 3. Sub-topik bernomor di tengah teks: ". 5. Hubungan..." -> "\n\n5. Hubungan..."
    .replace(/(?<=[.!?]\s+|\n|^)(\d{1,2}[.)]\s+[A-Z])/g, "\n\n$1")
    // 4. Banner bagian di tengah teks: ". BAGIAN 2 /" -> "\n\nBAGIAN 2 /"
    .replace(/(?<=[.!?]\s+|\n|^)((?:BAGIAN|BAB|TOPIK|UNIT)\s+[0-9IVXLCDM]+\s*[/:\-]?)/gi, "\n\n$1");

  return prepared
    .split(/\n\s*\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseRichText(raw: string): RichBlock[] {
  if (!raw) return [];
  const normalized = raw.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [];

  const blocks: RichBlock[] = [];
  const paras = splitIntoSemanticParagraphs(normalized);
  for (const para of paras) {
    blocks.push(...parseSegment(para));
  }
  return blocks;
}
