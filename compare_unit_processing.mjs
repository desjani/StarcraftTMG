// compare_unit_processing.mjs
// Standalone script to process official army_units and compare to SEED TTPIBA


import fs from 'fs';
import https from 'https';

const ARMY_UNITS_PATH = './client/army_units.md';
const VERSION_PATH = './client/army_units.version';
const VERSION_URL = 'https://firestore.googleapis.com/v1/projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/system_metadata/versions?key=AIzaSyDHRhS4FIO_1s_2Tn2C77noJRgbs-y_mks';
const ARMY_UNITS_URL = 'https://firestore.googleapis.com/v1/projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units?key=AIzaSyDHRhS4FIO_1s_2Tn2C77noJRgbs-y_mks';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function getArmyUnits() {
  let remoteVersion = null;
  let localVersion = null;
  let needDownload = true;
  // Get remote version
  try {
    const verDoc = await fetchJson(VERSION_URL);
    remoteVersion = verDoc.fields && verDoc.fields.unitsVersion && verDoc.fields.unitsVersion.integerValue;
  } catch (e) {
    console.error('Failed to fetch remote version:', e);
  }
  // Get local version
  if (fs.existsSync(VERSION_PATH)) {
    localVersion = fs.readFileSync(VERSION_PATH, 'utf8').trim();
  }
  if (remoteVersion && localVersion && remoteVersion === localVersion && fs.existsSync(ARMY_UNITS_PATH)) {
    needDownload = false;
  }
  let armyUnitsRaw;
  if (needDownload) {
    console.log('Fetching latest army_units from Firestore...');
    armyUnitsRaw = JSON.stringify(await fetchJson(ARMY_UNITS_URL));
    fs.writeFileSync(ARMY_UNITS_PATH, armyUnitsRaw);
    if (remoteVersion) fs.writeFileSync(VERSION_PATH, remoteVersion);
  } else {
    armyUnitsRaw = fs.readFileSync(ARMY_UNITS_PATH, 'utf8');
  }
  return JSON.parse(armyUnitsRaw).documents;
}

// Load SEED TTPIBA roster
const seedRaw = fs.readFileSync('./TTPIBA.json', 'utf8');
const seed = JSON.parse(seedRaw);

// Helper: flatten Firestore field
function getField(obj, path, fallback = undefined) {
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (!cur) return fallback;
    if (cur.mapValue && cur.mapValue.fields) cur = cur.mapValue.fields;
    else if (cur.arrayValue && cur.arrayValue.values) cur = cur.arrayValue.values;
    else if (cur.stringValue !== undefined) cur = cur.stringValue;
    else if (cur.integerValue !== undefined) cur = parseInt(cur.integerValue, 10);
    else cur = cur[p];
  }
  return cur === undefined ? fallback : cur;
}


async function main() {
  const armyUnits = await getArmyUnits();
  // Index army units by id and name
  const armyUnitById = {};
  const armyUnitByName = {};
  for (const doc of armyUnits) {
    const id = getField(doc.fields, 'id');
    const name = getField(doc.fields, 'name');
    if (typeof id === 'string') armyUnitById[id.toLowerCase()] = doc;
    if (typeof name === 'string') armyUnitByName[name.toLowerCase()] = doc;
  }

// Extract display info from official data
function extractOfficialUnit(unitDoc, modelCount = null) {
  const f = unitDoc.fields;
  // Tags
  const tags = getField(f, 'tags', '').split(',').map(s => s.trim()).filter(Boolean);
  // Image
  const image = getField(f, 'frontUrl', null);
  // Stats
  const stats = {};
  const statFields = ['hp','armor','speed','evade','size','shield'];
  for (const s of statFields) {
    let val = getField(f, `stats.${s}`, '-');
    // Multi-value stat handling
    if (val.includes('/')) {
      const parts = val.split('/');
      if (modelCount === 1 || getField(f, 'small.models', 1) === 1) val = parts[1];
      else val = parts[0];
    }
    stats[s] = val;
  }
  // Diminishing supply
  let supply = null;
  if (modelCount !== null) {
    const squadProfile = getField(f, 'squadProfile', []);
    for (const tier of squadProfile) {
      const tierFields = tier.mapValue.fields;
      const min = getField(tierFields, 'min', null);
      const max = getField(tierFields, 'max', null);
      const count = getField(tierFields, 'modelCount', null);
      const tierSupply = getField(tierFields, 'supply', null);
      if (min !== null && max !== null && modelCount >= min && modelCount <= max) supply = tierSupply;
      else if (count !== null && modelCount === count) supply = tierSupply;
    }
  }
  // Upgrades/weapons parsing (just show names for now)
  const upgrades = getField(f, 'upgrades', []).map(u => {
    const uf = u.mapValue.fields;
    return {
      name: getField(uf, 'name', ''),
      description: getField(uf, 'description', '')
    };
  });
  return { name: getField(f, 'name'), tags, image, stats, supply, upgrades };
}


  // Compare units in TTPIBA roster
  const results = [];
  for (const rosterUnit of seed.units || []) {
    const name = rosterUnit.name || '';
    const id = rosterUnit.id || '';
    const modelCount = rosterUnit.models || 1;
    let officialDoc = armyUnitById[id.toLowerCase()] || armyUnitByName[name.toLowerCase()];
    if (!officialDoc) {
      results.push({ name, id, error: 'Not found in official data' });
      continue;
    }
    const official = extractOfficialUnit(officialDoc, modelCount);
    // Compare tags, stats, supply
    results.push({
      name,
      id,
      seed: {
        tags: rosterUnit.tags,
        stats: rosterUnit.stats,
        supply: rosterUnit.supply,
        image: rosterUnit.image,
        upgrades: rosterUnit.upgrades
      },
      official
    });
  }

  // Output comparison
  for (const r of results) {
    console.log('---');
    console.log(`Unit: ${r.name} (${r.id})`);
    if (r.error) {
      console.log('ERROR:', r.error);
      continue;
    }
    console.log('SEED tags:', r.seed.tags);
    console.log('Official tags:', r.official.tags);
    console.log('SEED stats:', r.seed.stats);
    console.log('Official stats:', r.official.stats);
    console.log('SEED supply:', r.seed.supply);
    console.log('Official supply:', r.official.supply);
    console.log('SEED image:', r.seed.image);
    console.log('Official image:', r.official.image);
    console.log('SEED upgrades:', r.seed.upgrades && r.seed.upgrades.map(u => u.name));
    console.log('Official upgrades:', r.official.upgrades.map(u => u.name));
  }
}

main();
