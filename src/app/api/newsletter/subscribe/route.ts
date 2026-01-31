import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Simple rate limiting store (in-memory)
// In production, consider using Redis or a database
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitStore.get(ip);

  if (!limit || now > limit.resetTime) {
    // Reset or create new limit (5 requests per hour)
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + 60 * 60 * 1000, // 1 hour from now
    });
    return true;
  }

  if (limit.count >= 5) {
    return false; // Rate limit exceeded
  }

  limit.count++;
  return true;
}

function isValidEmail(email: string): boolean {
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json() as { email: string };

    // Validate email format
    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email address is required.' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!isValidEmail(trimmedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from('newsletter_subscribers')
      .select('email, status')
      .eq('email', trimmedEmail)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing subscription:', checkError);
      return NextResponse.json(
        { success: false, error: 'An error occurred. Please try again.' },
        { status: 500 }
      );
    }

    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json(
          { success: false, error: "You're already subscribed!" },
          { status: 409 }
        );
      } else if (existing.status === 'unsubscribed') {
        // Reactivate the subscription
        const { error: updateError } = await supabase
          .from('newsletter_subscribers')
          .update({
            status: 'active',
            subscribed_at: new Date().toISOString(),
            unsubscribed_at: null,
          })
          .eq('email', trimmedEmail);

        if (updateError) {
          console.error('Error reactivating subscription:', updateError);
          return NextResponse.json(
            { success: false, error: 'An error occurred. Please try again.' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: "Thanks! We'll be in touch when we launch the newsletter.",
        });
      }
    }

    // Insert new subscription
    const { error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert([{
        email: trimmedEmail,
        status: 'active',
        source: 'footer_form',
        ip_address: ip,
        user_agent: userAgent,
      }]);

    if (insertError) {
      console.error('Error inserting subscription:', insertError);

      // Check if it's a duplicate error (race condition)
      if (insertError.code === '23505') {
        return NextResponse.json(
          { success: false, error: "You're already subscribed!" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { success: false, error: 'An error occurred. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Thanks! We'll be in touch when we launch the newsletter.",
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
