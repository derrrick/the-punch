/**
 * Rollback Fixes CLI Script
 *
 * Reverts foundry data to a previous backup state.
 *
 * Usage:
 *   npx tsx scripts/rollback-fixes.ts --backup=<backup-id>
 *   npx tsx scripts/rollback-fixes.ts --backup=<backup-id> --dry-run
 *   npx tsx scripts/rollback-fixes.ts --list
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import * as readline from 'readline';

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'thepunch2026';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
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

// List available backups
async function listBackups(): Promise<void> {
  try {
    const response = await fetch(
      `${API_BASE}/api/admin/foundries/batch?password=${encodeURIComponent(ADMIN_PASSWORD)}`
    );

    if (!response.ok) {
      const data = await response.json();
      console.error(colorize(`Error: ${data.error || 'Failed to fetch backups'}`, 'red'));
      return;
    }

    const { backups } = await response.json();

    if (!backups || backups.length === 0) {
      console.log('No backups found.');
      return;
    }

    console.log(colorize('\nAvailable Backups:', 'bright'));
    console.log('─'.repeat(80));

    for (const backup of backups) {
      const date = new Date(backup.created_at).toLocaleString();
      const statusColor = backup.status === 'active' ? 'green' : backup.status === 'rolled_back' ? 'yellow' : 'dim';

      console.log(`\n${colorize(backup.id, 'cyan')}`);
      console.log(`  Created: ${date}`);
      console.log(`  Status: ${colorize(backup.status, statusColor)}`);
      console.log(`  Foundries: ${backup.foundry_count}`);
      console.log(`  Reason: ${backup.reason.substring(0, 60)}${backup.reason.length > 60 ? '...' : ''}`);
    }

    console.log('\n' + '─'.repeat(80));
    console.log(`\nTo rollback: npm run rollback-fixes -- --backup=<backup-id>`);
  } catch (err) {
    console.error(colorize(`Error: ${String(err)}`, 'red'));
  }
}

// Get backup details
async function getBackupDetails(backupId: string): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(
      `${API_BASE}/api/admin/foundries/rollback?password=${encodeURIComponent(ADMIN_PASSWORD)}&id=${encodeURIComponent(backupId)}`
    );

    if (!response.ok) {
      const data = await response.json();
      console.error(colorize(`Error: ${data.error || 'Failed to fetch backup'}`, 'red'));
      return null;
    }

    const { backup } = await response.json();
    return backup;
  } catch (err) {
    console.error(colorize(`Error: ${String(err)}`, 'red'));
    return null;
  }
}

// Perform rollback
async function performRollback(
  backupId: string,
  dryRun: boolean
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/admin/foundries/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: ADMIN_PASSWORD,
        backupId,
        dryRun,
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
  const backupArg = args.find((a) => a.startsWith('--backup='));
  const showList = args.includes('--list');
  const isDryRun = args.includes('--dry-run');
  const forceYes = args.includes('--yes') || args.includes('-y');

  console.log('\n' + colorize('═══════════════════════════════════════════════════════════', 'bright'));
  console.log(colorize('  Foundry Data Cleanup - Rollback', 'bright'));
  console.log(colorize('═══════════════════════════════════════════════════════════\n', 'bright'));

  // List backups
  if (showList) {
    await listBackups();
    process.exit(0);
  }

  // Require backup ID
  if (!backupArg) {
    console.error(colorize('Error: Please provide a backup ID with --backup=<id>', 'red'));
    console.log('\nUsage:');
    console.log('  npm run rollback-fixes -- --list                    # List available backups');
    console.log('  npm run rollback-fixes -- --backup=<backup-id>       # Rollback to backup');
    console.log('  npm run rollback-fixes -- --backup=<backup-id> --dry-run  # Preview rollback\n');
    process.exit(1);
  }

  const backupId = backupArg.split('=')[1];

  // Get backup details
  console.log(`Fetching backup: ${colorize(backupId, 'cyan')}...\n`);
  const backup = await getBackupDetails(backupId);

  if (!backup) {
    process.exit(1);
  }

  // Display backup info
  const snapshot = backup.snapshot as Array<Record<string, unknown>>;

  console.log(colorize('Backup Details:', 'bright'));
  console.log(`  ID: ${backup.id}`);
  console.log(`  Created: ${new Date(backup.created_at as string).toLocaleString()}`);
  console.log(`  Status: ${backup.status}`);
  console.log(`  Reason: ${backup.reason}`);
  console.log(`  Foundries: ${snapshot.length}`);

  if (backup.status === 'rolled_back') {
    console.log(colorize('\nThis backup has already been rolled back.', 'yellow'));
    process.exit(0);
  }

  if (backup.status === 'expired') {
    console.log(colorize('\nThis backup has expired and cannot be used.', 'red'));
    process.exit(1);
  }

  // Show foundries that would be restored
  console.log(`\n${colorize('Foundries to restore:', 'bright')}`);
  for (const f of snapshot.slice(0, 10)) {
    console.log(`  - ${f.name} (${f.slug})`);
  }
  if (snapshot.length > 10) {
    console.log(`  ... and ${snapshot.length - 10} more`);
  }

  // Dry run mode
  if (isDryRun) {
    console.log(colorize('\n[DRY RUN MODE]', 'yellow'));
    const result = await performRollback(backupId, true);

    if (result.success) {
      console.log(colorize('Dry run successful!', 'green'));
      console.log(`Would restore ${result.data?.foundryCount} foundries.`);
    } else {
      console.log(colorize(`Dry run failed: ${result.error}`, 'red'));
    }

    process.exit(result.success ? 0 : 1);
  }

  // Confirm rollback
  if (!forceYes) {
    const rl = createPrompt();
    console.log(colorize('\n⚠ WARNING: This will overwrite current foundry data!', 'yellow'));
    const answer = await ask(rl, `\nProceed with rollback? [y/N] > `);
    rl.close();

    if (answer !== 'y' && answer !== 'yes') {
      console.log('Aborted.');
      process.exit(0);
    }
  }

  // Perform rollback
  console.log('\nPerforming rollback...');
  const result = await performRollback(backupId, false);

  if (result.success && result.data) {
    console.log(colorize('\n✓ Rollback successful!', 'green'));
    console.log(`  Restored: ${result.data.restored}`);
    console.log(`  Failed: ${result.data.failed}`);
  } else {
    console.log(colorize(`\n✗ Rollback failed: ${result.error}`, 'red'));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
