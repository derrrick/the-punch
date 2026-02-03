"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatedLogo } from "./AnimatedLogo";

interface HeaderProps {
  darkMode?: boolean;
  isHomePage?: boolean;
}

export function Header({ darkMode = false, isHomePage = false }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const filterBar = document.querySelector('[data-filter-bar]') as HTMLElement;
      const firstFoundryTile = document.querySelector('[data-foundry-tile]') as HTMLElement;
      
      if (filterBar && firstFoundryTile) {
        const filterBarRect = filterBar.getBoundingClientRect();
        const tileRect = firstFoundryTile.getBoundingClientRect();
        const shouldBeWhite = filterBarRect.bottom >= tileRect.top;
        setIsScrolled(shouldBeWhite);
      } else {
        setIsScrolled(window.scrollY > 10);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Dark mode header: starts with dark bg, switches to white on scroll
  if (darkMode) {
    const isDark = !isScrolled;
    return (
      <header
        ref={headerRef}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white border-b border-neutral-100"
            : "bg-neutral-950/90 backdrop-blur-md border-b border-white/10"
        }`}
      >
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 h-[72px] flex justify-between items-center">
          <Link href="/" className="hover:opacity-60 transition-opacity">
            <AnimatedLogo className="h-5 w-auto" squareColor={isDark ? '#FF7700' : '#171717'} />
          </Link>

          <nav className="flex items-center gap-6 md:gap-8">
            <Link
              href="/about"
              className={`text-sm transition-colors ${
                isDark ? 'text-white/60 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              About
            </Link>
            <Link
              href="/submit"
              className={`text-sm transition-colors ${
                isDark ? 'text-white/60 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Submit
            </Link>
            <Link
              href={isHomePage ? "#newsletter" : "/#newsletter"}
              className={`text-sm transition-colors underline underline-offset-4 ${
                isDark 
                  ? 'text-white/60 hover:text-white decoration-white/30 hover:decoration-white' 
                  : 'text-neutral-600 hover:text-neutral-900 decoration-neutral-400 hover:decoration-neutral-900'
              }`}
            >
              Subscribe
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  // Default light mode header
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
        <Link href="/" className="hover:opacity-60 transition-opacity">
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
          <Link
            href={isHomePage ? "#newsletter" : "/#newsletter"}
            className="text-foreground/60 text-sm hover:text-foreground transition-colors underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground"
          >
            Subscribe
          </Link>
        </nav>
      </div>
    </header>
  );
}
