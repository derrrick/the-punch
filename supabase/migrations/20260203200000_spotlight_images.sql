-- Add spotlight image columns to foundries table
ALTER TABLE foundries
ADD COLUMN IF NOT EXISTS spotlight_image_left TEXT,
ADD COLUMN IF NOT EXISTS spotlight_image_center TEXT,
ADD COLUMN IF NOT EXISTS spotlight_image_right TEXT;

-- Add comment for documentation
COMMENT ON COLUMN foundries.spotlight_image_left IS 'Custom left panel image URL for spotlight display';
COMMENT ON COLUMN foundries.spotlight_image_center IS 'Custom center panel image URL for spotlight display';
COMMENT ON COLUMN foundries.spotlight_image_right IS 'Custom right panel image URL for spotlight display';
