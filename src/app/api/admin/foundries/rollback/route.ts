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

interface RollbackRequest {
  password: string;
  backupId: string;
  dryRun?: boolean;
}

interface RollbackResult {
  slug: string;
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RollbackRequest = await request.json();
    const { password, backupId, dryRun = false } = body;

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!backupId) {
      return NextResponse.json({ error: "Missing backupId" }, { status: 400 });
    }

    // Fetch the backup
    const { data: backup, error: fetchError } = await supabase
      .from("foundry_backups")
      .select("*")
      .eq("id", backupId)
      .single();

    if (fetchError || !backup) {
      console.error("Error fetching backup:", fetchError);
      return NextResponse.json(
        { error: `Backup not found: ${backupId}` },
        { status: 404 }
      );
    }

    if (backup.status === "rolled_back") {
      return NextResponse.json(
        { error: "This backup has already been rolled back" },
        { status: 400 }
      );
    }

    if (backup.status === "expired") {
      return NextResponse.json(
        { error: "This backup has expired and cannot be used for rollback" },
        { status: 400 }
      );
    }

    const snapshot = backup.snapshot as Array<Record<string, unknown>>;

    if (!snapshot || !Array.isArray(snapshot) || snapshot.length === 0) {
      return NextResponse.json(
        { error: "Backup snapshot is empty or invalid" },
        { status: 400 }
      );
    }

    // In dry run mode, show what would be restored
    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        backupId,
        createdAt: backup.created_at,
        reason: backup.reason,
        foundryCount: snapshot.length,
        foundries: snapshot.map((f) => ({
          slug: f.slug,
          name: f.name,
        })),
      });
    }

    const results: RollbackResult[] = [];
    let restored = 0;
    let failed = 0;

    // Restore each foundry from the snapshot
    for (const foundry of snapshot) {
      const slug = foundry.slug as string;

      // Remove fields that shouldn't be updated
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, created_at: _createdAt, ...updateData } = foundry;

      const { error: updateError } = await supabase
        .from("foundries")
        .update(updateData)
        .eq("slug", slug);

      if (updateError) {
        console.error(`Error restoring ${slug}:`, updateError);
        results.push({
          slug,
          success: false,
          error: updateError.message,
        });
        failed++;
      } else {
        results.push({
          slug,
          success: true,
        });
        restored++;
      }
    }

    // Mark backup as rolled back
    await supabase
      .from("foundry_backups")
      .update({
        status: "rolled_back",
        rolled_back_at: new Date().toISOString(),
      })
      .eq("id", backupId);

    return NextResponse.json({
      success: failed === 0,
      restored,
      failed,
      backupId,
      results,
    });
  } catch (err) {
    console.error("Exception in rollback API:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET endpoint to get backup details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get("password");
    const backupId = searchParams.get("id");

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!backupId) {
      return NextResponse.json({ error: "Missing backup id" }, { status: 400 });
    }

    const { data: backup, error } = await supabase
      .from("foundry_backups")
      .select("*")
      .eq("id", backupId)
      .single();

    if (error || !backup) {
      return NextResponse.json(
        { error: `Backup not found: ${backupId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ backup });
  } catch (err) {
    console.error("Exception in rollback GET:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
