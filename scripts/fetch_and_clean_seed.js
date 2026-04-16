// Script: fetch_and_clean_seed.js
// Usage: node scripts/fetch_and_clean_seed.js <SEED> <OUTPUT_PATH>
// Fetches a live roster by seed using the Firestore API, cleans it, and outputs minimal SEED JSON.

import { fetchRoster } from '../lib/firestoreClient.js';
import { writeFileSync } from 'fs';

async function main() {
  const [,, seed, outputPath] = process.argv;
  if (!seed) throw new Error('Usage: node scripts/fetch_and_clean_seed.js <SEED> <OUTPUT_PATH>');
  const cleanedSeed = await fetchRoster(seed);
  writeFileSync(outputPath, JSON.stringify(cleanedSeed, null, 2));
  console.log('SEED JSON written to', outputPath);
}

main().catch(e => { console.error(e); process.exit(1); });
