// This script will:
// - Parse the raw Firestore army_units.md dump
// - Clean and flatten each unit into the app-friendly format (like adept_cleaned.json)
// - Group units by faction (Protoss, Zerg, Terran, Other)
// - Add descriptive comments for each faction section and unit (for IDE folding)
// - Output to army_units_cleaned.json


import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAW_PATH = path.join(__dirname, 'army_units.md');
const OUT_PATH = path.join(__dirname, 'army_units_cleaned.json');

// Helper: Parse Firestore export structure
function parseFirestoreDump(raw) {
  // The dump is a JSON array of { name, fields, ... }
  let data;
  try {
    data = JSON.parse(raw).documents || JSON.parse(raw);
  } catch (e) {
    // Try to parse as a list of objects
    data = raw.trim().startsWith('[') ? JSON.parse(raw) : raw.split(/\n(?=\{\"name\":)/).map(s => JSON.parse(s));
  }
  return data;
}

// Helper: Clean and flatten a single unit
function cleanUnit(doc) {
  const f = doc.fields;
  function getStr(field, fallback = '') {
    return f[field]?.stringValue ?? fallback;
  }
  function getInt(field, fallback = 0) {
    return parseInt(f[field]?.integerValue ?? fallback, 10);
  }
  function getArr(field) {
    return f[field]?.arrayValue?.values || [];
  }
  function getMap(field) {
    return f[field]?.mapValue?.fields || {};
  }
  // Parse tags
  const tags = getStr('tags').split(',').map(s => s.trim()).filter(Boolean);
  // Parse stats
  const stats = getMap('stats');
  const statsObj = {};
  for (const k in stats) {
    statsObj[k] = stats[k].stringValue ?? stats[k].integerValue ?? stats[k];
    if (!isNaN(statsObj[k]) && typeof statsObj[k] === 'string') statsObj[k] = Number(statsObj[k]);
  }
  // Parse squadProfile
  const squadProfile = (getArr('squadProfile').map(sp => {
    const spf = sp.mapValue?.fields || {};
    return {
      tier: parseInt(spf.tier?.integerValue ?? '0', 10),
      supply: parseInt(spf.supply?.integerValue ?? '0', 10),
      modelCount: spf.modelCount?.stringValue ?? '-'
    };
  }));
  // Parse upgrades
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
  const upgrades = getArr('upgrades').map(u => {
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
  // Parse cost/models/supply
  const small = getMap('small');
  return {
    id: getStr('id'),
    name: getStr('name'),
    faction: getStr('faction'),
    type: getStr('unitType'),
    tags,
    stats: statsObj,
    cost: getInt('cost', getInt('cost', small.cost)),
    supply: getInt('supply', getInt('supply', small.supply)),
    models: getInt('models', getInt('models', small.models)),
    combatRange: getStr('combatRange', null),
    upgrades,
    squadProfile
  };
}

// Main
function main() {
  const raw = fs.readFileSync(RAW_PATH, 'utf8');
  const docs = parseFirestoreDump(raw);
  // Group by faction
  const factions = {};
  for (const doc of docs) {
    const unit = cleanUnit(doc);
    const faction = unit.faction || 'Other';
    if (!factions[faction]) factions[faction] = [];
    factions[faction].push(unit);
  }
  // Compose output with comments
  let out = '// Starcraft TMG Units (cleaned, grouped by faction)\n';
  out += '// Generated: ' + new Date().toISOString() + '\n';
  out += '[\n';
  for (const faction of Object.keys(factions)) {
    out += `  // ===== ${faction} Units =====\n`;
    for (const unit of factions[faction]) {
      out += `  // --- ${unit.name} (${unit.id}) ---\n`;
      out += JSON.stringify(unit, null, 2).split('\n').map(l => '  ' + l).join('\n') + ',\n';
    }
  }
  out += ']\n';
  fs.writeFileSync(OUT_PATH, out);
  console.log('army_units_cleaned.json written.');
}

main();
