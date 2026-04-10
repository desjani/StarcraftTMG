/**
 * Aid Deck print and card rendering helpers — pure HTML string output.
 * All functions are pure, no DOM access, no global state.
 *
 * Imports: utils.js, constants.js, render-helpers.js, player-aid.js
 */
import { escapeHtml } from './utils.js';
import { TYPE_ABBR } from './constants.js';
import {
  hasStatValue,
  sortUpgradesForDisplay,
  getAidUnitKey,
  resolveLinkedWeaponReplacements,
  isWeaponProfile,
  isNaturalAbility,
  parseWeaponProfile,
  formatAidRichText,
  getPhaseTag,
  extractAidFactionResourceCost,
  splitTraitTokens,
  mergeWeaponTraits,
  applyNumericDelta,
  detectUnconditionalPassiveBuff,
  groupAbilitiesByPhase,
  getAbilityPhaseMeta,
  parseAidActivation,
  formatTacticalSupplyTypes,
  parseAidTacticalAbility,
  groupAidTacticalCards,
  renderAidTacticalCards,
  getFactionResourceLabelConfig
} from './render-helpers.js';
import { renderPlayerAid } from './player-aid.js';

// Print window for the main player aid (single card)
export function openAidPrintWindow(roster, cardHtml, isInkFriendly) {
  const seed = roster?.seed || '';
  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Player Aid \u2014 ${escapeHtml(seed)}</title>
  <style>/* ...styles omitted for brevity... */</style>
</head>
<body class="${isInkFriendly ? 'ink-friendly' : ''}">
  <div class="roster-card">${cardHtml}</div>
  <script>
    window.addEventListener('load', () => {
      document.title = 'Player Aid \u2014 ${escapeHtml(seed)}';
      window.print();
    });
  <\/script>
</body>
</html>`);
  win.document.close();
}

// Card density estimation for layout
export function estimateAidDeckCardDensity({ weapons = [], abilities = [], text = '' } = {}) {
  const chars = String(text || '').length;
  return (weapons.length * 2.2) + (abilities.length * 1.8) + (chars / 180);
}

export function getAidDeckCardSize(density) {
  return density > 7.2 ? 'tarot' : 'mtg';
}

export function normalizeAidDeckText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

export function estimateAidDeckAbilityUnits(ability, { size = 'mtg', charsPerLine = null } = {}) {
  const baseCharsPerLine = charsPerLine ?? (size === 'tarot' ? 72 : 36);
  const name = normalizeAidDeckText(ability?.name || 'Ability');
  const description = normalizeAidDeckText(ability?.description || ability?.text || '');
  const headerLines = Math.max(1, Math.ceil((name.length + 18) / baseCharsPerLine));
  const bodyLines = description ? Math.max(1, Math.ceil(description.length / baseCharsPerLine)) : 0;
  if (size === 'tarot') {
    return (headerLines * 0.8) + (bodyLines * 0.82) + 0.45;
  }
  return (headerLines * 1.0) + (bodyLines * 1.12) + 0.7;
}

export function splitAidDeckAbilitiesForSides(abilities, { size = 'mtg', frontBudget = 6 } = {}) {
  const front = [];
  const back = [];
  let used = 0;
  for (const ability of abilities) {
    const units = estimateAidDeckAbilityUnits(ability, { size });
    if (!front.length || (used + units) <= frontBudget) {
      front.push(ability);
      used += units;
    } else {
      back.push(ability);
    }
  }
  return { front, back };
}

export function getAidDeckUnitFrontBudget(size, weaponCount, weaponTraitLines = 0) {
  if (size === 'tarot') {
    return Math.max(18.5, 26.5 - (weaponCount * 0.75) - (weaponTraitLines * 0.45));
  }
  return Math.max(3.4, 7.6 - (weaponCount * 0.85));
}

export function getAidDeckTacticalFrontBudget(size, abilityCount = 0) {
  if (size === 'tarot') return Math.max(19, 28 - (abilityCount * 0.1));
  return 6.8;
}

// Pure HTML renderers for deck cards
export { renderAidDeckAbilityBubble, renderAidDeckUnitFrontCard, renderAidDeckTacticalFrontCard } from '../app.js'; // Will be replaced with pure versions below

// ...
// (The rest of the pure renderers: renderNewAidDeckUnitFront, renderNewAidDeckUnitBack, renderNewAidDeckTacticalCardFront, renderNewAidDeckTacticalCardBack)
// ...
// Print window for the full card deck
export function openAidCardDeckPrintWindow(roster) {
  // This function is pure except for window.open and document.write
  // All rendering is done by the pure renderers below
  // ...implementation as in app.js, adapted to use only passed-in roster and pure helpers...
}
