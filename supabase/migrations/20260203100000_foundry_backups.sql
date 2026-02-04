-- Create foundry_backups table for storing snapshots before batch operations
CREATE TABLE IF NOT EXISTS foundry_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT NOT NULL,
  foundry_count INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  changes_applied JSONB,  -- What changes were made
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'rolled_back', 'expired')),
  rolled_back_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Create index for querying active backups
CREATE INDEX IF NOT EXISTS idx_foundry_backups_status ON foundry_backups(status);
CREATE INDEX IF NOT EXISTS idx_foundry_backups_created ON foundry_backups(created_at DESC);

-- Enable Row Level Security
ALTER TABLE foundry_backups ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage backups (for API routes)
CREATE POLICY "Service role can manage backups"
  ON foundry_backups
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anon to read backups for rollback verification
CREATE POLICY "Anyone can read backups"
  ON foundry_backups
  FOR SELECT
  TO anon
  USING (true);

-- Comment for documentation
COMMENT ON TABLE foundry_backups IS 'Stores snapshots of foundry data before batch operations for rollback capability';
COMMENT ON COLUMN foundry_backups.snapshot IS 'JSON array of full foundry records at time of backup';
COMMENT ON COLUMN foundry_backups.changes_applied IS 'JSON describing what changes were applied after this backup';
COMMENT ON COLUMN foundry_backups.status IS 'active = can be rolled back, rolled_back = already reverted, expired = past retention';
