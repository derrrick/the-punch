import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Style tags vocabulary - AI must choose from these
const STYLE_TAGS = [
  'swiss',
  'geometric',
  'humanist',
  'editorial',
  'contemporary',
  'modernist',
  'brutalist',
  'experimental',
  'variable',
  'display',
  'playful',
  'expressive',
  'multilingual',
  'research',
  'french',
  'americana',
  'revival',
  'historical',
  'clean',
  'minimal',
  'grotesk',
  'neo-grotesk',
  'industrial',
  'scandinavian',
  'warm',
  'technical',
  'friendly',
  'german',
  'portuguese',
  'serif',
  'book',
  'activist',
  'open-source',
  'hand-drawn',
  'czech',
  'indian',
  'argentine',
  'british',
  'wayfinding',
  'corporate',
  'retro',
  'postmodern',
  'magazine',
  'art',
  'web',
  'tech',
  'news',
  'branding',
  'accessible',
  'code',
  'monospace',
];

export interface FoundryAnalysis {
  founderName?: string;
  foundedYear?: number;
  notableTypefaces: string[];
  styleTags: string[];
  positioningNote: string;
  tier: 1 | 2 | 3 | 4;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

export async function analyzeFoundryContent(
  foundryName: string,
  websiteUrl: string,
  homepageContent: string,
  aboutContent?: string,
  typefaceListings?: string[]
): Promise<FoundryAnalysis> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const prompt = `You are a typography expert analyzing a type foundry website to extract structured metadata.

Foundry Name: ${foundryName}
Website: ${websiteUrl}

Homepage Content:
${homepageContent.substring(0, 3000)}

${aboutContent ? `About Page Content:\n${aboutContent.substring(0, 2000)}` : ''}

${typefaceListings && typefaceListings.length > 0 ? `Typeface Listings:\n${typefaceListings.join('\n').substring(0, 1000)}` : ''}

---

Please analyze this foundry and provide:

1. **Founder Name**: Who founded this foundry? (full name)
2. **Founded Year**: What year was it established? (YYYY format)
3. **Notable Typefaces**: List 3-5 of their most important/popular typefaces (exact names as they appear)
4. **Style Tags**: Choose 3-5 tags from this list that best describe their aesthetic: ${STYLE_TAGS.join(', ')}
5. **Positioning Note**: Write ONE sentence (max 15 words) describing what makes this foundry unique
6. **Tier**: Rate prominence (1=legendary like Hoefler&Co, 2=major like Grilli Type, 3=established indie, 4=emerging)

Respond in JSON format:
{
  "founderName": "string or null",
  "foundedYear": number or null,
  "notableTypefaces": ["typeface1", "typeface2", ...],
  "styleTags": ["tag1", "tag2", ...],
  "positioningNote": "string",
  "tier": 1-4,
  "confidence": "high|medium|low",
  "reasoning": "Brief explanation of your analysis"
}

Be concise. If information isn't clearly stated, return null and set confidence to "low" or "medium".`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Extract JSON from response (Claude sometimes wraps it in markdown)
    let jsonText = content.text;
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const analysis: FoundryAnalysis = JSON.parse(jsonText);

    // Validate and clean the response
    return {
      founderName: analysis.founderName || undefined,
      foundedYear: analysis.foundedYear || undefined,
      notableTypefaces: (analysis.notableTypefaces || []).slice(0, 5),
      styleTags: (analysis.styleTags || [])
        .filter((tag) => STYLE_TAGS.includes(tag.toLowerCase()))
        .slice(0, 5),
      positioningNote: analysis.positioningNote || '',
      tier: analysis.tier || 3,
      confidence: analysis.confidence || 'medium',
      reasoning: analysis.reasoning || '',
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    throw new Error(`Failed to analyze foundry: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
