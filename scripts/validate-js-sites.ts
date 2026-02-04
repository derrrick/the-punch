/**
 * Puppeteer-based Foundry Validation Script
 *
 * For JavaScript-heavy sites that can't be fetched with simple HTTP requests.
 * Uses Puppeteer to render pages and extract content.
 *
 * Usage:
 *   npx tsx scripts/validate-js-sites.ts --slug=foundry-slug
 *   npx tsx scripts/validate-js-sites.ts --slugs=slug1,slug2,slug3
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import puppeteer from 'puppeteer';
import * as fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

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
}

async function fetchWithPuppeteer(url: string): Promise<string | null> {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Try multiple pages
    const pagesToTry = [
      `${url}/about`,
      `${url}/info`,
      `${url}/studio`,
      url,
    ];

    const contents: string[] = [];

    for (const pageUrl of pagesToTry) {
      try {
        console.log(`  Fetching: ${pageUrl}`);
        await page.goto(pageUrl, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });

        // Wait a bit for any dynamic content
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Extract text content
        const text = await page.evaluate(() => {
          // Remove script and style elements
          const scripts = document.querySelectorAll('script, style, noscript');
          scripts.forEach(s => s.remove());

          // Get text content
          return document.body?.innerText || '';
        });

        if (text && text.length > 300) {
          contents.push(`--- Content from ${pageUrl} ---\n${text.substring(0, 10000)}`);
        }
      } catch (err) {
        console.log(`  Failed to fetch ${pageUrl}: ${err}`);
        continue;
      }

      // Limit to 2 successful pages
      if (contents.length >= 2) break;
    }

    await browser.close();

    if (contents.length === 0) {
      return null;
    }

    return contents.join('\n\n');
  } catch (error) {
    if (browser) await browser.close();
    console.error(`Puppeteer error for ${url}:`, error);
    return null;
  }
}

async function validateFoundry(foundry: Foundry): Promise<ValidationResult> {
  const result: ValidationResult = {
    slug: foundry.slug,
    name: foundry.name,
    url: foundry.url,
    issues: [],
    suggestions: {},
    verified: [],
  };

  console.log(`\nValidating: ${foundry.name} (${foundry.url})`);

  const websiteContent = await fetchWithPuppeteer(foundry.url);

  if (!websiteContent) {
    result.error = 'Could not fetch website content even with Puppeteer';
    return result;
  }

  console.log(`  Content fetched: ${websiteContent.length} chars`);

  const prompt = `You are a data validation assistant for a type foundry directory. I'll provide you with:
1. The current database record for a foundry
2. Content scraped from their website (rendered with a browser)

Your task is to identify any discrepancies or errors in our database.

## Current Database Record:
- Name: ${foundry.name}
- Location City: ${foundry.location_city}
- Location Country: ${foundry.location_country}
- Founder: ${foundry.founder}
- Founded: ${foundry.founded}
- Notable Typefaces (array): ${JSON.stringify(foundry.notable_typefaces)}
- Style Tags (array): ${JSON.stringify(foundry.style)}
- Notes: ${foundry.notes || 'None'}

## Website Content:
${websiteContent}

## Instructions:
Analyze the website content and identify:

1. **ISSUES**: Clear factual errors in our database

2. **SUGGESTIONS**: Improvements with confidence levels:
   - HIGH: Explicitly stated on website
   - MEDIUM: Strongly implied
   - LOW: Inferred

3. **VERIFIED**: Fields that appear correct

For array fields (notable_typefaces, style), return proper JSON arrays.

Respond in JSON format:
{
  "issues": ["list of errors"],
  "suggestions": {
    "field_name": {
      "current": <current value>,
      "suggested": <suggested value>,
      "confidence": "high|medium|low",
      "reasoning": "explanation"
    }
  },
  "verified": ["list of correct fields"]
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
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

async function main() {
  const args = process.argv.slice(2);
  const slugArg = args.find(a => a.startsWith('--slug='));
  const slugsArg = args.find(a => a.startsWith('--slugs='));

  let slugs: string[] = [];

  if (slugArg) {
    slugs = [slugArg.split('=')[1]];
  } else if (slugsArg) {
    slugs = slugsArg.split('=')[1].split(',');
  } else {
    console.error('Please provide --slug=foundry-slug or --slugs=slug1,slug2,slug3');
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('  Puppeteer-based Foundry Validation');
  console.log('========================================\n');
  console.log(`Validating ${slugs.length} foundries: ${slugs.join(', ')}\n`);

  const { data: foundries, error } = await supabase
    .from('foundries')
    .select('*')
    .in('slug', slugs);

  if (error || !foundries) {
    console.error('Failed to fetch foundries:', error);
    process.exit(1);
  }

  const results: ValidationResult[] = [];

  for (const foundry of foundries) {
    const result = await validateFoundry(foundry);
    results.push(result);

    if (result.error) {
      console.log(`  [ERROR] ${result.error}`);
    } else {
      if (result.issues.length > 0) {
        console.log(`  [ISSUES] ${result.issues.length} found`);
        result.issues.forEach(issue => console.log(`    - ${issue}`));
      }

      const suggestionKeys = Object.keys(result.suggestions);
      if (suggestionKeys.length > 0) {
        console.log(`  [SUGGESTIONS] ${suggestionKeys.length} found`);
        suggestionKeys.forEach(key => {
          const s = result.suggestions[key];
          console.log(`    - ${key}: "${s.current}" -> "${s.suggested}" (${s.confidence})`);
        });
      }

      if (result.verified.length > 0 && result.issues.length === 0 && suggestionKeys.length === 0) {
        console.log(`  [OK] All checked fields verified`);
      }
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Save results
  const reportPath = `./validation-puppeteer-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(reportPath, JSON.stringify({ results }, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);

  // Summary
  console.log('\n========================================');
  console.log('  Summary');
  console.log('========================================');
  const validated = results.filter(r => !r.error).length;
  const errors = results.filter(r => r.error).length;
  const totalSuggestions = results.reduce((acc, r) => acc + Object.keys(r.suggestions).length, 0);
  console.log(`Validated: ${validated}/${results.length}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total suggestions: ${totalSuggestions}`);
}

main().catch(console.error);
