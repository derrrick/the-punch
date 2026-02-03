"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { Foundry, FoundriesData } from "@/lib/foundries-db";
import { FoundryCard } from "./FoundryCard";
import { NewsletterBanner } from "./NewsletterBanner";
import { NewsletterCard } from "./NewsletterCard";

interface FoundryGridProps {
  foundries: Foundry[];
  countries: FoundriesData["countries"];
}

export function FoundryGrid({ foundries: allFoundries }: FoundryGridProps) {
  const searchParams = useSearchParams();

  const styleFilter = searchParams.get("style");
  const locationFilter = searchParams.get("location");
  const searchFilter = searchParams.get("search");
  const sortFilter = searchParams.get("sort");
  const typeFilter = searchParams.get("filter");

  const filteredFoundries = useMemo(() => {
    let results = allFoundries;

    // Apply type filters (recent, classic, established)
    if (typeFilter === 'recent') {
      // Show foundries founded in the last 6 years (2020 or later)
      const currentYear = new Date().getFullYear();
      const recentThreshold = currentYear - 6;
      results = results.filter(f => f.founded && f.founded >= recentThreshold);
    } else if (typeFilter === 'classic') {
      // Show foundries founded before 2000
      results = results.filter(f => f.founded && f.founded < 2000);
    } else if (typeFilter === 'established') {
      // Show foundries founded between 2000-2020
      results = results.filter(f => f.founded && f.founded >= 2000 && f.founded < 2020);
    }

    // Apply existing filters (style, location, search)
    if (styleFilter) {
      results = results.filter(f =>
        f.style.some(s => s.toLowerCase() === styleFilter.toLowerCase())
      );
    }
    if (locationFilter) {
      results = results.filter(f =>
        f.location.countryCode.toLowerCase() === locationFilter.toLowerCase()
      );
    }
    if (searchFilter) {
      const query = searchFilter.toLowerCase();
      results = results.filter(f =>
        f.name.toLowerCase().includes(query) ||
        f.founder.toLowerCase().includes(query) ||
        f.location.city.toLowerCase().includes(query) ||
        f.location.country.toLowerCase().includes(query) ||
        f.notableTypefaces.some(t => t.toLowerCase().includes(query)) ||
        f.style.some(s => s.toLowerCase().includes(query)) ||
        f.notes.toLowerCase().includes(query)
      );
    }

    // Apply sorting (must be after filtering)
    if (sortFilter === 'popular') {
      results = [...results].sort((a, b) => a.tier - b.tier);
    }

    return results;
  }, [allFoundries, styleFilter, locationFilter, searchFilter, sortFilter, typeFilter]);

  // Split foundries for banner insertion after 12 tiles
  // 12 works perfectly for both 3-column (4 rows) and 4-column (3 rows) grids
  const firstBatch = filteredFoundries.slice(0, 12);
  const secondBatch = filteredFoundries.slice(12);
  const showBanner = filteredFoundries.length > 12;

  // Show a compact newsletter card to fill empty grid spots when:
  // - There are foundries but fewer than 12 (no inline banner)
  // - The last row is incomplete (not divisible by 3 for lg breakpoint)
  const showFillerCard = filteredFoundries.length > 0 &&
    filteredFoundries.length <= 12 &&
    filteredFoundries.length % 3 !== 0;

  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12">

        {filteredFoundries.length > 0 ? (
          <>
            {/* First 12 foundries */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-4">
              {firstBatch.map((foundry, index) => (
                <div key={foundry.id} data-foundry-tile={index === 0 ? "first" : undefined}>
                  <FoundryCard 
                    foundry={foundry} 
                    index={index} 
                    animateOnScroll={index >= 4}
                  />
                </div>
              ))}
              {/* Newsletter card to fill empty grid spots */}
              {showFillerCard && (
                <div className="hidden lg:block xl:hidden">
                  <NewsletterCard />
                </div>
              )}
            </div>

            {/* Newsletter Banner - after 12 tiles */}
            {showBanner && (
              <div className="my-16 -mx-6 md:-mx-12">
                <NewsletterBanner />
              </div>
            )}

            {/* Remaining foundries */}
            {secondBatch.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-4">
                {secondBatch.map((foundry, index) => (
                  <div key={foundry.id}>
                    <FoundryCard 
                      foundry={foundry} 
                      index={index + 12} 
                      animateOnScroll={true}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center">
            <p className="text-neutral-700 text-lg">
              No foundries found for this filter.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
