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
  foundryId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { foundryId } = body;

    if (!foundryId) {
      return NextResponse.json(
        { error: "Please provide a foundry ID" },
        { status: 400 }
      );
    }

    // Fetch foundry data
    const { data: foundry, error } = await supabase
      .from("foundries")
      .select("*")
      .eq("id", foundryId)
      .single();

    if (error || !foundry) {
      return NextResponse.json(
        { error: "Foundry not found" },
        { status: 404 }
      );
    }

    // Build context about the foundry
    const foundryContext = `
Name: ${foundry.name}
Location: ${foundry.location_city}, ${foundry.location_country}
Notable typefaces: ${(foundry.notable_typefaces || []).join(", ")}
Style tags: ${(foundry.style || []).join(", ")}
Existing notes: ${foundry.notes || "None"}
Founded: ${foundry.founded || "Unknown"}
Founder: ${foundry.founder || "Unknown"}
    `.trim();

    const prompt = `You are writing spotlight content for "The Punch", a curated directory of independent type foundries. Generate compelling content for featuring this foundry on the homepage.

Foundry details:
${foundryContext}

Generate the following:

1. **Spotlight Description** (2-3 sentences, max 150 characters): A compelling, editorial description that makes visitors want to explore this foundry. Focus on what makes them unique - their design philosophy, notable work, or distinctive approach. Don't just list facts - make it enticing.

2. **Quote** (1 sentence, max 100 characters): Either a fictional quote that captures the foundry's spirit/philosophy, or a punchy tagline about their work. Make it sound like something a type designer would actually say. If quoting, attribute it naturally.

3. **Alternative Description** (2-3 sentences): A different angle on the same foundry for variety.

Respond in JSON format:
{
  "description": "string",
  "quote": "string",
  "altDescription": "string"
}

Be specific. Reference actual typeface names when relevant. Avoid generic phrases like "pushing boundaries" or "redefining typography". Sound like a knowledgeable friend recommending a great foundry.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
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
        description: generated.description || "",
        quote: generated.quote || "",
        altDescription: generated.altDescription || "",
      },
      foundry: {
        name: foundry.name,
        id: foundry.id,
      },
    });
  } catch (error) {
    console.error("Spotlight generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
