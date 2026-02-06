"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight animated film-grain overlay using a small canvas texture
 * tiled via CSS. Runs at ~30fps for a subtle tactile paper-like quality.
 * The canvas is tiny (128x128) and repeats, so performance impact is minimal.
 */
export function GrainOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 128;
    canvas.width = size;
    canvas.height = size;

    let animFrame: number;
    let lastTime = 0;
    const interval = 1000 / 30; // 30fps

    const drawGrain = (time: number) => {
      animFrame = requestAnimationFrame(drawGrain);

      if (time - lastTime < interval) return;
      lastTime = time;

      const imageData = ctx.createImageData(size, size);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = v;     // r
        data[i + 1] = v; // g
        data[i + 2] = v; // b
        data[i + 3] = 14; // alpha — very subtle
      }

      ctx.putImageData(imageData, 0, 0);
    };

    animFrame = requestAnimationFrame(drawGrain);

    return () => cancelAnimationFrame(animFrame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[150] h-full w-full opacity-40"
      style={{
        imageRendering: "pixelated",
        width: "100%",
        height: "100%",
        mixBlendMode: "overlay",
      }}
    />
  );
}
