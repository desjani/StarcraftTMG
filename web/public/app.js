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
const optTactResource  = document.getElementById('opt-tact-resource');
const optTactGas       = document.getElementById('opt-tact-gas');
const optSlotBreakdown = document.getElementById('opt-slot-breakdown');
const optLimit         = document.getElementById('opt-limit');
// Roster Card options + controls
const cardUpgrades   = document.getElementById('card-upgrades');
const cardStats      = document.getElementById('card-stats');
const cardSize       = document.getElementById('card-size');
const cardCost       = document.getElementById('card-cost');
const cardTactical   = document.getElementById('card-tactical');
const cardTactResource = document.getElementById('card-tact-resource');
const cardTactGas    = document.getElementById('card-tact-gas');
const cardTactSupply = document.getElementById('card-tact-supply');
const cardSlots      = document.getElementById('card-slots');
const downloadImgBtn = document.getElementById('download-img-btn');
const copyImgBtn     = document.getElementById('copy-img-btn');
// Player Aid options + controls
const aidStats       = document.getElementById('aid-stats');
const aidAllUpgrades = document.getElementById('aid-all-upgrades');
const aidActivation  = document.getElementById('aid-activation');
const aidTactical    = document.getElementById('aid-tactical');
const aidModeAll     = document.getElementById('aid-mode-all');
const aidModeMerged  = document.getElementById('aid-mode-merged');
const aidCardEl      = document.getElementById('aid-card');
const aidPrintBar    = document.getElementById('aid-print-bar');
const aidCollapseAllBtn = document.getElementById('aid-collapse-all-btn');
const aidExpandAllBtn = document.getElementById('aid-expand-all-btn');
const aidPrintBtn    = document.getElementById('aid-print-btn');
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
        tactResource:  optTactResource.checked,
        tactGas:       optTactGas.checked,
        slotBreakdown: optSlotBreakdown.checked,
        limit:         optLimit.value,
      },
      card: {
        upgrades: cardUpgrades.checked,
        stats:    cardStats.checked,
        size:     cardSize.checked,
        cost:     cardCost.checked,
        tactical: cardTactical.checked,
        tactResource: cardTactResource.checked,
        tactGas:      cardTactGas.checked,
        tactSupply:   cardTactSupply.checked,
        slots:    cardSlots.checked,
      },
      aid: {
        stats:       aidStats.checked,
        allUpgrades: aidAllUpgrades.checked,
        activation:  aidActivation.checked,
        tactical:    aidTactical.checked,
        mode:        aidModeMerged.checked ? 'merged' : 'all',
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
      optTactResource.checked  = !!p.opts.tactResource;
      optTactGas.checked       = !!p.opts.tactGas;
      optSlotBreakdown.checked = !!p.opts.slotBreakdown;
      if (p.opts.limit) optLimit.value = p.opts.limit;
    }
    if (p.card) {
      cardUpgrades.checked = p.card.upgrades !== false;
      cardStats.checked    = !!p.card.stats;
      cardSize.checked     = p.card.size !== false;
      cardCost.checked     = p.card.cost     !== false;
      cardTactical.checked = p.card.tactical !== false;
      cardTactResource.checked = !!p.card.tactResource;
      cardTactGas.checked      = !!p.card.tactGas;
      cardTactSupply.checked   = !!p.card.tactSupply;
      cardSlots.checked    = !!p.card.slots;
    }
    if (p.aid) {
      aidStats.checked       = p.aid.stats       !== false;
      aidAllUpgrades.checked = p.aid.allUpgrades !== false;
      aidActivation.checked  = p.aid.activation  !== false;
      aidTactical.checked    = p.aid.tactical    !== false;
      const mode = p.aid.mode === 'merged' ? 'merged' : 'all';
      aidModeMerged.checked = mode === 'merged';
      aidModeAll.checked = mode !== 'merged';
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
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized || normalized === '-' || normalized.toLowerCase() === 'n/a') return false;
  }
  return true;
}

function compareText(a, b) {
  return String(a ?? '').localeCompare(String(b ?? ''), undefined, { sensitivity: 'base' });
}

function compareUpgradesForDisplay(a, b) {
  const costDiff = Number(b?.cost ?? 0) - Number(a?.cost ?? 0);
  if (costDiff !== 0) return costDiff;
  return compareText(a?.name, b?.name);
}

function sortUpgradesForDisplay(upgrades = []) {
  return [...upgrades].sort(compareUpgradesForDisplay);
}

function sortTacticalNames(cards = []) {
  return [...cards].sort(compareText);
}

function sortTacticalDetailsByName(cards = []) {
  return [...cards].sort((a, b) => compareText(a?.name, b?.name));
}

function getAidUnitKey(unit) {
  const activeNames = (unit?.allUpgrades ?? [])
    .filter(ug => ug.active)
    .map(ug => String(ug.name ?? ug.id ?? ''))
    .sort()
    .join('|');
  return `${unit?.id ?? unit?.name}::${unit?.size}::${activeNames}`;
}

function compareAidWeaponProfiles(a, b) {
  const aRange = String(a?.range ?? '').trim().toUpperCase();
  const bRange = String(b?.range ?? '').trim().toUpperCase();
  const aIsMelee = aRange === 'E';
  const bIsMelee = bRange === 'E';
  if (aIsMelee !== bIsMelee) return aIsMelee ? 1 : -1;
  return compareText(a?.name, b?.name);
}

function resolveLinkedWeaponReplacements(weapons = [], unitModels = 1) {
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
    // SPECIALIST upgrades only replace one model's weapon, so keep base profile visible for multi-model units.
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

function isWeaponProfile(upgrade) {
  const description = String(upgrade?.description || '').trim();
  return /^RANGE\s*:/i.test(description) && /\bTARGET\s*:/i.test(description);
}

function parseWeaponProfile(upgrade) {
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

function renderAidWeaponsTable(weapons, { mergedBuffs = false } = {}) {
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
            <th>Weapon</th>
            <th>Rng</th>
            <th>Target</th>
            <th>RoA</th>
            <th>Hit</th>
            <th>Dmg</th>
            <th>Surge</th>
            <th>Traits</th>
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

function getFactionResourceLabelConfig(faction, factionClass) {
  return {
    icon: RESOURCE_ICON[faction] ?? '◈',
    className: `resource-${factionClass}`,
    patterns: faction === 'Terran'
      ? ['Command Point']
      : faction === 'Zerg'
        ? ['Biomass']
        : ['Psionic Energy'],
  };
}

function formatAidRichText(text, { faction, factionClass, allowLineBreaks = true, highlightTerms = [] } = {}) {
  let html = escapeHtml(String(text || ''));

  if (faction && factionClass) {
    const resourceConfig = getFactionResourceLabelConfig(faction, factionClass);
    for (const pattern of resourceConfig.patterns) {
      const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(\\d+) ${escapedPattern}`, 'g');
      html = html.replace(regex, (_, amount) => `${amount} <span class="resource-icon ${resourceConfig.className}">${resourceConfig.icon}</span>`);
    }
  }

  const keywordRegex = /\b([A-Z]{2}[A-Z0-9-]*(?:\s+[A-Z]{2}[A-Z0-9-]*)*\s*\([^)\n<>{}]*\)|[A-Z]{2}[A-Z0-9-]*(?:\s+[A-Z]{2}[A-Z0-9-]*)*)/g;
  html = html
    .split(/(<[^>]+>)/g)
    .map(part => (part.startsWith('<') ? part : part.replace(keywordRegex, '<strong>$1</strong>')))
    .join('');

  if (highlightTerms.length) {
    const sortedTerms = [...new Set(highlightTerms.filter(Boolean))]
      .sort((a, b) => String(b).length - String(a).length);
    for (const term of sortedTerms) {
      const escaped = String(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const termRegex = new RegExp(`(${escaped})`, 'gi');
      html = html
        .split(/(<[^>]+>)/g)
        .map(part => (part.startsWith('<') ? part : part.replace(termRegex, '<span class="aid-buff-highlight">$1</span>')))
        .join('');
    }
  }

  if (allowLineBreaks) html = html.replace(/\r?\n/g, '<br>');
  return html;
}

const PHASE_ORDER = ['Any', 'Movement', 'Assault', 'Combat', 'Scoring', 'Cleanup'];
const PHASE_TAG = {
  Any: 'ANY',
  Movement: 'MOV',
  Assault: 'ASS',
  Combat: 'COM',
  Scoring: 'SCO',
  Cleanup: 'CLN',
};

function normalizePhaseLabel(phase) {
  const cleaned = String(phase || '')
    .replace(/\s+phase\b/gi, '')
    .trim();
  if (!cleaned) return 'Any';

  if (/\b(any|passive|always)\b/i.test(cleaned)) return 'Any';
  if (/\b(move|movement|maneuver|deploy|setup)\b/i.test(cleaned)) return 'Movement';
  if (/\bassault\b/i.test(cleaned)) return 'Assault';
  if (/\bcombat\b/i.test(cleaned)) return 'Combat';
  if (/\bscor(e|ing)\b/i.test(cleaned)) return 'Scoring';
  if (/\b(cleanup|regroup|end)\b/i.test(cleaned)) return 'Cleanup';
  return 'Any';
}

function getPhaseTag(phaseLabel) {
  const normalized = normalizePhaseLabel(phaseLabel);
  return PHASE_TAG[normalized] ?? 'ANY';
}

function parseAidActivation(upgrade) {
  const activationParts = String(upgrade?.activation || '')
    .split(/\r?\n/)
    .map(part => part.trim())
    .filter(Boolean);

  if (activationParts.length === 1) {
    const single = activationParts[0];
    const tagged = single.match(/^<\s*([^>]+)\s*>(?:\s*\(([^)]+)\))?$/);
    if (tagged) {
      return {
        state: String(tagged[1] || '').trim(),
        resource: String(tagged[2] || '').trim(),
      };
    }

    const resourceMatch = single.match(/\(([^)]+)\)\s*$/);
    const resource = resourceMatch ? String(resourceMatch[1] || '').trim() : '';
    const state = single
      .replace(/[<>]/g, '')
      .replace(/\s*\([^)]+\)\s*$/, '')
      .trim();

    return { state, resource };
  }

  return {
    state: activationParts[0] ? activationParts[0].replace(/[<>]/g, '') : '',
    resource: activationParts[1] ? activationParts[1].replace(/[()]/g, '') : '',
  };
}

function groupAbilitiesByPhase(abilities = []) {
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

const AID_CONDITIONAL_CUES = /\b(if|when|while|after|before|whenever|until|during|within|against|for each|for the purposes of|for controlling|for contesting|for completing|for resolving|instead|at the end|at start|at the start|first|may)\b/i;
const AID_ABILITY_REFERENCE_CUES = /\bspecial\s+ability\s*['’]s\b/i;
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
const AID_STAT_FIELD_MAP = {
  RANGE: 'range',
  ROA: 'roa',
  HIT: 'hit',
  DMG: 'damage',
  DAMAGE: 'damage',
};

function normalizeAidUnitStatField(token) {
  const normalized = String(token || '').toUpperCase().replace(/\s+/g, ' ').trim();
  if (normalized === 'HP' || normalized === 'HIT POINT' || normalized === 'HIT POINTS') return 'hp';
  if (normalized === 'ARMOR' || normalized === 'ARMOUR') return 'armor';
  if (normalized === 'EVADE') return 'evade';
  if (normalized === 'SPEED') return 'speed';
  if (normalized === 'SHIELD') return 'shield';
  if (normalized === 'SUPPLY') return 'supply';
  return null;
}

function parseUnitStatEffects(text) {
  const source = String(text || '');
  const effects = [];
  const seen = new Set();

  const toDelta = (verb, amount) => {
    const lower = String(verb || '').toLowerCase();
    if (lower.startsWith('decreas') || lower.startsWith('reduc')) return -amount;
    return amount;
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
  while ((match = statFirst.exec(source)) !== null) {
    addEffect(match[1], match[2], match[3], match[0]);
  }

  const verbFirst = /\b(increase|decrease|reduce)\b[^.!?]*?\b(HIT\s*POINTS?|HP|ARMOU?R|EVADE|SPEED|SHIELD|SUPPLY)\b(?:\s+characteristic)?\s+by\s+(\d+)/gi;
  while ((match = verbFirst.exec(source)) !== null) {
    addEffect(match[2], match[1], match[3], match[0]);
  }

  return effects;
}

function extractBuffEffectTerms(text) {
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

function extractWeaponEffectTerms(text) {
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
    if (surgeType) {
      terms.push(`SURGE: ${surgeType}${surgeDice ? ` (${surgeDice})` : ''}`);
    }
  }

  return [...new Set(terms.filter(Boolean))];
}

function parseWeaponEffect(effectText) {
  const text = String(effectText || '').trim();
  if (!text) return null;

  const surgeReplacement = text.match(/^SURGE\s*:\s*(.+)$/i);
  if (surgeReplacement) {
    const value = String(surgeReplacement[1] || '').trim();
    if (!value) return null;
    return {
      kind: 'field-replacement',
      field: 'surge',
      value,
      text,
    };
  }

  const buffMatch = text.match(/^(BUFF|DEBUFF)\s+([A-Z][A-Z0-9-]*)\s*\(([^)]+)\)$/i);
  if (buffMatch) {
    const mode = buffMatch[1].toUpperCase();
    const statToken = buffMatch[2].toUpperCase();
    const statField = AID_STAT_FIELD_MAP[statToken] ?? null;
    const value = Number.parseInt(buffMatch[3], 10);
    if (statField && Number.isFinite(value)) {
      return {
        kind: 'stat-delta',
        field: statField,
        delta: mode === 'DEBUFF' ? -value : value,
        text,
      };
    }
    return { kind: 'trait', trait: text };
  }

  if (/^[A-Z][A-Z0-9-]*(?:\s+[A-Z0-9-]*)*\s*\([^)]+\)$/i.test(text)) {
    return { kind: 'trait', trait: text };
  }
  return null;
}

function splitTraitTokens(traits) {
  return String(traits || '')
    .split(/\s*\|\s*|\s*,\s*/)
    .map(token => token.trim())
    .filter(Boolean);
}

function normalizeTraitKey(trait) {
  return String(trait || '')
    .replace(/\s*\([^)]+\)\s*$/, '')
    .trim()
    .toUpperCase();
}

function parseTraitNumericRank(trait) {
  const match = String(trait || '').match(/\((\d+)\)\s*$/);
  return match ? Number.parseInt(match[1], 10) : Number.NaN;
}

function mergeWeaponTraits(baseTraits, addedTraits) {
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
  const highlights = ordered
    .map(key => byKey.get(key))
    .filter(entry => entry?.fromAdded)
    .map(entry => entry.text);

  return { merged, highlights };
}

function applyNumericDelta(value, delta) {
  const numeric = Number.parseInt(String(value || '').trim(), 10);
  if (!Number.isFinite(numeric)) return { value, changed: false };
  return { value: String(numeric + delta), changed: true };
}

function detectWeaponBuffTargets(chunk, weaponProfiles = []) {
  const results = [];
  const quoted = chunk.replace(/[’]/g, "'");

  for (const weapon of weaponProfiles) {
    const weaponName = String(weapon?.name || '').trim();
    if (!weaponName) continue;
    const escapedWeapon = weaponName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const weaponRegex = new RegExp(`\\b${escapedWeapon}\\b`, 'i');
    if (!weaponRegex.test(quoted)) continue;

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

function detectUnconditionalPassiveBuff(upgrade, weaponProfiles = []) {
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
    // Exclude passives that modify a different named ability instead of unit/weapon state.
    if (AID_ABILITY_REFERENCE_CUES.test(chunk) && !/\bthis\s+unit\b/i.test(chunk)) continue;
    if (!AID_MUTATION_VERBS.test(chunk)) continue;

    for (const effect of extractBuffEffectTerms(chunk)) highlights.push(effect);
    for (const application of detectWeaponBuffTargets(chunk, weaponProfiles)) {
      weaponApplications.push(application);
    }
    for (const unitEffect of parseUnitStatEffects(chunk)) {
      unitStatApplications.push(unitEffect);
    }
  }

  const uniqueHighlights = [...new Set(highlights.filter(Boolean))];
  const hasWeaponApplications = weaponApplications.some(entry => entry?.weaponName && entry?.effect);
  const hasUnitStatApplications = unitStatApplications.some(entry => entry?.field && Number.isFinite(entry?.delta));
  if (!uniqueHighlights.length && !hasWeaponApplications && !hasUnitStatApplications) return null;
  return {
    highlights: uniqueHighlights,
    weaponApplications: weaponApplications.filter(entry => entry?.weaponName && entry?.effect),
    unitStatApplications: unitStatApplications.filter(entry => entry?.field && Number.isFinite(entry?.delta)),
  };
}

function isNaturalAbility(upgrade) {
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

function formatTacticalSupplyTypes(slots = {}) {
  const ordered = ['Hero', 'Core', 'Elite', 'Support', 'Air'];
  const extras = Object.keys(slots).filter(type => !ordered.includes(type));
  const keys = [...ordered, ...extras];
  const letters = [];
  for (const type of keys) {
    const count = Number(slots[type] ?? 0);
    if (count <= 0) continue;
    const letter = TYPE_ABBR[type] ?? String(type).charAt(0).toUpperCase();
    for (let i = 0; i < count; i += 1) {
      letters.push({ type, letter });
    }
  }
  return letters;
}

function renderRosterTacticalTag(card, { showResource = false, showGas = false, showSupply = false } = {}, resourceShort = 'res') {
  const details = [];
  if (showResource && typeof card.resource === 'number') {
    details.push(`<span class="tact-tag-resource">${card.resource}${escapeHtml(resourceShort)}</span>`);
  }
  if (showGas && typeof card.gasCost === 'number') {
    details.push(`<span class="tact-tag-gas">${card.gasCost}g</span>`);
  }
  if (showSupply) {
    const supplyLetters = formatTacticalSupplyTypes(card.slots ?? {});
    if (supplyLetters.length) {
      const supplyHtml = supplyLetters
        .map(({ type, letter }) => `<span class="tact-slot-${escapeHtml(String(type).toLowerCase())}">${escapeHtml(letter)}</span>`)
        .join('');
      details.push(`<span class="tact-tag-supply"><span class="tact-slot-bracket">[</span>${supplyHtml}<span class="tact-slot-bracket">]</span></span>`);
    }
  }
  const suffix = details.length ? ` ${details.join(' ')}` : '';
  return `<span class="tag"><span class="tact-tag-name">${escapeHtml(card.name)}</span>${suffix}</span>`;
}

function groupAidTacticalCards(cards = []) {
  const groups = [];
  const byKey = new Map();

  for (const card of sortTacticalDetailsByName(cards)) {
    const key = String(card?.id ?? card?.name ?? '').trim().toLowerCase();
    if (!key) continue;
    const existing = byKey.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }
    const group = { ...card, count: 1 };
    byKey.set(key, group);
    groups.push(group);
  }

  return groups;
}

function parseAidTacticalAbility(ability = {}) {
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

  return {
    name,
    activation,
    phase,
    description,
  };
}

function renderAidTacticalCards(cards = [], { faction, factionClass } = {}) {
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
        const tagsHtml = card.tags
          ? `<div class="aid-tags aid-tact-tags">${escapeHtml(card.tags)}</div>`
          : '';

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
                      ${activationHtml}
                      ${phaseHtml}
                    </div>
                    ${ability.description ? `<div class="aid-upg-desc">${formatAidRichText(ability.description, { faction, factionClass })}</div>` : ''}
                  </div>`;
              }).join('')}
            </div>
          </article>`;
      }).join('')}
    </div>`;
}

function renderRosterCard(roster, opts = {}) {
  const {
    showUpgrades = true,
    showStats    = false,
    showSize     = true,
    showCost     = true,
    showTactical = true,
    showTacticalResource = false,
    showTacticalGas = false,
    showTacticalSupply = false,
    showSlots    = false,
  } = opts;
  const { minerals: m, gas: g, supply, resources, tacticalCards, tacticalCardDetails, units, faction, factionCard, seed, slots } = roster;
  const resourceShort = RESOURCE_SHORT[faction] ?? 'res';
  const resourceIcon = RESOURCE_ICON[faction] ?? '◈';
  const factionClass = `faction-${String(faction).toLowerCase()}`;
  const slotBreakdown = showSlots ? formatSlotBreakdown(slots) : '';

  const unitRows = units.map(u => {
    const abbr     = TYPE_ABBR[u.type] ?? '?';
    const models   = u.models > 1 ? ` ×${u.models}` : '';
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

  const tacticalItems = (tacticalCardDetails?.length
    ? sortTacticalDetailsByName(tacticalCardDetails)
    : sortTacticalNames(tacticalCards).map(name => ({ name, resource: null, gasCost: null, slots: {} })));
  const tactPills = tacticalItems
    .map(card => renderRosterTacticalTag(card, {
      showResource: showTacticalResource,
      showGas: showTacticalGas,
      showSupply: showTacticalSupply,
    }, resourceShort))
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
      ${showTactical && tacticalItems.length ? `<div class="tact-section"><span class="tact-label">Tactical</span>${tactPills}</div>` : ''}
    </div>`;
}

// ─── Player Aid renderer ──────────────────────────────────────────────────────
function renderPlayerAid(roster, opts = {}) {
  const {
    showStats      = true,
    allUpgrades    = true,
    showActivation = true,
    showTactical   = true,
    mergedBuffs    = false,
  } = opts;
  const { minerals: m, gas: g, supply, resources, tacticalCards, tacticalCardDetails, units, faction, factionCard, seed, slots } = roster;
  const resourceShort = RESOURCE_SHORT[faction] ?? 'res';
  const resourceIcon = RESOURCE_ICON[faction] ?? '◈';
  const factionClass = `faction-${String(faction).toLowerCase()}`;
  const slotBreakdown = formatSlotBreakdown(slots);
  const seenUnitKeys = new Set();
  const dedupedUnits = units.filter(u => {
    const key = getAidUnitKey(u);
    if (seenUnitKeys.has(key)) return false;
    seenUnitKeys.add(key);
    return true;
  });

  const unitBlocks = dedupedUnits.map(u => {
    const unitKey = getAidUnitKey(u);
    const isCollapsed = collapsedAidUnits.has(unitKey);
    const abbr   = TYPE_ABBR[u.type] ?? '?';
    const models = u.models > 1 ? ` ×${u.models}` : '';

    const aidUpgradePills = sortUpgradesForDisplay(u.activeUpgrades ?? [])
      .filter(upg => Number(upg?.cost ?? 0) > 0)
      .map(upg => `<span class="upg-pill">+ ${escapeHtml(upg.name)} <strong>${upg.cost}m</strong></span>`)
      .join('');

    const upgradeList     = sortUpgradesForDisplay(u.allUpgrades ?? []);
    const weaponProfiles  = resolveLinkedWeaponReplacements(
      upgradeList
        .filter(isWeaponProfile)
        .filter(ug => isNaturalAbility(ug) || ug.active)
        .map(parseWeaponProfile),
      u.models
    ).sort(compareAidWeaponProfiles);
    const visibleUpgrades = upgradeList
      .filter(ug => !isWeaponProfile(ug))
      .filter(ug => isNaturalAbility(ug) || ug.active);

    const mergedBuffEntries = [];
    const weaponBuffMap = new Map();
    const unitStatDeltas = {};
    const displayedAbilities = [];
    for (const ability of visibleUpgrades) {
      const detected = detectUnconditionalPassiveBuff(ability, weaponProfiles);
      const hasDetectedHighlights = (detected?.highlights?.length ?? 0) > 0;
      const hasWeaponApplications = (detected?.weaponApplications?.length ?? 0) > 0;
      const hasUnitStatApplications = (detected?.unitStatApplications?.length ?? 0) > 0;
      if (mergedBuffs && (hasDetectedHighlights || hasWeaponApplications || hasUnitStatApplications)) {
        const weaponEffects = (detected.weaponApplications ?? []).map(entry => String(entry.effect || '').trim());
        const weaponEffectSet = new Set(weaponEffects.map(effect => effect.toLowerCase()));
        const weaponEffectTokens = weaponEffects.map(effect => String(effect || '').trim().toLowerCase());
        const genericWeaponStatHighlights = new Set(['range', 'roa', 'hit', 'dmg', 'damage', 'surge']);
        const unitStatHighlightTokens = new Set();
        const unitStatAliases = {
          hp: ['hp', 'hit', 'hit point', 'hit points'],
          armor: ['armor', 'armour'],
          evade: ['evade'],
          speed: ['speed'],
          shield: ['shield'],
          supply: ['supply'],
        };
        for (const entry of detected.unitStatApplications ?? []) {
          const text = String(entry?.text || '').trim().toLowerCase();
          if (text) unitStatHighlightTokens.add(text);
          const field = String(entry?.field || '').trim().toLowerCase();
          for (const alias of unitStatAliases[field] ?? []) {
            unitStatHighlightTokens.add(alias);
          }
        }

        const nonWeaponHighlights = (detected.highlights ?? [])
          .filter(effect => !weaponEffectSet.has(String(effect || '').trim().toLowerCase()))
          .filter(effect => {
            const normalized = String(effect || '').trim().toLowerCase();
            if (!normalized) return false;
            if (genericWeaponStatHighlights.has(normalized) && weaponEffectTokens.some(token => token.includes(normalized))) {
              return false;
            }
            if (unitStatHighlightTokens.has(normalized)) return false;
            for (const token of unitStatHighlightTokens) {
              if (token && normalized.includes(token)) return false;
            }
            return true;
          });

        if (nonWeaponHighlights.length) {
          mergedBuffEntries.push({
            name: ability.name,
            highlights: nonWeaponHighlights,
          });
        }

        for (const entry of detected.weaponApplications ?? []) {
          const key = String(entry.weaponName || '').toLowerCase();
          if (!key) continue;
          if (!weaponBuffMap.has(key)) {
            weaponBuffMap.set(key, { statDeltas: {}, fieldReplacements: {}, traits: [] });
          }
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
        displayedAbilities.push({
          ...ability,
          _detectedHighlights: detected?.highlights ?? [],
        });
      }
    }

    const buffedWeaponProfiles = weaponProfiles.map(weapon => {
      const key = String(weapon.name || '').toLowerCase();
      const applied = weaponBuffMap.get(key);
      if (!applied) {
        return {
          ...weapon,
          nameHighlighted: !!weapon.active,
        };
      }

      const fieldHighlights = {};
      let nextRange = weapon.range;
      let nextRoa = weapon.roa;
      let nextHit = weapon.hit;
      let nextDamage = weapon.damage;
      let nextSurge = weapon.surge;

      const applyField = (field, currentValue) => {
        const delta = Number(applied.statDeltas?.[field] ?? 0);
        if (!delta) return { value: currentValue, changed: false };
        return applyNumericDelta(currentValue, delta);
      };

      const rangeApplied = applyField('range', nextRange);
      nextRange = rangeApplied.value;
      fieldHighlights.range = rangeApplied.changed;

      const roaApplied = applyField('roa', nextRoa);
      nextRoa = roaApplied.value;
      fieldHighlights.roa = roaApplied.changed;

      const hitApplied = applyField('hit', nextHit);
      nextHit = hitApplied.value;
      fieldHighlights.hit = hitApplied.changed;

      const dmgApplied = applyField('damage', nextDamage);
      nextDamage = dmgApplied.value;
      fieldHighlights.damage = dmgApplied.changed;

      if (typeof applied.fieldReplacements?.surge === 'string' && applied.fieldReplacements.surge.trim()) {
        const normalizedSurge = applied.fieldReplacements.surge.trim();
        fieldHighlights.surge = normalizedSurge !== String(weapon.surge ?? '').trim();
        nextSurge = normalizedSurge;
      } else {
        fieldHighlights.surge = false;
      }

      const baseTraits = splitTraitTokens(weapon.traits);
      const addedTraits = [...new Set((applied.traits ?? []).map(x => String(x).trim()).filter(Boolean))];
      const mergedTraitsResult = mergeWeaponTraits(baseTraits, addedTraits);
      const mergedTraits = mergedTraitsResult.merged.join(' | ');

      const hasChanges = Object.values(fieldHighlights).some(Boolean) || mergedTraitsResult.highlights.length;
      if (!hasChanges) return weapon;

      return {
        ...weapon,
        range: nextRange,
        roa: nextRoa,
        hit: nextHit,
        damage: nextDamage,
        surge: nextSurge,
        traits: mergedTraits,
        fieldHighlights,
        traitHighlights: mergedTraitsResult.highlights,
        nameHighlighted: !!weapon.active || hasChanges,
      };
    });

    const buffedUnitStats = { ...(u.stats ?? {}) };
    const unitStatHighlights = {};
    for (const [field, deltaRaw] of Object.entries(unitStatDeltas)) {
      if (field === 'supply') continue;
      const delta = Number(deltaRaw ?? 0);
      if (!delta) continue;
      const applied = applyNumericDelta(buffedUnitStats[field], delta);
      buffedUnitStats[field] = applied.value;
      unitStatHighlights[field] = applied.changed;
    }

    let displaySupply = u.supply;
    let supplyHighlighted = false;
    if (Number(unitStatDeltas.supply ?? 0)) {
      const appliedSupply = applyNumericDelta(u.supply, Number(unitStatDeltas.supply));
      displaySupply = appliedSupply.value;
      supplyHighlighted = appliedSupply.changed;
    }

    const statChips = [
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
        return `<span class="stat-chip">${label} ${valueHtml}</span>`;
      })
      .join('');
    const supplyHtml = mergedBuffs && supplyHighlighted
      ? `<span class="stat-chip stat-chip-supply">◆ <strong class="aid-buff-highlight">${escapeHtml(String(displaySupply))}</strong></span>`
      : `<span class="stat-chip stat-chip-supply">◆ <strong>${escapeHtml(String(displaySupply))}</strong></span>`;
    const collapsedStatlineHtml = showStats
      ? `<div class="aid-collapsed-statline">${statChips}${supplyHtml}</div>`
      : '';
    const statsHtml = showStats ? `
      <div class="aid-stats-row">
        <div class="aid-stats">
          ${statChips}
          ${supplyHtml}
        </div>
        ${aidUpgradePills ? `<div class="unit-upgrades aid-upgrade-bubbles">${aidUpgradePills}</div>` : ''}
      </div>` : '';

    const weaponsHtml     = renderAidWeaponsTable(buffedWeaponProfiles, { mergedBuffs });
    const mergedBuffsHtml = mergedBuffEntries.length ? `
      <div class="aid-merged-buffs">
        ${mergedBuffEntries.map(entry => `<span class="upg-pill aid-merged-pill">+ ${escapeHtml(entry.name)}: ${formatAidRichText(entry.highlights.join(', '), { allowLineBreaks: false, highlightTerms: entry.highlights })}</span>`).join('')}
      </div>` : '';
    const abilitiesByPhase = groupAbilitiesByPhase(displayedAbilities);
    const upgradesHtml    = displayedAbilities.length ? `
      <div class="aid-section-title">Abilities</div>
      ${abilitiesByPhase.map(group => {
        const phaseTag = getPhaseTag(group.phase);
        const phaseClass = `phase-${String(group.phase).toLowerCase()}`;
        return `
          <div class="aid-ability-group">
            <span class="aid-phase-tag ${escapeHtml(phaseClass)}" title="${escapeHtml(group.phase)}">${escapeHtml(phaseTag)}</span>
            <div class="aid-upgrades">
              ${group.abilities.map(ug => {
                const natural = isNaturalAbility(ug);
                const selectedUpgrade = !natural && ug.active;
                const cls  = selectedUpgrade ? 'is-active' : (natural ? 'is-natural' : 'is-inactive');
                const mark = selectedUpgrade ? '✓ ' : '';
                const activation = parseAidActivation(ug);
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

    const tagsHtml = u.tags
      ? `<div class="aid-tags">${escapeHtml(String(u.tags))}</div>`
      : '';

    const hasBody = statsHtml || weaponsHtml || mergedBuffsHtml || upgradesHtml || tagsHtml;
    return `
      <div class="aid-unit${isCollapsed ? ' is-collapsed' : ''}" data-aid-unit-key="${escapeHtml(unitKey)}">
        <div class="aid-unit-header" role="button" tabindex="0" aria-expanded="${isCollapsed ? 'false' : 'true'}" aria-label="Toggle ${escapeHtml(u.name)} details">
          <div class="unit-type-badge badge-${escapeHtml(u.type)}">${abbr}</div>
          <div class="unit-info">
            <div class="aid-unit-title-row">
              <div class="unit-name">${escapeHtml(u.name)}${escapeHtml(models)}</div>
              ${collapsedStatlineHtml}
            </div>
          </div>
          <div class="unit-cost">${u.totalCost}m</div>
          <span class="aid-collapse-indicator" aria-hidden="true"></span>
        </div>
        ${hasBody ? `<div class="aid-body-wrap"><div class="aid-body">${tagsHtml}${statsHtml}${mergedBuffsHtml}${weaponsHtml}${upgradesHtml}</div></div>` : ''}
      </div>`;
  }).join('');

  const tacticalHtml = showTactical
    ? renderAidTacticalCards(tacticalCardDetails ?? [], { faction, factionClass })
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
        ${slotBreakdown ? `<div class="slot-breakdown"><span class="slot-breakdown-label">Slots</span>${slotBreakdown}</div>` : ''}
      </div>
      <div class="unit-list">${unitBlocks}</div>
      ${tacticalHtml ? `<div class="aid-tactical-section">${tacticalHtml}</div>` : ''}
    </div>`;
}

const collapsedAidUnits = new Set();

function syncAidUnitCollapsedState(unitEl, collapsed) {
  if (!unitEl) return;
  unitEl.classList.toggle('is-collapsed', collapsed);
  const header = unitEl.querySelector('.aid-unit-header');
  if (header) header.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
}

function toggleAidUnitCollapsed(unitEl) {
  if (!unitEl) return;
  const unitKey = String(unitEl.dataset.aidUnitKey || '').trim();
  const nextCollapsed = !unitEl.classList.contains('is-collapsed');
  if (unitKey) {
    if (nextCollapsed) {
      collapsedAidUnits.add(unitKey);
    } else {
      collapsedAidUnits.delete(unitKey);
    }
  }
  syncAidUnitCollapsedState(unitEl, nextCollapsed);
  scheduleAidCollapsedStatlineAlignment();
}

function setAllAidUnitsCollapsed(collapsed) {
  const unitEls = Array.from(aidCardEl.querySelectorAll('.aid-unit[data-aid-unit-key]'));
  for (const unitEl of unitEls) {
    const unitKey = String(unitEl.dataset.aidUnitKey || '').trim();
    if (unitKey) {
      if (collapsed) {
        collapsedAidUnits.add(unitKey);
      } else {
        collapsedAidUnits.delete(unitKey);
      }
    }
    syncAidUnitCollapsedState(unitEl, collapsed);
  }
  scheduleAidCollapsedStatlineAlignment();
}

function syncAidCollapsedStatlineAlignment() {
  const nameEls = Array.from(aidCardEl.querySelectorAll('.aid-unit .unit-name'));
  if (!nameEls.length) {
    aidCardEl.style.removeProperty('--aid-collapsed-name-width');
    return;
  }

  let maxWidth = 0;
  for (const nameEl of nameEls) {
    const width = Math.ceil(
      Number(nameEl.scrollWidth)
      || Number(nameEl.offsetWidth)
      || Number(nameEl.getBoundingClientRect().width)
      || 0
    );
    if (Number.isFinite(width) && width > maxWidth) maxWidth = width;
  }

  if (maxWidth > 0) {
    const widthPx = `${maxWidth}px`;
    aidCardEl.style.setProperty('--aid-collapsed-name-width', widthPx);
    const titleRows = aidCardEl.querySelectorAll('.aid-unit-title-row');
    for (const row of titleRows) row.style.setProperty('--aid-collapsed-name-width', widthPx);
  } else {
    aidCardEl.style.removeProperty('--aid-collapsed-name-width');
    const titleRows = aidCardEl.querySelectorAll('.aid-unit-title-row');
    for (const row of titleRows) row.style.removeProperty('--aid-collapsed-name-width');
  }
}

let aidCollapsedAlignmentRaf = 0;
function scheduleAidCollapsedStatlineAlignment() {
  if (aidCollapsedAlignmentRaf) cancelAnimationFrame(aidCollapsedAlignmentRaf);
  aidCollapsedAlignmentRaf = requestAnimationFrame(() => {
    aidCollapsedAlignmentRaf = 0;
    syncAidCollapsedStatlineAlignment();
    requestAnimationFrame(() => syncAidCollapsedStatlineAlignment());
  });
}

// ─── Image capture helpers ────────────────────────────────────────────────────
async function captureCanvas(el) {
  const sourceEl = el.firstElementChild ?? el;
  const stage = document.createElement('div');
  const clone = sourceEl.cloneNode(true);
  const isRosterCardCapture = el === rosterCardEl;
  const rosterCardMinWidth = 480;
  const rosterCardMaxWidth = 760;
  const rosterCardWidthStep = 20;
  const rosterTitlePadding = 40;

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
    if (isRosterCardCapture) {
      const applyRosterExportWidth = (targetWidth) => {
        stage.style.width = `${targetWidth}px`;
        stage.style.maxWidth = `${targetWidth}px`;
        clone.style.width = `${targetWidth}px`;
        clone.style.maxWidth = `${targetWidth}px`;

        clone.querySelectorAll('.roster-header').forEach(header => {
          header.style.paddingBottom = '12px';
        });

        clone.querySelectorAll('.roster-faction').forEach(title => {
          if (!title.dataset.exportOriginalHtml) {
            title.dataset.exportOriginalHtml = title.innerHTML;
          }

          title.innerHTML = title.dataset.exportOriginalHtml;
          title.style.display = '';
          title.style.flexDirection = '';
          title.style.alignItems = '';
          title.style.gap = '';
          title.style.lineHeight = '';
          title.style.whiteSpace = '';

          const rawTitle = title.textContent || '';
          const parts = rawTitle.split(/\s[·-]\s/).map(part => part.trim()).filter(Boolean);
          const availableTitleWidth = Math.max(220, targetWidth - rosterTitlePadding);
          title.style.whiteSpace = 'nowrap';
          const singleLineWidth = Math.ceil(title.scrollWidth || title.getBoundingClientRect().width || 0);
          title.style.whiteSpace = '';

          if (parts.length === 2 && singleLineWidth > availableTitleWidth) {
            title.innerHTML = `<div>${escapeHtml(parts[0])}</div><div>${escapeHtml(parts[1])}</div>`;
            title.style.display = 'flex';
            title.style.flexDirection = 'column';
            title.style.alignItems = 'flex-start';
            title.style.gap = '2px';
            title.style.lineHeight = '1.08';
            title.style.whiteSpace = 'normal';
          }
        });

        clone.querySelectorAll('.roster-meta').forEach(meta => {
          meta.style.display = 'flex';
          meta.style.flexWrap = 'wrap';
          meta.style.gap = '8px 12px';
          meta.style.alignItems = 'center';
          meta.style.maxWidth = '100%';
        });

        clone.querySelectorAll('.slot-breakdown').forEach(breakdown => {
          breakdown.style.maxWidth = '100%';
        });

        clone.querySelectorAll('.tact-label').forEach(label => {
          label.style.flexBasis = '100%';
          label.style.marginRight = '0';
        });

        clone.querySelectorAll('.tact-section').forEach(section => {
          section.style.alignItems = 'flex-start';
          section.style.rowGap = '6px';
        });
      };

      let bestWidth = 620;
      let bestScore = Number.POSITIVE_INFINITY;

      for (let width = rosterCardMinWidth; width <= rosterCardMaxWidth; width += rosterCardWidthStep) {
        applyRosterExportWidth(width);
        const rect = clone.getBoundingClientRect();
        const areaScore = Math.ceil(rect.width) * Math.ceil(rect.height);
        if (areaScore < bestScore) {
          bestScore = areaScore;
          bestWidth = width;
        }
      }

      applyRosterExportWidth(bestWidth);
    }

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
  const selectedCharLimit = Math.max(500, parseInt(optLimit.value, 10) || 2000);
  currentFormatted = formatCompact(currentRoster, {
    plain:                   optPlain.checked,
    showStats:               optStats.checked,
    abbreviateUpgrades:      optAbbr.checked,
    tacticalPerLine:         optTactLines.checked,
    abbreviateTacticalCards: optTactAbbr.checked,
    showTacticalSupplyTypes: optTactSupply.checked,
    showTacticalResourceCosts: optTactResource.checked,
    showTacticalGasCosts:    optTactGas.checked,
    showSlotBreakdown:       optSlotBreakdown.checked,
    // Keep user-selected options intact in preview/raw; use selectedCharLimit only for warning UI.
    charLimit: Number.MAX_SAFE_INTEGER,
  });
  previewContent.innerHTML = ansiToHtml(currentFormatted);
  rawBox.textContent = currentFormatted;
  const len = currentFormatted.length;
  charCounter.textContent = `${len.toLocaleString()} / ${selectedCharLimit.toLocaleString()} chars`;
  optCharReadout.textContent = `${len.toLocaleString()} chars`;
  charCounter.className = 'char-counter' + (len > selectedCharLimit ? ' over' : len > selectedCharLimit * 0.9 ? ' warn' : '');
  if (len > selectedCharLimit) {
    const overflow = (len - selectedCharLimit).toLocaleString();
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
    showSize:     cardSize.checked,
    showCost:     cardCost.checked,
    showTactical: cardTactical.checked,
    showTacticalResource: cardTactResource.checked,
    showTacticalGas: cardTactGas.checked,
    showTacticalSupply: cardTactSupply.checked,
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
    mergedBuffs:    aidModeMerged.checked,
  });
  scheduleAidCollapsedStatlineAlignment();
  aidPrintBar.style.display = 'flex';

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
function openAidPrintWindow() {
  if (!currentRoster) return;
  const seed = getSeed();
  const cardHtml = aidCardEl.innerHTML;

  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Player Aid \u2014 ${seed}</title>
  <style>
    *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      font-family: sans-serif;
      --print-terran: #1f5f9e;
      --print-zerg: #a12a6f;
      --print-protoss: #8a6400;
      --print-supply: #b34747;
      --print-gold: #8a6400;
      --print-green: #1a7a40;
      --print-accent: #1f5f9e;
      --print-muted-chip: #3f4f63;
    }
    body { padding: 14px 18px; background: #fff; color: #111; }

    /* header */
    .roster-card { width: 100%; }
    .roster-header { margin-bottom: 12px; padding-bottom: 8px;
                     border-bottom: 2px solid #555; }
    .roster-faction { font-size: 1rem; font-weight: 700; letter-spacing: .06em;
                      text-transform: uppercase; margin-bottom: 4px; }
    .roster-faction.Terran { color: var(--print-terran); }
    .roster-faction.Zerg { color: var(--print-zerg); }
    .roster-faction.Protoss { color: var(--print-protoss); }
    .roster-meta { font-size: .78rem; color: #444;
                   display: flex; flex-wrap: wrap; gap: 8px; }
    .roster-meta .meta-supply { color: var(--print-supply); font-weight: 700; }
    .roster-meta .resource-icon { font-style: normal; font-weight: 700; }
    .roster-meta .resource-icon.resource-faction-terran { color: var(--print-terran); }
    .roster-meta .resource-icon.resource-faction-zerg { color: var(--print-zerg); }
    .roster-meta .resource-icon.resource-faction-protoss { color: var(--print-protoss); }
    .slot-breakdown {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
    }
    .slot-breakdown-label {
      color: #566277;
      font-size: .66rem;
      letter-spacing: .1em;
      text-transform: uppercase;
      font-weight: 700;
    }
    .slot-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      border: 1px solid #c4cfdb;
      border-radius: 999px;
      padding: 1px 7px;
      background: #f3f7fb;
      color: #445468;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      font-size: .69rem;
    }
    .slot-chip-type {
      font-size: .6rem;
      letter-spacing: .08em;
      font-weight: 700;
    }
    .slot-chip.slot-hero { color: #8a6400; border-color: #d5be84; background: #fff8ea; }
    .slot-chip.slot-core { color: #0f6f87; border-color: #8ac9d5; background: #eaf7fa; }
    .slot-chip.slot-elite { color: #a33846; border-color: #d8a2aa; background: #fff1f3; }
    .slot-chip.slot-support { color: #1a7a40; border-color: #a3cdb3; background: #effaf3; }
    .slot-chip.slot-air { color: #1f5f9e; border-color: #9bc1e3; background: #eef6ff; }
    .slot-chip.slot-other { color: #5f6e80; border-color: #cfd7e1; background: #f6f8fb; }
    .tag { border: 1px solid #888; border-radius: 4px; padding: 1px 6px;
           font-size: .72rem; }
    .seed-tag { font-weight: 700; }
    .tact-section { margin-top: 10px; display: flex; flex-wrap: wrap;
                    align-items: center; gap: 6px; font-size: .78rem; }
    .tact-label { font-weight: 700; font-size: .72rem;
                  text-transform: uppercase; color: #555; }

    /* unit list */
    .unit-list { display: flex; flex-direction: column; gap: 8px; }
    .aid-unit { break-inside: avoid; page-break-inside: avoid;
                border: 1px solid #bbb; border-radius: 6px; overflow: hidden; }
    .aid-unit-header { display: flex; align-items: center; gap: 10px;
                       padding: 6px 10px; background: #f0f0f0;
                       border-bottom: 1px solid #bbb; }
    .aid-collapse-indicator { display: none; }
    .unit-type-badge { display: inline-flex; align-items: center;
                       justify-content: center; width: 22px; height: 22px;
                       border-radius: 4px; background: #f2f4f7; color: #334155;
                       border: 1px solid #9aa7b8;
                       font-size: .7rem; font-weight: 700;
                       flex-shrink: 0; }
    .badge-Hero    { color: #8a6400; border-color: #be9b47; background: #fff9ec; }
    .badge-Core    { color: #16637f; border-color: #6ca8c0; background: #edf9ff; }
    .badge-Elite   { color: #a33846; border-color: #d18d96; background: #fff1f3; }
    .badge-Support { color: #1a7a40; border-color: #8dc4a4; background: #effaf3; }
    .badge-Air     { color: #8a6400; border-color: #ccb16a; background: #fffaef; }
    .badge-Other   { color: #4b5563; border-color: #b3bcc8; background: #f4f6f9; }
    .unit-info { flex: 1; }
    .unit-name { font-weight: 700; font-size: .88rem; color: #111; }
    .aid-unit-title-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .aid-collapsed-statline { display: none !important; }
    .unit-cost { font-size: .78rem; font-weight: 700; color: var(--print-gold);
                 white-space: nowrap; }
    .aid-body-wrap { display: block !important; }
    .aid-body { padding: 8px 12px 10px 12px; }
    .aid-unit.is-collapsed .aid-body {
      opacity: 1 !important;
      transform: none !important;
      padding-bottom: 10px !important;
      pointer-events: auto !important;
    }

    /* stats */
    .aid-stats-row { display: flex; align-items: flex-start; gap: 6px; margin-bottom: 8px; }
    .aid-stats { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 0; }
    .unit-upgrades { display: inline-flex; flex-wrap: wrap; gap: 5px; }
    .aid-upgrade-bubbles { margin-left: auto; justify-content: flex-end; }
    .upg-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border: 1px solid #9dcfb4;
      border-radius: 999px;
      padding: 1px 8px;
      background: #eef8f1;
      color: #1a7a40;
      font-size: .71rem;
      white-space: nowrap;
    }
    .upg-pill strong { color: #8a6400; }
    .stat-chip { border: 1px solid #c4cfdb; border-radius: 4px; padding: 2px 6px;
                 font-size: .71rem; color: var(--print-muted-chip); background: #f8fbff; }
    .stat-chip strong { color: var(--print-accent); }
    .stat-chip.stat-chip-supply {
      border-color: #e2b0b0;
      color: var(--print-supply);
      background: #fff3f3;
    }
    .stat-chip.stat-chip-supply strong { color: var(--print-supply); }
    .stat-chip strong.aid-buff-highlight { color: #1a7a40; }
    .aid-buff-highlight { color: #1a7a40; font-weight: 700; }

    /* weapons table */
    .aid-section-title { font-size: .63rem; text-transform: uppercase;
                         letter-spacing: .08em; color: #666;
                         margin: 10px 0 5px; }
    .aid-weapons-wrap { overflow-x: auto; border: 1px solid #ccc;
                        border-radius: 6px; margin-bottom: 8px; }
    .aid-weapons-table { width: 100%; border-collapse: collapse;
                         min-width: 560px; font-size: .73rem; }
    .aid-weapons-table th, .aid-weapons-table td {
      padding: 5px 8px; border-bottom: 1px solid #ddd;
      text-align: left; vertical-align: top; }
    .aid-weapons-table th { background: #f4f4f4; font-size: .6rem;
                             text-transform: uppercase; color: #555; }
    .aid-weapons-table tbody tr:last-child td { border-bottom: none; }
    .weapon-name { font-weight: 700; color: #222; }

    /* ability phase groups */
    .aid-ability-group { position: relative; padding-left: 46px;
                         padding-top: 6px; margin-bottom: 6px;
                         border-top: 1px solid #e0e0e0; }
    .aid-ability-group:first-child { border-top: none; padding-top: 0; }
    .aid-phase-tag { position: absolute; left: 0; top: 6px;
                     min-width: 36px; height: 17px; border-radius: 999px;
             border: 1px solid #9aa7b8; display: inline-flex;
                     align-items: center; justify-content: center;
             color: #445468; font-size: .6rem; letter-spacing: .05em;
             font-weight: 700; background: #f1f5f9; }
    .aid-ability-group:first-child .aid-phase-tag { top: 0; }
    .aid-phase-tag.phase-movement { color: #1f5f9e; border-color: #9bc1e3; background: #eef6ff; }
    .aid-phase-tag.phase-assault { color: #a33846; border-color: #d8a2aa; background: #fff1f3; }
    .aid-phase-tag.phase-combat { color: #8a6400; border-color: #d5be84; background: #fff8ea; }
    .aid-phase-tag.phase-scoring { color: #1a7a40; border-color: #a3cdb3; background: #effaf3; }
    .aid-phase-tag.phase-cleanup { color: #6a4aa8; border-color: #bfafd9; background: #f5f1ff; }
    .aid-upgrades { display: flex; flex-direction: column; gap: 3px; }
    .aid-upg { border: 1px solid #ddd; border-radius: 6px; padding: 5px 8px;
               font-size: .78rem; background: #fafafa; }
    .aid-upg-top { display: flex; align-items: center;
                   flex-wrap: wrap; gap: 5px; }
    .aid-upg-name { font-weight: 700; color: #111; }
    .aid-upg.is-active {
      border-color: #9dcfb4;
      background: #f2fbf6;
    }
    .aid-upg.is-active .aid-upg-name { color: #1a7a40; }
    .aid-upg.is-natural .aid-upg-name { color: #111; }
    .aid-upg.is-inactive .aid-upg-name { color: #666; }
    .aid-upg-desc { margin-top: 3px; font-size: .73rem; color: #333;
                    line-height: 1.45; }
    .aid-upg-desc strong { font-weight: 700; color: #111; }
    .aid-inline-chip { display: inline-flex; align-items: center;
               border: 1px solid #c4cfdb; border-radius: 999px;
               padding: 1px 7px; background: #f3f7fb;
               font-size: .66rem; color: #445468; }
    .aid-inline-activation { color: #6a4aa8; border-color: #beafd6; background: #f5f1ff; }
    .aid-inline-resource { color: #1f5f9e; border-color: #9bc1e3; background: #eef6ff; }
    .aid-inline-resource .resource-icon.resource-faction-terran { color: var(--print-terran); }
    .aid-inline-resource .resource-icon.resource-faction-zerg { color: var(--print-zerg); }
    .aid-inline-resource .resource-icon.resource-faction-protoss { color: var(--print-protoss); }
    .resource-icon { font-style: normal; }
    .aid-merged-buffs { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 10px; }
    .aid-merged-pill {
      border-color: #9dcfb4;
      background: #eef8f1;
      color: #1a7a40;
    }
    .aid-tactical-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
                         gap: 8px; margin-top: 2px; }
    .aid-tactical-section {
      break-before: page;
      page-break-before: always;
    }
    .aid-tact-card { border: 1px solid #ccc; border-radius: 8px; padding: 8px;
                     background: #fafafa;
                     break-inside: avoid;
                     page-break-inside: avoid; }
    .aid-tact-card-header { display: flex; gap: 8px; align-items: flex-start;
                            margin-bottom: 6px; }
    .aid-tact-art { display: none; }
    .aid-tact-card-headings { flex: 1; }
    .aid-tact-card-name { font-size: .86rem; font-weight: 700; color: #111;
                          margin-bottom: 4px; }
    .aid-tact-card-count { font-size: .74rem; color: #555; font-weight: 700; }
    .aid-tact-card-meta { display: flex; flex-wrap: wrap; gap: 5px; }
    .aid-tact-meta-chip { color: #445468; border-color: #c4cfdb; background: #f3f7fb; }
    .aid-tact-gas-cost { margin-left: auto; white-space: nowrap;
               font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
           font-size: .82rem; color: var(--print-gold); font-weight: 700;
               align-self: flex-start; }
    .aid-tact-abilities { display: flex; flex-direction: column; gap: 5px; }
    .aid-tact-ability { border: 1px solid #ddd; border-radius: 6px; padding: 5px 7px;
                        background: #fff; }
    .aid-tact-ability-top { display: flex; flex-wrap: wrap; align-items: center;
                            gap: 5px; margin-bottom: 2px; }
    .aid-tact-ability-name { font-size: .76rem; font-weight: 700; color: #111; }
    .aid-tact-phase-chip { color: #445468; border-color: #c4cfdb; background: #f3f7fb; }
    .aid-tact-phase-chip.phase-movement { color: #1f5f9e; border-color: #9bc1e3; background: #eef6ff; }
    .aid-tact-phase-chip.phase-assault { color: #a33846; border-color: #d8a2aa; background: #fff1f3; }
    .aid-tact-phase-chip.phase-combat { color: #8a6400; border-color: #d5be84; background: #fff8ea; }
    .aid-tact-phase-chip.phase-scoring { color: #1a7a40; border-color: #a3cdb3; background: #effaf3; }
    .aid-tact-phase-chip.phase-cleanup { color: #6a4aa8; border-color: #bfafd9; background: #f5f1ff; }
    .aid-tact-slot-chip { gap: 0; }
    .aid-tact-slot { font-weight: 700; min-width: 0; }
    .aid-tact-slot-hero { color: #8a6400; }
    .aid-tact-slot-core { color: #0f6f87; }
    .aid-tact-slot-elite { color: #a33846; }
    .aid-tact-slot-support { color: #1a7a40; }
    .aid-tact-slot-air { color: #8a6400; }
    .aid-tags { font-size: .73rem; color: #666; margin-bottom: 5px; }
    a, button { display: none !important; }
  </style>
</head>
<body>
  <div class="roster-card">${cardHtml}</div>
  <script>
    window.addEventListener('load', () => {
      document.title = 'Player Aid \u2014 ${seed}';
      ${`window.print();`}
    });
  <\/script>
</body>
</html>`);
  win.document.close();
}

aidPrintBtn.addEventListener('click', () => openAidPrintWindow());
aidCollapseAllBtn.addEventListener('click', () => setAllAidUnitsCollapsed(true));
aidExpandAllBtn.addEventListener('click', () => setAllAidUnitsCollapsed(false));
aidCardEl.addEventListener('click', e => {
  const header = e.target.closest('.aid-unit-header');
  if (!header || !aidCardEl.contains(header)) return;
  toggleAidUnitCollapsed(header.closest('.aid-unit'));
});
aidCardEl.addEventListener('keydown', e => {
  const header = e.target.closest('.aid-unit-header');
  if (!header || !aidCardEl.contains(header)) return;
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  toggleAidUnitCollapsed(header.closest('.aid-unit'));
});

// ─── Event listeners ──────────────────────────────────────────────────────────
loadBtn.addEventListener('click', loadRoster);
seedInput.addEventListener('keydown', e => { if (e.key === 'Enter') loadRoster(); });
seedInput.addEventListener('change', savePrefs);
function refreshAndSave() { refreshOutput(); savePrefs(); }
// Discord / Raw options
[optPlain, optStats, optAbbr, optTactLines, optTactAbbr, optTactSupply, optTactResource, optTactGas, optSlotBreakdown, optLimit]
  .forEach(el => el.addEventListener('change', refreshAndSave));
// Roster Card options
[cardUpgrades, cardStats, cardSize, cardCost, cardTactical, cardTactResource, cardTactGas, cardTactSupply, cardSlots]
  .forEach(el => el.addEventListener('change', refreshAndSave));
// Player Aid options
[aidStats, aidAllUpgrades, aidActivation, aidTactical, aidModeAll, aidModeMerged]
  .forEach(el => el.addEventListener('change', refreshAndSave));

window.addEventListener('resize', () => scheduleAidCollapsedStatlineAlignment());
if (document.fonts?.ready?.then) {
  document.fonts.ready.then(() => scheduleAidCollapsedStatlineAlignment()).catch(() => {});
}

// Restore persisted preferences (must come after all event listeners are wired up)
loadPrefs();
loadSeedHistory();
renderSeedHistory();
applyRecentCollapsed(false);
