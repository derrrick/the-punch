/**
 * Apply Fixes CLI Script
 *
 * Interactive CLI for reviewing and applying high-confidence fixes
 * from validation reports.
 *
 * Usage:
 *   npx tsx scripts/apply-fixes.ts --report=validation-report-2026-02-04.json
 *   npx tsx scripts/apply-fixes.ts --report=validation-report-2026-02-04.json --dry-run
 *   npx tsx scripts/apply-fixes.ts --report=validation-report-2026-02-04.json --auto
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import * as fs from 'fs';
import * as readline from 'readline';

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'thepunch2026';

interface AutoFixItem {
  slug: string;
  field: string;
  currentValue: unknown;
  newValue: unknown;
  confidence: 'high';
  reasoning: string;
}

interface CleanupReport {
  meta: {
    generatedAt: string;
    totalFoundries: number;
    validated: number;
    errors: number;
    duration: number;
  };
  summary: {
    highConfidenceFixes: number;
    mediumConfidenceFixes: number;
    lowConfidenceFixes: number;
  };
  autoFixPlan: AutoFixItem[];
}

interface BatchUpdate {
  slug: string;
  changes: Record<string, unknown>;
  reason: string;
}

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

// Box drawing characters
const box = {
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
  teeLeft: '├',
  teeRight: '┤',
};

function drawBox(title: string, content: string[], width: number = 60): void {
  const horizontalLine = box.horizontal.repeat(width - 2);

  console.log(`${box.topLeft}${horizontalLine}${box.topRight}`);
  console.log(`${box.vertical} ${colorize(title.padEnd(width - 4), 'bright')} ${box.vertical}`);
  console.log(`${box.teeLeft}${horizontalLine}${box.teeRight}`);

  for (const line of content) {
    const displayLine = line.substring(0, width - 4);
    const padding = ' '.repeat(Math.max(0, width - 4 - displayLine.length));
    console.log(`${box.vertical} ${displayLine}${padding} ${box.vertical}`);
  }

  console.log(`${box.bottomLeft}${horizontalLine}${box.bottomRight}`);
}

// Group fixes by foundry
function groupByFoundry(fixes: AutoFixItem[]): Map<string, AutoFixItem[]> {
  const grouped = new Map<string, AutoFixItem[]>();
  for (const fix of fixes) {
    const existing = grouped.get(fix.slug) || [];
    existing.push(fix);
    grouped.set(fix.slug, existing);
  }
  return grouped;
}

// Format a fix for display
function formatFix(fix: AutoFixItem): string[] {
  const lines: string[] = [];
  lines.push(`  ${colorize(fix.field, 'cyan')}: "${fix.currentValue}" → "${fix.newValue}"`);
  if (fix.reasoning) {
    lines.push(`    ${colorize('Reason:', 'dim')} ${fix.reasoning}`);
  }
  return lines;
}

// Create readline interface for user input
function createPrompt(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

// Ask user a question and get response
async function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase().trim());
    });
  });
}

// Convert autoFixPlan to batch updates
function toBatchUpdates(fixes: AutoFixItem[]): BatchUpdate[] {
  const bySlug = groupByFoundry(fixes);
  const updates: BatchUpdate[] = [];

  for (const [slug, slugFixes] of bySlug) {
    const changes: Record<string, unknown> = {};
    const reasons: string[] = [];

    for (const fix of slugFixes) {
      changes[fix.field] = fix.newValue;
      reasons.push(`${fix.field}: ${fix.reasoning || 'high confidence'}`);
    }

    updates.push({
      slug,
      changes,
      reason: reasons.join('; '),
    });
  }

  return updates;
}

// Call batch API
async function applyBatchUpdates(
  updates: BatchUpdate[],
  dryRun: boolean
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/admin/foundries/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: ADMIN_PASSWORD,
        dryRun,
        updates,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Unknown error' };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const reportArg = args.find((a) => a.startsWith('--report='));
  const isDryRun = args.includes('--dry-run');
  const isAuto = args.includes('--auto');

  console.log('\n' + colorize('═══════════════════════════════════════════════════════════', 'bright'));
  console.log(colorize('  Foundry Data Cleanup - Apply Fixes', 'bright'));
  console.log(colorize('═══════════════════════════════════════════════════════════\n', 'bright'));

  if (!reportArg) {
    console.error(colorize('Error: Please provide a report file with --report=filename.json', 'red'));
    console.log('\nUsage:');
    console.log('  npm run apply-fixes -- --report=validation-report-2026-02-04.json');
    console.log('  npm run apply-fixes -- --report=validation-report-2026-02-04.json --dry-run');
    console.log('  npm run apply-fixes -- --report=validation-report-2026-02-04.json --auto\n');
    process.exit(1);
  }

  const reportPath = reportArg.split('=')[1];

  // Try both with and without ./ prefix
  const paths = [reportPath, `./${reportPath}`];
  let report: CleanupReport | null = null;

  for (const p of paths) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf-8');
        report = JSON.parse(content);
        console.log(`Loaded report: ${p}`);
        break;
      } catch (err) {
        console.error(`Failed to parse ${p}: ${err}`);
      }
    }
  }

  if (!report) {
    console.error(colorize(`Error: Could not find or parse report file: ${reportPath}`, 'red'));
    process.exit(1);
  }

  // Display report summary
  console.log(`\n${colorize('Report Summary:', 'bright')}`);
  console.log(`  Generated: ${report.meta.generatedAt}`);
  console.log(`  Foundries validated: ${report.meta.validated}/${report.meta.totalFoundries}`);
  console.log(`  High confidence fixes: ${colorize(String(report.summary.highConfidenceFixes), 'green')}`);
  console.log(`  Medium confidence: ${colorize(String(report.summary.mediumConfidenceFixes), 'yellow')}`);
  console.log(`  Low confidence: ${colorize(String(report.summary.lowConfidenceFixes), 'dim')}`);

  const fixes = report.autoFixPlan;

  if (fixes.length === 0) {
    console.log(colorize('\nNo high-confidence fixes to apply!', 'green'));
    process.exit(0);
  }

  // Group and display fixes
  const byFoundry = groupByFoundry(fixes);

  console.log(`\n${colorize('HIGH-CONFIDENCE FIXES', 'bright')} (${fixes.length} total across ${byFoundry.size} foundries):\n`);

  let index = 1;
  for (const [slug, slugFixes] of byFoundry) {
    console.log(`${colorize(`${index}.`, 'bright')} ${colorize(slug, 'cyan')}`);
    for (const fix of slugFixes) {
      const lines = formatFix(fix);
      lines.forEach((line) => console.log(line));
    }
    console.log('');
    index++;
  }

  // If dry-run, show what would be sent to API
  if (isDryRun) {
    console.log(colorize('\n[DRY RUN MODE]', 'yellow'));
    const updates = toBatchUpdates(fixes);

    console.log('\nBatch update payload:');
    console.log(JSON.stringify(updates, null, 2));

    console.log(`\nWould apply ${updates.length} updates to foundries.`);

    // Call API in dry-run mode to validate
    console.log('\nValidating with API...');
    const result = await applyBatchUpdates(updates, true);

    if (result.success) {
      console.log(colorize('Dry run successful!', 'green'));
      console.log(JSON.stringify(result.data, null, 2));
    } else {
      console.log(colorize(`Dry run failed: ${result.error}`, 'red'));
    }

    process.exit(0);
  }

  // Auto mode: apply without prompting
  if (isAuto) {
    console.log(colorize('\n[AUTO MODE] Applying all fixes...', 'yellow'));
    const updates = toBatchUpdates(fixes);
    const result = await applyBatchUpdates(updates, false);

    if (result.success && result.data) {
      console.log(colorize('\nFixes applied successfully!', 'green'));
      console.log(`  Applied: ${result.data.applied}`);
      console.log(`  Failed: ${result.data.failed}`);
      console.log(`  Backup ID: ${result.data.backupId}`);
      console.log(`\nTo rollback: ${result.data.rollbackCommand}`);
    } else {
      console.log(colorize(`\nFailed to apply fixes: ${result.error}`, 'red'));
      process.exit(1);
    }

    process.exit(0);
  }

  // Interactive mode
  const rl = createPrompt();

  console.log('Apply all high-confidence fixes?');
  const answer = await ask(rl, `[${colorize('y', 'green')}]es / [${colorize('n', 'red')}]o / [${colorize('r', 'cyan')}]eview each > `);

  if (answer === 'n' || answer === 'no') {
    console.log('Aborted.');
    rl.close();
    process.exit(0);
  }

  if (answer === 'r' || answer === 'review') {
    // Review each foundry
    const approved: AutoFixItem[] = [];

    for (const [slug, slugFixes] of byFoundry) {
      console.log(`\n${colorize(slug, 'bright')}:`);
      for (const fix of slugFixes) {
        const lines = formatFix(fix);
        lines.forEach((line) => console.log(line));
      }

      const response = await ask(rl, `Apply these ${slugFixes.length} fix(es)? [y/n/s(kip all)] > `);

      if (response === 's' || response === 'skip') {
        console.log('Skipping remaining reviews...');
        break;
      }

      if (response === 'y' || response === 'yes') {
        approved.push(...slugFixes);
        console.log(colorize('Approved.', 'green'));
      } else {
        console.log(colorize('Skipped.', 'yellow'));
      }
    }

    if (approved.length === 0) {
      console.log('\nNo fixes approved. Exiting.');
      rl.close();
      process.exit(0);
    }

    console.log(`\n${approved.length} fix(es) approved. Applying...`);
    const updates = toBatchUpdates(approved);
    const result = await applyBatchUpdates(updates, false);

    if (result.success && result.data) {
      console.log(colorize('\nFixes applied successfully!', 'green'));
      console.log(`  Applied: ${result.data.applied}`);
      console.log(`  Failed: ${result.data.failed}`);
      console.log(`  Backup ID: ${result.data.backupId}`);
      console.log(`\nTo rollback: ${result.data.rollbackCommand}`);
    } else {
      console.log(colorize(`\nFailed to apply fixes: ${result.error}`, 'red'));
    }

    rl.close();
    process.exit(result.success ? 0 : 1);
  }

  // Apply all
  console.log('\nCreating backup and applying fixes...');
  const updates = toBatchUpdates(fixes);
  const result = await applyBatchUpdates(updates, false);

  if (result.success && result.data) {
    console.log(colorize('\n✓ Fixes applied successfully!', 'green'));
    console.log(`  Applied: ${result.data.applied}`);
    console.log(`  Failed: ${result.data.failed}`);
    console.log(`  Backup ID: ${result.data.backupId}`);
    console.log(`\nTo rollback: ${result.data.rollbackCommand}`);
  } else {
    console.log(colorize(`\n✗ Failed to apply fixes: ${result.error}`, 'red'));
  }

  rl.close();
  process.exit(result.success ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
