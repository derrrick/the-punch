"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";

// Arrow icon component since lucide-react is not installed
function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export function Footer() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");

  const handleNewsletterSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim()) {
      setErrorMessage("Please enter an email address.");
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage("");

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitStatus('success');
        setEmail(""); // Clear the input on success
      } else {
        setSubmitStatus('error');
        setErrorMessage(data.error || 'An error occurred. Please try again.');
      }
    } catch {
      setSubmitStatus('error');
      setErrorMessage('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="border-t border-foreground/10">
      {/* Newsletter Section */}
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-12 md:py-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h3 className="text-lg font-medium text-foreground">
              Subscribe to The Punch Weekly
            </h3>
            <p className="text-sm text-foreground/60 mt-1">
              Delivered every week, unsubscribe at any time.
            </p>
          </div>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-2 w-full lg:w-auto">
            <div className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                disabled={isSubmitting || submitStatus === 'success'}
                className="flex-1 lg:w-[320px] px-4 py-3 text-sm bg-transparent border border-foreground/20 rounded-full focus:outline-none focus:border-foreground/40 transition-colors placeholder:text-foreground/40 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={isSubmitting || submitStatus === 'success'}
                className="flex items-center justify-center w-12 h-12 bg-foreground/10 rounded-lg hover:bg-foreground/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Subscribe"
              >
                <ArrowRight className="w-5 h-5 text-foreground" />
              </button>
            </div>
            {submitStatus === 'success' && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Thanks! We&apos;ll be in touch when we launch the newsletter.
              </p>
            )}
            {submitStatus === 'error' && errorMessage && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errorMessage}
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-[1800px] mx-auto px-6 md:px-12">
        <div className="border-t border-foreground/10" />
      </div>

      {/* Main Footer Content */}
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-4">
          {/* Tagline */}
          <div className="lg:col-span-2 lg:pr-20">
            <p className="text-lg text-foreground leading-relaxed">
              The Punch is a curated directory of the world&apos;s finest type foundries.
            </p>
          </div>

          {/* Typography Resources */}
          <div>
            <h4 className="text-xs font-medium text-foreground/40 uppercase tracking-wider mb-4">
              Resources
            </h4>
            <nav className="flex flex-col gap-3">
              <a
                href="https://fontreviewjournal.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground/70 hover:text-foreground transition-colors"
              >
                Font Review Journal
              </a>
              <a
                href="https://www.typographica.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground/70 hover:text-foreground transition-colors"
              >
                Typographica
              </a>
              <a
                href="https://typewolf.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground/70 hover:text-foreground transition-colors"
              >
                Typewolf
              </a>
              <a
                href="https://fonts.google.com/knowledge"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground/70 hover:text-foreground transition-colors"
              >
                Google Fonts Knowledge
              </a>
            </nav>
          </div>

          {/* Navigation Column 1 */}
          <div>
            <h4 className="text-xs font-medium text-foreground/40 uppercase tracking-wider mb-4">
              Directory
            </h4>
            <nav className="flex flex-col gap-3">
              <Link
                href="/"
                className="text-sm text-foreground/70 hover:text-foreground transition-colors"
              >
                Browse Foundries
              </Link>
              <Link
                href="/about"
                className="text-sm text-foreground/70 hover:text-foreground transition-colors"
              >
                About The Punch
              </Link>
              <Link
                href="/submit"
                className="text-sm text-foreground/70 hover:text-foreground transition-colors"
              >
                Submit a Foundry
              </Link>
              <a
                href="mailto:hello@thepunch.studio"
                className="text-sm text-foreground/70 hover:text-foreground transition-colors"
              >
                Contact Us
              </a>
            </nav>
          </div>

          {/* Navigation Column 2 */}
          <div>
            <h4 className="text-xs font-medium text-foreground/40 uppercase tracking-wider mb-4">
              Discover
            </h4>
            <nav className="flex flex-col gap-3">
              <Link
                href="/?sort=popular"
                className="text-sm text-foreground/70 hover:text-foreground transition-colors"
              >
                Most Popular
              </Link>
              <Link
                href="/?filter=recent"
                className="text-sm text-foreground/70 hover:text-foreground transition-colors"
              >
                Recently Founded
              </Link>
              <Link
                href="/?filter=classic"
                className="text-sm text-foreground/70 hover:text-foreground transition-colors"
              >
                Classic Foundries
              </Link>
              <Link
                href="/?filter=established"
                className="text-sm text-foreground/70 hover:text-foreground transition-colors"
              >
                Established Studios
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-foreground/10">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-foreground/50">
              The Punch © 2026
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/sponsorship"
                className="text-sm text-foreground/50 hover:text-foreground/70 transition-colors"
              >
                Sponsorship & Advertising
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-foreground/50 hover:text-foreground/70 transition-colors"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
