import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { submissionId } = await request.json() as { submissionId: string };

    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID required' }, { status: 400 });
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

    if (submission.status !== 'approved') {
      return NextResponse.json({ error: 'Submission must be approved first' }, { status: 400 });
    }

    // Generate slug from name
    const slug = submission.foundry_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if foundry already exists
    const { data: existing } = await supabase
      .from('foundries')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Foundry already exists in directory' }, { status: 400 });
    }

    // Get AI analysis data (if available)
    const aiAnalysis = submission.ai_analysis || {};

    // Parse location - prefer AI-extracted location over user-submitted
    let city = '';
    let country = '';
    let countryCode = '';

    // First try AI-extracted location
    if (aiAnalysis.location?.city) {
      city = aiAnalysis.location.city;
      country = aiAnalysis.location.country || '';
      countryCode = aiAnalysis.location.countryCode || '';
    }
    // Fall back to user-submitted location
    else if (submission.location) {
      const parts = submission.location.split(',').map((s: string) => s.trim());
      if (parts.length >= 2) {
        city = parts[0];
        country = parts[1];
        // Simple country code lookup (expand this later)
        const countryCodeMap: Record<string, string> = {
          'usa': 'US',
          'united states': 'US',
          'uk': 'GB',
          'united kingdom': 'GB',
          'germany': 'DE',
          'france': 'FR',
          'netherlands': 'NL',
          'switzerland': 'CH',
          'italy': 'IT',
          'spain': 'ES',
          'portugal': 'PT',
          'belgium': 'BE',
          'austria': 'AT',
          'denmark': 'DK',
          'sweden': 'SE',
          'norway': 'NO',
          'finland': 'FI',
        };
        countryCode = countryCodeMap[country.toLowerCase()] || country.substring(0, 2).toUpperCase();
      }
    }

    // Extract social media from scraped data
    const instagram = submission.scraped_metadata?.socialMedia?.instagram || null;
    const twitter = submission.scraped_metadata?.socialMedia?.twitter || null;

    // Create foundry record using AI analysis data when available
    const newFoundry = {
      name: submission.foundry_name,
      slug,
      location_city: city || 'Unknown',
      location_country: country || 'Unknown',
      location_country_code: countryCode || 'XX',
      url: submission.website_url,
      founder: aiAnalysis.founderName || 'Unknown',
      founded: aiAnalysis.foundedYear || new Date().getFullYear(),
      notable_typefaces: aiAnalysis.notableTypefaces || [],
      style: aiAnalysis.styleTags || [],
      tier: aiAnalysis.tier || 3,
      social_instagram: instagram,
      social_twitter: twitter,
      notes: aiAnalysis.notes || submission.notes || null,
      screenshot_url: submission.scraped_metadata?.screenshot || null,
      logo_url: submission.scraped_metadata?.favicon || null,
      content_feed_type: null,
      content_feed_url: null,
      content_feed_rss: null,
      content_feed_frequency: null,
    };

    const { data, error: insertError } = await supabase
      .from('foundries')
      .insert([newFoundry])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting foundry:', insertError);
      return NextResponse.json({ error: 'Failed to add to directory' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      foundry: data,
    });
  } catch (error) {
    console.error('Add to directory error:', error);
    return NextResponse.json(
      { error: 'Failed to add to directory', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
