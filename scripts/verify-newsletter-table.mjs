import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyTable() {
  console.log('🔍 Checking newsletter_subscribers table...\n');

  const { data, error, count } = await supabase
    .from('newsletter_subscribers')
    .select('*', { count: 'exact' })
    .limit(0);

  if (error) {
    if (error.code === '42P01') {
      console.log('❌ Table does NOT exist yet.');
      console.log('\nPlease run the migration SQL in Supabase SQL Editor:');
      console.log('1. Visit: https://supabase.com/dashboard/project/kfchwbwiqjykontpstgz/sql/new');
      console.log('2. Copy SQL from: supabase/migrations/004_newsletter_subscribers.sql');
      console.log('3. Paste and run\n');
    } else {
      console.log('❌ Error checking table:', error.message);
    }
    process.exit(1);
  } else {
    console.log('✅ Table exists!');
    console.log(`📊 Current subscriber count: ${count || 0}`);
  }
}

verifyTable();
