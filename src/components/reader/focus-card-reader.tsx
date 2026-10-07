"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Sparkles,
  Bookmark,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface FocusCardItem {
  id: string;
  kind: "concept" | "recap";
  title: string;
  keyTerm?: string;
  originalText: string;
  easyText: string;
  sourceRef: string;
}

interface FocusCardReaderProps {
  cards: FocusCardItem[];
  defaultEasyRead?: boolean;
  defaultStructure?: "focus" | "standard";
  onProgressChange?: (index: number) => void;
  className?: string;
}

export function FocusCardReader({
  cards,
  defaultEasyRead = true,
  defaultStructure = "focus",
  onProgressChange,
  className = "",
}: FocusCardReaderProps) {
  const [structure, setStructure] = React.useState<"focus" | "standard">(defaultStructure);
  const [easyRead, setEasyRead] = React.useState(defaultEasyRead);
  const [fontSize, setFontSize] = React.useState<20 | 24 | 28>(20);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [direction, setDirection] = React.useState<1 | -1>(1);
  const [isPlaying, setIsPlaying] = React.useState(false);

  const currentCard = cards[currentIndex] || cards[0];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === cards.length - 1;

  // Hentikan audio saat berpindah kartu atau mode
  const stopAudio = React.useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, []);

  function handleNext() {
    if (!isLast) {
      stopAudio();
      setDirection(1);
      setCurrentIndex((prev) => {
        const next = prev + 1;
        onProgressChange?.(next);
        return next;
      });
    }
  }

  function handlePrev() {
    if (!isFirst) {
      stopAudio();
      setDirection(-1);
      setCurrentIndex((prev) => {
        const next = prev - 1;
        onProgressChange?.(next);
        return next;
      });
    }
  }

  // Navigasi keyboard (Panah Kiri & Kanan)
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (structure !== "focus") return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Fitur Audio Web Speech
  function toggleListen() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Browser Anda belum mendukung fitur Web Speech API.");
      return;
    }

    if (isPlaying) {
      stopAudio();
      return;
    }

    const textToRead = easyRead ? currentCard.easyText : currentCard.originalText;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = "id-ID";
    utterance.rate = 0.95;

    // Cari suara id-ID jika tersedia
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find((v) => v.lang.startsWith("id"));
    if (idVoice) utterance.voice = idVoice;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  }

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 16 : -16,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.22, ease: "easeOut" as const },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -16 : 16,
      opacity: 0,
      transition: { duration: 0.16, ease: "easeIn" as const },
    }),
  };

  return (
    <div
      className={`rounded-reader border border-line bg-surface shadow-xs transition-colors duration-200 ${className}`}
    >
      {/* 1. Akses Toolbar Terpadu (Inspirasi Kokonut UI / Manus) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5 sm:px-6">
        {/* Switcher Struktur: Standard vs Focus */}
        <div className="inline-flex items-center rounded-btn border border-line bg-surface-subtle p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              stopAudio();
              setStructure("focus");
            }}
            className={`rounded-btn px-3 py-1.5 transition-all duration-150 ${
              structure === "focus"
                ? "bg-surface text-ink font-semibold shadow-xs"
                : "text-muted hover:text-ink"
            }`}
          >
            Focus Cards
          </button>
          <button
            type="button"
            onClick={() => {
              stopAudio();
              setStructure("standard");
            }}
            className={`rounded-btn px-3 py-1.5 transition-all duration-150 ${
              structure === "standard"
                ? "bg-surface text-ink font-semibold shadow-xs"
                : "text-muted hover:text-ink"
            }`}
          >
            Teks Utuh (Standard)
          </button>
        </div>

        {/* Lapisan Adaptasi Tambahan */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Toggle Bahasa Sederhana */}
          <button
            type="button"
            onClick={() => {
              stopAudio();
              setEasyRead((prev) => !prev);
            }}
            aria-pressed={easyRead}
            className={`inline-flex items-center gap-1.5 rounded-btn border px-2.5 py-1.5 font-medium transition-colors ${
              easyRead
                ? "border-easy-line bg-easy text-easy-ink"
                : "border-line bg-surface text-muted hover:text-ink hover:border-control"
            }`}
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            <span>Bahasa Sederhana</span>
            <span
              className={`size-1.5 rounded-full ${
                easyRead ? "bg-easy-ink" : "bg-line"
              }`}
            />
          </button>

          {/* Toggle Ukuran Teks */}
          <div className="inline-flex items-center rounded-btn border border-line bg-surface p-0.5">
            <button
              type="button"
              onClick={() => setFontSize(20)}
              title="Ukuran teks normal (20px)"
              className={`rounded-btn px-2 py-1 text-xs font-medium ${
                fontSize === 20 ? "bg-surface-inset text-ink font-semibold" : "text-muted hover:text-ink"
              }`}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize(24)}
              title="Ukuran teks sedang (24px)"
              className={`rounded-btn px-2 py-1 text-sm font-medium ${
                fontSize === 24 ? "bg-surface-inset text-ink font-semibold" : "text-muted hover:text-ink"
              }`}
            >
              A+
            </button>
            <button
              type="button"
              onClick={() => setFontSize(28)}
              title="Ukuran teks besar (28px)"
              className={`rounded-btn px-2 py-1 text-base font-medium ${
                fontSize === 28 ? "bg-surface-inset text-ink font-semibold" : "text-muted hover:text-ink"
              }`}
            >
              A++
            </button>
          </div>

          {/* Tombol Audio Dengarkan */}
          <button
            type="button"
            onClick={toggleListen}
            aria-pressed={isPlaying}
            className={`inline-flex items-center gap-1.5 rounded-btn border px-2.5 py-1.5 font-medium transition-colors ${
              isPlaying
                ? "border-listen-line bg-listen text-listen-ink animate-pulse"
                : "border-line bg-surface text-muted hover:text-ink hover:border-control"
            }`}
          >
            {isPlaying ? (
              <>
                <VolumeX className="size-3.5" aria-hidden="true" />
                <span>Hentikan</span>
              </>
            ) : (
              <>
                <Volume2 className="size-3.5" aria-hidden="true" />
                <span>Dengarkan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Konten Bacaan Utama */}
      <div className="p-6 sm:p-8">
        {structure === "focus" ? (
          <div>
            {/* Meta status kartu */}
            <div className="flex items-center justify-between border-b border-line pb-4 text-xs text-muted">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink">
                  Gagasan {currentIndex + 1} dari {cards.length}
                </span>
                {currentCard.kind === "recap" ? (
                  <Badge tone="warning">Ringkasan Konsep</Badge>
                ) : (
                  <Badge tone="primary">Fokus Bacaan</Badge>
                )}
              </div>

              <span className="font-mono text-[11.5px] text-muted">
                {currentCard.sourceRef}
              </span>
            </div>

            {/* Area Bacaan Kartu dengan Transisi Halus Direction-Aware */}
            <div className="relative min-h-[190px] py-6 sm:min-h-[220px]">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={`${currentIndex}-${easyRead}`}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-heading text-xl font-bold tracking-tight text-ink sm:text-2xl">
                      {currentCard.title}
                    </h3>

                    {currentCard.keyTerm ? (
                      <span className="inline-flex items-center gap-1 rounded-sm border border-line bg-surface-subtle px-2 py-0.5 text-xs font-semibold text-ink">
                        <Bookmark className="size-3 text-primary" aria-hidden="true" />
                        {currentCard.keyTerm}
                      </span>
                    ) : null}
                  </div>

                  <p
                    style={{
                      fontSize: `${fontSize}px`,
                      lineHeight: fontSize >= 24 ? 1.6 : 1.7,
                    }}
                    className="editorial-prose text-ink transition-all duration-150"
                  >
                    {easyRead ? currentCard.easyText : currentCard.originalText}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigasi Kartu: Sebelumnya / Berikutnya */}
            <div className="flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
              {/* Progress Segments */}
              <div
                className="flex items-center gap-1.5"
                role="progressbar"
                aria-valuenow={currentIndex + 1}
                aria-valuemin={1}
                aria-valuemax={cards.length}
                aria-label={`Progres membaca: kartu ${currentIndex + 1} dari ${cards.length}`}
              >
                {cards.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      stopAudio();
                      setDirection(i > currentIndex ? 1 : -1);
                      setCurrentIndex(i);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      i === currentIndex
                        ? "w-7 bg-primary"
                        : i < currentIndex
                        ? "w-3 bg-control"
                        : "w-3 bg-line hover:bg-control"
                    }`}
                    aria-label={`Buka gagasan ${i + 1}`}
                  />
                ))}
              </div>

              {/* Tombol Navigasi Sebelumnya & Berikutnya */}
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handlePrev}
                  disabled={isFirst}
                  aria-label="Kembali ke gagasan sebelumnya (Panah Kiri)"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  <span>Sebelumnya</span>
                </Button>

                {isLast ? (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      stopAudio();
                      setDirection(-1);
                      setCurrentIndex(0);
                    }}
                  >
                    <RotateCcw className="size-4" aria-hidden="true" />
                    <span>Ulangi Bacaan</span>
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleNext}
                    aria-label="Lanjut ke gagasan berikutnya (Panah Kanan)"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Mode Standard (Teks Paragraf Utuh) */
          <div className="space-y-6">
            <div className="border-b border-line pb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Struktur Membaca Artikel Utuh
              </span>
              <h3 className="mt-1 font-heading text-2xl font-bold tracking-tight text-ink">
                Bab 4: Sistem Pencernaan — Organ Lambung & Mekanisme Kimiawi
              </h3>
            </div>

            <div className="space-y-4">
              {cards.map((card) => (
                <div key={card.id} className="border-b border-line-subtle pb-4 last:border-none">
                  <div className="flex items-center gap-2 text-xs text-muted mb-1.5">
                    <span className="font-semibold text-ink">{card.title}</span>
                    <span>•</span>
                    <span className="font-mono text-[11px]">{card.sourceRef}</span>
                  </div>
                  <p
                    style={{
                      fontSize: `${fontSize}px`,
                      lineHeight: fontSize >= 24 ? 1.6 : 1.7,
                    }}
                    className="editorial-prose text-ink"
                  >
                    {easyRead ? card.easyText : card.originalText}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Bar Kaki Keterangan Aksesibilitas */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-surface-subtle px-5 py-2.5 text-xs text-muted">
        <span>Gunakan tombol panah ◄ ► pada keyboard untuk berpindah gagasan dengan cepat.</span>
        <span className="font-medium text-ink">Rujukan Terlacak ke Sumber Asli</span>
      </div>
    </div>
  );
}
