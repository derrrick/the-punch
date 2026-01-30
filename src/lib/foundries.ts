import foundriesData from "@/data/foundries.json";

export interface Foundry {
  id: string;
  name: string;
  slug: string;
  location: {
    city: string;
    country: string;
    countryCode: string;
  };
  url: string;
  contentFeed: {
    type: string | null;
    url: string | null;
    rss: string | null;
    frequency: string | null;
  };
  founder: string;
  founded: number;
  notableTypefaces: string[];
  style: string[];
  tier: number;
  socialMedia: {
    instagram: string | null;
    twitter: string | null;
  };
  notes: string;
  images: {
    screenshot: string | null;
    logo: string | null;
    specimens: string[];
  };
}

export interface FoundriesData {
  meta: {
    version: string;
    lastUpdated: string;
    totalFoundries: number;
    description: string;
  };
  foundries: Foundry[];
  styles: string[];
  countries: {
    code: string;
    name: string;
    count: number;
  }[];
}

const data = foundriesData as FoundriesData;

/**
 * Get all foundries from the database
 */
export function getAllFoundries(): Foundry[] {
  return data.foundries;
}

/**
 * Get a single foundry by its slug
 */
export function getFoundryBySlug(slug: string): Foundry | undefined {
  return data.foundries.find((foundry) => foundry.slug === slug);
}

/**
 * Get foundries filtered by country code
 */
export function getFoundriesByCountry(countryCode: string): Foundry[] {
  return data.foundries.filter(
    (foundry) => foundry.location.countryCode.toLowerCase() === countryCode.toLowerCase()
  );
}

/**
 * Get foundries filtered by style tag
 */
export function getFoundriesByStyle(style: string): Foundry[] {
  const normalizedStyle = style.toLowerCase();
  return data.foundries.filter((foundry) =>
    foundry.style.some((s) => s.toLowerCase() === normalizedStyle)
  );
}

/**
 * Search foundries by name, founder, or typefaces
 */
export function searchFoundries(query: string): Foundry[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery) {
    return data.foundries;
  }
  
  return data.foundries.filter((foundry) => {
    // Search in name
    if (foundry.name.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    
    // Search in founder
    if (foundry.founder.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    
    // Search in location
    if (
      foundry.location.city.toLowerCase().includes(normalizedQuery) ||
      foundry.location.country.toLowerCase().includes(normalizedQuery)
    ) {
      return true;
    }
    
    // Search in notable typefaces
    if (
      foundry.notableTypefaces.some((typeface) =>
        typeface.toLowerCase().includes(normalizedQuery)
      )
    ) {
      return true;
    }
    
    // Search in style tags
    if (
      foundry.style.some((s) => s.toLowerCase().includes(normalizedQuery))
    ) {
      return true;
    }
    
    // Search in notes
    if (foundry.notes.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    
    return false;
  });
}

/**
 * Get all available styles
 */
export function getAllStyles(): string[] {
  return data.styles;
}

/**
 * Get all countries with foundry counts
 */
export function getAllCountries(): FoundriesData["countries"] {
  return data.countries;
}

/**
 * Get metadata about the foundries database
 */
export function getMeta() {
  return data.meta;
}
