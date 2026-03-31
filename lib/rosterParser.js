/**
 * Transform a flattened Firestore shared_roster document into a clean,
 * framework-agnostic roster object that formatters and the Discord bot consume.
 */

const TYPE_ORDER = ['Hero', 'Core', 'Elite', 'Support', 'Air', 'Other'];

/** Convert a snake_case or underscore_id to Title Case. */
function idToTitle(id) {
  if (!id) return '';
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Parse a flattened shared_roster document.
 *
 * Key data-model facts discovered from the app source:
 *  - unit.activeUpgrades  → array of INTEGER INDICES into unit.availableUpgrades
 *  - unit.size            → 'small' | 'large'  (determines which cost field applies)
 *  - upgrade.costS / costL → cost for small / large; 0 = free base ability
 *
 * @param {object} flat  Output of flattenDocument() for a shared_rosters doc.
 * @param {object} [options]
 * @param {Array<{id:string,name:string,slots:Object}>} [options.tacticalCards]
 * @returns {object}     Parsed roster ready for formatting.
 */
export function parseRoster(flat, options = {}) {
  const s = flat.state ?? {};
  const tacticalById = new Map((options.tacticalCards ?? []).map(c => [c.id, c]));

  const rawUnits = (s.roster ?? []).map(u => {
    const activeIdxs  = Array.isArray(u.activeUpgrades)   ? u.activeUpgrades   : [];
    const available   = Array.isArray(u.availableUpgrades) ? u.availableUpgrades : [];

    // Resolve index → upgrade object and pick the size-appropriate cost.
    const activeUpgrades = activeIdxs
      .map(idx => {
        const upg = available[idx];
        if (!upg) return null;
        const cost = u.size === 'large' ? (upg.costL ?? 0) : (upg.costS ?? 0);
        return {
          name:       upg.name       ?? '',
          cost,
          activation: upg.activation ?? '',
          phase:      upg.phase      ?? '',
        };
      })
      .filter(Boolean);

    const upgradeCost = activeUpgrades.reduce((sum, upg) => sum + upg.cost, 0);
    const activeSet   = new Set(activeIdxs);
    const allUpgrades = available.map((upg, idx) => ({
      name:        upg.name        ?? '',
      cost:        u.size === 'large' ? (upg.costL ?? 0) : (upg.costS ?? 0),
      activation:  upg.activation  ?? '',
      phase:       upg.phase       ?? '',
      description: upg.description ?? upg.text ?? upg.rules ?? '',
      active:      activeSet.has(idx),
    }));

    return {
      id:             u.id       ?? '',
      name:           u.name     ?? u.id ?? 'Unknown',
      type:           u.unitType ?? 'Core',   // Hero | Core | Elite | Support | Air
      size:           u.size     ?? 'small',
      models:         u.models   ?? 1,
      supply:         u.supply   ?? 0,
      baseCost:       u.baseCost ?? 0,
      totalCost:      (u.baseCost ?? 0) + upgradeCost,
      activeUpgrades,
      allUpgrades,
      stats: {
        hp:    u.stats?.hp    ?? '-',
        armor: u.stats?.armor ?? '-',
        evade: u.stats?.evade ?? '-',
        speed: u.stats?.speed ?? '-',
        shield: u.stats?.shield ?? null,
        size:   u.stats?.size   ?? '-',
      },
      tags: u.tags ?? '',
    };
  });

  // Sort by canonical type order so all consumers receive pre-sorted units.
  const typeIndex = type => {
    const i = TYPE_ORDER.indexOf(type);
    return i === -1 ? TYPE_ORDER.length : i;
  };
  const units = [...rawUnits].sort((a, b) => typeIndex(a.type) - typeIndex(b.type));

  const slotsUsed  = s.slotsUsed      ?? {};
  const slotsAvail = s.slotsAvailable ?? {};

  const tacticalCardIds = s.tacticalCardIds ?? [];
  const tacticalCardDetails = tacticalCardIds.map(id => {
    const hit = tacticalById.get(id);
    return {
      id,
      name: hit?.name ?? idToTitle(id),
      slots: hit?.slots ?? {},
    };
  });

  return {
    seed:        flat.id        ?? '',
    createdAt:   flat.createdAt ?? null,
    faction:     s.faction      ?? 'Unknown',
    factionCard: idToTitle(s.factionCardId),
    minerals: {
      used:  s.mineralsUsed   ?? 0,
      limit: s.mineralsLimit  ?? 1000,
    },
    gas: {
      used:  s.gasUsed  ?? 0,
      limit: s.gasLimit ?? 100,
    },
    supply:    s.supplyUsed    ?? 0,
    resources: s.resourceTotal ?? 0,
    slots: Object.fromEntries(
      Object.entries(slotsUsed).map(([k, v]) => [
        k,
        { used: v, avail: slotsAvail[k] ?? 0 },
      ])
    ),
    units,
    tacticalCards: tacticalCardDetails.map(c => c.name),
    tacticalCardDetails,
    missionIds:    (s.missionIds      ?? []).map(idToTitle),
  };
}
