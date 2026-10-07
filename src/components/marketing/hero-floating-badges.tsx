"use client";

import * as React from "react";
import { motion } from "motion/react";
import { BookOpen, Sparkles, Volume2, ShieldCheck } from "lucide-react";

interface FloatingItemProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  badgeTone: "indigo" | "emerald" | "violet" | "coral";
  className?: string;
  delay?: number;
  yOffset?: number;
}

const toneStyles = {
  indigo: {
    bg: "bg-surface/95 border-primary-border text-primary shadow-primary/10",
    iconBg: "bg-primary-subtle text-primary",
  },
  emerald: {
    bg: "bg-surface/95 border-emerald-border text-emerald shadow-emerald/10",
    iconBg: "bg-emerald-subtle text-emerald",
  },
  violet: {
    bg: "bg-surface/95 border-violet-border text-violet shadow-violet/10",
    iconBg: "bg-violet-subtle text-violet",
  },
  coral: {
    bg: "bg-surface/95 border-coral-border text-coral shadow-coral/10",
    iconBg: "bg-coral-subtle text-coral",
  },
};

function FloatingCard({
  icon: Icon,
  title,
  subtitle,
  badgeTone,
  className = "",
  delay = 0,
  yOffset = 8,
}: FloatingItemProps) {
  const t = toneStyles[badgeTone];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: yOffset }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -yOffset, 0],
      }}
      transition={{
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.5, delay },
        y: {
          repeat: Infinity,
          duration: 3.8 + delay,
          ease: "easeInOut",
          delay: delay * 0.4,
        },
      }}
      whileHover={{ scale: 1.06, y: -4 }}
      className={`pointer-events-auto absolute z-20 flex items-center gap-2.5 rounded-xl border p-2.5 backdrop-blur-md shadow-lg transition-shadow hover:shadow-xl ${t.bg} ${className}`}
    >
      <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${t.iconBg}`}>
        <Icon className="size-4" />
      </div>
      <div className="text-left pr-1">
        <p className="text-xs font-bold leading-none text-ink">{title}</p>
        <p className="mt-1 text-[10.5px] leading-none text-muted">{subtitle}</p>
      </div>
    </motion.div>
  );
}

export function HeroFloatingBadges() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
      {/* Kiri Atas: Focus Cards (Membingkai Tajuk Kiri) */}
      <FloatingCard
        icon={BookOpen}
        title="Focus Cards"
        subtitle="1 Gagasan per Layar"
        badgeTone="indigo"
        delay={0.2}
        yOffset={10}
        className="-left-2 top-0 sm:-left-12 sm:top-2 lg:-left-24 lg:top-4"
      />

      {/* Kanan Atas: Easy Read (Membingkai Tajuk Kanan) */}
      <FloatingCard
        icon={Sparkles}
        title="Easy Read"
        subtitle="Bahasa Ramah Anak"
        badgeTone="emerald"
        delay={0.4}
        yOffset={12}
        className="-right-2 top-2 sm:-right-12 sm:top-4 lg:-right-24 lg:top-6"
      />

      {/* Kiri Bawah: Mode Dengarkan */}
      <FloatingCard
        icon={Volume2}
        title="Mode Dengarkan"
        subtitle="Audio Sinkron Alami"
        badgeTone="violet"
        delay={0.6}
        yOffset={9}
        className="-left-2 bottom-20 sm:-left-10 sm:bottom-24 lg:-left-20 lg:bottom-28"
      />

      {/* Kanan Bawah: Kendali Guru */}
      <FloatingCard
        icon={ShieldCheck}
        title="Kendali Penuh Guru"
        subtitle="100% Wajib Disetujui"
        badgeTone="coral"
        delay={0.8}
        yOffset={11}
        className="-right-2 bottom-16 sm:-right-10 sm:bottom-20 lg:-right-20 lg:bottom-24"
      />

      {/* Titik-titik warna ceria mengambang seperti di Teman Akun */}
      <motion.span
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="absolute left-8 top-28 size-2 rounded-full bg-primary/40 hidden sm:block"
      />
      <motion.span
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.5 }}
        className="absolute right-12 top-32 size-2.5 rounded-full bg-coral/50 hidden sm:block"
      />
      <motion.span
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 1 }}
        className="absolute left-24 bottom-12 size-2 rounded-full bg-emerald/50 hidden sm:block"
      />
    </div>
  );
}
