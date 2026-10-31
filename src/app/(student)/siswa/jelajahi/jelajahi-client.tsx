"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlignLeft,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Layers,
  Pause,
  Play,
  Sliders,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createSpeechUtterance,
  type DetectedLanguage,
} from "@/lib/speech";

type ModeTab = "standard" | "focus" | "easy" | "readable" | "listen";

// Konten materi simulasi tetap yang jelas berlabel demo
const DEMO_MATERIAL = {
  subject: "IPA Kelas VIII · Sistem Pencernaan",
  title: "Perjalanan Makanan: Kerongkongan & Gerak Peristaltik",
  originalParagraphs: [
    "Setelah makanan dikunyah secara mekanis dan bercampur enzim ptialin di dalam rongga mulut, makanan membentuk gumpalan lunak yang disebut bolus.",
    "Bolus kemudian ditelan menuju esofagus (kerongkongan), yaitu saluran berotot sepanjang kurang lebih 25 cm yang menghubungkan rongga mulut dengan organ lambung.",
    "Dinding otot polos kerongkongan secara otomatis melakukan kontraksi dan relaksasi bergelombang yang dinamakan gerak peristaltik. Gerakan ini meremas dan mendorong makanan secara aktif menuruni saluran, melewati sfingter esofagus bawah, hingga tiba dengan aman di lambung.",
  ],
  easyParagraphs: [
    "Makanan yang sudah dikunyah menjadi gumpalan lembut bernama bolus.",
    "Kerongkongan adalah saluran otot yang menyambungkan mulut langsung ke lambung.",
    "Otot kerongkongan meremas dan mendorong makanan seperti gelombang (dinamakan gerak peristaltik), sehingga makanan mengalir turun ke lambung.",
  ],
  cards: [
    {
      step: 1,
      tag: "Tahap 1 · Mulut",
      title: "Pembentukan Bolus Makanan",
      originalText:
        "Makanan yang telah dikunyah lumat bersama air liur membentuk bolus, lalu didorong ke pangkal tenggorokan untuk ditelan.",
      easyText:
        "Makanan yang sudah dikunyah menjadi gumpalan lembut (bolus) agar mudah ditelan.",
    },
    {
      step: 2,
      tag: "Tahap 2 · Saluran",
      title: "Saluran Kerongkongan",
      originalText:
        "Kerongkongan (esofagus) merupakan pipa berotot sepanjang ±25 cm yang berfungsi sebagai jembatan penghubung antara mulut dan lambung.",
      easyText:
        "Kerongkongan adalah saluran otot yang membawa makanan dari mulut ke lambung.",
    },
    {
      step: 3,
      tag: "Tahap 3 · Gerakan",
      title: "Gerak Peristaltik Otot",
      originalText:
        "Otot kerongkongan berkontraksi secara ritmis dan bergelombang (gerak peristaltik) untuk mendorong makanan menuruni saluran menuju lambung.",
      easyText:
        "Otot kerongkongan meremas berurutan seperti gelombang untuk mendorong makanan ke bawah.",
    },
  ],
};

export function JelajahiClient() {
  const [activeTab, setActiveTab] = React.useState<ModeTab>("standard");

  // State untuk Mode Focus Cards
  const [currentCardIndex, setCurrentCardIndex] = React.useState(0);

  // State untuk Mode Easy Read
  const [easyReadActive, setEasyReadActive] = React.useState(false);

  // State untuk Readable Settings Playground
  const [demoFontSize, setDemoFontSize] = React.useState<number>(20);
  const [demoTheme, setDemoTheme] = React.useState<"light" | "sepia" | "high-contrast">("light");
  const [demoLineHeight, setDemoLineHeight] = React.useState<number>(1.7);

  // State untuk Audio Listen
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);
  const [speechRate, setSpeechRate] = React.useState<number>(1);
  const [detectedSpeechLang, setDetectedSpeechLang] = React.useState<DetectedLanguage>("id-ID");
  const [activeVoiceName, setActiveVoiceName] = React.useState<string>("");

  // Audio Speech Utterance dengan deteksi bahasa otomatis
  function toggleSpeech() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToRead = easyReadActive
      ? DEMO_MATERIAL.easyParagraphs.join(". ")
      : DEMO_MATERIAL.originalParagraphs.join(". ");

    const { utterance, detectedLang, matchedVoice } = createSpeechUtterance(textToRead, {
      rate: speechRate,
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });

    setDetectedSpeechLang(detectedLang);
    if (matchedVoice) {
      setActiveVoiceName(matchedVoice.name);
    }

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  }

  React.useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const themeClasses = {
    light: "bg-surface text-ink border-line",
    sepia: "bg-[#FBF3E5] text-[#30281F] border-[#DFCFA9]",
    "high-contrast": "bg-[#18181b] text-white border-white/20",
  }[demoTheme];

  return (
    <div className="space-y-8">
      {/* Tab Navigasi 5 Cara Membaca */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-4">
        {[
          { id: "standard", label: "Standard Reading", icon: BookOpen },
          { id: "focus", label: "Focus Cards", icon: Layers },
          { id: "easy", label: "Easy Read", icon: AlignLeft },
          { id: "readable", label: "Kenyamanan Visual", icon: Sliders },
          { id: "listen", label: "Dengarkan Audio", icon: Volume2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as ModeTab);
                if (isPlayingAudio) {
                  window.speechSynthesis?.cancel();
                  setIsPlayingAudio(false);
                }
              }}
              className={`flex items-center gap-2 rounded-btn px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-white shadow-xs"
                  : "border border-line bg-surface text-muted hover:text-ink hover:bg-surface-subtle"
              }`}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 1. STANDARD READING                                       */}
      {/* ========================================================= */}
      {activeTab === "standard" && (
        <div className="space-y-4">
          <div className="rounded-[16px] border border-line bg-surface-subtle/60 p-4 text-xs text-muted leading-relaxed">
            <strong className="text-ink">Format Standard Reading:</strong> Materi disajikan mengalir alami seperti halaman buku teks atau artikel bacaan. Sangat cocok bagi siswa yang terbiasa membaca secara komprehensif dan utuh.
          </div>

          <div className="rounded-[20px] border border-line bg-surface p-6 sm:p-8 shadow-xs space-y-4 w-full">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              {DEMO_MATERIAL.subject}
            </span>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-ink">
              {DEMO_MATERIAL.title}
            </h2>

            <div className="space-y-3.5 text-base text-ink leading-relaxed pt-2">
              {DEMO_MATERIAL.originalParagraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. FOCUS CARDS                                            */}
      {/* ========================================================= */}
      {activeTab === "focus" && (
        <div className="space-y-4">
          <div className="rounded-[16px] border border-line bg-surface-subtle/60 p-4 text-xs text-muted leading-relaxed">
            <strong className="text-ink">Format Focus Cards:</strong> Materi dibagi menjadi kartu gagasan bertahap. Setiap kartu hanya memuat satu gagasan pokok agar siswa dapat fokus mencerna materi tanpa merasa kewalahan.
          </div>

          <div className="rounded-[20px] border border-line bg-surface p-6 sm:p-8 shadow-xs w-full space-y-5">
            {/* Indikator Langkah Kartu */}
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary-subtle px-2.5 py-1 text-xs font-semibold text-primary">
                Kartu {currentCardIndex + 1} dari {DEMO_MATERIAL.cards.length}
              </span>
              <span className="text-xs text-muted font-medium">
                {DEMO_MATERIAL.cards[currentCardIndex]?.tag}
              </span>
            </div>

            {/* Isi Kartu */}
            <div className="space-y-2.5 min-h-[140px]">
              <h3 className="font-heading text-lg sm:text-xl font-bold text-ink">
                {DEMO_MATERIAL.cards[currentCardIndex]?.title}
              </h3>
              <p className="text-base text-ink leading-relaxed">
                {DEMO_MATERIAL.cards[currentCardIndex]?.originalText}
              </p>
            </div>

            {/* Tombol Navigasi Kartu Berurutan */}
            <div className="flex items-center justify-between border-t border-line pt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentCardIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentCardIndex === 0}
                className="gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <ChevronLeft className="size-4" />
                <span>Sebelumnya</span>
              </Button>

              {/* Titik Progres */}
              <div className="flex items-center gap-1.5" aria-hidden="true">
                {DEMO_MATERIAL.cards.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-2 rounded-full transition-all duration-200 ${
                      idx === currentCardIndex
                        ? "w-6 bg-primary"
                        : "w-2 bg-line"
                    }`}
                  />
                ))}
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  setCurrentCardIndex((prev) =>
                    Math.min(DEMO_MATERIAL.cards.length - 1, prev + 1),
                  )
                }
                disabled={currentCardIndex === DEMO_MATERIAL.cards.length - 1}
                className="gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <span>Berikutnya</span>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. EASY READ                                              */}
      {/* ========================================================= */}
      {activeTab === "easy" && (
        <div className="space-y-4">
          <div className="rounded-[16px] border border-line bg-surface-subtle/60 p-4 text-xs text-muted flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <strong className="text-ink">Penyederhanaan Easy Read:</strong> Kalimat dibuat lebih pendek, lugas, dan istilah asing disederhanakan tanpa mengubah esensi pembelajaran.
            </div>

            <Button
              variant={easyReadActive ? "primary" : "secondary"}
              size="sm"
              onClick={() => setEasyReadActive(!easyReadActive)}
              className="h-8.5 px-3.5 text-xs font-semibold shrink-0 cursor-pointer"
            >
              <Layers className="size-3.5" />
              <span>{easyReadActive ? "Easy Read: Aktif" : "Aktifkan Easy Read"}</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Kolom Original */}
            <div
              className={`rounded-[20px] border p-6 shadow-xs space-y-3 transition-all ${
                !easyReadActive
                  ? "border-primary bg-primary-subtle/20 ring-1 ring-primary/40 shadow-xs"
                  : "border-line bg-surface opacity-80"
              }`}
            >
              <div className="flex items-center justify-between border-b border-line pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Bahasa Original
                </span>
                {!easyReadActive && (
                  <span className="text-[11px] font-semibold text-primary">Sedang Dilihat</span>
                )}
              </div>
              <h3 className="font-heading text-base font-bold text-ink">
                {DEMO_MATERIAL.title}
              </h3>
              <div className="space-y-2.5 text-sm text-ink leading-relaxed">
                {DEMO_MATERIAL.originalParagraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>

            {/* Kolom Easy Read */}
            <div
              className={`rounded-[20px] border p-6 shadow-xs space-y-3 transition-all ${
                easyReadActive
                  ? "border-primary bg-primary-subtle/20 ring-1 ring-primary/40 shadow-xs"
                  : "border-line bg-surface opacity-80"
              }`}
            >
              <div className="flex items-center justify-between border-b border-line pb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                  <Layers className="size-3.5" />
                  <span>Easy Read (Sederhana)</span>
                </div>
                {easyReadActive && (
                  <span className="text-[11px] font-semibold text-primary">Sedang Dilihat</span>
                )}
              </div>
              <h3 className="font-heading text-base font-bold text-ink">
                Makanan Masuk ke Lambung
              </h3>
              <div className="space-y-2.5 text-sm text-ink leading-relaxed">
                {DEMO_MATERIAL.easyParagraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. READABLE SETTINGS                                      */}
      {/* ========================================================= */}
      {activeTab === "readable" && (
        <div className="space-y-6">
          <div className="rounded-[16px] border border-line bg-surface-subtle/60 p-4 text-xs text-muted leading-relaxed">
            <strong className="text-ink">Kenyamanan Visual:</strong> Sesuaikan ukuran huruf, tema warna latar, dan kerapatan baris untuk membaca materi dengan nyaman tanpa membuat mata lelah.
          </div>

          {/* Kontrol Cepat Playground */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-[18px] border border-line bg-surface p-5 sm:p-6 shadow-xs">
            {/* Ukuran Huruf */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-ink">Ukuran Huruf</span>
                <span className="font-mono text-primary font-bold">{demoFontSize} px</span>
              </div>
              <div className="flex rounded-xl bg-surface-subtle p-1 gap-1 border border-line/60">
                {[18, 20, 24, 28].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDemoFontSize(s)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      demoFontSize === s
                        ? "bg-primary text-white shadow-xs"
                        : "text-muted hover:text-ink hover:bg-surface/60"
                    }`}
                  >
                    {s}px
                  </button>
                ))}
              </div>
            </div>

            {/* Tema Warna */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-ink">Tema Kertas</span>
              </div>
              <div className="flex rounded-xl bg-surface-subtle p-1 gap-1 border border-line/60">
                {[
                  { key: "light", label: "Terang" },
                  { key: "sepia", label: "Sepia" },
                  { key: "high-contrast", label: "Kontras" },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setDemoTheme(t.key as typeof demoTheme)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      demoTheme === t.key
                        ? "bg-primary text-white shadow-xs"
                        : "text-muted hover:text-ink hover:bg-surface/60"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Jarak Baris */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-ink">Kerapatan Baris</span>
                <span className="font-mono text-primary font-bold">{demoLineHeight}x</span>
              </div>
              <div className="flex rounded-xl bg-surface-subtle p-1 gap-1 border border-line/60">
                {[
                  { val: 1.5, label: "1.5×" },
                  { val: 1.7, label: "1.7×" },
                  { val: 2.0, label: "2.0×" },
                ].map((lh) => (
                  <button
                    key={lh.val}
                    type="button"
                    onClick={() => setDemoLineHeight(lh.val)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      demoLineHeight === lh.val
                        ? "bg-primary text-white shadow-xs"
                        : "text-muted hover:text-ink hover:bg-surface/60"
                    }`}
                  >
                    {lh.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Area Render */}
          <div className={`rounded-[20px] border p-6 sm:p-8 shadow-xs w-full transition-all duration-200 ${themeClasses}`}>
            <h3 className="font-heading font-bold" style={{ fontSize: `${demoFontSize + 2}px` }}>
              {DEMO_MATERIAL.title}
            </h3>
            <div
              className="mt-3 space-y-3"
              style={{ fontSize: `${demoFontSize}px`, lineHeight: demoLineHeight }}
            >
              <p>{DEMO_MATERIAL.originalParagraphs[0]}</p>
              <p>{DEMO_MATERIAL.originalParagraphs[1]}</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. LISTEN (AUDIO)                                         */}
      {/* ========================================================= */}
      {activeTab === "listen" && (
        <div className="space-y-4">
          <div className="rounded-[16px] border border-line bg-surface-subtle/60 p-4 text-xs text-muted leading-relaxed">
            <strong className="text-ink">Fitur Narasi Audio (Listen):</strong> Memanfaatkan Web Speech API langsung dari browsermu dengan pelafalan suara ramah pendengar. Teks Indonesia otomatis dilafalkan dengan suara berbahasa Indonesia.
          </div>

          <div className="rounded-[20px] border border-line bg-surface p-6 sm:p-8 shadow-xs w-full space-y-6">
            {/* Player Toolbar Bersih & Elegan */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface-subtle/50 p-4">
              <div className="flex items-center gap-3.5">
                <div className="flex size-10 items-center justify-center rounded-xl border border-line bg-surface text-ink shadow-2xs shrink-0">
                  <Volume2 className="size-5 text-ink/80" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">Pemutar Suara Pelajaran</p>
                  <p className="text-xs text-muted mt-0.5">
                    Deteksi Otomatis: Bahasa Indonesia ({detectedSpeechLang})
                    {activeVoiceName ? ` • ${activeVoiceName}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={toggleSpeech}
                  className="gap-2 h-9 px-4 text-xs font-semibold cursor-pointer shadow-xs"
                >
                  {isPlayingAudio ? (
                    <>
                      <Pause className="size-3.5" />
                      <span>Jeda Suara</span>
                    </>
                  ) : (
                    <>
                      <Play className="size-3.5" />
                      <span>Putar Pelajaran</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Kecepatan Suara Berbasis Segmented Pill */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-ink">Kecepatan Pembacaan Suara</span>
                <span className="font-mono text-primary font-bold">{speechRate}x</span>
              </div>
              <div className="flex max-w-sm rounded-xl bg-surface-subtle p-1 gap-1 border border-line/60">
                {[
                  { r: 0.75, label: "0.75× Tenang" },
                  { r: 1, label: "1.0× Normal" },
                  { r: 1.25, label: "1.25× Cepat" },
                ].map((item) => (
                  <button
                    key={item.r}
                    type="button"
                    onClick={() => {
                      setSpeechRate(item.r);
                      if (isPlayingAudio) {
                        window.speechSynthesis?.cancel();
                        setIsPlayingAudio(false);
                      }
                    }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      speechRate === item.r
                        ? "bg-primary text-white shadow-xs"
                        : "text-muted hover:text-ink hover:bg-surface/60"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Naskah yang dibaca */}
            <div className="rounded-xl border border-line bg-surface-subtle/50 p-4 text-sm text-ink leading-relaxed">
              <p className="font-semibold text-xs text-muted mb-1.5 uppercase tracking-wider">
                Naskah yang Sedang Dibacakan:
              </p>
              <p>{DEMO_MATERIAL.originalParagraphs[0]}</p>
            </div>
          </div>
        </div>
      )}

      {/* CTA Bawah */}
      <div className="rounded-[18px] border border-line bg-surface p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div>
          <h3 className="font-heading text-base font-bold text-ink">
            Siap menentukan cara membaca yang paling nyaman untukmu?
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Pengaturan yang kamu simpan akan langsung diterapkan pada semua materi pelajaran yang kamu buka.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button variant="secondary" size="sm" asChild className="h-9 px-4 text-xs font-semibold">
            <Link href="/siswa">Kembali ke Beranda</Link>
          </Button>
          <Button variant="primary" size="sm" asChild className="h-9 px-4 text-xs font-semibold">
            <Link href="/siswa/cara-membaca">
              <span>Atur Cara Membaca</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
