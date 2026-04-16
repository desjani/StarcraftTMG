// Script: fetch_and_clean_seed.js
// Usage: node scripts/fetch_and_clean_seed.js <SEED> <OUTPUT_PATH>
// Fetches a live roster by seed using the Firestore API, cleans it, and outputs minimal SEED JSON.

import { fetchRoster } from '../lib/firestoreClient.js';
import { writeFileSync } from 'fs';

async function main() {
  const [,, seed, outputPath] = process.argv;
  if (!seed) throw new Error('Usage: node scripts/fetch_and_clean_seed.js <SEED> <OUTPUT_PATH>');
  const flat = await fetchRoster(seed);
  // Minimal clean SEED JSON: only purchased upgrades, core info
  const s = flat.state || {};
  const out = {
    faction: s.faction,
    factionCardId: s.factionCardId,
    mineralsLimit: s.mineralsLimit,
    gasLimit: s.gasLimit,
    slotsAvailable: s.slotsAvailable,
    gasUsed: s.gasUsed,
    mineralsUsed: s.mineralsUsed,
    slotsUsed: s.slotsUsed,
    resourceTotal: s.resourceTotal,
    units: [],
    tacticalCards: s.tacticalCardIds || [],
    missions: s.missionIds || []
  };
  for (const unit of s.roster || []) {
    const upgrades = (unit.activeUpgrades || []).map(idx => {
      if (typeof idx === 'number' && unit.availableUpgrades && unit.availableUpgrades[idx]) {
        return unit.availableUpgrades[idx].name;
      }
      if (typeof idx === 'object' && idx.name) return idx.name;
      return idx;
    }).filter(Boolean);
    const purchasedUpgrades = (unit.availableUpgrades || [])
      .filter((u, i) => upgrades.includes(u.name) && ((u.costS || u.costL) && (u.costS > 0 || u.costL > 0)))
      .map(u => u.name);
    out.units.push({
      id: unit.id,
      name: unit.name,
      uid: unit.uid,
      count: unit.models,
      size: unit.size,
      purchasedUpgrades,
    });
  }
  writeFileSync(outputPath, JSON.stringify(out, null, 2));
  console.log('SEED JSON written to', outputPath);
}

main().catch(e => { console.error(e); process.exit(1); });
