"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  SlidersHorizontal,
  BookOpen,
  AlignLeft,
  HelpCircle,
  CheckCircle,
  Volume2,
  Play,
  Pause,
  Square,
  Check,
  ChevronDown,
  X,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichText } from "@/components/reader/rich-text";
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
  const settingsRef = React.useRef<HTMLDivElement>(null);

  // Tutup dropdown otomatis saat klik di luar atau tekan tombol Escape
  React.useEffect(() => {
    if (!settingsOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [settingsOpen]);

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

    // Otomatis memilih suara terbaik sesuai bahasa teks yang terdeteksi
    const bestVoice = getBestVoiceForLanguage(voices, detectedLang);
    if (bestVoice) {
      utterance.voice = bestVoice;
      utterance.lang = bestVoice.lang;
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
      {/* Sticky Reader Header (Solid bg-surface completely prevents scroll bleed-through) */}
      <header className="sticky top-0 z-50 w-full border-b border-line bg-surface px-4 py-2.5 sm:px-6 shadow-2xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/siswa/kelas/${classId}`}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-btn border border-line bg-surface text-muted transition-colors hover:bg-surface-subtle hover:text-ink"
              aria-label="Kembali ke daftar materi kelas"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Link>

            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
                {lesson.subject}
              </span>
              <h1 className="font-heading text-sm font-bold text-ink truncate max-w-[200px] xs:max-w-xs sm:max-w-sm md:max-w-md">
                {lesson.title}
              </h1>
            </div>
          </div>

          {/* Menu Dropdown Tunggal Pengaturan & Mode Membaca */}
          <div className="relative" ref={settingsRef}>
            <button
              type="button"
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`flex items-center gap-2 rounded-btn border px-3 py-1.5 text-xs font-semibold transition-all ${
                settingsOpen
                  ? "bg-primary text-white border-primary shadow-xs"
                  : "bg-surface text-ink border-line hover:bg-surface-subtle"
              }`}
              aria-expanded={settingsOpen}
              aria-haspopup="dialog"
              aria-label="Buka pengaturan dan opsi baca"
            >
              <SlidersHorizontal className="size-3.5" aria-hidden="true" />
              <span>Pengaturan Baca</span>
              {isPlaying && (
                <span className="size-2 rounded-full bg-emerald animate-pulse" title="Audio sedang memutar" />
              )}
              <ChevronDown
                className={`size-3.5 transition-transform duration-200 ${
                  settingsOpen ? "rotate-180 text-white" : "text-muted"
                }`}
                aria-hidden="true"
              />
            </button>

            {settingsOpen && (
              <div
                role="dialog"
                aria-label="Pengaturan dan Mode Membaca"
                className="absolute right-0 top-full mt-2 z-50 w-84 sm:w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-2xl text-ink max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain space-y-3.5 pr-3 sm:pr-4"
              >
                {/* Header Dropdown */}
                <div className="flex items-center justify-between border-b border-line pb-2.5">
                  <div>
                    <h3 className="font-heading text-sm font-bold text-ink leading-tight">
                      Pengaturan Membaca
                    </h3>
                    <p className="text-[11px] text-muted">Sesuaikan kenyamanan & format bacaan</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald font-semibold flex items-center gap-1 bg-emerald/10 px-2 py-0.5 rounded-full">
                      <Check className="size-3" /> Tersimpan Otomatis
                    </span>
                    <button
                      type="button"
                      onClick={() => setSettingsOpen(false)}
                      className="rounded-lg p-1 text-muted hover:text-ink hover:bg-surface-subtle transition-colors"
                      aria-label="Tutup pengaturan"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>

                {/* 1. Format Bacaan */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-ink block">Format Bacaan</span>
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-surface-subtle border border-line">
                    <button
                      type="button"
                      onClick={() => handleSetStructure("standard")}
                      className={`flex items-center justify-center gap-2 rounded-lg py-1.5 px-2 text-xs font-semibold transition-all ${
                        structure === "standard"
                          ? "bg-surface text-primary shadow-xs border border-line"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      <AlignLeft className="size-3.5" />
                      <span>Teks Standar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetStructure("focus")}
                      className={`flex items-center justify-center gap-2 rounded-lg py-1.5 px-2 text-xs font-semibold transition-all ${
                        structure === "focus"
                          ? "bg-surface text-primary shadow-xs border border-line"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      <BookOpen className="size-3.5" />
                      <span>Kartu Fokus</span>
                    </button>
                  </div>
                </div>

                {/* 2. Easy Read Switch */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-line bg-surface-subtle/40">
                  <div className="pr-2">
                    <div className="flex items-center gap-1.5">
                      <Layers className="size-3.5 text-primary" />
                      <span className="text-xs font-bold text-ink">
                        Easy Read (Bahasa Ringkas)
                      </span>
                    </div>
                    <p className="text-[11px] text-muted leading-tight mt-0.5">
                      Sederhanakan kalimat agar lebih cepat & mudah dipahami
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={easyRead}
                    onClick={handleToggleEasyRead}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      easyRead ? "bg-primary" : "bg-line"
                    }`}
                    aria-label="Aktifkan mode Easy Read"
                  >
                    <span
                      className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        easyRead ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 3. Audio Narasi (Text-to-Speech) - Otomatis deteksi bahasa teks */}
                {speechSupported && (
                  <div className="space-y-2 rounded-xl border border-line p-3 bg-surface-subtle/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Volume2 className="size-3.5 text-primary" />
                        <span className="text-xs font-bold text-ink">Audio Pembaca</span>
                      </div>
                      {isPlaying ? (
                        <span className="text-[10px] font-semibold text-primary animate-pulse flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-primary" /> Membaca...
                        </span>
                      ) : isPaused ? (
                        <span className="text-[10px] font-semibold text-amber-600">
                          Dijeda
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSpeakCurrent}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-hover text-white py-1.5 px-3 text-xs font-semibold transition-colors shadow-xs"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="size-3.5" />
                            <span>Jeda Audio</span>
                          </>
                        ) : (
                          <>
                            <Play className="size-3.5 fill-current" />
                            <span>{isPaused ? "Lanjutkan" : "Putar Suara"}</span>
                          </>
                        )}
                      </button>

                      {(isPlaying || isPaused) && (
                        <button
                          type="button"
                          onClick={stopSpeech}
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-line bg-surface hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 py-1.5 px-3 text-xs font-semibold text-muted transition-colors"
                          title="Hentikan pembacaan"
                        >
                          <Square className="size-3.5" />
                          <span>Berhenti</span>
                        </button>
                      )}
                    </div>

                    {/* Kecepatan Suara */}
                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-muted">
                        <span>Kecepatan Narasi</span>
                        <span className="font-mono text-ink font-bold">{speechRate}×</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[0.75, 1, 1.25, 1.5].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => handleSetSpeechRate(rate)}
                            className={`rounded-lg py-1 text-xs font-semibold border transition-all ${
                              speechRate === rate
                                ? "bg-primary text-white border-primary shadow-xs"
                                : "border-line bg-surface text-ink hover:bg-surface-subtle"
                            }`}
                          >
                            {rate}×
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Tema Latar Kertas */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-ink block">Warna Latar Baca</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        id: "light",
                        label: "Terang",
                        swatchClass: "bg-surface border-line text-ink",
                      },
                      {
                        id: "sepia",
                        label: "Sepia",
                        swatchClass: "bg-[#FBF3E5] border-[#DFCFA9] text-[#30281F]",
                      },
                      {
                        id: "high-contrast",
                        label: "Kontras",
                        swatchClass: "bg-[#18181b] border-white/20 text-white",
                      },
                    ].map((t) => {
                      const isSelected = theme === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleSetTheme(t.id as ReaderTheme)}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? "border-primary bg-primary-subtle/30 ring-2 ring-primary/40 shadow-xs"
                              : "border-line bg-surface hover:bg-surface-subtle"
                          }`}
                        >
                          <div
                            className={`size-7 rounded-md border flex items-center justify-center font-heading font-bold text-xs mb-1 shadow-2xs ${t.swatchClass}`}
                          >
                            Aa
                          </div>
                          <span className="text-[11px] font-bold text-ink">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Ukuran Huruf */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-ink">
                    <span>Ukuran Huruf</span>
                    <span className="font-mono text-primary font-bold">{fontSize} px</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {[18, 20, 22, 24, 28].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleSetFontSize(size)}
                        className={`rounded-lg py-1.5 text-xs font-semibold border transition-all ${
                          fontSize === size
                            ? "bg-primary text-white border-primary shadow-xs"
                            : "border-line bg-surface text-ink hover:bg-surface-subtle"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. Kerapatan Baris (Baris Mandiri Penuh) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-ink">
                    <span>Kerapatan Baris</span>
                    <span className="font-mono text-primary font-bold">{lineHeight}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { lh: 1.5, label: "Rapat (1.5)" },
                      { lh: 1.7, label: "Normal (1.7)" },
                      { lh: 2.0, label: "Lebar (2.0)" },
                    ].map(({ lh, label }) => (
                      <button
                        key={lh}
                        type="button"
                        onClick={() => handleSetLineHeight(lh)}
                        className={`rounded-lg py-1.5 text-xs font-semibold border whitespace-nowrap transition-all ${
                          lineHeight === lh
                            ? "bg-primary text-white border-primary shadow-xs"
                            : "border-line bg-surface text-ink hover:bg-surface-subtle"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 7. Lebar Kolom Paragraf (Baris Mandiri Penuh) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-ink">
                    <span>Lebar Kolom Paragraf</span>
                    <span className="font-mono text-primary font-bold">{lineWidth} ch</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { lw: 45, label: "Sempit (45)" },
                      { lw: 60, label: "Sedang (60)" },
                      { lw: 75, label: "Lebar (75)" },
                    ].map(({ lw, label }) => (
                      <button
                        key={lw}
                        type="button"
                        onClick={() => handleSetLineWidth(lw)}
                        className={`rounded-lg py-1.5 text-xs font-semibold border whitespace-nowrap transition-all ${
                          lineWidth === lw
                            ? "bg-primary text-white border-primary shadow-xs"
                            : "border-line bg-surface text-ink hover:bg-surface-subtle"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 8. Jenis Huruf */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-ink block">Jenis Huruf</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "inter", label: "Inter (Standar)" },
                      { id: "atkinson", label: "Hyperlegible" },
                      { id: "system", label: "Sistem Mono" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleSetFontFamily(f.id as ReaderFontFamily)}
                        className={`rounded-lg py-1.5 px-1 text-[11px] font-semibold border text-center transition-all ${
                          fontFamily === f.id
                            ? "bg-primary text-white border-primary shadow-xs"
                            : "border-line bg-surface text-ink hover:bg-surface-subtle"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Konten Membaca Utama */}
      <main id="konten-utama" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {/* Banner Lanjutkan dari Progres Terakhir */}
        {showResumeBanner && (
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary-subtle/50 p-4">
            <div className="flex items-center gap-3">
              <Bookmark className="size-5 text-primary shrink-0" />
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
                        <span className="inline-flex items-center gap-1 rounded bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold animate-pulse">
                          <Volume2 className="size-3" /> Membaca...
                        </span>
                      )}
                    </div>
                  </div>

                  <h2 className={`font-heading text-2xl font-bold tracking-tight sm:text-3xl mb-6 ${cardTheme.title}`}>
                    {currentCardItem.card.title}
                  </h2>

                  <RichText
                    text={
                      easyRead
                        ? currentCardItem.card.easyText
                        : currentCardItem.card.originalText
                    }
                    lineHeight={lineHeight}
                    className={`transition-all duration-150 ${cardTheme.body}`}
                  />
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
                          <div key={idx} className="flex items-start gap-3 transition-all duration-150">
                            <span className={`mt-2.5 size-2 rounded-full shrink-0 ${cardTheme.easyReadDot}`} />
                            <RichText text={er.text} lineHeight={lineHeight} className="min-w-0 flex-1" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      sec.standard.map((std, idx) => (
                        <RichText
                          key={idx}
                          text={std.text}
                          lineHeight={lineHeight}
                          className="transition-all duration-150"
                        />
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

      {/* Floating Audio Controller saat audio sedang aktif */}
      {speechSupported && (isPlaying || isPaused) && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full border border-line bg-surface shadow-xl px-3.5 py-2 text-ink">
          <div className="flex items-center gap-2">
            <span className={`size-2.5 rounded-full ${isPlaying ? "bg-primary animate-ping" : "bg-muted"}`} />
            <span className="text-xs font-semibold hidden sm:inline">
              {isPlaying ? "Membacakan..." : "Audio Dijeda"}
            </span>
          </div>

          <div className="flex items-center gap-1 border-l border-line pl-2">
            <button
              type="button"
              onClick={handleSpeakCurrent}
              className="flex size-7 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover transition-colors"
              title={isPlaying ? "Jeda" : "Lanjutkan"}
            >
              {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5 fill-current ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={stopSpeech}
              className="flex size-7 items-center justify-center rounded-full border border-line text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Hentikan Audio"
            >
              <Square className="size-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
