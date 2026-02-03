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
    const body = await request.json();
    const { password, foundryId, data } = body;
    
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (!foundryId || !data) {
      return NextResponse.json({ error: "Missing foundryId or data" }, { status: 400 });
    }
    
    const { error } = await supabase
      .from("foundries")
      .update(data)
      .eq("id", foundryId);
    
    if (error) {
      console.error("Error updating foundry:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Exception in foundries API:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
