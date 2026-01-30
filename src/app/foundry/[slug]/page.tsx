import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getFoundryBySlug, getAllFoundries } from "@/lib/foundries-db";

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

  const hasScreenshot = foundry.images?.screenshot;

  return (
    <main className="min-h-screen">
      {/* Hero Section with generous whitespace */}
      <section className="pt-32 pb-20 px-6 md:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto">
          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-700 hover:text-neutral-900 transition-colors duration-300 mb-16"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to index
          </Link>

          {/* Foundry Name - Large and prominent */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight text-neutral-900 mb-12">
            {foundry.name}
          </h1>

          {/* Location */}
          <div className="flex items-center gap-3 text-lg text-neutral-700 mb-8">
            <span>{foundry.location.city}</span>
            <span className="text-neutral-300">·</span>
            <span>{foundry.location.country}</span>
          </div>
        </div>
      </section>

      {/* Screenshot Section - Full Width */}
      {hasScreenshot && (
        <section className="px-6 md:px-12 lg:px-20 mb-20">
          <div className="max-w-6xl mx-auto">
            <div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg bg-neutral-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
              <Image
                src={foundry.images.screenshot!}
                alt={`${foundry.name} website screenshot`}
                fill
                className="object-cover"
                sizes="(max-width: 1200px) 100vw, 1200px"
                priority
              />
            </div>
          </div>
        </section>
      )}

      {/* Details Section */}
      <section className="pb-32 px-6 md:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
            {/* Left Column - Key Info */}
            <div className="lg:col-span-5 space-y-12">
              {/* Founded & Founder */}
              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-neutral-600 mb-2">
                    Founded
                  </p>
                  <p className="text-2xl font-medium text-neutral-900">
                    {foundry.founded}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-neutral-600 mb-2">
                    Founder
                  </p>
                  <p className="text-2xl font-medium text-neutral-900">
                    {foundry.founder}
                  </p>
                </div>
              </div>

              {/* External Links */}
              <div className="space-y-4 pt-8 border-t border-neutral-200">
                <a
                  href={foundry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-neutral-900 hover:text-neutral-600 transition-colors duration-300"
                >
                  <span className="text-lg">Visit website</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 7h10v10" />
                    <path d="M7 17 17 7" />
                  </svg>
                </a>

                {foundry.contentFeed.url && (
                  <a
                    href={foundry.contentFeed.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-neutral-700 hover:text-neutral-900 transition-colors duration-300"
                  >
                    <span className="text-lg">Content Feed</span>
                  </a>
                )}
              </div>
            </div>

            {/* Right Column - Typefaces & Style */}
            <div className="lg:col-span-7 space-y-16">
              {/* Notable Typefaces */}
              <div>
                <p className="text-xs uppercase tracking-widest text-neutral-600 mb-6">
                  Notable Typefaces
                </p>
                <div className="flex flex-wrap gap-3">
                  {foundry.notableTypefaces.map((typeface) => (
                    <span
                      key={typeface}
                      className="inline-flex items-center px-4 py-2 bg-neutral-100 text-sm font-medium text-neutral-700 rounded-full"
                    >
                      {typeface}
                    </span>
                  ))}
                </div>
              </div>

              {/* Style Tags */}
              <div>
                <p className="text-xs uppercase tracking-widest text-neutral-600 mb-6">
                  Style
                </p>
                <div className="flex flex-wrap gap-3">
                  {foundry.style.map((styleTag) => (
                    <span
                      key={styleTag}
                      className="inline-flex items-center px-4 py-2 border border-neutral-200 text-sm text-neutral-600 rounded-full"
                    >
                      {styleTag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {foundry.notes && (
                <div className="pt-8 border-t border-neutral-200">
                  <p className="text-xs uppercase tracking-widest text-neutral-600 mb-4">
                    Notes
                  </p>
                  <p className="text-lg text-neutral-600 leading-relaxed max-w-xl">
                    {foundry.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
