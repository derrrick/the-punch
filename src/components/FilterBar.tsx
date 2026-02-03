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
  const [activeCategory, setActiveCategory] = useState<string>("Classification");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Focus search input when mobile search opens
  useEffect(() => {
    if (isMobileSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  // Handle escape key to close mobile overlays
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileSearchOpen(false);
        setIsMobileFiltersOpen(false);
        setActiveDropdown(null);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const clearFilters = () => {
    const params = new URLSearchParams();
    router.push(`/?${params.toString()}`);
    setSearchQuery("");
    setActiveDropdown(null);
    setIsMobileSearchOpen(false);
    setIsMobileFiltersOpen(false);
  };

  const handleStyleClick = (style: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("style", style);
    params.delete("location");
    params.delete("search");
    router.push(`/?${params.toString()}`);
    setActiveDropdown(null);
    setIsMobileFiltersOpen(false);
    setSearchQuery("");
  };

  const handleLocationClick = (countryCode: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("location", countryCode);
    params.delete("style");
    params.delete("search");
    router.push(`/?${params.toString()}`);
    setActiveDropdown(null);
    setIsMobileFiltersOpen(false);
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
    setIsMobileSearchOpen(false);
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

  // Get active filter label for mobile filter button
  const getActiveFilterLabel = () => {
    if (currentStyle) return `Style: ${currentStyle}`;
    if (currentLocation) {
      const country = countries.find(c => c.code.toLowerCase() === currentLocation.toLowerCase());
      return `Location: ${country?.name || currentLocation}`;
    }
    return "Filters";
  };

  return (
    <>
      {/* Sticky Filter Bar */}
      <div
        ref={filterBarRef}
        data-filter-bar
        className="sticky top-[72px] z-40 bg-white border-b border-neutral-100"
      >
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between gap-4 py-3" ref={dropdownRef}>
            {/* Left side: Filter pills */}
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

              {/* Clear Filters Button */}
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
              {/* Results Count */}
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

              {/* Search Input */}
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search foundries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className={`w-44 lg:w-56 pl-10 pr-4 py-2.5 text-sm bg-neutral-100 border-2 rounded-full transition-all duration-200 placeholder:text-neutral-400 ${
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

          {/* Mobile Layout */}
          <div className="flex md:hidden items-center justify-between gap-3 py-3">
            {/* Filter & Search Actions */}
            <div className="flex items-center gap-2 flex-1">
              {/* Filters Button */}
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-full border transition-all duration-200 flex-shrink-0 ${
                  hasActiveFilter
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white text-neutral-700 border-neutral-200"
                }`}
              >
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
                >
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                <span className="max-w-[80px] truncate">{getActiveFilterLabel()}</span>
              </button>

              {/* Search Button */}
              <button
                onClick={() => setIsMobileSearchOpen(true)}
                className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-200 flex-shrink-0 ${
                  currentSearch
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white text-neutral-600 border-neutral-200"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </button>

              {/* Clear Button (when filters active) */}
              {hasActiveFilter && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={clearFilters}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-neutral-100 text-neutral-500"
                >
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
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </motion.button>
              )}
            </div>

            {/* Results Count */}
            <div className="flex items-center gap-1.5 text-sm flex-shrink-0">
              <span className="text-neutral-900 font-medium">{filteredCount}</span>
              <span className="text-neutral-400">
                foundr{filteredCount === 1 ? "y" : "ies"}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Dropdown Menu */}
        <AnimatePresence>
          {activeDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="hidden md:block absolute left-0 right-0 top-full z-50 bg-white border-b border-neutral-100 shadow-lg"
              ref={dropdownRef}
            >
              <div className="max-w-[1800px] mx-auto px-6 lg:px-12 py-6">
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

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 md:hidden"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setIsMobileSearchOpen(false)}
            />
            
            {/* Search Panel */}
            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute top-0 left-0 right-0 bg-white shadow-xl"
            >
              <div className="px-4 py-4">
                {/* Search Form */}
                <form onSubmit={handleSearch} className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search foundries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 text-lg bg-neutral-100 border-2 border-transparent rounded-2xl transition-all duration-200 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 outline-none"
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  
                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={() => setIsMobileSearchOpen(false)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-200 text-neutral-600"
                  >
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
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </form>

                {/* Search Suggestions / Recent */}
                <div className="mt-4">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3 px-1">
                    Try searching for
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Swiss", "Grotesk", "Variable", "Open Source", "Display"].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setSearchQuery(suggestion);
                          const params = new URLSearchParams();
                          params.set("search", suggestion);
                          router.push(`/?${params.toString()}`);
                          setIsMobileSearchOpen(false);
                        }}
                        className="px-4 py-2 text-sm bg-neutral-100 text-neutral-700 rounded-full hover:bg-neutral-200 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Button */}
                <button
                  onClick={handleSearch}
                  className="w-full mt-4 py-4 bg-neutral-900 text-white text-base font-medium rounded-2xl hover:bg-neutral-800 transition-colors"
                >
                  Search
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Filters Overlay */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 md:hidden"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setIsMobileFiltersOpen(false)}
            />
            
            {/* Filter Panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-3xl shadow-xl overflow-hidden flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 bg-neutral-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 flex-shrink-0">
                <h2 className="text-lg font-medium">Filters</h2>
                <div className="flex items-center gap-2">
                  {hasActiveFilter && (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-700"
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-600"
                  >
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
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex border-b border-neutral-100 flex-shrink-0">
                <button
                  onClick={() => setActiveCategory("style")}
                  className={`flex-1 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                    activeCategory !== "location" 
                      ? "border-neutral-900 text-neutral-900" 
                      : "border-transparent text-neutral-500"
                  }`}
                >
                  Style
                  {currentStyle && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-neutral-900 text-white rounded-full">
                      1
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveCategory("location")}
                  className={`flex-1 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                    activeCategory === "location" 
                      ? "border-neutral-900 text-neutral-900" 
                      : "border-transparent text-neutral-500"
                  }`}
                >
                  Location
                  {currentLocation && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-neutral-900 text-white rounded-full">
                      1
                    </span>
                  )}
                </button>
              </div>

              {/* Filter Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {activeCategory !== "location" ? (
                  /* Style Filter Content */
                  <div className="space-y-6">
                    {/* Category Pills */}
                    <div className="flex flex-wrap gap-2">
                      {availableCategories.map((category) => (
                        <button
                          key={category}
                          onClick={() => setActiveCategory(category)}
                          className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded-full transition-all duration-200 ${
                            activeCategory === category
                              ? "bg-neutral-900 text-white font-medium"
                              : "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>

                    {/* Styles List */}
                    <div className="space-y-1">
                      {categoryStyles.map((style) => {
                        const matchingStyle = styles.find(
                          s => s.toLowerCase() === style.toLowerCase()
                        ) || style;
                        const isActive = currentStyle?.toLowerCase() === matchingStyle.toLowerCase();
                        const count = allFoundries.filter((f) =>
                          f.style.some((s) => s.toLowerCase() === matchingStyle.toLowerCase())
                        ).length;

                        return (
                          <button
                            key={style}
                            onClick={() => handleStyleClick(matchingStyle)}
                            className={`w-full flex items-center justify-between py-3 px-3 rounded-xl transition-all duration-150 ${
                              isActive 
                                ? "bg-neutral-900 text-white" 
                                : "hover:bg-neutral-100"
                            }`}
                          >
                            <span className={`text-base ${isActive ? "font-medium" : ""}`}>
                              {style}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-neutral-200 text-neutral-600"
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {categoryStyles.length === 0 && (
                      <p className="text-neutral-400 text-sm py-4 text-center">No styles in this category yet.</p>
                    )}
                  </div>
                ) : (
                  /* Location Filter Content */
                  <div className="space-y-1">
                    {countries.map((country) => {
                      const isActive = currentLocation === country.code;
                      
                      return (
                        <button
                          key={country.code}
                          onClick={() => handleLocationClick(country.code)}
                          className={`w-full flex items-center justify-between py-3 px-3 rounded-xl transition-all duration-150 ${
                            isActive 
                              ? "bg-neutral-900 text-white" 
                              : "hover:bg-neutral-100"
                          }`}
                        >
                          <span className={`text-base ${isActive ? "font-medium" : ""}`}>
                            {country.name}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-neutral-200 text-neutral-600"
                          }`}>
                            {country.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-neutral-100 flex-shrink-0">
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-full py-4 bg-neutral-900 text-white text-base font-medium rounded-2xl hover:bg-neutral-800 transition-colors"
                >
                  Show {filteredCount} foundr{filteredCount === 1 ? "y" : "ies"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
