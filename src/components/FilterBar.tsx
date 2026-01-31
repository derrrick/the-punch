"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { Foundry, FoundriesData } from "@/lib/foundries-db";

// Style category groupings
const STYLE_CATEGORIES: Record<string, string[]> = {
  Classification: [
    "Blackletter", "Display", "Geometric", "Grotesk", "Humanist",
    "Monospace", "Neo-Grotesk", "Script", "Serif"
  ],
  "Use Case": [
    "Book", "Branding", "Code", "Corporate", "Editorial",
    "News", "Technical", "Wayfinding", "Web", "Workhorse"
  ],
  Aesthetic: [
    "Brutalist", "Clean", "Contemporary", "Elegant", "Experimental",
    "Expressive", "Friendly", "Hand-Drawn", "Handcrafted", "Industrial",
    "Minimal", "Modernist", "Playful", "Postmodern", "Retro", "Warm"
  ],
  Region: [
    "American", "Americana", "Argentine", "Australian", "Belgian",
    "British", "Canadian", "Chilean", "Czech", "Danish", "Dutch",
    "Finnish", "French", "German", "Greek", "Indian", "Luxembourgish",
    "Mexican", "Midwestern", "Nordic", "Portuguese", "Russian",
    "Scandinavian", "Spanish", "Swiss"
  ],
  Special: [
    "Activist", "Arts-Crafts", "Colonial", "Historical", "Multilingual",
    "Musical", "Revival", "Space-Themed", "Variable"
  ],
  Distribution: [
    "Accessible", "Co-Op", "Curated", "Google-Fonts", "Open-Source", "Premium"
  ],
};

const CATEGORY_ORDER = ["Classification", "Use Case", "Aesthetic", "Region", "Special", "Distribution"];

interface FilterBarProps {
  foundries: Foundry[];
  styles: string[];
  countries: FoundriesData["countries"];
}

export function FilterBar({ foundries: allFoundries, styles, countries }: FilterBarProps) {
  const [activeDropdown, setActiveDropdown] = useState<"style" | "location" | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("Classification");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);

  // Get styles for the active category that actually exist in the data
  const categoryStyles = STYLE_CATEGORIES[activeCategory]?.filter(style =>
    styles.some(s => s.toLowerCase() === style.toLowerCase())
  ) || [];

  // Get categories that have at least one style in the data
  const availableCategories = CATEGORY_ORDER.filter(category =>
    STYLE_CATEGORIES[category]?.some(style =>
      styles.some(s => s.toLowerCase() === style.toLowerCase())
    )
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clearFilters = () => {
    const params = new URLSearchParams();
    router.push(`/?${params.toString()}`);
    setSearchQuery("");
    setActiveDropdown(null);
  };

  const handleStyleClick = (style: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("style", style);
    params.delete("location");
    params.delete("search");
    router.push(`/?${params.toString()}`);
    setActiveDropdown(null);
    setSearchQuery("");
  };

  const handleLocationClick = (countryCode: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("location", countryCode);
    params.delete("style");
    params.delete("search");
    router.push(`/?${params.toString()}`);
    setActiveDropdown(null);
    setSearchQuery("");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
      params.delete("style");
      params.delete("location");
    } else {
      params.delete("search");
    }
    router.push(`/?${params.toString()}`);
  };

  const toggleDropdown = (dropdown: "style" | "location") => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const currentStyle = searchParams.get("style");
  const currentLocation = searchParams.get("location");
  const currentSearch = searchParams.get("search");

  // Calculate filtered count based on active filters
  const filteredCount = useMemo(() => {
    if (!currentStyle && !currentLocation && !currentSearch) {
      return allFoundries.length;
    }

    return allFoundries.filter((foundry) => {
      if (currentStyle) {
        return foundry.style.some(
          (s) => s.toLowerCase() === currentStyle.toLowerCase()
        );
      }
      if (currentLocation) {
        return foundry.location.countryCode.toLowerCase() === currentLocation.toLowerCase();
      }
      if (currentSearch) {
        const query = currentSearch.toLowerCase();
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
    }).length;
  }, [allFoundries, currentStyle, currentLocation, currentSearch]);

  const activeFilterName = useMemo(() => {
    if (currentStyle) {
      return currentStyle.charAt(0).toUpperCase() + currentStyle.slice(1);
    }
    if (currentLocation) {
      const country = countries.find(
        (c) => c.code.toLowerCase() === currentLocation.toLowerCase()
      );
      return country?.name || currentLocation;
    }
    if (currentSearch) {
      return `"${currentSearch}"`;
    }
    return null;
  }, [currentStyle, currentLocation, currentSearch, countries]);

  const hasActiveFilter = currentStyle || currentLocation || currentSearch;

  return (
    <>
      {/* Sticky Filter Bar */}
      <div
        ref={filterBarRef}
        data-filter-bar
        className="sticky top-16 z-40 bg-white border-b border-neutral-100"
      >
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-3">
          <div className="flex items-center justify-between gap-4" ref={dropdownRef}>
            {/* Left side: Filter by label and filters */}
            <div className="flex items-center gap-2">
              {/* Style Filter Pill */}
              <button
                onClick={() => toggleDropdown("style")}
                className={`group relative px-4 py-2 text-sm transition-all duration-200 rounded-full border flex items-center gap-2 ${
                  activeDropdown === "style" || currentStyle
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                }`}
              >
                <span className="text-neutral-400 group-hover:text-neutral-500">Style</span>
                <span className={currentStyle ? "font-medium" : ""}>
                  {currentStyle || "All"}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform duration-200 ${activeDropdown === "style" ? "rotate-180" : ""}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {/* Location Filter Pill */}
              <button
                onClick={() => toggleDropdown("location")}
                className={`group relative px-4 py-2 text-sm transition-all duration-200 rounded-full border flex items-center gap-2 ${
                  activeDropdown === "location" || currentLocation
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                }`}
              >
                <span className="text-neutral-400 group-hover:text-neutral-500">Location</span>
                <span className={currentLocation ? "font-medium" : ""}>
                  {currentLocation 
                    ? countries.find(c => c.code.toLowerCase() === currentLocation.toLowerCase())?.name || currentLocation
                    : "All"}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform duration-200 ${activeDropdown === "location" ? "rotate-180" : ""}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {/* Clear Filters Button - Only show when filters active */}
              {hasActiveFilter && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={clearFilters}
                  className="ml-2 px-3 py-2 text-sm text-neutral-400 hover:text-neutral-600 transition-colors flex items-center gap-1.5"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                  Clear
                </motion.button>
              )}
            </div>

            {/* Right side: Results count and search */}
            <div className="flex items-center gap-6">
              {/* Results Count - Always visible */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-neutral-900 font-medium">{filteredCount}</span>
                <span className="text-neutral-400">
                  foundr{filteredCount === 1 ? "y" : "ies"}
                </span>
                {activeFilterName && (
                  <>
                    <span className="text-neutral-300">·</span>
                    <span className="text-neutral-600">
                      {currentStyle ? "Style" : currentLocation ? "Location" : "Search"}: {activeFilterName}
                    </span>
                  </>
                )}
              </div>

              {/* Search Input - Fully rounded */}
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search foundries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className={`w-44 md:w-56 pl-10 pr-4 py-2.5 text-sm bg-neutral-100 border-2 rounded-full transition-all duration-200 placeholder:text-neutral-400 ${
                    isSearchFocused 
                      ? "bg-white border-neutral-900 outline-none" 
                      : "border-transparent hover:bg-neutral-200"
                  }`}
                />
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
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                    isSearchFocused ? "text-neutral-900" : "text-neutral-400"
                  }`}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      if (currentSearch) {
                        const params = new URLSearchParams(searchParams.toString());
                        params.delete("search");
                        router.push(`/?${params.toString()}`);
                      }
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Dropdown Menu - Opens below the filter bar */}
        <AnimatePresence>
          {activeDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute left-0 right-0 top-full z-50 bg-white border-b border-neutral-100 shadow-lg"
              ref={dropdownRef}
            >
              <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-6">
                {activeDropdown === "style" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, delay: 0.05 }}
                  >
                    {/* Category tabs */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {availableCategories.map((category) => (
                        <button
                          key={category}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCategory(category);
                          }}
                          className={`px-4 py-2 text-xs uppercase tracking-wider rounded-full transition-all duration-200 ${
                            activeCategory === category
                              ? "bg-neutral-900 text-white font-medium"
                              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>

                    {/* Styles grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-1">
                      {categoryStyles.map((style, index) => {
                        const matchingStyle = styles.find(
                          s => s.toLowerCase() === style.toLowerCase()
                        ) || style;
                        const isActive = currentStyle?.toLowerCase() === matchingStyle.toLowerCase();

                        return (
                          <motion.button
                            key={style}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.15, delay: index * 0.01 }}
                            onClick={() => handleStyleClick(matchingStyle)}
                            onMouseEnter={() => setHoveredItem(style)}
                            onMouseLeave={() => setHoveredItem(null)}
                            className={`text-left py-2.5 px-3 -mx-3 rounded-lg group flex items-center justify-between transition-all duration-150 ${
                              isActive 
                                ? "bg-neutral-100" 
                                : "hover:bg-neutral-50"
                            }`}
                          >
                            <span
                              className={`text-base font-normal transition-colors duration-150 ${
                                isActive
                                  ? "text-neutral-900 font-medium"
                                  : "text-neutral-700 group-hover:text-neutral-900"
                              }`}
                            >
                              {style}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full transition-all duration-150 ${
                                isActive
                                  ? "bg-neutral-900 text-white"
                                  : "bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200"
                              }`}
                            >
                              {allFoundries.filter((f) =>
                                f.style.some((s) => s.toLowerCase() === matchingStyle.toLowerCase())
                              ).length}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>

                    {categoryStyles.length === 0 && (
                      <p className="text-neutral-400 text-sm py-4">No styles in this category yet.</p>
                    )}
                  </motion.div>
                )}

                {activeDropdown === "location" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, delay: 0.05 }}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-1"
                  >
                    {countries.map((country, index) => {
                      const isActive = currentLocation === country.code;
                      
                      return (
                        <motion.button
                          key={country.code}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15, delay: index * 0.008 }}
                          onClick={() => handleLocationClick(country.code)}
                          onMouseEnter={() => setHoveredItem(country.code)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className={`text-left py-2.5 px-3 -mx-3 rounded-lg group flex items-center justify-between transition-all duration-150 ${
                            isActive 
                              ? "bg-neutral-100" 
                              : "hover:bg-neutral-50"
                          }`}
                        >
                          <span
                            className={`text-base font-normal transition-colors duration-150 ${
                              isActive
                                ? "text-neutral-900 font-medium"
                                : "text-neutral-700 group-hover:text-neutral-900"
                            }`}
                          >
                            {country.name}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full transition-all duration-150 ${
                              isActive
                                ? "bg-neutral-900 text-white"
                                : "bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200"
                            }`}
                          >
                            {country.count}
                          </span>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
