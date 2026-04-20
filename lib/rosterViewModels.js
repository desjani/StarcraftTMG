import { normalizeLookupKey } from './gameData.js';

const TYPE_ORDER = ['Hero', 'Core', 'Elite', 'Support', 'Air', 'Other'];

function idToTitle(id) {
  if (!id) return '';
  if (String(id).toLowerCase() === 'raynor_s_raiders') return "Raynor's Raiders";
  if (String(id).toLowerCase() === 'kerrigan_s_swarm') return "Kerrigan's Swarm";
  return String(id)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function toUpgradeView(upgrade, size, purchasedNames) {
  const cost = size === 'large' ? Number(upgrade?.costL ?? 0) : Number(upgrade?.costS ?? 0);
  const active = cost <= 0 || purchasedNames.has(normalizeLookupKey(upgrade?.name));
  return {
    name: upgrade?.name ?? '',
    cost,
    activation: upgrade?.activation ?? '',
    phase: upgrade?.phase ?? '',
    description: upgrade?.description ?? upgrade?.text ?? upgrade?.rules ?? '',
    linkedTo: upgrade?.linkedTo ?? '',
    active,
  };
}

function normalizeSquadProfile(rawProfile = [], fallbackModels = 1, fallbackSupply = 0) {
  const normalized = (Array.isArray(rawProfile) ? rawProfile : [])
    .map((entry, index) => {
      const label = String(entry?.modelCount ?? '-').trim();
      const rangeMatch = label.match(/^(\d+)\s*-\s*(\d+)$/);
      const singleMatch = label.match(/^(\d+)$/);
      const minModels = rangeMatch
        ? Number(rangeMatch[1])
        : singleMatch
          ? Number(singleMatch[1])
          : null;
      const maxModels = rangeMatch
        ? Number(rangeMatch[2])
        : singleMatch
          ? Number(singleMatch[1])
          : null;
      return {
        tier: Number(entry?.tier ?? index + 1),
        supply: Number(entry?.supply ?? 0),
        modelCount: label,
        minModels,
        maxModels,
      };
    })
    .filter((entry) => Number.isFinite(entry.minModels) && Number.isFinite(entry.maxModels));

  if (normalized.length) {
    return normalized.sort((a, b) => {
      if (b.maxModels !== a.maxModels) return b.maxModels - a.maxModels;
      return b.minModels - a.minModels;
    });
  }

  const models = Math.max(1, Number(fallbackModels ?? 1) || 1);
  return [{
    tier: 1,
    supply: Number(fallbackSupply ?? 0) || 0,
    modelCount: `${models}`,
    minModels: models,
    maxModels: models,
  }];
}

function toResolvedUnit(seedUnit, faction, gameData) {
  const definition = gameData.getUnitDefinition(faction, seedUnit);
  if (!definition) {
    throw new Error(`No unit definition found for "${seedUnit?.name || seedUnit?.id || 'unknown unit'}" in faction ${faction}`);
  }

  const size = seedUnit?.size ?? 'small';
  const sizeProfile = size === 'large' ? (definition.large ?? {}) : (definition.small ?? {});
  const purchasedNames = new Set((seedUnit?.purchasedUpgrades ?? []).map(normalizeLookupKey));
  const allUpgrades = Object.values(definition.upgrades ?? {}).map((upgrade) =>
    toUpgradeView(upgrade, size, purchasedNames));
  const activeUpgrades = allUpgrades.filter((upgrade) => upgrade.active);
  const baseCost = Number(sizeProfile.cost ?? 0);
  const upgradeCost = activeUpgrades.reduce((sum, upgrade) => sum + Number(upgrade.cost ?? 0), 0);

  return {
    id: definition.id ?? seedUnit?.id ?? '',
    uid: seedUnit?.uid ?? null,
    name: definition.name ?? seedUnit?.name ?? seedUnit?.id ?? 'Unknown',
    type: definition.unitType ?? 'Core',
    size,
    models: Number(seedUnit?.count ?? sizeProfile.models ?? 1),
    supply: Number(sizeProfile.supply ?? 0),
    squadProfile: normalizeSquadProfile(
      definition?.squadProfile,
      Number(seedUnit?.count ?? sizeProfile.models ?? 1),
      Number(sizeProfile.supply ?? 0),
    ),
    baseCost,
    totalCost: baseCost + upgradeCost,
    activeUpgrades,
    allUpgrades,
    stats: {
      hp: definition?.stats?.hp ?? '-',
      armor: definition?.stats?.armor ?? '-',
      evade: definition?.stats?.evade ?? '-',
      speed: definition?.stats?.speed ?? '-',
      shield: definition?.stats?.shield ?? null,
      size: definition?.stats?.size ?? '-',
    },
    tags: definition?.tags ?? '',
  };
}

function toResolvedTacticalCard(cardId, faction, gameData) {
  const card = gameData.getTacticalCard(faction, cardId);
  return {
    id: cardId,
    name: card?.name ?? idToTitle(cardId),
    slots: card?.slots ?? {},
    faction: typeof card?.faction === 'string' ? card.faction : '',
    tags: typeof card?.tags === 'string' ? card.tags : '',
    frontUrl: typeof card?.frontUrl === 'string' ? card.frontUrl : '',
    isUnique: Boolean(card?.isUnique),
    resource: typeof card?.resource === 'number' ? card.resource : null,
    gasCost: typeof card?.gasCost === 'number'
      ? card.gasCost
      : typeof card?.gas === 'number'
        ? card.gas
        : typeof card?.costGas === 'number'
          ? card.costGas
          : typeof card?.cost === 'number'
            ? card.cost
            : null,
    abilities: Array.isArray(card?.boosts)
      ? card.boosts
        .map((boost) => {
          const name = String(boost?.name ?? '').trim();
          const text = String(boost?.description ?? boost?.text ?? '').trim();
          if (!name && !text) return null;
          return { name, text };
        })
        .filter(Boolean)
      : [],
  };
}

export function buildResolvedRosterViewModel(seed, gameData) {
  if (!seed) return null;
  if (!gameData) throw new Error('buildResolvedRosterViewModel() requires gameData');

  const faction = seed.faction ?? 'Unknown';
  const units = (seed.units ?? [])
    .map((unit) => toResolvedUnit(unit, faction, gameData))
    .sort((a, b) => {
      const ai = TYPE_ORDER.indexOf(a.type);
      const bi = TYPE_ORDER.indexOf(b.type);
      return (ai === -1 ? TYPE_ORDER.length : ai) - (bi === -1 ? TYPE_ORDER.length : bi);
    });

  const tacticalCardDetails = (seed.tacticalCards ?? []).map((cardId) =>
    toResolvedTacticalCard(cardId, faction, gameData));

  const slots = Object.fromEntries(
    [...new Set([
      ...Object.keys(seed.slotsUsed ?? {}),
      ...Object.keys(seed.slotsAvailable ?? {}),
    ])].map((key) => [
      key,
      {
        used: Number(seed.slotsUsed?.[key] ?? 0),
        avail: Number(seed.slotsAvailable?.[key] ?? 0),
      },
    ])
  );

  return {
    seed: seed.id ?? '',
    createdAt: seed.createdAt ?? null,
    faction,
    factionCard: idToTitle(seed.factionCardId),
    minerals: {
      used: Number(seed.mineralsUsed ?? 0),
      limit: Number(seed.mineralsLimit ?? 0),
    },
    gas: {
      used: Number(seed.gasUsed ?? 0),
      limit: Number(seed.gasLimit ?? 0),
    },
    supply: units.reduce((sum, unit) => sum + Number(unit.supply ?? 0), 0),
    resources: Number(seed.resourceTotal ?? 0),
    slots,
    units,
    tacticalCards: tacticalCardDetails.map((card) => card.name),
    tacticalCardDetails,
    missionIds: (seed.missions ?? []).map(idToTitle),
  };
}

export function buildRosterCardViewModel(seed, gameData) {
  return buildResolvedRosterViewModel(seed, gameData);
}
