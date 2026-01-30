import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { analyzeFoundryContent } from '@/lib/ai-analyzer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { submissionId } = await request.json();

    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID required' }, { status: 400 });
    }

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'AI analysis not configured. Please add ANTHROPIC_API_KEY to environment variables.' },
        { status: 503 }
      );
    }

    // Get the submission with scraped data
    const { data: submission, error: fetchError } = await supabase
      .from('foundry_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (!submission.scraped_metadata) {
      return NextResponse.json(
        { error: 'Please scrape the website first before AI analysis' },
        { status: 400 }
      );
    }

    const scraped = submission.scraped_metadata;

    // Perform AI analysis
    console.log('Analyzing foundry with AI:', submission.foundry_name);

    const analysis = await analyzeFoundryContent(
      submission.foundry_name,
      submission.website_url,
      scraped.homepageContent || '',
      scraped.aboutContent,
      scraped.typefaceListings
    );

    // Update submission with AI analysis
    const { error: updateError } = await supabase
      .from('foundry_submissions')
      .update({
        ai_analysis: analysis,
        analyzed_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Error updating submission:', updateError);
      return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze foundry',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
