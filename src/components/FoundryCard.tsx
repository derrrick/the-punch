"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Foundry } from "@/lib/foundries";

interface FoundryCardProps {
  foundry: Foundry;
  index: number;
}

// Generate a consistent gradient based on the foundry name
function generateGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue1 = Math.abs(hash % 360);
  const hue2 = Math.abs((hash >> 8) % 360);

  return `linear-gradient(135deg, hsl(${hue1}, 60%, 85%), hsl(${hue2}, 60%, 80%))`;
}

export function FoundryCard({ foundry, index }: FoundryCardProps) {
  const router = useRouter();
  const hasScreenshot = foundry.images?.screenshot;

  const handleStyleClick = (e: React.MouseEvent, style: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/?style=${encodeURIComponent(style)}#results`);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.6,
        delay: index * 0.05,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <Link
        href={`/foundry/${foundry.slug}`}
        className="group block border-t border-neutral-200 pt-6 pb-8 transition-colors duration-300 hover:border-neutral-400"
      >
        {/* Screenshot or Gradient Placeholder */}
        <div className="relative w-full aspect-[16/10] mb-6 overflow-hidden rounded-lg bg-neutral-100">
          {hasScreenshot ? (
            <Image
              src={foundry.images.screenshot!}
              alt={`${foundry.name} website screenshot`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: generateGradient(foundry.name) }}
            >
              <span className="text-2xl font-medium text-neutral-700/50">
                {foundry.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Foundry Name */}
        <h2 className="text-xl font-medium tracking-tight text-neutral-900 mb-2">
          {foundry.name}
        </h2>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-neutral-700 mb-4">
          <span>{foundry.location.city}</span>
          <span className="text-neutral-300">·</span>
          <span>{foundry.location.country}</span>
        </div>

        {/* Notes as description */}
        <p className="text-sm leading-relaxed text-neutral-600 mb-6 max-w-xs">
          {foundry.notes}
        </p>

        {/* Style Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {foundry.style.slice(0, 3).map((styleTag) => (
            <button
              key={styleTag}
              onClick={(e) => handleStyleClick(e, styleTag)}
              className="inline-flex items-center px-3 py-1 bg-neutral-100 text-xs uppercase tracking-wider text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 transition-colors cursor-pointer"
            >
              {styleTag}
            </button>
          ))}
        </div>

        {/* Notable Typefaces */}
        <div className="space-y-1">
          {foundry.notableTypefaces.slice(0, 3).map((typeface) => (
            <div
              key={typeface}
              className="text-sm text-neutral-600 font-mono"
            >
              {typeface}
            </div>
          ))}
        </div>
      </Link>
    </motion.article>
  );
}
