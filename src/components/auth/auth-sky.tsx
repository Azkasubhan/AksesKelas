"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

type Depth = "far" | "mid" | "near";

interface EntranceConfig {
  x?: number;
  y?: number;
  scale?: number;
  delay: number;
  duration: number;
}

interface AuthCloudSpec {
  id: string;
  side: "left" | "right";
  depth: Depth;
  bottom: string;
  left?: string;
  right?: string;
  width: number;
  opacity: number;
  blur?: string;
  shape: 0 | 1 | 2;
  floatDelay: number;
  floatDuration: number;
  entrance: EntranceConfig;
}

const AUTH_CLOUDS: AuthCloudSpec[] = [
  // Awan Kiri (Muncul meluncur mulus dari sisi kiri layar)
  {
    id: "auth-near-left",
    side: "left",
    depth: "near",
    bottom: "3%",
    left: "-2%",
    width: 320,
    opacity: 0.98,
    shape: 0,
    floatDelay: 0,
    floatDuration: 15,
    entrance: { x: -140, delay: 0.12, duration: 1.15 },
  },
  {
    id: "auth-mid-left",
    side: "left",
    depth: "mid",
    bottom: "28%",
    left: "2%",
    width: 240,
    opacity: 0.88,
    shape: 1,
    floatDelay: -3,
    floatDuration: 19,
    entrance: { x: -100, delay: 0.28, duration: 1.25 },
  },
  {
    id: "auth-far-left",
    side: "left",
    depth: "far",
    bottom: "54%",
    left: "6%",
    width: 150,
    opacity: 0.65,
    blur: "1px",
    shape: 2,
    floatDelay: -7,
    floatDuration: 23,
    entrance: { x: -70, y: -10, delay: 0.42, duration: 1.35 },
  },

  // Awan Kanan (Muncul meluncur mulus dari sisi kanan layar)
  {
    id: "auth-near-right",
    side: "right",
    depth: "near",
    bottom: "4%",
    right: "-2%",
    width: 320,
    opacity: 0.96,
    shape: 1,
    floatDelay: -4,
    floatDuration: 16,
    entrance: { x: 140, delay: 0.18, duration: 1.15 },
  },
  {
    id: "auth-mid-right",
    side: "right",
    depth: "mid",
    bottom: "30%",
    right: "2%",
    width: 240,
    opacity: 0.86,
    shape: 0,
    floatDelay: -6,
    floatDuration: 18,
    entrance: { x: 100, delay: 0.32, duration: 1.25 },
  },
  {
    id: "auth-far-right",
    side: "right",
    depth: "far",
    bottom: "56%",
    right: "6%",
    width: 150,
    opacity: 0.60,
    blur: "1px",
    shape: 2,
    floatDelay: -10,
    floatDuration: 25,
    entrance: { x: 70, y: -10, delay: 0.48, duration: 1.35 },
  },
];

const SHAPES: Record<
  0 | 1 | 2,
  { circles: [number, number, number][]; base: [number, number, number, number] }
> = {
  0: {
    circles: [
      [52, 64, 24],
      [86, 46, 34],
      [124, 52, 28],
      [154, 66, 20],
    ],
    base: [30, 60, 146, 28],
  },
  1: {
    circles: [
      [44, 66, 20],
      [72, 50, 28],
      [108, 38, 34],
      [144, 54, 26],
      [168, 70, 16],
    ],
    base: [26, 62, 158, 26],
  },
  2: {
    circles: [
      [60, 60, 26],
      [98, 48, 32],
      [134, 62, 22],
    ],
    base: [38, 62, 116, 24],
  },
};

function AuthCloudItem({ shape }: { shape: 0 | 1 | 2 }) {
  const id = React.useId().replace(/:/g, "");
  const { circles, base } = SHAPES[shape];

  return (
    <svg viewBox="0 0 200 100" className="block h-auto w-full" aria-hidden="true">
      <defs>
        <linearGradient
          id={`auth-cloud-${id}`}
          x1="0"
          y1="10"
          x2="0"
          y2="90"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="68%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#dce8fa" />
        </linearGradient>
      </defs>
      <g fill={`url(#auth-cloud-${id})`}>
        {circles.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} />
        ))}
        <rect
          x={base[0]}
          y={base[1]}
          width={base[2]}
          height={base[3]}
          rx={base[3] / 2}
        />
      </g>
    </svg>
  );
}

export function AuthSky() {
  const reduce = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden"
    >
      {/* 1. Latar Belakang Langit Biru Cerah di Bagian Bawah Halaman */}
      <div
        className="absolute inset-x-0 bottom-0 h-[65vh] min-h-[440px] pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(250, 248, 245, 0) 0%, rgba(220, 238, 255, 0.45) 28%, rgba(185, 220, 255, 0.75) 65%, rgba(145, 202, 255, 0.95) 100%)",
        }}
      />

      {/* 2. Soft Radial Horizon Glow di Bawah Tengah */}
      <div
        className="absolute inset-x-0 bottom-0 h-[45vh] min-h-[300px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 95% 80% at 50% 100%, rgba(135, 192, 255, 0.65) 0%, rgba(180, 218, 255, 0.35) 55%, transparent 85%)",
        }}
      />

      {/* 3. Awan-awan melayang dengan animasi masuk dari kanan dan kiri */}
      {AUTH_CLOUDS.map((c) => (
        <motion.div
          key={c.id}
          className="absolute"
          style={{
            bottom: c.bottom,
            left: c.left,
            right: c.right,
            width: `min(${c.width}px, 35vw)`,
            filter: c.blur
              ? `blur(${c.blur})`
              : c.depth === "near"
                ? "drop-shadow(0 14px 24px rgba(45, 85, 175, 0.18))"
                : "drop-shadow(0 10px 16px rgba(45, 85, 175, 0.12))",
          }}
          initial={
            reduce
              ? false
              : {
                  x: c.entrance.x ?? 0,
                  y: c.entrance.y ?? 0,
                  scale: c.entrance.scale ?? 1,
                  opacity: 0,
                }
          }
          animate={{
            x: 0,
            y: 0,
            scale: 1,
            opacity: c.opacity,
          }}
          transition={{
            duration: c.entrance.duration,
            delay: c.entrance.delay,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <div
            className="cloud-floating w-full"
            style={
              {
                "--float-dur": `${c.floatDuration}s`,
                "--float-delay": `${c.floatDelay}s`,
              } as React.CSSProperties
            }
          >
            <AuthCloudItem shape={c.shape} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
