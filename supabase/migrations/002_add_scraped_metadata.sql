-- Add scraped_metadata column to store automated data extraction
ALTER TABLE foundry_submissions
ADD COLUMN IF NOT EXISTS scraped_metadata JSONB,
ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster queries on scraped submissions
CREATE INDEX IF NOT EXISTS idx_submissions_scraped ON foundry_submissions(scraped_at);
