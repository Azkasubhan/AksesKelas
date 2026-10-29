"use client";

import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { Reveal } from "./motion-primitives";

type LayerId = "asli" | "easy" | "focus" | "listen";

const ORIGINAL =
  "Setelah dikunyah di rongga mulut, bolus makanan didorong oleh gerak peristaltik kerongkongan menuju lambung melalui sfingter esofagus bagian bawah.";
const EASY =
  "Makanan yang sudah dikunyah ditelan lewat kerongkongan, lalu masuk ke dalam lambung melalui pintu berotot.";

interface Layer {
  id: LayerId;
  name: string;
  description: string;
}

const LAYERS: Layer[] = [
  {
    id: "asli",
    name: "Teks asli",
    description: "Sumber guru tetap utuh dan menjadi rujukan bagi setiap adaptasi.",
  },
  {
    id: "easy",
    name: "Easy Read",
    description: "Kalimat dipendekkan dan istilah sulit dijelaskan, tanpa mengubah isi.",
  },
  {
    id: "focus",
    name: "Focus Cards",
    description: "Satu gagasan per kartu, dibaca berurutan dengan Sebelumnya dan Berikutnya.",
  },
  {
    id: "listen",
    name: "Listen",
    description: "Pembacaan bersuara langsung dari peramban, dapat dihentikan kapan saja.",
  },
];

const WAVE = [10, 18, 28, 16, 34, 22, 40, 26, 14, 30, 38, 20, 12, 28, 36, 18, 24, 32, 14, 22, 30, 16, 10, 20];

function CardBody({ id }: { id: LayerId }) {
  if (id === "asli") {
    return (
      <motion.div
        key="asli"
        initial={{ opacity: 0.8, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <p className="font-heading text-lg font-bold text-ink">Sistem Pencernaan Manusia</p>
        <p className="mt-3 text-[15px] leading-[1.75] text-ink/85">{ORIGINAL}</p>
        <p className="mt-5 font-mono text-[11px] text-muted">Buku IPA VIII · Bab 4 · Hal. 14</p>
      </motion.div>
    );
  }
  if (id === "easy") {
    return (
      <motion.div
        key="easy"
        initial={{ opacity: 0.8, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <p className="font-heading text-lg font-bold text-ink">Makanan Masuk ke Lambung</p>
        <p className="mt-3 text-[17px] leading-[1.8] text-ink">{EASY}</p>
        <p className="mt-5 font-mono text-[11px] text-muted">Merujuk blok sumber 14.1 – 14.2</p>
      </motion.div>
    );
  }
  if (id === "focus") {
    return (
      <motion.div
        key="focus"
        initial={{ opacity: 0.8, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="font-semibold text-ink">Kartu 1 dari 3</span>
          <span className="font-mono text-[11px] font-medium text-muted">Bolus makanan</span>
        </div>
        <p className="mt-4 font-heading text-xl font-bold text-ink">Makanan Masuk ke Lambung</p>
        <p className="mt-2 text-[17px] leading-[1.75] text-ink">{EASY}</p>
        <div className="mt-6 flex items-center gap-1.5" aria-hidden="true">
          <span className="h-1.5 w-7 rounded-full bg-primary" />
          <span className="h-1.5 w-3 rounded-full bg-line" />
          <span className="h-1.5 w-3 rounded-full bg-line" />
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div
      key="listen"
      initial={{ opacity: 0.8, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <p className="font-heading text-lg font-bold text-ink">Makanan Masuk ke Lambung</p>
      <div className="mt-5 flex h-12 items-center gap-[3px]" aria-hidden="true">
        {WAVE.map((h, i) => (
          <motion.span
            key={i}
            className={`w-1 rounded-full ${i < 14 ? "bg-primary" : "bg-primary/20"}`}
            style={{ height: h, transformOrigin: "center" }}
            initial={{ scaleY: 0.2 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.5, delay: i * 0.025, ease: "easeOut" }}
          />
        ))}
      </div>
      <p className="mt-4 text-[15px] leading-[1.7] text-ink/85">{EASY}</p>
      <p className="mt-4 text-xs text-muted">Suara bahasa Indonesia dari peramban Anda</p>
    </motion.div>
  );
}

export function ProductStage() {
  const [active, setActive] = React.useState<LayerId>("focus");
  const reduce = useReducedMotion();
  const activeIndex = LAYERS.findIndex((l) => l.id === active);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateY = useSpring(mx, { stiffness: 120, damping: 18 });
  const rotateX = useSpring(my, { stiffness: 120, damping: 18 });

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 12);
    my.set(-((e.clientY - r.top) / r.height - 0.5) * 9);
  }
  function onPointerLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <section id="keunggulan" className="relative px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <Reveal>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-ink sm:text-5xl sm:leading-[1.1]">
              Satu materi, empat lapisan membaca.
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink/70 sm:text-lg">
              Guru mengunggah satu sumber. Murid memilih lapisan yang terasa nyaman, dan dapat memadukannya sesuai kebutuhan.
            </p>
          </Reveal>

          <Reveal delay={0.1} className="mt-8">
            <div role="group" aria-label="Pilih lapisan bacaan" className="flex flex-col gap-2">
              {LAYERS.map((layer) => {
                const isActive = layer.id === active;
                return (
                  <button
                    key={layer.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActive(layer.id)}
                    className="group relative flex min-h-14 items-start rounded-[12px] px-4 py-3.5 text-left transition-colors hover:bg-ink/[0.03] focus-visible:outline-focus"
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="stage-active"
                        className="absolute inset-0 rounded-[12px] bg-surface shadow-[0_1px_2px_rgba(19,23,21,0.06),0_8px_24px_-12px_rgba(19,23,21,0.18)]"
                        transition={{ type: "spring", stiffness: 380, damping: 34 }}
                      />
                    ) : null}
                    <span className="relative z-10">
                      <span
                        className={`block text-base sm:text-[17px] font-bold tracking-tight transition-colors ${
                          isActive ? "text-ink" : "text-ink/85 group-hover:text-ink"
                        }`}
                      >
                        {layer.name}
                      </span>
                      <span
                        className={`mt-1 block text-sm leading-relaxed transition-colors ${
                          isActive ? "text-ink/75" : "text-muted group-hover:text-ink/65"
                        }`}
                      >
                        {layer.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Reveal>
        </div>

        {/* 3D stack of reading layers */}
        <Reveal delay={0.15} className="lg:col-span-7">
          <div
            className="relative mx-auto h-[420px] w-full max-w-[560px] [perspective:1400px] sm:h-[440px]"
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
          >
            <motion.div
              className="absolute inset-0"
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            >
              {LAYERS.map((layer, i) => {
                const rank = (i - activeIndex + LAYERS.length) % LAYERS.length;
                return (
                  <motion.article
                    key={layer.id}
                    aria-hidden={rank !== 0}
                    aria-label={layer.name}
                    className="absolute left-0 top-14 w-[calc(100%-84px)] rounded-[16px] bg-surface p-6 shadow-[0_2px_4px_rgba(19,23,21,0.05),0_30px_60px_-24px_rgba(19,23,21,0.28)] sm:p-7"
                    style={{ zIndex: LAYERS.length - rank }}
                    initial={false}
                    animate={{
                      x: rank * 28,
                      y: -rank * 28,
                      z: -rank * 80,
                      opacity: 1 - rank * 0.2,
                    }}
                    transition={{ type: "spring", stiffness: 190, damping: 26 }}
                  >
                    <span className="mb-3 block font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
                      {layer.name}
                    </span>
                    <CardBody key={rank === 0 ? `${layer.id}-front` : layer.id} id={layer.id} />
                  </motion.article>
                );
              })}
            </motion.div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
