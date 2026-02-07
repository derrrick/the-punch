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
const BUCKET_NAME = "spotlight-images";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const password = formData.get("password") as string;
    const foundryId = formData.get("foundryId") as string;
    const foundrySlug = formData.get("foundrySlug") as string;
    const position = formData.get("position") as "left" | "center" | "right";
    const file = formData.get("file") as File | null;

    // Validate admin password
    if (password !== ADMIN_PASSWORD) {
      // Temporary debug - remove after fixing
      return NextResponse.json({
        error: "Unauthorized",
        debug: {
          receivedLength: password?.length || 0,
          expectedLength: ADMIN_PASSWORD?.length || 0,
          receivedStart: password?.substring(0, 5) || "empty",
          expectedStart: ADMIN_PASSWORD?.substring(0, 5) || "empty",
        }
      }, { status: 401 });
    }

    // Validate required fields
    if (!foundryId || !position) {
      return NextResponse.json({ error: "Missing foundryId or position" }, { status: 400 });
    }

    if (!["left", "center", "right"].includes(position)) {
      return NextResponse.json({ error: "Invalid position" }, { status: 400 });
    }

    // If no file, this is a delete request
    if (!file) {
      const columnName = `spotlight_image_${position}`;

      // Get current image URL to delete from storage
      const { data: foundry } = await supabase
        .from("foundries")
        .select(columnName)
        .eq("id", foundryId)
        .single();

      const foundryRecord = foundry as Record<string, string | null> | null;
      if (foundryRecord && foundryRecord[columnName]) {
        // Extract filename from URL and delete from storage
        const url = foundryRecord[columnName] as string;
        const filename = url.split("/").pop();
        if (filename) {
          await supabase.storage.from(BUCKET_NAME).remove([filename]);
        }
      }

      // Clear the database field
      const { error: updateError } = await supabase
        .from("foundries")
        .update({ [columnName]: null })
        .eq("id", foundryId);

      if (updateError) {
        console.error("Error clearing image:", updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, url: null });
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Use JPEG, PNG, or WebP." }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });
    }

    // Generate filename
    const ext = file.type.split("/")[1];
    const filename = `${foundrySlug}-${position}-${Date.now()}.${ext}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);

    const publicUrl = urlData.publicUrl;

    // Update foundry record
    const columnName = `spotlight_image_${position}`;
    const { error: updateError } = await supabase
      .from("foundries")
      .update({ [columnName]: publicUrl })
      .eq("id", foundryId);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error("Exception in spotlight-images API:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
