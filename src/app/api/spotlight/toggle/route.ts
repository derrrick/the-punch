import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { foundryId, isSpotlight, spotlightOrder, spotlightDescription, spotlightQuote } = await request.json();

    if (!foundryId) {
      return NextResponse.json(
        { error: "Foundry ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("foundries")
      .update({
        is_spotlight: isSpotlight,
        spotlight_order: isSpotlight ? spotlightOrder : 0,
        spotlight_description: spotlightDescription || null,
        spotlight_quote: spotlightQuote || null,
      })
      .eq("id", foundryId)
      .select()
      .single();

    if (error) {
      console.error("Error toggling spotlight:", error);
      return NextResponse.json(
        { error: "Failed to update foundry" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      foundry: data,
    });
  } catch (error) {
    console.error("Toggle spotlight error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
