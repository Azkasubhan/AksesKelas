"use client";

import * as React from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { Check, Copy } from "lucide-react";
import { Reveal, TiltIn, EASE_OUT } from "./motion-primitives";

const PANEL =
  "rounded-[16px] bg-surface p-5 shadow-[0_2px_4px_rgba(19,23,21,0.05),0_30px_60px_-28px_rgba(19,23,21,0.3)] sm:p-6";

function UploadVisual() {
  const steps = [
    { label: "Membaca dokumen", state: "done" },
    { label: "Mengenali struktur materi", state: "done" },
    { label: "Membuat Focus Cards", state: "active" },
    { label: "Menyiapkan Easy Read", state: "pending" },
    { label: "Menyimpan versi belajar", state: "pending" },
  ] as const;

  return (
    <div className={PANEL}>
      <div className="pb-4 border-b border-line/60">
        <p className="font-mono text-sm font-semibold text-ink">Sistem_Pencernaan_Bab4.pdf</p>
        <p className="mt-0.5 text-xs text-muted">8 halaman · teks terbaca</p>
      </div>
      <ul className="mt-4 space-y-3" aria-label="Contoh tahapan pemrosesan">
        {steps.map((s, i) => (
          <motion.li
            key={s.label}
            className="flex items-center gap-3 text-sm"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.12, ease: EASE_OUT }}
          >
            <span className="flex size-5 items-center justify-center">
              {s.state === "done" ? (
                <Check className="size-4 text-emerald" aria-label="Selesai" />
              ) : s.state === "active" ? (
                <span className="flex size-2 rounded-full bg-primary" />
              ) : (
                <span className="size-2 rounded-full border border-control/40" />
              )}
            </span>
            <span className={s.state === "pending" ? "text-muted" : "font-medium text-ink"}>{s.label}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function ReviewVisual() {
  return (
    <div className={PANEL}>
      <div className="grid gap-5 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-line">
        <div className="sm:pr-5">
          <p className="text-xs font-semibold text-muted">Sumber Asli Guru</p>
          <p className="mt-2 text-sm leading-[1.75] text-ink/85">
            Bolus makanan <mark className="rounded bg-amber-subtle px-1 py-0.5 text-ink font-medium">didorong oleh gerak peristaltik kerongkongan</mark>{" "}
            menuju lambung melalui sfingter esofagus.
          </p>
        </div>
        <div className="sm:pl-5">
          <p className="text-xs font-semibold text-emerald">Hasil Adaptasi</p>
          <p className="mt-2 text-sm leading-[1.75] text-ink">
            Makanan yang sudah dikunyah <mark className="rounded bg-emerald-subtle px-1 py-0.5 text-ink font-medium">ditelan lewat kerongkongan</mark>, lalu masuk
            ke lambung melalui pintu berotot.
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-2">
        <span className="text-xs text-muted">Rujukan: Bab 4 · Hal. 14</span>
        <span className="inline-flex h-9 items-center rounded-[9px] bg-primary px-4 text-[13px] font-semibold text-white shadow-xs">
          Setujui bagian ini
        </span>
      </div>
    </div>
  );
}

function PublishVisual() {
  const modes = [
    { name: "Focus Cards", detail: "3 kartu berurutan" },
    { name: "Easy Read", detail: "Bahasa disederhanakan" },
    { name: "Audio Pendamping", detail: "Bahasa Indonesia" },
  ];

  return (
    <div className={PANEL}>
      <div>
        <span className="font-mono text-xs uppercase tracking-wider text-muted">
          IPA Kelas VIII-A · 32 Siswa
        </span>
        <p className="mt-1 font-heading text-xl font-bold tracking-tight text-ink">
          Sistem Pencernaan Manusia
        </p>
      </div>

      {/* Rincian mode baca yang terbit untuk murid - Seamless tanpa garis tebal */}
      <div className="mt-5 space-y-2">
        {modes.map((m) => (
          <div
            key={m.name}
            className="flex items-center justify-between rounded-xl bg-surface-subtle/70 px-4 py-2.5 transition-colors"
          >
            <span className="text-sm font-semibold text-ink">{m.name}</span>
            <span className="font-mono text-xs text-muted">{m.detail}</span>
          </div>
        ))}
      </div>

      {/* Kode akses kelas siswa */}
      <div className="mt-5 flex items-center justify-between rounded-xl bg-surface-subtle px-4 py-3">
        <div>
          <span className="block text-[11px] font-medium text-muted">Kode masuk kelas murid</span>
          <span className="font-mono text-base font-bold tracking-widest text-ink">
            ZDNQ-GEZH-31JA
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs font-medium text-ink shadow-xs">
          <Copy className="size-3 text-muted" aria-hidden="true" />
          <span>Salin</span>
        </span>
      </div>
    </div>
  );
}

const STEPS = [
  {
    title: "Unggah PDF atau tempel teks",
    body: "Sistem membaca dokumen, mengenali struktur materi, lalu menyusun draf dengan rujukan ke halaman sumber. Setiap tahap terlihat jelas selagi berjalan.",
    visual: <UploadVisual />,
  },
  {
    title: "Bandingkan dan sunting berdampingan",
    body: "Sumber dan adaptasi tampil sejajar. Guru dapat mengedit, membuat ulang, atau menyetujui bagian demi bagian. Tidak ada yang sampai ke murid tanpa persetujuan.",
    visual: <ReviewVisual />,
  },
  {
    title: "Terbitkan ke kelas",
    body: "Setelah disetujui, versi tersebut terbit dan murid membacanya dengan preferensi masing-masing. Membaca materi terbit tidak memanggil AI lagi.",
    visual: <PublishVisual />,
  },
];

export function TeacherFlow() {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });

  return (
    <section id="cara-kerja" className="px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="max-w-2xl font-heading text-3xl font-extrabold tracking-tight text-ink sm:text-5xl sm:leading-[1.1]">
            Dari PDF ke kelas, dengan guru di tengah prosesnya.
          </h2>
        </Reveal>

        <div ref={ref} className="relative mt-16 md:pl-12">
          <div className="absolute bottom-0 left-0 top-0 hidden w-px bg-ink/10 md:block" aria-hidden="true">
            <motion.div className="h-full w-full origin-top bg-primary" style={{ scaleY }} />
          </div>

          <div className="space-y-24 sm:space-y-32">
            {STEPS.map((step, i) => (
              <div key={step.title} className="grid items-center gap-8 md:grid-cols-12 md:gap-12">
                <Reveal className="md:col-span-5">
                  <p className="text-sm font-semibold text-primary">Langkah {i + 1}</p>
                  <h3 className="mt-2 font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">{step.title}</h3>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-ink/70">{step.body}</p>
                </Reveal>
                <TiltIn className="md:col-span-7" delay={0.1}>
                  {step.visual}
                </TiltIn>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
