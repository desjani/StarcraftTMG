// Script to generate a deeply object-mapped army_units.json from the cleaned array
// Output: /data/army_units_object.json

import fetch from 'node-fetch';
import { writeFileSync, mkdirSync } from 'fs';

const API_URL = 'https://firestore.googleapis.com/v1/projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units?key=AIzaSyDHRhS4FIO_1s_2Tn2C77noJRgbs-y_mks';
const OUTPUT_PATH = 'data/army_units_object.json';

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

function arrayToObjectByKey(arr, key) {
  return arr.reduce((obj, item) => {
    obj[item[key]] = item;
    return obj;
  }, {});
}

async function main() {
  const res = await fetch(API_URL);
  const apiRaw = await res.json();
  const docs = apiRaw.documents || [];
  const raw = docs.map(doc => {
    const f = doc.fields;
    const unit = {};
    for (const key in f) unit[key] = extractFirestoreValue(f[key]);
    return unit;
  });
  // Map: faction -> unit name -> unit object
  const out = {};
  for (const unit of raw) {
    const faction = unit.faction || 'Other';
    if (!out[faction]) out[faction] = {};
    // Map upgrades array to object by name
    if (Array.isArray(unit.upgrades)) {
      unit.upgrades = arrayToObjectByKey(unit.upgrades, 'name');
    }
    out[faction][unit.name] = unit;
  }
  mkdirSync('data', { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(out, null, 2));
  console.log('army_units_object.json written to /data (direct from API).');
}

main();
