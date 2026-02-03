import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

interface GenerateRequest {
  foundryNames: string;
  styles: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { foundryNames, styles } = body;

    const prompt = `You are writing section headers for "The Punch", a curated directory of independent type foundries. Generate creative, engaging section titles and subtitles for a homepage spotlight section.

Currently spotlighted foundries: ${foundryNames}
Common style tags: ${styles}

Generate the following:

1. **3 Title Options** (max 5 words each): Short, punchy section titles. Examples: "This Week's Spotlight", "Editor's Picks", "Type Discoveries". Be creative but professional.

2. **3 Subtitle Options** (max 10 words each): Brief, enticing subtitles that complement the titles. Examples: "Exceptional foundries worth your attention", "Hand-selected studios we love right now".

Consider the foundries being featured when crafting the copy. If they share themes (location, style, era), reference that subtly.

Respond in JSON format:
{
  "titles": ["title1", "title2", "title3"],
  "subtitles": ["subtitle1", "subtitle2", "subtitle3"]
}

Be creative but keep it editorial and professional. Avoid clichés like "pushing boundaries" or "redefining".`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
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

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response");
    }

    const generated = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      content: {
        titles: generated.titles || [],
        subtitles: generated.subtitles || [],
      },
    });
  } catch (error) {
    console.error("Section generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
