// Script to generate a deeply object-mapped tactical_cards.json from the cleaned array
// Output: /data/tactical_cards_object.json

import fetch from 'node-fetch';
import { writeFileSync, mkdirSync } from 'fs';

const API_URL = 'https://firestore.googleapis.com/v1/projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/tactical_cards?key=AIzaSyDHRhS4FIO_1s_2Tn2C77noJRgbs-y_mks';
const OUTPUT_PATH = 'data/tactical_cards_object.json';

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

function normalizeFaction(card) {
  if (card.faction === "Kerrigan's Swarm" || (Array.isArray(card.factionTags) && card.factionTags.includes("Kerrigan's Swarm"))) {
    return 'Zerg';
  }
  return card.faction || 'Other';
}

async function main() {
  const res = await fetch(API_URL);
  const apiRaw = await res.json();
  const docs = apiRaw.documents || [];
  const raw = docs.map(doc => {
    const f = doc.fields;
    const card = {};
    for (const key in f) card[key] = extractFirestoreValue(f[key]);
    return card;
  });
  // Map: faction -> card name -> card object
  const out = {};
  const factionCards = {};
  for (const card of raw) {
    if (card.isFactionCard) {
      const faction = normalizeFaction(card);
      if (!factionCards[faction]) factionCards[faction] = {};
      factionCards[faction][card.name] = card;
    } else {
      const faction = normalizeFaction(card);
      if (!out[faction]) out[faction] = {};
      out[faction][card.name] = card;
    }
  }
  const finalOut = { ...out };
  if (Object.keys(factionCards).length > 0) {
    finalOut["Faction Cards"] = factionCards;
  }
  mkdirSync('data', { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(finalOut, null, 2));
  console.log('tactical_cards_object.json written to /data (by faction, Faction Cards separated, direct from API).');
}

main();
