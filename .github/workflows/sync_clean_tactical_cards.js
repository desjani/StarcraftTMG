// Script to fetch and clean tactical_cards from Firestore API
// Outputs to /data/tactical_cards_cleaned.json

import fetch from 'node-fetch';
import { writeFileSync, mkdirSync } from 'fs';

const TACTICAL_CARDS_URL = 'https://firestore.googleapis.com/v1/projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/tactical_cards?key=AIzaSyDHRhS4FIO_1s_2Tn2C77noJRgbs-y_mks';
const OUTPUT_PATH = 'data/tactical_cards_cleaned.json';

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

function parseBoost(boost) {
  // boost: { name, description }
  const result = { name: boost.name };
  const desc = boost.description || '';
  // Remove leading card name if present
  let rest = desc;
  if (desc.startsWith(boost.name)) {
    rest = desc.slice(boost.name.length).trim();
  }
  // Extract <time> and <phase>
  const timeMatch = rest.match(/^<([^>]+)>/i);
  if (timeMatch) {
    result.time = timeMatch[1].trim();
    rest = rest.slice(timeMatch[0].length).trim();
  }
  const phaseMatch = rest.match(/^<([^>]+)>/i);
  if (phaseMatch) {
    result.phase = phaseMatch[1].trim();
    rest = rest.slice(phaseMatch[0].length).trim();
  }
  // Extract description after ':'
  const colonIdx = rest.indexOf(':');
  if (colonIdx !== -1) {
    result.description = rest.slice(colonIdx + 1).trim();
  } else {
    result.description = rest.trim();
  }
  return result;
}

function cleanFirestoreTacticalCards(raw) {
  const docs = raw.documents || [];
  return docs.map(doc => {
    const f = doc.fields;
    const card = {};
    for (const key in f) {
      card[key] = extractFirestoreValue(f[key]);
    }
    card.id = card.id || doc.name.split('/').pop();
    // Parse boosts if present
    if (Array.isArray(card.boosts)) {
      card.boosts = card.boosts.map(parseBoost);
    }
    return card;
  });
}


async function main() {
  const res = await fetch(TACTICAL_CARDS_URL);
  if (!res.ok) throw new Error('Failed to fetch tactical_cards: ' + res.status);
  const raw = await res.json();
  const cleaned = cleanFirestoreTacticalCards(raw);

  // Group by faction and flatten
  const factions = {};
  for (const card of cleaned) {
    const faction = card.faction || 'Other';
    if (!factions[faction]) factions[faction] = [];
    factions[faction].push(card);
  }
  // Flatten into a single array, sorted by faction
  const outArr = [];
  for (const faction of Object.keys(factions)) {
    outArr.push(...factions[faction]);
  }
  mkdirSync('data', { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(outArr, null, 2));
  console.log('tactical_cards_cleaned.json written to /data.');
}

main().catch(e => { console.error(e); process.exit(1); });
