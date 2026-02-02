-- Newsletter System Database Schema
-- Run this in Supabase SQL Editor to set up newsletter tables

-- Newsletter subscribers table (if not exists)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Newsletter issues table
CREATE TABLE IF NOT EXISTS newsletter_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_number TEXT NOT NULL,
  subject TEXT NOT NULL,
  intro_headline TEXT,
  intro_body TEXT NOT NULL,
  featured_foundries UUID[] DEFAULT '{}',
  quick_links JSONB DEFAULT '[]'::jsonb,
  subscriber_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'partial', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ
);

-- Newsletter delivery tracking
CREATE TABLE IF NOT EXISTS newsletter_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES newsletter_issues(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(issue_id, subscriber_id)
);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for newsletter_subscribers
CREATE POLICY "Allow public subscribe" ON newsletter_subscribers
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow admin read" ON newsletter_subscribers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin update" ON newsletter_subscribers
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for newsletter_issues
CREATE POLICY "Allow admin all" ON newsletter_issues
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read sent" ON newsletter_issues
  FOR SELECT TO public USING (status IN ('sent', 'partial'));

-- RLS Policies for newsletter_deliveries
CREATE POLICY "Allow admin all" ON newsletter_deliveries
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_issues_status ON newsletter_issues(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_issue ON newsletter_deliveries(issue_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_subscriber ON newsletter_deliveries(subscriber_id);

-- Function to get subscriber stats
CREATE OR REPLACE FUNCTION get_subscriber_stats()
RETURNS TABLE (total BIGINT, active BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT as active
  FROM newsletter_subscribers;
END;
$$ LANGUAGE plpgsql;
