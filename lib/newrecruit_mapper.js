// Browser-compatible NewRecruit mapping logic extracted from scripts/map_newrecruit_to_cleaned.js
// Only the mapping function, no CLI


function normalizeName(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function parseCountAndName(name) {
  const match = name.match(/^(\d+)\s+([A-Za-z ]+)/);
  if (match) {
    return { count: parseInt(match[1], 10), name: match[2].trim().replace(/s$/, '') };
  }
  return { count: 1, name: name.trim() };
}

// Async version for browser: fetch JSON data files
export async function mapNewRecruitToCleaned(raw) {
  let armyUnits, tacticalCards;
  if (typeof window !== 'undefined') {
    // Browser: fetch JSON files
    [armyUnits, tacticalCards] = await Promise.all([
      fetch('/data/army_units_object.json').then(r => r.json()),
      fetch('/data/tactical_cards_object.json').then(r => r.json())
    ]);
  } else {
    // Node: require JSON files
    armyUnits = require('../data/army_units_object.json');
    tacticalCards = require('../data/tactical_cards_object.json');
  }
  const roster = raw.roster;
  const force = roster.forces[0];
  const selections = force.selections;
  const faction = force.catalogueName || 'Protoss';
  let factionCardId = '';
  for (const sel of selections) {
    if (sel.categories && sel.categories.some(cat => cat.name === 'Faction')) {
      factionCardId = normalizeName(sel.name);
      break;
    }
  }
  const mineralsLimit = roster.costLimits.find(l => l.name.trim().toLowerCase() === 'minerals')?.value || 0;
  const gasLimit = roster.costLimits.find(l => l.name.trim().toLowerCase() === 'gas')?.value || 0;
  const mineralsUsed = roster.costs.find(c => c.name.trim().toLowerCase() === 'minerals')?.value || 0;
  const gasUsed = roster.costs.find(c => c.name.trim().toLowerCase() === 'gas')?.value || 0;
  const units = selections.filter(sel => sel.type === 'unit').map(sel => {
    const { count, name: rawName } = parseCountAndName(sel.name);
    let canonicalName = rawName;
    let canonicalId = sel.id;
    let found = false;
    let bestMatch = null;
    let bestMatchScore = 0;
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
    if (!found) {
      const normRaw = rawName.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const rawTokens = normRaw.split(' ').filter(Boolean);
      let bestModelCountMatch = false;
      for (const faction of Object.values(armyUnits)) {
        for (const [unitName, unitObj] of Object.entries(faction)) {
          const normCanon = (unitObj.name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
          const canonTokens = normCanon.split(' ').filter(Boolean);
          let score = 0;
          const allTokensPresent = rawTokens.every(t => canonTokens.includes(t));
          if (allTokensPresent) score = 120;
          else if (normCanon === normRaw) score = 100;
          else if (normCanon.includes(normRaw)) score = 80;
          else if ((unitObj.keywords || '').toLowerCase().includes(normRaw)) score = 60;
          else if (normCanon.replace(/\(.*\)/, '').trim() === normRaw) score = 50;
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
    let size = 'small';
    if (sel.selections && sel.selections.some(s => s.name && s.name.toLowerCase() === 'reinforce')) {
      size = 'large';
    }
    let purchasedUpgrades = [];
    if (sel.selections) {
      purchasedUpgrades = sel.selections
        .filter(s => s.type === 'upgrade' && s.name.toLowerCase() !== 'reinforce')
        .map(s => s.name)
        .filter((v, i, arr) => arr.indexOf(v) === i);
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
  const tacticalCardsList = selections.filter(sel => sel.categories && sel.categories.some(cat => cat.name === 'Tactical')).map(sel => {
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
  const resourceTotal = tacticalCardsList.length + 1;
  const slotNames = ['Core', 'Elite', 'Support', 'Hero', 'Air'];
  function normalizeSlotName(name) {
    return name.replace(/\s+/g, '').toLowerCase();
  }
  let slotsAvailable = { Core: 0, Elite: 0, Support: 0, Hero: 0, Air: 0 };
  let slotsUsed = { Core: 0, Elite: 0, Support: 0, Hero: 0, Air: 0 };
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
  function walkSelections(selections) {
    if (!Array.isArray(selections)) return;
    for (const sel of selections) {
      if (sel.costs) processCosts(sel.costs);
      if (sel.selections) walkSelections(sel.selections);
    }
  }
  walkSelections(selections);
  function getSeedIdFromSource(raw) {
    if (raw && raw.roster && typeof raw.roster.id === 'string' && /^N[A-Z0-9]{6}$/.test(raw.roster.id)) {
      return raw.roster.id;
    }
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'N';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  return {
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
}
