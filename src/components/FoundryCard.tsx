"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Foundry } from "@/lib/foundries";

gsap.registerPlugin(ScrollTrigger);

interface FoundryCardProps {
  foundry: Foundry;
  index?: number;
  animateOnScroll?: boolean;
  columnIndex?: number;
}

// Generate a consistent gradient based on the foundry name
function generateGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue1 = Math.abs(hash % 360);
  const hue2 = Math.abs((hash >> 8) % 360);

  return `linear-gradient(135deg, hsl(${hue1}, 60%, 85%), hsl(${hue2}, 60%, 80%))`;
}

export function FoundryCard({ foundry, animateOnScroll = true, columnIndex = 0 }: FoundryCardProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLElement>(null);
  const hasScreenshot = foundry.images?.screenshot;

  useEffect(() => {
    if (!animateOnScroll || !cardRef.current) return;

    const el = cardRef.current;

    // Set initial hidden state — clipped from bottom with slight y offset
    gsap.set(el, {
      clipPath: "inset(100% 0 0 0)",
      y: 60,
      opacity: 0,
    });

    // Stagger delay based on column position for waterfall cascade effect
    const colDelay = columnIndex * 0.08;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top 92%",
        end: "top 40%",
        toggleActions: "play none none none",
        once: true,
      },
      delay: colDelay,
    });

    // Clip-path wipe reveal from bottom to top
    tl.to(el, {
      clipPath: "inset(0% 0 0 0)",
      duration: 0.9,
      ease: "power3.inOut",
    });

    // Simultaneously slide up and fade in
    tl.to(el, {
      y: 0,
      opacity: 1,
      duration: 0.7,
      ease: "power2.out",
    }, "<0.1");

    // Animate the image inside with a slight counter-scale for depth
    const img = el.querySelector(".card-image-wrapper");
    if (img) {
      gsap.set(img, { scale: 1.15 });
      tl.to(img, {
        scale: 1,
        duration: 1.2,
        ease: "power2.out",
      }, "<");
    }

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach(st => {
        if (st.trigger === el) st.kill();
      });
    };
  }, [animateOnScroll, columnIndex]);

  const handleStyleClick = (e: React.MouseEvent, style: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/?style=${encodeURIComponent(style)}#results`);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Trigger transition before navigation
    const event = new CustomEvent('foundryTransitionStart', {
      detail: { slug: foundry.slug }
    });
    window.dispatchEvent(event);

    // Navigate after curtains have fully covered the screen
    setTimeout(() => {
      router.push(`/foundry/${foundry.slug}`);
    }, 600);
  };

  return (
    <article
      ref={cardRef}
      className="foundry-card"
      style={!animateOnScroll ? undefined : { clipPath: "inset(100% 0 0 0)", opacity: 0 }}
    >
      <Link
        href={`/foundry/${foundry.slug}`}
        onClick={handleClick}
        data-cursor="card"
        className="group block border-t border-neutral-200 pt-6 pb-8 transition-colors duration-300 hover:border-neutral-400"
      >
        {/* Screenshot or Gradient Placeholder */}
        <div className="relative w-full aspect-[16/10] mb-6 overflow-hidden rounded-lg bg-neutral-100">
          <div className="card-image-wrapper card-image-ken-burns absolute inset-0">
            {hasScreenshot ? (
              <Image
                src={foundry.images.screenshot!}
                alt={`${foundry.name} website screenshot`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: generateGradient(foundry.name) }}
              >
                <span className="text-2xl font-medium text-neutral-700/50">
                  {foundry.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Foundry Name */}
        <h2 className="text-xl font-medium tracking-tight text-neutral-900 mb-2">
          {foundry.name}
        </h2>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-neutral-700 mb-4">
          <span>{foundry.location.city}</span>
          <span className="text-neutral-300">·</span>
          <span>{foundry.location.country}</span>
        </div>

        {/* Notes as description */}
        {foundry.notes && (
          <p className="text-sm leading-relaxed text-neutral-600 mb-6 max-w-xs line-clamp-3">
            {foundry.notes}
          </p>
        )}

        {/* Style Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {foundry.style.slice(0, 3).map((styleTag) => (
            <button
              key={styleTag}
              onClick={(e) => handleStyleClick(e, styleTag)}
              className="inline-flex items-center px-3 py-1 bg-neutral-100 text-xs uppercase tracking-wider text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 transition-colors cursor-pointer"
            >
              {styleTag}
            </button>
          ))}
        </div>

        {/* Notable Typefaces */}
        <div className="space-y-1">
          {foundry.notableTypefaces.slice(0, 3).map((typeface) => (
            <div
              key={typeface}
              className="text-sm text-neutral-600 font-mono"
            >
              {typeface}
            </div>
          ))}
        </div>
      </Link>
    </article>
  );
}
