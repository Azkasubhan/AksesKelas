"use client";

import * as React from "react";
import { ShaderGradientCanvas, ShaderGradient } from "shadergradient";

const ShaderGradientElement = ShaderGradient as unknown as React.ComponentType<Record<string, unknown>>;

export default function ShaderCanvasView() {
  return (
    <ShaderGradientCanvas
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
      pixelDensity={1}
      fov={45}
    >
      <ShaderGradientElement
        control="props"
        enableTransition={false}
        smoothTime={0.2}
        animate="on"
        axesHelper="off"
        bgColor1="#000000"
        bgColor2="#000000"
        brightness={1.2}
        cAzimuthAngle={180}
        cDistance={4.5}
        cPolarAngle={120}
        cameraZoom={1}
        color1="#ebedff"
        color2="#f3f2f8"
        color3="#dbf8ff"
        destination="onCanvas"
        embedMode="off"
        envPreset="city"
        format="gif"
        fov={45}
        frameRate={10}
        gizmoHelper="hide"
        grain="off"
        lightType="3d"
        pixelDensity={1}
        positionX={0}
        positionY={1.8}
        positionZ={0}
        range="disabled"
        rangeEnd={40}
        rangeStart={0}
        reflection={0.1}
        rotationX={0}
        rotationY={0}
        rotationZ={-90}
        shader="defaults"
        type="waterPlane"
        uAmplitude={0}
        uDensity={1}
        uFrequency={3.5}
        uSpeed={0.25}
        uStrength={1.8}
        uTime={0}
        wireframe={false}
        zoomOut={false}
      />
    </ShaderGradientCanvas>
  );
}
