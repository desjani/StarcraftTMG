/**
 * Fetch live roster data for all test seeds and save as JSON fixture files.
 *
 * Usage:
 *   node tests/capture-fixtures.mjs
 *
 * Or imported and called programmatically (e.g. by run.mjs when fixtures are absent).
 */

import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { fetchRoster } from '../lib/firestoreClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

export const FIXTURE_DIR = join(__dirname, 'fixtures');

/** Baseline and worst-case seeds across all factions. */
export const TEST_SEEDS = [
  { seed: 'VNIEMU', faction: 'Terran'  },
  { seed: 'IWMZ7C', faction: 'Zerg'    },
  { seed: 'TTPIBA', faction: 'Protoss' },
  { seed: '58WS1N', faction: 'Terran'  },
  { seed: 'KPKC0V', faction: 'Zerg'    },
  { seed: 'U093PL', faction: 'Protoss' },
];

/**
 * Fetch all test seeds from the Firestore REST API and write them to
 * `tests/fixtures/<SEED>.json` as flattened documents.
 */
export async function captureFixtures() {
  await mkdir(FIXTURE_DIR, { recursive: true });

  for (const { seed, faction } of TEST_SEEDS) {
    process.stdout.write(`  Fetching ${seed} (${faction})... `);
    try {
      const flat = await fetchRoster(seed);
      const dest = join(FIXTURE_DIR, `${seed}.json`);
      await writeFile(dest, JSON.stringify(flat, null, 2), 'utf8');
      console.log('saved.');
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
      throw err;
    }
  }

  console.log(`  All fixtures written to ${FIXTURE_DIR}`);
}

// ── Run standalone ────────────────────────────────────────────────────────────
if (process.argv[1] === __filename) {
  console.log('Capturing fixtures from Firestore...');
  captureFixtures().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
