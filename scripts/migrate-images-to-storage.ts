/**
 * Migrate base64 images to Supabase Storage
 *
 * Run with: npx tsx scripts/migrate-images-to-storage.ts
 *
 * Prerequisites:
 * 1. Create a storage bucket called "foundry-screenshots" in Supabase Dashboard
 * 2. Make the bucket PUBLIC (or set up appropriate policies)
 * 3. Set SUPABASE_SERVICE_ROLE_KEY in your .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = "foundry-screenshots";

async function migrateImages() {
  console.log("Fetching foundries with base64 images...\n");

  // Fetch all foundries
  const { data: foundries, error } = await supabase
    .from("foundries")
    .select("id, name, slug, screenshot_url");

  if (error) {
    console.error("Error fetching foundries:", error);
    return;
  }

  // Filter to only those with base64 images
  const foundriesToMigrate = foundries?.filter(
    (f) => f.screenshot_url && f.screenshot_url.startsWith("data:")
  ) || [];

  console.log(`Found ${foundriesToMigrate.length} foundries with base64 images\n`);

  if (foundriesToMigrate.length === 0) {
    console.log("No images to migrate!");
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const foundry of foundriesToMigrate) {
    try {
      console.log(`Processing: ${foundry.name}...`);

      // Parse base64 data
      const base64Data = foundry.screenshot_url;
      const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);

      if (!matches) {
        console.log(`  Skipping - invalid base64 format`);
        errorCount++;
        continue;
      }

      const mimeType = matches[1];
      const base64Content = matches[2];

      // Determine file extension
      const extMap: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
      };
      const ext = extMap[mimeType] || "jpg";
      const fileName = `${foundry.slug}.${ext}`;

      // Convert base64 to buffer
      const buffer = Buffer.from(base64Content, "base64");

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, buffer, {
          contentType: mimeType,
          upsert: true, // Overwrite if exists
        });

      if (uploadError) {
        console.log(`  Upload error: ${uploadError.message}`);
        errorCount++;
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log(`  Uploaded: ${publicUrl}`);

      // Update foundry record
      const { error: updateError } = await supabase
        .from("foundries")
        .update({ screenshot_url: publicUrl })
        .eq("id", foundry.id);

      if (updateError) {
        console.log(`  DB update error: ${updateError.message}`);
        errorCount++;
        continue;
      }

      console.log(`  Updated database record`);
      successCount++;

    } catch (err) {
      console.log(`  Error: ${err}`);
      errorCount++;
    }
  }

  console.log("\n--- Migration Complete ---");
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
}

migrateImages();
