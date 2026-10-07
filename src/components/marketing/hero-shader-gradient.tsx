"use client";

import * as React from "react";
import dynamic from "next/dynamic";

const ShaderCanvasView = dynamic(() => import("./shader-canvas-view"), {
  ssr: false,
});

function subscribe() {
  return () => {};
}

export function HeroShaderGradientBackground() {
  const mounted = React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 92%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 92%)",
      }}
    >
      {/* Fallback ambient color mesh */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#ebedff]/60 via-[#f3f2f8]/40 to-transparent" />

      {/* WebGL gradient renders full-bleed and beautiful */}
      {mounted && (
        <div className="shader-fade-in absolute inset-0">
          <ShaderCanvasView />
        </div>
      )}

      {/* Seamless blend overlay into bottom page canvas background */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-80"
        style={{
          background:
            "linear-gradient(to top, var(--canvas) 0%, color-mix(in srgb, var(--canvas) 70%, transparent) 50%, transparent 100%)",
        }}
      />
    </div>
  );
}
