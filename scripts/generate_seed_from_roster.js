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
  let out = null;

  // Firestore or plain object
  if (raw.fields && raw.fields.state) {
    // Firestore export format
    const state = extractFirestoreValue(raw.fields.state);
    out = {
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
    for (const unit of state.roster) {
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
  } else if (raw.state) {
    // Already plain object
    const state = raw.state;
    out = {
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
    for (const unit of state.roster) {
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
  } else if (raw.roster && raw.roster.forces && Array.isArray(raw.roster.forces)) {
    // NewRecruit JSON export
    // Map NewRecruit fields to cleaned seed format
    const roster = raw.roster;
    // Faction and card: try to infer from first force or selection if possible
    let faction = roster.faction || '';
    let factionCardId = '';
    // Try to infer from first selection if not present
    if (!faction && roster.forces[0]?.selections[0]?.name) {
      faction = roster.forces[0].selections[0].name;
    }
    // Cost limits
    let mineralsLimit = 0, gasLimit = 0;
    for (const lim of roster.costLimits || []) {
      if (lim.name.trim().toLowerCase() === 'minerals') mineralsLimit = lim.value;
      if (lim.name.trim().toLowerCase() === 'gas') gasLimit = lim.value;
    }
    // Used costs
    let mineralsUsed = 0, gasUsed = 0;
    for (const c of roster.costs || []) {
      if (c.name.trim().toLowerCase() === 'minerals') mineralsUsed = c.value;
      if (c.name.trim().toLowerCase() === 'gas') gasUsed = c.value;
    }
    // Slots
    let slotsAvailable = {}, slotsUsed = {};
    // Try to infer from costLimits/costs with slot names
    for (const lim of roster.costLimits || []) {
      const n = lim.name.trim();
      if (!['minerals','gas'].includes(n.toLowerCase())) slotsAvailable[n] = lim.value;
    }
    for (const c of roster.costs || []) {
      const n = c.name.trim();
      if (!['minerals','gas'].includes(n.toLowerCase())) slotsUsed[n] = c.value;
    }
    // Units
    let units = [];
    for (const force of roster.forces) {
      for (const sel of force.selections || []) {
        // Only include selections that look like units (have id, name, count, etc)
        if (sel.id && sel.name) {
          units.push({
            id: sel.id,
            name: sel.name,
            uid: sel.uid || null,
            count: sel.models || sel.count || 1,
            size: sel.size || 'small',
            purchasedUpgrades: sel.purchasedUpgrades || [],
          });
        }
      }
    }
    // Resource total: fallback to units.length if not present
    const resourceTotal = typeof roster.resourceTotal === 'number' ? roster.resourceTotal : units.length;
    out = {
      faction,
      factionCardId,
      mineralsLimit,
      gasLimit,
      slotsAvailable,
      gasUsed,
      mineralsUsed,
      slotsUsed,
      resourceTotal,
      units,
      tacticalCards: roster.tacticalCards || [],
      missions: roster.missions || []
    };
  } else {
    throw new Error('Unrecognized roster format: missing state or roster');
  }
  writeFileSync(OUTPUT_PATH, JSON.stringify(out, null, 2));
  console.log('SEED JSON written to', OUTPUT_PATH);
}

main();
