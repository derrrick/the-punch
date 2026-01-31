import type { Metadata } from "next";
import { Suspense } from "react";
import { Hero } from "@/components/Hero";
import { FoundryGrid } from "@/components/FoundryGrid";
import { FilterBar } from "@/components/FilterBar";
import { getAllFoundries, getAllCountries, getAllStyles } from "@/lib/foundries-db";

export const metadata: Metadata = {
  title: "The Punch — Typography, organized by who made it",
  description: "A curated directory of independent type foundries. Discover the designers behind your favorite fonts.",
  openGraph: {
    title: "The Punch — Typography, organized by who made it",
    description: "A curated directory of independent type foundries. Discover the designers behind your favorite fonts.",
    type: "website",
  },
};

export default async function Home() {
  // Fetch data server-side from Supabase
  const foundries = await getAllFoundries();
  const countries = await getAllCountries();
  const styles = await getAllStyles();

  return (
    <>
      <Hero totalFoundries={foundries.length} />
      <FilterBar foundries={foundries} styles={styles} countries={countries} />
      <Suspense fallback={<div className="py-24 text-center">Loading...</div>}>
        <FoundryGrid foundries={foundries} countries={countries} />
      </Suspense>
    </>
  );
}
