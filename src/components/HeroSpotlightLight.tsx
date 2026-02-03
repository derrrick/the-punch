"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { Foundry } from "@/lib/foundries-db";

interface SpotlightFoundry extends Foundry {
  spotlightDescription?: string;
  spotlightQuote?: string;
  spotlightIsPrimary?: boolean;
  spotlight_order?: number;
}

interface HeroSpotlightLightProps {
  spotlightFoundries: SpotlightFoundry[];
}

export function HeroSpotlightLight({
  spotlightFoundries,
}: HeroSpotlightLightProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Sort by spotlight_order if available, otherwise keep order
  const sortedFoundries = [...spotlightFoundries].sort(
    (a, b) => (a.spotlight_order || 0) - (b.spotlight_order || 0)
  );

  const currentFoundry = sortedFoundries[currentIndex];
  const totalFoundries = sortedFoundries.length;

  const paginate = useCallback(
    (newDirection: number) => {
      const newIndex = currentIndex + newDirection;
      if (newIndex >= 0 && newIndex < totalFoundries) {
        setDirection(newDirection);
        setCurrentIndex(newIndex);
      } else if (newIndex < 0) {
        setDirection(newDirection);
        setCurrentIndex(totalFoundries - 1);
      } else {
        setDirection(newDirection);
        setCurrentIndex(0);
      }
    },
    [currentIndex, totalFoundries]
  );

  // Auto-advance every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      paginate(1);
    }, 6000);
    return () => clearInterval(timer);
  }, [paginate]);

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  if (!currentFoundry || sortedFoundries.length === 0) return null;

  return (
    <section className="h-[70vh] max-h-[800px] bg-[#F5F5F3] flex flex-col justify-center py-6 md:py-8 px-4 md:px-8 lg:px-16">
      {/* Headline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-6 md:mb-8"
      >
        <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light text-neutral-900 tracking-tight leading-[1.1]">
          A showcase of the web&apos;s
          <br />
          finest independent type
        </h1>
      </motion.div>

      {/* Main Showcase - Arched Windows */}
      <div className="relative max-w-7xl mx-auto w-full">
        <div className="flex justify-center items-end gap-3 md:gap-4 lg:gap-6">
          {/* Previous arches (peek) */}
          {currentIndex > 0 && (
            <button
              onClick={() => paginate(-1)}
              className="hidden lg:block relative w-20 xl:w-28 h-[180px] xl:h-[240px] overflow-hidden opacity-40 hover:opacity-60 transition-opacity cursor-pointer rounded-sm"
            >
              <img
                src={sortedFoundries[currentIndex - 1].images?.screenshot || ""}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          )}

          {/* Current arch (main) */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              initial={{ opacity: 0, x: direction * 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -100 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-4xl"
            >
              {/* Rectangle container with 3 sections */}
              <div className="flex gap-2 md:gap-3 lg:gap-4">
                {/* Left rectangle */}
                <div className="relative w-1/3 h-[200px] md:h-[280px] lg:h-[350px] overflow-hidden bg-neutral-200 shadow-lg rounded-sm">
                  <img
                    src={currentFoundry.images?.screenshot || ""}
                    alt={currentFoundry.name}
                    className="w-full h-full object-cover object-left"
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                {/* Center rectangle - Featured */}
                <div className="relative w-1/3 h-[200px] md:h-[280px] lg:h-[350px] overflow-hidden bg-neutral-200 shadow-xl rounded-sm">
                  <img
                    src={currentFoundry.images?.screenshot || ""}
                    alt={currentFoundry.name}
                    className="w-full h-full object-cover object-center"
                  />
                  {/* Subtle gradient for visual depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>

                {/* Right rectangle */}
                <div className="relative w-1/3 h-[200px] md:h-[280px] lg:h-[350px] overflow-hidden bg-neutral-200 shadow-lg rounded-sm">
                  <img
                    src={currentFoundry.images?.screenshot || ""}
                    alt={currentFoundry.name}
                    className="w-full h-full object-cover object-right"
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Next arches (peek) */}
          {currentIndex < totalFoundries - 1 && (
            <button
              onClick={() => paginate(1)}
              className="hidden lg:block relative w-20 xl:w-28 h-[180px] xl:h-[240px] overflow-hidden opacity-40 hover:opacity-60 transition-opacity cursor-pointer rounded-sm"
            >
              <img
                src={sortedFoundries[currentIndex + 1].images?.screenshot || ""}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="mt-6 md:mt-8 flex flex-col md:flex-row items-center justify-between max-w-4xl mx-auto w-full gap-4">
        {/* Pagination Dots */}
        <div className="flex items-center gap-2">
          {sortedFoundries.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-neutral-900 w-6"
                  : "bg-neutral-300 hover:bg-neutral-400"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Foundry Name & Link */}
        <div className="flex items-center gap-4">
          <span className="text-neutral-500 text-sm">
            {currentIndex + 1} / {totalFoundries}
          </span>
          <Link
            href={`/foundry/${currentFoundry.slug}`}
            className="group flex items-center gap-2 text-neutral-900 hover:text-orange-600 transition-colors"
          >
            <span className="text-lg md:text-xl font-medium">
              {currentFoundry.name}
            </span>
            <svg
              className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => paginate(-1)}
            className="w-12 h-12 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 transition-colors"
            aria-label="Previous"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => paginate(1)}
            className="w-12 h-12 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 transition-colors"
            aria-label="Next"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Location & Description */}
      <motion.div
        key={`info-${currentIndex}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-4 text-center max-w-2xl mx-auto"
      >
        <p className="text-neutral-500 text-sm mb-2">
          {currentFoundry.location.city}, {currentFoundry.location.country}
        </p>
        <p className="text-neutral-600 text-sm md:text-base leading-relaxed">
          {currentFoundry.spotlightDescription ||
            currentFoundry.notes?.substring(0, 120) ||
            `${currentFoundry.name} creates exceptional typography for designers worldwide.`}
        </p>
      </motion.div>
    </section>
  );
}
