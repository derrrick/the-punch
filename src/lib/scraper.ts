import puppeteer from 'puppeteer';

export interface ScrapedMetadata {
  title?: string;
  description?: string;
  screenshot?: string; // base64 data URL
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
  favicon?: string;
  ogImage?: string;
}

export async function scrapeFoundryWebsite(url: string): Promise<ScrapedMetadata> {
  let browser;

  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Set viewport for consistent screenshots
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to the page
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait a bit for fonts and images to load
    await page.waitForTimeout(2000);

    // Extract metadata
    const metadata = await page.evaluate(() => {
      const getMetaContent = (name: string) => {
        const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        return meta?.getAttribute('content') || undefined;
      };

      const findSocialLink = (pattern: RegExp) => {
        const links = Array.from(document.querySelectorAll('a[href]'));
        const match = links.find(link => pattern.test(link.getAttribute('href') || ''));
        return match?.getAttribute('href') || undefined;
      };

      return {
        title: document.title || getMetaContent('og:title'),
        description: getMetaContent('description') || getMetaContent('og:description'),
        ogImage: getMetaContent('og:image'),
        favicon: (document.querySelector('link[rel*="icon"]') as HTMLLinkElement)?.href,
        socialMedia: {
          instagram: findSocialLink(/instagram\.com\/([^\/\?]+)/),
          twitter: findSocialLink(/twitter\.com\/([^\/\?]+)|x\.com\/([^\/\?]+)/),
          facebook: findSocialLink(/facebook\.com\/([^\/\?]+)/),
        },
      };
    });

    // Take screenshot
    const screenshot = await page.screenshot({
      encoding: 'base64',
      fullPage: false, // Just viewport
      type: 'jpeg',
      quality: 80,
    });

    await browser.close();

    return {
      ...metadata,
      screenshot: `data:image/jpeg;base64,${screenshot}`,
    };
  } catch (error) {
    console.error('Error scraping website:', error);

    if (browser) {
      await browser.close();
    }

    // Return partial data on error
    return {
      title: undefined,
      description: undefined,
    };
  }
}

// Helper to extract Instagram username from URL
export function extractInstagramUsername(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/instagram\.com\/([^\/\?]+)/);
  return match ? match[1] : null;
}

// Helper to extract Twitter/X username from URL
export function extractTwitterUsername(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:twitter|x)\.com\/([^\/\?]+)/);
  return match ? match[1] : null;
}
