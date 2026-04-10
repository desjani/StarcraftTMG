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
import { RESOURCE_SHORT, RESOURCE_ICON } from './constants.js';
import {
  sortUpgradesForDisplay, getAidUnitKey, compareAidWeaponProfiles,
  resolveLinkedWeaponReplacements, isWeaponProfile, parseWeaponProfile,
  renderAidWeaponsTable, formatAidRichText, formatSlotBreakdown,
  hasStatValue, groupAbilitiesByPhase, getPhaseTag, parseAidActivation,
  isNaturalAbility, formatTacticalSupplyTypes, renderAidTacticalCards,
  detectUnconditionalPassiveBuff, splitTraitTokens, mergeWeaponTraits,
  applyNumericDelta, extractBuffEffectTerms, normalizePhaseLabel,
} from './render-helpers.js';
import { getPlayTrackerCurrentHealth, renderPlayHealthReadout } from './play-state.js';

export function renderPlayerAid(roster, opts = {}) {
  const {
    showStats      = true,
    allUpgrades    = true,
    showActivation = true,
    showTactical   = true,
    mergedBuffs    = false,
    dedupeUnits    = true,
    playTrackers   = null,
    unitKeyPrefix  = '',
    rosterLabel    = '',
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
    const abbr   = { Hero: 'H', Core: 'C', Elite: 'E', Support: 'S', Air: 'A', Other: 'O' }[u.type] ?? '?';
    const models = u.models > 1 ? ` ×${u.models}` : '';

    const aidUpgradePills = sortUpgradesForDisplay(u.activeUpgrades ?? [])
      .filter(upg => Number(upg?.cost ?? 0) > 0)
      .map(upg => `<span class="upg-pill">+ ${escapeHtml(upg.name)} <strong>${upg.cost}m</strong></span>`)
      .join('');

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
      .filter(ug => isNaturalAbility(ug) || ug.active);

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
      if (!applied) return { ...weapon, nameHighlighted: !!weapon.active };

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
      if (!hasChanges) return weapon;

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
        nameHighlighted: !!weapon.active || hasChanges,
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

    let displaySupply   = u.supply;
    let supplyHighlighted = false;
    if (Number(unitStatDeltas.supply ?? 0)) {
      const appliedSupply   = applyNumericDelta(u.supply, Number(unitStatDeltas.supply));
      displaySupply         = appliedSupply.value;
      supplyHighlighted     = appliedSupply.changed;
    }

    // ── Stat chips HTML ───────────────────────────────────────────────────────
    const statChips = [
      ['HP', buffedUnitStats.hp, 'hp'], ['ARM', buffedUnitStats.armor, 'armor'],
      ['EVD', buffedUnitStats.evade, 'evade'], ['SPD', buffedUnitStats.speed, 'speed'],
      ['SH', buffedUnitStats.shield, 'shield'],
    ]
      .filter(([, value]) => hasStatValue(value))
      .map(([label, value, field]) => {
        const highlighted = mergedBuffs && !!unitStatHighlights[field];
        const valueHtml = highlighted
          ? `<strong class="aid-buff-highlight">${escapeHtml(String(value))}</strong>`
          : `<strong>${escapeHtml(String(value))}</strong>`;
        return `<span class="stat-chip">${label} ${valueHtml}</span>`;
      })
      .join('');

    const supplyHtml = mergedBuffs && supplyHighlighted
      ? `<span class="stat-chip stat-chip-supply">◆ <strong class="aid-buff-highlight">${escapeHtml(String(displaySupply))}</strong></span>`
      : `<span class="stat-chip stat-chip-supply">◆ <strong>${escapeHtml(String(displaySupply))}</strong></span>`;
    const mineralsHtml = `<span class="stat-chip stat-chip-minerals"><strong>${u.totalCost}m</strong></span>`;

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

    const collapsedStatlineHtml = showStats
      ? `<div class="aid-collapsed-statline">${statChips}${supplyHtml}${mineralsHtml}${collapsedTrackerHtml}</div>`
      : '';

    const statsHtml = showStats ? `
      <div class="aid-stats-row">
        <div class="aid-stats">${statChips}${supplyHtml}${mineralsHtml}</div>
        <div class="aid-stats-right">
          ${aidUpgradePills ? `<div class="unit-upgrades aid-upgrade-bubbles">${aidUpgradePills}</div>` : ''}
        </div>
      </div>` : '';

    const weaponsHtml = renderAidWeaponsTable(buffedWeaponProfiles, { mergedBuffs });

    const mergedBuffsHtml = mergedBuffEntries.length ? `
      <div class="aid-merged-buffs">
        ${mergedBuffEntries.map(entry => `<span class="upg-pill aid-merged-pill">+ ${escapeHtml(entry.name)}: ${formatAidRichText(entry.highlights.join(', '), { allowLineBreaks: false, highlightTerms: entry.highlights })}</span>`).join('')}
      </div>` : '';

    const abilitiesByPhase = groupAbilitiesByPhase(displayedAbilities);
    const upgradesHtml = displayedAbilities.length ? `
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
                const activationHtml = showActivation && activation.state
                  ? `<span class="aid-inline-chip aid-inline-activation">${escapeHtml(activation.state)}</span>`
                  : '';
                const resourceHtml = showActivation && activation.resource
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

    const tagsHtml = u.tags ? `<div class="aid-tags">${escapeHtml(String(u.tags))}</div>` : '';

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

    const hasBody = statsHtml || weaponsHtml || mergedBuffsHtml || upgradesHtml || tagsHtml;

    return `
      <div class="aid-unit${isCollapsed ? ' is-collapsed' : ''}${isDead ? ' play-dead' : ''}" data-aid-unit-key="${escapeHtml(unitKey)}">
        <div class="aid-unit-header" role="button" tabindex="0" aria-expanded="${isCollapsed ? 'false' : 'true'}" aria-label="Toggle ${escapeHtml(u.name)} details">
          <div class="unit-type-badge badge-${escapeHtml(u.type)}">${abbr}</div>
          <div class="unit-info">
            <div class="aid-unit-title-row">
              <div class="unit-name">${escapeHtml(u.name)}${escapeHtml(models)}</div>
              ${collapsedStatlineHtml}
            </div>
          </div>
          ${showStats ? '' : `<div class="unit-cost">${u.totalCost}m</div>`}
          <span class="aid-collapse-indicator" aria-hidden="true"></span>
        </div>
        ${hasBody ? `<div class="aid-body-wrap"><div class="aid-body">${trackerHtml}${tagsHtml}${statsHtml}${mergedBuffsHtml}${weaponsHtml}${upgradesHtml}</div></div>` : ''}
      </div>`;
  }).join('');

  const tacticalHtml = showTactical
    ? renderAidTacticalCards(tacticalCardDetails ?? [], { faction, factionClass })
    : '';

  return `
    <div class="roster-card ${factionClass}">
      <div class="roster-header">
        <div class="roster-faction ${escapeHtml(faction)}">${rosterLabel ? `${escapeHtml(rosterLabel)} · ` : ''}${escapeHtml(faction.toUpperCase())} · ${escapeHtml(factionCard)}</div>
        <div class="roster-meta">
          <span>💎 ${m.used}/${m.limit}m</span>
          <span>⛽ ${g.used}/${g.limit}g</span>
          <span class="meta-supply">◆ ${supply} sup</span>
          <span><span class="resource-icon resource-${factionClass}">${resourceIcon}</span> ${resources} ${resourceShort}</span>
          <span class="tag seed-tag">${escapeHtml(seed)}</span>
          ${slotBreakdown ? `<span class="slot-breakdown-inline"><span class="slot-breakdown-label">Slots</span>${slotBreakdown}</span>` : ''}
        </div>
      </div>
      <div class="unit-list">${unitBlocks}</div>
      ${tacticalHtml ? `<div class="aid-tactical-section">${tacticalHtml}</div>` : ''}
    </div>`;
}
