"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { Foundry, FoundriesData } from "@/lib/foundries-db";
import { FoundryCard } from "./FoundryCard";

interface FoundryGridProps {
  foundries: Foundry[];
  countries: FoundriesData["countries"];
}

export function FoundryGrid({ foundries: allFoundries }: FoundryGridProps) {
  const searchParams = useSearchParams();

  const styleFilter = searchParams.get("style");
  const locationFilter = searchParams.get("location");
  const searchFilter = searchParams.get("search");

  const filteredFoundries = useMemo(() => {
    if (!styleFilter && !locationFilter && !searchFilter) {
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
      if (searchFilter) {
        const query = searchFilter.toLowerCase();
        return (
          foundry.name.toLowerCase().includes(query) ||
          foundry.founder.toLowerCase().includes(query) ||
          foundry.location.city.toLowerCase().includes(query) ||
          foundry.location.country.toLowerCase().includes(query) ||
          foundry.notableTypefaces.some((t) => t.toLowerCase().includes(query)) ||
          foundry.style.some((s) => s.toLowerCase().includes(query)) ||
          foundry.notes.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [allFoundries, styleFilter, locationFilter, searchFilter]);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12">

        {filteredFoundries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-4">
            {filteredFoundries.map((foundry, index) => (
              <div key={foundry.id} data-foundry-tile={index === 0 ? "first" : undefined}>
                <FoundryCard foundry={foundry} index={index} />
              </div>
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
