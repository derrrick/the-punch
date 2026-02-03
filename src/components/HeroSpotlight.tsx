"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Link from "next/link";
import type { Foundry } from "@/lib/foundries-db";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface SpotlightFoundry extends Foundry {
  spotlightDescription?: string;
  spotlightQuote?: string;
  spotlightIsPrimary?: boolean;
}

interface HeroSpotlightProps {
  spotlightFoundries: SpotlightFoundry[];
}

export function HeroSpotlight({
  spotlightFoundries,
}: HeroSpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Find the primary foundry, or fall back to first one
  const primaryIndex = spotlightFoundries.findIndex(f => f.spotlightIsPrimary);
  const featured = primaryIndex >= 0 ? spotlightFoundries[primaryIndex] : spotlightFoundries[0];
  const rest = spotlightFoundries.filter((_, i) => i !== (primaryIndex >= 0 ? primaryIndex : 0));

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".side-card", {
        x: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
        delay: 0.5,
      });

      gsap.from(".featured-img", {
        scale: 1.2,
        duration: 1.5,
        ease: "power2.out",
      });

      gsap.from(".reveal-text", {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        ease: "power3.out",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  if (!featured) return null;

  return (
    <div ref={containerRef} className="min-h-screen bg-neutral-950 text-white">
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12">
        {/* Left Side - Featured Foundry */}
        <div className="lg:col-span-8 relative">
          <div className="absolute inset-0">
            {featured.images?.screenshot ? (
              <img
                src={featured.images.screenshot}
                alt={featured.name}
                className="featured-img w-full h-full object-cover opacity-60"
              />
            ) : (
              <div className="w-full h-full bg-neutral-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/50" />
          </div>

          <div className="relative z-10 min-h-screen flex flex-col justify-end p-6 md:p-12 lg:p-16">
            <div className="absolute top-32 left-6 md:left-12 lg:left-16 right-6 md:right-12">
              <p className="reveal-text text-sm uppercase tracking-[0.2em] text-white/50 mb-4">
                Independent Foundry Index
              </p>
              <h1 className="reveal-text text-3xl md:text-5xl lg:text-6xl font-light leading-[1.1] max-w-[32rem]">
                Discover the designers behind the letters
              </h1>
            </div>

            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-12 h-px bg-orange-500" />
                <span className="text-xs uppercase tracking-[0.3em] text-orange-500">
                  Featured
                </span>
              </div>

              <h2 className="reveal-text text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight mb-4">
                {featured.name}
              </h2>

              <p className="reveal-text text-white/60 text-lg mb-2">
                {featured.location.city}, {featured.location.country}
              </p>

              <p className="reveal-text text-white/80 text-base md:text-lg leading-relaxed mb-8 max-w-lg">
                {featured.spotlightDescription ||
                  featured.notes?.substring(0, 200) ||
                  `${featured.name} creates exceptional typography for designers worldwide.`}
              </p>

              <div className="reveal-text">
                <Link
                  href={`/foundry/${featured.slug}`}
                  className="group inline-flex items-center gap-4 text-sm uppercase tracking-[0.2em] hover:text-orange-500 transition-colors"
                >
                  View Foundry
                  <span className="text-2xl group-hover:translate-x-3 transition-transform duration-300">→</span>
                </Link>
              </div>

              {featured.notableTypefaces && featured.notableTypefaces.length > 0 && (
                <div className="reveal-text mt-8 pt-6 border-t border-white/10">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">
                    Notable Fonts
                  </p>
                  <p className="text-sm text-white/70 italic">
                    {featured.notableTypefaces.slice(0, 3).join(" · ")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Secondary Spotlights */}
        <div className="lg:col-span-4 bg-neutral-900 border-l border-white/10">
          <div className="h-full flex flex-col">
            <div className="p-6 md:p-8 border-b border-white/10">
              <h3 className="text-xs uppercase tracking-[0.3em] text-white/50">
                Also Featured
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto">
              {rest.map((foundry, index) => (
                <Link
                  key={foundry.id}
                  href={`/foundry/${foundry.slug}`}
                  className="side-card group block border-b border-white/10 hover:bg-white/5 transition-colors"
                >
                  <div className="p-6 md:p-8">
                    <span className="text-5xl md:text-6xl font-light text-white/10 group-hover:text-orange-500/30 transition-colors">
                      0{index + 2}
                    </span>

                    <div className="mt-4">
                      <h4 className="text-xl font-medium text-white group-hover:text-orange-500 transition-colors mb-1">
                        {foundry.name}
                      </h4>
                      <p className="text-sm text-white/40 mb-3">
                        {foundry.location.city}, {foundry.location.country}
                      </p>
                      <p className="text-sm text-white/60 line-clamp-2">
                        {foundry.spotlightDescription ||
                          foundry.notes?.substring(0, 100)}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-white/30 group-hover:text-orange-500 transition-colors">
                      <span className="text-xs uppercase tracking-wider">
                        Explore
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="group-hover:translate-x-1 transition-transform"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}

              {rest.length < 3 && (
                <div className="p-6 md:p-8 text-white/20 text-sm">
                  More foundries coming soon
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
