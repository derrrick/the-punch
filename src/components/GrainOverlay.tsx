"use client";

import { useEffect, useRef } from "react";

/**
 * Animated film-grain overlay with varied texture:
 *  - Fine grain (majority): subtle per-pixel noise
 *  - Medium specks (~8%): slightly larger, more opaque
 *  - Warm/cool tint shifts: not pure grayscale — occasional warm or cool pixels
 *
 * 256x256 canvas tiled via CSS, runs at ~24fps for an organic film feel.
 */
export function GrainOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 256;
    canvas.width = size;
    canvas.height = size;

    let animFrame: number;
    let lastTime = 0;
    const interval = 1000 / 24; // 24fps — cinematic cadence

    const drawGrain = (time: number) => {
      animFrame = requestAnimationFrame(drawGrain);

      if (time - lastTime < interval) return;
      lastTime = time;

      const imageData = ctx.createImageData(size, size);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const roll = Math.random();

        if (roll < 0.08) {
          // Medium specks — more visible, slightly warm-tinted
          const v = Math.random() * 200 + 55;
          data[i] = v + 8;       // r — warm push
          data[i + 1] = v;       // g
          data[i + 2] = v - 5;   // b — slightly less blue
          data[i + 3] = 35;      // more opaque
        } else if (roll < 0.12) {
          // Cool specks — slight blue-grey tint for variation
          const v = Math.random() * 180 + 40;
          data[i] = v - 6;       // r
          data[i + 1] = v;       // g
          data[i + 2] = v + 10;  // b — cool push
          data[i + 3] = 28;
        } else {
          // Fine grain — standard noise
          const v = Math.random() * 255;
          data[i] = v;
          data[i + 1] = v;
          data[i + 2] = v;
          data[i + 3] = 22;
        }
      }

      ctx.putImageData(imageData, 0, 0);
    };

    animFrame = requestAnimationFrame(drawGrain);

    return () => cancelAnimationFrame(animFrame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[150] h-full w-full opacity-55"
      style={{
        imageRendering: "pixelated",
        width: "100%",
        height: "100%",
        mixBlendMode: "overlay",
      }}
    />
  );
}
