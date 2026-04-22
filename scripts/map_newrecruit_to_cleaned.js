// This script is for mapping TTPIBA-NR.json (NewRecruit export) to the cleaned seed format for comparison.
// Run with: node scripts/map_newrecruit_to_cleaned.js TTPIBA-NR.json TTPIBA-NR-mapped.json


import { readFileSync, writeFileSync } from 'fs';

// Load canonical data for units and tactical cards
const armyUnits = JSON.parse(readFileSync('data/army_units_object.json', 'utf8'));
const tacticalCards = JSON.parse(readFileSync('data/tactical_cards_object.json', 'utf8'));

function normalizeName(str) {
  // Lowercase, replace non-alphanum with _, collapse multiple _
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function parseCountAndName(name) {
  // e.g. "3 Zealots" => { count: 3, name: "Zealot" }
  const match = name.match(/^(\d+)\s+([A-Za-z ]+)/);
  if (match) {
    return { count: parseInt(match[1], 10), name: match[2].trim().replace(/s$/, '') };
  }
  return { count: 1, name: name.trim() };
}

function getSlotValue(costs, slot, positive) {
  let sum = 0;
  for (const c of costs) {
    if (c.name && c.name.trim().toLowerCase() === slot.toLowerCase()) {
      if ((positive && c.value > 0) || (!positive && c.value < 0)) {
        sum += Math.abs(c.value);
      }
    }
  }
  return sum;
}

function main() {
  const [,, inputArg, outputArg] = process.argv;
  const input = inputArg || 'TTPIBA-NR.json';
  const output = outputArg || 'TTPIBA-NR-mapped.json';
  const raw = JSON.parse(readFileSync(input, 'utf8'));
  const roster = raw.roster;
  const force = roster.forces[0];
  const selections = force.selections;

  // Faction
  const faction = force.catalogueName || 'Protoss';

  // Faction Card ID (normalize)
  let factionCardId = '';
  for (const sel of selections) {
    if (sel.categories && sel.categories.some(cat => cat.name === 'Faction')) {
      factionCardId = normalizeName(sel.name);
      break;
    }
  }

  // Limits and Used
  const mineralsLimit = roster.costLimits.find(l => l.name.trim().toLowerCase() === 'minerals')?.value || 0;
  const gasLimit = roster.costLimits.find(l => l.name.trim().toLowerCase() === 'gas')?.value || 0;
  const mineralsUsed = roster.costs.find(c => c.name.trim().toLowerCase() === 'minerals')?.value || 0;
  const gasUsed = roster.costs.find(c => c.name.trim().toLowerCase() === 'gas')?.value || 0;

  // (removed old slot/resource logic; replaced by new logic below)

  // Units (resolve canonical names)
  const units = selections.filter(sel => sel.type === 'unit').map(sel => {
    const { count, name: rawName } = parseCountAndName(sel.name);
    let canonicalName = rawName;
    let canonicalId = sel.id;
    let found = false;
    let bestMatch = null;
    let bestMatchScore = 0;

    // Try exact match first
    for (const faction of Object.values(armyUnits)) {
      for (const [unitName, unitObj] of Object.entries(faction)) {
        if (
          unitName.toLowerCase() === rawName.toLowerCase() ||
          (unitObj.name && unitObj.name.toLowerCase() === rawName.toLowerCase())
        ) {
          canonicalName = unitObj.name;
          canonicalId = unitObj.id;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    // If not found, try improved fuzzy/keyword/parenthetical match
    if (!found) {
      const normRaw = rawName.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const rawTokens = normRaw.split(' ').filter(Boolean);
      let bestModelCountMatch = false;
      for (const faction of Object.values(armyUnits)) {
        for (const [unitName, unitObj] of Object.entries(faction)) {
          const normCanon = (unitObj.name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
          const canonTokens = normCanon.split(' ').filter(Boolean);
          // Score: all tokens present, then substring, then keyword, then parenthetical
          let score = 0;
          const allTokensPresent = rawTokens.every(t => canonTokens.includes(t));
          if (allTokensPresent) score = 120;
          else if (normCanon === normRaw) score = 100;
          else if (normCanon.includes(normRaw)) score = 80;
          else if ((unitObj.keywords || '').toLowerCase().includes(normRaw)) score = 60;
          else if (normCanon.replace(/\(.*\)/, '').trim() === normRaw) score = 50;
          // Prefer matching model count if available
          let modelCountMatch = false;
          if (unitObj.small && unitObj.small.models && count && Number(unitObj.small.models) === count) {
            score += 10;
            modelCountMatch = true;
          }
          if (
            score > bestMatchScore ||
            (score === bestMatchScore && modelCountMatch && !bestModelCountMatch)
          ) {
            bestMatch = unitObj;
            bestMatchScore = score;
            bestModelCountMatch = modelCountMatch;
          }
        }
      }
      if (bestMatch) {
        canonicalName = bestMatch.name;
        canonicalId = bestMatch.id;
        found = true;
      }
    }

    // Size: check for sub-selection named "Reinforce"
    let size = 'small';
    if (sel.selections && sel.selections.some(s => s.name && s.name.toLowerCase() === 'reinforce')) {
      size = 'large';
    }
    // Purchased upgrades: sub-selections of type 'upgrade', ignore 'Reinforce'
    let purchasedUpgrades = [];
    if (sel.selections) {
      purchasedUpgrades = sel.selections
        .filter(s => s.type === 'upgrade' && s.name.toLowerCase() !== 'reinforce')
        .map(s => s.name)
        .filter((v, i, arr) => arr.indexOf(v) === i); // dedupe
    }
    return {
      id: canonicalId,
      name: canonicalName,
      uid: sel.entryId,
      count,
      size,
      purchasedUpgrades
    };
  });

  // Tactical cards (resolve canonical IDs)
  const tacticalCardsList = selections.filter(sel => sel.categories && sel.categories.some(cat => cat.name === 'Tactical')).map(sel => {
    // Try to resolve by name in tacticalCards
    let best = sel.name;
    let bestId = normalizeName(sel.name);
    for (const faction of Object.values(tacticalCards)) {
      for (const [cardName, cardObj] of Object.entries(faction)) {
        if (
          cardName.toLowerCase() === sel.name.toLowerCase() ||
          (cardObj.name && cardObj.name.toLowerCase() === sel.name.toLowerCase())
        ) {
          best = cardObj.name;
          bestId = cardObj.id;
          break;
        }
      }
    }
    return bestId;
  });

  // Resource total: (number of tactical cards) + 1
  // Remove any previous resourceTotal declaration above this point
  const resourceTotal = tacticalCardsList.length + 1;

  // Slot logic
  // Slot names to normalize (strip/replace whitespace)
  const slotNames = ['Core', 'Elite', 'Support', 'Hero', 'Air'];
  function normalizeSlotName(name) {
    return name.replace(/\s+/g, '').toLowerCase();
  }
  // Initialize slot tallies
  let slotsAvailable = { Core: 0, Elite: 0, Support: 0, Hero: 0, Air: 0 };
  let slotsUsed = { Core: 0, Elite: 0, Support: 0, Hero: 0, Air: 0 };
  // Helper to process a costs array
  function processCosts(costs) {
    if (!Array.isArray(costs)) return;
    for (const cost of costs) {
      if (!cost.name || typeof cost.value !== 'number') continue;
      const norm = normalizeSlotName(cost.name);
      for (const slot of slotNames) {
        if (norm === slot.toLowerCase()) {
          if (cost.value > 0) slotsAvailable[slot] += cost.value;
          if (cost.value < 0) slotsUsed[slot] += Math.abs(cost.value);
        }
      }
    }
  }
  // Walk all selections recursively
  function walkSelections(selections) {
    if (!Array.isArray(selections)) return;
    for (const sel of selections) {
      if (sel.costs) processCosts(sel.costs);
      if (sel.selections) walkSelections(sel.selections);
    }
  }
  walkSelections(selections);

  // Output
  // Generate 7-character seed for id
  // Prefer to use the 7-character seed from the NewRecruit source if present, else generate one prefixed with 'N'
  function getSeedIdFromSource(raw) {
    // Try to find a 7-character id starting with N in the source
    if (raw && raw.roster && typeof raw.roster.id === 'string' && /^N[A-Z0-9]{6}$/.test(raw.roster.id)) {
      return raw.roster.id;
    }
    // Fallback: generate one prefixed with N
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'N';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  const cleaned = {
    id: getSeedIdFromSource(raw),
    createdAt: new Date().toISOString(),
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
    tacticalCards: tacticalCardsList,
    missions: []
  };
  writeFileSync(output, JSON.stringify(cleaned, null, 2));
}

main();
