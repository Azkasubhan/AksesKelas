/**
 * Mengubah teks sumber (hasil ekstraksi PDF / tempel) menjadi struktur
 * paragraf, daftar poin (bullet), dan daftar bernomor, sehingga tampilan
 * bacaan mengikuti susunan dokumen aslinya.
 *
 * Penanda yang dikenali (baik di awal baris maupun di tengah kalimat
 * karena PDF sering menggabungkan baris):
 *  - Bullet: "•", "●", "▪", "◦", "‣", serta "- " / "* " di awal baris
 *  - Nomor berurutan: "1." "2." "3." (atau "1)") — hanya diterima bila
 *    berurutan mulai dari 1 agar angka biasa seperti "tahun 2016." aman.
 */

export interface RichListItem {
  text: string;
  /** Sub-poin (bullet) di dalam item bernomor */
  children?: string[];
}

export type RichBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: RichListItem[] }
  | { type: "ol"; items: RichListItem[] };

const BULLET_CHARS = "•●▪◦‣∙";
const BULLET_SPLIT = new RegExp(`\\s*[${BULLET_CHARS}]\\s*`);
const LINE_DASH_BULLET = /(^|\n)[ \t]*[-–*][ \t]+/g;

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Pecah teks menjadi [lead, ...butir] berdasarkan penanda bullet. */
function splitBullets(text: string): { lead: string; bullets: string[] } {
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
  index: number; // posisi awal penanda (termasuk spasi sebelum)
  end: number; // posisi akhir penanda
  n: number;
}

/** Cari penanda "1." "2." ... yang berurutan. Kembalikan [] bila < 2 item. */
function findNumberMarkers(text: string): NumberMarker[] {
  const re = /(^|\s)(\d{1,2})[.)]\s+(?=\S)/g;
  const all: NumberMarker[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    all.push({ index: m.index, end: m.index + m[0].length, n: Number(m[2]) });
  }

  const picked: NumberMarker[] = [];
  let expected = 1;
  for (const mk of all) {
    if (mk.n === expected) {
      picked.push(mk);
      expected++;
    }
  }
  return picked.length >= 2 ? picked : [];
}

function pushLead(blocks: RichBlock[], lead: string, bullets: string[]) {
  if (lead) blocks.push({ type: "p", text: lead });
  if (bullets.length > 0) {
    blocks.push({ type: "ul", items: bullets.map((t) => ({ text: t })) });
  }
}

function parseSegment(segment: string): RichBlock[] {
  const blocks: RichBlock[] = [];
  const markers = findNumberMarkers(segment);

  if (markers.length === 0) {
    const { lead, bullets } = splitBullets(segment);
    pushLead(blocks, lead, bullets);
    return blocks;
  }

  // Teks sebelum "1." (bisa berisi paragraf + bullet)
  const before = segment.slice(0, markers[0].index);
  {
    const { lead, bullets } = splitBullets(before);
    pushLead(blocks, lead, bullets);
  }

  const items: RichListItem[] = markers.map((mk, i) => {
    const stop = i + 1 < markers.length ? markers[i + 1].index : segment.length;
    const body = segment.slice(mk.end, stop);
    const { lead, bullets } = splitBullets(body);
    return bullets.length > 0 ? { text: lead, children: bullets } : { text: lead };
  });

  blocks.push({ type: "ol", items: items.filter((it) => it.text || it.children?.length) });
  return blocks;
}

export function parseRichText(raw: string): RichBlock[] {
  if (!raw) return [];
  const normalized = raw.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [];

  const blocks: RichBlock[] = [];
  // Paragraf dipisah baris kosong; baris tunggal dianggap pembungkusan PDF.
  for (const para of normalized.split(/\n\s*\n+/)) {
    if (!para.trim()) continue;
    blocks.push(...parseSegment(para));
  }
  return blocks;
}
