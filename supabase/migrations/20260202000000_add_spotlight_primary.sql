-- Add spotlight_is_primary column to foundries table
ALTER TABLE foundries 
ADD COLUMN IF NOT EXISTS spotlight_is_primary BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_foundries_spotlight_primary 
ON foundries(is_spotlight, spotlight_is_primary) 
WHERE is_spotlight = true;
