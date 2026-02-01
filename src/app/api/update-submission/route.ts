import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { submissionId, aiAnalysis } = await request.json();

    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID required' }, { status: 400 });
    }

    if (!aiAnalysis) {
      return NextResponse.json({ error: 'AI analysis data required' }, { status: 400 });
    }

    // Update the submission with the edited AI analysis
    const { error: updateError } = await supabase
      .from('foundry_submissions')
      .update({
        ai_analysis: aiAnalysis,
        analyzed_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Error updating submission:', updateError);
      return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update submission error:', error);
    return NextResponse.json(
      { error: 'Failed to update submission', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
