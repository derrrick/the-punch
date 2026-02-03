import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FoundryGrid } from "@/components/FoundryGrid";
import { FilterBar } from "@/components/FilterBar";
import { HeroSpotlight } from "@/components/HeroSpotlight";
import { getAllFoundries, getAllCountries, getAllStyles } from "@/lib/foundries-db";
import { getSpotlightSettings, getSpotlightFoundries } from "@/lib/spotlight";

// Force dynamic rendering to always fetch fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  
  // Fetch spotlight data fresh each time
  const [spotlightSettings, spotlightFoundries] = await Promise.all([
    getSpotlightSettings(),
    getSpotlightFoundries(),
  ]);
  
  const showSpotlight = spotlightSettings?.is_enabled && spotlightFoundries.length > 0;

  return (
    <>
      <Suspense fallback={<div className="h-[72px]" />}>
        <Header darkMode={showSpotlight} />
      </Suspense>
      
      {showSpotlight ? (
        <HeroSpotlight
          spotlightFoundries={spotlightFoundries.slice(0, spotlightSettings?.max_spotlights || 4)}
        />
      ) : (
        <Hero totalFoundries={foundries.length} />
      )}
      
      <Suspense fallback={<div className="h-16" />}>
        <FilterBar foundries={foundries} styles={styles} countries={countries} />
      </Suspense>
      <Suspense fallback={<div className="py-24 text-center">Loading...</div>}>
        <FoundryGrid foundries={foundries} countries={countries} />
      </Suspense>
    </>
  );
}
