import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateFoundries() {
  console.log('🚀 Starting foundry migration from JSON to Supabase...\n');

  // Read the JSON file
  const jsonPath = join(__dirname, '..', 'src', 'data', 'foundries.json');
  const jsonData = JSON.parse(readFileSync(jsonPath, 'utf8'));

  console.log(`📊 Found ${jsonData.foundries.length} foundries in JSON file\n`);

  // Check if any foundries already exist
  const { data: existing, error: checkError } = await supabase
    .from('foundries')
    .select('slug');

  if (checkError) {
    console.error('❌ Error checking existing foundries:', checkError);
    process.exit(1);
  }

  if (existing && existing.length > 0) {
    console.log(`⚠️  Found ${existing.length} existing foundries in database`);
    console.log('This script will skip duplicates based on slug\n');
  }

  const existingSlugs = new Set((existing || []).map(f => f.slug));

  // Transform and insert foundries
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const foundry of jsonData.foundries) {
    if (existingSlugs.has(foundry.slug)) {
      console.log(`⏭️  Skipping ${foundry.name} (already exists)`);
      skipped++;
      continue;
    }

    // Transform the foundry data to match database schema
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
      social_instagram: foundry.socialMedia?.instagram || null,
      social_twitter: foundry.socialMedia?.twitter || null,
      notes: foundry.notes || null,
      screenshot_url: foundry.images?.screenshot || null,
      logo_url: foundry.images?.logo || null,
      content_feed_type: foundry.contentFeed?.type || null,
      content_feed_url: foundry.contentFeed?.url || null,
      content_feed_rss: foundry.contentFeed?.rss || null,
      content_feed_frequency: foundry.contentFeed?.frequency || null,
    };

    const { error } = await supabase
      .from('foundries')
      .insert([dbFoundry]);

    if (error) {
      console.error(`❌ Error inserting ${foundry.name}:`, error.message);
      errors++;
    } else {
      console.log(`✅ Inserted ${foundry.name}`);
      inserted++;
    }
  }

  console.log('\n📈 Migration Summary:');
  console.log(`   ✅ Inserted: ${inserted}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📊 Total: ${jsonData.foundries.length}`);

  if (errors === 0) {
    console.log('\n🎉 Migration completed successfully!');
  } else {
    console.log('\n⚠️  Migration completed with errors');
    process.exit(1);
  }
}

migrateFoundries().catch((error) => {
  console.error('💥 Migration failed:', error);
  process.exit(1);
});
