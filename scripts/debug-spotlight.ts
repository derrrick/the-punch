import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  console.log("=== Spotlight Debug ===\n");

  // 1. Check settings
  const { data: settings, error: settingsErr } = await supabase
    .from("spotlight_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (settingsErr) {
    console.log("Settings ERROR:", settingsErr.message);
  } else {
    console.log("Settings:");
    console.log("  is_enabled:", settings?.is_enabled);
    console.log("  title:", settings?.title);
    console.log("  variant:", settings?.variant);
  }

  // 2. Check spotlight foundries
  const { data: foundries, error: foundriesErr } = await supabase
    .from("foundries")
    .select("name, is_spotlight, spotlight_description")
    .eq("is_spotlight", true);

  if (foundriesErr) {
    console.log("Foundries ERROR:", foundriesErr.message);
  } else {
    console.log("\nSpotlight foundries:", foundries?.length || 0);
    foundries?.forEach((f) => console.log("  -", f.name));
  }

  // 3. What needs to happen
  console.log("\n=== Requirements to show spotlight ===");
  const isEnabled = settings?.is_enabled === true;
  const hasFoundries = (foundries?.length || 0) > 0;

  console.log("1. is_enabled:", isEnabled ? "YES" : "NO - Enable in admin");
  console.log("2. has foundries:", hasFoundries ? "YES" : "NO - Add foundries in admin");

  if (isEnabled && hasFoundries) {
    console.log("\n✓ Spotlight SHOULD be showing on homepage!");
    console.log("  If not visible, try hard refresh (Cmd+Shift+R)");
  } else {
    console.log("\n✗ Spotlight will NOT show until both conditions are met");
  }
}

check();
