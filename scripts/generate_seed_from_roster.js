// Script to generate a cleaned SEED JSON from a raw roster export (e.g., TTPIBA-raw.json)
// Output: TTPIBA-seed.json

import { readFileSync, writeFileSync } from 'fs';

const [,, inputArg, outputArg] = process.argv;
const INPUT_PATH = inputArg || 'TTPIBA-raw.json';
const OUTPUT_PATH = outputArg || 'TTPIBA-seed.json';

function extractFirestoreValue(val) {
  if (val == null) return null;
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
  if (val.doubleValue !== undefined) return val.doubleValue;
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.timestampValue !== undefined) return val.timestampValue;
  if (val.arrayValue !== undefined) {
    const arr = val.arrayValue.values || [];
    return arr.map(extractFirestoreValue);
  }
  if (val.mapValue !== undefined) {
    const obj = {};
    const fields = val.mapValue.fields || {};
    for (const k in fields) {
      obj[k] = extractFirestoreValue(fields[k]);
    }
    return obj;
  }
  return val;
}

function main() {
  const raw = JSON.parse(readFileSync(INPUT_PATH, 'utf8'));
  let state;
  if (raw.fields && raw.fields.state) {
    // Firestore export format
    state = extractFirestoreValue(raw.fields.state);
  } else if (raw.state) {
    // Already plain object
    state = raw.state;
  } else {
    throw new Error('Unrecognized roster format: missing state');
  }
  const out = {
    faction: state.faction,
    factionCardId: state.factionCardId,
    mineralsLimit: state.mineralsLimit,
    gasLimit: state.gasLimit,
    slotsAvailable: state.slotsAvailable,
    gasUsed: state.gasUsed,
    mineralsUsed: state.mineralsUsed,
    slotsUsed: state.slotsUsed,
    resourceTotal: state.resourceTotal,
    units: [],
    tacticalCards: state.tacticalCardIds || [],
    missions: state.missionIds || []
  };
  // Roster units
  for (const unit of state.roster) {
    // All selected upgrades (by name)
    const upgrades = (unit.activeUpgrades || []).map(idx => {
      if (typeof idx === 'number' && unit.availableUpgrades && unit.availableUpgrades[idx]) {
        return unit.availableUpgrades[idx].name;
      }
      if (typeof idx === 'object' && idx.name) return idx.name;
      return idx;
    }).filter(Boolean);
    // Purchased upgrades: selected AND nonzero cost
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
  writeFileSync(OUTPUT_PATH, JSON.stringify(out, null, 2));
  console.log('SEED JSON written to', OUTPUT_PATH);
}

main();
