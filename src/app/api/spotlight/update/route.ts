import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { foundryId, spotlight_description, spotlight_quote } = await request.json();

    if (!foundryId) {
      return NextResponse.json(
        { error: "Foundry ID is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, string | null> = {};
    if (spotlight_description !== undefined) {
      updateData.spotlight_description = spotlight_description;
    }
    if (spotlight_quote !== undefined) {
      updateData.spotlight_quote = spotlight_quote;
    }

    const { data, error } = await supabase
      .from("foundries")
      .update(updateData)
      .eq("id", foundryId)
      .select()
      .single();

    if (error) {
      console.error("Error updating spotlight data:", error);
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
    console.error("Update spotlight error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
