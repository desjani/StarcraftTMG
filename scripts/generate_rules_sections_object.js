// Script to generate a deeply object-mapped rules_sections.json from the cleaned array
// Output: /data/rules_sections_object.json

import fetch from 'node-fetch';
import { writeFileSync, mkdirSync } from 'fs';

const API_URL = 'https://firestore.googleapis.com/v1/projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/rules_sections?key=AIzaSyDHRhS4FIO_1s_2Tn2C77noJRgbs-y_mks';
const OUTPUT_PATH = 'data/rules_sections_object.json';

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

function extractPartNumber(title) {
  const match = title.match(/PART\s*(\d+)/i);
  return match ? `Part${match[1]}` : 'Other';
}

function extractSectionNumber(sectionTitle) {
  const match = sectionTitle.match(/^(\d+(?:\.\d+)*)(\s|:|$)/);
  return match ? match[1] : null;
}

async function main() {
  const res = await fetch(API_URL);
  const apiRaw = await res.json();
  const docs = apiRaw.documents || [];
  const raw = docs.map(doc => {
    const f = doc.fields;
    const part = {};
    for (const key in f) part[key] = extractFirestoreValue(f[key]);
    return part;
  });
  const out = {};
  for (const part of raw) {
    const partKey = extractPartNumber(part.title);
    if (!out[partKey]) out[partKey] = {};
    for (const section of part.items || []) {
      const sectionNum = extractSectionNumber(section.title);
      if (sectionNum) {
        out[partKey][sectionNum] = section;
      } else {
        out[partKey][section.title || 'Intro'] = section;
      }
    }
  }
  mkdirSync('data', { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(out, null, 2));
  console.log('rules_sections_object.json written to /data (by part, section number, direct from API).');
}

main();
