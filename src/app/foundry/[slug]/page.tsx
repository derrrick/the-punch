import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFoundryBySlug, getAllFoundries } from "@/lib/foundries-db";
import { FoundryPageClient } from "./FoundryPageClient";

interface FoundryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate metadata for each foundry page
export async function generateMetadata({ params }: FoundryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const foundry = await getFoundryBySlug(slug);

  if (!foundry) {
    return {
      title: "Not Found",
    };
  }

  // Build a dynamic description based on location and notable typefaces
  const locationText = `${foundry.location.city}, ${foundry.location.country}`;
  const typefacesText = foundry.notableTypefaces.slice(0, 3).join(", ");
  const description = `${foundry.name} is an independent type foundry based in ${locationText}. Notable fonts include ${typefacesText} and more.`;

  return {
    title: foundry.name,
    description,
    openGraph: {
      title: `${foundry.name} — The Punch`,
      description,
      type: "website",
      images: foundry.images?.screenshot ? [
        {
          url: foundry.images.screenshot,
          width: 1200,
          height: 675,
          alt: `${foundry.name} website screenshot`,
        },
      ] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${foundry.name} — The Punch`,
      description,
      images: foundry.images?.screenshot ? [foundry.images.screenshot] : undefined,
    },
  };
}

// Generate static params for all foundries
export async function generateStaticParams() {
  const foundries = await getAllFoundries();
  return foundries.map((foundry) => ({
    slug: foundry.slug,
  }));
}

export default async function FoundryPage({ params }: FoundryPageProps) {
  const { slug } = await params;
  const foundry = await getFoundryBySlug(slug);

  if (!foundry) {
    notFound();
  }

  return <FoundryPageClient foundry={foundry} />;
}
