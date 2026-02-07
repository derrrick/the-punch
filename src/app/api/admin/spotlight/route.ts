import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "thepunch2026";

export async function POST(request: NextRequest) {
  try {
    // Check admin password
    const body = await request.json();
    const { password, settings } = body;
    
    // Accept hardcoded password or env var
    const validPassword = password === "thepunch2026" || password === ADMIN_PASSWORD;
    if (!validPassword) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (!settings || !settings.id) {
      return NextResponse.json({ error: "Missing settings or id" }, { status: 400 });
    }
    
    // Update settings using service role key
    const { data, error } = await supabase
      .from("spotlight_settings")
      .update({
        is_enabled: settings.is_enabled,
        variant: settings.variant,
        max_spotlights: settings.max_spotlights,
        theme: settings.theme,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settings.id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating spotlight settings:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Exception in spotlight API:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
