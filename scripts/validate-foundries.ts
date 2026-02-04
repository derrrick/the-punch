/**
 * Foundry Data Validation Script
 *
 * Cross-references foundry data in the database with their actual websites
 * using an LLM to extract and compare information.
 *
 * Usage: npx tsx scripts/validate-foundries.ts [--slug=foundry-slug] [--all]
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

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
  founder: string;
  founded: number;
  notable_typefaces: string[];
  style: string[];
  notes: string | null;
}

interface ValidationResult {
  slug: string;
  name: string;
  url: string;
  issues: string[];
  suggestions: Record<string, { current: string; suggested: string; confidence: string }>;
  verified: string[];
  error?: string;
}

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

async function validateFoundry(foundry: Foundry): Promise<ValidationResult> {
  const result: ValidationResult = {
    slug: foundry.slug,
    name: foundry.name,
    url: foundry.url,
    issues: [],
    suggestions: {},
    verified: [],
  };

  const websiteContent = await fetchWebsiteContent(foundry.url);

  if (!websiteContent) {
    result.error = 'Could not fetch website content';
    return result;
  }

  const prompt = `You are a data validation assistant for a type foundry directory. I'll provide you with:
1. The current database record for a foundry
2. Content scraped from their website

Your task is to identify any discrepancies or errors in our database by comparing it with the actual website information.

## Current Database Record:
- Name: ${foundry.name}
- Location: ${foundry.location_city}, ${foundry.location_country}
- Founder: ${foundry.founder}
- Founded: ${foundry.founded}
- Notable Typefaces: ${foundry.notable_typefaces.join(', ')}
- Style Tags: ${foundry.style.join(', ')}
- Notes: ${foundry.notes || 'None'}

## Website Content:
${websiteContent}

## Instructions:
Analyze the website content and compare it to our database record. Report:

1. **ISSUES**: Clear factual errors in our database (wrong city, wrong founder name, typefaces that don't belong to this foundry, etc.)

2. **SUGGESTIONS**: Improvements with your confidence level:
   - Founder name spelling/format
   - Location accuracy
   - Founded year
   - Missing notable typefaces that should be included
   - Style tags that should be added or removed

3. **VERIFIED**: Which fields appear to be correct based on the website

Respond in this exact JSON format:
{
  "issues": ["list of clear errors that need fixing"],
  "suggestions": {
    "field_name": {
      "current": "current value",
      "suggested": "suggested value",
      "confidence": "high|medium|low"
    }
  },
  "verified": ["list of fields that appear correct"]
}

Only include fields in suggestions if you have actual evidence from the website. Don't guess.`;

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

async function main() {
  const args = process.argv.slice(2);
  const slugArg = args.find(a => a.startsWith('--slug='));
  const validateAll = args.includes('--all');
  const limit = args.find(a => a.startsWith('--limit='));
  const limitNum = limit ? parseInt(limit.split('=')[1]) : 5;

  console.log('\n========================================');
  console.log('  Foundry Data Validation Report');
  console.log('========================================\n');

  let query = supabase
    .from('foundries')
    .select('id, name, slug, url, location_city, location_country, founder, founded, notable_typefaces, style, notes');

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

  console.log(`Found ${foundries.length} foundries to validate.\n`);

  const results: ValidationResult[] = [];
  let issueCount = 0;
  let suggestionCount = 0;

  for (const foundry of foundries) {
    console.log(`Checking: ${foundry.name} (${foundry.url})...`);

    const result = await validateFoundry(foundry);
    results.push(result);

    if (result.error) {
      console.log(`  [ERROR] ${result.error}`);
    } else {
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
    console.log('');

    // Rate limiting - wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('========================================');
  console.log('  Summary');
  console.log('========================================');
  console.log(`Foundries checked: ${foundries.length}`);
  console.log(`Total issues found: ${issueCount}`);
  console.log(`Total suggestions: ${suggestionCount}`);

  // Output detailed JSON report
  const reportPath = `./validation-report-${new Date().toISOString().split('T')[0]}.json`;
  const fs = await import('fs');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nDetailed report saved to: ${reportPath}`);
}

main().catch(console.error);
