// Firebase Cloud Function: Scheduled army_units sync and clean
// - Downloads raw army_units from Firestore REST API
// - Cleans and groups by faction
// - Uploads cleaned JSON to Cloud Storage

import * as functions from 'firebase-functions';
import { Storage } from '@google-cloud/storage';
import fetch from 'node-fetch';

const ARMY_UNITS_URL = 'https://firestore.googleapis.com/v1/projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units?key=AIzaSyDHRhS4FIO_1s_2Tn2C77noJRgbs-y_mks';
const OUTPUT_PATH = 'public/army_units_cleaned.json';
const BUCKET = process.env.BUCKET || process.env.GCLOUD_PROJECT + '.appspot.com';

// --- Cleaning logic (same as local script, but adapted for Node 18+) ---
function cleanFirestoreDump(raw) {
  const docs = raw.documents || [];
  // Helper functions
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
  // Clean all units
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
  // Group by faction
  const factions = {};
  for (const unit of units) {
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
  return out;
}

export const scheduledArmyUnitsSync = functions.pubsub.schedule('every 6 hours').onRun(async (context) => {
  const storage = new Storage();
  // Download raw army_units
  const res = await fetch(ARMY_UNITS_URL);
  if (!res.ok) throw new Error('Failed to fetch army_units: ' + res.status);
  const raw = await res.json();
  // Clean and group
  const cleaned = cleanFirestoreDump(raw);
  // Upload to Cloud Storage
  const file = storage.bucket(BUCKET).file(OUTPUT_PATH);
  await file.save(cleaned, {
    contentType: 'application/json',
    public: true,
    resumable: false
  });
  console.log('army_units_cleaned.json updated in Cloud Storage.');
  return null;
});
