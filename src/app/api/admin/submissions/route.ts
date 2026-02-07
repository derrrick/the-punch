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
    const { password, filter, action, id, status, reason } = await request.json();

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update submission status
    if (action === "updateStatus" && id && status) {
      const { error } = await supabase
        .from("foundry_submissions")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: "admin",
          rejection_reason: reason || null,
        })
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Default: list submissions
    let query = supabase
      .from("foundry_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter && filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ submissions: data || [] });
  } catch (err) {
    console.error("Submissions API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
