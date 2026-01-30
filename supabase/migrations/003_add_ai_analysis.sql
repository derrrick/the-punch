-- Add AI analysis columns to foundry_submissions
ALTER TABLE foundry_submissions
ADD COLUMN IF NOT EXISTS ai_analysis JSONB,
ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster queries on analyzed submissions
CREATE INDEX IF NOT EXISTS idx_submissions_analyzed ON foundry_submissions(analyzed_at);

-- Add comment describing the ai_analysis structure
COMMENT ON COLUMN foundry_submissions.ai_analysis IS 'AI-generated metadata suggestions: {founderName, foundedYear, notableTypefaces[], styleTags[], positioningNote, tier, confidence, reasoning}';
