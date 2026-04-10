/**
 * Pure rendering helpers — build HTML strings from roster/upgrade data.
 * No DOM access, no global state. All functions are pure or pure-by-convention.
 *
 * Imports: utils.js (escapeHtml), constants.js (display maps + phase constants)
 */
import { escapeHtml } from './utils.js';
import { TYPE_ABBR, RESOURCE_SHORT, RESOURCE_ICON, PHASE_ORDER, PHASE_TAG } from './constants.js';

// ─── Sorting / comparison helpers ─────────────────────────────────────────────
export function hasStatValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized || normalized === '-' || normalized.toLowerCase() === 'n/a') return false;
  }
  return true;
}

export function compareText(a, b) {
  return String(a ?? '').localeCompare(String(b ?? ''), undefined, { sensitivity: 'base' });
}

export function compareUpgradesForDisplay(a, b) {
  const costDiff = Number(b?.cost ?? 0) - Number(a?.cost ?? 0);
  if (costDiff !== 0) return costDiff;
  return compareText(a?.name, b?.name);
}

export function sortUpgradesForDisplay(upgrades = []) {
  return [...upgrades].sort(compareUpgradesForDisplay);
}

export function sortTacticalNames(cards = []) {
  return [...cards].sort(compareText);
}

export function sortTacticalDetailsByName(cards = []) {
  return [...cards].sort((a, b) => compareText(a?.name, b?.name));
}

export function getAidUnitKey(unit) {
  const activeNames = (unit?.allUpgrades ?? [])
    .filter(ug => ug.active)
    .map(ug => String(ug.name ?? ug.id ?? ''))
    .sort()
    .join('|');
  return `${unit?.id ?? unit?.name}::${unit?.size}::${activeNames}`;
}

export function compareAidWeaponProfiles(a, b) {
  const aRange = String(a?.range ?? '').trim().toUpperCase();
  const bRange = String(b?.range ?? '').trim().toUpperCase();
  const aIsMelee = aRange === 'E';
  const bIsMelee = bRange === 'E';
  if (aIsMelee !== bIsMelee) return aIsMelee ? 1 : -1;
  return compareText(a?.name, b?.name);
}

// ─── Weapon profile helpers ───────────────────────────────────────────────────
export function resolveLinkedWeaponReplacements(weapons = [], unitModels = 1) {
  const parsedModelCount = Number.parseInt(String(unitModels ?? 1), 10);
  const modelCount = Number.isFinite(parsedModelCount) && parsedModelCount > 0 ? parsedModelCount : 1;
  const byName = new Map(
    weapons
      .map((weapon, index) => [String(weapon?.name ?? '').trim().toLowerCase(), index])
      .filter(([name]) => !!name)
  );

  const replacedBaseNames = new Set();
  for (const weapon of weapons) {
    const linkedTo = String(weapon?.linkedTo ?? '').trim();
    if (!linkedTo || linkedTo === '-' || !weapon?.active) continue;
    const hasSpecialistTrait = /\bSPECIALIST\b/i.test(String(weapon?.traits ?? ''));
    if (hasSpecialistTrait && modelCount > 1) continue;
    const key = linkedTo.toLowerCase();
    if (byName.has(key)) replacedBaseNames.add(key);
  }

  return weapons.filter((weapon) => {
    const nameKey = String(weapon?.name ?? '').trim().toLowerCase();
    if (!nameKey) return true;
    return !replacedBaseNames.has(nameKey);
  });
}

export function isWeaponProfile(upgrade) {
  const description = String(upgrade?.description || '').trim();
  return /^RANGE\s*:/i.test(description) && /\bTARGET\s*:/i.test(description);
}

export function parseWeaponProfile(upgrade) {
  const description = String(upgrade?.description || '').trim();
  const lines = description
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  const statsLine = lines[0] || '';
  const surgeLine = lines.find(line => /^SURGE\s*:/i.test(line)) || '';
  const statEntries = Object.fromEntries(
    statsLine
      .split('|')
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const [label, ...rest] = part.split(':');
        return [String(label || '').trim().toUpperCase(), rest.join(':').trim()];
      })
  );
  const traits = lines
    .slice(lines.indexOf(surgeLine) >= 0 ? lines.indexOf(surgeLine) + 1 : 1)
    .filter(line => !/^SURGE\s*:/i.test(line))
    .join(' | ');

  return {
    name: upgrade?.name ?? '',
    linkedTo: String(upgrade?.linkedTo ?? '').trim(),
    range: statEntries.RANGE ?? '-',
    target: statEntries.TARGET ?? '-',
    roa: statEntries.ROA ?? '-',
    hit: statEntries.HIT ?? '-',
    damage: statEntries.DMG ?? '-',
    surge: surgeLine ? surgeLine.replace(/^SURGE\s*:/i, '').trim() || '-' : '-',
    traits,
    active: !!upgrade?.active,
  };
}

export function renderAidWeaponsTable(weapons, { mergedBuffs = false } = {}) {
  if (!weapons.length) return '';
  const renderCell = (value, highlighted = false) => {
    const inner = escapeHtml(String(value ?? '-'));
    return highlighted ? `<span class="aid-buff-highlight">${inner}</span>` : inner;
  };
  return `
    <div class="aid-section-title">Weapons</div>
    <div class="aid-weapons-wrap">
      <table class="aid-weapons-table">
        <thead>
          <tr>
            <th>Weapon</th><th>Rng</th><th>Target</th><th>RoA</th>
            <th>Hit</th><th>Dmg</th><th>Surge</th><th>Traits</th>
          </tr>
        </thead>
        <tbody>
          ${weapons.map(weapon => `
            <tr class="${weapon.active ? 'is-active' : 'is-inactive'}">
              <td class="weapon-name${weapon.nameHighlighted ? ' is-highlighted' : ''}">${escapeHtml(weapon.name)}</td>
              <td>${renderCell(weapon.range, mergedBuffs && !!weapon.fieldHighlights?.range)}</td>
              <td>${escapeHtml(weapon.target)}</td>
              <td>${renderCell(weapon.roa, mergedBuffs && !!weapon.fieldHighlights?.roa)}</td>
              <td>${renderCell(weapon.hit, mergedBuffs && !!weapon.fieldHighlights?.hit)}</td>
              <td>${renderCell(weapon.damage, mergedBuffs && !!weapon.fieldHighlights?.damage)}</td>
              <td>${renderCell(weapon.surge, mergedBuffs && !!weapon.fieldHighlights?.surge)}</td>
              <td>${formatAidRichText(weapon.traits || '-', {
                allowLineBreaks: false,
                highlightTerms: mergedBuffs ? (weapon.traitHighlights ?? []) : [],
              })}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

// ─── Faction resource label config ────────────────────────────────────────────
export function getFactionResourceLabelConfig(faction, factionClass) {
  return {
    icon: RESOURCE_ICON[faction] ?? '◈',
    className: `resource-${factionClass}`,
    short: faction === 'Terran' ? 'CP' : faction === 'Zerg' ? 'BM' : 'PE',
    label: faction === 'Terran' ? 'Command Point' : faction === 'Zerg' ? 'Biomass' : 'Psionic Energy',
    labelPlural: faction === 'Terran' ? 'Command Points' : faction === 'Zerg' ? 'Biomass' : 'Psionic Energy',
    patterns: faction === 'Terran'
      ? ['Command Point', 'CP']
      : faction === 'Zerg'
        ? ['Biomass', 'BM']
        : ['Psionic Energy', 'PE'],
  };
}

// ─── Rich-text formatter ──────────────────────────────────────────────────────
export function formatAidRichText(text, { faction, factionClass, allowLineBreaks = true, highlightTerms = [] } = {}) {
  let html = escapeHtml(String(text || ''));

  if (faction && factionClass) {
    const resourceConfig = getFactionResourceLabelConfig(faction, factionClass);
    for (const pattern of resourceConfig.patterns) {
      const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(\\d+) ${escapedPattern}`, 'g');
      html = html.replace(regex, (_, amount) =>
        `${amount} <span class="resource-icon ${resourceConfig.className}">${resourceConfig.icon}</span>`);
    }
  }

  const keywordRegex = /\b([A-Z]{2}[A-Z0-9-]*(?:\s+[A-Z]{2}[A-Z0-9-]*)*\s*\([^)\n<>{}]*\)|[A-Z]{2}[A-Z0-9-]*(?:\s+[A-Z]{2}[A-Z0-9-]*)*)/g;
  html = html
    .split(/(<[^>]+>)/g)
    .map(part => part.startsWith('<') ? part : part.replace(keywordRegex, '<strong>$1</strong>'))
    .join('');

  if (highlightTerms.length) {
    const sortedTerms = [...new Set(highlightTerms.filter(Boolean))]
      .sort((a, b) => String(b).length - String(a).length);
    for (const term of sortedTerms) {
      const escaped = String(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const termRegex = new RegExp(`(${escaped})`, 'gi');
      html = html
        .split(/(<[^>]+>)/g)
        .map(part => part.startsWith('<') ? part : part.replace(termRegex, '<span class="aid-buff-highlight">$1</span>'))
        .join('');
    }
  }

  if (allowLineBreaks) html = html.replace(/\r?\n/g, '<br>');
  return html;
}

// ─── Phase normalisation ──────────────────────────────────────────────────────
export function normalizePhaseLabel(phase) {
  const cleaned = String(phase || '').replace(/\s+phase\b/gi, '').trim();
  if (!cleaned) return 'Any';
  if (/\b(any|passive|always)\b/i.test(cleaned)) return 'Any';
  if (/\b(move|movement|maneuver|deploy|setup)\b/i.test(cleaned)) return 'Movement';
  if (/\bassault\b/i.test(cleaned)) return 'Assault';
  if (/\bcombat\b/i.test(cleaned)) return 'Combat';
  if (/\bscor(e|ing)\b/i.test(cleaned)) return 'Scoring';
  if (/\b(cleanup|regroup|end)\b/i.test(cleaned)) return 'Cleanup';
  return 'Any';
}

export function getPhaseTag(phaseLabel) {
  return PHASE_TAG[normalizePhaseLabel(phaseLabel)] ?? 'ANY';
}

export function getAbilityPhaseMeta(phaseLabel) {
  const normalized = normalizePhaseLabel(phaseLabel);
  return { label: PHASE_TAG[normalized] ?? 'ANY', className: normalized.toLowerCase() };
}

// ─── Activation parser ────────────────────────────────────────────────────────
export function parseAidActivation(upgrade) {
  const activationParts = String(upgrade?.activation || '')
    .split(/\r?\n/)
    .map(part => part.trim())
    .filter(Boolean);

  if (activationParts.length === 1) {
    const single = activationParts[0];
    const tagged = single.match(/^<\s*([^>]+)\s*>(?:\s*\(([^)]+)\))?$/);
    if (tagged) {
      return { state: String(tagged[1] || '').trim(), resource: String(tagged[2] || '').trim() };
    }
    const resourceMatch = single.match(/\(([^)]+)\)\s*$/);
    const resource = resourceMatch ? String(resourceMatch[1] || '').trim() : '';
    const state = single.replace(/[<>]/g, '').replace(/\s*\([^)]+\)\s*$/, '').trim();
    return { state, resource };
  }

  return {
    state: activationParts[0] ? activationParts[0].replace(/[<>]/g, '') : '',
    resource: activationParts[1] ? activationParts[1].replace(/[()]/g, '') : '',
  };
}

export function extractAidFactionResourceCost(resourceText, faction, factionClass) {
  if (!resourceText || !faction || !factionClass) return null;
  const resourceConfig = getFactionResourceLabelConfig(faction, factionClass);
  for (const pattern of resourceConfig.patterns) {
    const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = String(resourceText).match(new RegExp(`\\b(\\d+)\\s*${escapedPattern}\\b`, 'i'));
    if (match) {
      return { amount: Number(match[1]), icon: resourceConfig.icon, className: resourceConfig.className };
    }
  }
  return null;
}

export function groupAbilitiesByPhase(abilities = []) {
  const groups = new Map();
  for (const ability of abilities) {
    const phase = normalizePhaseLabel(ability?.phase);
    if (!groups.has(phase)) groups.set(phase, []);
    groups.get(phase).push(ability);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => {
      const ai = PHASE_ORDER.indexOf(a);
      const bi = PHASE_ORDER.indexOf(b);
      const ar = ai === -1 ? PHASE_ORDER.length : ai;
      const br = bi === -1 ? PHASE_ORDER.length : bi;
      if (ar !== br) return ar - br;
      return compareText(a, b);
    })
    .map(([phase, abilitiesInPhase]) => ({ phase, abilities: abilitiesInPhase }));
}

// ─── Buff detection constants ─────────────────────────────────────────────────
const AID_CONDITIONAL_CUES = /\b(if|when|while|after|before|whenever|until|during|within|against|for each|for the purposes of|for controlling|for contesting|for completing|for resolving|instead|at the end|at start|at the start|first|may)\b/i;
const AID_ABILITY_REFERENCE_CUES = /\bspecial\s+ability\s*['']s\b/i;
const AID_MUTATION_VERBS = /\b(gains?|loses?|increase(?:d|s)?|decrease(?:d|s)?|reduce(?:d|s)?|adds?|remove(?:s|d)?|becomes?)\b/i;
const AID_STAT_PATTERNS = [
  /\b(HIT\s*POINTS?|HP|ARMOU?R|EVADE|SPEED|SHIELD|SUPPLY)\b(?:\s+characteristic)?(?:\s+by\s+\d+)?/gi,
  /\b(RANGE|ROA|HIT|DMG|DAMAGE|SURGE)\b(?:\s+characteristic)?(?:\s+by\s+\d+)?/gi,
];
const AID_TRAIT_TERMS = [
  'PRECISION', 'PIERCE', 'LONG RANGE', 'PINPOINT', 'SIDEARM', 'TOUGH',
  'ANTI-EVADE', 'INDIRECT FIRE', 'LOCKED IN', 'CRITICAL HIT', 'IMPACT',
  'HIDDEN', 'NON-LETHAL DAMAGE', 'HEAL', 'BUFF', 'DEBUFF',
];
const AID_EXPLICIT_BUFF_TERM = /\b(?:BUFF|DEBUFF)\s+[A-Z][A-Z0-9-]*(?:\s+[A-Z][A-Z0-9-]*)*\s*\([^)\n]*\)/gi;
const AID_GAINED_EFFECT_TERM = /\bgains?\s+([A-Z][A-Z0-9-]*(?:\s+[A-Z0-9-]*)*\s*\([^)\n]*\))/gi;
const AID_STAT_FIELD_MAP = { RANGE: 'range', ROA: 'roa', HIT: 'hit', DMG: 'damage', DAMAGE: 'damage' };

// ─── Unit stat helpers ────────────────────────────────────────────────────────
export function normalizeAidUnitStatField(token) {
  const normalized = String(token || '').toUpperCase().replace(/\s+/g, ' ').trim();
  if (normalized === 'HP' || normalized === 'HIT POINT' || normalized === 'HIT POINTS') return 'hp';
  if (normalized === 'ARMOR' || normalized === 'ARMOUR') return 'armor';
  if (normalized === 'EVADE') return 'evade';
  if (normalized === 'SPEED') return 'speed';
  if (normalized === 'SHIELD') return 'shield';
  if (normalized === 'SUPPLY') return 'supply';
  return null;
}

export function parseUnitStatEffects(text) {
  const source = String(text || '');
  const effects = [];
  const seen = new Set();

  const toDelta = (verb, amount) => {
    const lower = String(verb || '').toLowerCase();
    return (lower.startsWith('decreas') || lower.startsWith('reduc')) ? -amount : amount;
  };

  const addEffect = (fieldToken, verb, amountRaw, hit) => {
    const field = normalizeAidUnitStatField(fieldToken);
    const amount = Number.parseInt(String(amountRaw || ''), 10);
    if (!field || !Number.isFinite(amount) || amount <= 0) return;
    const delta = toDelta(verb, amount);
    const textHit = String(hit || '').trim();
    const key = `${field}:${delta}:${textHit.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    effects.push({ field, delta, text: textHit });
  };

  let match;
  const statFirst = /\b(HIT\s*POINTS?|HP|ARMOU?R|EVADE|SPEED|SHIELD|SUPPLY)\b(?:\s+characteristic)?(?:\s+(?:is|was))?\s+(increased?|decreased?|reduced?)\s+by\s+(\d+)/gi;
  while ((match = statFirst.exec(source)) !== null) addEffect(match[1], match[2], match[3], match[0]);

  const verbFirst = /\b(increase|decrease|reduce)\b[^.!?]*?\b(HIT\s*POINTS?|HP|ARMOU?R|EVADE|SPEED|SHIELD|SUPPLY)\b(?:\s+characteristic)?\s+by\s+(\d+)/gi;
  while ((match = verbFirst.exec(source)) !== null) addEffect(match[2], match[1], match[3], match[0]);

  return effects;
}

export function extractBuffEffectTerms(text) {
  const source = String(text || '');
  const terms = [];

  const explicit = source.match(AID_EXPLICIT_BUFF_TERM) ?? [];
  for (const hit of explicit) terms.push(hit.trim());

  for (const pattern of AID_STAT_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const hit = String(match[0] || '').trim();
      if (!hit) continue;
      const at = Number(match.index ?? 0);
      const prevChar = at > 0 ? source.charAt(at - 1) : '';
      if (prevChar === '-') continue;
      terms.push(hit);
    }
    pattern.lastIndex = 0;
  }

  for (const term of AID_TRAIT_TERMS) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b(?:\\s*\\([^)\\n]*\\))?`, 'gi');
    const matches = source.match(regex) ?? [];
    for (const hit of matches) terms.push(hit.trim());
  }

  return [...new Set(terms.filter(Boolean))];
}

export function extractWeaponEffectTerms(text) {
  const source = String(text || '');
  const terms = [];
  const explicit = source.match(AID_EXPLICIT_BUFF_TERM) ?? [];
  for (const hit of explicit) terms.push(hit.trim());

  let match;
  while ((match = AID_GAINED_EFFECT_TERM.exec(source)) !== null) {
    const captured = String(match[1] || '').trim();
    if (captured) terms.push(captured);
  }
  AID_GAINED_EFFECT_TERM.lastIndex = 0;

  const surgeMatch = source.match(/\bgains?\s+surge\s+type\s*:\s*([^,.;]+)(?:,\s*and\s*s\s*dice\s*:\s*([^.;]+))?/i);
  if (surgeMatch) {
    const surgeType = String(surgeMatch[1] || '').trim();
    const surgeDice = String(surgeMatch[2] || '').trim();
    if (surgeType) terms.push(`SURGE: ${surgeType}${surgeDice ? ` (${surgeDice})` : ''}`);
  }

  return [...new Set(terms.filter(Boolean))];
}

export function parseWeaponEffect(effectText) {
  const text = String(effectText || '').trim();
  if (!text) return null;

  const surgeReplacement = text.match(/^SURGE\s*:\s*(.+)$/i);
  if (surgeReplacement) {
    const value = String(surgeReplacement[1] || '').trim();
    if (!value) return null;
    return { kind: 'field-replacement', field: 'surge', value, text };
  }

  const buffMatch = text.match(/^(BUFF|DEBUFF)\s+([A-Z][A-Z0-9-]*)\s*\(([^)]+)\)$/i);
  if (buffMatch) {
    const mode = buffMatch[1].toUpperCase();
    const statToken = buffMatch[2].toUpperCase();
    const statField = AID_STAT_FIELD_MAP[statToken] ?? null;
    const value = Number.parseInt(buffMatch[3], 10);
    if (statField && Number.isFinite(value)) {
      return { kind: 'stat-delta', field: statField, delta: mode === 'DEBUFF' ? -value : value, text };
    }
    return { kind: 'trait', trait: text };
  }

  if (/^[A-Z][A-Z0-9-]*(?:\s+[A-Z0-9-]*)*\s*\([^)]+\)$/i.test(text)) {
    return { kind: 'trait', trait: text };
  }
  return null;
}

// ─── Trait merging ────────────────────────────────────────────────────────────
export function splitTraitTokens(traits) {
  return String(traits || '').split(/\s*\|\s*|\s*,\s*/).map(t => t.trim()).filter(Boolean);
}

export function normalizeTraitKey(trait) {
  return String(trait || '').replace(/\s*\([^)]+\)\s*$/, '').trim().toUpperCase();
}

export function parseTraitNumericRank(trait) {
  const match = String(trait || '').match(/\((\d+)\)\s*$/);
  return match ? Number.parseInt(match[1], 10) : Number.NaN;
}

export function mergeWeaponTraits(baseTraits, addedTraits) {
  const ordered = [];
  const byKey = new Map();

  const add = (trait, fromAdded) => {
    const cleaned = String(trait || '').trim();
    if (!cleaned) return;
    const key = normalizeTraitKey(cleaned);
    const rank = parseTraitNumericRank(cleaned);
    if (!byKey.has(key)) {
      byKey.set(key, { text: cleaned, rank, fromAdded });
      ordered.push(key);
      return;
    }
    const prev = byKey.get(key);
    if (Number.isFinite(rank) && (!Number.isFinite(prev.rank) || rank > prev.rank)) {
      byKey.set(key, { text: cleaned, rank, fromAdded: true });
    }
  };

  for (const trait of baseTraits) add(trait, false);
  for (const trait of addedTraits) add(trait, true);

  const merged = ordered.map(key => byKey.get(key)?.text).filter(Boolean);
  const highlights = ordered.map(key => byKey.get(key)).filter(e => e?.fromAdded).map(e => e.text);
  return { merged, highlights };
}

export function applyNumericDelta(value, delta) {
  const numeric = Number.parseInt(String(value || '').trim(), 10);
  if (!Number.isFinite(numeric)) return { value, changed: false };
  return { value: String(numeric + delta), changed: true };
}

// ─── Buff detection ───────────────────────────────────────────────────────────
export function detectWeaponBuffTargets(chunk, weaponProfiles = []) {
  const results = [];
  const quoted = chunk.replace(/[']/g, "'");

  for (const weapon of weaponProfiles) {
    const weaponName = String(weapon?.name || '').trim();
    if (!weaponName) continue;
    const escapedWeapon = weaponName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`\\b${escapedWeapon}\\b`, 'i').test(quoted)) continue;
    const effects = extractWeaponEffectTerms(quoted);
    if (!effects.length) continue;
    for (const effect of effects) {
      const parsed = parseWeaponEffect(effect);
      if (!parsed) continue;
      results.push({ weaponName, effect, parsed });
    }
  }
  return results;
}

export function detectUnconditionalPassiveBuff(upgrade, weaponProfiles = []) {
  const activation = String(upgrade?.activation ?? '').toLowerCase();
  if (!activation.includes('<passive>')) return null;

  const description = String(upgrade?.description ?? '').trim();
  if (!description) return null;

  const highlights = [];
  const weaponApplications = [];
  const unitStatApplications = [];
  const chunks = description
    .split(/\r?\n+/)
    .flatMap(part => part.split(/(?<=[.!?])\s+/))
    .map(part => part.trim())
    .filter(Boolean);

  for (const chunk of chunks) {
    if (AID_CONDITIONAL_CUES.test(chunk)) continue;
    if (AID_ABILITY_REFERENCE_CUES.test(chunk) && !/\bthis\s+unit\b/i.test(chunk)) continue;
    if (!AID_MUTATION_VERBS.test(chunk)) continue;
    for (const effect of extractBuffEffectTerms(chunk)) highlights.push(effect);
    for (const application of detectWeaponBuffTargets(chunk, weaponProfiles)) weaponApplications.push(application);
    for (const unitEffect of parseUnitStatEffects(chunk)) unitStatApplications.push(unitEffect);
  }

  const uniqueHighlights = [...new Set(highlights.filter(Boolean))];
  const hasWeaponApplications = weaponApplications.some(e => e?.weaponName && e?.effect);
  const hasUnitStatApplications = unitStatApplications.some(e => e?.field && Number.isFinite(e?.delta));
  if (!uniqueHighlights.length && !hasWeaponApplications && !hasUnitStatApplications) return null;
  return {
    highlights: uniqueHighlights,
    weaponApplications: weaponApplications.filter(e => e?.weaponName && e?.effect),
    unitStatApplications: unitStatApplications.filter(e => e?.field && Number.isFinite(e?.delta)),
  };
}

export function isNaturalAbility(upgrade) {
  const cost = upgrade?.cost;
  if (typeof cost === 'number') return cost <= 0;
  if (typeof cost === 'string') {
    const trimmed = cost.trim().toLowerCase();
    if (!trimmed || trimmed === 'free') return true;
    const numericCost = Number.parseFloat(trimmed);
    if (Number.isFinite(numericCost)) return numericCost <= 0;
  }
  return cost == null;
}

// ─── Stat / slot formatting ───────────────────────────────────────────────────
export function formatUnitStatsInline(stats) {
  return [
    ['HP', stats.hp], ['ARM', stats.armor], ['EVD', stats.evade],
    ['SPD', stats.speed], ['SH', stats.shield],
  ]
    .filter(([, value]) => hasStatValue(value))
    .map(([label, value]) => `${label}:${value}`)
    .join(' ');
}

export function formatSlotBreakdown(slots = {}) {
  const ordered = ['Hero', 'Core', 'Elite', 'Support', 'Air'];
  const extras = Object.keys(slots).filter(type => !ordered.includes(type));
  const keys = [...ordered, ...extras];
  return keys
    .filter(type => slots[type] && Number(slots[type]?.avail ?? 0) > 0)
    .map(type => {
      const short = TYPE_ABBR[type] ?? String(type).charAt(0).toUpperCase();
      const used = Number(slots[type]?.used ?? 0);
      const avail = Number(slots[type]?.avail ?? 0);
      const typeClass = `slot-${String(type).toLowerCase()}`;
      return `<span class="slot-chip ${typeClass}"><span class="slot-chip-type">${short}</span> ${used}/${avail}</span>`;
    })
    .join('');
}

export function formatTacticalSupplyTypes(slots = {}) {
  const ordered = ['Hero', 'Core', 'Elite', 'Support', 'Air'];
  const extras = Object.keys(slots).filter(type => !ordered.includes(type));
  const keys = [...ordered, ...extras];
  const letters = [];
  for (const type of keys) {
    const count = Number(slots[type] ?? 0);
    if (count <= 0) continue;
    const letter = TYPE_ABBR[type] ?? String(type).charAt(0).toUpperCase();
    for (let i = 0; i < count; i += 1) letters.push({ type, letter });
  }
  return letters;
}

export function renderRosterTacticalTag(card, { showResource = false, showGas = false, showSupply = false } = {}, resourceShort = 'res', resourceIcon = null) {
  const details = [];
  if (showSupply) {
    const supplyLetters = formatTacticalSupplyTypes(card.slots ?? {});
    if (supplyLetters.length) {
      const supplyHtml = supplyLetters
        .map(({ type, letter }) => `<span class="tact-slot-${escapeHtml(String(type).toLowerCase())}">${escapeHtml(letter)}</span>`)
        .join('');
      details.push(`<span class="tact-tag-supply"><span class="tact-slot-bracket">[</span>${supplyHtml}<span class="tact-slot-bracket">]</span></span>`);
    }
  }
  if (showResource && typeof card.resource === 'number') {
    const symbol = resourceIcon ?? escapeHtml(resourceShort);
    details.push(`<span class="tact-tag-resource">${card.resource}${symbol}</span>`);
  }
  if (showGas && typeof card.gasCost === 'number') {
    details.push(`<span class="tact-tag-gas">${card.gasCost}g</span>`);
  }
  const suffix = details.length ? ` ${details.join(' ')}` : '';
  return `<span class="tag"><span class="tact-tag-name">${escapeHtml(card.name)}</span>${suffix}</span>`;
}

// ─── Tactical card rendering ──────────────────────────────────────────────────
export function groupAidTacticalCards(cards = []) {
  const groups = [];
  const byKey = new Map();
  for (const card of sortTacticalDetailsByName(cards)) {
    const key = String(card?.id ?? card?.name ?? '').trim().toLowerCase();
    if (!key) continue;
    const existing = byKey.get(key);
    if (existing) { existing.count += 1; continue; }
    const group = { ...card, count: 1 };
    byKey.set(key, group);
    groups.push(group);
  }
  return groups;
}

export function parseAidTacticalAbility(ability = {}) {
  const name = String(ability?.name ?? '').trim();
  const rawText = String(ability?.text ?? ability?.description ?? '').trim();
  let activation = '';
  let phase = 'Any Phase';
  let description = rawText;

  const taggedMatch = rawText.match(/^(.*?)\s*<([^>]+)>\s*<([^>]+)>\s*:\s*([\s\S]+)$/);
  if (taggedMatch) {
    activation = String(taggedMatch[2] ?? '').trim();
    phase = String(taggedMatch[3] ?? '').trim() || 'Any Phase';
    description = String(taggedMatch[4] ?? '').trim();
  } else {
    const activationOnlyMatch = rawText.match(/^(.*?)\s*<([^>]+)>\s*:\s*([\s\S]+)$/);
    if (activationOnlyMatch) {
      activation = String(activationOnlyMatch[2] ?? '').trim();
      description = String(activationOnlyMatch[3] ?? '').trim();
    }
  }
  return { name, activation, phase, description };
}

export function renderAidTacticalCards(cards = [], { faction, factionClass } = {}) {
  const groupedCards = groupAidTacticalCards(cards);
  if (!groupedCards.length) return '';

  const resourceConfig = getFactionResourceLabelConfig(faction, factionClass);
  return `
    <div class="aid-section-title">Tactical Cards</div>
    <div class="aid-tactical-grid">
      ${groupedCards.map(card => {
        const meta = [];
        if (typeof card.resource === 'number') {
          meta.push(`<span class="aid-inline-chip aid-inline-resource">${card.resource} <span class="resource-icon ${resourceConfig.className}">${resourceConfig.icon}</span></span>`);
        }
        const supplyLetters = formatTacticalSupplyTypes(card.slots ?? {});
        if (supplyLetters.length) {
          meta.push(`<span class="aid-inline-chip aid-tact-meta-chip aid-tact-slot-chip">${supplyLetters.map(({ type, letter }) => `<span class="aid-tact-slot aid-tact-slot-${escapeHtml(String(type).toLowerCase())}">${escapeHtml(letter)}</span>`).join('')}</span>`);
        }
        if (card.isUnique) meta.push('<span class="aid-inline-chip aid-tact-meta-chip">Unique</span>');

        const abilities = Array.isArray(card.abilities) ? card.abilities.map(parseAidTacticalAbility) : [];
        const artHtml = card.frontUrl
          ? `<div class="aid-tact-art"><img src="${escapeHtml(card.frontUrl)}" alt="${escapeHtml(card.name)}"></div>`
          : '';
        const gasHtml = typeof card.gasCost === 'number'
          ? `<div class="aid-tact-gas-cost">${card.gasCost}g</div>`
          : '';
        const countSuffix = card.count > 1 ? ` <span class="aid-tact-card-count">x${card.count}</span>` : '';
        const tagsHtml = card.tags ? `<div class="aid-tags aid-tact-tags">${escapeHtml(card.tags)}</div>` : '';

        return `
          <article class="aid-tact-card${artHtml ? ' has-art' : ''}">
            <div class="aid-tact-card-header">
              ${artHtml}
              <div class="aid-tact-card-headings">
                <div class="aid-tact-card-name">${escapeHtml(card.name)}${countSuffix}</div>
                ${meta.length ? `<div class="aid-tact-card-meta">${meta.join('')}</div>` : ''}
              </div>
              ${gasHtml}
            </div>
            ${tagsHtml}
            <div class="aid-tact-abilities">
              ${abilities.map(ability => {
                const phaseClass = `phase-${String(normalizePhaseLabel(ability.phase)).toLowerCase()}`;
                const phaseTag = getPhaseTag(ability.phase);
                const activationHtml = ability.activation
                  ? `<span class="aid-inline-chip aid-inline-activation">${escapeHtml(ability.activation)}</span>`
                  : '';
                const phaseHtml = ability.phase
                  ? `<span class="aid-inline-chip ${escapeHtml(phaseClass)} aid-tact-phase-chip">${escapeHtml(phaseTag)}</span>`
                  : '';
                return `
                  <div class="aid-tact-ability">
                    <div class="aid-tact-ability-top">
                      <span class="aid-tact-ability-name">${escapeHtml(ability.name || 'Ability')}</span>
                      ${activationHtml}${phaseHtml}
                    </div>
                    ${ability.description ? `<div class="aid-upg-desc">${formatAidRichText(ability.description, { faction, factionClass })}</div>` : ''}
                  </div>`;
              }).join('')}
            </div>
          </article>`;
      }).join('')}
    </div>`;
}
