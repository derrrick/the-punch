"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import type { Foundry } from "@/lib/foundries-db";

interface FoundryPageClientProps {
  foundry: Foundry;
}

export function FoundryPageClient({ foundry }: FoundryPageClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasScreenshot = foundry.images?.screenshot;

  useEffect(() => {
    // Wait for curtains to start opening, then animate content
    const tl = gsap.timeline({ delay: 0.2 });

    // Animate back link
    tl.fromTo(".back-link",
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" }
    );

    // Animate title
    tl.fromTo(".foundry-title",
      { opacity: 0, y: 60, skewY: 3 },
      { opacity: 1, y: 0, skewY: 0, duration: 1, ease: "power3.out" },
      "-=0.4"
    );

    // Animate location
    tl.fromTo(".foundry-location",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
      "-=0.6"
    );

    // Animate screenshot with clip-path
    tl.fromTo(".screenshot-section",
      { opacity: 0, clipPath: "inset(100% 0 0 0)" },
      { opacity: 1, clipPath: "inset(0% 0 0 0)", duration: 1.2, ease: "power3.inOut" },
      "-=0.5"
    );

    // Animate detail items with stagger
    tl.fromTo(".detail-item",
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", stagger: 0.1 },
      "-=0.8"
    );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen">
      {/* Hero Section with generous whitespace */}
      <section className="pt-32 pb-20 px-6 md:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto">
          {/* Back Link */}
          <Link
            href="/"
            className="back-link inline-flex items-center gap-2 text-sm text-neutral-700 hover:text-neutral-900 transition-colors duration-300 mb-16"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to index
          </Link>

          {/* Foundry Name - Large and prominent */}
          <h1 className="foundry-title text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight text-neutral-900 mb-12">
            {foundry.name}
          </h1>

          {/* Location */}
          <div className="foundry-location flex items-center gap-3 text-lg text-neutral-700 mb-8">
            <span>{foundry.location.city}</span>
            <span className="text-neutral-300">·</span>
            <span>{foundry.location.country}</span>
          </div>
        </div>
      </section>

      {/* Screenshot Section - Full Width */}
      {hasScreenshot && (
        <section className="screenshot-section px-6 md:px-12 lg:px-20 mb-20">
          <div className="max-w-6xl mx-auto">
            <div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg bg-neutral-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
              <Image
                src={foundry.images.screenshot!}
                alt={`${foundry.name} website screenshot`}
                fill
                className="object-cover"
                sizes="(max-width: 1200px) 100vw, 1200px"
                priority
              />
            </div>
          </div>
        </section>
      )}

      {/* Details Section */}
      <section className="pb-32 px-6 md:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
            {/* Left Column - Key Info */}
            <div className="lg:col-span-5 space-y-12">
              {/* Founded & Founder */}
              <div className="detail-item space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-neutral-600 mb-2">
                    Founded
                  </p>
                  <p className="text-2xl font-medium text-neutral-900">
                    {foundry.founded}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-neutral-600 mb-2">
                    Founder
                  </p>
                  <p className="text-2xl font-medium text-neutral-900">
                    {foundry.founder}
                  </p>
                </div>
              </div>

              {/* External Links */}
              <div className="detail-item space-y-4 pt-8 border-t border-neutral-200">
                <a
                  href={foundry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-neutral-900 hover:text-neutral-600 transition-colors duration-300"
                >
                  <span className="text-lg">Visit website</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 7h10v10" />
                    <path d="M7 17 17 7" />
                  </svg>
                </a>

                {foundry.contentFeed.url && (
                  <a
                    href={foundry.contentFeed.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-neutral-700 hover:text-neutral-900 transition-colors duration-300"
                  >
                    <span className="text-lg">Content Feed</span>
                  </a>
                )}
              </div>
            </div>

            {/* Right Column - Typefaces & Style */}
            <div className="lg:col-span-7 space-y-16">
              {/* Notable Typefaces */}
              <div className="detail-item">
                <p className="text-xs uppercase tracking-widest text-neutral-600 mb-6">
                  Notable Typefaces
                </p>
                <div className="flex flex-wrap gap-3">
                  {foundry.notableTypefaces.map((typeface) => (
                    <span
                      key={typeface}
                      className="inline-flex items-center px-4 py-2 bg-neutral-100 text-sm font-medium text-neutral-700 rounded-full"
                    >
                      {typeface}
                    </span>
                  ))}
                </div>
              </div>

              {/* Style Tags */}
              <div className="detail-item">
                <p className="text-xs uppercase tracking-widest text-neutral-600 mb-6">
                  Style
                </p>
                <div className="flex flex-wrap gap-3">
                  {foundry.style.map((styleTag) => (
                    <span
                      key={styleTag}
                      className="inline-flex items-center px-4 py-2 border border-neutral-200 text-sm text-neutral-600 rounded-full"
                    >
                      {styleTag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {foundry.notes && (
                <div className="detail-item pt-8 border-t border-neutral-200">
                  <p className="text-xs uppercase tracking-widest text-neutral-600 mb-4">
                    Notes
                  </p>
                  <p className="text-lg text-neutral-600 leading-relaxed max-w-xl">
                    {foundry.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
