import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const searchTerm = process.argv[2] || 'OH no';

async function findFoundry() {
  console.log(`🔍 Searching for foundries matching "${searchTerm}"...\n`);

  const { data: foundries, error } = await supabase
    .from('foundries')
    .select('id, name, slug, tier')
    .ilike('name', `%${searchTerm}%`);

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  if (!foundries || foundries.length === 0) {
    console.log('❌ No foundries found');
    console.log('\n💡 Try a different search term');
    process.exit(0);
  }

  console.log(`✅ Found ${foundries.length} foundry(ies):\n`);
  foundries.forEach(f => {
    console.log(`   📍 ${f.name}`);
    console.log(`      Slug: ${f.slug}`);
    console.log(`      Tier: ${f.tier}\n`);
  });
}

findFoundry();
