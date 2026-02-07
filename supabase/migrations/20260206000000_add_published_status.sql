-- Add "published" as a valid status for foundry_submissions
-- This status indicates the submission has been added to the directory

-- Drop the existing constraint
ALTER TABLE foundry_submissions DROP CONSTRAINT IF EXISTS foundry_submissions_status_check;

-- Add new constraint with "published" status
ALTER TABLE foundry_submissions ADD CONSTRAINT foundry_submissions_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'published'));

-- Add index for faster filtering by published status
CREATE INDEX IF NOT EXISTS idx_submissions_published ON foundry_submissions(status) WHERE status = 'published';
