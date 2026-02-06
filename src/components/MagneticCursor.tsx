"use client";

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";

export function MagneticCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorLabelRef = useRef<HTMLSpanElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const isVisible = useRef(false);
  const currentState = useRef<"default" | "card" | "link">("default");

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const tick = useCallback(() => {
    pos.current.x = lerp(pos.current.x, target.current.x, 0.15);
    pos.current.y = lerp(pos.current.y, target.current.y, 0.15);

    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
    }

    requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    // Only show custom cursor on devices with fine pointer (mouse)
    if (typeof window === "undefined") return;
    const hasFineMouse = window.matchMedia("(pointer: fine)").matches;
    if (!hasFineMouse) return;

    const cursor = cursorRef.current;
    const label = cursorLabelRef.current;
    if (!cursor || !label) return;

    // Start animation loop
    const raf = requestAnimationFrame(tick);

    const onMouseMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;

      if (!isVisible.current) {
        isVisible.current = true;
        gsap.to(cursor, { opacity: 1, duration: 0.3 });
        // Snap immediately on first move
        pos.current.x = e.clientX;
        pos.current.y = e.clientY;
      }

      // Detect what we're hovering over
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el) return;

      const card = el.closest("[data-cursor='card']");
      const link = el.closest("a, button, [data-cursor='link']");

      if (card && currentState.current !== "card") {
        currentState.current = "card";
        gsap.to(cursor, {
          width: 80,
          height: 80,
          backgroundColor: "rgba(23, 23, 23, 0.9)",
          duration: 0.4,
          ease: "power3.out",
        });
        gsap.to(label, { opacity: 1, scale: 1, duration: 0.3 });
      } else if (!card && link && currentState.current !== "link") {
        currentState.current = "link";
        gsap.to(cursor, {
          width: 40,
          height: 40,
          backgroundColor: "rgba(23, 23, 23, 0.6)",
          duration: 0.3,
          ease: "power3.out",
        });
        gsap.to(label, { opacity: 0, scale: 0.5, duration: 0.2 });
      } else if (!card && !link && currentState.current !== "default") {
        currentState.current = "default";
        gsap.to(cursor, {
          width: 12,
          height: 12,
          backgroundColor: "rgba(23, 23, 23, 0.8)",
          duration: 0.3,
          ease: "power3.out",
        });
        gsap.to(label, { opacity: 0, scale: 0.5, duration: 0.2 });
      }

      // Magnetic pull toward nearby interactive elements
      if (link && !card) {
        const rect = (link as HTMLElement).getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 80) {
          const pull = 0.3 * (1 - dist / 80);
          target.current.x = e.clientX - dx * pull;
          target.current.y = e.clientY - dy * pull;
        }
      }
    };

    const onMouseLeave = () => {
      isVisible.current = false;
      gsap.to(cursor, { opacity: 0, duration: 0.3 });
    };

    const onMouseDown = () => {
      gsap.to(cursor, { scale: 0.8, duration: 0.15 });
    };

    const onMouseUp = () => {
      gsap.to(cursor, { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.4)" });
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);

    // Hide default cursor site-wide
    document.documentElement.classList.add("custom-cursor-active");

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.documentElement.classList.remove("custom-cursor-active");
    };
  }, [tick]);

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none z-[200] flex items-center justify-center rounded-full opacity-0"
      style={{
        width: 12,
        height: 12,
        backgroundColor: "rgba(23, 23, 23, 0.8)",
        marginLeft: -6,
        marginTop: -6,
        willChange: "transform, width, height",
        mixBlendMode: "exclusion",
      }}
    >
      <span
        ref={cursorLabelRef}
        className="text-[10px] font-medium uppercase tracking-wider text-white opacity-0 scale-50 select-none whitespace-nowrap"
      >
        View
      </span>
    </div>
  );
}
