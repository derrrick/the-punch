import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/render";
import { Resend } from "resend";
import ThePunchWeekly from "@/emails/ThePunchWeekly";
import type { NewsletterData } from "@/emails/ThePunchWeekly";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Admin password from env
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "thepunch2026";

export async function POST(request: NextRequest) {
  try {
    // Check authorization (simple password check for now)
    const authHeader = request.headers.get("authorization");
    const password = authHeader?.replace("Bearer ", "");
    
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      mode,
      testEmail,
      issueNumber,
      subject,
      introHeadline,
      introBody,
      selectedFoundries,
      quickLinksTitle,
      quickLinks,
    } = body;

    // Fetch foundries data
    const { data: foundriesData, error: foundriesError } = await supabase
      .from("foundries")
      .select("*")
      .in("id", selectedFoundries);

    if (foundriesError) {
      console.error("Error fetching foundries:", foundriesError);
      return NextResponse.json(
        { error: "Failed to fetch foundries" },
        { status: 500 }
      );
    }

    // Transform foundry data
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

    if (mode === "test") {
      // Send test email
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
        unsubscribeUrl: "#",
      };

      const html = await render(ThePunchWeekly(newsletterData));

      const { data: sendData, error: sendError } = await resend.emails.send({
        from: "The Punch <newsletter@thepunch.xyz>",
        to: [testEmail],
        subject: `[TEST] ${subject}`,
        html,
        replyTo: "hello@thepunch.xyz",
      });

      if (sendError) {
        console.error("Test email error:", sendError);
        return NextResponse.json(
          { error: "Failed to send test email" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Test email sent to ${testEmail}`,
        id: sendData?.id,
      });
    }

    // Production send
    if (mode === "production") {
      // Fetch active subscribers
      const { data: subscribers, error: subscribersError } = await supabase
        .from("newsletter_subscribers")
        .select("id, email")
        .eq("status", "active");

      if (subscribersError) {
        console.error("Error fetching subscribers:", subscribersError);
        return NextResponse.json(
          { error: "Failed to fetch subscribers" },
          { status: 500 }
        );
      }

      // Create newsletter issue record
      const { data: issueData, error: issueError } = await supabase
        .from("newsletter_issues")
        .insert({
          issue_number: issueNumber,
          subject,
          intro_headline: introHeadline,
          intro_body: introBody,
          featured_foundries: selectedFoundries,
          quick_links: quickLinks,
          subscriber_count: subscribers?.length || 0,
          status: "sending",
        })
        .select()
        .single();

      if (issueError) {
        console.error("Error creating issue:", issueError);
        return NextResponse.json(
          { error: "Failed to create newsletter issue" },
          { status: 500 }
        );
      }

      // Send emails in batches
      const BATCH_SIZE = 50;
      const batches = [];
      const subscribersList = subscribers || [];

      for (let i = 0; i < subscribersList.length; i += BATCH_SIZE) {
        batches.push(subscribersList.slice(i, i + BATCH_SIZE));
      }

      let sentCount = 0;
      const failedEmails: string[] = [];

      for (const batch of batches) {
        const sendPromises = batch.map(async (subscriber) => {
          // Generate unsubscribe token
          const unsubscribeToken = Buffer.from(`${subscriber.id}:${Date.now()}`).toString("base64");
          const unsubscribeUrl = `https://thepunch.xyz/api/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;

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
            unsubscribeUrl,
          };

          const html = await render(ThePunchWeekly(newsletterData));

          try {
            const { error: sendError } = await resend.emails.send({
              from: "The Punch <newsletter@thepunch.xyz>",
              to: [subscriber.email],
              subject,
              html,
              replyTo: "hello@thepunch.xyz",
              headers: {
                "List-Unsubscribe": `<${unsubscribeUrl}>`,
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
              },
            });

            if (sendError) {
              throw sendError;
            }

            // Log delivery
            await supabase.from("newsletter_deliveries").insert({
              issue_id: issueData.id,
              subscriber_id: subscriber.id,
              status: "sent",
            });

            sentCount++;
          } catch (err) {
            console.error(`Failed to send to ${subscriber.email}:`, err);
            failedEmails.push(subscriber.email);

            // Log failed delivery
            await supabase.from("newsletter_deliveries").insert({
              issue_id: issueData.id,
              subscriber_id: subscriber.id,
              status: "failed",
            });
          }
        });

        await Promise.all(sendPromises);

        // Small delay between batches to avoid rate limits
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      // Update issue status
      await supabase
        .from("newsletter_issues")
        .update({
          status: failedEmails.length === 0 ? "sent" : "partial",
          sent_count: sentCount,
          failed_count: failedEmails.length,
          sent_at: new Date().toISOString(),
        })
        .eq("id", issueData.id);

      return NextResponse.json({
        success: true,
        sent: sentCount,
        failed: failedEmails.length,
        issueId: issueData.id,
      });
    }

    return NextResponse.json(
      { error: "Invalid mode" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Send error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
