"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { Foundry } from "@/lib/foundries-db";

interface SpotlightFoundry extends Foundry {
  spotlightDescription?: string;
  spotlightQuote?: string;
}

interface FoundrySpotlightProps {
  foundries: SpotlightFoundry[];
  title?: string;
  subtitle?: string;
  variant?: "hero" | "grid" | "carousel";
}

export function FoundrySpotlight({ 
  foundries, 
  title = "This Week's Spotlight",
  subtitle = "Exceptional foundries worth your attention",
  variant = "hero"
}: FoundrySpotlightProps) {
  if (!foundries || foundries.length === 0) return null;

  // Hero variant: First foundry gets large treatment, others in a row
  if (variant === "hero") {
    const [featured, ...rest] = foundries;
    
    return (
      <section className="py-16 md:py-24 bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12">
          {/* Section Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium">
                Featured
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-neutral-900">
              {title}
            </h2>
            <p className="mt-2 text-neutral-600 text-lg">
              {subtitle}
            </p>
          </motion.div>

          {/* Featured Foundry - Large */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <Link href={`/foundry/${featured.slug}`} className="group block">
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center bg-white rounded-2xl overflow-hidden border border-neutral-200 hover:border-neutral-300 transition-colors">
                {/* Image Side */}
                <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full min-h-[300px] bg-neutral-100">
                  {featured.images?.screenshot ? (
                    <img 
                      src={featured.images.screenshot} 
                      alt={featured.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-neutral-300">
                      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="M3 9h18" />
                      </svg>
                    </div>
                  )}
                  {/* Overlay Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1.5 bg-neutral-900 text-white text-xs uppercase tracking-wider rounded-full">
                      Spotlight
                    </span>
                  </div>
                </div>

                {/* Content Side */}
                <div className="p-8 lg:p-12">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {featured.style?.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs uppercase tracking-wider text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <h3 className="text-3xl md:text-4xl font-medium tracking-tight text-neutral-900 mb-2 group-hover:text-neutral-600 transition-colors">
                    {featured.name}
                  </h3>
                  
                  <p className="text-sm text-neutral-500 uppercase tracking-wider mb-6">
                    {featured.location.city}, {featured.location.country}
                  </p>
                  
                  <p className="text-neutral-700 text-lg leading-relaxed mb-6">
                    {featured.spotlightDescription || featured.notes?.substring(0, 200) || `${featured.name} is an independent type foundry creating exceptional typography for designers worldwide.`}
                  </p>

                  {featured.spotlightQuote && (
                    <blockquote className="border-l-2 border-orange-500 pl-4 mb-6 italic text-neutral-600">
                      &ldquo;{featured.spotlightQuote}&rdquo;
                    </blockquote>
                  )}

                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-neutral-900 group-hover:text-orange-600 transition-colors">
                      Explore Foundry
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </span>
                  </div>

                  {featured.notableTypefaces && featured.notableTypefaces.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-neutral-100">
                      <p className="text-xs uppercase tracking-wider text-neutral-400 mb-3">
                        Notable Typefaces
                      </p>
                      <p className="text-sm text-neutral-600">
                        {featured.notableTypefaces.slice(0, 4).join(" · ")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Secondary Spotlights */}
          {rest.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((foundry, index) => (
                <motion.div
                  key={foundry.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <Link href={`/foundry/${foundry.slug}`} className="group block">
                    <div className="bg-white rounded-xl overflow-hidden border border-neutral-200 hover:border-neutral-300 hover:shadow-lg transition-all">
                      {/* Thumbnail */}
                      <div className="relative aspect-[16/10] bg-neutral-100">
                        {foundry.images?.screenshot ? (
                          <img 
                            src={foundry.images.screenshot} 
                            alt={foundry.name}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-neutral-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="18" height="18" x="3" y="3" rx="2" />
                              <path d="M3 9h18" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="p-6">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {foundry.style?.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-xs uppercase tracking-wider text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        <h4 className="text-xl font-medium text-neutral-900 mb-1 group-hover:text-neutral-600 transition-colors">
                          {foundry.name}
                        </h4>
                        
                        <p className="text-sm text-neutral-500 mb-3">
                          {foundry.location.city}, {foundry.location.country}
                        </p>
                        
                        <p className="text-sm text-neutral-600 line-clamp-2">
                          {foundry.spotlightDescription || foundry.notes?.substring(0, 120)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  // Grid variant: Equal-sized cards in a row
  if (variant === "grid") {
    return (
      <section className="py-16 md:py-24 bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs uppercase tracking-wider font-medium mb-4">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
              Featured This Week
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-neutral-900">
              {title}
            </h2>
            <p className="mt-2 text-neutral-600 text-lg">
              {subtitle}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {foundries.map((foundry, index) => (
              <motion.div
                key={foundry.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/foundry/${foundry.slug}`} className="group block h-full">
                  <div className="bg-white rounded-xl overflow-hidden border border-neutral-200 hover:border-neutral-300 hover:shadow-lg transition-all h-full flex flex-col">
                    <div className="relative aspect-[4/3] bg-neutral-100">
                      {foundry.images?.screenshot ? (
                        <img 
                          src={foundry.images.screenshot} 
                          alt={foundry.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-neutral-300">
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="3" rx="2" />
                            <path d="M3 9h18" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 bg-neutral-900 text-white text-[10px] uppercase tracking-wider rounded">
                          #{index + 1}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-lg font-medium text-neutral-900 mb-1 group-hover:text-neutral-600 transition-colors">
                        {foundry.name}
                      </h3>
                      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">
                        {foundry.location.city}, {foundry.location.country}
                      </p>
                      <p className="text-sm text-neutral-600 line-clamp-3 flex-1">
                        {foundry.spotlightDescription || foundry.notes?.substring(0, 100)}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return null;
}
