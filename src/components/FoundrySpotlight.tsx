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
      <section className="relative">
        {/* Smooth gradient transition from hero */}
        <div className="h-24 bg-gradient-to-b from-neutral-50 to-white" />
        
        <div className="bg-white pb-16 md:pb-24">
          {/* Subtle decorative top border */}
          <div className="max-w-[1800px] mx-auto px-6 md:px-12">
            <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent mb-12" />
          </div>
          
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
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center bg-neutral-50 rounded-2xl overflow-hidden border border-neutral-200 hover:border-neutral-300 hover:shadow-xl transition-all duration-300">
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
                        <span key={tag} className="text-xs uppercase tracking-wider text-neutral-500 bg-white px-2 py-1 rounded border border-neutral-200">
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
                      <div className="mt-8 pt-6 border-t border-neutral-200">
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
                      <div className="bg-neutral-50 rounded-xl overflow-hidden border border-neutral-200 hover:border-neutral-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
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
                        <div className="p-6 bg-white">
                          <div className="flex flex-wrap gap-2 mb-3">
                            {foundry.style?.slice(0, 2).map((tag) => (
                              <span key={tag} className="text-xs uppercase tracking-wider text-neutral-500 bg-neutral-50 px-2 py-1 rounded">
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
          
          {/* Bottom decorative element - subtle fade to filter bar */}
          <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent mt-16" />
        </div>
      </section>
    );
  }

  // Grid variant: Dark editorial style matching hero spotlight
  if (variant === "grid") {
    return (
      <section className="min-h-screen bg-neutral-950 text-white pb-16 md:pb-24">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 pt-24">
          {/* Section Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="w-12 h-px bg-orange-500" />
              <span className="text-xs uppercase tracking-[0.3em] text-orange-500 font-medium">
                Featured
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white max-w-2xl">
              {title}
            </h2>
            <p className="mt-4 text-white/60 text-lg max-w-xl">
              {subtitle}
            </p>
          </motion.div>

          {/* Grid of Foundries */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {foundries.map((foundry, index) => (
              <motion.div
                key={foundry.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Link href={`/foundry/${foundry.slug}`} className="group block h-full">
                  <div className="relative bg-neutral-900 rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-500 h-full">
                    {/* Large Number Background */}
                    <span className="absolute top-4 left-4 text-6xl font-light text-white/5 group-hover:text-orange-500/10 transition-colors z-10">
                      0{index + 1}
                    </span>
                    
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {foundry.images?.screenshot ? (
                        <img 
                          src={foundry.images.screenshot} 
                          alt={foundry.name}
                          className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-neutral-700">
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="3" rx="2" />
                            <path d="M3 9h18" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-transparent" />
                    </div>
                    
                    {/* Content */}
                    <div className="relative p-6 -mt-12">
                      <h3 className="text-xl font-medium text-white mb-1 group-hover:text-orange-500 transition-colors">
                        {foundry.name}
                      </h3>
                      <p className="text-sm text-white/50 uppercase tracking-wider mb-4">
                        {foundry.location.city}, {foundry.location.country}
                      </p>
                      <p className="text-sm text-white/70 line-clamp-3 mb-4">
                        {foundry.spotlightDescription || foundry.notes?.substring(0, 120)}
                      </p>
                      
                      {/* Arrow Link */}
                      <div className="flex items-center gap-2 text-white/40 group-hover:text-orange-500 transition-colors">
                        <span className="text-xs uppercase tracking-wider">Explore</span>
                        <span className="text-lg group-hover:translate-x-2 transition-transform duration-300">→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Bottom fade to filter bar */}
        <div className="h-24 bg-gradient-to-t from-white to-transparent mt-16" />
      </section>
    );
  }

  return null;
}
