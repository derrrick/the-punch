-- Create foundry_submissions table
CREATE TABLE IF NOT EXISTS foundry_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  foundry_name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  location TEXT,
  submitter_email TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT,
  rejection_reason TEXT
);

-- Create foundries table (for when we migrate from JSON)
CREATE TABLE IF NOT EXISTS foundries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  location_city TEXT NOT NULL,
  location_country TEXT NOT NULL,
  location_country_code TEXT NOT NULL,
  url TEXT NOT NULL,
  founder TEXT NOT NULL,
  founded INTEGER NOT NULL,
  notable_typefaces TEXT[] NOT NULL DEFAULT '{}',
  style TEXT[] NOT NULL DEFAULT '{}',
  tier INTEGER NOT NULL DEFAULT 3,
  social_instagram TEXT,
  social_twitter TEXT,
  notes TEXT,
  screenshot_url TEXT,
  logo_url TEXT,
  content_feed_type TEXT,
  content_feed_url TEXT,
  content_feed_rss TEXT,
  content_feed_frequency TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_submissions_status ON foundry_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created ON foundry_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_foundries_slug ON foundries(slug);
CREATE INDEX IF NOT EXISTS idx_foundries_tier ON foundries(tier);
CREATE INDEX IF NOT EXISTS idx_foundries_country ON foundries(location_country_code);

-- Enable Row Level Security
ALTER TABLE foundry_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE foundries ENABLE ROW LEVEL SECURITY;

-- Allow public to insert submissions (anyone can submit)
CREATE POLICY "Anyone can submit foundries"
  ON foundry_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow public to read their own submissions
CREATE POLICY "Users can view their own submissions"
  ON foundry_submissions
  FOR SELECT
  TO anon, authenticated
  USING (submitter_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Allow public to read approved foundries
CREATE POLICY "Anyone can read foundries"
  ON foundries
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only authenticated users (admins) can modify foundries
CREATE POLICY "Only admins can modify foundries"
  ON foundries
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_foundries_updated_at
  BEFORE UPDATE ON foundries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
