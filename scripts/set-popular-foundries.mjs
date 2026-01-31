import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Popular foundries specified by user (tier 1)
const popularFoundries = [
  'Grilli Type',
  'Klim Type Foundry',
  'MCKL',
  'OH no Type Company',
  'Fontwerk',
  'General Type Studio',
  'Optimo',
  'TypeMates',
  'Camelot Typefaces',
  'Extraset',
  'Florian Karsten'
];

async function setPopularFoundries() {
  console.log('🌟 Setting popular foundries (tier 1)...\n');

  let updated = 0;
  let notFound = [];

  for (const foundryName of popularFoundries) {
    // Try to find the foundry by name (case-insensitive partial match)
    const { data: foundries, error: searchError } = await supabase
      .from('foundries')
      .select('id, name, slug, tier')
      .ilike('name', `%${foundryName}%`);

    if (searchError) {
      console.error(`❌ Error searching for "${foundryName}":`, searchError.message);
      continue;
    }

    if (!foundries || foundries.length === 0) {
      console.log(`⚠️  Not found: "${foundryName}"`);
      notFound.push(foundryName);
      continue;
    }

    // If multiple matches, show them
    if (foundries.length > 1) {
      console.log(`🔍 Multiple matches for "${foundryName}":`);
      foundries.forEach(f => console.log(`   - ${f.name} (slug: ${f.slug})`));
    }

    // Update the first match (or exact match if found)
    const foundry = foundries.find(f =>
      f.name.toLowerCase() === foundryName.toLowerCase()
    ) || foundries[0];

    const { error: updateError } = await supabase
      .from('foundries')
      .update({ tier: 1 })
      .eq('id', foundry.id);

    if (updateError) {
      console.error(`❌ Error updating ${foundry.name}:`, updateError.message);
    } else {
      console.log(`✅ Set tier 1: ${foundry.name} (was tier ${foundry.tier})`);
      updated++;
    }
  }

  console.log('\n📈 Summary:');
  console.log(`   ✅ Updated: ${updated}/${popularFoundries.length}`);

  if (notFound.length > 0) {
    console.log(`   ⚠️  Not found (${notFound.length}):`);
    notFound.forEach(name => console.log(`      - ${name}`));
    console.log('\n💡 Tip: Check the exact foundry names in your database');
  }

  console.log('\n🎉 Done! Popular foundries are now tier 1.');
  console.log('🔗 Visit /?sort=popular to see them sorted first.');
}

setPopularFoundries().catch((error) => {
  console.error('💥 Failed:', error);
  process.exit(1);
});
