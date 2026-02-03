"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";

export function NewsletterBanner() {
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
    <section id="newsletter" className="relative bg-neutral-900 text-white overflow-hidden">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-16 md:py-24 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs uppercase tracking-[0.15em] font-medium text-white/80">
                Weekly Newsletter
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight leading-[1.15] mb-6">
              Get the best type foundries in your inbox
            </h2>

            {/* Description */}
            <p className="text-lg text-white/60 leading-relaxed max-w-lg">
              Every week, we spotlight 2-3 exceptional foundries. No spam, 
              just carefully curated typography discoveries and exclusive 
              updates from the indie type world.
            </p>

            {/* Social Proof */}
            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-3">
                {[
                  "https://i.pravatar.cc/150?img=32",
                  "https://i.pravatar.cc/150?img=47",
                  "https://i.pravatar.cc/150?img=12",
                  "https://i.pravatar.cc/150?img=68",
                  "https://i.pravatar.cc/150?img=25",
                ].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="w-10 h-10 rounded-full border-2 border-neutral-900 object-cover"
                  />
                ))}
              </div>
              <p className="text-sm text-white/50">
                Join a community of typography lovers
              </p>
            </div>
          </motion.div>

          {/* Right: Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-10 border border-white/10">
              {submitStatus === 'success' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-green-400"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium mb-2">You&apos;re on the list!</h3>
                  <p className="text-white/60">
                    Watch your inbox for our next issue.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-medium mb-2">Free weekly newsletter</h3>
                  <p className="text-white/60 text-sm mb-6">
                    Weekly discoveries from the best independent type designers—delivered to your inbox.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        disabled={isSubmitting}
                        className="w-full px-4 py-4 bg-white text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 placeholder:text-neutral-400 disabled:opacity-50"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-[#000000] text-white font-medium rounded-lg hover:bg-[#FF7700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Subscribing...
                        </>
                      ) : (
                        <>
                          Subscribe to The Punch Weekly
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
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </form>

                  {submitStatus === 'error' && errorMessage && (
                    <p className="mt-4 text-sm text-red-400 text-center">
                      {errorMessage}
                    </p>
                  )}

                  <p className="mt-4 text-xs text-white/40 text-center">
                    Unsubscribe anytime. We respect your privacy.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Feature Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 pt-12 border-t border-white/10"
        >
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            {[
              { icon: "✉️", label: "Weekly issues" },
              { icon: "🔍", label: "Curated foundries" },
              { icon: "💎", label: "Exclusive previews" },
              { icon: "🚫", label: "No spam, ever" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-white/60">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
