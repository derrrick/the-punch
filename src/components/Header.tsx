"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatedLogo } from "./AnimatedLogo";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Get the filter bar's bottom position and the first foundry tile's top position
      const filterBar = document.querySelector('[data-filter-bar]') as HTMLElement;
      const firstFoundryTile = document.querySelector('[data-foundry-tile]') as HTMLElement;
      
      if (filterBar && firstFoundryTile) {
        const filterBarRect = filterBar.getBoundingClientRect();
        const tileRect = firstFoundryTile.getBoundingClientRect();
        
        // Check if filter bar's bottom border has eclipsed the tile's top border
        // The header should turn white when the filter bar bottom touches or passes the tile top
        const shouldBeWhite = filterBarRect.bottom >= tileRect.top;
        setIsScrolled(shouldBeWhite);
      } else {
        // Fallback: use scroll position if elements not found
        setIsScrolled(window.scrollY > 10);
      }
    };

    // Initial check
    handleScroll();
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white border-b border-neutral-100"
          : "bg-background/80 backdrop-blur-md border-b border-transparent"
      }`}
    >
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 h-[72px] flex justify-between items-center">
        <Link
          href="/"
          className="hover:opacity-60 transition-opacity"
        >
          <AnimatedLogo className="h-5 w-auto" />
        </Link>

        <nav className="flex items-center gap-6 md:gap-8">
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
          <a
            href="#newsletter"
            className="text-sm font-medium bg-neutral-900 text-white px-4 py-1.5 rounded-lg hover:bg-neutral-700 transition-colors"
          >
            Get weekly updates
          </a>
        </nav>
      </div>
    </header>
  );
}
