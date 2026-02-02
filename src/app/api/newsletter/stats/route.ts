import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Get total count
    const { count: totalCount, error: totalError } = await supabase
      .from("newsletter_subscribers")
      .select("*", { count: "exact", head: true });

    if (totalError) {
      console.error("Error fetching total count:", totalError);
      return NextResponse.json(
        { error: "Failed to fetch stats" },
        { status: 500 }
      );
    }

    // Get active count
    const { count: activeCount, error: activeError } = await supabase
      .from("newsletter_subscribers")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    if (activeError) {
      console.error("Error fetching active count:", activeError);
      return NextResponse.json(
        { error: "Failed to fetch stats" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      total: totalCount || 0,
      active: activeCount || 0,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
