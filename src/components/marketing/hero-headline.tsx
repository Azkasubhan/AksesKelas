"use client";

import { motion } from "motion/react";

interface Line {
  words: string[];
  className?: string;
  underline?: boolean;
}

const LINES: Line[] = [
  { words: ["Satu", "materi", "pelajaran,"], className: "text-ink" },
  { words: ["bebas", "dipahami"], className: "text-primary" },
  { words: ["semua", "murid"], className: "text-coral", underline: true },
];

const TOTAL_WORDS = LINES.reduce((n, l) => n + l.words.length, 0);

export function HeroHeadline({ className }: { className?: string }) {
  let index = 0;

  return (
    <h1 className={className} aria-label="Satu materi pelajaran, bebas dipahami semua murid">
      {LINES.map((line, li) => (
        <span key={li} className="block" aria-hidden="true">
          <span className="relative inline-block">
            {line.words.map((word, wi) => {
              const delay = 0.2 + index++ * 0.11;
              return (
                <span key={wi}>
                  <span className="inline-block overflow-hidden py-[0.12em] align-bottom -my-[0.12em]">
                    <motion.span
                      className={`inline-block ${line.className ?? ""}`}
                      initial={{ y: "115%", opacity: 0, rotate: 2, scale: 0.95 }}
                      animate={{ y: "0%", opacity: 1, rotate: 0, scale: 1 }}
                      transition={{
                        duration: 0.65,
                        delay,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      {word}
                    </motion.span>
                  </span>
                  {wi < line.words.length - 1 ? " " : null}
                </span>
              );
            })}

            {line.underline ? (
              <svg
                className="absolute -bottom-2 left-0 w-full text-coral pointer-events-none"
                viewBox="0 0 250 12"
                fill="none"
                preserveAspectRatio="none"
              >
                <motion.path
                  d="M3 9C60 2 190 2 247 9"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.2 + TOTAL_WORDS * 0.11 + 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              </svg>
            ) : null}
          </span>
        </span>
      ))}
    </h1>
  );
}
