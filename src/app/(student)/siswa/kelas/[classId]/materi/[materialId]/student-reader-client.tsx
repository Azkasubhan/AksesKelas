"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Sliders,
  BookOpen,
  HelpCircle,
  CheckCircle,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  RotateCcw,
  Gauge,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import {
  detectLanguage,
  getBestVoiceForLanguage,
  getLanguageLabel,
} from "@/lib/speech";
import type { LessonSnapshotDto, SectionCardDto } from "@/shared/schemas/drafts-reader";
import type { ReadingPreferencesDto, ReadingProgressDto } from "@/shared/schemas/preferences";

interface StudentReaderProps {
  lesson: LessonSnapshotDto;
  classId: string;
  initialPreferences?: ReadingPreferencesDto | null;
  initialProgress?: ReadingProgressDto | null;
  csrfToken?: string;
}

type ReaderStructure = "standard" | "focus";
type ReaderTheme = "light" | "sepia" | "high-contrast";
type ReaderFontFamily = "inter" | "system" | "atkinson";

export function StudentReaderClient({
  lesson,
  classId,
  initialPreferences,
  initialProgress,
  csrfToken,
}: StudentReaderProps) {
  // 1. State Preferensi Membaca (dengan inisialisasi dari Database)
  const [structure, setStructure] = React.useState<ReaderStructure>(
    initialPreferences?.structure ?? "focus",
  );
  const [easyRead, setEasyRead] = React.useState<boolean>(
    initialPreferences?.easyRead ?? false,
  );
  const [fontSize, setFontSize] = React.useState<number>(
    initialPreferences?.fontSize ?? 20,
  );
  const [lineHeight, setLineHeight] = React.useState<number>(
    initialPreferences?.lineHeight ?? 1.7,
  );
  const [theme, setTheme] = React.useState<ReaderTheme>(
    initialPreferences?.theme ?? "light",
  );
  const [fontFamily, setFontFamily] = React.useState<ReaderFontFamily>(
    initialPreferences?.fontFamily ?? "inter",
  );
  const [lineWidth, setLineWidth] = React.useState<number>(
    initialPreferences?.lineWidth ?? 60,
  );
  const [letterSpacing, setLetterSpacing] = React.useState<number>(
    initialPreferences?.letterSpacing ?? 0,
  );
  const [listenEnabled, setListenEnabled] = React.useState<boolean>(
    initialPreferences?.listenEnabled ?? false,
  );
  const [settingsOpen, setSettingsOpen] = React.useState<boolean>(false);

  // 2. State Flatten Kartu untuk Navigasi Mode Fokus
  const allCards = React.useMemo(() => {
    const list: Array<{ card: SectionCardDto; sectionTitle: string; sectionIndex: number }> = [];
    lesson.content.sections.forEach((sec, sIdx) => {
      sec.cards.forEach((card) => {
        list.push({ card, sectionTitle: sec.title, sectionIndex: sIdx });
      });
    });
    return list;
  }, [lesson]);

  // Posisi kartu awal (cek apakah ada kartu tersimpan dari progres sebelumnya)
  const savedCardIndex = React.useMemo(() => {
    if (!initialProgress?.cardId) return 0;
    const foundIdx = allCards.findIndex((c) => c.card.id === initialProgress.cardId);
    return foundIdx >= 0 ? foundIdx : 0;
  }, [initialProgress, allCards]);

  const [currentCardIndex, setCurrentCardIndex] = React.useState<number>(0);
  const [showResumeBanner, setShowResumeBanner] = React.useState<boolean>(
    savedCardIndex > 0 && !initialProgress?.completedAt,
  );

  // 3. Audio Reader Layer (Web Speech API)
  const [speechSupported, setSpeechSupported] = React.useState<boolean>(true);
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
  const [isPaused, setIsPaused] = React.useState<boolean>(false);
  const [speechRate, setSpeechRate] = React.useState<number>(
    initialPreferences?.speechRate ?? 1,
  );
  const [voices, setVoices] = React.useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = React.useState<string | null>(
    initialPreferences?.voiceUri ?? null,
  );

  // Deteksi dan ambil daftar suara Web Speech API
  React.useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSpeechSupported(false);
      return;
    }

    function loadVoices() {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
    }

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Hentikan suara jika pengguna berpindah kartu, mode struktur, atau Easy Read (AC-10)
  const stopSpeech = React.useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, []);

  React.useEffect(() => {
    stopSpeech();
  }, [currentCardIndex, structure, easyRead, stopSpeech]);

  // Simpan preferensi secara otomatis ke Database (Debounced)
  const savePrefTimer = React.useRef<NodeJS.Timeout | null>(null);
  const syncPreference = React.useCallback(
    (patch: Partial<ReadingPreferencesDto>) => {
      if (savePrefTimer.current) clearTimeout(savePrefTimer.current);
      savePrefTimer.current = setTimeout(async () => {
        try {
          await apiFetch("/preferences", {
            method: "PATCH",
            body: patch,
            csrfToken,
          });
        } catch (err) {
          console.warn("Gagal menyinkronkan preferensi:", err);
        }
      }, 400);
    },
    [csrfToken],
  );

  function handleSetStructure(s: ReaderStructure) {
    setStructure(s);
    syncPreference({ structure: s });
  }

  function handleToggleEasyRead() {
    const next = !easyRead;
    setEasyRead(next);
    syncPreference({ easyRead: next });
  }

  function handleSetFontSize(size: number) {
    setFontSize(size);
    syncPreference({ fontSize: size });
  }

  function handleSetLineHeight(lh: number) {
    setLineHeight(lh);
    syncPreference({ lineHeight: lh });
  }

  function handleSetTheme(t: ReaderTheme) {
    setTheme(t);
    syncPreference({ theme: t });
  }

  function handleSetFontFamily(f: ReaderFontFamily) {
    setFontFamily(f);
    syncPreference({ fontFamily: f });
  }

  function handleSetLineWidth(lw: number) {
    setLineWidth(lw);
    syncPreference({ lineWidth: lw });
  }

  function handleToggleListen() {
    const next = !listenEnabled;
    setListenEnabled(next);
    if (!next) stopSpeech();
    syncPreference({ listenEnabled: next });
  }

  function handleSetSpeechRate(rate: number) {
    setSpeechRate(rate);
    stopSpeech();
    syncPreference({ speechRate: rate });
  }

  // Pemutaran Teks Audio Aktif
  const currentCardItem = allCards[currentCardIndex];

  const handleSpeakCurrent = React.useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();

    let textToSpeak = "";
    if (structure === "focus") {
      if (!currentCardItem) return;
      const title = currentCardItem.card.title;
      const body = easyRead ? currentCardItem.card.easyText : currentCardItem.card.originalText;
      textToSpeak = `${title}. ${body}`;
    } else {
      textToSpeak = lesson.content.sections
        .map((sec) => {
          const title = sec.title;
          const body = (easyRead ? sec.easyRead : sec.standard)
            .map((p) => p.text)
            .join(". ");
          return `${title}. ${body}`;
        })
        .join(". ");
    }

    if (!textToSpeak.trim()) return;

    const detectedLang = detectLanguage(textToSpeak);
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = speechRate;
    utterance.lang = detectedLang;

    // Prioritaskan suara sesuai bahasa yang terdeteksi otomatis
    if (selectedVoiceUri) {
      const v = voices.find((vox) => vox.voiceURI === selectedVoiceUri);
      if (v) utterance.voice = v;
    } else {
      const bestVoice = getBestVoiceForLanguage(voices, detectedLang);
      if (bestVoice) {
        utterance.voice = bestVoice;
        utterance.lang = bestVoice.lang;
      }
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [
    isPaused,
    isPlaying,
    structure,
    currentCardItem,
    easyRead,
    lesson,
    speechRate,
    selectedVoiceUri,
    voices,
  ]);

  // Simpan Progres Membaca ke Database
  React.useEffect(() => {
    if (structure !== "focus" || allCards.length === 0) return;
    const current = allCards[currentCardIndex];
    if (!current) return;

    const timer = setTimeout(async () => {
      try {
        await apiFetch(`/materials/${lesson.materialId}/progress`, {
          method: "PUT",
          body: {
            lessonVersionId: lesson.id,
            cardId: current.card.id,
            cardIndex: currentCardIndex,
            sectionId: lesson.content.sections[current.sectionIndex]?.id,
            scrollFraction: (currentCardIndex + 1) / allCards.length,
            isCompleted: currentCardIndex === allCards.length - 1,
          },
          csrfToken,
        });
      } catch {
        // Abaikan kegagalan jaringan saat background sync
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [currentCardIndex, structure, allCards, lesson, csrfToken]);

  // Keyboard navigation untuk Mode Fokus
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (structure !== "focus") return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        if (currentCardIndex < allCards.length - 1) {
          setCurrentCardIndex((i) => i + 1);
        }
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        if (currentCardIndex > 0) {
          setCurrentCardIndex((i) => i - 1);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [structure, currentCardIndex, allCards.length]);

  // Styling Tema Warna Khusus Kartu Membaca (Hanya mengubah kartu di dalam, bukan latar halaman)
  const cardTheme = {
    light: {
      card: "bg-surface border-line shadow-sm text-ink",
      title: "text-ink",
      subtitle: "text-muted",
      tag: "text-primary",
      heading: "text-ink",
      body: "text-ink",
      divider: "border-line",
      sectionBadge: "bg-primary text-white",
      glossaryCard: "bg-surface-subtle border-line text-ink",
      glossaryTerm: "text-ink",
      glossaryDef: "text-muted",
      easyReadDot: "bg-primary",
      completeBox: "border-line bg-surface-subtle/50",
    },
    sepia: {
      card: "bg-[#FBF3E5] border-[#DFCFA9] shadow-sm text-[#30281F]",
      title: "text-[#30281F]",
      subtitle: "text-[#6B5A45]",
      tag: "text-[#7A5B36]",
      heading: "text-[#30281F]",
      body: "text-[#30281F]",
      divider: "border-[#DFCFA9]",
      sectionBadge: "bg-[#7A5B36] text-[#FBF3E5]",
      glossaryCard: "bg-[#F4E8D3] border-[#DFCFA9] text-[#30281F]",
      glossaryTerm: "text-[#30281F]",
      glossaryDef: "text-[#6B5A45]",
      easyReadDot: "bg-[#7A5B36]",
      completeBox: "border-[#DFCFA9] bg-[#F4E8D3]/60",
    },
    "high-contrast": {
      card: "bg-[#18181b] border-white/25 shadow-lg text-white",
      title: "text-white",
      subtitle: "text-zinc-300",
      tag: "text-indigo-300",
      heading: "text-white",
      body: "text-zinc-100",
      divider: "border-white/20",
      sectionBadge: "bg-white text-black font-bold",
      glossaryCard: "bg-zinc-900 border-white/20 text-white",
      glossaryTerm: "text-white font-semibold",
      glossaryDef: "text-zinc-300",
      easyReadDot: "bg-white",
      completeBox: "border-white/20 bg-white/5",
    },
  }[theme];

  const activeBadgeClasses = {
    light: "bg-primary-subtle text-primary border-primary/20",
    sepia: "bg-[#ebddc0] text-[#5c421e] border-[#DFCFA9]",
    "high-contrast": "bg-white text-black font-bold border-white",
  }[theme];

  // Font family class
  const fontClass = {
    inter: "font-sans",
    system: "font-system-mono",
    atkinson: "font-atkinson",
  }[fontFamily];

  // Dynamic paragraph gap according to line-height
  const paragraphGapClass = {
    1.5: "space-y-3.5",
    1.7: "space-y-5",
    2.0: "space-y-7",
  }[lineHeight as 1.5 | 1.7 | 2.0] || "space-y-5";

  // Max width container reader - wider, spacious and balanced
  const maxLineWidthClass = {
    45: "max-w-3xl",
    60: "max-w-5xl",
    75: "max-w-6xl",
  }[lineWidth as 45 | 60 | 75] || "max-w-5xl";

  return (
    <div className={`min-h-dvh flex flex-col bg-canvas text-ink transition-colors duration-200 ${fontClass}`}>
      {/* Sticky Reader Header */}
      <header className="sticky top-0 z-50 w-full border-b border-line bg-surface/90 backdrop-blur-md px-4 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/siswa/kelas/${classId}`}
              className="inline-flex size-9 items-center justify-center rounded-btn border border-line bg-surface text-muted transition-colors hover:bg-surface-subtle hover:text-ink"
              aria-label="Kembali ke daftar materi kelas"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Link>

            <div className="hidden sm:block">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                {lesson.subject}
              </span>
              <h1 className="font-heading text-sm font-bold text-ink truncate max-w-xs md:max-w-md">
                {lesson.title}
              </h1>
            </div>
          </div>

          {/* Toolbar Akses & Mode Belajar */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* 1. Pemilihan Struktur: Standard vs Fokus */}
            <div className="flex items-center rounded-btn bg-surface-subtle p-0.5 border border-line">
              <button
                type="button"
                onClick={() => handleSetStructure("focus")}
                className={`flex items-center gap-1.5 rounded-btn px-2.5 py-1 text-xs font-semibold transition-all ${
                  structure === "focus"
                    ? "bg-surface text-primary shadow-xs"
                    : "text-muted hover:text-ink"
                }`}
                aria-pressed={structure === "focus"}
              >
                <Sparkles className="size-3.5" aria-hidden="true" />
                <span className="hidden xs:inline">Fokus</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetStructure("standard")}
                className={`flex items-center gap-1.5 rounded-btn px-2.5 py-1 text-xs font-semibold transition-all ${
                  structure === "standard"
                    ? "bg-surface text-primary shadow-xs"
                    : "text-muted hover:text-ink"
                }`}
                aria-pressed={structure === "standard"}
              >
                <BookOpen className="size-3.5" aria-hidden="true" />
                <span className="hidden xs:inline">Standard</span>
              </button>
            </div>

            {/* 2. Sakelar Lapisan: Easy Read */}
            <button
              type="button"
              onClick={handleToggleEasyRead}
              className={`flex items-center gap-1.5 rounded-btn px-2.5 py-1.5 text-xs font-semibold border transition-all ${
                easyRead
                  ? "bg-primary text-on-primary border-primary shadow-xs"
                  : "bg-surface text-ink border-line hover:bg-surface-subtle"
              }`}
              aria-pressed={easyRead}
              title="Bahasa lebih ringkas dan sederhana"
            >
              <Layers className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Easy Read</span>
            </button>

            {/* 3. Sakelar Lapisan: Dengarkan (Listen / Web Speech) */}
            {speechSupported && (
              <button
                type="button"
                onClick={handleToggleListen}
                className={`flex items-center gap-1.5 rounded-btn px-2.5 py-1.5 text-xs font-semibold border transition-all ${
                  listenEnabled
                    ? "bg-[#6366F1] text-white border-[#6366F1] shadow-xs"
                    : "bg-surface text-ink border-line hover:bg-surface-subtle"
                }`}
                aria-pressed={listenEnabled}
                title="Buka panel dengarkan suara materi"
              >
                <Volume2 className="size-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Dengarkan</span>
              </button>
            )}

            {/* 4. Popover Pengaturan Kenyamanan Membaca */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={`flex size-9 items-center justify-center rounded-btn border transition-colors ${
                  settingsOpen
                    ? "bg-primary-subtle text-primary border-primary"
                    : "bg-surface text-ink border-line hover:bg-surface-subtle"
                }`}
                aria-label="Pengaturan kenyamanan membaca"
              >
                <Sliders className="size-4" aria-hidden="true" />
              </button>

              {settingsOpen && (
                <div className="absolute right-0 top-11 z-50 w-80 rounded-surface border border-line bg-surface p-4 shadow-xl text-ink">
                  <div className="flex items-center justify-between border-b border-line pb-2 mb-3">
                    <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-muted">
                      Kenyamanan Membaca
                    </h3>
                    <span className="text-[10px] text-emerald font-semibold flex items-center gap-1">
                      <Check className="size-3" /> Tersimpan Otomatis
                    </span>
                  </div>

                  {/* Ukuran Huruf */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Ukuran Huruf</span>
                      <span className="font-mono">{fontSize} px</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {[18, 20, 22, 24, 28].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handleSetFontSize(size)}
                          className={`rounded py-1 text-xs font-semibold border ${
                            fontSize === size
                              ? "bg-primary text-on-primary border-primary"
                              : "border-line bg-surface-subtle hover:bg-surface"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Kerapatan Baris */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Kerapatan Baris</span>
                      <span className="font-mono">{lineHeight}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {[1.5, 1.7, 2.0].map((lh) => (
                        <button
                          key={lh}
                          type="button"
                          onClick={() => handleSetLineHeight(lh)}
                          className={`rounded py-1 text-xs font-semibold border ${
                            lineHeight === lh
                              ? "bg-primary text-on-primary border-primary"
                              : "border-line bg-surface-subtle hover:bg-surface"
                          }`}
                        >
                          {lh === 1.5 ? "Rapat" : lh === 1.7 ? "Normal" : "Lebar"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Jenis Huruf */}
                  <div className="space-y-1.5 mb-3">
                    <span className="text-xs font-semibold block">Jenis Huruf</span>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: "inter", label: "Inter (Standar)" },
                        { id: "atkinson", label: "Hyperlegible" },
                        { id: "system", label: "Sistem Mono" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => handleSetFontFamily(f.id as ReaderFontFamily)}
                          className={`rounded py-1 px-1.5 text-[11px] font-semibold border text-center ${
                            fontFamily === f.id
                              ? "bg-primary text-on-primary border-primary"
                              : "border-line bg-surface-subtle hover:bg-surface"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lebar Kolom Baca */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Lebar Kolom Paragraf</span>
                      <span className="font-mono">{lineWidth} ch</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {[45, 60, 75].map((lw) => (
                        <button
                          key={lw}
                          type="button"
                          onClick={() => handleSetLineWidth(lw)}
                          className={`rounded py-1 text-xs font-semibold border ${
                            lineWidth === lw
                              ? "bg-primary text-on-primary border-primary"
                              : "border-line bg-surface-subtle hover:bg-surface"
                          }`}
                        >
                          {lw === 45 ? "Sempit" : lw === 60 ? "Sedang" : "Lebar"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tema Latar Belakang */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold block">Warna Latar Baca</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSetTheme("light")}
                        className={`rounded p-2 text-xs font-semibold border text-center ${
                          theme === "light"
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-line"
                        } bg-canvas text-ink`}
                      >
                        Terang
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetTheme("sepia")}
                        className={`rounded p-2 text-xs font-semibold border text-center ${
                          theme === "sepia"
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-line"
                        } bg-[#FBF3E5] text-[#30281F]`}
                      >
                        Sepia
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetTheme("high-contrast")}
                        className={`rounded p-2 text-xs font-semibold border text-center ${
                          theme === "high-contrast"
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-line"
                        } bg-black text-white`}
                      >
                        Kontras
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Audio Toolbar (Muncul saat Dengarkan diaktifkan) */}
        {listenEnabled && speechSupported && (
          <div className="mt-2.5 mx-auto max-w-6xl rounded-lg border border-[#6366F1]/30 bg-[#6366F1]/10 px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 text-ink">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-[#6366F1] text-white">
                <Volume2 className="size-3.5" />
              </span>
              <div>
                <p className="text-xs font-bold leading-tight">
                  {structure === "focus" ? "Audio Kartu Aktif" : "Audio Paragraf Materi"}
                </p>
                <p className="text-[11px] text-muted">
                  {isPlaying ? "Sedang membacakan konten..." : isPaused ? "Audio dijeda" : "Klik Putar untuk mendengarkan"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Tombol Putar / Jeda */}
              <Button
                size="sm"
                variant="primary"
                onClick={handleSpeakCurrent}
                className="gap-1.5 h-8 bg-[#6366F1] hover:bg-[#4F46E5] text-white"
              >
                {isPlaying ? (
                  <>
                    <Pause className="size-3.5" />
                    <span>Jeda</span>
                  </>
                ) : (
                  <>
                    <Play className="size-3.5" />
                    <span>{isPaused ? "Lanjutkan" : "Putar"}</span>
                  </>
                )}
              </Button>

              {/* Tombol Berhenti */}
              {(isPlaying || isPaused) && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={stopSpeech}
                  className="gap-1.5 h-8 text-rose-600 hover:text-rose-700"
                >
                  <Square className="size-3.5" />
                  <span>Hentikan</span>
                </Button>
              )}

              {/* Pengatur Kecepatan Suara */}
              <div className="flex items-center rounded-btn bg-surface border border-line p-0.5 text-xs">
                <span className="px-1.5 text-muted flex items-center">
                  <Gauge className="size-3" />
                </span>
                {[0.75, 1, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleSetSpeechRate(rate)}
                    className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                      speechRate === rate
                        ? "bg-[#6366F1] text-white font-bold"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    {rate}×
                  </button>
                ))}
              </div>

              {/* Pilihan Suara Bahasa Indonesia bila ada */}
              {voices.length > 0 && (
                <select
                  value={selectedVoiceUri || ""}
                  onChange={(e) => {
                    setSelectedVoiceUri(e.target.value || null);
                    syncPreference({ voiceUri: e.target.value || null });
                    stopSpeech();
                  }}
                  className="rounded-btn border border-line bg-surface px-2 py-1 text-[11px] font-medium text-ink focus:outline-none max-w-[140px] truncate"
                  title="Pilih Suara Pembaca"
                >
                  <option value="">Suara Otomatis (Sesuai Bahasa)</option>
                  {voices.map((vox) => (
                    <option key={vox.voiceURI} value={vox.voiceURI}>
                      {vox.name} ({vox.lang})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Konten Membaca Utama */}
      <main id="konten-utama" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {/* Banner Lanjutkan dari Progres Terakhir */}
        {showResumeBanner && (
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary-subtle/50 p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="size-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-bold text-ink">
                  Lanjutkan Belajar?
                </p>
                <p className="text-xs text-muted">
                  Kamu sebelumnya sudah membaca sampai Kartu #{savedCardIndex + 1}:{" "}
                  <span className="font-semibold text-ink">
                    {allCards[savedCardIndex]?.card.title}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setCurrentCardIndex(savedCardIndex);
                  setShowResumeBanner(false);
                }}
              >
                Lanjutkan
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowResumeBanner(false)}
              >
                Mulai dari Awal
              </Button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 1. STRUKTUR: MODE KARTU FOKUS (Focus Cards)             */}
        {/* ======================================================== */}
        {structure === "focus" && (
          <div className="flex flex-col items-center">
            {allCards.length === 0 ? (
              <div className="p-8 text-center text-muted">Tidak ada kartu materi tersedia.</div>
            ) : (
              <div className={`w-full ${maxLineWidthClass}`}>
                {/* Progress Bar & Indikator Kartu */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-md px-2.5 py-0.5 text-xs font-bold border ${activeBadgeClasses}`}>
                      {currentCardItem.card.kind === "recap"
                        ? "★ Ringkasan Utama"
                        : `Kartu ${currentCardIndex + 1} dari ${allCards.length}`}
                    </span>
                    <span className="text-xs font-medium text-muted truncate max-w-xs">
                      {currentCardItem.sectionTitle}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-semibold text-muted">
                    {Math.round(((currentCardIndex + 1) / allCards.length) * 100)}% Selesai
                  </span>
                </div>

                {/* Progress bar track */}
                <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{
                      width: `${((currentCardIndex + 1) / allCards.length) * 100}%`,
                    }}
                  />
                </div>

                {/* Kartu Konsep Fokus */}
                <div
                  className={`rounded-[28px] border p-8 sm:p-12 transition-all duration-200 ${cardTheme.card} ${fontClass}`}
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: lineHeight,
                    letterSpacing: `${letterSpacing}em`,
                  }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className={`text-xs font-bold uppercase tracking-wider ${cardTheme.tag}`}>
                      {currentCardItem.card.kind === "recap" ? "Ringkasan Pembelajaran" : "Gagasan Inti"}
                    </span>

                    <div className="flex items-center gap-2">
                      {easyRead && (
                        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${theme === "high-contrast" ? "bg-white/10 text-white" : "bg-primary-subtle text-primary"}`}>
                          Easy Read Aktif
                        </span>
                      )}
                      {isPlaying && (
                        <span className="inline-flex items-center gap-1 rounded bg-[#6366F1]/10 text-[#6366F1] px-2 py-0.5 text-xs font-semibold animate-pulse">
                          <Volume2 className="size-3" /> Membaca...
                        </span>
                      )}
                    </div>
                  </div>

                  <h2 className={`font-heading text-2xl font-bold tracking-tight sm:text-3xl mb-6 ${cardTheme.title}`}>
                    {currentCardItem.card.title}
                  </h2>

                  <p style={{ lineHeight }} className={`transition-all duration-150 ${cardTheme.body}`}>
                    {easyRead
                      ? currentCardItem.card.easyText
                      : currentCardItem.card.originalText}
                  </p>
                </div>

                {/* Navigasi Kartu Sebelumnya / Selanjutnya */}
                <div className="mt-8 flex items-center justify-between gap-4">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => setCurrentCardIndex((i) => Math.max(0, i - 1))}
                    disabled={currentCardIndex === 0}
                    className="gap-2"
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                    <span>Sebelumnya</span>
                  </Button>

                  <div className="hidden sm:block text-center text-xs text-muted">
                    Navigasi tombol panah <kbd className="font-mono rounded border px-1">←</kbd>{" "}
                    <kbd className="font-mono rounded border px-1">→</kbd>
                  </div>

                  {currentCardIndex < allCards.length - 1 ? (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => setCurrentCardIndex((i) => Math.min(allCards.length - 1, i + 1))}
                      className="gap-2 shadow-xs"
                    >
                      <span>Selanjutnya</span>
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      asChild
                      className="gap-2 bg-emerald hover:bg-emerald/90 text-white"
                    >
                      <Link href={`/siswa/kelas/${classId}`}>
                        <CheckCircle className="size-4" aria-hidden="true" />
                        <span>Selesai Membaca</span>
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. STRUKTUR: MODE BACA STANDARD (Full Article)          */}
        {/* ======================================================== */}
        {structure === "standard" && (
          <div className={`mx-auto ${maxLineWidthClass}`}>
            <article
              className={`rounded-[28px] border p-7 sm:p-12 md:p-14 space-y-12 transition-all duration-200 ${cardTheme.card} ${fontClass}`}
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
                letterSpacing: `${letterSpacing}em`,
              }}
            >
              {/* Header Artikel */}
              <div className={`border-b pb-8 ${cardTheme.divider}`}>
                <span className={`text-xs font-semibold uppercase tracking-wider ${cardTheme.subtitle}`}>
                  {lesson.subject} • Pengajar: {lesson.teacherName}
                </span>
                <h1 className={`mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl ${cardTheme.title}`}>
                  {lesson.title}
                </h1>
                {lesson.description && (
                  <p style={{ lineHeight }} className={`mt-3 text-base ${cardTheme.subtitle}`}>
                    {lesson.description}
                  </p>
                )}
              </div>

              {/* Bagian per Bagian */}
              {lesson.content.sections.map((sec, sIdx) => (
                <section
                  key={sec.id}
                  className={`space-y-6 ${sIdx > 0 ? `pt-10 sm:pt-14 border-t ${cardTheme.divider}` : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${cardTheme.sectionBadge}`}>
                      {sIdx + 1}
                    </span>
                    <h2 className={`font-heading text-xl sm:text-2xl font-bold tracking-tight ${cardTheme.heading}`}>
                      {sec.title}
                    </h2>
                  </div>

                  {/* Paragraf Bacaan (Original vs Easy Read) */}
                  <div className={paragraphGapClass}>
                    {easyRead ? (
                      <div className={paragraphGapClass}>
                        {sec.easyRead.map((er, idx) => (
                          <p key={idx} style={{ lineHeight }} className="flex items-start gap-3 transition-all duration-150">
                            <span className={`mt-2.5 size-2 rounded-full shrink-0 ${cardTheme.easyReadDot}`} />
                            <span style={{ lineHeight }}>{er.text}</span>
                          </p>
                        ))}
                      </div>
                    ) : (
                      sec.standard.map((std, idx) => (
                        <p key={idx} style={{ lineHeight }} className="transition-all duration-150">
                          {std.text}
                        </p>
                      ))
                    )}
                  </div>

                  {/* Glosarium Istilah Terkait */}
                  {sec.glossary.length > 0 && (
                    <div className={`mt-8 mb-2 rounded-2xl border p-5 sm:p-6 ${cardTheme.glossaryCard}`}>
                      <div className="flex items-center gap-2 text-xs font-bold mb-3.5">
                        <HelpCircle className="size-4 text-primary" aria-hidden="true" />
                        <span className={cardTheme.heading}>Istilah Penting pada Bagian Ini:</span>
                      </div>

                      <div className="grid gap-3.5 sm:grid-cols-2 text-xs">
                        {sec.glossary.map((glo, gIdx) => (
                          <div
                            key={gIdx}
                            className={`rounded-xl p-3.5 border ${
                              theme === "high-contrast"
                                ? "bg-black/50 border-white/10"
                                : "bg-canvas/60 border-line-subtle"
                            }`}
                          >
                            <span className={`font-bold block text-sm ${cardTheme.glossaryTerm}`}>
                              {glo.term}
                            </span>
                            <p style={{ lineHeight }} className={`mt-1.5 ${cardTheme.glossaryDef}`}>
                              {glo.definition}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              ))}

              {/* Box Selesai Membaca di Bawah Artikel */}
              <div className={`rounded-xl border p-5 flex flex-col sm:flex-row items-center justify-between gap-4 ${cardTheme.completeBox}`}>
                <div>
                  <p className={`text-sm font-bold ${cardTheme.heading}`}>
                    Selesai Membaca Materi Ini?
                  </p>
                  <p className={`text-xs ${cardTheme.subtitle}`}>
                    Progres membacamu tersimpan otomatis. Kamu bisa kembali ke kelas untuk membaca materi lain.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  asChild
                  className="gap-2 bg-emerald hover:bg-emerald/90 text-white font-semibold shadow-xs shrink-0"
                >
                  <Link href={`/siswa/kelas/${classId}`}>
                    <CheckCircle className="size-4" aria-hidden="true" />
                    <span>Selesai Membaca</span>
                  </Link>
                </Button>
              </div>
            </article>
          </div>
        )}
      </main>
    </div>
  );
}
