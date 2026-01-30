import type { MetadataRoute } from "next";
import { getAllFoundries } from "@/lib/foundries-db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://thepunch.studio";
  const foundries = await getAllFoundries();

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/submit`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];

  // Dynamic foundry pages
  const foundryPages = foundries.map((foundry) => ({
    url: `${baseUrl}/foundry/${foundry.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...foundryPages];
}