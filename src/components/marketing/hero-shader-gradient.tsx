"use client";

import * as React from "react";

export function HeroShaderGradientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
    >
      {/* Pencahayaan ambient halus di bagian atas hero */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(59, 82, 212, 0.05) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

