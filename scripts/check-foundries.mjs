#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Check total count
const { data, error, count } = await supabase
  .from('foundries')
  .select('*', { count: 'exact' });

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

console.log(`\n📊 Total foundries in database: ${count}`);

// Check for some of the new ones
const newFoundryNames = ['HvD Fonts', 'TypeTogether', 'Village', 'Font Bureau', 'TypeType'];
console.log('\n🔍 Checking for newly added foundries:');

for (const name of newFoundryNames) {
  const { data: foundry } = await supabase
    .from('foundries')
    .select('name, slug, screenshot_url')
    .eq('name', name)
    .single();

  if (foundry) {
    const hasScreenshot = foundry.screenshot_url ? '✅ Has screenshot' : '❌ No screenshot';
    console.log(`  ✅ ${foundry.name} (${foundry.slug}) - ${hasScreenshot}`);
  } else {
    console.log(`  ❌ ${name} - NOT FOUND`);
  }
}

console.log('\n');
