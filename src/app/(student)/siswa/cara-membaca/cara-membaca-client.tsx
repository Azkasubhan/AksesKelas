"use client";

import * as React from "react";
import {
  Check,
  Pause,
  Play,
  RotateCcw,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { createSpeechUtterance } from "@/lib/speech";
import type { ReadingPreferencesDto } from "@/shared/schemas/preferences";

interface CaraMembacaClientProps {
  initialPreferences: ReadingPreferencesDto;
  csrfToken?: string;
}

const DEFAULT_PREFERENCES: ReadingPreferencesDto = {
  structure: "standard",
  easyRead: false,
  fontFamily: "inter",
  fontSize: 20,
  lineHeight: 1.7,
  letterSpacing: 0,
  lineWidth: 60,
  theme: "light",
  motion: "system",
  listenEnabled: false,
  speechRate: 1,
  voiceUri: null,
};

// Cuplikan teks demo untuk pratinjau langsung
const SAMPLE_ORIGINAL = {
  title: "Sistem Pencernaan: Gerak Peristaltik",
  body: "Setelah makanan dikunyah secara mekanis di rongga mulut, terbentuklah bolus yang kemudian didorong oleh kontraksi teratur otot kerongkongan (gerak peristaltik) melewati sfingter esofagus bawah menuju ke organ lambung.",
  cardTitle: "Perjalanan Bolus Makanan",
  cardText: "Dinding otot kerongkongan berkontraksi dan berelaksasi secara bergelombang untuk mendorong makanan masuk ke lambung secara teratur.",
};

const SAMPLE_EASY = {
  title: "Makanan Masuk ke Lambung",
  body: "Makanan yang sudah dikunyah menjadi gumpalan lembut bernama bolus. Saluran kerongkongan meremas dan mendorong gumpalan ini ke bawah seperti gelombang, sampai tiba di dalam lambung.",
  cardTitle: "Dorongan Otot Kerongkongan",
  cardText: "Otot kerongkongan meremas seperti ombak untuk mengalirkan makanan ke lambung.",
};

export function CaraMembacaClient({ initialPreferences, csrfToken }: CaraMembacaClientProps) {
  const [preferences, setPreferences] = React.useState<ReadingPreferencesDto>(initialPreferences);
  const [saveStatus, setSaveStatus] = React.useState<"saved" | "saving" | "idle">("idle");
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);

  // Fungsi simpan preferensi ke API
  const persistPreferences = React.useCallback(
    async (updated: ReadingPreferencesDto) => {
      setSaveStatus("saving");
      try {
        await apiFetch("/preferences", {
          method: "PATCH",
          body: updated,
          csrfToken,
        });
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2500);
      } catch (err) {
        console.error("Gagal menyimpan preferensi:", err);
        setSaveStatus("idle");
      }
    },
    [csrfToken],
  );

  function updatePreference<K extends keyof ReadingPreferencesDto>(
    key: K,
    value: ReadingPreferencesDto[K],
  ) {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    persistPreferences(next);
  }

  function handleResetDefault() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
    setPreferences(DEFAULT_PREFERENCES);
    persistPreferences(DEFAULT_PREFERENCES);
  }

  // Audio preview simulation (browser SpeechSynthesis)
  function toggleSpeechPreview() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToRead = preferences.easyRead
      ? `${SAMPLE_EASY.title}. ${preferences.structure === "focus" ? SAMPLE_EASY.cardText : SAMPLE_EASY.body}`
      : `${SAMPLE_ORIGINAL.title}. ${preferences.structure === "focus" ? SAMPLE_ORIGINAL.cardText : SAMPLE_ORIGINAL.body}`;

    const { utterance } = createSpeechUtterance(textToRead, {
      rate: preferences.speechRate,
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });

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

  // Format kelas tema preview
  const themeCardClasses = {
    light: "bg-surface text-ink border-line",
    sepia: "bg-[#FBF3E5] text-[#30281F] border-[#DFCFA9]",
    "high-contrast": "bg-[#18181b] text-white border-white/20",
  }[preferences.theme];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
      {/* ========================================================= */}
      {/* KOLOM KIRI: FORM PENGATURAN (7 Kolom)                     */}
      {/* ========================================================= */}
      <div className="space-y-6 lg:col-span-7">
        {/* Status Indikator & Reset */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2">
            {saveStatus === "saving" && (
              <span className="text-xs text-muted flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary animate-pulse" />
                Menyimpan preferensi…
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-xs font-semibold text-emerald flex items-center gap-1.5">
                <Check className="size-3.5 text-emerald" />
                Tersimpan di akunmu
              </span>
            )}
            {saveStatus === "idle" && (
              <span className="text-xs text-muted">
                Perubahan tersimpan otomatis
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleResetDefault}
            className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink transition-colors cursor-pointer"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            <span>Kembalikan ke Default</span>
          </button>
        </div>

        {/* --------------------------------------------------------- */}
        {/* A. STRUKTUR BACAAN                                        */}
        {/* --------------------------------------------------------- */}
        <div className="rounded-[18px] border border-line bg-surface p-5 sm:p-6 shadow-xs space-y-4">
          <div>
            <h2 className="font-heading text-base font-bold text-ink">
              A. Struktur Bacaan
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Pilih cara materi disusun saat kamu membaca.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => updatePreference("structure", "standard")}
              className={`flex flex-col text-left p-4 rounded-[14px] border transition-all cursor-pointer ${
                preferences.structure === "standard"
                  ? "border-primary bg-primary-subtle/40 ring-1 ring-primary shadow-xs"
                  : "border-line bg-surface hover:bg-surface-subtle"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-heading text-sm font-bold text-ink">
                  Standard Reading
                </span>
                {preferences.structure === "standard" && (
                  <Check className="size-4 text-primary" aria-hidden="true" />
                )}
              </div>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Tampilan mengalir seperti buku bacaan artikel biasa. Cocok untuk membaca menyeluruh.
              </p>
            </button>

            <button
              type="button"
              onClick={() => updatePreference("structure", "focus")}
              className={`flex flex-col text-left p-4 rounded-[14px] border transition-all cursor-pointer ${
                preferences.structure === "focus"
                  ? "border-primary bg-primary-subtle/40 ring-1 ring-primary shadow-xs"
                  : "border-line bg-surface hover:bg-surface-subtle"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-heading text-sm font-bold text-ink">
                  Focus Cards
                </span>
                {preferences.structure === "focus" && (
                  <Check className="size-4 text-primary" aria-hidden="true" />
                )}
              </div>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Materi dibagi menjadi kartu gagasan bertahap. Cocok untuk fokus satu ide dalam satu waktu.
              </p>
            </button>
          </div>
        </div>

        {/* --------------------------------------------------------- */}
        {/* B. BAHASA & KALIMAT                                       */}
        {/* --------------------------------------------------------- */}
        <div className="rounded-[18px] border border-line bg-surface p-5 sm:p-6 shadow-xs space-y-4">
          <div>
            <h2 className="font-heading text-base font-bold text-ink">
              B. Bahasa & Kalimat
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Pilih gaya penyusunan kalimat yang paling mudah kamu pahami.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => updatePreference("easyRead", false)}
              className={`flex flex-col text-left p-4 rounded-[14px] border transition-all cursor-pointer ${
                !preferences.easyRead
                  ? "border-primary bg-primary-subtle/40 ring-1 ring-primary shadow-xs"
                  : "border-line bg-surface hover:bg-surface-subtle"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-heading text-sm font-bold text-ink">
                  Bahasa Original
                </span>
                {!preferences.easyRead && (
                  <Check className="size-4 text-primary" aria-hidden="true" />
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted leading-relaxed">
                Bahasa formal asli dari buku materi pelajaran yang diunggah oleh guru.
              </p>
            </button>

            <button
              type="button"
              onClick={() => updatePreference("easyRead", true)}
              className={`flex flex-col text-left p-4 rounded-[14px] border transition-all cursor-pointer ${
                preferences.easyRead
                  ? "border-primary bg-primary-subtle/40 ring-1 ring-primary shadow-xs"
                  : "border-line bg-surface hover:bg-surface-subtle"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-heading text-sm font-bold text-ink">
                  Easy Read
                </span>
                {preferences.easyRead && (
                  <Check className="size-4 text-primary" aria-hidden="true" />
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted leading-relaxed">
                Kalimat lebih pendek, lugas, dan istilah kompleks disederhanakan tanpa mengurangi makna.
              </p>
            </button>
          </div>
        </div>

        {/* --------------------------------------------------------- */}
        {/* C. TAMPILAN BACAAN                                        */}
        {/* --------------------------------------------------------- */}
        {/* --------------------------------------------------------- */}
        {/* C. TAMPILAN BACAAN                                        */}
        {/* --------------------------------------------------------- */}
        <div className="rounded-[18px] border border-line bg-surface p-5 sm:p-6 shadow-xs space-y-6">
          <div>
            <h2 className="font-heading text-base font-bold text-ink">
              C. Tampilan Bacaan
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Atur kenyamanan visual mata saat membaca.
            </p>
          </div>

          {/* Tema Tampilan dengan Swatch Pratinjau */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-ink">Tema Warna</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  key: "light",
                  label: "Terang",
                  sub: "Putih bersih",
                  swatchBg: "bg-surface border-line text-ink",
                  sampleText: "Aa",
                },
                {
                  key: "sepia",
                  label: "Sepia",
                  sub: "Kertas hangat",
                  swatchBg: "bg-[#FBF3E5] border-[#DFCFA9] text-[#30281F]",
                  sampleText: "Aa",
                },
                {
                  key: "high-contrast",
                  label: "Kontras Gelap",
                  sub: "Latar redup",
                  swatchBg: "bg-[#18181b] border-white/20 text-white",
                  sampleText: "Aa",
                },
              ].map((t) => {
                const isSelected = preferences.theme === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() =>
                      updatePreference("theme", t.key as ReadingPreferencesDto["theme"])
                    }
                    className={`flex flex-col items-center justify-between p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary-subtle/30 ring-2 ring-primary/40 shadow-xs"
                        : "border-line bg-surface hover:bg-surface-subtle/60"
                    }`}
                  >
                    <div
                      className={`size-10 rounded-lg border flex items-center justify-center font-heading font-bold text-sm mb-2 shadow-2xs ${t.swatchBg}`}
                    >
                      {t.sampleText}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink">{t.label}</p>
                      <p className="text-[10px] text-muted">{t.sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ukuran Huruf dengan Segmented Slider Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-ink">Ukuran Huruf</span>
              <span className="font-mono text-primary font-bold text-xs">
                {preferences.fontSize} px
              </span>
            </div>
            <div className="flex rounded-xl bg-surface-subtle p-1 gap-1 border border-line/60">
              {[18, 20, 22, 24, 28].map((size) => {
                const isSelected = preferences.fontSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => updatePreference("fontSize", size)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary text-white shadow-xs"
                        : "text-muted hover:text-ink hover:bg-surface/60"
                    }`}
                  >
                    {size} px
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kerapatan Baris (Line Height) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-ink">Kerapatan Baris (Line Height)</span>
              <span className="font-mono text-primary font-bold text-xs">
                {preferences.lineHeight}x
              </span>
            </div>
            <div className="flex rounded-xl bg-surface-subtle p-1 gap-1 border border-line/60">
              {[
                { val: 1.5, label: "Rapat (1.5)" },
                { val: 1.7, label: "Nyaman (1.7)" },
                { val: 2.0, label: "Lebar (2.0)" },
              ].map((item) => {
                const isSelected = preferences.lineHeight === item.val;
                return (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => updatePreference("lineHeight", item.val)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
                      isSelected
                        ? "bg-primary text-white shadow-xs"
                        : "text-muted hover:text-ink hover:bg-surface/60"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lebar Bidang Bacaan */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-ink">Lebar Teks Bacaan</span>
              <span className="font-mono text-primary font-bold text-xs">
                {preferences.lineWidth} karakter
              </span>
            </div>
            <div className="flex rounded-xl bg-surface-subtle p-1 gap-1 border border-line/60">
              {[
                { val: 45, label: "Ramping" },
                { val: 60, label: "Sedang" },
                { val: 75, label: "Luas" },
              ].map((w) => {
                const isSelected = preferences.lineWidth === w.val;
                return (
                  <button
                    key={w.val}
                    type="button"
                    onClick={() => updatePreference("lineWidth", w.val)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
                      isSelected
                        ? "bg-primary text-white shadow-xs"
                        : "text-muted hover:text-ink hover:bg-surface/60"
                    }`}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------- */}
        {/* D. AUDIO PENDAMPING (LISTEN)                              */}
        {/* --------------------------------------------------------- */}
        <div className="rounded-[18px] border border-line bg-surface p-5 sm:p-6 shadow-xs space-y-4">
          <div>
            <h2 className="font-heading text-base font-bold text-ink">
              D. Audio Pendamping (Listen)
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Fitur pembaca suara otomatis menggunakan Text-to-Speech langsung di browsermu.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-[14px] border border-line bg-surface-subtle/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-surface border border-line text-ink shrink-0">
                <Volume2 className="size-4.5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">
                  Fitur Dengarkan Suara
                </p>
                <p className="text-xs text-muted">
                  Buka toolbar suara saat membuka materi pelajaran.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updatePreference("listenEnabled", !preferences.listenEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-focus ${
                preferences.listenEnabled ? "bg-primary" : "bg-line"
              }`}
              role="switch"
              aria-checked={preferences.listenEnabled}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  preferences.listenEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Kecepatan Suara */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-ink">Kecepatan Pembacaan Suara</span>
              <span className="font-mono text-primary font-bold text-xs">
                {preferences.speechRate}x
              </span>
            </div>
            <div className="flex rounded-xl bg-surface-subtle p-1 gap-1 border border-line/60">
              {[
                { rate: 0.75, label: "0.75x" },
                { rate: 1, label: "1x" },
                { rate: 1.25, label: "1.25x" },
                { rate: 1.5, label: "1.5x" },
              ].map((item) => {
                const isSelected = preferences.speechRate === item.rate;
                return (
                  <button
                    key={item.rate}
                    type="button"
                    onClick={() => updatePreference("speechRate", item.rate)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary text-white shadow-xs"
                        : "text-muted hover:text-ink hover:bg-surface/60"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* KOLOM KANAN: PRATINJAU LANGSUNG (5 Kolom - Sticky)        */}
      {/* ========================================================= */}
      <div className="lg:col-span-5 sticky top-6 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Pratinjau
          </p>
        </div>

        {/* Card Box Preview */}
        <div
          className={`rounded-[20px] border p-6 sm:p-7 shadow-sm transition-all duration-200 ${themeCardClasses}`}
        >
          {/* Tag Header Preview */}
          <div className="flex items-center justify-between border-b pb-3 mb-4 opacity-75 text-xs border-current/15">
            <span className="font-semibold uppercase tracking-wider">
              {preferences.structure === "focus" ? "Mode Focus Cards" : "Mode Standard"}
            </span>
            <span>
              {preferences.easyRead ? "Bahasa Easy Read" : "Bahasa Original"}
            </span>
          </div>

          {/* Wrapper Konten dengan Lebar Teks Nyata (lineWidth ch) */}
          <div
            style={{ maxWidth: `${preferences.lineWidth}ch` }}
            className="transition-all duration-200"
          >
            {/* Tampilan Konten Sesuai Pengaturan */}
            {preferences.structure === "focus" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs opacity-70">
                  <span className="font-semibold">Kartu 1 dari 2</span>
                  <span className="rounded px-2 py-0.5 bg-black/5 dark:bg-white/10 font-mono text-[10px]">
                    Konsep Inti
                  </span>
                </div>

                <h3
                  className="font-heading font-bold"
                  style={{ fontSize: `${Math.max(18, preferences.fontSize)}px` }}
                >
                  {preferences.easyRead ? SAMPLE_EASY.cardTitle : SAMPLE_ORIGINAL.cardTitle}
                </h3>

                <p
                  style={{
                    fontSize: `${preferences.fontSize}px`,
                    lineHeight: preferences.lineHeight,
                    letterSpacing: `${preferences.letterSpacing}em`,
                  }}
                >
                  {preferences.easyRead ? SAMPLE_EASY.cardText : SAMPLE_ORIGINAL.cardText}
                </p>

                {/* Sequential Indicator */}
                <div className="flex items-center justify-between pt-3 border-t border-current/10">
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    <span className="h-1.5 w-6 rounded-full bg-primary" />
                    <span className="h-1.5 w-2 rounded-full bg-current/20" />
                  </div>
                  <span className="text-xs font-semibold opacity-70">Berikutnya →</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h3
                  className="font-heading font-bold"
                  style={{ fontSize: `${Math.max(18, preferences.fontSize + 2)}px` }}
                >
                  {preferences.easyRead ? SAMPLE_EASY.title : SAMPLE_ORIGINAL.title}
                </h3>

                <p
                  style={{
                    fontSize: `${preferences.fontSize}px`,
                    lineHeight: preferences.lineHeight,
                    letterSpacing: `${preferences.letterSpacing}em`,
                  }}
                >
                  {preferences.easyRead ? SAMPLE_EASY.body : SAMPLE_ORIGINAL.body}
                </p>
              </div>
            )}
          </div>

          {/* Audio Player Preview Bar yang Menyatu dengan Tema */}
          {preferences.listenEnabled && (
            <div className="mt-5 flex items-center justify-between rounded-xl border border-current/15 bg-black/5 dark:bg-white/5 p-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Volume2 className="size-4" />
                <span>Audio Pendamping ({preferences.speechRate}x)</span>
              </div>

              <Button
                size="sm"
                variant="primary"
                onClick={toggleSpeechPreview}
                className="h-7 px-3 text-xs gap-1 cursor-pointer"
              >
                {isPlayingAudio ? (
                  <>
                    <Pause className="size-3" />
                    <span>Jeda</span>
                  </>
                ) : (
                  <>
                    <Play className="size-3" />
                    <span>Dengarkan</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <p className="text-[11px] text-muted text-center leading-relaxed">
          Semua materi di AksesKelas akan otomatis ditampilkan sesuai dengan preferensi yang kamu atur di atas.
        </p>
      </div>
    </div>
  );
}
