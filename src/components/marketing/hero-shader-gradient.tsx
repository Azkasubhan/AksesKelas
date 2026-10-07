"use client";

import * as React from "react";
import dynamic from "next/dynamic";

const ShaderCanvasView = dynamic(
  () => import("./shader-canvas-view"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-gradient-to-b from-[#ebedff]/60 via-[#f3f2f8]/40 to-transparent" />
    ),
  }
);

function subscribe() {
  return () => {};
}

export function HeroShaderGradientBackground() {
  const mounted = React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {/* Fallback ambient color mesh */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#ebedff]/70 via-[#f3f2f8]/40 to-transparent" />

      {/* Interactive 3D WebGL ShaderGradient with silky fade-in */}
      {mounted && (
        <div className="absolute inset-0 transition-opacity duration-1000 ease-out">
          <ShaderCanvasView />
        </div>
      )}

      {/* Subtle blend mask into bottom page background */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-canvas to-transparent" />
    </div>
  );
}
