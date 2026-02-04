/**
 * Foundry Data Validation Script
 *
 * Cross-references foundry data against multiple sources:
 * - Foundry's own website (primary)
 * - Wikidata (structured facts)
 * - Fonts In Use (typeface attribution)
 * - MyFonts (font catalog)
 *
 * Usage:
 *   npx tsx scripts/validate-foundries.ts [options]
 *
 * Options:
 *   --slug=foundry-slug   Validate a specific foundry
 *   --all                 Validate all foundries
 *   --limit=N             Limit to first N foundries (default: 5)
 *   --resume              Resume from last interrupted run
 *   --website-only        Only use foundry website (skip external sources)
 *   --no-myfonts          Skip MyFonts lookup
 *   --no-wikidata         Skip Wikidata lookup
 *   --no-fontsinuse       Skip Fonts In Use lookup
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { fetchAllSources, fetchFoundryWebsite, type MultiSourceResult } from './lib/sources';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// State file for resume capability
const STATE_FILE = './validation-state.json';

interface Foundry {
  id: string;
  name: string;
  slug: string;
  url: string;
  location_city: string;
  location_country: string;
  location_country_code: string;
  founder: string;
  founded: number;
  notable_typefaces: string[];
  style: string[];
  notes: string | null;
}

interface Suggestion {
  current: string | number | string[];
  suggested: string | number | string[];
  confidence: 'high' | 'medium' | 'low';
  reasoning?: string;
}

interface ValidationResult {
  slug: string;
  name: string;
  url: string;
  issues: string[];
  suggestions: Record<string, Suggestion>;
  verified: string[];
  error?: string;
  validatedAt: string;
}

interface AutoFixItem {
  slug: string;
  field: string;
  currentValue: unknown;
  newValue: unknown;
  confidence: 'high';
  reasoning: string;
}

interface CleanupReport {
  meta: {
    generatedAt: string;
    totalFoundries: number;
    validated: number;
    errors: number;
    duration: number;
  };
  summary: {
    highConfidenceFixes: number;
    mediumConfidenceFixes: number;
    lowConfidenceFixes: number;
  };
  results: ValidationResult[];
  autoFixPlan: AutoFixItem[];
}

interface ValidationState {
  lastProcessedIndex: number;
  completedSlugs: string[];
  failedSlugs: string[];
  results: ValidationResult[];
  startedAt: string;
}

// Progress bar utility
function renderProgress(current: number, total: number, startTime: number): string {
  const percent = Math.round((current / total) * 100);
  const barLength = 30;
  const filled = Math.round((current / total) * barLength);
  const empty = barLength - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  const elapsed = (Date.now() - startTime) / 1000;
  const perItem = current > 0 ? elapsed / current : 0;
  const remaining = Math.round((total - current) * perItem);
  const eta = remaining > 0 ? `ETA: ${Math.floor(remaining / 60)}m ${remaining % 60}s` : '';

  return `[${bar}] ${current}/${total} (${percent}%) ${eta}`;
}

// Load state for resume capability
function loadState(): ValidationState | null {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch {
    console.log('Could not load previous state, starting fresh.');
  }
  return null;
}

// Save state for resume capability
function saveState(state: ValidationState): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Clear state file
function clearState(): void {
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
  }
}

// Prefetch queue for website content
const prefetchCache = new Map<string, Promise<string | null>>();

async function fetchWebsiteContent(url: string): Promise<string | null> {
  try {
    // Try the about page first, then fall back to homepage
    const aboutUrls = [
      `${url}/about`,
      `${url}/info`,
      `${url}/studio`,
      url,
    ];

    for (const aboutUrl of aboutUrls) {
      try {
        const response = await fetch(aboutUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ThePunchBot/1.0; +https://thepunch.studio)',
          },
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const html = await response.text();
          // Basic HTML to text conversion
          const text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 15000); // Limit to ~15k chars

          if (text.length > 500) {
            return `Source: ${aboutUrl}\n\n${text}`;
          }
        }
      } catch {
        continue;
      }
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    return null;
  }
}

// Prefetch next N websites while processing current one
function prefetchWebsites(foundries: Foundry[], currentIndex: number, count: number = 3): void {
  for (let i = 1; i <= count; i++) {
    const nextIndex = currentIndex + i;
    if (nextIndex < foundries.length) {
      const url = foundries[nextIndex].url;
      if (!prefetchCache.has(url)) {
        prefetchCache.set(url, fetchWebsiteContent(url));
      }
    }
  }
}

// Get cached or fetch website content
async function getWebsiteContent(url: string): Promise<string | null> {
  if (prefetchCache.has(url)) {
    const result = await prefetchCache.get(url);
    prefetchCache.delete(url);
    return result ?? null;
  }
  return fetchWebsiteContent(url);
}

interface ValidateOptions {
  websiteOnly?: boolean;
  includeMyFonts?: boolean;
  includeFontsInUse?: boolean;
  includeWikidata?: boolean;
}

async function validateFoundry(foundry: Foundry, options: ValidateOptions = {}): Promise<ValidationResult> {
  const result: ValidationResult = {
    slug: foundry.slug,
    name: foundry.name,
    url: foundry.url,
    issues: [],
    suggestions: {},
    verified: [],
    validatedAt: new Date().toISOString(),
  };

  let sourceContext: string;
  let sourceSummary: string;

  if (options.websiteOnly) {
    // Legacy single-source mode
    const websiteData = await fetchFoundryWebsite(foundry.url);
    if (!websiteData.content) {
      result.error = 'Could not fetch website content';
      return result;
    }
    sourceContext = websiteData.content;
    sourceSummary = 'Foundry website only';
  } else {
    // Multi-source mode
    const multiSource = await fetchAllSources(foundry.name, foundry.url, {
      includeMyFonts: options.includeMyFonts ?? true,
      includeFontsInUse: options.includeFontsInUse ?? true,
      includeWikidata: options.includeWikidata ?? true,
    });

    // Check if we have at least the foundry website
    const websiteSource = multiSource.sources.find(s => s.source === 'Foundry Website');
    if (!websiteSource?.content) {
      result.error = 'Could not fetch foundry website content';
      return result;
    }

    sourceContext = multiSource.combinedContext;

    // Build summary of available sources
    const availableSources = multiSource.sources
      .filter(s => s.content)
      .map(s => s.source);
    const unavailableSources = multiSource.sources
      .filter(s => !s.content)
      .map(s => `${s.source} (${s.error})`);

    sourceSummary = `Available: ${availableSources.join(', ')}${unavailableSources.length > 0 ? `. Unavailable: ${unavailableSources.join(', ')}` : ''}`;
  }

  const prompt = `You are a data validation assistant for a type foundry directory. I'll provide you with:
1. The current database record for a foundry
2. Content gathered from MULTIPLE sources (foundry website, Fonts In Use, MyFonts, Wikidata)

Your task is to cross-reference these sources and identify discrepancies or errors in our database.

## Current Database Record:
- Name: ${foundry.name}
- Location City: ${foundry.location_city}
- Location Country: ${foundry.location_country}
- Founder: ${foundry.founder}
- Founded: ${foundry.founded}
- Notable Typefaces (array): ${JSON.stringify(foundry.notable_typefaces)}
- Style Tags (array): ${JSON.stringify(foundry.style)}
- Notes: ${foundry.notes || 'None'}

## Source Data:
${sourceContext}

## Instructions:
Cross-reference all available sources and compare to our database record.

1. **ISSUES**: Clear factual errors where MULTIPLE sources disagree with our database, or where a single authoritative source (like the foundry's own website) clearly contradicts our data.

2. **SUGGESTIONS**: Improvements with confidence levels. IMPORTANT:
   - For **notable_typefaces**: Only suggest changes if Fonts In Use or the foundry website confirms the typeface belongs to this foundry. Don't remove typefaces just because they're not mentioned - only if there's evidence they belong to a DIFFERENT foundry.
   - For factual data (founded, location, founder): Prefer data that appears in multiple sources.
   - For **notes**: Enrich with additional context, but DON'T remove existing accurate information.

   Confidence levels:
   - HIGH: Confirmed by 2+ sources, OR explicitly stated on foundry's official website
   - MEDIUM: Mentioned in one source with supporting context
   - LOW: Inferred or uncertain

3. **VERIFIED**: Fields that match across sources

IMPORTANT RULES:
- For array fields (notable_typefaces, style), values MUST be JSON arrays, not strings
- For notable_typefaces: ADD typefaces you find evidence for, only REMOVE if there's proof they're misattributed
- Preserve existing accurate data - don't replace good information with less complete information
- When sources conflict, note the conflict in reasoning

Respond in this exact JSON format:
{
  "issues": ["list of clear errors that need fixing"],
  "suggestions": {
    "field_name": {
      "current": <current value - use proper type: string, number, or array>,
      "suggested": <suggested value - use proper type: string, number, or array>,
      "confidence": "high|medium|low",
      "reasoning": "which sources support this change"
    }
  },
  "verified": ["list of fields confirmed by sources"]
}

Example for adding typefaces (don't remove without evidence):
"notable_typefaces": {
  "current": ["Font A", "Font B"],
  "suggested": ["Font A", "Font B", "Font C"],
  "confidence": "high",
  "reasoning": "Fonts In Use shows Font C is from this foundry. Keeping existing fonts as no evidence they're incorrect."
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      // Extract JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        result.issues = parsed.issues || [];
        result.suggestions = parsed.suggestions || {};
        result.verified = parsed.verified || [];
      }
    }
  } catch (error) {
    result.error = `LLM analysis failed: ${error}`;
  }

  return result;
}

// Convert suggestions to auto-fix items (only high confidence)
function generateAutoFixPlan(results: ValidationResult[]): AutoFixItem[] {
  const autoFixes: AutoFixItem[] = [];

  for (const result of results) {
    if (result.error) continue;

    for (const [field, suggestion] of Object.entries(result.suggestions)) {
      if (suggestion.confidence === 'high') {
        autoFixes.push({
          slug: result.slug,
          field: field,
          currentValue: suggestion.current,
          newValue: suggestion.suggested,
          confidence: 'high',
          reasoning: suggestion.reasoning || 'High confidence match from website',
        });
      }
    }
  }

  return autoFixes;
}

// Count suggestions by confidence level
function countByConfidence(results: ValidationResult[]): { high: number; medium: number; low: number } {
  const counts = { high: 0, medium: 0, low: 0 };

  for (const result of results) {
    for (const suggestion of Object.values(result.suggestions)) {
      counts[suggestion.confidence]++;
    }
  }

  return counts;
}

async function main() {
  const args = process.argv.slice(2);
  const slugArg = args.find(a => a.startsWith('--slug='));
  const validateAll = args.includes('--all');
  const limit = args.find(a => a.startsWith('--limit='));
  const limitNum = limit ? parseInt(limit.split('=')[1]) : 5;
  const shouldResume = args.includes('--resume');
  const noPrefetch = args.includes('--no-prefetch');

  // Source options
  const websiteOnly = args.includes('--website-only');
  const includeMyFonts = !args.includes('--no-myfonts');
  const includeFontsInUse = !args.includes('--no-fontsinuse');
  const includeWikidata = !args.includes('--no-wikidata');

  const validateOptions: ValidateOptions = {
    websiteOnly,
    includeMyFonts,
    includeFontsInUse,
    includeWikidata,
  };

  console.log('\n========================================');
  console.log('  Foundry Data Validation Report');
  console.log('  (Multi-Source Cross-Reference)');
  console.log('========================================\n');

  // Show which sources are enabled
  if (websiteOnly) {
    console.log('Sources: Foundry website only\n');
  } else {
    const sources = ['Foundry Website'];
    if (includeWikidata) sources.push('Wikidata');
    if (includeFontsInUse) sources.push('Fonts In Use');
    if (includeMyFonts) sources.push('MyFonts');
    console.log(`Sources: ${sources.join(', ')}\n`);
  }

  // Load previous state if resuming
  let state: ValidationState | null = null;
  if (shouldResume) {
    state = loadState();
    if (state) {
      console.log(`Resuming from index ${state.lastProcessedIndex + 1}...`);
      console.log(`Previously completed: ${state.completedSlugs.length} foundries`);
      console.log(`Previously failed: ${state.failedSlugs.length} foundries\n`);
    } else {
      console.log('No previous state found, starting fresh.\n');
    }
  }

  let query = supabase
    .from('foundries')
    .select('id, name, slug, url, location_city, location_country, location_country_code, founder, founded, notable_typefaces, style, notes')
    .order('name');

  if (slugArg) {
    const slug = slugArg.split('=')[1];
    query = query.eq('slug', slug);
  } else if (!validateAll) {
    query = query.limit(limitNum);
    console.log(`Validating first ${limitNum} foundries. Use --all to validate all, or --slug=foundry-slug for a specific one.\n`);
  }

  const { data: foundries, error } = await query;

  if (error) {
    console.error('Failed to fetch foundries:', error);
    process.exit(1);
  }

  if (!foundries || foundries.length === 0) {
    console.log('No foundries found to validate.');
    process.exit(0);
  }

  const totalFoundries = foundries.length;
  console.log(`Found ${totalFoundries} foundries to validate.\n`);

  // Initialize or resume state
  const startTime = Date.now();
  const startIndex = state?.lastProcessedIndex !== undefined ? state.lastProcessedIndex + 1 : 0;
  const results: ValidationResult[] = state?.results || [];
  const completedSlugs: string[] = state?.completedSlugs || [];
  const failedSlugs: string[] = state?.failedSlugs || [];

  let issueCount = 0;
  let suggestionCount = 0;

  for (let i = startIndex; i < foundries.length; i++) {
    const foundry = foundries[i];

    // Prefetch next websites (unless disabled)
    if (!noPrefetch) {
      prefetchWebsites(foundries, i);
    }

    // Show progress
    process.stdout.write(`\r${renderProgress(i + 1, totalFoundries, startTime)}  `);
    console.log(`\nChecking: ${foundry.name} (${foundry.url})...`);

    const result = await validateFoundry(foundry, validateOptions);
    results.push(result);

    if (result.error) {
      console.log(`  [ERROR] ${result.error}`);
      failedSlugs.push(foundry.slug);
    } else {
      completedSlugs.push(foundry.slug);

      if (result.issues.length > 0) {
        console.log(`  [ISSUES] ${result.issues.length} found`);
        result.issues.forEach(issue => console.log(`    - ${issue}`));
        issueCount += result.issues.length;
      }

      const suggestionKeys = Object.keys(result.suggestions);
      if (suggestionKeys.length > 0) {
        console.log(`  [SUGGESTIONS] ${suggestionKeys.length} found`);
        suggestionKeys.forEach(key => {
          const s = result.suggestions[key];
          console.log(`    - ${key}: "${s.current}" -> "${s.suggested}" (${s.confidence})`);
        });
        suggestionCount += suggestionKeys.length;
      }

      if (result.verified.length > 0 && result.issues.length === 0 && suggestionKeys.length === 0) {
        console.log(`  [OK] All checked fields verified`);
      }
    }

    // Save state after each foundry (for resume capability)
    saveState({
      lastProcessedIndex: i,
      completedSlugs,
      failedSlugs,
      results,
      startedAt: state?.startedAt || new Date().toISOString(),
    });

    // Rate limiting - wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const duration = (Date.now() - startTime) / 1000;

  // Generate auto-fix plan
  const autoFixPlan = generateAutoFixPlan(results);
  const confidenceCounts = countByConfidence(results);

  // Build full report
  const report: CleanupReport = {
    meta: {
      generatedAt: new Date().toISOString(),
      totalFoundries,
      validated: completedSlugs.length,
      errors: failedSlugs.length,
      duration: Math.round(duration),
    },
    summary: {
      highConfidenceFixes: confidenceCounts.high,
      mediumConfidenceFixes: confidenceCounts.medium,
      lowConfidenceFixes: confidenceCounts.low,
    },
    results,
    autoFixPlan,
  };

  // Summary
  console.log('\n========================================');
  console.log('  Summary');
  console.log('========================================');
  console.log(`Foundries validated: ${completedSlugs.length}/${totalFoundries}`);
  console.log(`Fetch errors: ${failedSlugs.length}`);
  console.log(`Total issues found: ${issueCount}`);
  console.log(`Total suggestions: ${suggestionCount}`);
  console.log(`  - High confidence: ${confidenceCounts.high}`);
  console.log(`  - Medium confidence: ${confidenceCounts.medium}`);
  console.log(`  - Low confidence: ${confidenceCounts.low}`);
  console.log(`Auto-fix items ready: ${autoFixPlan.length}`);
  console.log(`Duration: ${Math.floor(duration / 60)}m ${Math.round(duration % 60)}s`);

  // Output detailed JSON report
  const reportPath = `./validation-report-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nDetailed report saved to: ${reportPath}`);

  if (autoFixPlan.length > 0) {
    console.log(`\nTo apply high-confidence fixes, run:`);
    console.log(`  npm run apply-fixes -- --report=${path.basename(reportPath)}`);
  }

  // Clear state file on successful completion
  clearState();
}

main().catch(console.error);
