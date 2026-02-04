import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'thepunch2026';

interface ProgressUpdate {
  current: number;
  total: number;
  currentFoundry: string;
  status: 'in_progress' | 'completed' | 'error';
  successCount: number;
  failedCount: number;
  message?: string;
}

// Store progress in memory (for polling)
const progressStore = new Map<string, ProgressUpdate>();

async function captureScreenshot(url: string): Promise<string | null> {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait for fonts and images to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    const screenshot = await page.screenshot({
      encoding: 'base64',
      fullPage: false,
      type: 'jpeg',
      quality: 80,
    });

    await browser.close();
    return `data:image/jpeg;base64,${screenshot}`;
  } catch (error) {
    console.error(`Screenshot failed for ${url}:`, error);
    if (browser) await browser.close();
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, slugs } = body;

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch foundries to scrape
    let query = supabase.from('foundries').select('id, name, slug, url');

    if (slugs && slugs.length > 0) {
      query = query.in('slug', slugs);
    }

    const { data: foundries, error } = await query.order('name');

    if (error || !foundries) {
      return NextResponse.json({ error: 'Failed to fetch foundries' }, { status: 500 });
    }

    // Generate a job ID for progress tracking
    const jobId = `scrape_${Date.now()}`;

    // Initialize progress
    progressStore.set(jobId, {
      current: 0,
      total: foundries.length,
      currentFoundry: '',
      status: 'in_progress',
      successCount: 0,
      failedCount: 0,
    });

    // Start the scraping process in the background
    (async () => {
      let successCount = 0;
      let failedCount = 0;
      const results: { slug: string; success: boolean; error?: string }[] = [];

      for (let i = 0; i < foundries.length; i++) {
        const foundry = foundries[i];

        progressStore.set(jobId, {
          current: i + 1,
          total: foundries.length,
          currentFoundry: foundry.name,
          status: 'in_progress',
          successCount,
          failedCount,
        });

        try {
          const screenshotData = await captureScreenshot(foundry.url);

          if (screenshotData) {
            const { error: updateError } = await supabase
              .from('foundries')
              .update({
                screenshot_url: screenshotData,
                updated_at: new Date().toISOString()
              })
              .eq('id', foundry.id);

            if (updateError) {
              results.push({ slug: foundry.slug, success: false, error: updateError.message });
              failedCount++;
            } else {
              results.push({ slug: foundry.slug, success: true });
              successCount++;
            }
          } else {
            results.push({ slug: foundry.slug, success: false, error: 'Failed to capture screenshot' });
            failedCount++;
          }
        } catch (err) {
          results.push({ slug: foundry.slug, success: false, error: String(err) });
          failedCount++;
        }

        // Small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Mark as completed
      progressStore.set(jobId, {
        current: foundries.length,
        total: foundries.length,
        currentFoundry: '',
        status: 'completed',
        successCount,
        failedCount,
        message: `Completed: ${successCount} success, ${failedCount} failed`,
      });

      // Clean up progress after 5 minutes
      setTimeout(() => progressStore.delete(jobId), 5 * 60 * 1000);
    })();

    return NextResponse.json({
      success: true,
      jobId,
      message: `Started scraping ${foundries.length} foundries`,
      foundryCount: foundries.length,
    });
  } catch (error) {
    console.error('Rescrape error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to check progress
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  const password = searchParams.get('password');

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  }

  const progress = progressStore.get(jobId);

  if (!progress) {
    return NextResponse.json({ error: 'Job not found or expired' }, { status: 404 });
  }

  return NextResponse.json(progress);
}
