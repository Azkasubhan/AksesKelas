/**
 * Utilitas Deteksi Otomatis Judul, Mata Pelajaran, dan Pembersihan Header Dokumen Pembelajaran.
 * Mendukung format kurikulum Indonesia (Kurikulum Merdeka & Kurikulum 2013).
 */

export interface DetectedMetadata {
  title: string | null;
  subject: string | null;
  cleanedText: string;
}

// Daftar mata pelajaran umum dalam kurikulum Indonesia
export const KNOWN_SUBJECTS = [
  "IPA Terpadu",
  "Ilmu Pengetahuan Alam",
  "IPA",
  "IPS Terpadu",
  "Ilmu Pengetahuan Sosial",
  "IPS",
  "Biologi",
  "Fisika",
  "Kimia",
  "Matematika",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "Pendidikan Pancasila",
  "PPKn",
  "PPKN",
  "Sejarah Indonesia",
  "Sejarah",
  "Geografi",
  "Sosiologi",
  "Ekonomi",
  "Informatika",
  "Seni Budaya",
  "Pendidikan Jasmani",
  "PJOK",
  "Pendidikan Agama Islam",
  "Pendidikan Agama",
];

// Pola awalan yang menandakan baris metadata / running header (BUKAN judul materi)
export const HEADER_PREFIX_PATTERNS = [
  /^AKSESKELAS\b/i,
  /^MODUL\s+(UJI|AJAR|PEMBELAJARAN|PRAKTIKUM)\b/i,
  /^LEMBAR\s+(KERJA|MATERI|AKTIVITAS)\b/i,
  /^BAHAN\s+AJAR\b/i,
  /^BUKU\s+(SISWA|GURU|TEKS)\b/i,
  /^MATERI\s+PEMBELAJARAN\b/i,
  /^SUMBER\s+BELAJAR\b/i,
  /^DIREKTORAT\b/i,
  /^KEMENTERIAN\b/i,
  /^KURIKULUM\b/i,
  /^SATUAN\s+PENDIDIKAN\b/i,
  /^SEKOLAH\s+(MENENGAH|DASAR)\b/i,
  /^(MATA\s+PELAJARAN|MAPEL)\s*[:|]/i,
  /^(KELAS|SEMESTER|FASE)\s*[:|]/i,
];

// Kata kerja pembuka atau penanda teks isi materi (BUKAN judul)
export const BODY_START_PATTERNS = [
  /^(Memahami|Menjelaskan|Mengidentifikasi|Menganalisis|Mendeskripsikan)\b/i,
  /^(Pertanyaan\s+pemantik|Tujuan\s+pembelajaran|Capaian\s+pembelajaran|Indikator)\b/i,
  /^(Tahukah\s+kamu|Pada\s+bab\s+ini|Dalam\s+kehidupan\s+sehari-hari|Pernahkah\s+kamu)\b/i,
  /^(Petunjuk\s+belajar|Aktivitas\s+\d+|Mari\s+kita\s+pelajari|Perhatikan\s+gambar)\b/i,
];

/**
 * Mendeteksi judul materi, mata pelajaran, dan menghasilkan teks bersih tanpa header/duplikasi judul.
 */
export function detectTitleAndSubject(rawText: string): DetectedMetadata {
  if (!rawText || rawText.trim().length === 0) {
    return { title: null, subject: null, cleanedText: rawText };
  }

  const lines = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const headerLineIndices = new Set<number>();

  let detectedSubject: string | null = null;
  let detectedTitle: string | null = null;

  // Regex mata pelajaran + tingkatan kelas (contoh: "IPA KELAS VII", "Biologi X", "Bahasa Indonesia 8")
  const subjectWithGradeRegex = new RegExp(
    `\\b(${KNOWN_SUBJECTS.join("|")})(?:\\s+(?:Terpadu\\s+)?(?:Kelas|Kls)?\\s*([IVXLCDM]+|\\d+))?\\b`,
    "i",
  );

  // 1. Deteksi Mata Pelajaran & Penanda Header
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const hasPageNumber = /\b\d+\s*[/|]\s*\d+\b|\bHalaman\s+\d+\b|\bhlm\.?\s*\d+\b/i.test(line);
    const isHeaderPattern = HEADER_PREFIX_PATTERNS.some((p) => p.test(line));

    // Ekstraksi definisi eksplisit (contoh: "MATERI PEMBELAJARAN | IPA KELAS VII" atau "Mata Pelajaran: Biologi X")
    const explicitSubMatch = line.match(/(?:Mata\s+Pelajaran|Mapel|Materi\s+Pembelajaran)\s*[:|]\s*(.+)/i);
    if (explicitSubMatch) {
      const candidate = explicitSubMatch[1].trim();
      const m = candidate.match(subjectWithGradeRegex);
      const subCandidate = m ? formatSubject(m[0]) : candidate.length <= 30 ? formatSubject(candidate) : null;
      if (subCandidate && (!detectedSubject || !/\b(?:Kelas|Kls|[IVXLCDM]+|\d+)\b/i.test(detectedSubject))) {
        detectedSubject = subCandidate;
      }
    } else if (isHeaderPattern || line.length <= 40) {
      const m = line.match(subjectWithGradeRegex);
      if (m) {
        const subCandidate = formatSubject(m[0]);
        if (!detectedSubject || (!/\b(?:Kelas|Kls|[IVXLCDM]+|\d+)\b/i.test(detectedSubject) && /\b(?:Kelas|Kls|[IVXLCDM]+|\d+)\b/i.test(subCandidate))) {
          detectedSubject = subCandidate;
        }
      }
    }

    if (isHeaderPattern || (hasPageNumber && line.length < 120)) {
      headerLineIndices.add(i);
    }
  }

  // 2. Deteksi Judul Dokumen
  // 2a. Cek Markdown `# Judul` atau `BAB X: Judul`
  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const mdMatch = line.match(/^#{1,3}\s+(.+)$/);
    if (mdMatch) {
      detectedTitle = cleanTitleCandidate(mdMatch[1]);
      headerLineIndices.add(i);
      break;
    }

    const babMatch = line.match(/^(?:BAB|TEMA|MODUL|TOPIK|UNIT)\s*(?:[0-9IVX]+)?\s*[:\-.]?\s*(.+)$/i);
    if (babMatch && babMatch[1].trim().length > 3) {
      if (!/^(UJI|AJAR|PRAKTIKUM)\b/i.test(babMatch[1].trim())) {
        detectedTitle = cleanTitleCandidate(babMatch[1]);
        headerLineIndices.add(i);
        break;
      }
    }
  }

  // 2b. Jika belum ditemukan, periksa judul yang tersemat pada running header atau baris terpisah
  if (!detectedTitle) {
    // Periksa running header (contoh: "AKSESKELAS / ... Siklus Air dan Ketersediaan Air Bersih 1 / 3")
    for (let i = 0; i < Math.min(lines.length, 6); i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (/\b\d+\s*[/|]\s*\d+\b/.test(line)) {
        let candidate = line
          .replace(/^AKSESKELAS\s*\/?[^a-zA-Z]*/i, "")
          .replace(/^MATERI\s+[A-Z\s]+MODUL\s+[A-Z\s]+/i, "")
          .replace(/\b\d+\s*[/|]\s*\d+\b.*$/, "")
          .trim();
        if (detectedSubject && candidate.toLowerCase().startsWith(detectedSubject.toLowerCase())) {
          candidate = candidate.slice(detectedSubject.length).trim();
        }
        if (candidate.length >= 5 && candidate.length <= 80) {
          detectedTitle = cleanTitleCandidate(candidate);
          break;
        }
      }
    }

    // Periksa baris judul mandiri di bagian awal (non-header)
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      if (headerLineIndices.has(i)) continue;
      const line = lines[i].trim();
      if (!line) continue;

      if (BODY_START_PATTERNS.some((p) => p.test(line)) || (line.length > 80 && /[.!?]$/.test(line))) {
        break;
      }

      if (detectedSubject && line.toLowerCase() === detectedSubject.toLowerCase()) {
        headerLineIndices.add(i);
        continue;
      }

      // Konfirmasi atau perjelas dari kandidat judul
      if (detectedTitle) {
        const normCandidate = detectedTitle.toLowerCase().replace(/[^a-z0-9]/g, "");
        const normLine = line.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (normCandidate === normLine || normCandidate.includes(normLine) || normLine.includes(normCandidate)) {
          headerLineIndices.add(i);
          if (line.length >= detectedTitle.length && line.length <= 80) {
            detectedTitle = cleanTitleCandidate(line);
          }
          continue;
        }
      }

      // Baris judul pendek mandiri
      if (!detectedTitle && line.length >= 4 && line.length <= 70 && !/[.!?]$/.test(line)) {
        let fullTitle = line;
        let nextIdx = -1;
        for (let j = i + 1; j < Math.min(lines.length, i + 3); j++) {
          const next = lines[j].trim();
          if (!next) continue;
          if (
            next.length < 40 &&
            !/[.!?]$/.test(next) &&
            !BODY_START_PATTERNS.some((p) => p.test(next)) &&
            !headerLineIndices.has(j)
          ) {
            fullTitle += " " + next;
            nextIdx = j;
          }
          break;
        }

        detectedTitle = cleanTitleCandidate(fullTitle);
        headerLineIndices.add(i);
        if (nextIdx !== -1) {
          headerLineIndices.add(nextIdx);
        }
        break;
      }
    }
  }

  // 3. Bersihkan baris header, judul, dan mata pelajaran dari awal teks
  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const normLine = line.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!normLine) continue;

    if (detectedSubject) {
      const normSub = detectedSubject.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (normSub === normLine || (normLine.length <= 40 && normLine.includes(normSub))) {
        headerLineIndices.add(i);
      }
    }

    if (detectedTitle) {
      const normTitle = detectedTitle.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (normTitle === normLine || normTitle.includes(normLine) || normLine.includes(normTitle)) {
        headerLineIndices.add(i);
      }
    }
  }

  let firstContentLineIndex = 0;
  while (
    firstContentLineIndex < lines.length &&
    (headerLineIndices.has(firstContentLineIndex) || lines[firstContentLineIndex].trim().length === 0)
  ) {
    firstContentLineIndex++;
  }

  const cleanedLines = lines.slice(firstContentLineIndex);
  const cleanedText = cleanedLines.join("\n").trim();

  return {
    title: detectedTitle,
    subject: detectedSubject,
    cleanedText: cleanedText || rawText,
  };
}

/**
 * Membersihkan running header dan nomor halaman berulang dari halaman PDF.
 */
export function cleanPageRunningHeaders(
  pageText: string,
  pageNum: number,
  knownTitle?: string | null,
): string {
  if (!pageText || pageText.trim().length === 0) return pageText;

  const lines = pageText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const indicesToRemove = new Set<number>();

  const normTitle = knownTitle ? knownTitle.toLowerCase().replace(/[^a-z0-9]/g, "") : null;

  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const hasPageNum = /\b\d+\s*[/|]\s*\d+\b|\bHalaman\s+\d+\b|\bhlm\.?\s*\d+\b/i.test(line);
    const isHeaderPattern = HEADER_PREFIX_PATTERNS.some((p) => p.test(line));

    if (pageNum > 1) {
      if (isHeaderPattern || hasPageNum) {
        indicesToRemove.add(i);
        continue;
      }
      if (normTitle && line.toLowerCase().replace(/[^a-z0-9]/g, "").includes(normTitle) && line.length < 100) {
        indicesToRemove.add(i);
        continue;
      }
    } else {
      if (isHeaderPattern || (hasPageNum && line.length < 120)) {
        indicesToRemove.add(i);
      }
    }
  }

  let startIdx = 0;
  while (startIdx < lines.length && (indicesToRemove.has(startIdx) || lines[startIdx].trim().length === 0)) {
    startIdx++;
  }

  return lines.slice(startIdx).join("\n").trim();
}

/**
 * Merapikan string judul yang diekstrak.
 */
export function cleanTitleCandidate(str: string): string {
  let cleaned = str
    .replace(/^[\s#:\-*–—|/]+|[\s#:\-*–—|/]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Jika semua huruf kapital, konversi ke Title Case yang rapi
  if (cleaned.length > 4 && cleaned === cleaned.toUpperCase()) {
    cleaned = cleaned
      .toLowerCase()
      .split(" ")
      .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join(" ");
  }

  return cleaned;
}

/**
 * Menstandarkan penamaan mata pelajaran dan angka romawi kelas.
 */
export function formatSubject(str: string): string {
  const trimmed = str.replace(/^[\s#:\-*–—|/]+|[\s#:\-*–—|/]+$/g, "").trim();
  return trimmed
    .replace(/\bipa\b/gi, "IPA")
    .replace(/\bips\b/gi, "IPS")
    .replace(/\bppkn\b/gi, "PPKn")
    .replace(/\bpjok\b/gi, "PJOK")
    .replace(/\b([ivxlcdm]+)\b/gi, (match) => match.toUpperCase());
}
