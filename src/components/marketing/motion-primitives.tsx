"use client";

import * as React from "react";
import { motion, MotionConfig } from "motion/react";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Honors the OS "reduce motion" setting for every transform animation beneath it. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

/** Enters with a slight tilt toward the viewer, used for product visuals. */
export function TiltIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div className={`[perspective:1200px] ${className ?? ""}`}>
      <motion.div
        initial={{ opacity: 0, rotateX: 14, y: 40 }}
        whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, delay, ease: EASE_OUT }}
        style={{ transformOrigin: "50% 100%" }}
      >
        {children}
      </motion.div>
    </div>
  );
}
