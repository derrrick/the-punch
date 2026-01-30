import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { FoundryGrid } from "@/components/FoundryGrid";

export const metadata: Metadata = {
  title: "The Punch — Typography, organized by who made it",
  description: "A curated directory of independent type foundries. Discover the designers behind your favorite fonts.",
  openGraph: {
    title: "The Punch — Typography, organized by who made it",
    description: "A curated directory of independent type foundries. Discover the designers behind your favorite fonts.",
    type: "website",
  },
};

export default function Home() {
  return (
    <>
      <Hero />
      <FoundryGrid />
    </>
  );
}
