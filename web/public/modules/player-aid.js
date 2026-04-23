/**
 * Player Aid renderer — pure HTML string output.
 * Accepts a parsed roster, display options, and optional play-mode tracker data.
 * No DOM access, no global state.
 *
 * Key opts:
 *   collapsedUnits        Set<string>    — unit keys that are currently collapsed
 *   getTrackerDisabledAttrs (side) => string — returns HTML attr string for linked-mode
 *   playTrackers          playModeState  — full play state (for tracker data)
 *   unitKeyPrefix         string         — prefix for tracker lookup ('player:', 'opponent:')
 */
import { escapeHtml } from './utils.js';
import { RESOURCE_SHORT, RESOURCE_ICON, TYPE_ABBR } from './constants.js';
import {
  sortUpgradesForDisplay, getAidUnitKey, compareAidWeaponProfiles,
  resolveLinkedWeaponReplacements, isWeaponProfile, parseWeaponProfile,
  renderAidWeaponsTable, formatAidRichText, formatSlotBreakdown,
  hasStatValue, groupAbilitiesByPhase, getPhaseTag, parseAidActivation,
  getAidActivationStateClass,
  isNaturalAbility, formatTacticalSupplyTypes, renderAidTacticalCards,
  detectUnconditionalPassiveBuff, splitTraitTokens, mergeWeaponTraits,
  applyNumericDelta, extractBuffEffectTerms, normalizePhaseLabel,
} from './render-helpers.js';
import {
  getPlayTrackerCurrentHealth,
  getPlayTrackerRemainingModels,
  getPlayTrackerSupplyTier,
  renderPlayHealthReadout,
} from './play-state.js';

function renderPlaySupplyProfile(tracker, fallbackSupply = 0) {
  const profile = Array.isArray(tracker?.squadProfile) ? tracker.squadProfile : [];
  if (!profile.length) return '';
  const { activeTier, currentSupply } = getPlayTrackerSupplyTier(tracker);
  const baseSupply = Number(tracker?.baseSupply ?? fallbackSupply ?? 0) || 0;
  const formatModelCountLabel = (tier) => {
    const min = Number(tier?.minModels);
    const max = Number(tier?.maxModels);
    if (Number.isFinite(min) && Number.isFinite(max) && min === max) return String(min);
    return String(tier?.modelCount ?? '-');
  };
  return `
    <div class="aid-supply-profile">
      <span class="aid-supply-profile-label">Supply Profile:</span>
      <div class="aid-supply-profile-pills">
        ${profile.map((tier) => {
          const isActive = !!activeTier && Number(activeTier.tier) === Number(tier?.tier);
          const isDiminished = isActive && currentSupply < baseSupply;
          return `<span class="aid-supply-tier-pill${isActive ? ' is-active' : ''}${isDiminished ? ' is-diminished' : ''}"><span class="aid-supply-tier-models">${escapeHtml(formatModelCountLabel(tier))}</span><span class="aid-supply-tier-sep">=</span><span class="aid-supply-tier-supply"><span class="aid-supply-tier-icon">◆</span><span class="aid-supply-tier-value">${escapeHtml(String(tier?.supply ?? 0))}</span></span></span>`;
        }).join('')}
      </div>
    </div>`;
}

function renderPlaySupplyBox(tracker, {
  fallbackSupply = 0,
  displaySupply = 0,
  highlighted = false,
  diminished = false,
} = {}) {
  const startingModels = Math.max(0, Number(tracker?.startingModels ?? 0) || 0);
  const rawProfile = Array.isArray(tracker?.squadProfile) ? tracker.squadProfile : [];
  const profile = rawProfile.filter((tier) => {
    const min = Number(tier?.minModels);
    const max = Number(tier?.maxModels);
    if (Number.isFinite(max)) return max <= startingModels;
    if (Number.isFinite(min)) return min <= startingModels;
    return true;
  });
  if (profile.length <= 1) {
    const valueHtml = highlighted
      ? `<strong class="aid-buff-highlight">${escapeHtml(String(displaySupply))}</strong>`
      : `<strong>${escapeHtml(String(displaySupply))}</strong>`;
    return `<div class="play-stat-box play-stat-box-supply${diminished ? ' is-diminished' : ''}">
      <div class="play-stat-box-label">SUP</div>
      <div class="play-stat-box-value">${valueHtml}</div>
    </div>`;
  }

  const { activeTier, currentSupply } = getPlayTrackerSupplyTier(tracker);
  const baseSupply = Number(tracker?.baseSupply ?? fallbackSupply ?? 0) || 0;
  const formatModelCountLabel = (tier) => {
    const min = Number(tier?.minModels);
    const max = Number(tier?.maxModels);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      if (min === max) return String(min);
      return `${max}-${min}`;
    }
    return String(tier?.modelCount ?? '-');
  };
  const tierHtml = profile.map((tier) => {
    const isActive = !!activeTier && Number(activeTier.tier) === Number(tier?.tier);
    const isTierDiminished = isActive && currentSupply < baseSupply;
    return `<span class="play-supply-tier-mini${isActive ? ' is-active' : ''}${isTierDiminished ? ' is-diminished' : ''}">
      <span class="play-supply-tier-count"><span class="play-supply-tier-model-icon" aria-hidden="true"><svg viewBox="0 0 16 16" focusable="false"><path d="M8 2.2a2.55 2.55 0 1 1 0 5.1 2.55 2.55 0 0 1 0-5.1Zm0 6.3c-2.5 0-4.7 1.3-5.5 3.25-.14.34.1.72.47.72h10.16c.37 0 .61-.38.47-.72C12.7 9.8 10.5 8.5 8 8.5Z"/></svg></span>${escapeHtml(formatModelCountLabel(tier))}</span>
      <span class="play-supply-tier-value">${escapeHtml(String(tier?.supply ?? 0))}</span>
    </span>`;
  }).join('');

  return `<div class="play-stat-box play-stat-box-supply${profile.length >= 3 ? ' play-stat-box-supply-profile' : ''}${profile.length === 2 ? ' play-stat-box-supply-pair' : ''}${diminished ? ' is-diminished' : ''}">
    <div class="play-stat-box-label">SUP</div>
    <div class="play-stat-box-detail" aria-label="Supply thresholds">${tierHtml}</div>
  </div>`;
}

function resolveCollapsedSlashStat(value, tracker, fallbackModels = 1) {
  const raw = String(value ?? '').trim();
  if (!raw.includes('/')) return { value: raw, isDiminished: false };
  const parts = raw.split('/').map(part => part.trim()).filter(Boolean);
  if (parts.length < 2) return { value: raw, isDiminished: false };
  const remainingModels = tracker
    ? getPlayTrackerRemainingModels(tracker)
    : Math.max(0, Number(fallbackModels ?? 1) || 0);
  const useSingleModelValue = remainingModels <= 1;
  return {
    value: useSingleModelValue ? parts[1] : parts[0],
    isDiminished: useSingleModelValue && parts[0] !== parts[1],
  };
}

function renderExpandedStatValue(value, tracker, fallbackModels = 1, highlighted = false) {
  const raw = String(value ?? '').trim();
  if (!raw.includes('/')) {
    return highlighted
      ? `<strong class="aid-buff-highlight">${escapeHtml(raw)}</strong>`
      : `<strong>${escapeHtml(raw)}</strong>`;
  }

  const parts = raw.split('/').map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) {
    return highlighted
      ? `<strong class="aid-buff-highlight">${escapeHtml(raw)}</strong>`
      : `<strong>${escapeHtml(raw)}</strong>`;
  }

  const remainingModels = tracker
    ? getPlayTrackerRemainingModels(tracker)
    : Math.max(0, Number(fallbackModels ?? 1) || 0);
  const useAlteredValue = remainingModels <= 1;
  const leftClass = useAlteredValue ? 'is-inactive' : 'is-active-base';
  const rightClass = useAlteredValue ? 'is-active-altered' : 'is-inactive';

  return `<span class="play-stat-split">
    <span class="play-stat-split-part ${leftClass}">${escapeHtml(parts[0])}</span>
    <span class="play-stat-split-sep">/</span>
    <span class="play-stat-split-part ${rightClass}">${escapeHtml(parts[1])}</span>
  </span>`;
}

export function renderPlayerAid(roster, opts = {}) {
  const {
    showHeader = true,
    showUnits = true,
    showStats = true,
    showUnitWeapons = true,
    showUnitAbilities = true,
    allUpgrades = false,
    showUnitPaidUpgrades = true,
    showUnitTags = true,
    showUnitActivation = true,
    showTactical = true,
    showTacticalArt = true,
    showTacticalMeta = true,
    showTacticalGas = true,
    showTacticalTags = true,
    showTacticalAbilities = true,
    showTacticalPhase = true,
    showTacticalActivation = true,
    showTacticalDescriptions = true,
    mergedBuffs = false,
    dedupeUnits = true,
    playTrackers = null,
    unitKeyPrefix = '',
    rosterLabel = '',
    collapsedUnits = new Set(),
    getTrackerDisabledAttrs = () => '',
  } = opts;

  const { minerals: m, gas: g, supply, resources, tacticalCardDetails,
          units, faction, factionCard, seed, slots } = roster;
  const resourceShort = RESOURCE_SHORT[faction] ?? 'res';
  const resourceIcon  = RESOURCE_ICON[faction]  ?? '◈';
  const factionClass  = `faction-${String(faction).toLowerCase()}`;
  const slotBreakdown = formatSlotBreakdown(slots);

  const unitsToRender = dedupeUnits
    ? (() => {
      const seenUnitKeys = new Set();
      return units.filter(u => {
        const key = getAidUnitKey(u);
        if (seenUnitKeys.has(key)) return false;
        seenUnitKeys.add(key);
        return true;
      });
    })()
    : [...units];

  const unitBlocks = unitsToRender.map((u, unitIndex) => {
    const rawUnitKey = dedupeUnits ? getAidUnitKey(u) : `${String(u?.id || 'unit')}-${unitIndex}`;
    const unitKey    = `${unitKeyPrefix}${rawUnitKey}`;
    const tracker    = playTrackers?.unitsByKey?.[unitKey] ?? null;
    const isDead     = !!tracker && (tracker.maxHealthPools?.length ?? 0) > 0 && getPlayTrackerCurrentHealth(tracker) <= 0;
    const isCollapsed = collapsedUnits.has(unitKey);
    const abbr   = TYPE_ABBR[u.type] ?? '?';
    const models = u.models > 1 ? ` ×${u.models}` : '';

    const aidUpgradePills = showUnitPaidUpgrades
      ? sortUpgradesForDisplay(u.activeUpgrades ?? [])
        .filter(upg => Number(upg?.cost ?? 0) > 0)
        .map(upg => `<span class="upg-pill">+ ${escapeHtml(upg.name)} <strong>${upg.cost}m</strong></span>`)
        .join('')
      : '';

    const upgradeList    = sortUpgradesForDisplay(u.allUpgrades ?? []);
    const weaponProfiles = resolveLinkedWeaponReplacements(
      upgradeList
        .filter(isWeaponProfile)
        .filter(ug => isNaturalAbility(ug) || ug.active)
        .map(parseWeaponProfile),
      u.models
    ).sort(compareAidWeaponProfiles);

    const visibleUpgrades = upgradeList
      .filter(ug => !isWeaponProfile(ug))
      .filter(ug => allUpgrades || isNaturalAbility(ug) || ug.active);

    // ── Buff merging ──────────────────────────────────────────────────────────
    const mergedBuffEntries = [];
    const weaponBuffMap     = new Map();
    const unitStatDeltas    = {};
    const displayedAbilities = [];

    for (const ability of visibleUpgrades) {
      const detected = detectUnconditionalPassiveBuff(ability, weaponProfiles);
      const hasDetectedHighlights     = (detected?.highlights?.length ?? 0) > 0;
      const hasWeaponApplications     = (detected?.weaponApplications?.length ?? 0) > 0;
      const hasUnitStatApplications   = (detected?.unitStatApplications?.length ?? 0) > 0;

      if (mergedBuffs && (hasDetectedHighlights || hasWeaponApplications || hasUnitStatApplications)) {
        const weaponEffects    = (detected.weaponApplications ?? []).map(e => String(e.effect || '').trim());
        const weaponEffectSet  = new Set(weaponEffects.map(e => e.toLowerCase()));
        const weaponEffectTokens = weaponEffects.map(e => e.toLowerCase());
        const genericWeaponStatHighlights = new Set(['range', 'roa', 'hit', 'dmg', 'damage', 'surge']);
        const unitStatHighlightTokens = new Set();
        const unitStatAliases = {
          hp: ['hp', 'hit', 'hit point', 'hit points'],
          armor: ['armor', 'armour'], evade: ['evade'], speed: ['speed'],
          shield: ['shield'], supply: ['supply'],
        };
        for (const entry of detected.unitStatApplications ?? []) {
          const text  = String(entry?.text  || '').trim().toLowerCase();
          const field = String(entry?.field || '').trim().toLowerCase();
          if (text) unitStatHighlightTokens.add(text);
          for (const alias of unitStatAliases[field] ?? []) unitStatHighlightTokens.add(alias);
        }

        const nonWeaponHighlights = (detected.highlights ?? [])
          .filter(effect => !weaponEffectSet.has(String(effect || '').trim().toLowerCase()))
          .filter(effect => {
            const normalized = String(effect || '').trim().toLowerCase();
            if (!normalized) return false;
            if (genericWeaponStatHighlights.has(normalized) && weaponEffectTokens.some(t => t.includes(normalized))) return false;
            if (unitStatHighlightTokens.has(normalized)) return false;
            for (const token of unitStatHighlightTokens) {
              if (token && normalized.includes(token)) return false;
            }
            return true;
          });

        if (nonWeaponHighlights.length) mergedBuffEntries.push({ name: ability.name, highlights: nonWeaponHighlights });

        for (const entry of detected.weaponApplications ?? []) {
          const key = String(entry.weaponName || '').toLowerCase();
          if (!key) continue;
          if (!weaponBuffMap.has(key)) weaponBuffMap.set(key, { statDeltas: {}, fieldReplacements: {}, traits: [] });
          const target = weaponBuffMap.get(key);
          if (entry.parsed?.kind === 'stat-delta' && entry.parsed.field) {
            const field = entry.parsed.field;
            target.statDeltas[field] = Number(target.statDeltas[field] ?? 0) + Number(entry.parsed.delta ?? 0);
          } else if (entry.parsed?.kind === 'field-replacement' && entry.parsed.field) {
            target.fieldReplacements[entry.parsed.field] = entry.parsed.value;
          } else if (entry.parsed?.kind === 'trait' && entry.parsed.trait) {
            target.traits.push(entry.parsed.trait);
          }
        }

        for (const entry of detected.unitStatApplications ?? []) {
          const field = String(entry?.field || '').trim();
          if (!field) continue;
          unitStatDeltas[field] = Number(unitStatDeltas[field] ?? 0) + Number(entry?.delta ?? 0);
        }
      } else {
        displayedAbilities.push({ ...ability, _detectedHighlights: detected?.highlights ?? [] });
      }
    }

    // ── Weapon buff application ───────────────────────────────────────────────
    const buffedWeaponProfiles = weaponProfiles.map(weapon => {
      const key     = String(weapon.name || '').toLowerCase();
      const applied = weaponBuffMap.get(key);
      const isPaidWeaponUpgrade = !!weapon.active && !isNaturalAbility(weapon);
      if (!applied) {
        return {
          ...weapon,
          nameHighlighted: isPaidWeaponUpgrade,
          isModified: isPaidWeaponUpgrade,
        };
      }

      const fieldHighlights = {};
      const applyField = (field, currentValue) => {
        const delta = Number(applied.statDeltas?.[field] ?? 0);
        return delta ? applyNumericDelta(currentValue, delta) : { value: currentValue, changed: false };
      };

      const rangeApplied = applyField('range',  weapon.range);
      const roaApplied   = applyField('roa',    weapon.roa);
      const hitApplied   = applyField('hit',    weapon.hit);
      const dmgApplied   = applyField('damage', weapon.damage);
      fieldHighlights.range  = rangeApplied.changed;
      fieldHighlights.roa    = roaApplied.changed;
      fieldHighlights.hit    = hitApplied.changed;
      fieldHighlights.damage = dmgApplied.changed;

      let nextSurge = weapon.surge;
      if (typeof applied.fieldReplacements?.surge === 'string' && applied.fieldReplacements.surge.trim()) {
        const normalizedSurge = applied.fieldReplacements.surge.trim();
        fieldHighlights.surge = normalizedSurge !== String(weapon.surge ?? '').trim();
        nextSurge = normalizedSurge;
      } else {
        fieldHighlights.surge = false;
      }

      const baseTraits   = splitTraitTokens(weapon.traits);
      const addedTraits  = [...new Set((applied.traits ?? []).map(x => String(x).trim()).filter(Boolean))];
      const mergedTraitsResult = mergeWeaponTraits(baseTraits, addedTraits);
      const hasChanges = Object.values(fieldHighlights).some(Boolean) || mergedTraitsResult.highlights.length;
      if (!hasChanges && !isPaidWeaponUpgrade) return weapon;

      return {
        ...weapon,
        range:  rangeApplied.value,
        roa:    roaApplied.value,
        hit:    hitApplied.value,
        damage: dmgApplied.value,
        surge:  nextSurge,
        traits: mergedTraitsResult.merged.join(' | '),
        fieldHighlights,
        traitHighlights: mergedTraitsResult.highlights,
        nameHighlighted: isPaidWeaponUpgrade || hasChanges,
        isModified: isPaidWeaponUpgrade || hasChanges,
      };
    });

    // ── Unit stat buff application ────────────────────────────────────────────
    const buffedUnitStats   = { ...(u.stats ?? {}) };
    const unitStatHighlights = {};
    for (const [field, deltaRaw] of Object.entries(unitStatDeltas)) {
      if (field === 'supply') continue;
      const delta   = Number(deltaRaw ?? 0);
      if (!delta) continue;
      const applied = applyNumericDelta(buffedUnitStats[field], delta);
      buffedUnitStats[field] = applied.value;
      unitStatHighlights[field] = applied.changed;
    }

    const trackerSupplyState = tracker ? getPlayTrackerSupplyTier(tracker) : null;
    let displaySupply   = trackerSupplyState ? trackerSupplyState.currentSupply : u.supply;
    let supplyHighlighted = false;
    if (Number(unitStatDeltas.supply ?? 0)) {
      const appliedSupply   = applyNumericDelta(displaySupply, Number(unitStatDeltas.supply));
      displaySupply         = appliedSupply.value;
      supplyHighlighted     = appliedSupply.changed;
    }
    const diminishedSupply = !!trackerSupplyState && trackerSupplyState.currentSupply < Number(u.supply ?? 0);

    // ── Stat chips HTML ───────────────────────────────────────────────────────
    const collapsedStatChips = [
      ['HP', buffedUnitStats.hp, 'hp'], ['ARM', buffedUnitStats.armor, 'armor'],
      ['EVD', buffedUnitStats.evade, 'evade'], ['SPD', buffedUnitStats.speed, 'speed'],
      ['SH', buffedUnitStats.shield, 'shield'],
    ]
      .filter(([, value]) => hasStatValue(value))
      .map(([label, value, field]) => {
        const collapsedValue = resolveCollapsedSlashStat(value, tracker, u.models);
        const highlighted = (mergedBuffs && !!unitStatHighlights[field]) || collapsedValue.isDiminished;
        const valueHtml = highlighted
          ? `<strong class="aid-buff-highlight">${escapeHtml(String(collapsedValue.value))}</strong>`
          : `<strong>${escapeHtml(String(collapsedValue.value))}</strong>`;
        const chipClasses = [
          'stat-chip',
          `stat-chip-${escapeHtml(field)}`,
          'stat-chip-stacked',
          collapsedValue.isDiminished ? 'is-diminished' : '',
        ].filter(Boolean).join(' ');
        return `<span class="${chipClasses}"><span class="stat-chip-label">${label}</span>${valueHtml}</span>`;
      })
      .join('');
    const expandedStatChips = [
      ['HP', buffedUnitStats.hp, 'hp'],
      ['ARM', buffedUnitStats.armor, 'armor'],
      ['EVD', buffedUnitStats.evade, 'evade'],
      ['SPD', buffedUnitStats.speed, 'speed'],
      ['SH', buffedUnitStats.shield, 'shield'],
    ]
      .filter(([, value]) => hasStatValue(value))
      .map(([label, value, field]) => {
        const highlighted = mergedBuffs && !!unitStatHighlights[field];
        const valueHtml = highlighted
          ? `<strong class="aid-buff-highlight">${escapeHtml(String(value))}</strong>`
          : `<strong>${escapeHtml(String(value))}</strong>`;
        return `<span class="stat-chip stat-chip-stacked stat-chip-${escapeHtml(field)}"><span class="stat-chip-label">${label}</span>${valueHtml}</span>`;
      })
      .join('');
    const expandedSupplyHtml = mergedBuffs && supplyHighlighted
      ? `<span class="stat-chip stat-chip-supply stat-chip-stacked${diminishedSupply ? ' is-diminished' : ''}"><span class="stat-chip-label">SUP</span><strong class="aid-buff-highlight">${escapeHtml(String(displaySupply))}</strong></span>`
      : `<span class="stat-chip stat-chip-supply stat-chip-stacked${diminishedSupply ? ' is-diminished' : ''}"><span class="stat-chip-label">SUP</span><strong>${escapeHtml(String(displaySupply))}</strong></span>`;
    const collapsedSupplyHtml = mergedBuffs && supplyHighlighted
      ? `<span class="stat-chip stat-chip-supply stat-chip-stacked${diminishedSupply ? ' is-diminished' : ''}"><span class="stat-chip-label">SUP</span><strong class="aid-buff-highlight">${escapeHtml(String(displaySupply))}</strong></span>`
      : `<span class="stat-chip stat-chip-supply stat-chip-stacked${diminishedSupply ? ' is-diminished' : ''}"><span class="stat-chip-label">SUP</span><strong>${escapeHtml(String(displaySupply))}</strong></span>`;
    const expandedMineralsHtml = `<span class="stat-chip stat-chip-minerals stat-chip-stacked stat-chip-cost"><span class="stat-chip-label">MIN</span><strong>${u.totalCost}m</strong></span>`;
    const expandedPlayStatBoxes = [
      ['HP', buffedUnitStats.hp, 'hp'],
      ['ARM', buffedUnitStats.armor, 'armor'],
      ['EVD', buffedUnitStats.evade, 'evade'],
      ['SPD', buffedUnitStats.speed, 'speed'],
      ['SH', buffedUnitStats.shield, 'shield'],
    ]
      .filter(([, value]) => hasStatValue(value))
      .map(([label, value, field]) => {
        const highlighted = mergedBuffs && !!unitStatHighlights[field];
        const valueHtml = renderExpandedStatValue(value, tracker, u.models, highlighted);
        return `<div class="play-stat-box play-stat-box-${escapeHtml(field)}">
          <div class="play-stat-box-label">${label}</div>
          <div class="play-stat-box-value">${valueHtml}</div>
        </div>`;
      })
      .join('');
    const expandedPlaySupplyBox = renderPlaySupplyBox(
      tracker ?? { squadProfile: u.squadProfile, startingModels: u.models, baseSupply: u.supply },
      {
        fallbackSupply: u.supply,
        displaySupply,
        highlighted: mergedBuffs && supplyHighlighted,
        diminished: diminishedSupply,
      },
    );
    const expandedPlayMineralsBox = `<div class="play-stat-box play-stat-box-minerals">
      <div class="play-stat-box-label">MIN</div>
      <div class="play-stat-box-value"><strong>${u.totalCost}m</strong></div>
    </div>`;
    const supplyProfileHtml = tracker
      ? ''
      : renderPlaySupplyProfile(
        tracker ?? { squadProfile: u.squadProfile, startingModels: u.models, baseSupply: u.supply },
        u.supply,
      );

    // ── Tracker HTML ──────────────────────────────────────────────────────────
    const trackerDisabledAttrs = tracker ? getTrackerDisabledAttrs(tracker.side) : '';

    const collapsedTrackerHtml = tracker ? `<div class="play-collapsed-trackers">
      <button class="btn ghost sm" type="button" data-play-action="hp-dec" data-unit-key="${escapeHtml(unitKey)}"${trackerDisabledAttrs}>-</button>
      <span class="play-health-value">${renderPlayHealthReadout(tracker)}</span>
      <button class="btn ghost sm" type="button" data-play-action="hp-inc" data-unit-key="${escapeHtml(unitKey)}"${trackerDisabledAttrs}>+</button>
      <button class="btn ghost sm play-activation-btn${tracker.activation?.movement ? ' is-on' : ''}" type="button" data-play-action="toggle-activation" data-unit-key="${escapeHtml(unitKey)}" data-phase="movement"${trackerDisabledAttrs}>M</button>
      <button class="btn ghost sm play-activation-btn${tracker.activation?.assault ? ' is-on' : ''}" type="button" data-play-action="toggle-activation" data-unit-key="${escapeHtml(unitKey)}" data-phase="assault"${trackerDisabledAttrs}>A</button>
      <button class="btn ghost sm play-activation-btn${tracker.activation?.combat ? ' is-on' : ''}" type="button" data-play-action="toggle-activation" data-unit-key="${escapeHtml(unitKey)}" data-phase="combat"${trackerDisabledAttrs}>C</button>
      <button class="btn ghost sm play-deployed-btn${tracker.deployed ? ' is-on' : ''}" type="button" data-play-action="toggle-deployed" data-unit-key="${escapeHtml(unitKey)}"${trackerDisabledAttrs}>Dep</button>
    </div>` : '';

    const tagPillsHtml = String(u.tags || '')
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean)
      .map(tag => `<span class="aid-tag-pill">${escapeHtml(tag)}</span>`)
      .join('');
    const tagsInlineHtml = showUnitTags && tagPillsHtml
      ? `<div class="aid-tags-inline"><span class="aid-tags-label">Tags:</span><div class="aid-tags-pills">${tagPillsHtml}</div></div>`
      : '';

    const headerStatlineHtml = showStats
      ? `<div class="aid-header-statline aid-collapsed-grid${tracker ? ' is-play-mode' : ''}">${collapsedStatChips}${collapsedSupplyHtml}${collapsedTrackerHtml}</div>`
      : '';
    const statsHtml = showStats ? (tracker
      ? `
      <div class="play-expanded-stats-row">
        <div class="play-expanded-stats-grid">
          ${expandedPlayStatBoxes}
          ${expandedPlaySupplyBox}
          ${expandedPlayMineralsBox}
        </div>
      </div>`
      : `
      <div class="aid-stats-row">
        <div class="aid-stats">${expandedStatChips}${expandedSupplyHtml}${expandedMineralsHtml}</div>
      </div>`) : '';

    const metadataRowHtml = showStats && (tagsInlineHtml || aidUpgradePills) ? `
      <div class="aid-meta-row">
        <div class="aid-meta-left">${tagsInlineHtml}</div>
        <div class="aid-meta-right">${aidUpgradePills ? `<div class="unit-upgrades aid-upgrade-bubbles">${aidUpgradePills}</div>` : ''}</div>
      </div>` : '';

    const weaponsHtml = showUnitWeapons ? renderAidWeaponsTable(buffedWeaponProfiles, { mergedBuffs }) : '';

    const mergedBuffsHtml = mergedBuffEntries.length ? `
      <div class="aid-merged-buffs">
        ${mergedBuffEntries.map(entry => `<span class="upg-pill aid-merged-pill">+ ${escapeHtml(entry.name)}: ${formatAidRichText(entry.highlights.join(', '), { allowLineBreaks: false, highlightTerms: entry.highlights })}</span>`).join('')}
      </div>` : '';

    const abilitiesByPhase = groupAbilitiesByPhase(displayedAbilities);
    const upgradesHtml = showUnitAbilities && displayedAbilities.length ? `
      <div class="aid-section-title">Abilities</div>
      ${abilitiesByPhase.map(group => {
        const phaseTag   = getPhaseTag(group.phase);
        const phaseClass = `phase-${String(group.phase).toLowerCase()}`;
        return `
          <div class="aid-ability-group">
            <span class="aid-phase-tag ${escapeHtml(phaseClass)}" title="${escapeHtml(group.phase)}">${escapeHtml(phaseTag)}</span>
            <div class="aid-upgrades">
              ${group.abilities.map(ug => {
                const natural         = isNaturalAbility(ug);
                const selectedUpgrade = !natural && ug.active;
                const cls  = selectedUpgrade ? 'is-active' : (natural ? 'is-natural' : 'is-inactive');
                const mark = selectedUpgrade ? '✓ ' : '';
                const activation  = parseAidActivation(ug);
                const activationClass = getAidActivationStateClass(activation.state);
                const activationHtml = showUnitActivation && activation.state
                  ? `<span class="aid-inline-chip aid-inline-activation ${escapeHtml(activationClass)}">${escapeHtml(activation.state)}</span>`
                  : '';
                const resourceHtml = showUnitActivation && activation.resource
                  ? `<span class="aid-inline-chip aid-inline-resource">${formatAidRichText(activation.resource, { faction, factionClass, allowLineBreaks: false })}</span>`
                  : '';
                const desc = ug.description
                  ? `<div class="aid-upg-desc">${formatAidRichText(ug.description, { faction, factionClass, highlightTerms: mergedBuffs ? ug._detectedHighlights : [] })}</div>`
                  : '';
                return `<div class="aid-upg ${cls}"><div class="aid-upg-top"><span class="aid-upg-name">${mark}${escapeHtml(ug.name)}</span>${activationHtml}${resourceHtml}</div>${desc}</div>`;
              }).join('')}
            </div>
          </div>`;
      }).join('')}` : '';

    const trackerHtml = tracker ? `
      <div class="play-unit-trackers">
        <div class="play-health-wrap">
          <span class="play-stat-label">Health</span>
          <button class="btn ghost sm" type="button" data-play-action="hp-dec" data-unit-key="${escapeHtml(unitKey)}"${trackerDisabledAttrs}>-</button>
          <span class="play-health-value">${renderPlayHealthReadout(tracker)}</span>
          <button class="btn ghost sm" type="button" data-play-action="hp-inc" data-unit-key="${escapeHtml(unitKey)}"${trackerDisabledAttrs}>+</button>
        </div>
        <div class="play-activation-wrap">
          <span class="play-stat-label">Activated</span>
          <button class="btn ghost sm play-activation-btn${tracker.activation?.movement ? ' is-on' : ''}" type="button" data-play-action="toggle-activation" data-unit-key="${escapeHtml(unitKey)}" data-phase="movement"${trackerDisabledAttrs}>Mov</button>
          <button class="btn ghost sm play-activation-btn${tracker.activation?.assault ? ' is-on' : ''}" type="button" data-play-action="toggle-activation" data-unit-key="${escapeHtml(unitKey)}" data-phase="assault"${trackerDisabledAttrs}>Ass</button>
          <button class="btn ghost sm play-activation-btn${tracker.activation?.combat ? ' is-on' : ''}" type="button" data-play-action="toggle-activation" data-unit-key="${escapeHtml(unitKey)}" data-phase="combat"${trackerDisabledAttrs}>Com</button>
          <button class="btn ghost sm play-deployed-btn${tracker.deployed ? ' is-on' : ''}" type="button" data-play-action="toggle-deployed" data-unit-key="${escapeHtml(unitKey)}"${trackerDisabledAttrs}>Deployed</button>
        </div>
      </div>` : '';

    const visibleMergedBuffsHtml = mergedBuffs ? mergedBuffsHtml : '';
    const hasBody = statsHtml || supplyProfileHtml || metadataRowHtml || weaponsHtml || visibleMergedBuffsHtml || upgradesHtml;

    return `
      <div class="aid-unit${isCollapsed ? ' is-collapsed' : ''}${isDead ? ' play-dead' : ''}" data-aid-unit-key="${escapeHtml(unitKey)}">
        <div class="aid-unit-header" role="button" tabindex="0" aria-expanded="${isCollapsed ? 'false' : 'true'}" aria-label="Toggle ${escapeHtml(u.name)} details">
          <div class="unit-type-badge badge-${escapeHtml(u.type)}">${abbr}</div>
          <div class="unit-info">
            <div class="aid-unit-title-row">
              <div class="unit-name">${escapeHtml(u.name)}${escapeHtml(models)}</div>
              ${headerStatlineHtml}
            </div>
          </div>
          ${showStats ? '' : `<div class="unit-cost">${u.totalCost}m</div>`}
          <span class="aid-collapse-indicator" aria-hidden="true"></span>
        </div>
        ${hasBody ? `<div class="aid-body-wrap"><div class="aid-body">${trackerHtml}${statsHtml}${supplyProfileHtml}${visibleMergedBuffsHtml}${weaponsHtml}${upgradesHtml}${metadataRowHtml}</div></div>` : ''}
      </div>`;
  }).join('');

  const tacticalHtml = showTactical
    ? renderAidTacticalCards(tacticalCardDetails ?? [], {
      faction,
      factionClass,
      showArt: showTacticalArt,
      showMeta: showTacticalMeta,
      showGas: showTacticalGas,
      showTags: showTacticalTags,
      showAbilities: showTacticalAbilities,
      showPhase: showTacticalPhase,
      showActivation: showTacticalActivation,
      showDescriptions: showTacticalDescriptions,
    })
    : '';

  return `
    <div class="roster-card ${factionClass}">
      ${showHeader ? `<div class="roster-header">
        <div class="roster-faction ${escapeHtml(faction)}">${rosterLabel ? `${escapeHtml(rosterLabel)} · ` : ''}${escapeHtml(faction.toUpperCase())} · ${escapeHtml(factionCard)}</div>
        <div class="roster-meta">
          <span class="meta-minerals">▣ ${m.used}/${m.limit}m</span>
          <span class="meta-gas">⬡ ${g.used}/${g.limit}g</span>
          <span class="meta-supply">◆ ${supply} sup</span>
          <span><span class="resource-icon resource-${factionClass}">${resourceIcon}</span> ${resources} ${resourceShort}</span>
          <span class="tag seed-tag">${escapeHtml(seed)}</span>
          ${slotBreakdown ? `<span class="slot-breakdown-inline"><span class="slot-breakdown-label">Slots</span>${slotBreakdown}</span>` : ''}
        </div>
      </div>` : ''}
      ${showUnits ? `<div class="unit-list">${unitBlocks}</div>` : ''}
      ${tacticalHtml ? `<div class="aid-tactical-section">${tacticalHtml}</div>` : ''}
    </div>`;
}
