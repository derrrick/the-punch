"use client";

import { useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { getAllFoundries, getAllCountries } from "@/lib/foundries";
import { FoundryCard } from "./FoundryCard";

export function FoundryGrid() {
  const searchParams = useSearchParams();
  const allFoundries = getAllFoundries();
  const countries = getAllCountries();
  const filterStatusRef = useRef<HTMLDivElement>(null);

  const styleFilter = searchParams.get("style");
  const locationFilter = searchParams.get("location");
  const hasActiveFilter = styleFilter || locationFilter;

  const filteredFoundries = useMemo(() => {
    if (!styleFilter && !locationFilter) {
      return allFoundries;
    }

    return allFoundries.filter((foundry) => {
      if (styleFilter) {
        return foundry.style.some(
          (s) => s.toLowerCase() === styleFilter.toLowerCase()
        );
      }
      if (locationFilter) {
        return foundry.location.countryCode.toLowerCase() === locationFilter.toLowerCase();
      }
      return true;
    });
  }, [allFoundries, styleFilter, locationFilter]);

  const activeFilterName = useMemo(() => {
    if (styleFilter) {
      return styleFilter.charAt(0).toUpperCase() + styleFilter.slice(1);
    }
    if (locationFilter) {
      const country = countries.find(
        (c) => c.code.toLowerCase() === locationFilter.toLowerCase()
      );
      return country?.name || locationFilter;
    }
    return null;
  }, [styleFilter, locationFilter, countries]);

  // Scroll to filter status when filter changes
  useEffect(() => {
    if (hasActiveFilter && filterStatusRef.current) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        const headerOffset = 80;
        const elementPosition = filterStatusRef.current!.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }, 100);
    }
  }, [hasActiveFilter, styleFilter, locationFilter]);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12">
        {/* Filter Status */}
        {activeFilterName && (
          <div id="results" ref={filterStatusRef} className="mb-8 flex items-center gap-3">
            <span className="text-sm text-neutral-700">
              Showing {filteredFoundries.length} foundr{filteredFoundries.length === 1 ? "y" : "ies"}
            </span>
            <span className="text-neutral-300">·</span>
            <span className="text-sm font-medium text-neutral-900 capitalize">
              {styleFilter ? "Style: " : "Location: "}{activeFilterName}
            </span>
          </div>
        )}

        {filteredFoundries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-4">
            {filteredFoundries.map((foundry, index) => (
              <FoundryCard key={foundry.id} foundry={foundry} index={index} />
            ))}
          </div>
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
