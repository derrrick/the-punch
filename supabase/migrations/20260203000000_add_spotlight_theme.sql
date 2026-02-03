-- Add theme column to spotlight_settings table
ALTER TABLE spotlight_settings 
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light'));
