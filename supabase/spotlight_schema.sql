-- Foundry Spotlight Feature Schema
-- Run this in Supabase SQL Editor to enable spotlight functionality

-- Add spotlight fields to foundries table
ALTER TABLE foundries 
ADD COLUMN IF NOT EXISTS is_spotlight BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS spotlight_description TEXT,
ADD COLUMN IF NOT EXISTS spotlight_quote TEXT,
ADD COLUMN IF NOT EXISTS spotlight_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS spotlight_start_date DATE,
ADD COLUMN IF NOT EXISTS spotlight_end_date DATE;

-- Create index for spotlight queries
CREATE INDEX IF NOT EXISTS idx_foundries_spotlight ON foundries(is_spotlight, spotlight_order) 
WHERE is_spotlight = true;

-- Create spotlight settings table for global configuration
CREATE TABLE IF NOT EXISTS spotlight_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled BOOLEAN DEFAULT false,
  title TEXT DEFAULT 'This Week''s Spotlight',
  subtitle TEXT DEFAULT 'Exceptional foundries worth your attention',
  variant TEXT DEFAULT 'hero' CHECK (variant IN ('hero', 'grid', 'carousel')),
  max_spotlights INTEGER DEFAULT 4,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT
);

-- Insert default settings if not exists
INSERT INTO spotlight_settings (id, is_enabled)
SELECT gen_random_uuid(), false
WHERE NOT EXISTS (SELECT 1 FROM spotlight_settings LIMIT 1);

-- Enable RLS
ALTER TABLE spotlight_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for spotlight_settings
CREATE POLICY "Allow public read spotlight settings" ON spotlight_settings
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow admin all spotlight settings" ON spotlight_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Function to get current spotlight foundries
CREATE OR REPLACE FUNCTION get_spotlight_foundries()
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  location_city TEXT,
  location_country TEXT,
  location_country_code TEXT,
  notable_typefaces TEXT[],
  style TEXT[],
  tier INTEGER,
  notes TEXT,
  screenshot_url TEXT,
  spotlight_description TEXT,
  spotlight_quote TEXT,
  spotlight_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.name,
    f.slug,
    f.location_city,
    f.location_country,
    f.location_country_code,
    f.notable_typefaces,
    f.style,
    f.tier,
    f.notes,
    f.screenshot_url,
    f.spotlight_description,
    f.spotlight_quote,
    f.spotlight_order
  FROM foundries f
  WHERE f.is_spotlight = true
    AND (f.spotlight_end_date IS NULL OR f.spotlight_end_date >= CURRENT_DATE)
  ORDER BY f.spotlight_order ASC, f.tier ASC, f.name ASC
  LIMIT (SELECT max_spotlights FROM spotlight_settings WHERE is_enabled = true LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- Function to toggle spotlight for a foundry
CREATE OR REPLACE FUNCTION toggle_foundry_spotlight(
  p_foundry_id UUID,
  p_is_spotlight BOOLEAN,
  p_spotlight_description TEXT DEFAULT NULL,
  p_spotlight_quote TEXT DEFAULT NULL,
  p_spotlight_order INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  UPDATE foundries
  SET 
    is_spotlight = p_is_spotlight,
    spotlight_description = p_spotlight_description,
    spotlight_quote = p_spotlight_quote,
    spotlight_order = p_spotlight_order,
    spotlight_start_date = CASE WHEN p_is_spotlight THEN CURRENT_DATE ELSE NULL END,
    spotlight_end_date = NULL
  WHERE id = p_foundry_id;
END;
$$ LANGUAGE plpgsql;
