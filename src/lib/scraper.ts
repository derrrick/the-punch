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
  homepageContent?: string;
  aboutContent?: string;
  typefaceListings?: string[];
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
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract metadata and content
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

      // Extract readable text content (remove scripts, styles, etc.)
      const getPageText = () => {
        const clone = document.body.cloneNode(true) as HTMLElement;
        // Remove unwanted elements
        clone.querySelectorAll('script, style, nav, header, footer').forEach(el => el.remove());
        return clone.innerText.trim().substring(0, 5000); // Limit to 5000 chars
      };

      // Try to find typeface/font listings
      const getTypefaceListings = () => {
        const listings: string[] = [];
        // Look for common patterns in foundry websites
        const selectors = [
          'a[href*="/font"]',
          'a[href*="/typeface"]',
          'a[href*="/family"]',
          '.font-name',
          '.typeface-name',
          '[class*="font-card"]',
          '[class*="typeface-card"]',
        ];

        selectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            const text = el.textContent?.trim();
            if (text && text.length > 2 && text.length < 50) {
              listings.push(text);
            }
          });
        });

        return [...new Set(listings)].slice(0, 20); // Unique, max 20
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
        homepageContent: getPageText(),
        typefaceListings: getTypefaceListings(),
      };
    });

    // Take screenshot
    const screenshot = await page.screenshot({
      encoding: 'base64',
      fullPage: false, // Just viewport
      type: 'jpeg',
      quality: 80,
    });

    // Try to find and scrape About page
    let aboutContent: string | undefined;
    try {
      const aboutLink = await page.evaluate(() => {
        const patterns = [/about/i, /info/i, /studio/i, /us/i];
        const links = Array.from(document.querySelectorAll('a[href]'));

        for (const pattern of patterns) {
          const match = links.find(link => {
            const href = link.getAttribute('href') || '';
            const text = link.textContent || '';
            return pattern.test(href) || pattern.test(text);
          });

          if (match) {
            return match.getAttribute('href');
          }
        }
        return null;
      });

      if (aboutLink) {
        const aboutUrl = new URL(aboutLink, url).href;
        console.log(`  → Found About page: ${aboutUrl}`);

        await page.goto(aboutUrl, {
          waitUntil: 'networkidle0',
          timeout: 15000,
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        aboutContent = await page.evaluate(() => {
          const clone = document.body.cloneNode(true) as HTMLElement;
          clone.querySelectorAll('script, style, nav, header, footer').forEach(el => el.remove());
          return clone.innerText.trim().substring(0, 3000);
        });
      }
    } catch (error) {
      console.log('  → Could not scrape About page (non-critical)');
    }

    await browser.close();

    return {
      ...metadata,
      screenshot: `data:image/jpeg;base64,${screenshot}`,
      aboutContent,
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
