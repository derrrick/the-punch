"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getAllStyles, getAllCountries, getAllFoundries } from "@/lib/foundries";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<"style" | "location" | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const styles = getAllStyles();
  const countries = getAllCountries();
  const allFoundries = getAllFoundries();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const handleStyleClick = (style: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("style", style);
    params.delete("location");
    router.push(`/?${params.toString()}`);
    setActiveDropdown(null);
  };

  const handleLocationClick = (countryCode: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("location", countryCode);
    params.delete("style");
    router.push(`/?${params.toString()}`);
    setActiveDropdown(null);
  };

  const toggleDropdown = (dropdown: "style" | "location") => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const currentStyle = searchParams.get("style");
  const currentLocation = searchParams.get("location");

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/95 backdrop-blur-md border-b border-foreground/10"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-4 flex justify-between items-center">
          <Link
            href="/"
            className="text-foreground text-sm font-medium tracking-tight hover:opacity-60 transition-opacity"
          >
            The Punch
          </Link>

          <nav className="flex items-center gap-6 md:gap-8" ref={dropdownRef}>
            {/* Style Filter Dropdown Trigger */}
            <button
              onClick={() => toggleDropdown("style")}
              className={`text-sm transition-all duration-200 flex items-center gap-1.5 ${
                activeDropdown === "style" || currentStyle
                  ? "text-foreground font-medium"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                activeDropdown === "style" ? "bg-foreground scale-100" : "bg-foreground/40 scale-75"
              }`} />
              Style
            </button>

            {/* Location Filter Dropdown Trigger */}
            <button
              onClick={() => toggleDropdown("location")}
              className={`text-sm transition-all duration-200 flex items-center gap-1.5 ${
                activeDropdown === "location" || currentLocation
                  ? "text-foreground font-medium"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                activeDropdown === "location" ? "bg-foreground scale-100" : "bg-foreground/40 scale-75"
              }`} />
              Location
            </button>

            <Link
              href="/about"
              className="text-foreground/60 text-sm hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link
              href="/submit"
              className="text-foreground/60 text-sm hover:text-foreground transition-colors"
            >
              Submit
            </Link>
          </nav>
        </div>

        {/* Floating dropdown modal */}
        <AnimatePresence>
          {activeDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute left-6 right-6 md:left-12 md:right-12 top-full mt-3 z-40"
            >
              <div className="bg-[#171717] rounded-2xl shadow-2xl overflow-hidden">
                <div className="px-6 md:px-8 py-6 md:py-8">
                  {activeDropdown === "style" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: 0.05 }}
                      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-2"
                    >
                      {styles.map((style, index) => (
                        <motion.button
                          key={style}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.015 }}
                          onClick={() => handleStyleClick(style)}
                          onMouseEnter={() => setHoveredItem(style)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className="text-left py-2 group flex items-baseline gap-2"
                        >
                          <span
                            className={`text-lg md:text-xl font-normal transition-all duration-200 capitalize ${
                              currentStyle === style
                                ? "text-white"
                                : hoveredItem === style || hoveredItem === null
                                ? "text-white/90"
                                : "text-white/30"
                            }`}
                          >
                            {style}
                          </span>
                          <span
                            className={`text-xs transition-all duration-200 ${
                              currentStyle === style
                                ? "text-white/60"
                                : hoveredItem === style || hoveredItem === null
                                ? "text-white/40"
                                : "text-white/20"
                            }`}
                          >
                            {allFoundries.filter((f) =>
                              f.style.some((s) => s.toLowerCase() === style.toLowerCase())
                            ).length}
                          </span>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}

                  {activeDropdown === "location" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: 0.05 }}
                      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-2"
                    >
                      {countries.map((country, index) => (
                        <motion.button
                          key={country.code}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.015 }}
                          onClick={() => handleLocationClick(country.code)}
                          onMouseEnter={() => setHoveredItem(country.code)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className="text-left py-2 group flex items-baseline gap-2"
                        >
                          <span
                            className={`text-lg md:text-xl font-normal transition-all duration-200 ${
                              currentLocation === country.code
                                ? "text-white"
                                : hoveredItem === country.code || hoveredItem === null
                                ? "text-white/90"
                                : "text-white/30"
                            }`}
                          >
                            {country.name}
                          </span>
                          <span
                            className={`text-xs transition-all duration-200 ${
                              currentLocation === country.code
                                ? "text-white/60"
                                : hoveredItem === country.code || hoveredItem === null
                                ? "text-white/40"
                                : "text-white/20"
                            }`}
                          >
                            {country.count}
                          </span>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}

