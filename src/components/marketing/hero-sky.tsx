"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

const ShaderCanvasView = dynamic(() => import("./shader-canvas-view"), {
  ssr: false,
});

function subscribe() {
  return () => {};
}

type Depth = "far" | "mid" | "near";

interface EntranceConfig {
  x?: number;
  y?: number;
  scale?: number;
  delay: number;
  duration: number;
}

interface CloudSpec {
  id: string;
  depth: Depth;
  top: string;
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

const CLOUDS: CloudSpec[] = [
  // Awan Kiri (Muncul meluncur mulus dari sisi kiri layar saat refresh)
  {
    id: "near-left",
    depth: "near",
    top: "12%",
    left: "-3%",
    width: 320,
    opacity: 0.98,
    shape: 0,
    floatDelay: 0,
    floatDuration: 14,
    entrance: { x: -130, delay: 0.12, duration: 1.15 },
  },
  {
    id: "mid-left",
    depth: "mid",
    top: "52%",
    left: "3%",
    width: 230,
    opacity: 0.86,
    shape: 1,
    floatDelay: -2,
    floatDuration: 20,
    entrance: { x: -95, delay: 0.28, duration: 1.25 },
  },
  {
    id: "far-top-left",
    depth: "far",
    top: "2%",
    left: "18%",
    width: 125,
    opacity: 0.38,
    blur: "2px",
    shape: 2,
    floatDelay: -9,
    floatDuration: 22,
    entrance: { x: -60, y: -15, delay: 0.42, duration: 1.4 },
  },

  // Awan Kanan (Muncul meluncur mulus dari sisi kanan layar saat refresh)
  {
    id: "near-right",
    depth: "near",
    top: "8%",
    right: "-2%",
    width: 300,
    opacity: 0.95,
    shape: 1,
    floatDelay: -4,
    floatDuration: 16,
    entrance: { x: 130, delay: 0.18, duration: 1.15 },
  },
  {
    id: "mid-right",
    depth: "mid",
    top: "40%",
    right: "6%",
    width: 220,
    opacity: 0.82,
    shape: 2,
    floatDelay: -7,
    floatDuration: 18,
    entrance: { x: 95, delay: 0.32, duration: 1.25 },
  },
  {
    id: "far-top-right",
    depth: "far",
    top: "5%",
    right: "24%",
    width: 140,
    opacity: 0.45,
    blur: "1.5px",
    shape: 1,
    floatDelay: -12,
    floatDuration: 26,
    entrance: { x: 60, y: -15, delay: 0.48, duration: 1.4 },
  },

  // Awan Tengah Atas (Muncul mengembang lembut dari atas ke posisi)
  {
    id: "far-center",
    depth: "far",
    top: "3%",
    left: "45%",
    width: 150,
    opacity: 0.42,
    blur: "1.5px",
    shape: 0,
    floatDelay: -5,
    floatDuration: 24,
    entrance: { y: -35, scale: 0.88, delay: 0.35, duration: 1.35 },
  },
];

const SHAPES: Record<CloudSpec["shape"], { circles: [number, number, number][]; base: [number, number, number, number] }> = {
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

function Cloud({ shape }: { shape: CloudSpec["shape"] }) {
  const id = React.useId().replace(/:/g, "");
  const { circles, base } = SHAPES[shape];
  return (
    <svg viewBox="0 0 200 100" className="block h-auto w-full" aria-hidden="true">
      <defs>
        <linearGradient id={`cloud-${id}`} x1="0" y1="10" x2="0" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="65%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#dce8fa" />
        </linearGradient>
      </defs>
      <g fill={`url(#cloud-${id})`}>
        {circles.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} />
        ))}
        <rect x={base[0]} y={base[1]} width={base[2]} height={base[3]} rx={base[3] / 2} />
      </g>
    </svg>
  );
}

export function HeroSky() {
  const reduce = useReducedMotion();
  const mounted = React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const { scrollY } = useScroll();
  const farY = useTransform(scrollY, [0, 700], [0, reduce ? 0 : -25]);
  const midY = useTransform(scrollY, [0, 700], [0, reduce ? 0 : -60]);
  const nearY = useTransform(scrollY, [0, 700], [0, reduce ? 0 : -110]);
  const layerY: Record<Depth, typeof farY> = { far: farY, mid: midY, near: nearY };

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden">
      {/* 1. Latar ShaderGradient 3D yang bergerak halus tanpa grain */}
      {mounted && (
        <div className="shader-fade-in absolute inset-0 opacity-80">
          <ShaderCanvasView />
        </div>
      )}

      {/* 2. Soft sky blend overlay dengan aura terang di tengah agar teks 'bebas dipahami' tidak nabrak */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 38%, rgba(255, 255, 255, 0.5) 0%, transparent 80%), linear-gradient(180deg, rgba(195, 224, 253, 0.22) 0%, rgba(222, 237, 254, 0.35) 45%, rgba(248, 248, 245, 0.85) 85%, var(--canvas) 100%)",
        }}
      />

      {/* 3. Awan-awan dengan motion entrance saat refresh + continuous floating */}
      {(["far", "mid", "near"] as Depth[]).map((depth) => (
        <motion.div key={depth} className="absolute inset-0" style={{ y: layerY[depth] }}>
          {CLOUDS.filter((c) => c.depth === depth).map((c) => (
            <motion.div
              key={c.id}
              className="absolute"
              style={{
                top: c.top,
                left: c.left,
                right: c.right,
                width: `min(${c.width}px, ${Math.round(c.width / 4)}vw + ${Math.round(c.width / 2)}px)`,
                filter: c.blur
                  ? `blur(${c.blur})`
                  : c.depth === "near"
                    ? "drop-shadow(0 14px 22px rgba(66, 104, 176, 0.16))"
                    : "drop-shadow(0 10px 14px rgba(66, 104, 176, 0.1))",
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
                <Cloud shape={c.shape} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      ))}

      {/* 4. Transisi mulus ke kanvas halaman di bawah */}
      <div
        className="absolute inset-x-0 bottom-0 h-36"
        style={{ background: "linear-gradient(to top, var(--canvas) 0%, transparent 100%)" }}
      />
    </div>
  );
}
