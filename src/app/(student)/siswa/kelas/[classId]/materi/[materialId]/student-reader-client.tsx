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
  Share2,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LessonSnapshotDto, SectionCardDto } from "@/shared/schemas/drafts-reader";

interface StudentReaderProps {
  lesson: LessonSnapshotDto;
  classId: string;
}

type ReaderStructure = "standard" | "focus";
type ReaderTheme = "light" | "sepia" | "contrast";

export function StudentReaderClient({ lesson, classId }: StudentReaderProps) {
  // State Preferensi Membaca
  const [structure, setStructure] = React.useState<ReaderStructure>("focus");
  const [easyRead, setEasyRead] = React.useState<boolean>(false);
  const [fontSize, setFontSize] = React.useState<number>(20);
  const [lineHeight, setLineHeight] = React.useState<number>(1.7);
  const [theme, setTheme] = React.useState<ReaderTheme>("light");
  const [settingsOpen, setSettingsOpen] = React.useState<boolean>(false);

  // Flatten semua kartu konsep untuk navigasi Mode Fokus
  const allCards = React.useMemo(() => {
    const list: Array<{ card: SectionCardDto; sectionTitle: string; sectionIndex: number }> = [];
    lesson.content.sections.forEach((sec, sIdx) => {
      sec.cards.forEach((card) => {
        list.push({ card, sectionTitle: sec.title, sectionIndex: sIdx });
      });
    });
    return list;
  }, [lesson]);

  const [currentCardIndex, setCurrentCardIndex] = React.useState<number>(0);

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

  // Styling tema warna dinamis
  const themeClasses = {
    light: "bg-canvas text-ink",
    sepia: "bg-[#fbf0d9] text-[#433422]",
    contrast: "bg-black text-white",
  }[theme];

  const surfaceClasses = {
    light: "bg-surface border-line",
    sepia: "bg-[#f4e6c3] border-[#dfcd9f]",
    contrast: "bg-[#18181b] border-[#27272a]",
  }[theme];

  const currentCardItem = allCards[currentCardIndex];

  return (
    <div className={`min-h-dvh flex flex-col transition-colors duration-200 ${themeClasses}`}>
      {/* Sticky Liquid Glass Reader Header */}
      <header className="sticky top-0 z-50 w-full border-b border-black/[0.06] bg-white/80 backdrop-blur-md shadow-xs transition-colors dark:bg-black/80 dark:border-white/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
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

          {/* Akses & Mode Toolbar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 1. Pemilihan Struktur: Standard vs Fokus */}
            <div className="flex items-center rounded-btn bg-surface-subtle p-0.5 border border-line">
              <button
                type="button"
                onClick={() => setStructure("focus")}
                className={`flex items-center gap-1.5 rounded-btn px-2.5 py-1.5 text-xs font-semibold transition-all ${
                  structure === "focus"
                    ? "bg-surface text-primary shadow-xs"
                    : "text-muted hover:text-ink"
                }`}
                aria-pressed={structure === "focus"}
              >
                <Sparkles className="size-3.5" aria-hidden="true" />
                <span className="hidden xs:inline">Mode Kartu Fokus</span>
                <span className="xs:hidden">Fokus</span>
              </button>

              <button
                type="button"
                onClick={() => setStructure("standard")}
                className={`flex items-center gap-1.5 rounded-btn px-2.5 py-1.5 text-xs font-semibold transition-all ${
                  structure === "standard"
                    ? "bg-surface text-primary shadow-xs"
                    : "text-muted hover:text-ink"
                }`}
                aria-pressed={structure === "standard"}
              >
                <BookOpen className="size-3.5" aria-hidden="true" />
                <span className="hidden xs:inline">Mode Baca Standard</span>
                <span className="xs:hidden">Standard</span>
              </button>
            </div>

            {/* 2. Sakelar Lapisan: Easy Read */}
            <button
              type="button"
              onClick={() => setEasyRead(!easyRead)}
              className={`flex items-center gap-1.5 rounded-btn px-3 py-1.5 text-xs font-semibold border transition-all ${
                easyRead
                  ? "bg-primary text-on-primary border-primary shadow-xs"
                  : "bg-surface text-ink border-line hover:bg-surface-subtle"
              }`}
              aria-pressed={easyRead}
              title="Bahasa lebih ringkas dan sederhana"
            >
              <Layers className="size-3.5" aria-hidden="true" />
              <span>Easy Read</span>
            </button>

            {/* 3. Tombol Panel Pengaturan Kenyamanan Baca */}
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

              {/* Popover Pengaturan */}
              {settingsOpen && (
                <div className="absolute right-0 top-12 z-50 w-72 rounded-surface border border-line bg-surface p-4 shadow-xl text-ink">
                  <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-muted border-b border-line pb-2 mb-3">
                    Kenyamanan Membaca
                  </h3>

                  {/* Ukuran Huruf */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Ukuran Huruf</span>
                      <span className="font-mono">{fontSize} px</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {[18, 20, 22, 24, 28].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setFontSize(size)}
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

                  {/* Jarak Baris */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Kerapatan Baris</span>
                      <span className="font-mono">{lineHeight}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {[1.5, 1.7, 2.0].map((lh) => (
                        <button
                          key={lh}
                          type="button"
                          onClick={() => setLineHeight(lh)}
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

                  {/* Tema Tampilan */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold block">Warna Latar Baca</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTheme("light")}
                        className={`rounded p-2 text-xs font-semibold border text-center ${
                          theme === "light"
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-line"
                        } bg-[#f8f8f5] text-[#1c1917]`}
                      >
                        Terang
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme("sepia")}
                        className={`rounded p-2 text-xs font-semibold border text-center ${
                          theme === "sepia"
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-line"
                        } bg-[#fbf0d9] text-[#433422]`}
                      >
                        Sepia
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme("contrast")}
                        className={`rounded p-2 text-xs font-semibold border text-center ${
                          theme === "contrast"
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
      </header>

      {/* Konten Membaca Utama */}
      <main id="konten-utama" className="mx-auto w-full max-w-4xl flex-1 px-5 py-8 sm:px-8">
        {/* ======================================================== */}
        {/* 1. STRUKTUR: MODE KARTU FOKUS (Focus Cards)             */}
        {/* ======================================================== */}
        {structure === "focus" && (
          <div className="flex flex-col items-center">
            {allCards.length === 0 ? (
              <div className="p-8 text-center text-muted">Tidak ada kartu materi tersedia.</div>
            ) : (
              <div className="w-full max-w-2xl">
                {/* Progress Bar & Indikator Kartu */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-primary-subtle px-2 py-0.5 text-xs font-bold text-primary">
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
                <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{
                      width: `${((currentCardIndex + 1) / allCards.length) * 100}%`,
                    }}
                  />
                </div>

                {/* Kartu Konsep Fokus */}
                <div
                  className={`rounded-2xl border p-7 sm:p-10 shadow-md transition-all ${surfaceClasses}`}
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: lineHeight,
                  }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      {currentCardItem.card.kind === "recap" ? "Ringkasan Pembelajaran" : "Gagasan Inti"}
                    </span>

                    {easyRead ? (
                      <span className="rounded bg-primary-subtle px-2 py-0.5 text-xs font-semibold text-primary">
                        Easy Read Aktif
                      </span>
                    ) : null}
                  </div>

                  <h2 className="font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl mb-6">
                    {currentCardItem.card.title}
                  </h2>

                  <p className="font-sans leading-relaxed text-ink/90">
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

                  <div className="text-center text-xs text-muted">
                    Gunakan tombol panah keyboard <kbd className="font-mono rounded border px-1">←</kbd>{" "}
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
          <article
            className="space-y-12"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight,
            }}
          >
            {/* Header Artikel */}
            <div className="border-b border-line pb-8">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                {lesson.subject} • Pengajar: {lesson.teacherName}
              </span>
              <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                {lesson.title}
              </h1>
              {lesson.description ? (
                <p className="mt-3 text-base text-muted leading-relaxed">
                  {lesson.description}
                </p>
              ) : null}
            </div>

            {/* Bagian per Bagian */}
            {lesson.content.sections.map((sec, sIdx) => (
              <section key={sec.id} className="space-y-6">
                <div className="flex items-center gap-3 border-b border-line pb-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-bold text-primary">
                    {sIdx + 1}
                  </span>
                  <h2 className="font-heading text-2xl font-bold tracking-tight text-ink">
                    {sec.title}
                  </h2>
                </div>

                {/* Paragraf Bacaan (Original vs Easy Read) */}
                <div className="space-y-4 text-ink/90">
                  {easyRead ? (
                    <div className="space-y-3">
                      {sec.easyRead.map((er, idx) => (
                        <p key={idx} className="flex items-start gap-3">
                          <span className="mt-2 size-2 rounded-full bg-primary shrink-0" />
                          <span>{er.text}</span>
                        </p>
                      ))}
                    </div>
                  ) : (
                    sec.standard.map((std, idx) => (
                      <p key={idx} className="leading-relaxed">
                        {std.text}
                      </p>
                    ))
                  )}
                </div>

                {/* Glosarium Istilah Terkait */}
                {sec.glossary.length > 0 && (
                  <div className={`mt-6 rounded-xl border p-5 ${surfaceClasses}`}>
                    <div className="flex items-center gap-2 text-xs font-bold text-primary mb-3">
                      <HelpCircle className="size-4" aria-hidden="true" />
                      <span>Istilah Penting pada Bagian Ini:</span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 text-xs">
                      {sec.glossary.map((glo, gIdx) => (
                        <div key={gIdx} className="rounded-lg bg-canvas/60 p-3 border border-line-subtle">
                          <span className="font-bold text-ink block text-sm">
                            {glo.term}
                          </span>
                          <p className="mt-1 text-muted leading-relaxed">
                            {glo.definition}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            ))}

            <div className="pt-8 border-t border-line text-center">
              <Button variant="primary" size="lg" asChild>
                <Link href={`/siswa/kelas/${classId}`}>
                  <CheckCircle className="size-4" aria-hidden="true" />
                  <span>Selesai Membaca & Kembali ke Kelas</span>
                </Link>
              </Button>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
