// GitHub Actions sync/clean/upload script
// Requires FIREBASE_SERVICE_ACCOUNT_JSON secret (service account with Storage admin)


import fetch from 'node-fetch';
import { Storage } from '@google-cloud/storage';
import { writeFileSync, mkdirSync } from 'fs';

const ARMY_UNITS_URL = 'https://firestore.googleapis.com/v1/projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units?key=AIzaSyDHRhS4FIO_1s_2Tn2C77noJRgbs-y_mks';
const RULES_SECTIONS_URL = 'https://firestore.googleapis.com/v1/projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/rules_sections?key=AIzaSyDHRhS4FIO_1s_2Tn2C77noJRgbs-y_mks';
const TACTICAL_CARDS_URL = 'https://firestore.googleapis.com/v1/projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/tactical_cards?key=AIzaSyDHRhS4FIO_1s_2Tn2C77noJRgbs-y_mks';
const OUTPUT_PATH_UNITS = 'data/army_units_cleaned.json';
const OUTPUT_PATH_RULES = 'data/rules_sections_cleaned.json';
const OUTPUT_PATH_TACTICAL = 'data/tactical_cards_cleaned.json';
// --- Tactical Cards Cleaning Logic ---
function parseBoost(boost) {
  const result = { name: boost.name };
  const desc = boost.description || '';
  let rest = desc;
  if (desc.startsWith(boost.name)) {
    rest = desc.slice(boost.name.length).trim();
  }
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
    if (Array.isArray(card.boosts)) {
      card.boosts = card.boosts.map(parseBoost);
    }
    return card;
  });
}

function cleanFirestoreDump(raw) {
  const docs = raw.documents || [];
  function getStr(f, field, fallback = '') {
    return f[field]?.stringValue ?? fallback;
  }
  function getInt(f, field, fallback = 0) {
    return parseInt(f[field]?.integerValue ?? fallback, 10);
  }
  function getArr(f, field) {
    return f[field]?.arrayValue?.values || [];
  }
  function getMap(f, field) {
    return f[field]?.mapValue?.fields || {};
  }
  function parseActivation(str) {
    if (!str) return null;
    const m = str.match(/<(\w+)>/);
    const time = m ? m[1] : null;
    const costMatch = str.match(/\((\d+) ([^)]+)\)/);
    return costMatch ? { time, cost: Number(costMatch[1]), resource: costMatch[2] } : { time, cost: null };
  }
  function parseWeapon(desc) {
    if (!desc) return null;
    const m = desc.match(/RANGE: ([^|]+) \| TARGET: ([^|]+) \| RoA: (\d+) \| HIT: ([^|]+) \| DMG: (\d+)/);
    if (!m) return null;
    const surge = (desc.match(/SURGE: ([^\n]+)/) || [])[1];
    const special = desc.split('\n').slice(2).join(' ').trim();
    return {
      range: m[1].trim(),
      target: m[2].trim(),
      roa: Number(m[3]),
      hit: m[4].trim(),
      dmg: Number(m[5]),
      surge: surge ? surge.trim() : undefined,
      special: special || undefined
    };
  }
  const units = docs.map(doc => {
    const f = doc.fields;
    const tags = getStr(f, 'tags').split(',').map(s => s.trim()).filter(Boolean);
    const stats = getMap(f, 'stats');
    const statsObj = {};
    for (const k in stats) {
      statsObj[k] = stats[k].stringValue ?? stats[k].integerValue ?? stats[k];
      if (!isNaN(statsObj[k]) && typeof statsObj[k] === 'string') statsObj[k] = Number(statsObj[k]);
    }
    const squadProfile = getArr(f, 'squadProfile').map(sp => {
      const spf = sp.mapValue?.fields || {};
      return {
        tier: parseInt(spf.tier?.integerValue ?? '0', 10),
        supply: parseInt(spf.supply?.integerValue ?? '0', 10),
        modelCount: spf.modelCount?.stringValue ?? '-'
      };
    });
    const upgrades = getArr(f, 'upgrades').map(u => {
      const uf = u.mapValue?.fields || {};
      const desc = uf.description?.stringValue ?? '';
      const activation = parseActivation(uf.activation?.stringValue ?? '');
      const weapon = parseWeapon(desc);
      return {
        name: uf.name?.stringValue ?? '',
        desc,
        activation,
        phase: uf.phase?.stringValue ?? undefined,
        costS: uf.costS?.integerValue ? Number(uf.costS.integerValue) : undefined,
        costL: uf.costL?.integerValue ? Number(uf.costL.integerValue) : undefined,
        linkedTo: uf.linkedTo?.stringValue ?? undefined,
        weapon: weapon || undefined
      };
    });
    const small = getMap(f, 'small');
    return {
      id: getStr(f, 'id'),
      name: getStr(f, 'name'),
      faction: getStr(f, 'faction'),
      type: getStr(f, 'unitType'),
      tags,
      stats: statsObj,
      cost: getInt(small, 'cost'),
      supply: getInt(small, 'supply'),
      models: getInt(small, 'models'),
      combatRange: getStr(f, 'combatRange', null),
      upgrades,
      squadProfile
    };
  });
  const factions = {};
  for (const unit of units) {
    const faction = unit.faction || 'Other';
    if (!factions[faction]) factions[faction] = [];
    factions[faction].push(unit);
  }
  // Flatten into a single array, sorted by faction
  const outArr = [];
  for (const faction of Object.keys(factions)) {
    outArr.push(...factions[faction]);
  }
  return JSON.stringify(outArr, null, 2);
}


// --- Rules Sections Cleaning Logic ---
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

function cleanFirestoreRules(raw) {
  const docs = raw.documents || [];
  // Extract and sort by section title
  const cleaned = docs.map(doc => {
    const f = doc.fields;
    const section = {
      id: extractFirestoreValue(f.id) || extractFirestoreValue(f.section_id) || doc.name.split('/').pop(),
      title: extractFirestoreValue(f.title),
      order: extractFirestoreValue(f.order),
      items: extractFirestoreValue(f.items) || [],
    };
    return section;
  });
  // Sort by title (alphabetically, or by order if present)
  cleaned.sort((a, b) => {
    if (a.order != null && b.order != null) return a.order - b.order;
    if (a.title && b.title) return a.title.localeCompare(b.title);
    return 0;
  });
  return cleaned;
}

async function main() {
  // Auth for GCS (skip if not running in GitHub Actions)
  let creds, storage;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    creds = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    storage = new Storage({ credentials: creds, projectId: creds.project_id });
  }

  // Download and clean army_units
  const resUnits = await fetch(ARMY_UNITS_URL);
  if (!resUnits.ok) throw new Error('Failed to fetch army_units: ' + resUnits.status);
  const rawUnits = await resUnits.json();
  const cleanedUnits = cleanFirestoreDump(rawUnits);

  // Download and clean rules_sections
  const resRules = await fetch(RULES_SECTIONS_URL);
  if (!resRules.ok) throw new Error('Failed to fetch rules_sections: ' + resRules.status);
  const rawRules = await resRules.json();
  const cleanedRules = cleanFirestoreRules(rawRules);

  // Download and clean tactical_cards
  const resTactical = await fetch(TACTICAL_CARDS_URL);
  if (!resTactical.ok) throw new Error('Failed to fetch tactical_cards: ' + resTactical.status);
  const rawTactical = await resTactical.json();
  const cleanedTactical = cleanFirestoreTacticalCards(rawTactical);

  mkdirSync('data', { recursive: true });
  writeFileSync(OUTPUT_PATH_UNITS, cleanedUnits);
  writeFileSync(OUTPUT_PATH_RULES, JSON.stringify(cleanedRules, null, 2));
  writeFileSync(OUTPUT_PATH_TACTICAL, JSON.stringify(cleanedTactical, null, 2));
  console.log('army_units_cleaned.json, rules_sections_cleaned.json, and tactical_cards_cleaned.json written to /data in repo.');
}

main().catch(e => { console.error(e); process.exit(1); });
