// Script to fetch and clean rules_sections from Firestore API
// Outputs to /data/rules_sections_cleaned.json

import fetch from 'node-fetch';
import { writeFileSync, mkdirSync } from 'fs';

const RULES_SECTIONS_URL = 'https://firestore.googleapis.com/v1/projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/rules_sections?key=AIzaSyDHRhS4FIO_1s_2Tn2C77noJRgbs-y_mks';
const OUTPUT_PATH = 'data/rules_sections_cleaned.json';

// Recursively extract Firestore-typed values
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
  const res = await fetch(RULES_SECTIONS_URL);
  if (!res.ok) throw new Error('Failed to fetch rules_sections: ' + res.status);
  const raw = await res.json();
  const cleaned = cleanFirestoreRules(raw);
  mkdirSync('data', { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(cleaned, null, 2));
  console.log('rules_sections_cleaned.json written to /data.');
}

main().catch(e => { console.error(e); process.exit(1); });
