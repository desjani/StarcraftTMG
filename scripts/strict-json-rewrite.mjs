import { readFileSync, writeFileSync } from 'fs';
const src = 'data/army_units_object.json';
const dest = 'dist/pages/data/army_units_object.json';

const data = JSON.parse(readFileSync(src, 'utf8'));
writeFileSync(dest, JSON.stringify(data, null, 2), 'utf8');
console.log('File rewritten with strict JSON.');
