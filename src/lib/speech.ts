/**
 * Speech Synthesis & Automatic Language Detection Helper
 *
 * Mendeteksi secara otomatis apakah teks berbahasa Indonesia atau Inggris,
 * lalu memilih suara (voice) dan kode bahasa yang paling sesuai di Web Speech API
 * sehingga siswa tidak perlu bingung memilih pengaturan suara secara manual.
 */

// Kumpulan kata fungsi dan kosakata umum Bahasa Indonesia
const INDONESIAN_MARKERS = new Set([
  "dan", "di", "ke", "dari", "pada", "untuk", "dengan", "bahwa", "atau", "serta",
  "karena", "sehingga", "tetapi", "namun", "melainkan", "lalu", "kemudian", "saat",
  "ketika", "jika", "bila", "kalau", "agar", "supaya", "tentang", "oleh", "ini",
  "itu", "adalah", "yaitu", "yakni", "tidak", "bukan", "ada", "bisa", "dapat",
  "harus", "akan", "sudah", "telah", "sedang", "saya", "kamu", "dia", "kita",
  "mereka", "kami", "sangat", "lebih", "paling", "baca", "bacaan", "materi",
  "pelajaran", "kelas", "siswa", "guru", "buku", "kata", "kalimat", "teks",
  "bagian", "proses", "cara", "fungsi", "tubuh", "sistem", "makanan", "organ",
  "tumbuhan", "hewan", "manusia", "gerak", "contoh", "setelah", "membentuk",
  "menuju", "meremas", "mendorong", "lambung", "mulut", "otot", "panjang",
]);

// Kumpulan kata fungsi dan kosakata umum Bahasa Inggris
const ENGLISH_MARKERS = new Set([
  "the", "a", "an", "this", "that", "these", "those", "is", "are", "was", "were",
  "be", "been", "being", "have", "has", "had", "do", "does", "did", "can", "could",
  "will", "would", "shall", "should", "may", "might", "must", "it", "its", "he",
  "she", "they", "we", "you", "i", "me", "him", "her", "us", "them", "what",
  "which", "who", "whom", "whose", "and", "of", "to", "in", "for", "on", "with",
  "at", "by", "from", "as", "into", "through", "during", "before", "after", "above",
  "below", "between", "without", "because", "although", "while", "if", "since",
  "until", "read", "reading", "text", "lesson", "class", "student", "teacher",
  "book", "word", "words", "sentence", "section", "process", "how", "function",
  "body", "system", "food", "organ", "plant", "animal", "human", "motion", "example",
]);

export type DetectedLanguage = "id-ID" | "en-US";

/**
 * Deteksi bahasa teks secara otomatis berdasarkan proporsi kata.
 * Default ke "id-ID" jika seimbang atau teks kosong (sesuai kurikulum AksesKelas).
 */
export function detectLanguage(text: string): DetectedLanguage {
  if (!text || typeof text !== "string") return "id-ID";

  const tokens = text
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);

  if (tokens.length === 0) return "id-ID";

  let idScore = 0;
  let enScore = 0;

  for (const token of tokens) {
    if (INDONESIAN_MARKERS.has(token)) idScore += 2;
    if (ENGLISH_MARKERS.has(token)) enScore += 2;
  }

  // Jika skor bahasa Inggris lebih tinggi secara meyakinkan
  if (enScore > idScore) {
    return "en-US";
  }

  return "id-ID";
}

/**
 * Label ramah pengguna untuk bahasa yang terdeteksi
 */
export function getLanguageLabel(lang: DetectedLanguage): {
  name: string;
  shortName: string;
  flag: string;
} {
  if (lang === "en-US") {
    return {
      name: "Bahasa Inggris (English)",
      shortName: "English",
      flag: "🇬🇧",
    };
  }
  return {
    name: "Bahasa Indonesia",
    shortName: "Indonesia",
    flag: "🇮🇩",
  };
}

/**
 * Temukan voice peramban terbaik yang cocok dengan target bahasa yang terdeteksi.
 */
export function getBestVoiceForLanguage(
  voices: SpeechSynthesisVoice[],
  targetLang: DetectedLanguage,
): SpeechSynthesisVoice | undefined {
  if (!voices || voices.length === 0) return undefined;

  if (targetLang === "id-ID") {
    // 1. Cek kode bahasa id-ID atau id_ID atau id-*
    const exactId = voices.find((v) => {
      const code = v.lang.replace("_", "-").toLowerCase();
      return code === "id-id" || code.startsWith("id-");
    });
    if (exactId) return exactId;

    // 2. Cek nama voice yang memuat "indonesia", "damayanti", atau "gadis"
    const nameMatch = voices.find((v) => {
      const name = v.name.toLowerCase();
      const code = v.lang.toLowerCase();
      return (
        name.includes("indonesia") ||
        name.includes("damayanti") ||
        name.includes("gadis") ||
        code.startsWith("id")
      );
    });
    if (nameMatch) return nameMatch;

    // 3. Fallback ke voice apa pun yang berawalan "id"
    const anyId = voices.find((v) => v.lang.toLowerCase().startsWith("id"));
    if (anyId) return anyId;

    // 4. Default sistem
    return voices.find((v) => v.default) || voices[0];
  } else {
    // targetLang === "en-US"
    // 1. Cek en-US spesifik
    const enUs = voices.find((v) => {
      const code = v.lang.replace("_", "-").toLowerCase();
      return code === "en-us";
    });
    if (enUs) return enUs;

    // 2. Cek suara bahasa Inggris apa pun (en-GB, en-AU, dll.)
    const anyEn = voices.find((v) => v.lang.toLowerCase().startsWith("en"));
    if (anyEn) return anyEn;

    // 3. Default sistem
    return voices.find((v) => v.default) || voices[0];
  }
}

export interface PlaySpeechOptions {
  rate?: number;
  pitch?: number;
  selectedVoiceUri?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

/**
 * Buat SpeechSynthesisUtterance dengan deteksi bahasa otomatis dan pencocokan suara.
 */
export function createSpeechUtterance(
  text: string,
  options?: PlaySpeechOptions,
): {
  utterance: SpeechSynthesisUtterance;
  detectedLang: DetectedLanguage;
  matchedVoice?: SpeechSynthesisVoice;
} {
  const detectedLang = detectLanguage(text);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = detectedLang;
  utterance.rate = options?.rate ?? 1.0;
  if (options?.pitch) utterance.pitch = options.pitch;

  let matchedVoice: SpeechSynthesisVoice | undefined;

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    const voices = window.speechSynthesis.getVoices();

    // Jika pengguna memilih voiceURI tertentu secara eksplisit
    if (options?.selectedVoiceUri) {
      matchedVoice = voices.find((v) => v.voiceURI === options.selectedVoiceUri);
    }

    // Jika belum ada atau voice eksplisit tidak ditemukan, pilih secara otomatis
    if (!matchedVoice) {
      matchedVoice = getBestVoiceForLanguage(voices, detectedLang);
    }

    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang;
    }
  }

  if (options?.onStart) utterance.onstart = options.onStart;
  if (options?.onEnd) utterance.onend = options.onEnd;
  if (options?.onError) utterance.onerror = options.onError;

  return { utterance, detectedLang, matchedVoice };
}
