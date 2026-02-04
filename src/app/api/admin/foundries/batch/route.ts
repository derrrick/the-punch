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

interface BatchUpdate {
  slug: string;
  changes: Record<string, unknown>;
  reason: string;
}

interface BatchRequest {
  password: string;
  dryRun?: boolean;
  updates: BatchUpdate[];
}

interface UpdateResult {
  slug: string;
  success: boolean;
  error?: string;
  changes?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body: BatchRequest = await request.json();
    const { password, dryRun = false, updates } = body;

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "Missing or empty updates array" }, { status: 400 });
    }

    // Get all slugs to update
    const slugs = updates.map((u) => u.slug);

    // Fetch current state of all foundries to be updated (for backup)
    const { data: currentFoundries, error: fetchError } = await supabase
      .from("foundries")
      .select("*")
      .in("slug", slugs);

    if (fetchError) {
      console.error("Error fetching foundries for backup:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!currentFoundries || currentFoundries.length === 0) {
      return NextResponse.json({ error: "No foundries found matching the provided slugs" }, { status: 404 });
    }

    // Verify all slugs exist
    const foundSlugs = new Set(currentFoundries.map((f) => f.slug));
    const missingSlugs = slugs.filter((s) => !foundSlugs.has(s));
    if (missingSlugs.length > 0) {
      return NextResponse.json(
        { error: `Foundries not found: ${missingSlugs.join(", ")}` },
        { status: 404 }
      );
    }

    // In dry run mode, just return what would happen
    if (dryRun) {
      const preview = updates.map((update) => {
        const current = currentFoundries.find((f) => f.slug === update.slug);
        return {
          slug: update.slug,
          changes: update.changes,
          currentValues: Object.fromEntries(
            Object.keys(update.changes).map((key) => [key, current?.[key]])
          ),
        };
      });

      return NextResponse.json({
        success: true,
        dryRun: true,
        preview,
        foundryCount: updates.length,
      });
    }

    // Create backup before making changes
    const backupReason = `Batch update: ${updates.length} foundries - ${updates.map((u) => u.reason).join("; ")}`;
    const { data: backup, error: backupError } = await supabase
      .from("foundry_backups")
      .insert({
        reason: backupReason,
        foundry_count: currentFoundries.length,
        snapshot: currentFoundries,
        changes_applied: updates,
      })
      .select("id")
      .single();

    if (backupError) {
      console.error("Error creating backup:", backupError);
      return NextResponse.json(
        { error: `Failed to create backup: ${backupError.message}` },
        { status: 500 }
      );
    }

    const backupId = backup.id;
    const results: UpdateResult[] = [];
    let applied = 0;
    let failed = 0;

    // Apply each update
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from("foundries")
        .update(update.changes)
        .eq("slug", update.slug);

      if (updateError) {
        console.error(`Error updating ${update.slug}:`, updateError);
        results.push({
          slug: update.slug,
          success: false,
          error: updateError.message,
        });
        failed++;
      } else {
        results.push({
          slug: update.slug,
          success: true,
          changes: update.changes,
        });
        applied++;
      }
    }

    return NextResponse.json({
      success: failed === 0,
      applied,
      failed,
      backupId,
      results,
      rollbackCommand: `npm run rollback-fixes -- --backup=${backupId}`,
    });
  } catch (err) {
    console.error("Exception in batch foundries API:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET endpoint to list recent backups
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get("password");

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: backups, error } = await supabase
      .from("foundry_backups")
      .select("id, created_at, reason, foundry_count, status")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ backups });
  } catch (err) {
    console.error("Exception in batch GET:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
