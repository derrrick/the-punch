import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/newsletter/unsubscribe?error=missing_token", request.url));
    }

    // Decode token to get subscriber ID
    let subscriberId: string;
    try {
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      subscriberId = decoded.split(":")[0];
    } catch {
      return NextResponse.redirect(new URL("/newsletter/unsubscribe?error=invalid_token", request.url));
    }

    // Update subscriber status
    const { error } = await supabase
      .from("newsletter_subscribers")
      .update({
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("id", subscriberId);

    if (error) {
      console.error("Unsubscribe error:", error);
      return NextResponse.redirect(new URL("/newsletter/unsubscribe?error=update_failed", request.url));
    }

    // Redirect to success page
    return NextResponse.redirect(new URL("/newsletter/unsubscribe?success=true", request.url));
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.redirect(new URL("/newsletter/unsubscribe?error=unknown", request.url));
  }
}
