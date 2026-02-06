"use client";

import { useEffect, useRef } from "react";

/**
 * Two-layer custom cursor:
 *  - Inner dot: follows mouse near-instantly (lerp 0.85) — feels direct
 *  - Outer ring: trails with elegant lag (lerp 0.15) — feels fluid
 *
 * On foundry cards: ring expands + fills dark, dot hides, "View" label appears
 * On links/buttons: ring grows slightly with stronger border
 * Click: everything contracts sharply, snaps back
 * Magnetic pull on small interactive elements
 *
 * Zero GSAP dependency — pure rAF for maximum responsiveness.
 */
export function MagneticCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const dot = dotRef.current!;
    const ring = ringRef.current!;
    const label = labelRef.current!;
    if (!dot || !ring || !label) return;

    let mx = 0, my = 0;           // raw mouse position
    let dX = 0, dY = 0;           // dot position (fast)
    let rX = 0, rY = 0;           // ring position (slow)
    let visible = false;
    let state: "default" | "card" | "link" = "default";
    let running = true;

    // Targets — lerped smoothly each frame
    let tRingSize = 32;
    let tDotScale = 1;
    let tRingBorder = 0.2;
    let tRingBg = 0;              // 0 = transparent, 1 = filled
    let tLabelOpacity = 0;
    let tLabelScale = 0.5;

    // Current values
    let cRingSize = 32;
    let cDotScale = 1;
    let cRingBorder = 0.2;
    let cRingBg = 0;
    let cLabelOpacity = 0;
    let cLabelScale = 0.5;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    function tick() {
      if (!running) return;
      requestAnimationFrame(tick);

      // Dot — fast follow
      dX = lerp(dX, mx, 0.85);
      dY = lerp(dY, my, 0.85);

      // Ring — smooth trail
      rX = lerp(rX, mx, 0.15);
      rY = lerp(rY, my, 0.15);

      // Smooth all properties
      cRingSize = lerp(cRingSize, tRingSize, 0.18);
      cDotScale = lerp(cDotScale, tDotScale, 0.25);
      cRingBorder = lerp(cRingBorder, tRingBorder, 0.18);
      cRingBg = lerp(cRingBg, tRingBg, 0.15);
      cLabelOpacity = lerp(cLabelOpacity, tLabelOpacity, 0.18);
      cLabelScale = lerp(cLabelScale, tLabelScale, 0.18);

      const halfRing = cRingSize / 2;

      // Dot
      dot.style.transform = `translate3d(${dX - 3}px, ${dY - 3}px, 0) scale(${cDotScale})`;

      // Ring
      ring.style.transform = `translate3d(${rX - halfRing}px, ${rY - halfRing}px, 0)`;
      ring.style.width = ring.style.height = `${cRingSize}px`;
      ring.style.borderColor = `rgba(23, 23, 23, ${cRingBorder})`;
      ring.style.backgroundColor = `rgba(23, 23, 23, ${cRingBg * 0.88})`;

      // Label
      label.style.opacity = `${cLabelOpacity}`;
      label.style.transform = `scale(${cLabelScale})`;
    }

    function setState(newState: "default" | "card" | "link") {
      if (state === newState) return;
      state = newState;

      if (newState === "card") {
        tRingSize = 64;
        tRingBorder = 0;
        tRingBg = 1;
        tDotScale = 0;
        tLabelOpacity = 1;
        tLabelScale = 1;
      } else if (newState === "link") {
        tRingSize = 40;
        tRingBorder = 0.35;
        tRingBg = 0;
        tDotScale = 1;
        tLabelOpacity = 0;
        tLabelScale = 0.5;
      } else {
        tRingSize = 32;
        tRingBorder = 0.2;
        tRingBg = 0;
        tDotScale = 1;
        tLabelOpacity = 0;
        tLabelScale = 0.5;
      }
    }

    function onMouseMove(e: MouseEvent) {
      mx = e.clientX;
      my = e.clientY;

      if (!visible) {
        visible = true;
        dX = mx; dY = my;
        rX = mx; rY = my;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }

      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el) return;

      const card = el.closest("[data-cursor='card']");
      const link = el.closest("a, button, [data-cursor='link']");

      if (card) setState("card");
      else if (link) setState("link");
      else setState("default");

      // Magnetic pull on small interactive elements
      if (link && !card) {
        const rect = (link as HTMLElement).getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const ddx = e.clientX - cx;
        const ddy = e.clientY - cy;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy);
        if (dist < 50) {
          const pull = 0.2 * (1 - dist / 50);
          mx = e.clientX - ddx * pull;
          my = e.clientY - ddy * pull;
        }
      }
    }

    function onMouseLeave() {
      visible = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    }

    function onMouseDown() {
      // Contract everything
      tRingSize *= 0.82;
      tDotScale *= 0.7;
    }

    function onMouseUp() {
      // Restore based on current state
      setState("default"); // force recalc
      state = "default";   // reset so setState works
      // Re-detect from current position
      const el = document.elementFromPoint(mx, my);
      if (el) {
        const card = el.closest("[data-cursor='card']");
        const link = el.closest("a, button, [data-cursor='link']");
        if (card) setState("card");
        else if (link) setState("link");
        else setState("default");
      }
    }

    requestAnimationFrame(tick);
    document.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.documentElement.classList.add("custom-cursor-active");

    return () => {
      running = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.documentElement.classList.remove("custom-cursor-active");
    };
  }, []);

  return (
    <>
      {/* Inner dot — snappy, solid, always tracks precisely */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none z-[201] rounded-full opacity-0"
        style={{
          width: 6,
          height: 6,
          backgroundColor: "#171717",
          willChange: "transform",
          transition: "opacity 0.15s",
        }}
      />
      {/* Outer ring — trailing, morphs on context */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none z-[200] rounded-full opacity-0 flex items-center justify-center"
        style={{
          width: 32,
          height: 32,
          border: "1.5px solid rgba(23, 23, 23, 0.2)",
          backgroundColor: "transparent",
          willChange: "transform, width, height",
          transition: "opacity 0.15s",
        }}
      >
        <span
          ref={labelRef}
          className="text-[10px] font-medium uppercase tracking-widest text-white select-none whitespace-nowrap"
          style={{ opacity: 0, transform: "scale(0.5)" }}
        >
          View
        </span>
      </div>
    </>
  );
}
