/**
 * StarCraft TMG Roster Viewer — browser app.
 * Imported as a module by index.html.
 * Reuses the same lib/ modules as the server and Discord bot.
 */
import { fetchRoster, fetchTacticalCards } from './lib/firestoreClient.js';
import { parseRoster }           from './lib/rosterParser.js';
import { formatCompact, formatJson } from './lib/formatter.js';
import { createDebugLogger, getUserFacingError } from './appUtils.js';

// ─── State ────────────────────────────────────────────────────────────────────
let currentRoster    = null;
let currentFormatted = '';
let isLoadingRoster  = false;

const debug = createDebugLogger({ search: window.location.search, storage: window.localStorage });

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const seedInput      = document.getElementById('seed-input');
const loadBtn        = document.getElementById('load-btn');
const recentToggleBtn = document.getElementById('recent-toggle-btn');
const saveFavoriteBtn = document.getElementById('save-favorite-btn');
const seedHistorySectionEl = document.getElementById('seed-history-section');
const resultsEl      = document.getElementById('results');
const errorBox       = document.getElementById('error-box');
const loadingBox     = document.getElementById('loading-box');
const recentSeedsEl  = document.getElementById('recent-seeds');
const favoriteSeedsEl = document.getElementById('favorite-seeds');
const noRecentEl     = document.getElementById('no-recent');
const noFavoritesEl  = document.getElementById('no-favorites');
const previewContent = document.getElementById('preview-content');
const rawBox         = document.getElementById('raw-box');
const discordModeToggle = document.getElementById('discord-mode-toggle');
const rosterCardEl   = document.getElementById('roster-card');
const jsonBox        = document.getElementById('json-box');
const charCounter    = document.getElementById('char-counter');
const optCharReadout = document.getElementById('opt-char-readout');
const discordLimitWarning = document.getElementById('discord-limit-warning');
const discordOpts    = document.getElementById('discord-opts');
// Discord / Raw options
const optPlain         = document.getElementById('opt-plain');
const optStats         = document.getElementById('opt-stats');
const optAbbr          = document.getElementById('opt-abbr');
const optTactLines     = document.getElementById('opt-tact-lines');
const optTactAbbr      = document.getElementById('opt-tact-abbr');
const optTactSupply    = document.getElementById('opt-tact-supply');
const optSlotBreakdown = document.getElementById('opt-slot-breakdown');
const optLimit         = document.getElementById('opt-limit');
// Roster Card options + controls
const cardUpgrades   = document.getElementById('card-upgrades');
const cardStats      = document.getElementById('card-stats');
const cardCost       = document.getElementById('card-cost');
const cardTactical   = document.getElementById('card-tactical');
const cardSlots      = document.getElementById('card-slots');
const downloadImgBtn = document.getElementById('download-img-btn');
const copyImgBtn     = document.getElementById('copy-img-btn');
// Player Aid options + controls
const aidStats       = document.getElementById('aid-stats');
const aidAllUpgrades = document.getElementById('aid-all-upgrades');
const aidActivation  = document.getElementById('aid-activation');
const aidTactical    = document.getElementById('aid-tactical');
const aidCardEl      = document.getElementById('aid-card');
const aidDownloadBtn = document.getElementById('aid-download-btn');
const aidCopyImgBtn  = document.getElementById('aid-copy-img-btn');
let discordMode      = 'preview';
let recentCollapsed  = false;
let seedHistory = { recentSeeds: [], favorites: [] };

// ─── Toast notifications ──────────────────────────────────────────────────────
function showToast(message, type = 'success', duration = 2500) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('is-leaving');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

// ─── localStorage persistence ─────────────────────────────────────────────────
const STORAGE_KEY = 'sctmg.prefs';
const SEED_HISTORY_KEY = 'sctmg.seedHistory';
const MAX_RECENT_SEEDS = 10;

function savePrefs() {
  try {
    const activeTab = document.querySelector('.tab.active')?.dataset.tab ?? 'preview';
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      seed: seedInput.value.trim().toUpperCase(),
      tab:  activeTab,
      discordMode,
      ui: {
        recentCollapsed,
      },
      opts: {
        plain:         optPlain.checked,
        stats:         optStats.checked,
        abbr:          optAbbr.checked,
        tactLines:     optTactLines.checked,
        tactAbbr:      optTactAbbr.checked,
        tactSupply:    optTactSupply.checked,
        slotBreakdown: optSlotBreakdown.checked,
        limit:         optLimit.value,
      },
      card: {
        upgrades: cardUpgrades.checked,
        stats:    cardStats.checked,
        cost:     cardCost.checked,
        tactical: cardTactical.checked,
        slots:    cardSlots.checked,
      },
      aid: {
        stats:       aidStats.checked,
        allUpgrades: aidAllUpgrades.checked,
        activation:  aidActivation.checked,
        tactical:    aidTactical.checked,
      },
    }));
  } catch (_) { /* storage unavailable */ }
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const p = JSON.parse(raw);
    if (p.seed) seedInput.value = p.seed;
    if (p.opts) {
      optPlain.checked         = !!p.opts.plain;
      optStats.checked         = !!p.opts.stats;
      optAbbr.checked          = !!p.opts.abbr;
      optTactLines.checked     = !!p.opts.tactLines;
      optTactAbbr.checked      = !!p.opts.tactAbbr;
      optTactSupply.checked    = !!p.opts.tactSupply;
      optSlotBreakdown.checked = !!p.opts.slotBreakdown;
      if (p.opts.limit) optLimit.value = p.opts.limit;
    }
    if (p.card) {
      cardUpgrades.checked = p.card.upgrades !== false;
      cardStats.checked    = !!p.card.stats;
      cardCost.checked     = p.card.cost     !== false;
      cardTactical.checked = p.card.tactical !== false;
      cardSlots.checked    = !!p.card.slots;
    }
    if (p.aid) {
      aidStats.checked       = p.aid.stats       !== false;
      aidAllUpgrades.checked = p.aid.allUpgrades !== false;
      aidActivation.checked  = p.aid.activation  !== false;
      aidTactical.checked    = p.aid.tactical    !== false;
    }
    // Legacy compatibility: old saved "raw" tab now maps to preview + raw mode.
    const savedTab = p.tab === 'raw' ? 'preview' : p.tab;
    const savedMode = p.discordMode ?? (p.tab === 'raw' ? 'raw' : 'preview');
    recentCollapsed = !!p.ui?.recentCollapsed;
    applyRecentCollapsed(false);
    setDiscordMode(savedMode, { save: false });
    if (savedTab && savedTab !== 'preview') {
      const tabEl = document.querySelector(`.tab[data-tab="${savedTab}"]`);
      if (tabEl) tabEl.click();
    }
  } catch (_) { /* corrupt storage — ignore */ }
}

function setDiscordMode(mode, { save = true } = {}) {
  discordMode = mode === 'raw' ? 'raw' : 'preview';
  const isRaw = discordMode === 'raw';
  previewContent.style.display = isRaw ? 'none' : '';
  rawBox.style.display = isRaw ? 'block' : 'none';
  discordModeToggle.checked = isRaw;
  if (save) savePrefs();
}

function applyRecentCollapsed(save = true) {
  seedHistorySectionEl.style.display = recentCollapsed ? 'none' : '';
  recentToggleBtn.textContent = recentCollapsed ? 'Show History' : 'Hide History';
  if (save) savePrefs();
}

function sanitizeSeed(seed) {
  return String(seed || '').trim().toUpperCase();
}

function saveSeedHistory() {
  try {
    localStorage.setItem(SEED_HISTORY_KEY, JSON.stringify(seedHistory));
  } catch (_) { /* storage unavailable */ }
}

function loadSeedHistory() {
  try {
    const raw = localStorage.getItem(SEED_HISTORY_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const recentSeeds = Array.isArray(parsed.recentSeeds) ? parsed.recentSeeds : [];
    const favorites = Array.isArray(parsed.favorites) ? parsed.favorites : [];
    seedHistory = {
      recentSeeds: recentSeeds.map(sanitizeSeed).filter(Boolean),
      favorites: favorites
        .filter(f => f && typeof f === 'object')
        .map(f => ({
          name: String(f.name || '').trim(),
          seed: sanitizeSeed(f.seed),
        }))
        .filter(f => f.name && f.seed),
    };
  } catch (_) { /* corrupt storage — ignore */ }
}

function renderSeedHistory() {
  recentSeedsEl.innerHTML = '';
  favoriteSeedsEl.innerHTML = '';

  const recent = seedHistory.recentSeeds;
  const favorites = seedHistory.favorites;

  noRecentEl.style.display = recent.length ? 'none' : '';
  noFavoritesEl.style.display = favorites.length ? 'none' : '';

  for (const seed of recent) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'seed-pill';
    btn.dataset.seed = seed;
    btn.textContent = seed;
    recentSeedsEl.appendChild(btn);
  }

  for (const fav of favorites) {
    const row = document.createElement('div');
    row.className = 'favorite-item';
    row.innerHTML = `
      <div class="favorite-meta">
        <div class="favorite-name">${escapeHtml(fav.name)}</div>
        <div class="favorite-seed">${escapeHtml(fav.seed)}</div>
      </div>
      <div class="favorite-actions">
        <button type="button" class="btn ghost sm" data-favorite-load="${escapeHtml(fav.seed)}">Load</button>
        <button type="button" class="btn ghost sm" data-favorite-remove="${escapeHtml(fav.seed)}">Remove</button>
      </div>`;
    favoriteSeedsEl.appendChild(row);
  }
}

function addRecentSeed(seed) {
  const normalized = sanitizeSeed(seed);
  if (!normalized) return;
  seedHistory.recentSeeds = [
    normalized,
    ...seedHistory.recentSeeds.filter(s => s !== normalized),
  ].slice(0, MAX_RECENT_SEEDS);
  saveSeedHistory();
  renderSeedHistory();
}

function saveFavoriteSeed(seed, name) {
  const normalizedSeed = sanitizeSeed(seed);
  const normalizedName = String(name || '').trim();
  if (!normalizedSeed || !normalizedName) return false;
  const existingIdx = seedHistory.favorites.findIndex(f => f.seed === normalizedSeed);
  if (existingIdx >= 0) {
    seedHistory.favorites[existingIdx].name = normalizedName;
  } else {
    seedHistory.favorites.unshift({ name: normalizedName, seed: normalizedSeed });
  }
  saveSeedHistory();
  renderSeedHistory();
  return true;
}

function removeFavoriteSeed(seed) {
  const normalized = sanitizeSeed(seed);
  seedHistory.favorites = seedHistory.favorites.filter(f => f.seed !== normalized);
  saveSeedHistory();
  renderSeedHistory();
}

// ─── ANSI → HTML renderer ─────────────────────────────────────────────────────
// Approximates how Discord renders ```ansi blocks in its dark theme.
const ANSI_FG = {
  30: '#808080', 31: '#ff5555', 32: '#55ff55', 33: '#ffcc00',
  34: '#5b8fe8', 35: '#ff79c6', 36: '#8be9fd', 37: '#f8f8f2',
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Convert a raw ANSI-coloured Discord code block string to HTML for preview.
 * Strips the opening/closing fence markers and converts \u001b[...m sequences
 * to inline-styled <span> elements.
 */
function ansiToHtml(raw) {
  // Strip ```ansi or ``` fences
  let text = raw
    .replace(/^```(?:ansi)?\r?\n/, '')
    .replace(/\r?\n```$/, '');

  let html  = '';
  let bold  = false;
  let color = null;

  const parts = text.split('\u001b[');
  for (let i = 0; i < parts.length; i++) {
    if (i === 0) {
      html += escapeHtml(parts[i]).replace(/\n/g, '<br>');
      continue;
    }
    const m = parts[i].match(/^([0-9;]*)m([\s\S]*)/);
    if (!m) { html += escapeHtml(parts[i]).replace(/\n/g, '<br>'); continue; }

    const codes = m[1].split(';').map(Number);
    const rest  = m[2];

    for (const code of codes) {
      if (code === 0)          { bold = false; color = null; }
      else if (code === 1)     { bold = true; }
      else if (ANSI_FG[code])  { color = ANSI_FG[code]; }
    }

    const escaped = escapeHtml(rest).replace(/\n/g, '<br>');
    if (color || bold) {
      const style = [
        color ? `color:${color}` : '',
        bold  ? 'font-weight:bold' : '',
      ].filter(Boolean).join(';');
      html += `<span style="${style}">${escaped}</span>`;
    } else {
      html += escaped;
    }
  }
  return html;
}

// ─── Roster card renderer ─────────────────────────────────────────────────────
const TYPE_ABBR = { Hero: 'H', Core: 'C', Elite: 'E', Support: 'S', Air: 'A', Other: 'O' };
const RESOURCE_SHORT = { Terran: 'cp', Zerg: 'bm', Protoss: 'pe' };
const RESOURCE_ICON = { Terran: '▣', Zerg: '◉', Protoss: '✦' };

function hasStatValue(value) {
  return value !== null && value !== undefined;
}

function formatUnitStatsInline(stats) {
  return [
    ['HP', stats.hp],
    ['ARM', stats.armor],
    ['EVD', stats.evade],
    ['SPD', stats.speed],
    ['SH', stats.shield],
  ]
    .filter(([, value]) => hasStatValue(value))
    .map(([label, value]) => `${label}:${value}`)
    .join(' ');
}

function formatSlotBreakdown(slots = {}) {
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

function renderRosterCard(roster, opts = {}) {
  const {
    showUpgrades = true,
    showStats    = false,
    showCost     = true,
    showTactical = true,
    showSlots    = false,
  } = opts;
  const { minerals: m, gas: g, supply, resources, tacticalCards, units, faction, factionCard, seed, slots } = roster;
  const resourceShort = RESOURCE_SHORT[faction] ?? 'res';
  const resourceIcon = RESOURCE_ICON[faction] ?? '◈';
  const factionClass = `faction-${String(faction).toLowerCase()}`;
  const slotBreakdown = showSlots ? formatSlotBreakdown(slots) : '';

  const unitRows = units.map(u => {
    const abbr     = TYPE_ABBR[u.type] ?? '?';
    const models   = u.models > 1 ? ` ×${u.models}` : '';
    const upgrades = showUpgrades
      ? u.activeUpgrades
          .filter(x => x.cost > 0)
          .map(x => `<span class="upg-pill">+ ${escapeHtml(x.name)} <strong>${x.cost}m</strong></span>`)
          .join('')
      : '';
    const unitMeta = `
      <span class="unit-size">${escapeHtml(u.size)}</span>
      <span class="unit-sep">·</span>
      <span class="unit-supply">${u.supply}◆</span>
      ${showCost ? `<span class="unit-sep">·</span><span class="unit-main-cost">${u.totalCost}m</span>` : ''}`;
    const statsText = showStats ? formatUnitStatsInline(u.stats) : '';
    const statsLine = statsText
      ? `<div class="unit-stats-line">${statsText}</div>`
      : '';
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

  const tactPills = tacticalCards
    .map(t => `<span class="tag">${escapeHtml(t)}</span>`)
    .join('');

  return `
    <div class="roster-card ${factionClass}">
      <div class="roster-header">
        <div class="roster-faction ${escapeHtml(faction)}">${escapeHtml(faction.toUpperCase())} · ${escapeHtml(factionCard)}</div>
        <div class="roster-meta">
          <span>💎 ${m.used}/${m.limit}m</span>
          <span>⛽ ${g.used}/${g.limit}g</span>
          <span class="meta-supply">◆ ${supply} sup</span>
          <span><span class="resource-icon resource-${factionClass}">${resourceIcon}</span> ${resources} ${resourceShort}</span>
          <span class="tag seed-tag">${escapeHtml(seed)}</span>
        </div>
        ${slotBreakdown ? `<div class="slot-breakdown"><span class="slot-breakdown-label">Slots</span>${slotBreakdown}</div>` : ''}
      </div>
      <div class="unit-list">${unitRows}</div>
      ${showTactical && tacticalCards.length ? `<div class="tact-section"><span class="tact-label">Tactical</span>${tactPills}</div>` : ''}
    </div>`;
}

// ─── Player Aid renderer ──────────────────────────────────────────────────────
function renderPlayerAid(roster, opts = {}) {
  const {
    showStats      = true,
    allUpgrades    = true,
    showActivation = true,
    showTactical   = true,
  } = opts;
  const { minerals: m, gas: g, supply, resources, tacticalCards, tacticalCardDetails, units, faction, factionCard, seed } = roster;
  const resourceShort = RESOURCE_SHORT[faction] ?? 'res';
  const resourceIcon = RESOURCE_ICON[faction] ?? '◈';
  const factionClass = `faction-${String(faction).toLowerCase()}`;

  const unitBlocks = units.map(u => {
    const abbr   = TYPE_ABBR[u.type] ?? '?';
    const models = u.models > 1 ? ` ×${u.models}` : '';

    const statsHtml = showStats ? `
      <div class="aid-stats">
        <span class="stat-chip">HP <strong>${u.stats.hp}</strong></span>
        <span class="stat-chip">ARM <strong>${u.stats.armor}</strong></span>
        <span class="stat-chip">EVD <strong>${u.stats.evade}</strong></span>
        <span class="stat-chip">SPD <strong>${u.stats.speed}</strong></span>
        ${hasStatValue(u.stats.shield) ? `<span class="stat-chip">SH <strong>${u.stats.shield}</strong></span>` : ''}
        <span class="stat-chip">SZ <strong>${escapeHtml(u.size)}</strong></span>
        <span class="stat-chip">◆ <strong>${u.supply}</strong></span>
      </div>` : '';

    const upgradeList     = u.allUpgrades ?? [];
    const visibleUpgrades = allUpgrades ? upgradeList : upgradeList.filter(ug => ug.active);
    const upgradesHtml    = visibleUpgrades.length ? `
      <div class="aid-upgrades">
        ${visibleUpgrades.map(ug => {
          const cls  = ug.active ? 'is-active' : 'is-inactive';
          const mark = ug.active ? '✓ ' : '';
          const cost = ug.cost > 0
            ? `<span class="aid-upg-cost">${ug.cost}m</span>`
            : `<span class="aid-upg-cost" style="color:var(--muted)">free</span>`;
          const meta = showActivation && (ug.activation || ug.phase)
            ? `<span class="aid-upg-meta">${[ug.activation, ug.phase].filter(Boolean).join(' · ')}</span>`
            : '';
          const desc = ug.description
            ? `<div class="aid-upg-desc">${escapeHtml(ug.description)}</div>`
            : '';
          return `<div class="aid-upg ${cls}"><span class="aid-upg-name">${mark}${escapeHtml(ug.name)}</span>${cost}${meta}${desc}</div>`;
        }).join('')}
      </div>` : '';

    const tagsHtml = u.tags
      ? `<div class="aid-tags">${escapeHtml(String(u.tags))}</div>`
      : '';

    const hasBody = statsHtml || upgradesHtml || tagsHtml;
    return `
      <div class="aid-unit">
        <div class="aid-unit-header">
          <div class="unit-type-badge badge-${escapeHtml(u.type)}">${abbr}</div>
          <div class="unit-info">
            <div class="unit-name">${escapeHtml(u.name)}${escapeHtml(models)}</div>
            <div class="unit-sub">${escapeHtml(u.size)} · ${u.baseCost}m base · ${u.supply}◆</div>
          </div>
          <div class="unit-cost">${u.totalCost}m</div>
        </div>
        ${hasBody ? `<div class="aid-body">${tagsHtml}${statsHtml}${upgradesHtml}</div>` : ''}
      </div>`;
  }).join('');

  const tactPills = showTactical
    ? (tacticalCardDetails ?? []).map(t => `<span class="tag">${escapeHtml(t.name)}</span>`).join('')
    : '';

  return `
    <div class="roster-card ${factionClass}">
      <div class="roster-header">
        <div class="roster-faction ${escapeHtml(faction)}">${escapeHtml(faction.toUpperCase())} · ${escapeHtml(factionCard)}</div>
        <div class="roster-meta">
          <span>💎 ${m.used}/${m.limit}m</span>
          <span>⛽ ${g.used}/${g.limit}g</span>
          <span class="meta-supply">◆ ${supply} sup</span>
          <span><span class="resource-icon resource-${factionClass}">${resourceIcon}</span> ${resources} ${resourceShort}</span>
          <span class="tag seed-tag">${escapeHtml(seed)}</span>
        </div>
      </div>
      <div class="unit-list">${unitBlocks}</div>
      ${showTactical && (tacticalCardDetails?.length ?? 0) > 0 ? `<div class="tact-section"><span class="tact-label">Tactical</span>${tactPills}</div>` : ''}
    </div>`;
}

// ─── Image capture helpers ────────────────────────────────────────────────────
async function captureCanvas(el) {
  const sourceEl = el.firstElementChild ?? el;
  const stage = document.createElement('div');
  const clone = sourceEl.cloneNode(true);

  stage.style.position = 'fixed';
  stage.style.left = '-10000px';
  stage.style.top = '0';
  stage.style.padding = '0';
  stage.style.margin = '0';
  stage.style.background = 'transparent';
  stage.style.display = 'inline-block';
  stage.style.width = 'fit-content';

  clone.style.display = 'inline-block';
  clone.style.width = 'fit-content';
  clone.style.maxWidth = 'none';
  clone.style.margin = '0';

  stage.appendChild(clone);
  document.body.appendChild(stage);

  try {
    return await window.html2canvas(clone, {
      backgroundColor: '#161b22',
      scale: 2,
      useCORS: true,
      logging: false,
    });
  } finally {
    stage.remove();
  }
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error('Could not serialize image data.'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

async function downloadImage(el, filename, btn) {
  if (btn.disabled) return;
  btn.disabled = true;
  debug.log('image.download.start', { filename });
  try {
    const canvas = await captureCanvas(el);
    const blob = await canvasToBlob(canvas);
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Image downloaded!');
    debug.log('image.download.ok', { filename, bytes: blob.size });
  } catch (err) {
    showToast(getUserFacingError('Download', err), 'error');
    debug.error('image.download.error', err, { filename });
  } finally {
    btn.disabled = false;
  }
}

async function copyImage(el, btn) {
  if (btn.disabled) return;
  btn.disabled = true;
  debug.log('image.copy.start');
  try {
    if (!navigator.clipboard || typeof window.ClipboardItem === 'undefined') {
      throw new Error('Clipboard image APIs are unavailable in this browser.');
    }
    const canvas = await captureCanvas(el);
    const blob = await canvasToBlob(canvas);
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    showToast('Image copied to clipboard!');
    debug.log('image.copy.ok', { bytes: blob.size });
  } catch (err) {
    showToast(getUserFacingError('Image copy', err), 'error');
    debug.error('image.copy.error', err);
  } finally {
    btn.disabled = false;
  }
}

// ─── Output refresh ───────────────────────────────────────────────────────────
function refreshOutput() {
  if (!currentRoster) return;

  // ── Discord / Raw ───────────────────────────────────────────────────────────
  const charLimit = Math.max(500, parseInt(optLimit.value, 10) || 2000);
  currentFormatted = formatCompact(currentRoster, {
    plain:                   optPlain.checked,
    showStats:               optStats.checked,
    abbreviateUpgrades:      optAbbr.checked,
    tacticalPerLine:         optTactLines.checked,
    abbreviateTacticalCards: optTactAbbr.checked,
    showTacticalSupplyTypes: optTactSupply.checked,
    showSlotBreakdown:       optSlotBreakdown.checked,
    charLimit,
  });
  previewContent.innerHTML = ansiToHtml(currentFormatted);
  rawBox.textContent = currentFormatted;
  const len = currentFormatted.length;
  charCounter.textContent = `${len.toLocaleString()} / ${charLimit.toLocaleString()} chars`;
  optCharReadout.textContent = `${len.toLocaleString()} chars`;
  charCounter.className = 'char-counter' + (len > charLimit ? ' over' : len > charLimit * 0.9 ? ' warn' : '');
  if (len > charLimit) {
    const overflow = (len - charLimit).toLocaleString();
    discordLimitWarning.textContent = `Current output exceeds the selected character limit by ${overflow} characters and may fail when pasted to Discord.`;
    discordLimitWarning.style.display = 'block';
  } else {
    discordLimitWarning.textContent = '';
    discordLimitWarning.style.display = 'none';
  }

  // ── Roster Card ─────────────────────────────────────────────────────────────
  rosterCardEl.innerHTML = renderRosterCard(currentRoster, {
    showUpgrades: cardUpgrades.checked,
    showStats:    cardStats.checked,
    showCost:     cardCost.checked,
    showTactical: cardTactical.checked,
    showSlots:    cardSlots.checked,
  });
  downloadImgBtn.style.display = 'inline-block';
  copyImgBtn.style.display     = 'inline-block';

  // ── Player Aid ──────────────────────────────────────────────────────────────
  aidCardEl.innerHTML = renderPlayerAid(currentRoster, {
    showStats:      aidStats.checked,
    allUpgrades:    aidAllUpgrades.checked,
    showActivation: aidActivation.checked,
    showTactical:   aidTactical.checked,
  });
  aidDownloadBtn.style.display = 'inline-block';
  aidCopyImgBtn.style.display  = 'inline-block';

  // ── JSON ────────────────────────────────────────────────────────────────────
  jsonBox.textContent = formatJson(currentRoster);
}

// ─── Load handler ─────────────────────────────────────────────────────────────
async function loadRoster() {
  if (isLoadingRoster) {
    showToast('Load already in progress.', 'error', 1600);
    return;
  }
  const seed = seedInput.value.trim().toUpperCase();
  if (!seed) { seedInput.focus(); return; }

  isLoadingRoster = true;
  resultsEl.style.display = 'none';
  errorBox.style.display  = 'none';
  loadingBox.style.display = 'block';
  loadBtn.disabled = true;
  loadBtn.setAttribute('aria-busy', 'true');
  debug.log('roster.load.start', { seed });

  try {
    const flat = await fetchRoster(seed);
    const tacticalCards = await fetchTacticalCards(flat.state?.tacticalCardIds ?? []);
    currentRoster = parseRoster(flat, { tacticalCards });
    refreshOutput();
    addRecentSeed(seed);
    if (!recentCollapsed) {
      recentCollapsed = true;
      applyRecentCollapsed(false);
    }
    savePrefs();
    document.body.classList.remove('preload');
    loadingBox.style.display = 'none';
    resultsEl.style.display  = 'block';
    debug.log('roster.load.ok', {
      seed,
      unitCount: currentRoster.units.length,
      tacticalCount: currentRoster.tacticalCards.length,
      faction: currentRoster.faction,
    });
  } catch (err) {
    loadingBox.style.display = 'none';
    const msg = err.status === 404
      ? `No roster found with seed <strong>${escapeHtml(seed)}</strong>. Check the code and try again.`
      : escapeHtml(getUserFacingError('Load roster', err));
    errorBox.innerHTML = `<div class="error">❌ ${msg}</div>`;
    errorBox.style.display = 'block';
    debug.error('roster.load.error', err, { seed });
  } finally {
    isLoadingRoster = false;
    loadBtn.disabled = false;
    loadBtn.removeAttribute('aria-busy');
  }
}

// ─── Tab switcher ─────────────────────────────────────────────────────────────
const DISCORD_TABS = new Set(['preview']);
const tabs = Array.from(document.querySelectorAll('.tab'));

function activateTab(tab, { setFocus = false } = {}) {
  const targetPanelId = `tab-${tab.dataset.tab}`;
  tabs.forEach(t => {
    const isActive = t === tab;
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-selected', isActive ? 'true' : 'false');
    t.tabIndex = isActive ? 0 : -1;
  });
  document.querySelectorAll('.panel').forEach(panel => {
    const isActive = panel.id === targetPanelId;
    panel.classList.toggle('active', isActive);
    panel.hidden = !isActive;
  });
  if (setFocus) tab.focus();
  discordOpts.style.display = DISCORD_TABS.has(tab.dataset.tab) ? '' : 'none';
  savePrefs();
}

tabs.forEach((tab, idx) => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' '].includes(e.key)) return;
    e.preventDefault();
    if (e.key === 'Enter' || e.key === ' ') {
      activateTab(tab);
      return;
    }
    let nextIdx = idx;
    if (e.key === 'Home') nextIdx = 0;
    if (e.key === 'End') nextIdx = tabs.length - 1;
    if (e.key === 'ArrowRight') nextIdx = (idx + 1) % tabs.length;
    if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + tabs.length) % tabs.length;
    activateTab(tabs[nextIdx], { setFocus: true });
  });
});

// ─── Copy helpers ─────────────────────────────────────────────────────────────
function copyText(text) {
  if (!text) {
    showToast('Nothing to copy yet.', 'error', 1600);
    return;
  }
  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    showToast('Clipboard text APIs are unavailable in this browser.', 'error');
    return;
  }
  navigator.clipboard.writeText(text)
    .then(() => {
      showToast('Copied to clipboard!');
      debug.log('text.copy.ok', { chars: text.length });
    })
    .catch(err => {
      showToast(getUserFacingError('Text copy', err), 'error');
      debug.error('text.copy.error', err, { chars: text.length });
    });
}
document.getElementById('copy-preview-btn').addEventListener('click', () => copyText(currentFormatted));
discordModeToggle.addEventListener('change', () => setDiscordMode(discordModeToggle.checked ? 'raw' : 'preview'));
saveFavoriteBtn.addEventListener('click', () => {
  const seed = sanitizeSeed(seedInput.value);
  if (!seed) {
    showToast('Enter a seed before saving a favorite.', 'error', 1800);
    seedInput.focus();
    return;
  }
  const existing = seedHistory.favorites.find(f => f.seed === seed);
  const suggested = existing?.name || seed;
  const name = window.prompt('Favorite name:', suggested);
  if (name === null) return;
  if (!String(name).trim()) {
    showToast('Favorite name cannot be empty.', 'error', 1800);
    return;
  }
  saveFavoriteSeed(seed, name);
  showToast(`Saved favorite: ${name.trim()}`);
});

recentToggleBtn.addEventListener('click', () => {
  recentCollapsed = !recentCollapsed;
  applyRecentCollapsed();
});

recentSeedsEl.addEventListener('click', e => {
  const btn = e.target.closest('button[data-seed]');
  if (!btn) return;
  const seed = sanitizeSeed(btn.dataset.seed);
  seedInput.value = seed;
  loadRoster();
});

favoriteSeedsEl.addEventListener('click', e => {
  const loadBtnEl = e.target.closest('button[data-favorite-load]');
  if (loadBtnEl) {
    const seed = sanitizeSeed(loadBtnEl.dataset.favoriteLoad);
    seedInput.value = seed;
    loadRoster();
    return;
  }
  const removeBtnEl = e.target.closest('button[data-favorite-remove]');
  if (removeBtnEl) {
    const seed = sanitizeSeed(removeBtnEl.dataset.favoriteRemove);
    removeFavoriteSeed(seed);
    showToast(`Removed favorite ${seed}`);
  }
});

document.getElementById('copy-json-btn').addEventListener('click',    () => {
  if (!currentRoster) {
    showToast('Load a roster first.', 'error', 1600);
    return;
  }
  copyText(formatJson(currentRoster));
});
const getSeed = () => currentRoster?.seed ?? 'roster';
downloadImgBtn.addEventListener('click', () => downloadImage(rosterCardEl, `roster-${getSeed()}.png`,     downloadImgBtn));
copyImgBtn.addEventListener(    'click', () => copyImage(    rosterCardEl,                               copyImgBtn));
aidDownloadBtn.addEventListener('click', () => downloadImage(aidCardEl,    `player-aid-${getSeed()}.png`, aidDownloadBtn));
aidCopyImgBtn.addEventListener( 'click', () => copyImage(    aidCardEl,                                  aidCopyImgBtn));

// ─── Event listeners ──────────────────────────────────────────────────────────
loadBtn.addEventListener('click', loadRoster);
seedInput.addEventListener('keydown', e => { if (e.key === 'Enter') loadRoster(); });
seedInput.addEventListener('change', savePrefs);
function refreshAndSave() { refreshOutput(); savePrefs(); }
// Discord / Raw options
[optPlain, optStats, optAbbr, optTactLines, optTactAbbr, optTactSupply, optSlotBreakdown, optLimit]
  .forEach(el => el.addEventListener('change', refreshAndSave));
// Roster Card options
[cardUpgrades, cardStats, cardCost, cardTactical, cardSlots]
  .forEach(el => el.addEventListener('change', refreshAndSave));
// Player Aid options
[aidStats, aidAllUpgrades, aidActivation, aidTactical]
  .forEach(el => el.addEventListener('change', refreshAndSave));

// Restore persisted preferences (must come after all event listeners are wired up)
loadPrefs();
loadSeedHistory();
renderSeedHistory();
applyRecentCollapsed(false);
