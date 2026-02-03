import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET_NAME = "foundry-screenshots";

async function migrateLocalImages() {
  console.log("Fetching foundries with local paths...\n");

  const { data: foundries, error } = await supabase
    .from("foundries")
    .select("id, name, slug, screenshot_url");

  if (error) {
    console.error(error);
    return;
  }

  const foundriesToMigrate = foundries?.filter(
    (f) => f.screenshot_url && f.screenshot_url.startsWith("/screenshots/")
  ) || [];

  console.log(`Found ${foundriesToMigrate.length} foundries with local paths\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const foundry of foundriesToMigrate) {
    try {
      process.stdout.write(`Processing: ${foundry.name}... `);

      const localPath = path.join("public", foundry.screenshot_url);

      if (!fs.existsSync(localPath)) {
        console.log(`File not found: ${localPath}`);
        errorCount++;
        continue;
      }

      const fileBuffer = fs.readFileSync(localPath);
      const ext = path.extname(foundry.screenshot_url).slice(1) || "jpg";
      const fileName = `${foundry.slug}.${ext}`;

      const mimeTypes: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
      };
      const contentType = mimeTypes[ext] || "image/jpeg";

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, fileBuffer, { contentType, upsert: true });

      if (uploadError) {
        console.log(`Upload error: ${uploadError.message}`);
        errorCount++;
        continue;
      }

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("foundries")
        .update({ screenshot_url: urlData.publicUrl })
        .eq("id", foundry.id);

      if (updateError) {
        console.log(`DB error: ${updateError.message}`);
        errorCount++;
        continue;
      }

      console.log("OK");
      successCount++;
    } catch (err) {
      console.log(`Error: ${err}`);
      errorCount++;
    }
  }

  console.log("\n--- Migration Complete ---");
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
}

migrateLocalImages();
