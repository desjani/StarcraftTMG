/**
 * Fetch live roster data for all three test seeds and save as JSON fixture files.
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

/** Terran, Zerg, and Protoss representative seeds. */
export const TEST_SEEDS = [
  { seed: 'VNIEMU', faction: 'Terran'  },
  { seed: 'IWMZ7C', faction: 'Zerg'    },
  { seed: 'TTPIBA', faction: 'Protoss' },
];

/**
 * Fetch all three seeds from the Firestore REST API and write them to
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
