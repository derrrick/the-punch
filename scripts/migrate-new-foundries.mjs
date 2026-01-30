#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Load new foundries JSON
const jsonPath = join(dirname(__dirname), 'new-foundries-to-add.json');
const newFoundries = JSON.parse(readFileSync(jsonPath, 'utf8'));

console.log(`📁 Loaded ${newFoundries.length} foundries from new-foundries-to-add.json\n`);

async function migrateFoundries() {
  let inserted = 0;
  let skipped = 0;
  const insertedFoundries = [];

  for (const foundry of newFoundries) {
    // Check if foundry already exists by slug
    const { data: existing } = await supabase
      .from('foundries')
      .select('id, slug')
      .eq('slug', foundry.slug)
      .maybeSingle();

    if (existing) {
      console.log(`⏭️  Skipped: ${foundry.name} (already exists)`);
      skipped++;
      continue;
    }

    // Transform JSON structure to database schema
    // Note: We don't set 'id' - let database auto-generate UUID
    const dbFoundry = {
      name: foundry.name,
      slug: foundry.slug,
      location_city: foundry.location.city,
      location_country: foundry.location.country,
      location_country_code: foundry.location.countryCode,
      url: foundry.url,
      founder: foundry.founder,
      founded: foundry.founded,
      notable_typefaces: foundry.notableTypefaces,
      style: foundry.style,
      tier: foundry.tier,
      social_instagram: foundry.socialMedia.instagram || null,
      social_twitter: foundry.socialMedia.twitter || null,
      notes: foundry.notes || null,
      screenshot_url: foundry.images.screenshot || null,
      logo_url: foundry.images.logo || null,
      content_feed_type: foundry.contentFeed.type || null,
      content_feed_url: foundry.contentFeed.url || null,
      content_feed_rss: foundry.contentFeed.rss || null,
      content_feed_frequency: foundry.contentFeed.frequency || null,
    };

    // Insert into database
    const { data, error } = await supabase
      .from('foundries')
      .insert([dbFoundry])
      .select('id, name, url, slug')
      .single();

    if (error) {
      console.error(`❌ Error inserting ${foundry.name}:`, error.message);
      continue;
    }

    console.log(`✅ Inserted: ${foundry.name}`);
    inserted++;
    insertedFoundries.push(data);
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   ✅ Inserted: ${inserted}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📝 Total: ${newFoundries.length}`);

  return insertedFoundries;
}

// Run migration
console.log('🚀 Starting migration...\n');
const insertedFoundries = await migrateFoundries();

// Save list of newly inserted foundries for screenshot script
if (insertedFoundries.length > 0) {
  const outputPath = join(__dirname, 'newly-inserted-foundries.json');
  const fs = await import('fs/promises');
  await fs.writeFile(outputPath, JSON.stringify(insertedFoundries, null, 2));
  console.log(`\n💾 Saved newly inserted foundries to: ${outputPath}`);
  console.log(`   Use this file to run screenshots on only new foundries.`);
}

console.log('\n✨ Migration complete!');
