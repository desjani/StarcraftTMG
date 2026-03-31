/**
 * Test runner for StarCraft TMG.
 *
 * Usage:
 *   node tests/run.mjs
 *
 * Behaviour:
 *   1. If fixture files are absent, fetches them from the live Firestore API.
 *   2. Runs all test suites, collecting pass/fail counts.
 *   3. Exits with code 1 if any test failed.
 */

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = join(__dirname, 'fixtures');
const SEEDS       = ['VNIEMU', 'IWMZ7C', 'TTPIBA'];

// ── Auto-capture fixtures if missing ─────────────────────────────────────────

const fixturesMissing = SEEDS.some(
  s => !existsSync(join(FIXTURE_DIR, `${s}.json`))
);

if (fixturesMissing) {
  console.log('\nFixtures not found. Fetching from Firestore...');
  const { captureFixtures } = await import('./capture-fixtures.mjs');
  await captureFixtures();
  console.log();
}

// ── Minimal test harness ──────────────────────────────────────────────────────

let passed   = 0;
let failed   = 0;
let current  = '';

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`      → ${err.message}`);
    failed++;
  }
}

// ── Run suites ────────────────────────────────────────────────────────────────

const SUITES = [
  { label: 'Parser',    path: './parser.test.mjs'    },
  { label: 'Formatter', path: './formatter.test.mjs' },
  { label: 'App Utils', path: './app-utils.test.mjs' },
];

for (const { label, path } of SUITES) {
  console.log(`\n── ${label} tests ──────────────────────────────────────────`);
  try {
    const mod = await import(path);
    await mod.run({ test });
  } catch (err) {
    console.log(`  ✗ [suite error] ${err.message}`);
    failed++;
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(55)}`);
const colour = failed > 0 ? '\x1b[31m' : '\x1b[32m';
const reset  = '\x1b[0m';
console.log(`${colour}${passed} passed, ${failed} failed${reset}`);

if (failed > 0) process.exit(1);
