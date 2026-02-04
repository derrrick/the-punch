/**
 * Multi-source data fetching for foundry validation
 *
 * Sources:
 * - Foundry website (primary)
 * - Wikidata (structured facts)
 * - Fonts In Use (typeface attribution)
 * - MyFonts (font catalog, if available)
 */

export interface SourceData {
  source: string;
  url: string;
  content: string | null;
  structured?: Record<string, unknown>;
  error?: string;
}

export interface MultiSourceResult {
  foundryName: string;
  sources: SourceData[];
  combinedContext: string;
}

// ============================================
// Wikidata API
// ============================================

interface WikidataEntity {
  id: string;
  labels?: Record<string, { value: string }>;
  descriptions?: Record<string, { value: string }>;
  claims?: Record<string, Array<{
    mainsnak: {
      datavalue?: {
        value: unknown;
        type: string;
      };
    };
  }>>;
}

async function searchWikidata(foundryName: string): Promise<string | null> {
  try {
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(foundryName)}&language=en&format=json&type=item&limit=5`;

    const response = await fetch(searchUrl, {
      headers: { 'User-Agent': 'ThePunchBot/1.0 (https://thepunch.studio)' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const data = await response.json();

    // Look for type foundry or design studio matches
    for (const result of data.search || []) {
      const desc = (result.description || '').toLowerCase();
      if (desc.includes('type') || desc.includes('foundry') || desc.includes('font') || desc.includes('design')) {
        return result.id;
      }
    }

    // Fall back to first result if it contains the foundry name
    if (data.search?.[0]) {
      return data.search[0].id;
    }

    return null;
  } catch {
    return null;
  }
}

async function getWikidataEntity(entityId: string): Promise<WikidataEntity | null> {
  try {
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&format=json&props=labels|descriptions|claims`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'ThePunchBot/1.0 (https://thepunch.studio)' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.entities?.[entityId] || null;
  } catch {
    return null;
  }
}

function extractWikidataValue(claim: WikidataEntity['claims'], property: string): string | null {
  const values = claim?.[property];
  if (!values?.[0]?.mainsnak?.datavalue?.value) return null;

  const value = values[0].mainsnak.datavalue.value;

  // Handle different value types
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    // Time value (for dates)
    if ('time' in value) {
      const time = (value as { time: string }).time;
      // Extract year from "+1985-00-00T00:00:00Z" format
      const match = time.match(/([+-]?\d{4})/);
      return match ? match[1] : null;
    }
    // Entity reference
    if ('id' in value) {
      return (value as { id: string }).id;
    }
    // Quantity
    if ('amount' in value) {
      return (value as { amount: string }).amount;
    }
  }

  return null;
}

export async function fetchWikidata(foundryName: string): Promise<SourceData> {
  const result: SourceData = {
    source: 'Wikidata',
    url: 'https://www.wikidata.org',
    content: null,
  };

  try {
    const entityId = await searchWikidata(foundryName);
    if (!entityId) {
      result.error = 'Foundry not found on Wikidata';
      return result;
    }

    const entity = await getWikidataEntity(entityId);
    if (!entity) {
      result.error = 'Could not fetch Wikidata entity';
      return result;
    }

    result.url = `https://www.wikidata.org/wiki/${entityId}`;

    // Extract structured data
    // P571 = inception/founded date
    // P159 = headquarters location
    // P112 = founded by
    // P17 = country
    // P131 = located in administrative entity
    const structured: Record<string, unknown> = {
      wikidataId: entityId,
      label: entity.labels?.en?.value,
      description: entity.descriptions?.en?.value,
      founded: extractWikidataValue(entity.claims, 'P571'),
      foundedBy: extractWikidataValue(entity.claims, 'P112'),
      country: extractWikidataValue(entity.claims, 'P17'),
      location: extractWikidataValue(entity.claims, 'P131'),
    };

    result.structured = structured;

    // Build text content for LLM
    const parts: string[] = [`Wikidata entry for ${foundryName}:`];
    if (structured.label) parts.push(`Name: ${structured.label}`);
    if (structured.description) parts.push(`Description: ${structured.description}`);
    if (structured.founded) parts.push(`Founded: ${structured.founded}`);
    if (structured.foundedBy) parts.push(`Founded by: ${structured.foundedBy}`);

    result.content = parts.join('\n');

  } catch (err) {
    result.error = `Wikidata fetch failed: ${err}`;
  }

  return result;
}

// ============================================
// Fonts In Use
// ============================================

export async function fetchFontsInUse(foundryName: string): Promise<SourceData> {
  const result: SourceData = {
    source: 'Fonts In Use',
    url: 'https://fontsinuse.com',
    content: null,
  };

  try {
    // Search for the foundry
    const searchUrl = `https://fontsinuse.com/search?terms=${encodeURIComponent(foundryName)}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ThePunchBot/1.0; +https://thepunch.studio)',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      result.error = `HTTP ${response.status}`;
      return result;
    }

    const html = await response.text();

    // Extract text content
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 10000);

    if (text.length < 200) {
      result.error = 'No meaningful content found';
      return result;
    }

    result.url = searchUrl;
    result.content = `Fonts In Use search results for "${foundryName}":\n\n${text}`;

    // Try to extract typeface names mentioned
    const typefaceMatches = html.match(/class="[^"]*typeface[^"]*"[^>]*>([^<]+)</gi) || [];
    const typefaces = typefaceMatches
      .map(m => m.match(/>([^<]+)</)?.[1])
      .filter(Boolean);

    if (typefaces.length > 0) {
      result.structured = { typefaces: [...new Set(typefaces)] };
    }

  } catch (err) {
    result.error = `Fonts In Use fetch failed: ${err}`;
  }

  return result;
}

// ============================================
// MyFonts
// ============================================

export async function fetchMyFonts(foundryName: string): Promise<SourceData> {
  const result: SourceData = {
    source: 'MyFonts',
    url: 'https://www.myfonts.com',
    content: null,
  };

  try {
    // Search for the foundry
    const slug = foundryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const foundryUrl = `https://www.myfonts.com/foundry/${slug}`;

    let response = await fetch(foundryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ThePunchBot/1.0; +https://thepunch.studio)',
      },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    });

    // If direct URL fails, try search
    if (!response.ok) {
      const searchUrl = `https://www.myfonts.com/search?query=${encodeURIComponent(foundryName)}`;
      response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ThePunchBot/1.0; +https://thepunch.studio)',
        },
        signal: AbortSignal.timeout(15000),
      });
    }

    if (!response.ok) {
      result.error = `HTTP ${response.status}`;
      return result;
    }

    const html = await response.text();

    // Check if we actually found the foundry
    if (html.includes('No results found') || html.includes('did not match any')) {
      result.error = 'Foundry not found on MyFonts';
      return result;
    }

    // Extract text content
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 10000);

    if (text.length < 200) {
      result.error = 'No meaningful content found';
      return result;
    }

    result.url = response.url;
    result.content = `MyFonts page for "${foundryName}":\n\n${text}`;

  } catch (err) {
    result.error = `MyFonts fetch failed: ${err}`;
  }

  return result;
}

// ============================================
// Foundry Website (enhanced)
// ============================================

export async function fetchFoundryWebsite(url: string): Promise<SourceData> {
  const result: SourceData = {
    source: 'Foundry Website',
    url: url,
    content: null,
  };

  try {
    // Try multiple pages
    const pagesToTry = [
      `${url}/about`,
      `${url}/info`,
      `${url}/studio`,
      `${url}/about-us`,
      `${url}/team`,
      url,
    ];

    const contents: string[] = [];

    for (const pageUrl of pagesToTry) {
      try {
        const response = await fetch(pageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ThePunchBot/1.0; +https://thepunch.studio)',
          },
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const html = await response.text();
          const text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          if (text.length > 300) {
            contents.push(`--- Content from ${pageUrl} ---\n${text.substring(0, 8000)}`);
          }
        }
      } catch {
        continue;
      }

      // Limit to 3 successful pages
      if (contents.length >= 3) break;
    }

    if (contents.length === 0) {
      result.error = 'Could not fetch any content from website';
      return result;
    }

    result.content = contents.join('\n\n');

  } catch (err) {
    result.error = `Website fetch failed: ${err}`;
  }

  return result;
}

// ============================================
// Combined Multi-Source Fetch
// ============================================

export async function fetchAllSources(
  foundryName: string,
  websiteUrl: string,
  options: { includeMyFonts?: boolean; includeFontsInUse?: boolean; includeWikidata?: boolean } = {}
): Promise<MultiSourceResult> {
  const {
    includeMyFonts = true,
    includeFontsInUse = true,
    includeWikidata = true
  } = options;

  // Fetch all sources in parallel
  const promises: Promise<SourceData>[] = [
    fetchFoundryWebsite(websiteUrl),
  ];

  if (includeWikidata) {
    promises.push(fetchWikidata(foundryName));
  }

  if (includeFontsInUse) {
    promises.push(fetchFontsInUse(foundryName));
  }

  if (includeMyFonts) {
    promises.push(fetchMyFonts(foundryName));
  }

  const sources = await Promise.all(promises);

  // Build combined context for LLM
  const contextParts: string[] = [];

  for (const source of sources) {
    if (source.content) {
      contextParts.push(`\n## ${source.source} (${source.url})\n${source.content}`);
    } else if (source.error) {
      contextParts.push(`\n## ${source.source}\n[Not available: ${source.error}]`);
    }
  }

  return {
    foundryName,
    sources,
    combinedContext: contextParts.join('\n'),
  };
}
