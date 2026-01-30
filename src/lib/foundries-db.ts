import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import type { Foundry, FoundriesData } from './foundries';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Transform database record to Foundry interface
function transformDbFoundry(dbFoundry: any): Foundry {
  return {
    id: dbFoundry.id,
    name: dbFoundry.name,
    slug: dbFoundry.slug,
    location: {
      city: dbFoundry.location_city,
      country: dbFoundry.location_country,
      countryCode: dbFoundry.location_country_code,
    },
    url: dbFoundry.url,
    contentFeed: {
      type: dbFoundry.content_feed_type,
      url: dbFoundry.content_feed_url,
      rss: dbFoundry.content_feed_rss,
      frequency: dbFoundry.content_feed_frequency,
    },
    founder: dbFoundry.founder,
    founded: dbFoundry.founded,
    notableTypefaces: dbFoundry.notable_typefaces,
    style: dbFoundry.style,
    tier: dbFoundry.tier,
    socialMedia: {
      instagram: dbFoundry.social_instagram,
      twitter: dbFoundry.social_twitter,
    },
    notes: dbFoundry.notes || '',
    images: {
      screenshot: dbFoundry.screenshot_url,
      logo: dbFoundry.logo_url,
      specimens: [], // Not storing specimens yet
    },
  };
}

/**
 * Get all foundries from the database (cached)
 */
export const getAllFoundries = unstable_cache(
  async (): Promise<Foundry[]> => {
    const { data, error } = await supabase
      .from('foundries')
      .select('*')
      .order('tier', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching foundries:', error);
      return [];
    }

    return (data || []).map(transformDbFoundry);
  },
  ['all-foundries'],
  { revalidate: 60 } // Cache for 60 seconds
);

/**
 * Get a single foundry by its slug
 */
export async function getFoundryBySlug(slug: string): Promise<Foundry | null> {
  const { data, error } = await supabase
    .from('foundries')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }

  return transformDbFoundry(data);
}

/**
 * Get foundries filtered by country code
 */
export async function getFoundriesByCountry(countryCode: string): Promise<Foundry[]> {
  const { data, error } = await supabase
    .from('foundries')
    .select('*')
    .eq('location_country_code', countryCode.toUpperCase())
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching foundries by country:', error);
    return [];
  }

  return (data || []).map(transformDbFoundry);
}

/**
 * Get foundries filtered by style tag
 */
export async function getFoundriesByStyle(style: string): Promise<Foundry[]> {
  const { data, error } = await supabase
    .from('foundries')
    .select('*')
    .contains('style', [style])
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching foundries by style:', error);
    return [];
  }

  return (data || []).map(transformDbFoundry);
}

/**
 * Get all available styles from foundries
 */
export const getAllStyles = unstable_cache(
  async (): Promise<string[]> => {
    const foundries = await getAllFoundries();
    const stylesSet = new Set<string>();

    foundries.forEach(foundry => {
      foundry.style.forEach(style => stylesSet.add(style));
    });

    return Array.from(stylesSet).sort();
  },
  ['all-styles'],
  { revalidate: 300 } // Cache for 5 minutes
);

/**
 * Get all countries with foundry counts
 */
export const getAllCountries = unstable_cache(
  async (): Promise<FoundriesData['countries']> => {
    const { data, error } = await supabase
      .from('foundries')
      .select('location_country, location_country_code');

    if (error) {
      console.error('Error fetching countries:', error);
      return [];
    }

    // Count foundries per country
    const countryMap = new Map<string, { name: string; code: string; count: number }>();

    (data || []).forEach(foundry => {
      const code = foundry.location_country_code;
      const name = foundry.location_country;

      if (countryMap.has(code)) {
        countryMap.get(code)!.count++;
      } else {
        countryMap.set(code, { code, name, count: 1 });
      }
    });

    return Array.from(countryMap.values())
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  },
  ['all-countries'],
  { revalidate: 300 } // Cache for 5 minutes
);

/**
 * Search foundries by name, founder, or typefaces
 */
export async function searchFoundries(query: string): Promise<Foundry[]> {
  if (!query.trim()) {
    return getAllFoundries();
  }

  const normalizedQuery = query.toLowerCase().trim();

  // For now, fetch all and filter client-side
  // TODO: Implement full-text search in database
  const foundries = await getAllFoundries();

  return foundries.filter((foundry) => {
    return (
      foundry.name.toLowerCase().includes(normalizedQuery) ||
      foundry.founder.toLowerCase().includes(normalizedQuery) ||
      foundry.location.city.toLowerCase().includes(normalizedQuery) ||
      foundry.location.country.toLowerCase().includes(normalizedQuery) ||
      foundry.notableTypefaces.some((t) => t.toLowerCase().includes(normalizedQuery)) ||
      foundry.style.some((s) => s.toLowerCase().includes(normalizedQuery)) ||
      foundry.notes.toLowerCase().includes(normalizedQuery)
    );
  });
}
