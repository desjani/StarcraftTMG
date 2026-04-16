function normalizeLookupKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
}

function buildFactionUnitLookup(unitsByName = {}) {
  const byId = new Map();
  const byName = new Map();

  for (const unit of Object.values(unitsByName)) {
    if (!unit || typeof unit !== 'object') continue;
    const idKey = normalizeLookupKey(unit.id);
    const nameKey = normalizeLookupKey(unit.name);
    if (idKey) byId.set(idKey, unit);
    if (nameKey) byName.set(nameKey, unit);
  }

  return { byId, byName };
}

function buildFactionTacticalLookup(cardsByName = {}) {
  const byId = new Map();
  const byName = new Map();

  for (const card of Object.values(cardsByName)) {
    if (!card || typeof card !== 'object') continue;
    const idKey = normalizeLookupKey(card.id);
    const nameKey = normalizeLookupKey(card.name);
    if (idKey) byId.set(idKey, card);
    if (nameKey) byName.set(nameKey, card);
  }

  return { byId, byName };
}

function buildGameData(armyUnits, tacticalCards, rulesSections) {
  const unitsByFaction = new Map();
  const tacticalByFaction = new Map();

  for (const [faction, units] of Object.entries(armyUnits ?? {})) {
    unitsByFaction.set(faction, buildFactionUnitLookup(units));
  }

  for (const [faction, cards] of Object.entries(tacticalCards ?? {})) {
    tacticalByFaction.set(faction, buildFactionTacticalLookup(cards));
  }

  return {
    armyUnits,
    tacticalCards,
    rulesSections,
    getUnitDefinition(faction, unitRef) {
      const lookup = unitsByFaction.get(faction);
      if (!lookup) return null;
      const directId = lookup.byId.get(normalizeLookupKey(unitRef?.id));
      if (directId) return directId;
      const directName = lookup.byName.get(normalizeLookupKey(unitRef?.name));
      if (directName) return directName;
      return null;
    },
    getTacticalCard(faction, cardRef) {
      const lookup = tacticalByFaction.get(faction);
      if (!lookup) return null;
      const directId = lookup.byId.get(normalizeLookupKey(cardRef?.id ?? cardRef));
      if (directId) return directId;
      const directName = lookup.byName.get(normalizeLookupKey(cardRef?.name ?? cardRef));
      if (directName) return directName;
      return null;
    },
    getAllTacticalCards(faction, ids = []) {
      return toArray(ids)
        .map(id => this.getTacticalCard(faction, id))
        .filter(Boolean);
    },
  };
}

let _gameDataPromise = null;

async function readJsonFile(filename) {
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    const response = await window.fetch(`/data/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load /data/${filename}: HTTP ${response.status}`);
    }
    return response.json();
  }

  const [{ readFile }, { fileURLToPath }, path] = await Promise.all([
    import('fs/promises'),
    import('url'),
    import('path'),
  ]);
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const filePath = path.join(dir, '../data', filename);
  return JSON.parse(await readFile(filePath, 'utf8'));
}

export async function loadGameData() {
  if (!_gameDataPromise) {
    _gameDataPromise = Promise.all([
      readJsonFile('army_units_object.json'),
      readJsonFile('tactical_cards_object.json'),
      readJsonFile('rules_sections_object.json'),
    ]).then(([armyUnits, tacticalCards, rulesSections]) =>
      buildGameData(armyUnits, tacticalCards, rulesSections));
  }
  return _gameDataPromise;
}

export { normalizeLookupKey };
