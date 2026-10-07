"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  Sparkles,
  Volume2,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  Bookmark,
  VolumeX,
} from "lucide-react";

interface FeatureTab {
  id: string;
  name: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "indigo" | "emerald" | "violet" | "amber" | "coral";
  headline: string;
  description: string;
  bulletPoints: string[];
}

const FEATURES: FeatureTab[] = [
  {
    id: "focus-cards",
    name: "Focus Cards",
    badge: "Anti-Kewalahan",
    icon: BookOpen,
    tone: "indigo",
    headline: "Satu Ide Pokok per Layar. Membaca Tenang Tanpa Rasa Panik.",
    description:
      "Banyak murid merasa kewalahan saat melihat paragraf buku teks yang padat dan bersusun. Focus Cards memecah materi menjadi kartu bacaan sekuensial yang ringan, dengan navigasi sebelumnya/berikutnya yang teratur.",
    bulletPoints: [
      "Maksimal 80 kata per kartu untuk menjaga fokus perhatian",
      "Dilengkapi penanda istilah kunci (Key Terms) yang dapat disorot",
      "Transisi geser horizontal yang tenang dan ramah disorientasi gerak",
    ],
  },
  {
    id: "easy-read",
    name: "Bahasa Sederhana",
    badge: "Eksplisit & Jelas",
    icon: Sparkles,
    tone: "emerald",
    headline: "Penjelasan Lebih Bersahabat Tanpa Mengubah Fakta Ilmiah.",
    description:
      "Kalimat majemuk beranak-pinak sering menyembunyikan ide utama pelajaran. Lapisan Easy Read mengubah kalimat rumit menjadi susunan subjek-predikat-objek yang lugas tanpa menghilangkan konsep penting.",
    bulletPoints: [
      "Menyederhanakan klausa panjang menjadi pernyataan lugas",
      "Istilah sulit diberi penjelasan kontekstual langsung",
      "Murid bebas beralih antara teks asli dan bahasa sederhana kapan saja",
    ],
  },
  {
    id: "listen",
    name: "Mode Dengarkan",
    badge: "Audio Sinkron",
    icon: Volume2,
    tone: "violet",
    headline: "Dengarkan Sambil Membaca. Pengalaman Belajar Multi-Sensori.",
    description:
      "Murid dengan preferensi auditori atau yang mengalami kelelahan visual dapat mendengarkan pembacaan bersuara secara langsung di peramban, membantu daya ingat dan pemahaman intonasi kalimat.",
    bulletPoints: [
      "Menggunakan sintesis suara alami Web Speech tanpa biaya langganan tambahan",
      "Kecepatan bicara terkontrol 0.95x agar pelafalan jelas",
      "Dapat dihentikan atau diulang per gagasan bacaan",
    ],
  },
  {
    id: "readable",
    name: "Pengaturan Tampilan",
    badge: "Kenyamanan Mata",
    icon: Sliders,
    tone: "amber",
    headline: "Skala Font, Spasi Huruf, dan Kontras yang Dapat Disesuaikan.",
    description:
      "Tidak ada satu format ukuran yang cocok untuk semua murid. Dengan satu sentuhan, murid dapat memperbesar teks hingga 28px, mengatur jarak baris, atau memilih kontras tinggi.",
    bulletPoints: [
      "Ukuran teks fleksibel: Standar (20px), Sedang (24px), hingga Ekstra Besar (28px)",
      "Pilihan kontras kertas hangat (Warm Paper) dan High Contrast WCAG AAA",
      "Pengaturan tersimpan otomatis di profil murid untuk materi berikutnya",
    ],
  },
  {
    id: "teacher-control",
    name: "Kendali Penuh Guru",
    badge: "Human-in-the-Loop",
    icon: ShieldCheck,
    tone: "coral",
    headline: "AI Menyusun Draf, Guru yang Memegang Kendali Mutlak.",
    description:
      "AksesKelas menolak otomasi buta. Seluruh adaptasi AI wajib melalui pintu telaah guru berdampingan dengan dokumen sumber asli sebelum bisa diterbitkan dan dibaca oleh murid.",
    bulletPoints: [
      "Layar penelaahan berdampingan (Original Source vs Adapted Version)",
      "Guru dapat mengoreksi diksi, memotong bagian, atau menolak draf",
      "Publikasi berupa snapshot abadi yang aman dari perubahan tak terduga",
    ],
  },
];

export function ModernFeaturesSection() {
  const [activeTab, setActiveTab] = React.useState<string>("focus-cards");
  const [isPlayingDemo, setIsPlayingDemo] = React.useState(false);
  const [easyToggle, setEasyToggle] = React.useState(true);
  const [fontScale, setFontScale] = React.useState<20 | 24 | 28>(20);

  const current = FEATURES.find((f) => f.id === activeTab) || FEATURES[0];

  function handleVoiceDemo() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isPlayingDemo) {
      window.speechSynthesis.cancel();
      setIsPlayingDemo(false);
      return;
    }
    const text = easyToggle
      ? "Makanan yang sudah dikunyah ditelan lewat kerongkongan, lalu masuk ke dalam lambung melalui pintu berotot."
      : "Setelah dikunyah di rongga mulut, bolus makanan didorong oleh gerak peristaltik kerongkongan menuju lambung.";
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "id-ID";
    u.rate = 0.95;
    u.onend = () => setIsPlayingDemo(false);
    u.onerror = () => setIsPlayingDemo(false);
    window.speechSynthesis.speak(u);
    setIsPlayingDemo(true);
  }

  React.useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <section id="keunggulan" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        {/* Header Seksi yang Menarik & Modern */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-border bg-primary-subtle px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            <Sparkles className="size-3.5" />
            Inovasi Akses Belajar
          </span>
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-ink sm:text-5xl">
            Di Sini Keunggulan AksesKelas.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            Bukan sekadar penampil dokumen PDF biasa. Setiap materi pelajaran diubah menjadi pengalaman membaca adaptif multi-modal yang memberi rasa percaya diri kepada semua murid.
          </p>
        </div>

        {/* Tab Switcher Bergaya Kokonut / Framer Motion */}
        <div className="mt-12 flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-line bg-surface/90 p-1.5 backdrop-blur-md shadow-sm">
            {FEATURES.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (isPlayingDemo && typeof window !== "undefined") {
                      window.speechSynthesis.cancel();
                      setIsPlayingDemo(false);
                    }
                  }}
                  className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 sm:text-sm ${
                    isActive
                      ? "text-white shadow-md shadow-primary/20"
                      : "text-muted hover:bg-surface-subtle hover:text-ink"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeFeaturePill"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-indigo-600"
                      transition={{ type: "spring", bounce: 0.18, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="size-4" />
                    <span>{tab.name}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Interactive Feature Showcase Card */}
        <div className="mt-10 overflow-hidden rounded-3xl border border-line bg-surface shadow-xl shadow-slate-200/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid items-center gap-10 p-6 sm:p-12 lg:grid-cols-12 lg:gap-14"
            >
              {/* Kolom Penjelasan */}
              <div className="lg:col-span-6">
                <div className="inline-flex items-center gap-2 rounded-lg bg-surface-subtle px-3 py-1 text-xs font-bold text-primary">
                  <span>{current.badge}</span>
                </div>

                <h3 className="mt-3 font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  {current.headline}
                </h3>

                <p className="mt-4 text-base leading-relaxed text-muted">
                  {current.description}
                </p>

                <div className="mt-6 space-y-3">
                  {current.bulletPoints.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm text-ink">
                      <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-emerald" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kolom Playground Interaktif */}
              <div className="lg:col-span-6">
                <div className="rounded-2xl border border-line bg-canvas/80 p-5 shadow-inner sm:p-7">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3 text-xs text-muted">
                    <span className="font-semibold uppercase tracking-wider text-ink">
                      Simulasi Tampilan Murid
                    </span>
                    <span className="font-mono text-[11px] text-muted">IPA VIII · Sistem Pencernaan</span>
                  </div>

                  {/* Kontrol Interaktif Cepat */}
                  <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setEasyToggle((prev) => !prev)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-semibold transition-all ${
                        easyToggle
                          ? "border-emerald-border bg-emerald-subtle text-emerald"
                          : "border-line bg-surface text-muted hover:text-ink"
                      }`}
                    >
                      <Sparkles className="size-3.5" />
                      <span>Bahasa Sederhana: {easyToggle ? "Aktif" : "Mati"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleVoiceDemo}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-semibold transition-all ${
                        isPlayingDemo
                          ? "border-violet-border bg-violet-subtle text-violet animate-pulse"
                          : "border-line bg-surface text-muted hover:text-ink"
                      }`}
                    >
                      {isPlayingDemo ? (
                        <>
                          <VolumeX className="size-3.5" />
                          <span>Hentikan Suara</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="size-3.5" />
                          <span>Dengarkan Suara</span>
                        </>
                      )}
                    </button>

                    <div className="inline-flex items-center rounded-lg border border-line bg-surface p-0.5">
                      <button
                        type="button"
                        onClick={() => setFontScale(20)}
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          fontScale === 20 ? "bg-primary text-white" : "text-muted"
                        }`}
                      >
                        A
                      </button>
                      <button
                        type="button"
                        onClick={() => setFontScale(24)}
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          fontScale === 24 ? "bg-primary text-white" : "text-muted"
                        }`}
                      >
                        A+
                      </button>
                      <button
                        type="button"
                        onClick={() => setFontScale(28)}
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          fontScale === 28 ? "bg-primary text-white" : "text-muted"
                        }`}
                      >
                        A++
                      </button>
                    </div>
                  </div>

                  {/* Kartu Cuplikan Bacaan */}
                  <div className="rounded-xl border border-line bg-surface p-5 sm:p-6 shadow-sm">
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span className="font-semibold text-primary">Kartu 1 dari 3</span>
                      <span className="inline-flex items-center gap-1 rounded bg-amber-subtle px-2 py-0.5 font-bold text-amber">
                        <Bookmark className="size-3" />
                        Bolus Makanan
                      </span>
                    </div>

                    <h4 className="mt-3 font-heading text-lg font-bold text-ink">
                      1. Makanan Masuk ke Lambung
                    </h4>

                    <p
                      style={{ fontSize: `${fontScale}px`, lineHeight: 1.65 }}
                      className="mt-3 text-ink transition-all duration-200"
                    >
                      {easyToggle
                        ? "Makanan yang sudah dikunyah ditelan lewat kerongkongan, lalu masuk ke dalam lambung melalui pintu berotot."
                        : "Setelah dikunyah di rongga mulut, bolus makanan didorong oleh gerak peristaltik kerongkongan menuju lambung melalui sfingter esofagus bagian bawah."}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
                      <span className="font-mono text-[11px]">Buku Teks IPA VIII · Hal. 14</span>
                      <span className="font-semibold text-emerald">● Terverifikasi Guru</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
