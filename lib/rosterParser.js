/**
 * Transform a cleaned seed document into the parsed roster object that the
 * formatter, web app, and bot consume.
 */

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

function getUnitSizeProfile(unitDefinition, size) {
  return size === 'large'
    ? (unitDefinition?.large ?? {})
    : (unitDefinition?.small ?? {});
}

function buildUpgradeList(unitDefinition, size, purchasedNames) {
  const allUpgrades = Object.values(unitDefinition?.upgrades ?? {}).map((upgrade) => {
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
  });

  return {
    activeUpgrades: allUpgrades.filter(upgrade => upgrade.active),
    allUpgrades,
  };
}

function toTacticalCardDetail(cardId, faction, options) {
  const fromOptions = (options.tacticalCards ?? []).find(card => card?.id === cardId);
  const fromLibrary = fromOptions ?? options.gameData?.getTacticalCard(faction, cardId);

  return {
    id: cardId,
    name: fromLibrary?.name ?? idToTitle(cardId),
    slots: fromLibrary?.slots ?? {},
    faction: typeof fromLibrary?.faction === 'string' ? fromLibrary.faction : '',
    tags: typeof fromLibrary?.tags === 'string' ? fromLibrary.tags : '',
    frontUrl: typeof fromLibrary?.frontUrl === 'string' ? fromLibrary.frontUrl : '',
    isUnique: Boolean(fromLibrary?.isUnique),
    resource: typeof fromLibrary?.resource === 'number' ? fromLibrary.resource : null,
    gasCost: typeof fromLibrary?.gasCost === 'number'
      ? fromLibrary.gasCost
      : typeof fromLibrary?.gas === 'number'
        ? fromLibrary.gas
        : typeof fromLibrary?.costGas === 'number'
          ? fromLibrary.costGas
          : typeof fromLibrary?.cost === 'number'
            ? fromLibrary.cost
            : null,
    abilities: Array.isArray(fromLibrary?.abilities)
      ? fromLibrary.abilities
      : Array.isArray(fromLibrary?.boosts)
        ? fromLibrary.boosts
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

/**
 * @param {object} flat  Output of fetchRoster() after seed cleaning.
 * @param {object} [options]
 * @param {object} [options.gameData]
 * @param {Array<{id:string,name:string,slots:Object}>} [options.tacticalCards]
 * @returns {object}
 */
export function parseRoster(flat, options = {}) {
  if (!options.gameData) {
    throw new Error('parseRoster() requires options.gameData for cleaned seeds');
  }

  const faction = flat?.faction ?? 'Unknown';
  const rawUnits = Array.isArray(flat?.units) ? flat.units : [];

  const units = rawUnits.map((unit) => {
    const unitDefinition = options.gameData.getUnitDefinition(faction, unit);
    if (!unitDefinition) {
      throw new Error(`No unit definition found for "${unit?.name || unit?.id || 'unknown unit'}" in faction ${faction}`);
    }

    const size = unit?.size ?? 'small';
    const sizeProfile = getUnitSizeProfile(unitDefinition, size);
    const purchasedNames = new Set((unit?.purchasedUpgrades ?? []).map(normalizeLookupKey));
    const { activeUpgrades, allUpgrades } = buildUpgradeList(unitDefinition, size, purchasedNames);
    const baseCost = Number(sizeProfile?.cost ?? 0);
    const upgradeCost = activeUpgrades.reduce((sum, upgrade) => sum + Number(upgrade.cost ?? 0), 0);

    return {
      id: unitDefinition.id ?? unit?.id ?? '',
      uid: unit?.uid ?? null,
      name: unitDefinition.name ?? unit?.name ?? unit?.id ?? 'Unknown',
      type: unitDefinition.unitType ?? 'Core',
      size,
      models: Number(unit?.count ?? sizeProfile?.models ?? 1),
      supply: Number(sizeProfile?.supply ?? 0),
      baseCost,
      totalCost: baseCost + upgradeCost,
      activeUpgrades,
      allUpgrades,
      stats: {
        hp: unitDefinition?.stats?.hp ?? '-',
        armor: unitDefinition?.stats?.armor ?? '-',
        evade: unitDefinition?.stats?.evade ?? '-',
        speed: unitDefinition?.stats?.speed ?? '-',
        shield: unitDefinition?.stats?.shield ?? null,
        size: unitDefinition?.stats?.size ?? '-',
      },
      tags: unitDefinition?.tags ?? '',
    };
  }).sort((a, b) => {
    const ai = TYPE_ORDER.indexOf(a.type);
    const bi = TYPE_ORDER.indexOf(b.type);
    return (ai === -1 ? TYPE_ORDER.length : ai) - (bi === -1 ? TYPE_ORDER.length : bi);
  });

  const tacticalCardIds = Array.isArray(flat?.tacticalCards) ? flat.tacticalCards : [];
  const tacticalCardDetails = tacticalCardIds.map(id => toTacticalCardDetail(id, faction, options));
  const supply = units.reduce((sum, unit) => sum + Number(unit.supply ?? 0), 0);
  const slotKeys = [...new Set([
    ...Object.keys(flat?.slotsUsed ?? {}),
    ...Object.keys(flat?.slotsAvailable ?? {}),
  ])];

  return {
    seed: flat?.id ?? '',
    createdAt: flat?.createdAt ?? null,
    faction,
    factionCard: idToTitle(flat?.factionCardId),
    minerals: {
      used: Number(flat?.mineralsUsed ?? 0),
      limit: Number(flat?.mineralsLimit ?? 0),
    },
    gas: {
      used: Number(flat?.gasUsed ?? 0),
      limit: Number(flat?.gasLimit ?? 0),
    },
    supply,
    resources: Number(flat?.resourceTotal ?? 0),
    slots: Object.fromEntries(
      slotKeys.map((key) => [
        key,
        {
          used: Number(flat?.slotsUsed?.[key] ?? 0),
          avail: Number(flat?.slotsAvailable?.[key] ?? 0),
        },
      ])
    ),
    units,
    tacticalCards: tacticalCardDetails.map(card => card.name),
    tacticalCardDetails,
    missionIds: (flat?.missions ?? []).map(idToTitle),
  };
}
