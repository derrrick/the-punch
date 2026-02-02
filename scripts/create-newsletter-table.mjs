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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createNewsletterTable() {
  console.log('🚀 Creating newsletter_subscribers table...\n');

  // Read the migration SQL file
  const sqlPath = join(__dirname, '..', 'supabase', 'migrations', '004_newsletter_subscribers.sql');
  const sql = readFileSync(sqlPath, 'utf8');

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql doesn't exist, try direct approach by breaking down the SQL
      console.log('Trying alternative approach...\n');

      // Create the table
      const { error: createError } = await supabase.from('newsletter_subscribers').select('*').limit(0);

      if (createError && createError.code === '42P01') {
        // Table doesn't exist, need to create it via SQL
        console.log('⚠️  Cannot create table directly via Supabase client.');
        console.log('Please run the following SQL in your Supabase SQL Editor:\n');
        console.log('Dashboard → SQL Editor → New Query\n');
        console.log(sql);
        console.log('\nOr visit: https://supabase.com/dashboard/project/kfchwbwiqjykontpstgz/sql/new');
        process.exit(1);
      } else {
        console.log('✅ Table already exists!');
      }
    } else {
      console.log('✅ Newsletter subscribers table created successfully!');
    }
  } catch (err) {
    console.log('⚠️  Cannot execute raw SQL via Supabase client.');
    console.log('Please run the migration manually in your Supabase SQL Editor:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/kfchwbwiqjykontpstgz/sql/new');
    console.log('2. Copy and paste the SQL from: supabase/migrations/004_newsletter_subscribers.sql');
    console.log('3. Click "Run"\n');
    console.log('Migration file location:');
    console.log(sqlPath);
  }
}

createNewsletterTable().catch((error) => {
  console.error('💥 Failed:', error);
  process.exit(1);
});
