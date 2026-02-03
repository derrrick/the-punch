import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "thepunch2026";

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get("authorization");
    const password = authHeader?.replace("Bearer ", "");
    
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to create spotlight_settings table
    try {
      await supabase.from("spotlight_settings").select("count").limit(1);
    } catch {
      // Table might not exist, return SQL for manual setup
      return NextResponse.json({ 
        needsSetup: true,
        sql: `
-- Run this in Supabase SQL Editor:

-- Create spotlight_settings table
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

-- Add columns to foundries table
ALTER TABLE foundries 
ADD COLUMN IF NOT EXISTS is_spotlight BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS spotlight_description TEXT,
ADD COLUMN IF NOT EXISTS spotlight_quote TEXT,
ADD COLUMN IF NOT EXISTS spotlight_order INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE spotlight_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read spotlight settings" ON spotlight_settings
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow admin all spotlight settings" ON spotlight_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default settings
INSERT INTO spotlight_settings (id, is_enabled)
SELECT gen_random_uuid(), false
WHERE NOT EXISTS (SELECT 1 FROM spotlight_settings LIMIT 1);
        `
      });
    }

    return NextResponse.json({ success: true, message: "Spotlight schema ready" });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ 
      error: "Setup check failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
