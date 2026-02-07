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
const BUCKET_NAME = "foundry-screenshots";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const password = formData.get("password") as string;
    const submissionId = formData.get("submissionId") as string;
    const foundryName = formData.get("foundryName") as string;
    const file = formData.get("file") as File | null;

    // Validate admin password
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate required fields
    if (!submissionId || !file) {
      return NextResponse.json({ error: "Missing submissionId or file" }, { status: 400 });
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

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
      });
      if (createError && !createError.message.includes('already exists')) {
        console.error("Error creating bucket:", createError);
        return NextResponse.json({ error: "Failed to create storage bucket" }, { status: 500 });
      }
    }

    // Generate filename from foundry name
    const slug = foundryName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const filename = `${slug}-${Date.now()}.${ext}`;

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

    // Update submission's ai_analysis with the screenshot URL
    const { data: submission } = await supabase
      .from("foundry_submissions")
      .select("ai_analysis")
      .eq("id", submissionId)
      .single();

    const currentAnalysis = submission?.ai_analysis || {};
    const updatedAnalysis = { ...currentAnalysis, screenshotUrl: publicUrl };

    const { error: updateError } = await supabase
      .from("foundry_submissions")
      .update({
        ai_analysis: updatedAnalysis,
        analyzed_at: new Date().toISOString(),
      })
      .eq("id", submissionId);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error("Exception in upload-screenshot API:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
