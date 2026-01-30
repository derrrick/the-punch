#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Load newly inserted foundries
const jsonPath = join(__dirname, 'newly-inserted-foundries.json');
const newFoundries = JSON.parse(readFileSync(jsonPath, 'utf8'));

console.log(`📸 Processing screenshots for ${newFoundries.length} foundries\n`);

async function captureScreenshot(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait for fonts and images to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take screenshot
    const screenshot = await page.screenshot({
      encoding: 'base64',
      fullPage: false,
      type: 'jpeg',
      quality: 80,
    });

    await browser.close();
    return `data:image/jpeg;base64,${screenshot}`;
  } catch (error) {
    console.error(`  ⚠️  Screenshot failed: ${error.message}`);
    if (browser) await browser.close();
    return null;
  }
}

async function processFoundries() {
  let success = 0;
  let failed = 0;

  for (let i = 0; i < newFoundries.length; i++) {
    const foundry = newFoundries[i];
    console.log(`[${i + 1}/${newFoundries.length}] ${foundry.name}`);
    console.log(`  → ${foundry.url}`);

    try {
      // Capture screenshot
      const screenshotData = await captureScreenshot(foundry.url);

      if (!screenshotData) {
        console.log(`  ❌ Failed to capture screenshot`);
        failed++;
        continue;
      }

      // Update database with screenshot
      const { error } = await supabase
        .from('foundries')
        .update({ screenshot_url: screenshotData })
        .eq('id', foundry.id);

      if (error) {
        console.error(`  ❌ Failed to update database:`, error.message);
        failed++;
        continue;
      }

      console.log(`  ✅ Screenshot saved\n`);
      success++;
    } catch (error) {
      console.error(`  ❌ Error:`, error.message);
      failed++;
    }
  }

  console.log('\n📊 Screenshot Summary:');
  console.log(`   ✅ Success: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📝 Total: ${newFoundries.length}`);
}

console.log('🚀 Starting screenshot capture...\n');
await processFoundries();
console.log('\n✨ Screenshot capture complete!');
