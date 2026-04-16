function pickUpgradeCost(upgrade, size) {
  if (!upgrade || typeof upgrade !== 'object') return 0;
  return size === 'large' ? Number(upgrade.costL ?? 0) : Number(upgrade.costS ?? 0);
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
  const state = flat?.state ?? {};
  const units = Array.isArray(state.roster) ? state.roster : [];

  return {
    id: String(flat?.id ?? '').trim().toUpperCase(),
    createdAt: flat?.createdAt ?? null,
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
      count: Number(unit?.models ?? 1),
      size: unit?.size ?? 'small',
      purchasedUpgrades: normalizeActiveUpgradeNames(unit),
    })),
    tacticalCards: Array.isArray(state.tacticalCardIds) ? state.tacticalCardIds : [],
    missions: Array.isArray(state.missionIds) ? state.missionIds : [],
  };
}
