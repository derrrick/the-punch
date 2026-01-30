"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-foreground/10">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-foreground text-sm">
          The Punch © 2026
        </p>

        <div className="flex items-center gap-6">
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground text-sm hover:opacity-60 transition-opacity"
          >
            Sponsorship & Advertising
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground text-sm hover:opacity-60 transition-opacity"
          >
            Contact Us
          </a>
          <Link
            href="/submit"
            className="text-foreground text-sm hover:opacity-60 transition-opacity"
          >
            Submit a Foundry
          </Link>
        </div>
      </div>
    </footer>
  );
}
