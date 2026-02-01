import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function insertFoundries() {
  // Read the JSON file
  const jsonPath = process.argv[2] || '/Users/boss/Desktop/new-foundry-submissions.json';
  const data = JSON.parse(readFileSync(jsonPath, 'utf-8'));

  console.log(`Found ${data.foundries.length} foundries to insert\n`);

  let inserted = 0;
  let skipped = 0;

  for (const foundry of data.foundries) {
    // Check if foundry already exists
    const { data: existing } = await supabase
      .from('foundries')
      .select('id, name')
      .eq('slug', foundry.slug)
      .single();

    if (existing) {
      // Check if existing entry needs updating (has incomplete data)
      const { data: full } = await supabase
        .from('foundries')
        .select('*')
        .eq('slug', foundry.slug)
        .single();

      const needsUpdate =
        full.founder === 'Unknown' ||
        full.founded === new Date().getFullYear() ||
        (full.notable_typefaces || []).length === 0 ||
        (full.style || []).length === 0;

      if (needsUpdate) {
        console.log(`UPDATE: ${foundry.name} (existing entry has incomplete data)`);

        const updateData = {
          founder: foundry.founder,
          founded: foundry.founded,
          notable_typefaces: foundry.notableTypefaces || [],
          style: foundry.style || [],
          tier: foundry.tier,
          notes: foundry.notes || full.notes,
          location_city: foundry.location.city,
          location_country: foundry.location.country,
          location_country_code: foundry.location.countryCode,
          content_feed_type: foundry.contentFeed?.type || null,
          content_feed_url: foundry.contentFeed?.url || null,
          content_feed_rss: foundry.contentFeed?.rss || null,
          content_feed_frequency: foundry.contentFeed?.frequency || null,
          social_instagram: foundry.socialMedia?.instagram || full.social_instagram,
          social_twitter: foundry.socialMedia?.twitter || full.social_twitter,
        };

        const { error: updateError } = await supabase
          .from('foundries')
          .update(updateData)
          .eq('id', full.id);

        if (updateError) {
          console.error(`  ERROR updating: ${updateError.message}`);
        } else {
          console.log(`  Updated fields: founder, founded, typefaces, style, tier, notes`);
          inserted++;
        }
      } else {
        console.log(`SKIP: ${foundry.name} (already complete)`);
      }
      skipped++;
      continue;
    }

    // Transform to database schema
    const dbFoundry = {
      name: foundry.name,
      slug: foundry.slug,
      location_city: foundry.location.city,
      location_country: foundry.location.country,
      location_country_code: foundry.location.countryCode,
      url: foundry.url,
      content_feed_type: foundry.contentFeed?.type || null,
      content_feed_url: foundry.contentFeed?.url || null,
      content_feed_rss: foundry.contentFeed?.rss || null,
      content_feed_frequency: foundry.contentFeed?.frequency || null,
      founder: foundry.founder,
      founded: foundry.founded,
      notable_typefaces: foundry.notableTypefaces || [],
      style: foundry.style || [],
      tier: foundry.tier,
      social_instagram: foundry.socialMedia?.instagram || null,
      social_twitter: foundry.socialMedia?.twitter || null,
      notes: foundry.notes || null,
      screenshot_url: foundry.images?.screenshot || null,
      logo_url: foundry.images?.logo || null,
    };

    const { error } = await supabase
      .from('foundries')
      .insert([dbFoundry]);

    if (error) {
      console.error(`ERROR: ${foundry.name} - ${error.message}`);
    } else {
      console.log(`INSERTED: ${foundry.name}`);
      inserted++;
    }
  }

  console.log(`\nDone! Inserted: ${inserted}, Skipped: ${skipped}`);
}

insertFoundries().catch(console.error);
