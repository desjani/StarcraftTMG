/**
 * Roster card renderer — pure HTML string output.
 * Accepts a parsed roster object and display options; returns an HTML string.
 * No DOM access, no global state.
 */
import { buildRosterCardViewModel } from '../../../lib/rosterViewModels.js';
import { escapeHtml } from './utils.js';
import { RESOURCE_SHORT, RESOURCE_ICON } from './constants.js';
import {
  formatUnitStatsInline, formatSlotBreakdown, sortUpgradesForDisplay,
  sortTacticalNames, sortTacticalDetailsByName,
  renderRosterTacticalTag, renderAidTacticalCards,
} from './render-helpers.js';

export function renderRosterCard(roster, opts = {}) {
  const {
    gameData             = null,
    showUpgrades         = true,
    showStats            = false,
    showSize             = true,
    showCost             = true,
    showTactical         = true,
    showTacticalResource = false,
    showTacticalGas      = false,
    showTacticalSupply   = false,
    showSlots            = false,
  } = opts;

  const resolvedRoster = gameData ? buildRosterCardViewModel(roster, gameData) : roster;
  const { minerals: m, gas: g, supply, resources, tacticalCards, tacticalCardDetails,
          units, faction, factionCard, seed, slots } = resolvedRoster;
  const resourceShort = RESOURCE_SHORT[faction] ?? 'res';
  const resourceIcon  = RESOURCE_ICON[faction]  ?? '◈';
  const factionClass  = `faction-${String(faction).toLowerCase()}`;
  const slotBreakdown = showSlots ? formatSlotBreakdown(slots) : '';

  const unitRows = units.map(u => {
    const abbr   = { Hero: 'H', Core: 'C', Elite: 'E', Support: 'S', Air: 'A', Other: 'O' }[u.type] ?? '?';
    const models = u.models > 1 ? ` ×${u.models}` : '';
    const upgrades = showUpgrades
      ? sortUpgradesForDisplay(u.activeUpgrades)
          .filter(x => x.cost > 0)
          .map(x => `<span class="upg-pill">+ ${escapeHtml(x.name)} <strong>${x.cost}m</strong></span>`)
          .join('')
      : '';
    const unitMetaParts = [];
    if (showSize) unitMetaParts.push(`<span class="unit-size">${escapeHtml(u.size)}</span>`);
    unitMetaParts.push(`<span class="unit-supply">${u.supply}◆</span>`);
    if (showCost) unitMetaParts.push(`<span class="unit-main-cost">${u.totalCost}m</span>`);
    const unitMeta = unitMetaParts
      .map((part, idx) => idx === 0 ? part : `<span class="unit-sep">·</span>${part}`)
      .join('');
    const statsText = showStats ? formatUnitStatsInline(u.stats) : '';
    const statsLine = statsText ? `<div class="unit-stats-line">${statsText}</div>` : '';

    return `
      <div class="unit-row">
        <div class="unit-type-badge badge-${u.type}">${abbr}</div>
        <div class="unit-info">
          <div class="unit-main">
            <span class="unit-name">${escapeHtml(u.name)}${escapeHtml(models)}</span>
            <span class="unit-main-meta">${unitMeta}</span>
          </div>
          ${upgrades ? `<div class="unit-sub-line"><span class="unit-upgrades">${upgrades}</span></div>` : ''}
          ${statsLine}
        </div>
      </div>`;
  }).join('');

  const tacticalItems = (tacticalCardDetails?.length
    ? sortTacticalDetailsByName(tacticalCardDetails)
    : sortTacticalNames(tacticalCards).map(name => ({ name, resource: null, gasCost: null, slots: {} })));
  const tactPills = tacticalItems
    .map(card => renderRosterTacticalTag(card, {
      showResource: showTacticalResource,
      showGas:      showTacticalGas,
      showSupply:   showTacticalSupply,
    }, resourceShort, resourceIcon))
    .join('');

  return `
    <div class="roster-card ${factionClass}">
      <div class="roster-header">
        <div class="roster-faction ${escapeHtml(faction)}">${escapeHtml(faction.toUpperCase())} · ${escapeHtml(factionCard)}</div>
        <div class="roster-meta">
          <span class="meta-minerals">▣ ${m.used}/${m.limit}m</span>
          <span class="meta-gas">⬡ ${g.used}/${g.limit}g</span>
          <span class="meta-supply">◆ ${supply} sup</span>
          <span><span class="resource-icon resource-${factionClass}">${resourceIcon}</span> ${resources} ${resourceShort}</span>
          <span class="tag seed-tag">${escapeHtml(seed)}</span>
          ${slotBreakdown ? `<span class="slot-breakdown-inline"><span class="slot-breakdown-label">Slots</span>${slotBreakdown}</span>` : ''}
        </div>
      </div>
      <div class="unit-list">${unitRows}</div>
      ${showTactical && tacticalItems.length ? `<div class="tact-section"><span class="tact-label">Tactical</span>${tactPills}</div>` : ''}
    </div>`;
}
