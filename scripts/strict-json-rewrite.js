const fs = require('fs');
const src = 'data/army_units_object.json';
const dest = 'dist/pages/data/army_units_object.json';

const data = JSON.parse(fs.readFileSync(src, 'utf8'));
fs.writeFileSync(dest, JSON.stringify(data, null, 2), 'utf8');
console.log('File rewritten with strict JSON.');
