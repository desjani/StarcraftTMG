function pickUpgradeCost(upgrade, size) {
  if (!upgrade || typeof upgrade !== 'object') return 0;
  return size === 'large' ? Number(upgrade.costL ?? 0) : Number(upgrade.costS ?? 0);
}

function normalizeCleanedUnit(unit) {
  return {
    id: unit?.id ?? '',
    name: unit?.name ?? '',
    uid: unit?.uid ?? null,
    count: Number(unit?.count ?? unit?.models ?? 1),
    size: unit?.size ?? 'small',
    purchasedUpgrades: Array.isArray(unit?.purchasedUpgrades)
      ? unit.purchasedUpgrades.map((name) => String(name ?? '').trim()).filter(Boolean)
      : normalizeActiveUpgradeNames(unit),
  };
}

function normalizeCleanedSeed(flat) {
  return {
    id: String(flat?.id ?? '').trim().toUpperCase(),
    createdAt: flat?.createdAt ?? null,
    faction: flat?.faction ?? '',
    factionCardId: flat?.factionCardId ?? '',
    mineralsLimit: Number(flat?.mineralsLimit ?? 0),
    gasLimit: Number(flat?.gasLimit ?? 0),
    slotsAvailable: flat?.slotsAvailable ?? {},
    gasUsed: Number(flat?.gasUsed ?? 0),
    mineralsUsed: Number(flat?.mineralsUsed ?? 0),
    slotsUsed: flat?.slotsUsed ?? {},
    resourceTotal: Number(flat?.resourceTotal ?? 0),
    units: Array.isArray(flat?.units) ? flat.units.map(normalizeCleanedUnit) : [],
    tacticalCards: Array.isArray(flat?.tacticalCards) ? flat.tacticalCards : [],
    missions: Array.isArray(flat?.missions) ? flat.missions : [],
  };
}

function normalizeActiveUpgradeNames(unit) {
  const activeUpgrades = Array.isArray(unit?.activeUpgrades) ? unit.activeUpgrades : [];
  const availableUpgrades = Array.isArray(unit?.availableUpgrades) ? unit.availableUpgrades : [];

  return activeUpgrades
    .map((entry) => {
      if (typeof entry === 'number') return availableUpgrades[entry] ?? null;
      if (entry && typeof entry === 'object' && typeof entry.name === 'string') return entry;
      return null;
    })
    .filter(Boolean)
    .filter((upgrade) => pickUpgradeCost(upgrade, unit?.size) > 0)
    .map((upgrade) => String(upgrade.name ?? '').trim())
    .filter(Boolean);
}

export function cleanSeed(flat) {
  if (!flat || typeof flat !== 'object') {
    return normalizeCleanedSeed({});
  }

  if (!flat.state) {
    return normalizeCleanedSeed(flat);
  }

  const state = flat?.state ?? {};
  const units = Array.isArray(state.roster) ? state.roster : [];

  return normalizeCleanedSeed({
    id: flat?.id,
    createdAt: flat?.createdAt,
    faction: state.faction ?? '',
    factionCardId: state.factionCardId ?? '',
    mineralsLimit: Number(state.mineralsLimit ?? 0),
    gasLimit: Number(state.gasLimit ?? 0),
    slotsAvailable: state.slotsAvailable ?? {},
    gasUsed: Number(state.gasUsed ?? 0),
    mineralsUsed: Number(state.mineralsUsed ?? 0),
    slotsUsed: state.slotsUsed ?? {},
    resourceTotal: Number(state.resourceTotal ?? 0),
    units: units.map((unit) => ({
      id: unit?.id ?? '',
      name: unit?.name ?? '',
      uid: unit?.uid ?? null,
      models: Number(unit?.models ?? 1),
      size: unit?.size ?? 'small',
      activeUpgrades: Array.isArray(unit?.activeUpgrades) ? unit.activeUpgrades : [],
      availableUpgrades: Array.isArray(unit?.availableUpgrades) ? unit.availableUpgrades : [],
    })),
    tacticalCards: Array.isArray(state.tacticalCardIds) ? state.tacticalCardIds : [],
    missions: Array.isArray(state.missionIds) ? state.missionIds : [],
  });
}

// Add universal cleaning for Firestore, cleaned, and NewRecruit JSON
// Add universal cleaning for Firestore, cleaned, and NewRecruit JSON
export async function cleanSeedUniversal(raw) {
  // Firestore export
  if (raw.fields && raw.fields.state) {
    const state = extractFirestoreValue(raw.fields.state);
    return {
      faction: state.faction,
      factionCardId: state.factionCardId,
      mineralsLimit: state.mineralsLimit,
      gasLimit: state.gasLimit,
      slotsAvailable: state.slotsAvailable,
      gasUsed: state.gasUsed,
      mineralsUsed: state.mineralsUsed,
      slotsUsed: state.slotsUsed,
      resourceTotal: state.resourceTotal,
      units: (state.roster || []).map(unit => ({
        id: unit.id,
        name: unit.name,
        uid: unit.uid,
        count: unit.models,
        size: unit.size,
        purchasedUpgrades: (unit.activeUpgrades || []).map(idx => {
          if (typeof idx === 'number' && unit.availableUpgrades && unit.availableUpgrades[idx]) {
            return unit.availableUpgrades[idx].name;
          }
          if (typeof idx === 'object' && idx.name) return idx.name;
          return idx;
        }).filter(Boolean),
      })),
      tacticalCards: state.tacticalCardIds || [],
      missions: state.missionIds || []
    };
  }
  // Already cleaned
  if (raw.state) {
    const state = raw.state;
    return {
      faction: state.faction,
      factionCardId: state.factionCardId,
      mineralsLimit: state.mineralsLimit,
      gasLimit: state.gasLimit,
      slotsAvailable: state.slotsAvailable,
      gasUsed: state.gasUsed,
      mineralsUsed: state.mineralsUsed,
      slotsUsed: state.slotsUsed,
      resourceTotal: state.resourceTotal,
      units: (state.roster || []).map(unit => ({
        id: unit.id,
        name: unit.name,
        uid: unit.uid,
        count: unit.models,
        size: unit.size,
        purchasedUpgrades: (unit.activeUpgrades || []).map(idx => {
          if (typeof idx === 'number' && unit.availableUpgrades && unit.availableUpgrades[idx]) {
            return unit.availableUpgrades[idx].name;
          }
          if (typeof idx === 'object' && idx.name) return idx.name;
          return idx;
        }).filter(Boolean),
      })),
      tacticalCards: state.tacticalCardIds || [],
      missions: state.missionIds || []
    };
  }
  // NewRecruit JSON
  if (raw.roster && raw.roster.forces && Array.isArray(raw.roster.forces)) {
    // Use robust browser-compatible mapping logic (always async)
    if (typeof window !== 'undefined') {
      if (window.mapNewRecruitToCleaned) {
        return await window.mapNewRecruitToCleaned(raw);
      } else {
        throw new Error('NewRecruit mapping logic not loaded in browser');
      }
    } else {
      const { mapNewRecruitToCleaned } = require('./newrecruit_mapper.js');
      return await mapNewRecruitToCleaned(raw);
    }
  }
  throw new Error('Unrecognized roster format: missing state or roster');
}

// Firestore value extractor for browser/Node
export function extractFirestoreValue(val) {
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
