import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/render";
import ThePunchWeekly from "@/emails/ThePunchWeekly";
import type { NewsletterData } from "@/emails/ThePunchWeekly";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      issueNumber,
      subject,
      introHeadline,
      introBody,
      selectedFoundries,
      quickLinksTitle,
      quickLinks,
    } = body;

    // Fetch full foundry data for selected foundries
    const { data: foundriesData, error } = await supabase
      .from("foundries")
      .select("*")
      .in("id", selectedFoundries);

    if (error) {
      console.error("Error fetching foundries:", error);
      return NextResponse.json(
        { error: "Failed to fetch foundries" },
        { status: 500 }
      );
    }

    // Transform foundry data for email
    const featuredFoundries = foundriesData?.map((foundry) => ({
      id: foundry.id,
      name: foundry.name,
      slug: foundry.slug,
      location: `${foundry.location_city}, ${foundry.location_country}`,
      description: foundry.notes?.substring(0, 300) || `${foundry.name} is an independent type foundry based in ${foundry.location_city}, ${foundry.location_country}.`,
      typefaces: foundry.notable_typefaces || [],
      imageUrl: foundry.screenshot_url,
      url: `https://thepunch.xyz/foundry/${foundry.slug}`,
      styleTags: foundry.style || [],
    })) || [];

    // Prepare newsletter data
    const newsletterData: NewsletterData = {
      issueNumber,
      subject,
      introHeadline,
      introBody,
      featuredFoundries,
      quickLinks: {
        title: quickLinksTitle,
        links: quickLinks.filter((link: { title: string; url: string }) => link.title && link.url),
      },
      unsubscribeUrl: "{{unsubscribe_url}}",
    };

    // Render email to HTML
    const html = await render(ThePunchWeekly(newsletterData));

    return NextResponse.json({ html });
  } catch (error) {
    console.error("Preview generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate preview" },
      { status: 500 }
    );
  }
}
