import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { scrapeFoundryWebsite } from '@/lib/scraper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for server-side operations
);

export async function POST(request: NextRequest) {
  try {
    const { submissionId } = await request.json() as { submissionId: string };

    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID required' }, { status: 400 });
    }

    // Get the submission
    const { data: submission, error: fetchError } = await supabase
      .from('foundry_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Scrape the website
    console.log('Scraping:', submission.website_url);
    const metadata = await scrapeFoundryWebsite(submission.website_url);

    // Update the submission with scraped data
    const { error: updateError } = await supabase
      .from('foundry_submissions')
      .update({
        scraped_metadata: metadata,
        scraped_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Error updating submission:', updateError);
      return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      metadata,
    });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape website', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
