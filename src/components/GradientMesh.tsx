"use client";

import { useEffect, useRef } from "react";

/**
 * Full-page gradient mesh that subtly shifts color based on scroll position.
 * Warm tones at top (hero), cooler neutrals in the middle (grid), warm at bottom.
 * Uses CSS background-image with radial gradients animated via scroll.
 */
export function GradientMesh() {
  const meshRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = meshRef.current;
    if (!el) return;

    let raf: number;
    let prevProgress = -1;

    const onScroll = () => {
      raf = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? scrollY / docHeight : 0;

        // Only update if changed meaningfully (avoid redundant paints)
        const rounded = Math.round(progress * 100);
        if (rounded === prevProgress) return;
        prevProgress = rounded;

        // Shift gradient positions and hues based on scroll
        // Top: warm peach/amber  |  Middle: cool slate/blue  |  Bottom: warm again
        const warmth = Math.sin(progress * Math.PI); // peaks in middle (0→1→0)
        const hue1 = 30 + warmth * -20;    // 30 (amber) → 10 (warm red) in middle
        const hue2 = 220 + warmth * 20;     // 220 (blue) → 240 in middle
        const sat1 = 60 - warmth * 30;      // desaturate in middle
        const offsetY = progress * 40;       // shift gradient position

        el.style.background = `
          radial-gradient(ellipse 80% 50% at 20% ${10 + offsetY}%, hsla(${hue1}, ${sat1}%, 92%, 0.5) 0%, transparent 70%),
          radial-gradient(ellipse 60% 40% at 80% ${50 + offsetY * 0.5}%, hsla(${hue2}, 25%, 90%, 0.35) 0%, transparent 60%),
          radial-gradient(ellipse 70% 50% at 50% ${80 - offsetY * 0.3}%, hsla(${hue1 + 15}, 40%, 93%, 0.4) 0%, transparent 65%),
          var(--background)
        `;
      });
    };

    onScroll(); // initial paint
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={meshRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ background: "var(--background)" }}
    />
  );
}
