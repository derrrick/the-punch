"use client";

import { motion } from "framer-motion";

interface HeroProps {
  totalFoundries: number;
}

export function Hero({ totalFoundries }: HeroProps) {

  return (
    <section className="min-h-[60vh] flex flex-col justify-end pb-16 md:pb-24 pt-12 bg-neutral-50">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 w-full">
        <div className="max-w-4xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-sm uppercase tracking-[0.2em] text-neutral-700 mb-6"
          >
            Type Foundry Index
          </motion.p>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight text-neutral-900 leading-[1.1] mb-8"
          >
            Type Foundries Shaping the Future of Design
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-lg md:text-xl text-neutral-600 max-w-2xl leading-relaxed"
          >
            From Swiss precision to experimental expression — discover the studios 
            crafting the fonts that define modern visual culture.
          </motion.p>
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-16 flex items-center gap-4 text-sm text-neutral-600"
        >
          <span className="font-mono">{totalFoundries} Foundries</span>
          <span className="text-neutral-300">—</span>
          <span className="font-mono">Global</span>
        </motion.div>
      </div>
    </section>
  );
}

