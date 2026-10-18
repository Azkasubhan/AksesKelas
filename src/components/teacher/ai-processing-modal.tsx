"use client";

import * as React from "react";
import { Sparkles, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiProcessingModalProps {
  open: boolean;
  title?: string;
  materialTitle?: string;
  mode?: "create" | "regenerate";
}

interface StepItem {
  id: number;
  label: string;
  desc: string;
}

const CREATE_STEPS: StepItem[] = [
  {
    id: 1,
    label: "Mengekstrak dan Memvalidasi Teks Sumber",
    desc: "Memeriksa keutuhan teks, paragraf, dan angka dari dokumen Anda.",
  },
  {
    id: 2,
    label: "Analisis Struktur & Segmentasi Bab",
    desc: "AI membagi materi ke dalam bagian bahasan yang teratur.",
  },
  {
    id: 3,
    label: "Menyusun Varian Easy Read & Kartu Fokus",
    desc: "Menyederhanakan bahasa dan merancang kartu konsep berpasangan.",
  },
  {
    id: 4,
    label: "Ekstraksi Glosarium & Finalisasi Draf",
    desc: "Menyusun definisi istilah penting dan menyiapkan draf tinjauan.",
  },
];

const REGENERATE_STEPS: StepItem[] = [
  {
    id: 1,
    label: "Mempersiapkan Rujukan Blok Sumber",
    desc: "Mengambil data rujukan blok teks asli yang telah terkonfirmasi.",
  },
  {
    id: 2,
    label: "Menggunakan AI untuk Penyusunan Ulang",
    desc: "Menganalisis kembali struktur dan konteks pembelajaran materi.",
  },
  {
    id: 3,
    label: "Menyusun Ulang Easy Read, Kartu Fokus & Glosarium",
    desc: "Menghasilkan variasi adaptasi baru dengan akurasi fakta ilmiah.",
  },
  {
    id: 4,
    label: "Menyimpan Revisi Draf Baru",
    desc: "Memperbarui draf agar siap ditinjau dan disetujui guru.",
  },
];

export function AiProcessingModal({
  open,
  title,
  materialTitle,
  mode = "create",
}: AiProcessingModalProps) {
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    if (!open) {
      setElapsed(0);
      return;
    }

    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [open]);

  if (!open) return null;

  const steps = mode === "create" ? CREATE_STEPS : REGENERATE_STEPS;

  // Tentukan tahap aktif berdasarkan waktu berlalu (progres realistis alur Gemini)
  let activeStepId = 1;
  if (elapsed >= 26) {
    activeStepId = 4;
  } else if (elapsed >= 12) {
    activeStepId = 3;
  } else if (elapsed >= 3) {
    activeStepId = 2;
  }

  // Persentase progres halus antara 15% hingga 92%
  const progressPercent = Math.min(94, Math.round(15 + (elapsed / 32) * 75));

  const displayTitle =
    title ||
    (mode === "create"
      ? "Menyusun Adaptasi Materi dengan AI"
      : "Menyusun Ulang Adaptasi AI");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[3px] animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-[24px] border border-line bg-surface p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.12),0_20px_50px_rgba(0,0,0,0.2)] text-ink">
        {/* Header Indikator */}
        <div className="space-y-1">
          <h2 id="ai-modal-title" className="font-heading text-xl font-bold tracking-tight text-ink sm:text-2xl">
            {displayTitle}
          </h2>
          {materialTitle ? (
            <p className="text-xs text-muted line-clamp-1 font-medium">
              Materi: <span className="text-ink font-semibold">"{materialTitle}"</span>
            </p>
          ) : null}
        </div>  

        {/* Bar Progres */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-ink">
              Tahap {activeStepId} dari {steps.length}
            </span>
            <span className="text-muted tabular-nums font-mono text-[11px]">
              {elapsed} detik berlalu
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-subtle border border-line/60">
            <div
              className="h-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Daftar Tahap Eksekusi */}
        <div className="mt-6 space-y-3 rounded-2xl border border-line bg-surface-subtle/50 p-4 sm:p-5">
          {steps.map((step) => {
            const isCompleted = activeStepId > step.id;
            const isActive = activeStepId === step.id;

            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-3 transition-opacity duration-300",
                  !isActive && !isCompleted ? "opacity-45" : "opacity-100",
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="size-4.5 text-emerald-600" aria-hidden="true" />
                  ) : isActive ? (
                    <Loader2 className="size-4.5 animate-spin text-primary" aria-hidden="true" />
                  ) : (
                    <div className="flex size-4.5 items-center justify-center">
                      <div className="size-2 rounded-full bg-muted/60" />
                    </div>
                  )}
                </div>
                <div className="space-y-0.5">
                  <p
                    className={cn(
                      "text-sm leading-snug",
                      isActive
                        ? "font-bold text-ink"
                        : isCompleted
                        ? "font-semibold text-ink/80"
                        : "text-muted",
                    )}
                  >
                    {step.label}
                  </p>
                  {(isActive || isCompleted) && (
                    <p className="text-xs text-muted leading-relaxed">
                      {step.desc}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Catatan Reassurance Guru */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-line/80 bg-surface-subtle/70 px-4 py-3 text-xs leading-relaxed text-muted">
          <ShieldCheck className="size-4 shrink-0 text-primary mt-0.5" aria-hidden="true" />
          <p>
            Proses adaptasi memerlukan waktu <strong>15–40 detik</strong> untuk menjaga ketepatan fakta ilmiah dan format ramah baca. Mohon tetap berada di halaman ini sampai selesai.
          </p>
        </div>
      </div>
    </div>
  );
}
