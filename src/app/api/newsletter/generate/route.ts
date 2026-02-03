import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface GenerateRequest {
  selectedFoundries: string[];
  theme?: string;
  tone?: "casual" | "editorial" | "enthusiastic";
  issueNumber: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { selectedFoundries, theme, tone = "editorial", issueNumber } = body;

    if (!selectedFoundries || selectedFoundries.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one foundry" },
        { status: 400 }
      );
    }

    // Fetch foundry data
    const { data: foundries, error } = await supabase
      .from("foundries")
      .select("*")
      .in("id", selectedFoundries);

    if (error || !foundries) {
      return NextResponse.json(
        { error: "Failed to fetch foundries" },
        { status: 500 }
      );
    }

    // Build context about selected foundries
    const foundryContext = foundries
      .map((f) => {
        return `- ${f.name} (${f.location_city}, ${f.location_country}): ${f.notes || "Independent type foundry"}. Notable typefaces: ${(f.notable_typefaces || []).join(", ")}. Style: ${(f.style || []).join(", ")}.`;
      })
      .join("\n");

    // Determine common themes
    const allStyles = foundries.flatMap((f) => f.style || []);
    const styleFrequency = allStyles.reduce((acc: Record<string, number>, style: string) => {
      acc[style] = (acc[style] || 0) + 1;
      return acc;
    }, {});
    const commonStyles = Object.entries(styleFrequency)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([style]) => style);

    const locations = Array.from(new Set(foundries.map((f) => f.location_country)));

    const prompt = `You are writing content for "The Punch Weekly", a newsletter about independent type foundries. The tone should be ${tone}, knowledgeable about typography, and genuinely enthusiastic about good type design.

Issue number: ${issueNumber}
${theme ? `Theme/angle requested: ${theme}` : ""}

Featured foundries this week:
${foundryContext}

Common stylistic threads: ${commonStyles.join(", ")}
Geographic spread: ${locations.join(", ")}

Generate newsletter content with these requirements:

1. **Subject Line**: Create 3 options for email subject lines (max 60 chars each). Make them intriguing but not clickbait. They should hint at what's inside without giving everything away.

2. **Intro Headline**: A punchy, one-line headline (max 12 words) that captures the theme or vibe of this issue.

3. **Intro Body**: 2-3 sentences (max 80 words) that:
   - Set up why these foundries are interesting together
   - Create anticipation for what the reader will discover
   - Sound like a knowledgeable friend sharing cool finds, not marketing copy

4. **Quick Links**: Generate 2-3 interesting typography-related links for the "More to Explore" section. These should be:
   - Relevant to the featured foundries or typography in general
   - Real, useful resources (type specimen archives, typography articles, design tools, other foundries not featured)
   - Each with a catchy title and brief description (under 10 words)

5. **Theme Suggestion**: If no theme was provided, suggest what ties these foundries together (1 sentence).

Respond in JSON format:
{
  "subjectLines": ["option 1", "option 2", "option 3"],
  "introHeadline": "string",
  "introBody": "string",
  "quickLinks": [{"title": "string", "url": "https://...", "description": "string"}],
  "themeSuggestion": "string or null if theme was provided"
}

Be specific about the foundries. Reference actual typeface names or design approaches when relevant. Avoid generic phrases like "pushing boundaries" or "redefining typography".`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const textContent = message.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from AI");
    }

    // Parse JSON from response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response");
    }

    const generated = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      content: {
        subjectLines: generated.subjectLines || [],
        introHeadline: generated.introHeadline || "",
        introBody: generated.introBody || "",
        quickLinks: generated.quickLinks || [],
        themeSuggestion: generated.themeSuggestion || null,
      },
      context: {
        foundryCount: foundries.length,
        commonStyles,
        locations,
      },
    });
  } catch (error) {
    console.error("Newsletter generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
