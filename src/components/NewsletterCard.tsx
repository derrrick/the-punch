"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";

export function NewsletterCard() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitStatus('success');
        setEmail("");
      } else {
        setSubmitStatus('error');
        setErrorMessage(data.error || 'An error occurred.');
      }
    } catch {
      setSubmitStatus('error');
      setErrorMessage('An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.6,
        delay: 0.3,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <div className="border-t border-neutral-200 pt-6 pb-8">
        {/* Visual area matching screenshot aspect ratio */}
        <div className="relative w-full aspect-[16/10] mb-6 overflow-hidden rounded-lg bg-neutral-900 flex flex-col items-center justify-center p-6">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded-full mb-3">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-[10px] uppercase tracking-wider text-white/70">Newsletter</span>
            </span>
            <h3 className="text-white text-lg font-medium tracking-tight leading-tight">
              The Punch Weekly
            </h3>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-medium tracking-tight text-neutral-900 mb-2">
          Subscribe to Updates
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-neutral-700 mb-4">
          Weekly curated foundries
        </p>

        {submitStatus === 'success' ? (
          <div className="py-4 text-center">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
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
                className="text-green-600"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <p className="text-sm text-neutral-600">You&apos;re subscribed!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={isSubmitting}
              className="w-full px-3 py-2.5 text-sm bg-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 placeholder:text-neutral-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Subscribing..." : "Subscribe"}
            </button>
            {submitStatus === 'error' && errorMessage && (
              <p className="text-xs text-red-500 text-center">{errorMessage}</p>
            )}
          </form>
        )}
      </div>
    </motion.article>
  );
}
