"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Reveal } from "./motion-primitives";
import { Button } from "@/components/ui/button";

const ClosingShaderView = dynamic(() => import("./closing-shader-view"), {
  ssr: false,
});

function subscribe() {
  return () => {};
}

export function ClosingBanner() {
  const reduce = useReducedMotion();
  const mounted = React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return (
    <section className="px-5 pb-24 sm:px-8 sm:pb-32">
      <Reveal className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[20px] bg-sky-100/60 px-7 py-14 sm:px-14 sm:py-20 shadow-[0_20px_45px_-16px_rgba(50,85,180,0.22)]">
          {/* 1. Latar Shader 3D Biru Langit Cerah */}
          {mounted && (
            <div className="pointer-events-none absolute inset-0 select-none opacity-95">
              <ClosingShaderView />
            </div>
          )}

          {/* 2. Soft sky blue overlay (biru soft, tanpa putih) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 select-none"
            style={{
              background:
                "radial-gradient(ellipse 65% 75% at 20% 50%, rgba(195, 224, 255, 0.5) 0%, rgba(210, 232, 255, 0.2) 60%, transparent 90%)",
            }}
          />

          {/* 3. Klaster 3 Awan Natural (ada yang jauh di belakang dan ada yang dekat di depan) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-4 sm:right-8 md:right-12 lg:right-16 top-1/2 -translate-y-1/2 select-none z-0"
          >
            <div className="relative w-64 sm:w-80 md:w-96 lg:w-[420px] h-44 sm:h-52 md:h-60">
              {/* Awan 1 (Jauh - Belakang Kiri): lebih kecil, melayang di kejauhan atas-kiri */}
              <motion.div
                className="absolute top-0 left-0 w-32 sm:w-40 md:w-48 opacity-85 z-10"
                style={{
                  filter: "drop-shadow(0 8px 16px rgba(35, 75, 160, 0.14))",
                }}
                animate={reduce ? undefined : { y: [0, -5, 0] }}
                transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg viewBox="0 0 200 100" className="block h-auto w-full">
                  <defs>
                    <linearGradient
                      id="close-cloud-far"
                      x1="0"
                      y1="10"
                      x2="0"
                      y2="90"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="70%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#d2e5fc" />
                    </linearGradient>
                  </defs>
                  <g fill="url(#close-cloud-far)">
                    <circle cx="60" cy="60" r="26" />
                    <circle cx="98" cy="48" r="32" />
                    <circle cx="134" cy="62" r="22" />
                    <rect
                      x="38"
                      y="62"
                      width="116"
                      height="24"
                      rx="12"
                    />
                  </g>
                </svg>
              </motion.div>

              {/* Awan 2 (Sedang - Belakang Kanan): mengintip anggun di sisi kanan-atas */}
              <motion.div
                className="absolute top-2 right-0 sm:right-2 md:right-4 w-32 sm:w-42 md:w-50 opacity-90 z-10"
                style={{
                  filter: "drop-shadow(0 10px 20px rgba(35, 75, 160, 0.15))",
                }}
                animate={reduce ? undefined : { y: [0, -6, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <svg viewBox="0 0 200 100" className="block h-auto w-full">
                  <defs>
                    <linearGradient
                      id="close-cloud-side"
                      x1="0"
                      y1="10"
                      x2="0"
                      y2="90"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="70%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#d5e6fc" />
                    </linearGradient>
                  </defs>
                  <g fill="url(#close-cloud-side)">
                    <circle cx="44" cy="66" r="20" />
                    <circle cx="72" cy="50" r="28" />
                    <circle cx="108" cy="38" r="34" />
                    <circle cx="144" cy="54" r="26" />
                    <circle cx="168" cy="70" r="16" />
                    <rect
                      x="26"
                      y="62"
                      width="158"
                      height="26"
                      rx="13"
                    />
                  </g>
                </svg>
              </motion.div>

              {/* Awan 3 (Dekat / Utama - Depan Tengah): paling besar, puffy dan tegas di foreground */}
              <motion.div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-52 sm:w-64 md:w-76 lg:w-84 z-20"
                style={{
                  filter: "drop-shadow(0 16px 28px rgba(35, 75, 160, 0.20))",
                }}
                animate={reduce ? undefined : { y: [0, -8, 0] }}
                transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              >
                <svg viewBox="0 0 200 100" className="block h-auto w-full">
                  <defs>
                    <linearGradient
                      id="close-cloud-main"
                      x1="0"
                      y1="10"
                      x2="0"
                      y2="90"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="70%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#dce8fa" />
                    </linearGradient>
                  </defs>
                  <g fill="url(#close-cloud-main)">
                    <circle cx="52" cy="64" r="24" />
                    <circle cx="86" cy="46" r="34" />
                    <circle cx="124" cy="52" r="28" />
                    <circle cx="154" cy="66" r="20" />
                    <rect
                      x="30"
                      y="60"
                      width="146"
                      height="28"
                      rx="14"
                    />
                  </g>
                </svg>
              </motion.div>
            </div>
          </div>

          {/* 4. Konten Teks di sisi kiri */}
          <div className="relative z-10 max-w-xl">
            <h2 className="max-w-xl font-heading text-3xl font-extrabold leading-[1.15] tracking-tight text-ink sm:text-5xl">
              Mulai dari satu materi <br className="hidden sm:inline" />untuk kelas Anda.
            </h2>
            <p className="mt-4 max-w-[530px] text-base leading-relaxed text-ink/80 sm:text-lg">
              Daftar sebagai guru untuk mengunggah materi pertama, atau masuk sebagai murid dengan kode kelas dari guru.
            </p>

            {/* 5. Tombol aksi: Oren Coral & Putih Solid */}
            <div className="mt-7 sm:mt-9 flex flex-wrap items-center gap-3">
              <Button
                variant="coral"
                size="lg"
                className="h-11 sm:h-12 px-5 sm:px-7 text-sm sm:text-base shadow-lg shadow-coral/25 font-semibold"
                asChild
              >
                <Link href="/signup">
                  <span>Daftar Akun</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                variant="light"
                size="lg"
                style={{ backgroundColor: "#ffffff", color: "#131715" }}
                className="h-11 sm:h-12 px-5 sm:px-7 text-sm sm:text-base font-semibold shadow-sm rounded-btn transition-all duration-150 hover:bg-white/95"
                asChild
              >
                <Link href="/login">Masuk</Link>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
