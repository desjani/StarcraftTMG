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
const historySavedList = document.getElementById('history-saved-list');
const historyPastList = document.getElementById('history-past-list');
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
const aidPrintCardDeckBtn = document.getElementById('aid-print-carddeck-btn');
const aidPrintInkFriendlyCheckbox = document.getElementById('aid-print-ink-friendly');
const aidPrintBtn    = document.getElementById('aid-print-btn');
// Play Mode controls
const playCardEl = document.getElementById('play-card');
const playDashboardEl = document.getElementById('play-dashboard');
const playNewGameBtn = document.getElementById('play-new-game-btn');
const playNewGameDialog = document.getElementById('play-new-game-dialog');
const playNewGameForm = document.getElementById('play-new-game-form');
const playPlayerNameInput = document.getElementById('play-player-name');
const playOpponentNameInput = document.getElementById('play-opponent-name');
const playOpponentFactionInput = document.getElementById('play-opponent-faction');
const playPlayerSeedInput = document.getElementById('play-player-seed');
const playOpponentSeedInput = document.getElementById('play-opponent-seed');
const playMissionNameInput = document.getElementById('play-mission-name');
const playGameLengthInput = document.getElementById('play-game-length');
const playStartingSupplyInput = document.getElementById('play-starting-supply');
const playSupplyPerRoundInput = document.getElementById('play-supply-per-round');
const playGameSizeInput = document.getElementById('play-game-size');
const playCancelBtn = document.getElementById('play-cancel-btn');
const playResetGameDialog = document.getElementById('play-reset-game-dialog');
const playResetGameCancelBtn = document.getElementById('play-reset-game-cancel-btn');
const playResetGameConfirmBtn = document.getElementById('play-reset-game-confirm-btn');
let discordMode      = 'preview';
let recentCollapsed  = false;
let seedHistory = { recentSeeds: [], favorites: [] };
let playModeState = null;
let playLibrary = { activeGameId: null, inProgress: [], completed: [] };

const PLAY_PHASES = ['Movement', 'Assault', 'Combat', 'Scoring'];

// Initialize ink-friendly preference from localStorage
function initInkFriendlyPreference() {
  if (!aidPrintInkFriendlyCheckbox) return;
  const saved = localStorage.getItem('aidPrintInkFriendly');
  const isInkFriendly = saved !== null ? JSON.parse(saved) : false;
  aidPrintInkFriendlyCheckbox.checked = isInkFriendly;
}

// Save ink-friendly preference to localStorage
if (aidPrintInkFriendlyCheckbox) {
  aidPrintInkFriendlyCheckbox.addEventListener('change', () => {
    localStorage.setItem('aidPrintInkFriendly', JSON.stringify(aidPrintInkFriendlyCheckbox.checked));
  });
}

// Initialize on load
initInkFriendlyPreference();

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
const PLAY_LIBRARY_KEY = 'sctmg.playLibrary.v1';
const MAX_RECENT_SEEDS = 10;
const MAX_COMPLETED_GAMES = 25;

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

function cloneDeep(value) {
  return JSON.parse(JSON.stringify(value));
}

function upsertGameRecord(records, record) {
  const list = Array.isArray(records) ? records : [];
  const idx = list.findIndex(item => item?.id === record?.id);
  if (idx >= 0) {
    list[idx] = record;
    return list;
  }
  return [record, ...list];
}

function formatPlayDateTime(iso) {
  if (!iso) return 'unknown';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'unknown';
  return d.toLocaleString();
}

function getPlayWinnerLabel(state) {
  if (!state) return 'Unknown';
  if (state.playerScore === state.opponentScore) return 'Draw';
  return state.playerScore > state.opponentScore ? state.playerName : state.opponentName;
}

function buildPlayBreakdown(state) {
  const trackers = Object.values(state?.unitsByKey ?? {});
  const summarizeSide = (side) => {
    const sideTrackers = trackers.filter(t => t.side === side);
    const deployed = sideTrackers.filter(t => t.deployed).length;
    const destroyed = sideTrackers.filter(t => t.deployed && getPlayTrackerCurrentHealth(t) <= 0).length;
    const wounded = sideTrackers.filter(t => t.deployed && getPlayTrackerCurrentHealth(t) > 0 && getPlayTrackerCurrentHealth(t) < (t.maxHealthPools ?? []).reduce((sum, p) => sum + Number(p?.value || 0), 0)).length;
    return { deployed, destroyed, wounded };
  };

  return {
    player: summarizeSide('player'),
    opponent: summarizeSide('opponent'),
  };
}

function ensurePlayStateMetadata(state) {
  if (!state) return;
  if (!state.gameId) state.gameId = `play_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  if (!state.createdAt) state.createdAt = new Date().toISOString();
  state.updatedAt = new Date().toISOString();
}

function createPlayGameId() {
  return `play_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function restoreSnapshotIntoState(state, snapshot) {
  if (!state || !snapshot) return;
  state.round = snapshot.round;
  state.phaseIndex = snapshot.phaseIndex;
  state.firstPlayer = snapshot.firstPlayer;
  state.playerResource = snapshot.playerResource;
  state.opponentResource = snapshot.opponentResource;
  state.playerScore = snapshot.playerScore;
  state.opponentScore = snapshot.opponentScore;
  state.unitsByKey = snapshot.unitsByKey;
}

function savePlayLibrary() {
  try {
    localStorage.setItem(PLAY_LIBRARY_KEY, JSON.stringify(playLibrary));
  } catch (_) { /* storage unavailable */ }
}

function loadPlayLibrary() {
  try {
    const raw = localStorage.getItem(PLAY_LIBRARY_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    playLibrary = {
      activeGameId: parsed?.activeGameId || null,
      inProgress: Array.isArray(parsed?.inProgress) ? parsed.inProgress : [],
      completed: Array.isArray(parsed?.completed) ? parsed.completed : [],
    };
  } catch (_) {
    playLibrary = { activeGameId: null, inProgress: [], completed: [] };
  }
}

function persistCurrentPlayState({ archive = false } = {}) {
  if (!playModeState?.hasStarted) return;
  ensurePlayStateMetadata(playModeState);
  const snapshot = cloneDeep(playModeState);
  const record = {
    id: snapshot.gameId,
    updatedAt: snapshot.updatedAt,
    state: snapshot,
  };

  if (archive) {
    snapshot.completedAt = new Date().toISOString();
    playModeState.completedAt = snapshot.completedAt;
    record.updatedAt = snapshot.completedAt;
    record.state = snapshot;
    playLibrary.inProgress = playLibrary.inProgress.filter(g => g?.id !== record.id);
    playLibrary.completed = upsertGameRecord(playLibrary.completed, record).slice(0, MAX_COMPLETED_GAMES);
    playLibrary.activeGameId = null;
  } else if (!snapshot.completedAt) {
    delete snapshot.completedAt;
    record.state = snapshot;
    playLibrary.inProgress = upsertGameRecord(playLibrary.inProgress, record);
    playLibrary.activeGameId = record.id;
  } else {
    // Completed snapshots are kept only in archive; avoid re-adding to in-progress.
  }
  savePlayLibrary();
}

function loadPlayGameFromLibrary(gameId, source = 'inProgress', options = {}) {
  const list = source === 'completed' ? playLibrary.completed : playLibrary.inProgress;
  const record = list.find(g => g?.id === gameId);
  if (!record?.state) return false;

  const mode = options.mode || 'load';
  const asEditableCopy = source === 'completed' || Boolean(options.asEditableCopy);
  let loadedState = cloneDeep(record.state);

  if (mode === 'restart') {
    loadedState = createPlayModeState(loadedState.playerRoster, loadedState.opponentRoster, {
      playerSeed: loadedState.playerSeed,
      opponentSeed: loadedState.opponentSeed,
      playerName: loadedState.playerName,
      opponentName: loadedState.opponentName,
      opponentFaction: loadedState.opponentFaction,
      missionName: loadedState.missionName,
      gameLength: loadedState.gameLength,
      startingSupply: loadedState.startingSupply,
      supplyPerRound: loadedState.supplyPerRound,
      gameSize: loadedState.gameSize,
      hasStarted: true,
    });
    applyDefaultPlayCollapsedUnits(loadedState);
  } else if (mode === 'rewind') {
    const rewindSnapshot = Array.isArray(loadedState.history) ? loadedState.history.pop() : null;
    if (rewindSnapshot) {
      restoreSnapshotIntoState(loadedState, rewindSnapshot);
    }
  }

  if (asEditableCopy) {
    delete loadedState.completedAt;
    loadedState.gameId = createPlayGameId();
    loadedState.createdAt = new Date().toISOString();
    loadedState.updatedAt = loadedState.createdAt;
  }

  playModeState = loadedState;
  ensurePlayStateMetadata(playModeState);
  if (asEditableCopy) {
    persistCurrentPlayState();
  } else {
    playLibrary.activeGameId = playModeState.gameId;
    savePlayLibrary();
  }

  if (playModeState.playerRoster) {
    currentRoster = playModeState.playerRoster;
    if (seedInput) seedInput.value = playModeState.playerSeed || playModeState.playerRoster.seed || '';
    refreshOutput();
    resultsEl.style.display = 'block';
    loadingBox.style.display = 'none';
    errorBox.style.display = 'none';
    document.body.classList.remove('preload');
    const playTab = document.querySelector('.tab[data-tab="play"]');
    if (playTab) activateTab(playTab);
  } else {
    refreshPlayModeOutput();
  }
  return true;
}

function removePlayGameFromLibrary(gameId, source = 'inProgress') {
  if (!gameId) return;
  if (source === 'completed') {
    playLibrary.completed = playLibrary.completed.filter(g => g?.id !== gameId);
  } else {
    playLibrary.inProgress = playLibrary.inProgress.filter(g => g?.id !== gameId);
  }
  if (playLibrary.activeGameId === gameId) {
    playLibrary.activeGameId = playModeState?.gameId || null;
  }
  savePlayLibrary();
}

function restoreActivePlayGame() {
  const id = playLibrary.activeGameId;
  if (!id || currentRoster) return false;
  return loadPlayGameFromLibrary(id, 'inProgress')
    || loadPlayGameFromLibrary(id, 'completed');
}

function buildInProgressGamesHtml() {
  return playLibrary.inProgress
    .slice()
    .sort((a, b) => String(b?.updatedAt || '').localeCompare(String(a?.updatedAt || '')))
    .map(record => {
      const state = record?.state;
      if (!state) return '';
      const isActive = playModeState?.gameId === record.id;
      return `
        <div class="play-save-row${isActive ? ' is-active' : ''}">
          <div class="play-save-meta">
            <div><strong>${escapeHtml(state.playerName || 'Player')}</strong> vs <strong>${escapeHtml(state.opponentName || 'Opponent')}</strong></div>
            <div class="play-save-detail">${escapeHtml(state.missionName || 'Mission')} · Round ${Number(state.round || 1)} · ${escapeHtml(String(state.playerScore || 0))}-${escapeHtml(String(state.opponentScore || 0))}</div>
            <div class="play-save-detail">Updated ${escapeHtml(formatPlayDateTime(record.updatedAt))}</div>
          </div>
          <div class="play-save-actions">
            <button class="btn ghost sm play-icon-btn" type="button" title="Load" aria-label="Load" data-play-action="load-saved-game" data-game-id="${escapeHtml(record.id)}">↺</button>
            <button class="btn ghost sm play-icon-btn" type="button" title="Archive" aria-label="Archive" data-play-action="archive-saved-game" data-game-id="${escapeHtml(record.id)}">⤓</button>
            <button class="btn ghost sm play-icon-btn" type="button" title="Delete" aria-label="Delete" data-play-action="delete-saved-game" data-game-id="${escapeHtml(record.id)}">✕</button>
          </div>
        </div>`;
    })
    .join('') || '<div class="play-save-empty">No in-progress games saved yet.</div>';
}

function buildCompletedGamesHtml() {
  return playLibrary.completed
    .slice()
    .sort((a, b) => String(b?.updatedAt || '').localeCompare(String(a?.updatedAt || '')))
    .slice(0, 20)
    .map(record => {
      const state = record?.state;
      if (!state) return '';
      const winner = getPlayWinnerLabel(state);
      const breakdown = buildPlayBreakdown(state);
      return `
        <div class="play-save-row past-game">
          <div class="play-save-meta">
            <div><strong>${escapeHtml(state.playerName || 'Player')}</strong> vs <strong>${escapeHtml(state.opponentName || 'Opponent')}</strong> · Winner: <strong>${escapeHtml(winner)}</strong></div>
            <div class="play-save-detail">Final ${escapeHtml(String(state.playerScore || 0))}-${escapeHtml(String(state.opponentScore || 0))} · ${escapeHtml(state.missionName || 'Mission')} · Ended ${escapeHtml(formatPlayDateTime(state.completedAt || record.updatedAt))}</div>
            <div class="play-save-detail">Breakdown: ${escapeHtml(state.playerName || 'Player')} D:${breakdown.player.deployed} W:${breakdown.player.wounded} KIA:${breakdown.player.destroyed} | ${escapeHtml(state.opponentName || 'Opponent')} D:${breakdown.opponent.deployed} W:${breakdown.opponent.wounded} KIA:${breakdown.opponent.destroyed}</div>
          </div>
          <div class="play-save-actions">
            <button class="btn ghost sm play-icon-btn" type="button" title="Review / Load" aria-label="Review / Load" data-play-action="load-completed-game" data-game-id="${escapeHtml(record.id)}">◉</button>
            <button class="btn ghost sm play-icon-btn" type="button" title="Rewind" aria-label="Rewind" data-play-action="rewind-completed-game" data-game-id="${escapeHtml(record.id)}">⟲</button>
            <button class="btn ghost sm play-icon-btn" type="button" title="Restart" aria-label="Restart" data-play-action="restart-completed-game" data-game-id="${escapeHtml(record.id)}">↻</button>
            <button class="btn ghost sm play-icon-btn" type="button" title="Delete" aria-label="Delete" data-play-action="delete-completed-game" data-game-id="${escapeHtml(record.id)}">✕</button>
          </div>
        </div>`;
    })
    .join('') || '<div class="play-save-empty">No past games yet.</div>';
}

function renderPlayHistoryLists() {
  if (!historySavedList || !historyPastList) return;
  historySavedList.innerHTML = buildInProgressGamesHtml();
  historyPastList.innerHTML = buildCompletedGamesHtml();
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
    short: faction === 'Terran' ? 'CP' : faction === 'Zerg' ? 'BM' : 'PE',
    label: faction === 'Terran'
      ? 'Command Point'
      : faction === 'Zerg'
        ? 'Biomass'
        : 'Psionic Energy',
    labelPlural: faction === 'Terran'
      ? 'Command Points'
      : faction === 'Zerg'
        ? 'Biomass'
        : 'Psionic Energy',
    patterns: faction === 'Terran'
      ? ['Command Point', 'CP']
      : faction === 'Zerg'
        ? ['Biomass', 'BM']
        : ['Psionic Energy', 'PE'],
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

function getAbilityPhaseMeta(phaseLabel) {
  const normalized = normalizePhaseLabel(phaseLabel);
  return {
    label: PHASE_TAG[normalized] ?? 'ANY',
    className: normalized.toLowerCase(),
  };
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

function extractAidFactionResourceCost(resourceText, faction, factionClass) {
  if (!resourceText || !faction || !factionClass) return null;
  const resourceConfig = getFactionResourceLabelConfig(faction, factionClass);
  for (const pattern of resourceConfig.patterns) {
    const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = String(resourceText).match(new RegExp(`\\b(\\d+)\\s*${escapedPattern}\\b`, 'i'));
    if (match) {
      return {
        amount: Number(match[1]),
        icon: resourceConfig.icon,
        className: resourceConfig.className,
      };
    }
  }
  return null;
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

function renderRosterTacticalTag(card, { showResource = false, showGas = false, showSupply = false } = {}, resourceShort = 'res', resourceIcon = null) {
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
    }, resourceShort, resourceIcon))
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
          ${slotBreakdown ? `<span class="slot-breakdown-inline"><span class="slot-breakdown-label">Slots</span>${slotBreakdown}</span>` : ''}
        </div>
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
    dedupeUnits    = true,
    playTrackers   = null,
    unitKeyPrefix  = '',
    rosterLabel    = '',
  } = opts;
  const { minerals: m, gas: g, supply, resources, tacticalCards, tacticalCardDetails, units, faction, factionCard, seed, slots } = roster;
  const resourceShort = RESOURCE_SHORT[faction] ?? 'res';
  const resourceIcon = RESOURCE_ICON[faction] ?? '◈';
  const factionClass = `faction-${String(faction).toLowerCase()}`;
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
    const unitKey = `${unitKeyPrefix}${rawUnitKey}`;
    const tracker = playTrackers?.unitsByKey?.[unitKey] ?? null;
    const isDead = !!tracker && (tracker.maxHealthPools?.length ?? 0) > 0 && getPlayTrackerCurrentHealth(tracker) <= 0;
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
    const mineralsHtml = `<span class="stat-chip stat-chip-minerals"><strong>${u.totalCost}m</strong></span>`;
    const collapsedTrackerHtml = tracker ? `<div class="play-collapsed-trackers">
      <button class="btn ghost sm" type="button" data-play-action="hp-dec" data-unit-key="${escapeHtml(unitKey)}">-</button>
      <span class="play-health-value">${renderPlayHealthReadout(tracker)}</span>
      <button class="btn ghost sm" type="button" data-play-action="hp-inc" data-unit-key="${escapeHtml(unitKey)}">+</button>
      <button class="btn ghost sm play-activation-btn${tracker.activation?.movement ? ' is-on' : ''}" type="button" data-play-action="toggle-activation" data-unit-key="${escapeHtml(unitKey)}" data-phase="movement">M</button>
      <button class="btn ghost sm play-activation-btn${tracker.activation?.assault ? ' is-on' : ''}" type="button" data-play-action="toggle-activation" data-unit-key="${escapeHtml(unitKey)}" data-phase="assault">A</button>
      <button class="btn ghost sm play-activation-btn${tracker.activation?.combat ? ' is-on' : ''}" type="button" data-play-action="toggle-activation" data-unit-key="${escapeHtml(unitKey)}" data-phase="combat">C</button>
      <button class="btn ghost sm play-deployed-btn${tracker.deployed ? ' is-on' : ''}" type="button" data-play-action="toggle-deployed" data-unit-key="${escapeHtml(unitKey)}">Dep</button>
    </div>` : '';

    const collapsedStatlineHtml = showStats
      ? `<div class="aid-collapsed-statline">${statChips}${supplyHtml}${mineralsHtml}${collapsedTrackerHtml}</div>`
      : '';
    const statsHtml = showStats ? `
      <div class="aid-stats-row">
        <div class="aid-stats">
          ${statChips}
          ${supplyHtml}
          ${mineralsHtml}
        </div>
        <div class="aid-stats-right">
          ${aidUpgradePills ? `<div class="unit-upgrades aid-upgrade-bubbles">${aidUpgradePills}</div>` : ''}
        </div>
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
    const trackerHtml = tracker ? `
      <div class="play-unit-trackers">
        <div class="play-health-wrap">
          <span class="play-stat-label">Health</span>
          <button class="btn ghost sm" type="button" data-play-action="hp-dec" data-unit-key="${escapeHtml(unitKey)}">-</button>
          <span class="play-health-value">${renderPlayHealthReadout(tracker)}</span>
          <button class="btn ghost sm" type="button" data-play-action="hp-inc" data-unit-key="${escapeHtml(unitKey)}">+</button>
        </div>
        <div class="play-activation-wrap">
          <span class="play-stat-label">Activated</span>
          <button class="btn ghost sm play-activation-btn${tracker.activation?.movement ? ' is-on' : ''}" type="button" data-play-action="toggle-activation" data-unit-key="${escapeHtml(unitKey)}" data-phase="movement">Mov</button>
          <button class="btn ghost sm play-activation-btn${tracker.activation?.assault ? ' is-on' : ''}" type="button" data-play-action="toggle-activation" data-unit-key="${escapeHtml(unitKey)}" data-phase="assault">Ass</button>
          <button class="btn ghost sm play-activation-btn${tracker.activation?.combat ? ' is-on' : ''}" type="button" data-play-action="toggle-activation" data-unit-key="${escapeHtml(unitKey)}" data-phase="combat">Com</button>
          <button class="btn ghost sm play-deployed-btn${tracker.deployed ? ' is-on' : ''}" type="button" data-play-action="toggle-deployed" data-unit-key="${escapeHtml(unitKey)}">Deployed</button>
        </div>
      </div>` : '';

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

function createPlayUnitsByKey(roster, side) {
  const unitsByKey = {};
  (roster.units ?? []).forEach((u, idx) => {
    const key = `${side}:${String(u?.id || 'unit')}-${idx}`;
    const hpPerModel = Number.parseInt(String(u?.stats?.hp ?? '0'), 10);
    const shieldValue = Number.parseInt(String(u?.stats?.shield ?? '0'), 10);
    const models = Number(u?.models ?? 1);
    const maxHealthPools = [];
    if (Number.isFinite(hpPerModel) && hpPerModel > 0) {
      for (let index = 0; index < Math.max(1, models); index += 1) {
        maxHealthPools.push({ type: 'hp', value: hpPerModel });
      }
    }
    if (Number.isFinite(shieldValue) && shieldValue > 0) {
      maxHealthPools.push({ type: 'shield', value: shieldValue });
    }
    unitsByKey[key] = {
      key,
      side,
      maxHealthPools,
      currentHealthPools: maxHealthPools.map(pool => ({ ...pool })),
      supply: Number(u?.supply ?? 0) || 0,
      deployed: false,
      activation: {
        movement: false,
        assault: false,
        combat: false,
      },
    };
  });
  return unitsByKey;
}

function getPlayTrackerCurrentHealth(tracker) {
  return (tracker?.currentHealthPools ?? []).reduce((sum, pool) => sum + Number(pool?.value || 0), 0);
}

function renderPlayHealthReadout(tracker) {
  const pools = tracker?.currentHealthPools ?? [];
  const maxPools = tracker?.maxHealthPools ?? [];
  if (!pools.length) return '<span class="play-health-empty">-</span>';
  return pools.map((pool, index) => {
    const value = Number(pool.value || 0);
    const maxValue = Number(maxPools[index]?.value || 0);
    const cls = [
      'play-health-segment',
      pool.type === 'shield' ? 'is-shield' : 'is-hp',
      value <= 0 ? 'is-zero' : '',
      pool.type !== 'shield' && value > 0 && maxValue > 0 && value >= maxValue ? 'is-full' : '',
    ].filter(Boolean).join(' ');
    const sep = index < pools.length - 1 ? '<span class="play-health-sep">/</span>' : '';
    return `<span class="${cls}">${escapeHtml(String(pool.value))}</span>${sep}`;
  }).join('');
}

function adjustPlayTrackerHealth(tracker, delta) {
  if (!tracker || !delta) return;
  const currentPools = tracker.currentHealthPools ?? [];
  const maxPools = tracker.maxHealthPools ?? [];
  if (!currentPools.length || !maxPools.length) return;

  if (delta < 0) {
    for (let remaining = Math.abs(delta); remaining > 0; remaining -= 1) {
      const targetIndex = currentPools.map(pool => Number(pool.value || 0)).reduceRight((found, value, index) => {
        if (found !== -1) return found;
        return value > 0 ? index : -1;
      }, -1);
      if (targetIndex === -1) break;
      currentPools[targetIndex].value = Math.max(0, Number(currentPools[targetIndex].value || 0) - 1);
    }
    return;
  }

  for (let remaining = delta; remaining > 0; remaining -= 1) {
    const targetIndex = currentPools.reduce((found, pool, index) => {
      if (found !== -1) return found;
      return Number(pool.value || 0) < Number(maxPools[index]?.value || 0) ? index : -1;
    }, -1);
    if (targetIndex === -1) break;
    currentPools[targetIndex].value = Math.min(
      Number(maxPools[targetIndex]?.value || 0),
      Number(currentPools[targetIndex].value || 0) + 1,
    );
  }
}

function createPlayModeState(playerRoster, opponentRoster, setup = {}) {
  const parsedGameSize = Number.parseInt(String(setup.gameSize ?? 2000), 10);
  const gameSize = Math.min(100000, Math.max(1, Number.isFinite(parsedGameSize) ? parsedGameSize : 2000));
  const parsedGameLength = Number.parseInt(String(setup.gameLength ?? 5), 10);
  const gameLength = Math.min(20, Math.max(1, Number.isFinite(parsedGameLength) ? parsedGameLength : 5));
  const parsedStartingSupply = Number.parseInt(String(setup.startingSupply ?? 10), 10);
  const startingSupply = Math.min(200, Math.max(0, Number.isFinite(parsedStartingSupply) ? parsedStartingSupply : 10));
  const parsedSupplyPerRound = Number.parseInt(String(setup.supplyPerRound ?? 2), 10);
  const supplyPerRound = Math.min(50, Math.max(0, Number.isFinite(parsedSupplyPerRound) ? parsedSupplyPerRound : 2));
  const playerSeed = sanitizeSeed(setup.playerSeed || playerRoster?.seed || currentRoster?.seed || '');
  const opponentSeed = sanitizeSeed(setup.opponentSeed || opponentRoster?.seed || '');
  const unitsByKey = {
    ...createPlayUnitsByKey(playerRoster, 'player'),
    ...(opponentRoster ? createPlayUnitsByKey(opponentRoster, 'opponent') : {}),
  };

  return {
    playerSeed,
    opponentSeed,
    playerRoster,
    opponentRoster,
    playerName: String(setup.playerName || 'Player').trim() || 'Player',
    opponentName: String(setup.opponentName || 'Opponent').trim() || 'Opponent',
    opponentFaction: setup.opponentFaction || 'Terran',
    missionName: String(setup.missionName || 'Mission').trim() || 'Mission',
    gameLength,
    startingSupply,
    supplyPerRound,
    gameSize,
    hasStarted: !!setup.hasStarted,
    playerScore: 0,
    opponentScore: 0,
    playerResource: 0,
    opponentResource: 0,
    round: 1,
    phaseIndex: 0,
    firstPlayer: 'player',
    activeBoardSide: 'player',
    collapsedHealthWidthBySide: {
      player: null,
      opponent: null,
    },
    collapsedNameWidthBySide: {
      player: null,
      opponent: null,
    },
    unitsByKey,
    history: [],
  };
}

function ensurePlayModeState(roster) {
  if (!roster) return;
  if (!playModeState || playModeState.playerSeed !== roster.seed) {
    playModeState = createPlayModeState(roster, null, { playerSeed: roster.seed });
    applyDefaultPlayCollapsedUnits(playModeState);
  }
}

async function loadRosterForPlay(seed) {
  const normalizedSeed = sanitizeSeed(seed);
  if (!normalizedSeed) return null;
  if (currentRoster && currentRoster.seed === normalizedSeed) return currentRoster;
  const flat = await fetchRoster(normalizedSeed);
  const tacticalCards = await fetchTacticalCards(flat.state?.tacticalCardIds ?? []);
  return parseRoster(flat, { tacticalCards });
}

function getPlayCurrentPhase() {
  return PLAY_PHASES[playModeState?.phaseIndex ?? 0] ?? PLAY_PHASES[0];
}

function clonePlaySnapshot() {
  if (!playModeState) return null;
  return {
    round: playModeState.round,
    phaseIndex: playModeState.phaseIndex,
    firstPlayer: playModeState.firstPlayer,
    playerResource: playModeState.playerResource,
    opponentResource: playModeState.opponentResource,
    playerScore: playModeState.playerScore,
    opponentScore: playModeState.opponentScore,
    unitsByKey: JSON.parse(JSON.stringify(playModeState.unitsByKey)),
  };
}

function restorePlaySnapshot(snapshot) {
  if (!playModeState || !snapshot) return;
  playModeState.round = snapshot.round;
  playModeState.phaseIndex = snapshot.phaseIndex;
  playModeState.firstPlayer = snapshot.firstPlayer;
  playModeState.playerResource = snapshot.playerResource;
  playModeState.opponentResource = snapshot.opponentResource;
  playModeState.playerScore = snapshot.playerScore;
  playModeState.opponentScore = snapshot.opponentScore;
  playModeState.unitsByKey = snapshot.unitsByKey;
}

function resetRoundTrackers() {
  if (!playModeState) return;
  playModeState.playerResource = 0;
  playModeState.opponentResource = 0;
  for (const tracker of Object.values(playModeState.unitsByKey)) {
    tracker.activation.movement = false;
    tracker.activation.assault = false;
    tracker.activation.combat = false;
  }
}

function buildPlayDashboard() {
  if (!playModeState?.playerRoster) {
    return '<div class="play-name-line">Load a roster to start Play Mode.</div>';
  }

  const currentPhase = getPlayCurrentPhase();
  const trackers = Object.values(playModeState.unitsByKey);
  const supplyCap = playModeState.startingSupply + Math.max(0, playModeState.round - 1) * playModeState.supplyPerRound;
  const getSupplyOnBoard = (side) => trackers
    .filter(t => t.side === side && t.deployed && getPlayTrackerCurrentHealth(t) > 0)
    .reduce((sum, t) => sum + Number(t.supply || 0), 0);
  const playerSupplyOnBoard = getSupplyOnBoard('player');
  const opponentSupplyOnBoard = getSupplyOnBoard('opponent');
  const playerSupplyAvailable = Math.max(0, Number(supplyCap || 0) - playerSupplyOnBoard);
  const opponentSupplyAvailable = Math.max(0, Number(supplyCap || 0) - opponentSupplyOnBoard);
  const firstPlayerLabel = playModeState.firstPlayer === 'player' ? playModeState.playerName : playModeState.opponentName;
  const playerFactionClass = `faction-${String(playModeState.playerRoster?.faction || 'terran').toLowerCase()}`;
  const opponentFactionSource = playModeState.opponentRoster?.faction || playModeState.opponentFaction || 'terran';
  const opponentFactionClass = `faction-${String(opponentFactionSource).toLowerCase()}`;
  const firstPlayerFactionClass = playModeState.firstPlayer === 'player' ? playerFactionClass : opponentFactionClass;
  const phaseClass = `phase-${String(currentPhase).toLowerCase()}`;
  const hasOpponentBoard = !!playModeState.opponentRoster;
  let nextLabel = 'Next Phase';
  if (currentPhase === 'Scoring') {
    nextLabel = playModeState.round >= playModeState.gameLength ? 'End Game' : 'Next Round';
  }

  return `
    <div class="play-topbar">
      <div class="play-name-line"><strong>${escapeHtml(playModeState.playerName)}</strong> vs <strong>${escapeHtml(playModeState.opponentName)}</strong> (${escapeHtml(playModeState.opponentFaction)}) · ${escapeHtml(String(playModeState.gameSize))}m · <strong>${escapeHtml(playModeState.missionName)}</strong> · ${playModeState.gameLength} rounds</div>
    </div>
    <div class="play-dashboard">
      <div class="play-stat">
        <div class="play-stat-label">Supply On Board</div>
        <div class="play-resource-row"><span class="play-stat-label">${escapeHtml(playModeState.playerName)}</span><span class="play-stat-value play-side-value ${escapeHtml(playerFactionClass)}">${playerSupplyOnBoard}</span></div>
        ${playModeState.opponentRoster ? `<div class="play-resource-row"><span class="play-stat-label">${escapeHtml(playModeState.opponentName)}</span><span class="play-stat-value play-side-value ${escapeHtml(opponentFactionClass)}">${opponentSupplyOnBoard}</span></div>` : ''}
      </div>
      <div class="play-stat">
        <div class="play-stat-label">Supply Available</div>
        <div class="play-resource-row"><span class="play-stat-label">${escapeHtml(playModeState.playerName)}</span><span class="play-stat-value play-side-value ${escapeHtml(playerFactionClass)}">${playerSupplyAvailable}</span></div>
        ${playModeState.opponentRoster ? `<div class="play-resource-row"><span class="play-stat-label">${escapeHtml(playModeState.opponentName)}</span><span class="play-stat-value play-side-value ${escapeHtml(opponentFactionClass)}">${opponentSupplyAvailable}</span></div>` : ''}
        <div class="play-stat-label">Cap ${supplyCap}</div>
      </div>
      <div class="play-stat">
        <div class="play-stat-label">Faction Resource</div>
        <div class="play-resource-row">
          <span class="play-stat-label">${escapeHtml(playModeState.playerName)}</span>
          <div class="play-score-controls">
            <button class="btn ghost sm" type="button" data-play-action="resource-dec" data-side="player">-</button>
            <span class="play-stat-value play-side-value ${escapeHtml(playerFactionClass)}">${playModeState.playerResource}</span>
            <button class="btn ghost sm" type="button" data-play-action="resource-inc" data-side="player">+</button>
          </div>
        </div>
        <div class="play-resource-row">
          <span class="play-stat-label">${escapeHtml(playModeState.opponentName)}</span>
          <div class="play-score-controls">
            <button class="btn ghost sm" type="button" data-play-action="resource-dec" data-side="opponent">-</button>
            <span class="play-stat-value play-side-value ${escapeHtml(opponentFactionClass)}">${playModeState.opponentResource}</span>
            <button class="btn ghost sm" type="button" data-play-action="resource-inc" data-side="opponent">+</button>
          </div>
        </div>
      </div>
      <div class="play-stat">
        <div class="play-stat-label">Score</div>
        <div class="play-score-row"><span class="play-stat-label">${escapeHtml(playModeState.playerName)}</span><div class="play-score-controls"><button class="btn ghost sm" type="button" data-play-action="score-dec" data-side="player">-</button><span class="play-stat-value play-side-value ${escapeHtml(playerFactionClass)}">${playModeState.playerScore}</span><button class="btn ghost sm" type="button" data-play-action="score-inc" data-side="player">+</button></div></div>
        <div class="play-score-row"><span class="play-stat-label">${escapeHtml(playModeState.opponentName)}</span><div class="play-score-controls"><button class="btn ghost sm" type="button" data-play-action="score-dec" data-side="opponent">-</button><span class="play-stat-value play-side-value ${escapeHtml(opponentFactionClass)}">${playModeState.opponentScore}</span><button class="btn ghost sm" type="button" data-play-action="score-inc" data-side="opponent">+</button></div></div>
      </div>
      <div class="play-stat">
        <div class="play-stat-label">Lists</div>
        <div class="play-list-switches">
          <button class="btn ghost sm play-list-btn ${escapeHtml(playerFactionClass)}${playModeState.activeBoardSide === 'player' ? ' is-active' : ''}" type="button" data-play-action="show-board" data-side="player">${escapeHtml(playModeState.playerName)}</button>
          <button class="btn ghost sm play-list-btn ${escapeHtml(opponentFactionClass)}${playModeState.activeBoardSide === 'opponent' ? ' is-active' : ''}" type="button" data-play-action="show-board" data-side="opponent" ${hasOpponentBoard ? '' : 'disabled'}>${escapeHtml(playModeState.opponentName)}</button>
        </div>
      </div>
      <div class="play-stat">
        <div class="play-stat-label">First Player</div>
        <div class="play-inline-controls">
          <button class="btn ghost play-first-player-btn ${escapeHtml(firstPlayerFactionClass)}" type="button" data-play-action="toggle-first-player">${escapeHtml(firstPlayerLabel)}</button>
        </div>
      </div>
      <div class="play-stat">
        <div class="play-stat-label">Round Tracker</div>
        <div class="play-resource-row"><span class="play-stat-label">Round</span><span class="play-stat-value">${playModeState.round}</span></div>
        <div class="play-resource-row"><span class="play-stat-label">Phase</span><span class="play-stat-value play-phase-readout ${escapeHtml(phaseClass)}">${escapeHtml(currentPhase)}</span></div>
        <div class="play-inline-controls">
          <button class="btn ghost sm" type="button" data-play-action="open-new-game-confirm" title="Start New Game">↻ New Game</button>
        </div>
      </div>
      <div class="play-stat">
        <div class="play-stat-label">Flow</div>
        <div class="play-phase-actions">
          <button class="btn ghost sm" type="button" data-play-action="phase-back">Back</button>
          <button class="btn sm" type="button" data-play-action="phase-next">${escapeHtml(nextLabel)}</button>
        </div>
        <div class="play-inline-controls" style="margin-top:8px;">
          <button class="btn ghost sm" type="button" data-play-action="save-progress">Save Progress</button>
          <button class="btn ghost sm" type="button" data-play-action="archive-current">Archive Game</button>
        </div>
      </div>
    </div>`;
}

function renderPlayMode(roster) {
  ensurePlayModeState(roster);
  if (!playModeState?.playerRoster) return '';
  const activeSide = playModeState.activeBoardSide === 'opponent' && playModeState.opponentRoster ? 'opponent' : 'player';
  playModeState.activeBoardSide = activeSide;
  const playerBoardHtml = renderPlayerAid(playModeState.playerRoster, {
    showStats: true,
    allUpgrades: true,
    showActivation: true,
    showTactical: true,
    mergedBuffs: true,
    dedupeUnits: false,
    playTrackers: playModeState,
    unitKeyPrefix: 'player:',
    rosterLabel: playModeState.playerName,
  });
  const opponentBoardHtml = playModeState.opponentRoster
    ? renderPlayerAid(playModeState.opponentRoster, {
      showStats: true,
      allUpgrades: true,
      showActivation: true,
      showTactical: true,
      mergedBuffs: true,
      dedupeUnits: false,
      playTrackers: playModeState,
      unitKeyPrefix: 'opponent:',
      rosterLabel: playModeState.opponentName,
    })
    : '';
  const activeBoardHtml = activeSide === 'opponent' ? opponentBoardHtml : playerBoardHtml;
  const activeName = activeSide === 'opponent' ? playModeState.opponentName : playModeState.playerName;
  const activePrefix = activeSide === 'opponent' ? 'opponent:' : 'player:';
  return `
    <div class="play-board-grid single">
      <div class="play-board-column">
        <div class="play-board-controls">
          <div class="play-stat-label">${escapeHtml(activeName)} Controls</div>
          <div class="play-side-actions">
            <button class="btn ghost sm" type="button" data-play-action="collapse-side" data-side-prefix="${escapeHtml(activePrefix)}">Collapse All</button>
            <button class="btn ghost sm" type="button" data-play-action="expand-side" data-side-prefix="${escapeHtml(activePrefix)}">Expand All</button>
          </div>
        </div>
        ${activeBoardHtml}
      </div>
    </div>`;
}

function refreshPlayModeOutput() {
  if (!playCardEl || !playDashboardEl) return;
  if (!playModeState && currentRoster) ensurePlayModeState(currentRoster);
  if (playModeState?.hasStarted) persistCurrentPlayState();
  if (playNewGameBtn) playNewGameBtn.style.display = playModeState?.hasStarted ? 'none' : '';
  playDashboardEl.innerHTML = buildPlayDashboard();
  renderPlayHistoryLists();
  playCardEl.innerHTML = renderPlayMode(currentRoster);
  if (playModeState?.hasStarted) {
    const side = playModeState.activeBoardSide === 'opponent' ? 'opponent' : 'player';
    const hpWidth = playModeState.collapsedHealthWidthBySide?.[side] ?? null;
    if (hpWidth) {
      playCardEl.style.setProperty('--play-collapsed-health-width', hpWidth);
    } else {
      playCardEl.style.removeProperty('--play-collapsed-health-width');
      freezePlayCollapsedHealthWidth(side);
    }

    const nameWidth = playModeState.collapsedNameWidthBySide?.[side] ?? null;
    if (nameWidth) {
      playCardEl.style.setProperty('--aid-collapsed-name-width', nameWidth);
      const titleRows = playCardEl.querySelectorAll('.aid-unit-title-row');
      for (const row of titleRows) row.style.setProperty('--aid-collapsed-name-width', nameWidth);
    } else {
      playCardEl.style.removeProperty('--aid-collapsed-name-width');
      scheduleAidCollapsedStatlineAlignment();
    }
  } else {
    playCardEl.style.removeProperty('--play-collapsed-health-width');
    playCardEl.style.removeProperty('--aid-collapsed-name-width');
  }
}

function openPlayNewGameDialog() {
  if (!playNewGameDialog) return;
  if (!playModeState && currentRoster) ensurePlayModeState(currentRoster);
  if (playPlayerNameInput) playPlayerNameInput.value = playModeState?.playerName || 'Player';
  if (playOpponentNameInput) playOpponentNameInput.value = playModeState?.opponentName || 'Opponent';
  if (playOpponentFactionInput) playOpponentFactionInput.value = playModeState?.opponentFaction || 'Terran';
  if (playPlayerSeedInput) playPlayerSeedInput.value = playModeState?.playerSeed || currentRoster?.seed || '';
  if (playOpponentSeedInput) playOpponentSeedInput.value = playModeState?.opponentSeed || '';
  if (playMissionNameInput) playMissionNameInput.value = playModeState?.missionName || 'Mission';
  if (playGameLengthInput) playGameLengthInput.value = String(playModeState?.gameLength || 5);
  if (playStartingSupplyInput) playStartingSupplyInput.value = String(playModeState?.startingSupply ?? 10);
  if (playSupplyPerRoundInput) playSupplyPerRoundInput.value = String(playModeState?.supplyPerRound ?? 2);
  if (playGameSizeInput) playGameSizeInput.value = String(playModeState?.gameSize || 2000);
  playNewGameDialog.showModal();
}

function handlePlayNextStep() {
  if (!playModeState) return;
  const currentPhase = getPlayCurrentPhase();
  if (currentPhase === 'Scoring' && playModeState.round >= playModeState.gameLength) {
    persistCurrentPlayState({ archive: true });
    const winner = playModeState.playerScore === playModeState.opponentScore
      ? 'Draw'
      : (playModeState.playerScore > playModeState.opponentScore ? playModeState.playerName : playModeState.opponentName);
    window.alert(`Final Score\n${playModeState.playerName}: ${playModeState.playerScore}\n${playModeState.opponentName}: ${playModeState.opponentScore}\nWinner: ${winner}`);
    showToast('Game archived to Past Games.');
    refreshPlayModeOutput();
    return;
  }

  playModeState.history.push(clonePlaySnapshot());
  if (currentPhase === 'Scoring') {
    playModeState.round += 1;
    playModeState.phaseIndex = 0;
    resetRoundTrackers();
  } else {
    playModeState.phaseIndex = Math.min(playModeState.phaseIndex + 1, PLAY_PHASES.length - 1);
  }
  refreshPlayModeOutput();
}

function handlePlayBackStep() {
  if (!playModeState?.history?.length) return;
  const snapshot = playModeState.history.pop();
  restorePlaySnapshot(snapshot);
  refreshPlayModeOutput();
}

function handlePlayAction(actionEl) {
  const action = String(actionEl.dataset.playAction || '');
  const side = String(actionEl.dataset.side || '');
  const unitKey = String(actionEl.dataset.unitKey || '');
  const phase = String(actionEl.dataset.phase || '').toLowerCase();
  const gameId = String(actionEl.dataset.gameId || '');

  if (action === 'load-saved-game') {
    if (gameId && loadPlayGameFromLibrary(gameId, 'inProgress')) {
      showToast('Loaded saved game.');
    }
    return;
  }
  if (action === 'load-completed-game') {
    if (gameId && loadPlayGameFromLibrary(gameId, 'completed', { mode: 'load', asEditableCopy: true })) {
      showToast('Loaded archived game into active play.');
    }
    return;
  }
  if (action === 'rewind-completed-game') {
    if (gameId && loadPlayGameFromLibrary(gameId, 'completed', { mode: 'rewind', asEditableCopy: true })) {
      showToast('Loaded archived game rewound one step.');
    }
    return;
  }
  if (action === 'restart-completed-game') {
    if (gameId && loadPlayGameFromLibrary(gameId, 'completed', { mode: 'restart', asEditableCopy: true })) {
      showToast('Started a fresh game from archived setup.');
    }
    return;
  }
  if (action === 'delete-saved-game') {
    if (gameId) {
      removePlayGameFromLibrary(gameId, 'inProgress');
      showToast('Saved game deleted.');
      refreshPlayModeOutput();
    }
    return;
  }
  if (action === 'delete-completed-game') {
    if (gameId) {
      removePlayGameFromLibrary(gameId, 'completed');
      showToast('Past game deleted.');
      refreshPlayModeOutput();
    }
    return;
  }

  if (!playModeState) return;
  const tracker = unitKey ? playModeState.unitsByKey[unitKey] : null;

  if (action === 'open-new-game') {
    openPlayNewGameDialog();
    return;
  }
  if (action === 'open-new-game-confirm') {
    playResetGameDialog?.showModal();
    return;
  }
  if (action === 'phase-next') {
    handlePlayNextStep();
    return;
  }
  if (action === 'save-progress') {
    persistCurrentPlayState();
    showToast('Game progress saved locally.');
    refreshPlayModeOutput();
    return;
  }
  if (action === 'archive-current') {
    persistCurrentPlayState({ archive: true });
    showToast('Game moved to Past Games.');
    refreshPlayModeOutput();
    return;
  }
  if (action === 'archive-saved-game') {
    const gameId = String(actionEl.dataset.gameId || '');
    if (gameId && loadPlayGameFromLibrary(gameId, 'inProgress')) {
      persistCurrentPlayState({ archive: true });
      showToast('Saved game archived.');
      refreshPlayModeOutput();
    }
    return;
  }
  if (action === 'collapse-side') {
    setPlaySideUnitsCollapsed(String(actionEl.dataset.sidePrefix || ''), true);
    return;
  }
  if (action === 'expand-side') {
    setPlaySideUnitsCollapsed(String(actionEl.dataset.sidePrefix || ''), false);
    return;
  }
  if (action === 'show-board') {
    if (side === 'opponent' && !playModeState.opponentRoster) return;
    playModeState.activeBoardSide = side === 'opponent' ? 'opponent' : 'player';
    refreshPlayModeOutput();
    return;
  }
  if (action === 'phase-back') {
    handlePlayBackStep();
    return;
  }
  if (action === 'toggle-first-player') {
    playModeState.firstPlayer = playModeState.firstPlayer === 'player' ? 'opponent' : 'player';
    refreshPlayModeOutput();
    return;
  }
  if (action === 'toggle-deployed') {
    if (!tracker) return;
    tracker.deployed = !tracker.deployed;
    refreshPlayModeOutput();
    return;
  }
  if (action === 'score-inc' || action === 'score-dec') {
    const delta = action === 'score-inc' ? 1 : -1;
    if (side === 'player') playModeState.playerScore = Math.max(0, playModeState.playerScore + delta);
    if (side === 'opponent') playModeState.opponentScore = Math.max(0, playModeState.opponentScore + delta);
    refreshPlayModeOutput();
    return;
  }
  if (action === 'resource-inc' || action === 'resource-dec') {
    const delta = action === 'resource-inc' ? 1 : -1;
    if (side === 'player') playModeState.playerResource = Math.max(0, playModeState.playerResource + delta);
    if (side === 'opponent') playModeState.opponentResource = Math.max(0, playModeState.opponentResource + delta);
    refreshPlayModeOutput();
    return;
  }
  if (!tracker) return;
  if (action === 'hp-inc') {
    adjustPlayTrackerHealth(tracker, 1);
    refreshPlayModeOutput();
    return;
  }
  if (action === 'hp-dec') {
    adjustPlayTrackerHealth(tracker, -1);
    refreshPlayModeOutput();
    return;
  }
  if (action === 'toggle-activation' && ['movement', 'assault', 'combat'].includes(phase)) {
    tracker.activation[phase] = !tracker.activation[phase];
    refreshPlayModeOutput();
  }
}

const collapsedAidUnits = new Set();

function applyDefaultPlayCollapsedUnits(state) {
  if (!state?.unitsByKey) return;
  for (const key of Array.from(collapsedAidUnits)) {
    if (String(key).startsWith('player:') || String(key).startsWith('opponent:')) {
      collapsedAidUnits.delete(key);
    }
  }
  for (const unitKey of Object.keys(state.unitsByKey)) {
    collapsedAidUnits.add(unitKey);
  }
}

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
  setAllAidUnitsCollapsedIn(aidCardEl, collapsed);
}

function setAllAidUnitsCollapsedIn(containerEl, collapsed) {
  if (!containerEl) return;
  const unitEls = Array.from(containerEl.querySelectorAll('.aid-unit[data-aid-unit-key]'));
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

function setPlaySideUnitsCollapsed(sidePrefix, collapsed) {
  if (!playCardEl) return;
  const normalizedPrefix = String(sidePrefix || '').trim();
  if (!normalizedPrefix) return;
  const unitEls = Array.from(playCardEl.querySelectorAll('.aid-unit[data-aid-unit-key]'));
  for (const unitEl of unitEls) {
    const unitKey = String(unitEl.dataset.aidUnitKey || '').trim();
    if (!unitKey.startsWith(normalizedPrefix)) continue;
    if (collapsed) {
      collapsedAidUnits.add(unitKey);
    } else {
      collapsedAidUnits.delete(unitKey);
    }
    syncAidUnitCollapsedState(unitEl, collapsed);
  }
  scheduleAidCollapsedStatlineAlignment();
}

function freezePlayCollapsedHealthWidth(side) {
  if (!playModeState || !playCardEl) return;
  const normalizedSide = side === 'opponent' ? 'opponent' : 'player';
  if (playModeState.collapsedHealthWidthBySide?.[normalizedSide]) return;
  const trackers = Object.values(playModeState.unitsByKey ?? {}).filter(t => t.side === normalizedSide);
  if (!trackers.length) return;

  let maxChars = 0;
  for (const tracker of trackers) {
    const maxPools = Array.isArray(tracker?.maxHealthPools) ? tracker.maxHealthPools : [];
    if (!maxPools.length) continue;
    const text = maxPools.map(pool => String(pool?.value ?? 0)).join('/');
    const length = text.length;
    if (Number.isFinite(length) && length > maxChars) maxChars = length;
  }

  if (maxChars > 0) {
    const widthValue = `calc(${maxChars}ch + 24px)`;
    if (!playModeState.collapsedHealthWidthBySide) {
      playModeState.collapsedHealthWidthBySide = { player: null, opponent: null };
    }
    playModeState.collapsedHealthWidthBySide[normalizedSide] = widthValue;
    if (playModeState.activeBoardSide === normalizedSide) {
      playCardEl.style.setProperty('--play-collapsed-health-width', widthValue);
    }
  }
}

function syncAidCollapsedStatlineAlignment() {
  const containers = [aidCardEl, playCardEl].filter(Boolean);
  for (const containerEl of containers) {
    const isPlayContainer = containerEl === playCardEl;
    const playSide = isPlayContainer && playModeState
      ? (playModeState.activeBoardSide === 'opponent' ? 'opponent' : 'player')
      : null;
    if (isPlayContainer && playModeState?.collapsedNameWidthBySide?.[playSide]) {
      const fixedWidth = playModeState.collapsedNameWidthBySide[playSide];
      containerEl.style.setProperty('--aid-collapsed-name-width', fixedWidth);
      const titleRows = containerEl.querySelectorAll('.aid-unit-title-row');
      for (const row of titleRows) row.style.setProperty('--aid-collapsed-name-width', fixedWidth);
      continue;
    }

    const nameEls = Array.from(containerEl.querySelectorAll('.aid-unit .unit-name'));
    if (!nameEls.length) {
      containerEl.style.removeProperty('--aid-collapsed-name-width');
      continue;
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
      containerEl.style.setProperty('--aid-collapsed-name-width', widthPx);
      const titleRows = containerEl.querySelectorAll('.aid-unit-title-row');
      for (const row of titleRows) row.style.setProperty('--aid-collapsed-name-width', widthPx);
      if (isPlayContainer && playSide && playModeState) {
        if (!playModeState.collapsedNameWidthBySide) {
          playModeState.collapsedNameWidthBySide = { player: null, opponent: null };
        }
        playModeState.collapsedNameWidthBySide[playSide] = widthPx;
      }
    } else {
      containerEl.style.removeProperty('--aid-collapsed-name-width');
      const titleRows = containerEl.querySelectorAll('.aid-unit-title-row');
      for (const row of titleRows) row.style.removeProperty('--aid-collapsed-name-width');
    }
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

  // ── Play Mode ──────────────────────────────────────────────────────────────
  refreshPlayModeOutput();

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
    syncUrlToState();
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

// ─── URL state sync ──────────────────────────────────────────────────────────
function syncUrlToState() {
  try {
    const url = new URL(window.location.href);
    if (currentRoster?.seed) url.searchParams.set('s', currentRoster.seed);
    const activeTab = document.querySelector('.tab.active')?.dataset.tab;
    if (activeTab && activeTab !== 'preview') {
      url.searchParams.set('tab', activeTab);
    } else {
      url.searchParams.delete('tab');
    }
    window.history.replaceState({}, '', url);
  } catch (_) { /* navigation unavailable */ }
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
  syncUrlToState();
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
  const isInkFriendly = JSON.parse(localStorage.getItem('aidPrintInkFriendly') || 'false');

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

    /* INK-FRIENDLY MODE */
    body.ink-friendly { background: #ffffff; }
    body.ink-friendly .roster-faction { color: #0d38a0; }
    body.ink-friendly .roster-faction.Terran { color: #0d38a0; }
    body.ink-friendly .roster-faction.Zerg { color: #8b1845; }
    body.ink-friendly .roster-faction.Protoss { color: #704600; }
    body.ink-friendly .aid-unit-header { background: #f5f7fa; }
    body.ink-friendly .unit-name { color: #111; }
    body.ink-friendly .aid-body { background: #ffffff; }
    body.ink-friendly .aid-section-title { color: #1a1a1a; }
    body.ink-friendly .weapon-name { color: #111; }
    body.ink-friendly .aid-weapons-table th { background: #f0f2f6; color: #1a1a1a; }
    body.ink-friendly .aid-weapons-table tr:nth-child(even) { background: #fafbfc; }
    body.ink-friendly .aid-weapons-table tr:nth-child(odd) { background: #ffffff; }
    body.ink-friendly .aid-weapons-table tbody tr td { border-color: #e8eef5; color: #1a1a1a; }
    body.ink-friendly .aid-upg { background: #fafbfc; border-color: #d0d8e0; }
    body.ink-friendly .aid-upg-desc { color: #222; }
    body.ink-friendly .aid-upg.is-active { background: #e8f5e9; border-color: #8db899; }
    body.ink-friendly .aid-upg.is-active .aid-upg-name { color: #0d5a1a; }
    body.ink-friendly .upg-pill { background: #e8f5e9; border-color: #8db899; color: #0d5a1a; }
    body.ink-friendly .stat-chip { background: #e8ecf3; border-color: #b8c0cc; color: #1a1a1a; }
    body.ink-friendly .stat-chip strong { color: #0d38a0; }
    body.ink-friendly .stat-chip.stat-chip-supply { background: #f5ecf1; border-color: #d49db8; color: #8b1845; }
    body.ink-friendly .stat-chip.stat-chip-supply strong { color: #8b1845; }
    body.ink-friendly .aid-inline-chip { background: #e8ecf3; border-color: #b8c0cc; color: #1a1a1a; }
    body.ink-friendly .aid-inline-activation { background: #f2edff; border-color: #cfc0db; color: #6a4aa8; }
    body.ink-friendly .aid-inline-resource { background: #e8ecf3; border-color: #7a9fcc; color: #0d38a0; }
    body.ink-friendly .aid-tact-card { background: #fafbfc; border-color: #d0d8e0; }
    body.ink-friendly .aid-tact-card-name { color: #111; }
    body.ink-friendly .aid-tact-card-count { color: #333; }
    body.ink-friendly .aid-tact-meta-chip { background: #e8ecf3; border-color: #b8c0cc; color: #1a1a1a; }
    body.ink-friendly .aid-tact-ability { background: #ffffff; border-color: #d0d8e0; }
    body.ink-friendly .aid-tact-ability-name { color: #111; }
    body.ink-friendly .aid-tact-phase-chip { background: #e8ecf3; border-color: #b8c0cc; color: #1a1a1a; }
    body.ink-friendly .aid-tact-phase-chip.phase-movement { background: #e8ecf3; border-color: #7a9fcc; color: #0d38a0; }
    body.ink-friendly .aid-tact-phase-chip.phase-assault { background: #f5ecf1; border-color: #d49db8; color: #8b1845; }
    body.ink-friendly .aid-tact-phase-chip.phase-combat { background: #faf6f0; border-color: #c9b084; color: #704600; }
    body.ink-friendly .aid-tact-phase-chip.phase-scoring { background: #ecf4ee; border-color: #8db899; color: #0d5a1a; }
    body.ink-friendly .aid-tact-phase-chip.phase-cleanup { background: #f2edff; border-color: #cfc0db; color: #6a4aa8; }
  </style>
</head>
<body class="${isInkFriendly ? 'ink-friendly' : ''}">
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

function estimateAidDeckCardDensity({ weapons = [], abilities = [], text = '' } = {}) {
  const chars = String(text || '').length;
  return (weapons.length * 2.2) + (abilities.length * 1.8) + (chars / 180);
}

function getAidDeckCardSize(density) {
  return density > 7.2 ? 'tarot' : 'mtg';
}

function normalizeAidDeckText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function estimateAidDeckAbilityUnits(ability, { size = 'mtg', charsPerLine = null } = {}) {
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

function splitAidDeckAbilitiesForSides(abilities, { size = 'mtg', frontBudget = 6 } = {}) {
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

function getAidDeckUnitFrontBudget(size, weaponCount, weaponTraitLines = 0) {
  if (size === 'tarot') {
    return Math.max(18.5, 26.5 - (weaponCount * 0.75) - (weaponTraitLines * 0.45));
  }
  return Math.max(3.4, 7.6 - (weaponCount * 0.85));
}

function getAidDeckTacticalFrontBudget(size, abilityCount = 0) {
  if (size === 'tarot') return Math.max(19, 28 - (abilityCount * 0.1));
  return 6.8;
}

function renderAidDeckAbilityBubble(ability, { faction, factionClass, phaseTag = '', active = false, natural = false } = {}) {
  const activation = parseAidActivation(ability);
  const resourceCost = extractAidFactionResourceCost(activation.resource, faction, factionClass);
  const description = normalizeAidDeckText(ability?.description || ability?.text || '');
  const classes = ['deck-ability'];
  if (active) classes.push('is-active');
  else if (natural) classes.push('is-natural');
  else classes.push('is-inactive');

  return `
    <div class="${classes.join(' ')}">
      <div class="deck-ability-top">
        <strong>${escapeHtml(ability?.name || 'Ability')}</strong>
        ${activation.state ? `<span class="deck-chip deck-chip-activation">${escapeHtml(activation.state)}</span>` : ''}
        ${resourceCost ? `<span class="deck-chip deck-chip-resource">${escapeHtml(String(resourceCost.amount))} <span class="resource-icon ${escapeHtml(resourceCost.className)}">${escapeHtml(resourceCost.icon)}</span></span>` : ''}
        ${phaseTag ? `<span class="deck-chip deck-chip-phase phase-${escapeHtml(String(ability?.phase || '').toLowerCase())}">${escapeHtml(phaseTag)}</span>` : ''}
      </div>
      ${description ? `<div class="deck-ability-text">${formatAidRichText(description, { faction, factionClass, allowLineBreaks: false })}</div>` : ''}
    </div>`;
}

function renderAidDeckUnitFrontCard(unit, { faction, factionClass } = {}) {
  const upgrades = sortUpgradesForDisplay(unit.allUpgrades ?? []);
  const weapons = resolveLinkedWeaponReplacements(
    upgrades
      .filter(isWeaponProfile)
      .filter(ug => isNaturalAbility(ug) || ug.active)
      .map(parseWeaponProfile),
    unit.models
  ).sort(compareAidWeaponProfiles);
  const abilities = upgrades
    .filter(ug => !isWeaponProfile(ug))
    .filter(ug => isNaturalAbility(ug) || ug.active);
  const density = estimateAidDeckCardDensity({
    weapons,
    abilities,
    text: abilities.map(a => a.description || '').join(' '),
  });
  const models = Number(unit.models ?? 1) > 1 ? ` ×${unit.models}` : '';
  const typeAbbr = TYPE_ABBR[unit.type] ?? '?';
  const statTokens = [
    ['HP', unit?.stats?.hp],
    ['ARM', unit?.stats?.armor],
    ['EVD', unit?.stats?.evade],
    ['SPD', unit?.stats?.speed],
    ['SH', unit?.stats?.shield],
  ]
    .filter(([, value]) => hasStatValue(value))
    .map(([label, value]) => `<span class="deck-chip">${escapeHtml(label)} ${escapeHtml(String(value))}</span>`)
    .join('');
  const supplyToken = `<span class="deck-chip deck-chip-supply">◆ ${escapeHtml(String(unit.supply ?? 0))}</span>`;
  const renderWeaponTable = (weaponRows, { compact = false } = {}) => {
    if (!weaponRows.length) return '';
    return `
      <div class="deck-table-wrap">
        <table class="deck-weapons-table${compact ? ' compact' : ''}">
          <thead>
            <tr>
              <th>Weapon</th>
              <th>Rng</th>
              <th>RoA</th>
              <th>Hit</th>
              <th>Dmg</th>
              <th>Surge</th>
            </tr>
          </thead>
          <tbody>
            ${weaponRows.map(w => `<tr class="${w.active ? 'is-active' : 'is-natural'}"><td class="deck-weapon-name"><div class="deck-weapon-title">${escapeHtml(w.name)}</div>${w.traits ? `<div class="deck-weapon-traits">${escapeHtml(w.traits)}</div>` : ''}</td><td>${escapeHtml(String(w.range))}</td><td>${escapeHtml(String(w.roa))}</td><td>${escapeHtml(String(w.hit))}</td><td>${escapeHtml(String(w.damage))}</td><td>${escapeHtml(String(w.surge))}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  };
  const allFrontWeapons = weapons;
  const visibleAbilities = abilities.filter(ability => !isWeaponProfile(ability));

  const mtgSplit = splitAidDeckAbilitiesForSides(visibleAbilities, {
    size: 'mtg',
    frontBudget: getAidDeckUnitFrontBudget('mtg', allFrontWeapons.length, allFrontWeapons.filter(w => w.traits).length),
  });
  const tarotSplit = splitAidDeckAbilitiesForSides(visibleAbilities, {
    size: 'tarot',
    frontBudget: getAidDeckUnitFrontBudget('tarot', allFrontWeapons.length, allFrontWeapons.filter(w => w.traits).length),
  });

  const useMtg = density <= 7.2 && mtgSplit.back.length === 0;
  const size = useMtg ? 'mtg' : 'tarot';
  const tarotMode = size === 'tarot';
  const splitAbilities = useMtg ? mtgSplit : tarotSplit;
  const frontWeapons = allFrontWeapons;
  const frontAbilities = splitAbilities.front;
  const backAbilities = splitAbilities.back;
  const hasOverflow = backAbilities.length > 0;
  const needsBack = hasOverflow;
  const weaponTraitCount = frontWeapons.filter(w => w.traits).length;

  const frontHtml = `
    <article class="deck-card ${size} unit-card ${escapeHtml(factionClass)}">
      <header class="deck-card-header">
        <span class="deck-type-badge badge-${escapeHtml(unit.type)}">${escapeHtml(typeAbbr)}</span>
        <div class="deck-title-wrap">
          <div class="deck-title">${escapeHtml(unit.name)}${escapeHtml(models)}</div>
        </div>
        <div class="deck-cost">💎 ${escapeHtml(String(unit.totalCost ?? 0))}m</div>
      </header>
      <div class="deck-statline">
        ${statTokens}
        ${supplyToken}
      </div>
      ${frontWeapons.length ? `<section class="deck-block">${renderWeaponTable(frontWeapons, { compact: !tarotMode })}</section>` : ''}
      ${frontAbilities.length ? `<section class="deck-block">${frontAbilities.map(a => renderAidDeckAbilityBubble(a, {
        faction,
        factionClass,
        phaseTag: a.phase ? getPhaseTag(a.phase) : '',
        active: !isNaturalAbility(a) && !!a.active,
        natural: isNaturalAbility(a),
      })).join('')}</section>` : ''}
      ${hasOverflow ? `<div class="deck-overflow-note">Additional ability bubbles continue on the back.</div>` : ''}
    </article>`;

  if (!needsBack) {
    return { frontHtml, backHtml: '', size };
  }

  const fullWeapons = renderWeaponTable(weapons);
  const fullAbilities = backAbilities.map(a => renderAidDeckAbilityBubble(a, {
    faction,
    factionClass,
    phaseTag: a.phase ? getPhaseTag(a.phase) : '',
    active: !isNaturalAbility(a) && !!a.active,
    natural: isNaturalAbility(a),
  })).join('');

  const backHtml = `
    <article class="deck-card ${size} unit-card ${escapeHtml(factionClass)} back-face">
      <header class="deck-card-header">
        <div class="deck-title-wrap">
          <div class="deck-title">${escapeHtml(unit.name)}${escapeHtml(models)} · Back</div>
          <div class="deck-subtitle">Full Rules</div>
        </div>
      </header>
      ${fullWeapons ? `<section class="deck-block"><h4>Weapons</h4>${fullWeapons}</section>` : ''}
      ${fullAbilities ? `<section class="deck-block"><h4>Abilities</h4>${fullAbilities}</section>` : ''}
    </article>`;

  return { frontHtml, backHtml, size };
}

function renderAidDeckTacticalFrontCard(card, { faction, factionClass } = {}) {
  const abilities = Array.isArray(card.abilities) ? card.abilities.map(parseAidTacticalAbility) : [];
  const abilityText = abilities.map(a => a.description || '').join(' ');
  const density = estimateAidDeckCardDensity({ abilities, text: abilityText });
  const supplyLetters = formatTacticalSupplyTypes(card.slots ?? {});
  const resourceConfig = getFactionResourceLabelConfig(faction, factionClass);
  const metaParts = [];
  if (card.count > 1) metaParts.push(`<span class="deck-chip">x${card.count}</span>`);
  if (card.isUnique) metaParts.push('<span class="deck-chip">Unique</span>');
  if (typeof card.resource === 'number') metaParts.push(`<span class="deck-chip deck-chip-resource">${card.resource} ${escapeHtml(resourceConfig.icon)}</span>`);
  if (typeof card.gasCost === 'number') metaParts.push(`<span class="deck-chip deck-chip-gas">⛽ ${card.gasCost}g</span>`);
  if (supplyLetters.length) metaParts.push(`<span class="deck-chip">${supplyLetters.map(({ letter }) => `<span class="deck-slot">${escapeHtml(letter)}</span>`).join('')}</span>`);

  const mtgSplit = splitAidDeckAbilitiesForSides(abilities, {
    size: 'mtg',
    frontBudget: getAidDeckTacticalFrontBudget('mtg', abilities.length),
  });
  const tarotSplit = splitAidDeckAbilitiesForSides(abilities, {
    size: 'tarot',
    frontBudget: getAidDeckTacticalFrontBudget('tarot', abilities.length),
  });
  const useMtg = density <= 7.2 && mtgSplit.back.length === 0;
  const size = useMtg ? 'mtg' : 'tarot';
  const tarotMode = size === 'tarot';
  const splitAbilities = useMtg ? mtgSplit : tarotSplit;
  const frontAbilities = splitAbilities.front;
  const backAbilities = splitAbilities.back;
  const hasOverflow = backAbilities.length > 0;
  const needsBack = hasOverflow;
  const frontHtml = `
    <article class="deck-card ${size} tactical-card ${escapeHtml(factionClass)}">
      <header class="deck-card-header">
        <div class="deck-title-wrap">
          <div class="deck-title">${escapeHtml(card.name)}</div>
          <div class="deck-subtitle">Tactical Card</div>
        </div>
      </header>
      ${metaParts.length ? `<div class="deck-meta-chips">${metaParts.join('')}</div>` : ''}
      ${card.tags ? `<div class="deck-tags">${escapeHtml(card.tags)}</div>` : ''}
      <section class="deck-block">
        ${frontAbilities.map(a => renderAidDeckAbilityBubble(a, {
          faction,
          factionClass,
          phaseTag: a.phase ? getPhaseTag(a.phase) : '',
          natural: true,
        })).join('')}
      </section>
      ${hasOverflow ? `<div class="deck-overflow-note">Additional ability bubbles continue on the back.</div>` : ''}
    </article>`;

  if (!needsBack) return { frontHtml, backHtml: '', size };

  const backHtml = `
    <article class="deck-card ${size} tactical-card ${escapeHtml(factionClass)} back-face">
      <header class="deck-card-header">
        <div class="deck-title-wrap">
          <div class="deck-title">${escapeHtml(card.name)} · Back</div>
          <div class="deck-subtitle">Full Rules</div>
        </div>
      </header>
      <section class="deck-block">
        <h4>Abilities</h4>
        ${backAbilities.map(a => renderAidDeckAbilityBubble(a, {
          faction,
          factionClass,
          phaseTag: a.phase ? getPhaseTag(a.phase) : '',
          natural: true,
        })).join('')}
      </section>
    </article>`;

  return { frontHtml, backHtml, size };
}

function openAidCardDeckPrintWindow() {
  if (!currentRoster) return;
  const seed = getSeed();
  const roster = currentRoster;
  const factionClass = `faction-${String(roster.faction).toLowerCase()}`;
  const isInkFriendly = JSON.parse(localStorage.getItem('aidPrintInkFriendly') || 'false');

  const seenUnitKeys = new Set();
  const dedupedUnits = (roster.units ?? []).filter((u) => {
    const key = getAidUnitKey(u);
    if (seenUnitKeys.has(key)) return false;
    seenUnitKeys.add(key);
    return true;
  });

  // Render all units with front/back pairs (Tarot landscape)
  const unitPairs = dedupedUnits.map(unit => {
    const front = renderNewAidDeckUnitFront(unit, { faction: roster.faction, factionClass });
    const back = renderNewAidDeckUnitBack(unit, { faction: roster.faction, factionClass });
    return { front, back };
  });

  // Render tactical cards as front-only for now; keep back renderer available for quick re-enable.
  const includeTacticalBacks = false;
  const tacticalGroups = groupAidTacticalCards(roster.tacticalCardDetails ?? []);
  const tacticalPairs = tacticalGroups.map(card => {
    const front = renderNewAidDeckTacticalCardFront(card, { faction: roster.faction, factionClass });
    const back = includeTacticalBacks
      ? renderNewAidDeckTacticalCardBack(card, { faction: roster.faction, factionClass })
      : '';
    return { front, back };
  });

  // Build interleaved layout with sections
  let unitsContent = '';
  for (const pair of unitPairs) {
    unitsContent += `<div class="unit-pair">${pair.front}${pair.back}</div>`;
  }
  let tacticalContent = '';
  for (const pair of tacticalPairs) {
    tacticalContent += `<div class="tac-pair">${pair.front}${pair.back || ''}</div>`;
  }

  const win = window.open('', '_blank', 'width=1100,height=900');
  const inkFriendlyClass = isInkFriendly ? 'ink-friendly' : '';
  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Player Aid Card Deck — ${seed}</title>
  <style>
    *,*::before,*::after { box-sizing: border-box; }
    :root { font-family: Arial, sans-serif; }
    body { margin: 0; padding: 12mm; background: #fff; color: #111; }
    body.ink-friendly { background: #ffffff; }
    body.ink-friendly .unit-card { background: #ffffff; box-shadow: inset 0 0 0 1px #d0d8e0; }
    body.ink-friendly .unit-card.faction-terran { border-color: #0d38a0; }
    body.ink-friendly .unit-card.faction-zerg { border-color: #8b1845; }
    body.ink-friendly .unit-card.faction-protoss { border-color: #704600; }
    body.ink-friendly .unit-title { color: #111; }
    body.ink-friendly .unit-card.faction-terran .unit-title { color: #0d38a0; }
    body.ink-friendly .unit-card.faction-zerg .unit-title { color: #8b1845; }
    body.ink-friendly .unit-card.faction-protoss .unit-title { color: #704600; }
    body.ink-friendly .deck-section-title { color: #333; }
    body.ink-friendly .deck-title { color: #333; }
    body.ink-friendly .unit-section-title { color: #333; }
    body.ink-friendly .unit-weapons-table th { color: #333; }
    body.ink-friendly .badge-Core { color: #0052a3; }
    body.ink-friendly .badge-Air { color: #0052a3; }
    body.ink-friendly .unit-upgrade-header { color: #333; }
    body.ink-friendly .tac-slot-letter.slot-core { color: #0052a3; }
    body.ink-friendly .tac-slot-letter.slot-air { color: #0052a3; }
    body.ink-friendly .unit-stat-table { border-color: #c0c8d0; background: #ffffff; }
    body.ink-friendly .unit-stat-table th { background: #f0f2f6; color: #1a1a1a; border-color: #c0c8d0; }
    body.ink-friendly .unit-stat-table td { background: #fafbfc; color: #1a1a1a; border-color: #e8eef5; }
    body.ink-friendly .unit-stat-table td.highlighted { color: #0d5a1a; background: #e8f5e9; }
    body.ink-friendly .unit-weapons-table { border-color: #c0c8d0; }
    body.ink-friendly .unit-weapons-table th { background: #f0f2f6; color: #1a1a1a; border-color: #c0c8d0; }
    body.ink-friendly .unit-weapons-table td { color: #1a1a1a; border-color: #e8eef5; background: #fafbfc; }
    body.ink-friendly .unit-weapons-table td.is-highlighted { color: #0d5a1a; font-weight: 700; }
    body.ink-friendly .unit-weapons-table tr.is-active td { color: #0d5a1a; }
    body.ink-friendly .unit-ability { border-color: #d0d8e0; background: #f5f7fa; }
    body.ink-friendly .unit-ability.is-active { border-color: #0d5a1a; background: #e8f5e9; }
    body.ink-friendly .unit-ability-title { color: #111; }
    body.ink-friendly .unit-ability.is-active .unit-ability-title { color: #0d5a1a; }
    body.ink-friendly .unit-ability-text { color: #222; }
    body.ink-friendly .unit-ability-chip { border-color: #b8c0cc; background: #e8ecf3; color: #1a1a1a; }
    body.ink-friendly .unit-ability-chip.active { border-color: #0d5a1a; color: #0d5a1a; }
    body.ink-friendly .unit-ability-chip.passive { border-color: #707070; color: #333; }
    body.ink-friendly .unit-ability-chip.phase-movement { color: #0d38a0; border-color: #7a9fcc; background: #e8ecf3; }
    body.ink-friendly .unit-ability-chip.phase-assault { color: #8b1845; border-color: #d49db8; background: #f5ecf1; }
    body.ink-friendly .unit-ability-chip.phase-combat { color: #704600; border-color: #c9b084; background: #faf6f0; }
    body.ink-friendly .unit-ability-chip.phase-scoring { color: #0d5a1a; border-color: #8db899; background: #ecf4ee; }
    body.ink-friendly .unit-upgrade-pill { color: #0d5a1a; background: #e8f5e9; border-color: #8db899; }
    body.ink-friendly .tac-card { background: #ffffff; box-shadow: inset 0 0 0 1px #d0d8e0; }
    body.ink-friendly .tac-card.faction-terran { border-color: #0d38a0; }
    body.ink-friendly .tac-card.faction-zerg { border-color: #8b1845; }
    body.ink-friendly .tac-card.faction-protoss { border-color: #704600; }
    body.ink-friendly .tac-title { color: #111; }
    body.ink-friendly .tac-card.faction-terran .tac-title { color: #0d38a0; }
    body.ink-friendly .tac-card.faction-zerg .tac-title { color: #8b1845; }
    body.ink-friendly .tac-card.faction-protoss .tac-title { color: #704600; }
    body.ink-friendly .tac-meta-table { border-color: #c0c8d0; }
    body.ink-friendly .tac-meta-table th { background: #f0f2f6; color: #1a1a1a; border-color: #c0c8d0; }
    body.ink-friendly .tac-meta-table td { background: #fafbfc; color: #1a1a1a; border-color: #e8eef5; }
    body.ink-friendly .tac-meta-value-resource { color: #1a1a1a; }
    body.ink-friendly .tac-card.faction-terran .tac-meta-value-resource { color: #0d38a0; }
    body.ink-friendly .tac-card.faction-zerg .tac-meta-value-resource { color: #8b1845; }
    body.ink-friendly .tac-card.faction-protoss .tac-meta-value-resource { color: #704600; }
    body.ink-friendly .tac-ability { border-color: #d0d8e0; background: #f5f7fa; }
    body.ink-friendly .tac-ability-title { color: #111; }
    body.ink-friendly .tac-ability-text { color: #222; }
    body.ink-friendly .tac-ability-pill { border-color: #b8c0cc; background: #e8ecf3; color: #1a1a1a; }
    body.ink-friendly .tac-ability-pill.resource { color: #704600; border-color: #c9b084; background: #faf6f0; }
    .deck-header { margin-bottom: 8mm; border-bottom: 1px solid #314563; padding-bottom: 3mm; }
    .deck-section-title { font-size: 14px; font-weight: 700; margin: 8mm 0 6mm; color: #66b6ff; text-transform: uppercase; }
    .deck-title { font-size: 16px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: #66b6ff; }
    .deck-subtitle { font-size: 10px; color: #93a8c4; margin-top: 1mm; }

    /* UNITS: Tarot Landscape */
    .units-section { page-break-after: always; }
    .unit-pair {
      display: flex;
      gap: 3.4mm;
      margin-bottom: 8mm;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .unit-card {
      width: 120mm;
      height: 70mm;
      border: 2.4px solid;
      border-radius: 3.2mm;
      padding: 2.3mm;
      background:
        radial-gradient(circle at 78% 10%, rgba(102, 182, 255, .12), transparent 42%),
        linear-gradient(150deg, #1b2e47 0%, #132135 56%, #0d1728 100%);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 1.2mm;
      font-size: 8.2pt;
      line-height: 1.22;
      box-shadow: inset 0 0 0 1px rgba(125, 180, 255, .08);
    }
    .unit-card.faction-terran { border-color: #7db4ff; }
    .unit-card.faction-zerg { border-color: #f76db2; }
    .unit-card.faction-protoss { border-color: #f1bf59; }
    .unit-card-front { display: grid; grid-template-rows: auto auto 1fr auto; gap: 1mm; }
    .unit-card-back { display: grid; grid-template-rows: 1fr; gap: .8mm; }
    .unit-main { display: flex; flex-direction: column; gap: 1mm; }
    .unit-header { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 1.2mm; }
    .unit-badge { min-width: 8mm; height: 8mm; border-radius: 1.5mm; display: inline-flex; align-items: center; justify-content: center; font-size: 8pt; font-weight: 700; flex-shrink: 0; font-family: Orbitron, sans-serif; letter-spacing: .05em; }
    .badge-Hero { color: #f1bf59; background: rgba(241, 191, 89, .15); border: 1px solid #f1bf59; }
    .badge-Core { color: #66b6ff; background: rgba(102, 182, 255, .15); border: 1px solid #66b6ff; }
    .badge-Elite { color: #ff626b; background: rgba(255, 98, 107, .15); border: 1px solid #ff626b; }
    .badge-Support { color: #46d48a; background: rgba(70, 212, 138, .15); border: 1px solid #46d48a; }
    .badge-Air { color: #66b6ff; background: rgba(102, 182, 255, .15); border: 1px solid #66b6ff; }
    .badge-Other { color: #93a8c4; background: rgba(147, 168, 196, .12); border: 1px solid #93a8c4; }
    .unit-name-wrap {
      min-width: 0;
      height: 8mm;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .unit-title {
      font-size: 11.4pt;
      font-weight: 700;
      color: #d4deed;
      line-height: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
    }
    .unit-card.faction-terran .unit-title { color: #7db4ff; }
    .unit-card.faction-zerg .unit-title { color: #f76db2; }
    .unit-card.faction-protoss .unit-title { color: #f1bf59; }
    .unit-cost-wrap {
      display: inline-flex;
      align-items: center;
      gap: 1.1mm;
      white-space: nowrap;
    }
    .unit-cost { font-size: 10pt; font-weight: 700; font-family: Orbitron, sans-serif; white-space: nowrap; }
    .unit-supply-cost { font-size: 8.6pt; font-weight: 700; font-family: Orbitron, sans-serif; color: #ff626b; white-space: nowrap; }
    .unit-cost { color: #f1bf59; }
    .unit-stats { margin-top: .4mm; }
    .unit-stat-table { width: 100%; border-collapse: separate; border-spacing: 0; table-layout: fixed; border: 1px solid #314563; border-radius: 1.2mm; overflow: hidden; }
    .unit-stat-table th,
    .unit-stat-table td { text-align: center; border-right: 1px solid #314563; }
    .unit-stat-table th:last-child,
    .unit-stat-table td:last-child { border-right: none; }
    .unit-stat-table th {
      font-size: 6.3pt;
      text-transform: uppercase;
      letter-spacing: .08em;
      font-family: Orbitron, sans-serif;
      color: #93a8c4;
      background: rgba(20, 34, 54, .92);
      padding: 0.75mm 0.35mm;
      border-bottom: 1px solid #314563;
    }
    .unit-stat-table td {
      padding: 1.05mm 0.35mm 1.2mm;
      background: rgba(11, 23, 39, .9);
      color: #d4deed;
      font-family: Orbitron, sans-serif;
      font-size: 11.4pt;
      font-weight: 700;
      line-height: 1;
    }
    .unit-stat-table td.highlighted { color: #46d48a; background: rgba(70, 212, 138, .11); }
    .unit-stat-delta {
      font-size: 6.5pt;
      margin-left: .45mm;
      color: #9df5c8;
      vertical-align: top;
    }
    .unit-section { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
    .unit-front-bottom {
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
      overflow: hidden;
    }
    .unit-front-bottom.compact-weapons .unit-upgrade-section {
      padding-top: 0.45mm;
    }
    .unit-section-title { font-size: 7.2pt; font-weight: 700; text-transform: uppercase; color: #66b6ff; margin-bottom: 0.7mm; letter-spacing: .08em; font-family: Orbitron, sans-serif; }
    .unit-weapons-table { width: 100%; border-collapse: collapse; font-size: 7.3pt; table-layout: fixed; }
    .unit-weapons-table th { font-size: 6.2pt; text-transform: uppercase; color: #66b6ff; background: rgba(102, 182, 255, .08); padding: 0.7mm 0.8mm; border-bottom: 0.9px solid #314563; font-family: Orbitron, sans-serif; letter-spacing: .06em; }
    .unit-weapons-table th,
    .unit-weapons-table td { text-align: center; border-right: 0.8px solid #233650; }
    .unit-weapons-table th:last-child,
    .unit-weapons-table td:last-child { border-right: none; }
    .unit-weapons-table td { padding: 0.68mm 0.8mm; border-bottom: 0.8px solid #233650; color: #d4deed; }
    .unit-weapons-table td.is-highlighted { color: #46d48a; font-weight: 700; }
    .unit-weapons-table tr.is-active td { color: #46d48a; }
    .unit-weapons-table .weapon-name {
      font-weight: 700;
      white-space: normal;
      overflow: visible;
      text-overflow: clip;
      word-break: break-word;
      line-height: 1.14;
    }
    .unit-weapons-table .weapon-name.is-highlighted { color: #46d48a; }
    .unit-weapons-table th:last-child,
    .unit-weapons-table td:last-child { text-align: left; }
    .unit-weapons-table .weapon-traits-cell {
      text-align: left;
      font-size: 6.9pt;
      line-height: 1.12;
    }
    .unit-weapons-table .weapon-traits-text {
      display: block;
      overflow: visible;
      white-space: normal;
      word-break: break-word;
    }
    .unit-weapons-table.compact {
      font-size: 6.65pt;
    }
    .unit-weapons-table.compact th {
      font-size: 5.8pt;
      padding: 0.52mm 0.6mm;
    }
    .unit-weapons-table.compact td {
      padding: 0.45mm 0.52mm;
      line-height: 1.05;
    }
    .unit-weapons-table.compact .weapon-name {
      font-size: 6.9pt;
      line-height: 1.04;
    }
    .unit-weapons-table.compact .weapon-traits-cell {
      font-size: 6.05pt;
      line-height: 1.03;
    }
    .unit-upgrade-section {
      margin-top: auto;
      border-top: 0.8px solid rgba(49, 69, 99, .38);
      padding-top: 0.7mm;
    }
    .unit-upgrade-header {
      color: #66b6ff;
      font-family: Orbitron, sans-serif;
      font-size: 6.2pt;
      letter-spacing: .08em;
      text-transform: uppercase;
      margin-bottom: 0.45mm;
    }
    .unit-upgrade-row { display: flex; flex-wrap: wrap; gap: 0.6mm; align-items: center; min-height: 5mm; }
    .unit-upgrade-pill { display: inline-block; padding: 0.7mm 1.5mm; background: rgba(70, 212, 138, .14); border: 0.8px solid #46d48a; border-radius: 999px; color: #9df5c8; font-size: 7.1pt; font-weight: 700; line-height: 1; }

    .unit-back-columns { display: grid; grid-template-columns: 1fr; gap: 1mm; min-height: 0; }
    .unit-back-columns.two-column { grid-template-columns: 1fr 1fr; }
    .unit-col { min-height: 0; }
    .unit-ability { border: 0.9px solid #233650; border-radius: 1.3mm; padding: 0.8mm 1mm; background: rgba(31, 59, 88, .4); margin-bottom: 0.65mm; font-size: 7pt; }
    .unit-ability.is-active { border-color: rgba(70, 212, 138, .68); background: rgba(70, 212, 138, .1); }
    .unit-ability-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: .8mm;
      margin-bottom: .45mm;
      min-width: 0;
      flex-wrap: nowrap;
    }
    .unit-ability-title {
      font-weight: 700;
      color: #d4deed;
      font-size: 8pt;
      line-height: 1.05;
      margin-bottom: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }
    .unit-ability.is-active .unit-ability-title { color: #46d48a; }
    .unit-ability-text { color: #d4deed; line-height: 1.17; font-size: 6.6pt; }
    .unit-ability-chip-row { display: flex; flex-wrap: nowrap; gap: 0.45mm; margin-bottom: 0; flex-shrink: 0; }
    .unit-ability-chip { display: inline-flex; align-items: center; padding: 0.5mm 1.1mm; border-radius: 999px; border: 0.8px solid rgba(49, 69, 99, .65); background: rgba(19, 31, 50, .75); color: #93a8c4; font-size: 6.1pt; font-family: Orbitron, sans-serif; letter-spacing: .05em; text-transform: uppercase; }
    .unit-ability-chip.active { border-color: rgba(70, 212, 138, .55); color: #46d48a; }
    .unit-ability-chip.passive { border-color: rgba(147, 168, 196, .55); color: #93a8c4; }
    .unit-ability-chip.phase-any { color: #93a8c4; border-color: rgba(147, 168, 196, .48); }
    .unit-ability-chip.phase-movement { color: #66b6ff; border-color: rgba(102, 182, 255, .58); }
    .unit-ability-chip.phase-assault { color: #ff626b; border-color: rgba(255, 98, 107, .58); }
    .unit-ability-chip.phase-combat { color: #f1bf59; border-color: rgba(241, 191, 89, .58); }
    .unit-ability-chip.phase-scoring { color: #46d48a; border-color: rgba(70, 212, 138, .58); }
    .unit-ability-chip.phase-cleanup { color: #d4deed; border-color: rgba(212, 222, 237, .55); }
    .unit-ability-chip.resource {
      border-color: rgba(241, 191, 89, .58);
      color: #f1bf59;
      background: rgba(241, 191, 89, .12);
      text-transform: none;
      letter-spacing: .02em;
    }

    /* Global pill centering baseline */
    .unit-upgrade-pill,
    .unit-ability-chip,
    .tac-chip,
    .tac-ability-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      line-height: 1;
      vertical-align: middle;
    }

    /* TACTICALS: MTG Portrait */
    .tacticals-section { page-break-before: always; }
    .tac-pair {
      display: inline-flex;
      gap: 3.2mm;
      margin: 0 3.2mm 4mm 0;
      break-inside: avoid;
      page-break-inside: avoid;
      vertical-align: top;
    }
    .tac-card {
      width: 63mm;
      height: 88mm;
      border: 2.4px solid;
      border-radius: 3.2mm;
      padding: 2.1mm;
      background:
        radial-gradient(circle at 80% 8%, rgba(102, 182, 255, .14), transparent 38%),
        linear-gradient(150deg, #1b2e47 0%, #132135 56%, #0d1728 100%);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 1mm;
      font-size: 7.3pt;
      line-height: 1.18;
      box-shadow: inset 0 0 0 1px rgba(125, 180, 255, .08);
    }
    .tac-card.faction-terran { border-color: #7db4ff; }
    .tac-card.faction-zerg { border-color: #f76db2; }
    .tac-card.faction-protoss { border-color: #f1bf59; }
    .tac-title { font-size: 11pt; font-weight: 700; color: #d4deed; line-height: 1.12; text-align: center; }
    .tac-card.faction-terran .tac-title { color: #7db4ff; }
    .tac-card.faction-zerg .tac-title { color: #f76db2; }
    .tac-card.faction-protoss .tac-title { color: #f1bf59; }
    .tac-title-sep {
      height: 0;
      border-top: 0.9px solid rgba(49, 69, 99, .48);
      margin: 0.35mm 0 0.65mm;
      width: 100%;
      flex-shrink: 0;
    }
    .tac-meta-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      table-layout: fixed;
      border: 1px solid #314563;
      border-radius: 1.2mm;
      overflow: hidden;
      margin-bottom: 0.6mm;
    }
    .tac-meta-table th,
    .tac-meta-table td {
      text-align: center;
      border-right: 1px solid #314563;
      white-space: nowrap;
    }
    .tac-meta-table th:last-child,
    .tac-meta-table td:last-child { border-right: none; }
    .tac-meta-table th {
      font-size: 6.2pt;
      text-transform: uppercase;
      letter-spacing: .08em;
      font-family: Orbitron, sans-serif;
      color: #93a8c4;
      background: rgba(20, 34, 54, .92);
      padding: 0.6mm 0.3mm;
      border-bottom: 1px solid #314563;
    }
    .tac-meta-table td {
      padding: 0.85mm 0.35mm;
      background: rgba(11, 23, 39, .9);
      color: #d4deed;
      font-family: Orbitron, sans-serif;
      font-size: 8.4pt;
      font-weight: 700;
      line-height: 1;
    }
    .tac-meta-slot-letters {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.12em;
    }
    .tac-meta-value-resource { font-weight: 700; }
    .tac-card.faction-terran .tac-meta-value-resource { color: #7db4ff; }
    .tac-card.faction-zerg .tac-meta-value-resource { color: #f76db2; }
    .tac-card.faction-protoss .tac-meta-value-resource { color: #f1bf59; }
    .tac-meta-value-gas { color: #f1bf59; }
    .tac-slot-letter {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 0;
      font-weight: 700;
    }
    .tac-slot-letter.slot-hero { color: #f1bf59; }
    .tac-slot-letter.slot-core { color: #45f2ff; }
    .tac-slot-letter.slot-elite { color: #ff626b; }
    .tac-slot-letter.slot-support { color: #46d48a; }
    .tac-slot-letter.slot-air { color: #66b6ff; }
    .tac-slot-letter.slot-other { color: #93a8c4; }
    .tac-ability-list { flex: 1; min-height: 0; }
    .tac-ability { border: 0.9px solid #233650; border-radius: 1.2mm; padding: 0.9mm 1.1mm; background: rgba(31, 59, 88, .4); margin-bottom: 0.7mm; font-size: 7.1pt; }
    .tac-ability-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.7mm;
      margin-bottom: 0.35mm;
    }
    .tac-ability-title { font-weight: 700; color: #d4deed; font-size: 7.9pt; margin-bottom: 0; min-width: 0; }
    .tac-ability-pills {
      display: inline-flex;
      align-items: center;
      gap: 0.45mm;
      flex-shrink: 1;
      white-space: nowrap;
      overflow: hidden;
    }
    .tac-ability-pill {
      display: inline-flex;
      align-items: center;
      padding: 0.75mm 1.5mm;
      border-radius: 999px;
      border: 0.8px solid rgba(49, 69, 99, .65);
      background: rgba(19, 31, 50, .75);
      color: #93a8c4;
      font-size: 8.85pt;
      font-family: Orbitron, sans-serif;
      letter-spacing: .05em;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .tac-ability-pill.resource {
      border-color: rgba(241, 191, 89, .58);
      color: #f1bf59;
      background: rgba(241, 191, 89, .12);
      text-transform: none;
      letter-spacing: .02em;
    }
    .tac-ability-text { color: #d4deed; line-height: 1.2; }
    .tac-card-back {
      align-items: center;
      justify-content: center;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .tac-back-title {
      width: 100%;
      text-align: center;
      margin-top: 0.2mm;
    }
    .tac-card-back::before {
      content: '';
      position: absolute;
      inset: -15%;
      background: radial-gradient(circle at center, rgba(102, 182, 255, .18), transparent 62%);
      pointer-events: none;
    }
    .tac-back-resource {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2mm;
      width: 100%;
      height: 100%;
    }
    .tac-back-icon {
      font-size: 36mm;
      line-height: .9;
      font-family: Orbitron, sans-serif;
      text-shadow: 0 0 22px rgba(102, 182, 255, .45);
    }
    .tac-back-value {
      font-size: 18pt;
      font-weight: 700;
      font-family: Orbitron, sans-serif;
      letter-spacing: .06em;
      color: #d4deed;
      background: rgba(10, 18, 31, .7);
      border: 1px solid rgba(125, 180, 255, .4);
      border-radius: 999px;
      padding: 1mm 3.2mm;
    }
    .tac-back-label {
      font-size: 7pt;
      letter-spacing: .12em;
      text-transform: uppercase;
      color: #93a8c4;
      font-family: Orbitron, sans-serif;
    }
    .tac-card-back.faction-terran .tac-back-icon,
    .tac-card-back.faction-terran .tac-back-value,
    .tac-card-back.faction-terran .tac-back-label {
      color: #7db4ff;
    }
    .tac-card-back.faction-zerg .tac-back-icon,
    .tac-card-back.faction-zerg .tac-back-value,
    .tac-card-back.faction-zerg .tac-back-label {
      color: #f76db2;
    }
    .tac-card-back.faction-protoss .tac-back-icon,
    .tac-card-back.faction-protoss .tac-back-value,
    .tac-card-back.faction-protoss .tac-back-label {
      color: #f1bf59;
    }
    .tac-card-back.faction-terran .tac-back-value { border-color: rgba(125, 180, 255, .45); background: rgba(125, 180, 255, .14); }
    .tac-card-back.faction-zerg .tac-back-value { border-color: rgba(247, 109, 178, .45); background: rgba(247, 109, 178, .14); }
    .tac-card-back.faction-protoss .tac-back-value { border-color: rgba(241, 191, 89, .45); background: rgba(241, 191, 89, .14); }

    /* INK-FRIENDLY MODE */
    body.ink-friendly { background: #ffffff; }
    body.ink-friendly .roster-faction { color: #0d38a0; }
    body.ink-friendly .roster-faction.Terran { color: #0d38a0; }
    body.ink-friendly .roster-faction.Zerg { color: #8b1845; }
    body.ink-friendly .roster-faction.Protoss { color: #704600; }
    body.ink-friendly .aid-unit-header { background: #f5f7fa; }
    body.ink-friendly .unit-name { color: #111; }
    body.ink-friendly .aid-body { background: #ffffff; }
    body.ink-friendly .aid-section-title { color: #1a1a1a; }
    body.ink-friendly .weapon-name { color: #111; }
    body.ink-friendly .aid-weapons-table th { background: #f0f2f6; color: #1a1a1a; }
    body.ink-friendly .aid-weapons-table tr:nth-child(even) { background: #fafbfc; }
    body.ink-friendly .aid-weapons-table tr:nth-child(odd) { background: #ffffff; }
    body.ink-friendly .aid-weapons-table tbody tr td { border-color: #e8eef5; color: #1a1a1a; }
    body.ink-friendly .aid-upg { background: #fafbfc; border-color: #d0d8e0; }
    body.ink-friendly .aid-upg-desc { color: #222; }
    body.ink-friendly .aid-upg.is-active { background: #e8f5e9; border-color: #8db899; }
    body.ink-friendly .aid-upg.is-active .aid-upg-name { color: #0d5a1a; }
    body.ink-friendly .upg-pill { background: #e8f5e9; border-color: #8db899; color: #0d5a1a; }
    body.ink-friendly .stat-chip { background: #e8ecf3; border-color: #b8c0cc; color: #1a1a1a; }
    body.ink-friendly .stat-chip strong { color: #0d38a0; }
    body.ink-friendly .stat-chip.stat-chip-supply { background: #f5ecf1; border-color: #d49db8; color: #8b1845; }
    body.ink-friendly .stat-chip.stat-chip-supply strong { color: #8b1845; }
    body.ink-friendly .aid-inline-chip { background: #e8ecf3; border-color: #b8c0cc; color: #1a1a1a; }
    body.ink-friendly .aid-inline-activation { background: #f2edff; border-color: #cfc0db; color: #6a4aa8; }
    body.ink-friendly .aid-inline-resource { background: #e8ecf3; border-color: #7a9fcc; color: #0d38a0; }
    body.ink-friendly .aid-tact-card { background: #fafbfc; border-color: #d0d8e0; }
    body.ink-friendly .aid-tact-card-name { color: #111; }
    body.ink-friendly .aid-tact-card-count { color: #333; }
    body.ink-friendly .aid-tact-meta-chip { background: #e8ecf3; border-color: #b8c0cc; color: #1a1a1a; }
    body.ink-friendly .aid-tact-ability { background: #ffffff; border-color: #d0d8e0; }
    body.ink-friendly .aid-tact-ability-name { color: #111; }
    body.ink-friendly .aid-tact-phase-chip { background: #e8ecf3; border-color: #b8c0cc; color: #1a1a1a; }
    body.ink-friendly .aid-tact-phase-chip.phase-movement { background: #e8ecf3; border-color: #7a9fcc; color: #0d38a0; }
    body.ink-friendly .aid-tact-phase-chip.phase-assault { background: #f5ecf1; border-color: #d49db8; color: #8b1845; }
    body.ink-friendly .aid-tact-phase-chip.phase-combat { background: #faf6f0; border-color: #c9b084; color: #704600; }
    body.ink-friendly .aid-tact-phase-chip.phase-scoring { background: #ecf4ee; border-color: #8db899; color: #0d5a1a; }
    body.ink-friendly .aid-tact-phase-chip.phase-cleanup { background: #f2edff; border-color: #cfc0db; color: #6a4aa8; }
    body.ink-friendly .badge-Core { color: #0052a3; }
    body.ink-friendly .badge-Air { color: #0052a3; }
    body.ink-friendly .aid-section-title { color: #333; }
    body.ink-friendly .aid-weapons-table th { color: #333; }
    body.ink-friendly .unit-upgrade-header { color: #333; }
    body.ink-friendly .tac-slot-letter.slot-core { color: #0052a3; }
    body.ink-friendly .tac-slot-letter.slot-air { color: #0052a3; }

    @page { margin: 10mm; }
    @media print { body { padding: 0; } .deck-header { margin-bottom: 4mm; } }
  </style>
</head>
<body class="${inkFriendlyClass}">
  <div class="deck-header">
    <div class="deck-title">Player Aid Card Deck · ${escapeHtml(roster.faction)} · ${escapeHtml(roster.factionCard)}</div>
    <div class="deck-subtitle">Seed ${escapeHtml(seed)} · Two-sided Tarot (units) + MTG (tacticals)</div>
  </div>

  <section class="units-section">
    <h2 class="deck-section-title">Unit Cards (Tarot Landscape, Double-Sided)</h2>
    ${unitsContent}
  </section>

  <section class="tacticals-section">
    <h2 class="deck-section-title">Tactical Cards (MTG Portrait)</h2>
    <div>${tacticalContent}</div>
  </section>

  <script>
    window.addEventListener('load', () => {
      window.print();
    });
  <\/script>
</body>
</html>`);
  win.document.close();
}

// UNIT CARDS: Tarot Landscape Pipeline
function renderNewAidDeckUnitFront(unit, { faction, factionClass } = {}) {
  const typeAbbr = TYPE_ABBR[unit.type] ?? '?';
  const models = Number(unit.models ?? 1) > 1 ? ` ×${unit.models}` : '';
  const upgrades = sortUpgradesForDisplay(unit.allUpgrades ?? []);
  const weaponProfiles = resolveLinkedWeaponReplacements(
    upgrades.filter(isWeaponProfile).filter(ug => isNaturalAbility(ug) || ug.active).map(parseWeaponProfile),
    unit.models
  ).sort(compareAidWeaponProfiles);
  const visibleUpgrades = upgrades.filter(ug => !isWeaponProfile(ug)).filter(ug => isNaturalAbility(ug) || ug.active);
  const formatWeaponTraitsForDisplay = (traitsText) => {
    const tokens = splitTraitTokens(traitsText);
    if (!tokens.length) return '-';
    return tokens.join(', ');
  };

  // Merged mode analysis
  const mergedBuffEntries = [];
  const weaponBuffMap = new Map();
  const unitStatDeltas = {};
  for (const ability of visibleUpgrades) {
    const detected = detectUnconditionalPassiveBuff(ability, weaponProfiles);
    if ((detected?.highlights?.length ?? 0) > 0 || (detected?.weaponApplications?.length ?? 0) > 0 || (detected?.unitStatApplications?.length ?? 0) > 0) {
      const weaponEffects = (detected.weaponApplications ?? []).map(e => String(e.effect || '').trim());
      const weaponEffectSet = new Set(weaponEffects.map(e => e.toLowerCase()));
      const nonWeaponHighlights = (detected.highlights ?? []).filter(h => !weaponEffectSet.has(String(h || '').trim().toLowerCase()));
      if (nonWeaponHighlights.length) {
        mergedBuffEntries.push({ name: ability.name, highlights: nonWeaponHighlights });
      }
      for (const entry of detected.weaponApplications ?? []) {
        const key = String(entry.weaponName || '').toLowerCase();
        if (!key) continue;
        if (!weaponBuffMap.has(key)) weaponBuffMap.set(key, { statDeltas: {}, fieldReplacements: {}, traits: [] });
        const target = weaponBuffMap.get(key);
        if (entry.parsed?.kind === 'stat-delta' && entry.parsed.field) {
          target.statDeltas[entry.parsed.field] = Number(target.statDeltas[entry.parsed.field] ?? 0) + Number(entry.parsed.delta ?? 0);
        } else if (entry.parsed?.kind === 'field-replacement' && entry.parsed.field) {
          target.fieldReplacements[entry.parsed.field] = entry.parsed.value;
        } else if (entry.parsed?.kind === 'trait' && entry.parsed.trait) {
          target.traits.push(entry.parsed.trait);
        }
      }
      for (const entry of detected.unitStatApplications ?? []) {
        const field = String(entry?.field || '').trim();
        if (field) unitStatDeltas[field] = Number(unitStatDeltas[field] ?? 0) + Number(entry?.delta ?? 0);
      }
    }
  }

  // Apply merged stat deltas to displayed stats and highlight changed fields.
  const buffedUnitStats = {
    hp: unit?.stats?.hp,
    armor: unit?.stats?.armor,
    evade: unit?.stats?.evade,
    speed: unit?.stats?.speed,
    shield: unit?.stats?.shield,
  };
  const unitStatHighlights = {};
  for (const [field, deltaRaw] of Object.entries(unitStatDeltas)) {
    if (field === 'supply') continue;
    const delta = Number(deltaRaw ?? 0);
    if (!delta) continue;
    const applied = applyNumericDelta(buffedUnitStats[field], delta);
    buffedUnitStats[field] = applied.value;
    unitStatHighlights[field] = applied.changed;
  }

  // Stats table
  const statsParts = [];
  const statsMap = {
    hp: buffedUnitStats.hp,
    armor: buffedUnitStats.armor,
    evade: buffedUnitStats.evade,
    speed: buffedUnitStats.speed,
    shield: buffedUnitStats.shield,
  };
  for (const [field, value] of Object.entries(statsMap)) {
    if (hasStatValue(value)) {
      statsParts.push({
        field: field.toUpperCase(),
        value: String(value),
        highlighted: !!unitStatHighlights[field],
      });
    }
  }
  const statsHtml = statsParts.length
    ? `<div class="unit-stats"><table class="unit-stat-table"><thead><tr>${statsParts.map(s => `<th>${escapeHtml(s.field)}</th>`).join('')}</tr></thead><tbody><tr>${statsParts.map(s => `<td class="${s.highlighted ? 'highlighted' : ''}">${escapeHtml(s.value)}</td>`).join('')}</tr></tbody></table></div>`
    : '';

  // Apply merged weapon deltas/replacements/traits to displayed profiles.
  const buffedWeaponProfiles = weaponProfiles.map(weapon => {
    const key = String(weapon.name || '').toLowerCase();
    const applied = weaponBuffMap.get(key);
    if (!applied) return weapon;

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

    const damageApplied = applyField('damage', nextDamage);
    nextDamage = damageApplied.value;
    fieldHighlights.damage = damageApplied.changed;

    if (typeof applied.fieldReplacements?.surge === 'string' && applied.fieldReplacements.surge.trim()) {
      const normalizedSurge = applied.fieldReplacements.surge.trim();
      fieldHighlights.surge = normalizedSurge !== String(weapon.surge ?? '').trim();
      nextSurge = normalizedSurge;
    } else {
      fieldHighlights.surge = false;
    }

    const baseTraits = splitTraitTokens(weapon.traits);
    const addedTraits = [...new Set((applied.traits ?? []).map(t => String(t).trim()).filter(Boolean))];
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

  const needsCompactWeapons =
    buffedWeaponProfiles.length >= 3 ||
    buffedWeaponProfiles.some(w => formatWeaponTraitsForDisplay(w?.traits).length > 44);

  const computeWeaponTableColgroup = (rows) => {
    const maxLen = (selector) => rows.reduce((m, row) => Math.max(m, String(selector(row) ?? '').trim().length), 0);
    const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

    const namePct = clamp(16 + (maxLen(r => r.name) * 0.45), 18, 28);
    const rPct = clamp(4.4 + (maxLen(r => r.range) * 0.42), 4.6, 8.2);
    const roaPct = clamp(4.8 + (maxLen(r => r.roa) * 0.48), 5.0, 9.0);
    const hPct = clamp(4.0 + (maxLen(r => r.hit) * 0.42), 4.2, 7.2);
    const dPct = clamp(4.0 + (maxLen(r => r.damage) * 0.42), 4.2, 7.2);
    const sPct = clamp(6.2 + (maxLen(r => r.surge) * 0.36), 7.0, 14.5);

    const fixed = [namePct, rPct, roaPct, hPct, dPct, sPct];
    const fixedTotal = fixed.reduce((sum, n) => sum + n, 0);
    const maxFixedTotal = 72;

    let adjustedFixed = fixed;
    if (fixedTotal > maxFixedTotal) {
      const scale = maxFixedTotal / fixedTotal;
      adjustedFixed = fixed.map(n => n * scale);
    }

    const traitsPct = clamp(100 - adjustedFixed.reduce((sum, n) => sum + n, 0), 28, 54);
    const finalName = adjustedFixed[0];
    const finalR = adjustedFixed[1];
    const finalRoa = adjustedFixed[2];
    const finalH = adjustedFixed[3];
    const finalD = adjustedFixed[4];
    const finalS = adjustedFixed[5];

    return `<colgroup><col style="width:${finalName.toFixed(2)}%"><col style="width:${finalR.toFixed(2)}%"><col style="width:${finalRoa.toFixed(2)}%"><col style="width:${finalH.toFixed(2)}%"><col style="width:${finalD.toFixed(2)}%"><col style="width:${finalS.toFixed(2)}%"><col style="width:${traitsPct.toFixed(2)}%"></colgroup>`;
  };

  // Weapons
  let weaponsHtml = '';
  if (buffedWeaponProfiles.length) {
      const rows = buffedWeaponProfiles.map(w => {
      const hl = w.fieldHighlights ?? {};
      const traitsChanged = (w.traitHighlights?.length ?? 0) > 0;
      const displayTraits = formatWeaponTraitsForDisplay(w.traits);
      return `<tr class="${!isNaturalAbility(w) && w.active ? 'is-active' : ''}"><td class="weapon-name${w.nameHighlighted ? ' is-highlighted' : ''}">${escapeHtml(w.name)}</td><td class="${hl.range ? 'is-highlighted' : ''}">${escapeHtml(String(w.range))}</td><td class="${hl.roa ? 'is-highlighted' : ''}">${escapeHtml(String(w.roa))}</td><td class="${hl.hit ? 'is-highlighted' : ''}">${escapeHtml(String(w.hit))}</td><td class="${hl.damage ? 'is-highlighted' : ''}">${escapeHtml(String(w.damage))}</td><td class="${hl.surge ? 'is-highlighted' : ''}">${escapeHtml(String(w.surge))}</td><td class="weapon-traits-cell${traitsChanged ? ' is-highlighted' : ''}"><span class="weapon-traits-text">${formatAidRichText(displayTraits, { faction, factionClass, allowLineBreaks: false, highlightTerms: w.traitHighlights ?? [] })}</span></td></tr>`;
    });
    const colgroupHtml = computeWeaponTableColgroup(buffedWeaponProfiles);
    weaponsHtml = `<div class="unit-section"><div class="unit-section-title">Weapons</div><table class="unit-weapons-table${needsCompactWeapons ? ' compact' : ''}">${colgroupHtml}<thead><tr><th>Name</th><th>R</th><th>RoA</th><th>H</th><th>D</th><th>S</th><th>Traits</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
  }

  // Purchased upgrades as pills
  let upgradesHtml = '';
  const purchased = [...new Set(visibleUpgrades
    .filter(ug => !isNaturalAbility(ug) && ug.active)
    .map(ug => String(ug?.name || '').trim())
    .filter(Boolean))];
  if (purchased.length) {
    const pills = purchased.map(name => `<span class="unit-upgrade-pill">+${escapeHtml(name)}</span>`).join('');
    upgradesHtml = `<div class="unit-upgrade-section"><div class="unit-upgrade-header">Purchased Upgrades</div><div class="unit-upgrade-row">${pills}</div></div>`;
  } else if (mergedBuffEntries.length) {
    const pills = mergedBuffEntries.map(e => `<span class="unit-upgrade-pill">+${escapeHtml(e.name)}</span>`).join('');
    upgradesHtml = `<div class="unit-upgrade-section"><div class="unit-upgrade-header">Purchased Upgrades</div><div class="unit-upgrade-row">${pills}</div></div>`;
  }

  return `<div class="unit-card unit-card-front ${factionClass}">
    <div class="unit-main">
      <div class="unit-header">
        <span class="unit-badge badge-${escapeHtml(unit.type)}">${typeAbbr}</span>
        <div class="unit-name-wrap"><div class="unit-title">${escapeHtml(unit.name)}${models ? ` ${escapeHtml(models.trim())}` : ''}</div></div>
        <div class="unit-cost-wrap">
          <div class="unit-cost">${unit.totalCost}m</div>
          <div class="unit-supply-cost">◆ ${escapeHtml(String(unit?.supply ?? 0))}</div>
        </div>
      </div>
      ${statsHtml}
    </div>
    <div class="unit-front-bottom${needsCompactWeapons ? ' compact-weapons' : ''}">${weaponsHtml}${upgradesHtml}</div>
  </div>`;
}

function renderNewAidDeckUnitBack(unit, { faction, factionClass } = {}) {
  const upgrades = sortUpgradesForDisplay(unit.allUpgrades ?? []);
  const weaponProfiles = resolveLinkedWeaponReplacements(
    upgrades.filter(isWeaponProfile).filter(ug => isNaturalAbility(ug) || ug.active).map(parseWeaponProfile),
    unit.models
  ).sort(compareAidWeaponProfiles);
  const visibleAbilities = upgrades
    .filter(ug => !isWeaponProfile(ug))
    .filter(ug => isNaturalAbility(ug) || ug.active)
    // Print deck always runs merged mode, so hide passives that are merged into stats/weapons.
    .filter(ability => {
      const detected = detectUnconditionalPassiveBuff(ability, weaponProfiles);
      const hasDetectedHighlights = (detected?.highlights?.length ?? 0) > 0;
      const hasWeaponApplications = (detected?.weaponApplications?.length ?? 0) > 0;
      const hasUnitStatApplications = (detected?.unitStatApplications?.length ?? 0) > 0;
      return !(hasDetectedHighlights || hasWeaponApplications || hasUnitStatApplications);
    });
  const groupedByPhase = groupAbilitiesByPhase(visibleAbilities);

  const abilitiesWithWeight = [];
  for (const group of groupedByPhase) {
    const phaseMeta = getAbilityPhaseMeta(group.phase);
    for (const ability of group.abilities) {
      const natural = isNaturalAbility(ability);
      const active = !natural && ability.active;
      const cls = active ? 'is-active' : 'is-natural';
      const desc = String(ability.description || '').trim();
      const activationMeta = parseAidActivation(ability);
      const resourceCost = extractAidFactionResourceCost(
        activationMeta.resource || activationMeta.state || ability?.activation,
        faction,
        factionClass
      );
      const chips = [
        `<span class="unit-ability-chip phase-${escapeHtml(phaseMeta.className)}">${escapeHtml(phaseMeta.label)}</span>`,
        `<span class="unit-ability-chip ${active ? 'active' : 'passive'}">${active ? 'Active' : 'Passive'}</span>`,
        resourceCost ? `<span class="unit-ability-chip resource">${resourceCost.amount} ${escapeHtml(resourceCost.icon)}</span>` : ''
      ].join('');
      const abilityHtml = `<div class="unit-ability ${cls}"><div class="unit-ability-header"><div class="unit-ability-title">${escapeHtml(ability.name)}</div><div class="unit-ability-chip-row">${chips}</div></div><div class="unit-ability-text">${formatAidRichText(desc, { faction, factionClass, allowLineBreaks: false })}</div></div>`;
      const weight = desc.length + String(ability?.name || '').length * 2 + 60;
      abilitiesWithWeight.push({ html: abilityHtml, weight });
    }
  }

  // Start with single-column for readability; switch to two-column only if content likely overflows.
  const totalWeight = abilitiesWithWeight.reduce((sum, item) => sum + item.weight, 0);
  const useTwoColumns = totalWeight > 1500 || abilitiesWithWeight.length > 4;

  let col1 = '';
  let col2 = '';
  if (useTwoColumns) {
    const colA = [];
    const colB = [];
    let weightA = 0;
    let weightB = 0;
    for (const item of abilitiesWithWeight) {
      if (weightA <= weightB) {
        colA.push(item.html);
        weightA += item.weight;
      } else {
        colB.push(item.html);
        weightB += item.weight;
      }
    }
    col1 = colA.join('');
    col2 = colB.join('');
  } else {
    col1 = abilitiesWithWeight.map(item => item.html).join('');
  }

  return `<div class="unit-card unit-card-back ${factionClass}">
    <div class="unit-back-columns${useTwoColumns ? ' two-column' : ''}">
      <div class="unit-col">${col1}</div>
      ${useTwoColumns ? `<div class="unit-col">${col2}</div>` : ''}
    </div>
  </div>`;
}

// TACTICAL CARDS: MTG Portrait Pipeline
function renderNewAidDeckTacticalCardFront(card, { faction, factionClass } = {}) {
  const resourceConfig = getFactionResourceLabelConfig(faction, factionClass);
  const slotLetters = formatTacticalSupplyTypes(card.slots ?? {});
  const abilities = Array.isArray(card.abilities) ? card.abilities.map(parseAidTacticalAbility) : [];
  const metaCells = [];
  if (slotLetters.length) {
    const slotLettersHtml = slotLetters
      .map(({ type, letter }) => `<span class="tac-slot-letter slot-${escapeHtml(String(type).toLowerCase())}">${escapeHtml(letter)}</span>`)
      .join('');
    metaCells.push({
      label: 'Slots',
      value: `<span class="tac-meta-slot-letters">${slotLettersHtml}</span>`,
      valueClass: '',
    });
  }
  if (typeof card.resource === 'number') {
    metaCells.push({
      label: resourceConfig.short,
      value: `${escapeHtml(String(card.resource))} ${escapeHtml(resourceConfig.icon)}`,
      valueClass: 'tac-meta-value-resource',
    });
  }
  if (typeof card.gasCost === 'number') {
    metaCells.push({
      label: 'Gas',
      value: `${escapeHtml(String(card.gasCost))}g`,
      valueClass: 'tac-meta-value-gas',
    });
  }
  if (card.count > 1) {
    metaCells.push({
      label: 'Count',
      value: `x${escapeHtml(String(card.count))}`,
      valueClass: '',
    });
  }
  const metaHtml = metaCells.length
    ? `<table class="tac-meta-table"><thead><tr>${metaCells.map(cell => `<th>${escapeHtml(cell.label)}</th>`).join('')}</tr></thead><tbody><tr>${metaCells.map(cell => `<td${cell.valueClass ? ` class="${cell.valueClass}"` : ''}>${cell.value}</td>`).join('')}</tr></tbody></table>`
    : '';
  const abilityHtml = abilities.map(a => {
    const desc = String(a.description || '').trim();
    const abilityResourceCost = extractAidFactionResourceCost(a.activation, faction, factionClass);
    const pills = [
      abilityResourceCost ? `<span class="tac-ability-pill resource">${abilityResourceCost.amount} ${escapeHtml(abilityResourceCost.icon)}</span>` : ''
    ].join('');
    return `<div class="tac-ability"><div class="tac-ability-top"><div class="tac-ability-title">${escapeHtml(a.name)}</div>${pills ? `<div class="tac-ability-pills">${pills}</div>` : ''}</div><div class="tac-ability-text">${formatAidRichText(desc, { faction, factionClass, allowLineBreaks: false })}</div></div>`;
  }).join('');
  return `<article class="tac-card ${factionClass}">
    <div class="tac-title">${escapeHtml(card.name)}</div>
    <div class="tac-title-sep"></div>
    ${metaHtml}
    <div class="tac-ability-list">${abilityHtml}</div>
  </article>`;
}

function renderNewAidDeckTacticalCardBack(card, { faction, factionClass } = {}) {
  const resourceConfig = getFactionResourceLabelConfig(faction, factionClass);
  const resourceValue = typeof card.resource === 'number' ? card.resource : 0;
  const resourceLabel = resourceValue === 1 ? resourceConfig.label : resourceConfig.labelPlural;
  return `<article class="tac-card tac-card-back ${factionClass}">
    <div class="tac-title tac-back-title">${escapeHtml(card.name)}</div>
    <div class="tac-title-sep"></div>
    <div class="tac-back-resource">
      <div class="tac-back-icon">${escapeHtml(resourceConfig.icon)}</div>
      <div class="tac-back-value">${resourceValue}</div>
      <div class="tac-back-label">${escapeHtml(resourceLabel)}</div>
    </div>
  </article>`;
}

aidPrintBtn.addEventListener('click', () => openAidPrintWindow());
aidPrintCardDeckBtn.addEventListener('click', () => openAidCardDeckPrintWindow());
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

if (playCardEl) {
  playCardEl.addEventListener('click', e => {
    const actionEl = e.target.closest('[data-play-action]');
    if (actionEl && playCardEl.contains(actionEl)) {
      e.preventDefault();
      handlePlayAction(actionEl);
      return;
    }
    const header = e.target.closest('.aid-unit-header');
    if (!header || !playCardEl.contains(header)) return;
    toggleAidUnitCollapsed(header.closest('.aid-unit'));
  });
  playCardEl.addEventListener('keydown', e => {
    const header = e.target.closest('.aid-unit-header');
    if (!header || !playCardEl.contains(header)) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    toggleAidUnitCollapsed(header.closest('.aid-unit'));
  });
}

if (playDashboardEl) {
  playDashboardEl.addEventListener('click', e => {
    const actionEl = e.target.closest('[data-play-action]');
    if (!actionEl || !playDashboardEl.contains(actionEl)) return;
    e.preventDefault();
    handlePlayAction(actionEl);
  });
}

if (seedHistorySectionEl) {
  seedHistorySectionEl.addEventListener('click', e => {
    const actionEl = e.target.closest('[data-play-action]');
    if (!actionEl || !seedHistorySectionEl.contains(actionEl)) return;
    e.preventDefault();
    handlePlayAction(actionEl);
  });
}

if (playNewGameBtn) {
  playNewGameBtn.addEventListener('click', () => {
    if (!currentRoster) return;
    openPlayNewGameDialog();
  });
}

if (playCancelBtn) {
  playCancelBtn.addEventListener('click', () => {
    playNewGameDialog?.close();
  });
}

if (playResetGameCancelBtn) {
  playResetGameCancelBtn.addEventListener('click', () => {
    playResetGameDialog?.close();
  });
}

if (playResetGameConfirmBtn) {
  playResetGameConfirmBtn.addEventListener('click', () => {
    playResetGameDialog?.close();
    openPlayNewGameDialog();
  });
}

if (playNewGameForm) {
  playNewGameForm.addEventListener('submit', async e => {
    e.preventDefault();
    const playerSeed = sanitizeSeed(playPlayerSeedInput?.value || currentRoster?.seed || '');
    const opponentSeed = sanitizeSeed(playOpponentSeedInput?.value || '');
    if (!playerSeed) {
      playNewGameDialog?.close();
      return;
    }
    try {
      const playerRoster = await loadRosterForPlay(playerSeed);
      const opponentRoster = opponentSeed ? await loadRosterForPlay(opponentSeed) : null;
      playModeState = createPlayModeState(playerRoster, opponentRoster, {
        playerSeed,
        opponentSeed,
        playerName: playPlayerNameInput?.value,
        opponentName: playOpponentNameInput?.value,
        opponentFaction: playOpponentFactionInput?.value,
        missionName: playMissionNameInput?.value,
        gameLength: playGameLengthInput?.value,
        startingSupply: playStartingSupplyInput?.value,
        supplyPerRound: playSupplyPerRoundInput?.value,
        gameSize: playGameSizeInput?.value,
        hasStarted: true,
      });
      applyDefaultPlayCollapsedUnits(playModeState);
      persistCurrentPlayState();
      playNewGameDialog?.close();
      refreshPlayModeOutput();
    } catch (err) {
      showToast(getUserFacingError('Start play game', err), 'error');
    }
  });
}

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
loadPlayLibrary();
renderSeedHistory();
try {
  const seedParam = new URLSearchParams(window.location.search).get('s');
  const hasUrlSeed = /^[A-Z0-9]{4,8}$/i.test(String(seedParam || '').trim());
  // On direct seed links, start with history closed; otherwise open by default.
  recentCollapsed = hasUrlSeed;
} catch (_) {
  recentCollapsed = false;
}
applyRecentCollapsed(false);
renderPlayHistoryLists();

// ── URL param auto-load ───────────────────────────────────────────────────────
// Supports: /?s=SEED  /?s=SEED&tab=card|aid|play|preview
// The server redirects /SEED → /?s=SEED so clean URLs work too.
// When _img=1 is present (headless render), card checkboxes are overridden from
// URL params before rendering: upgrades, stats, size, cost, tactical,
// tact-resource, tact-gas, tact-supply, slots  (1=on, 0=off)
(function applyUrlParams() {
  const SEED_RE = /^[A-Z0-9]{4,8}$/;
  const params  = new URLSearchParams(window.location.search);
  const urlSeed = params.get('s');
  const urlTab  = params.get('tab');
  const isImg   = params.get('_img') === '1';

  // Override card checkboxes when rendering for image export
  if (isImg) {
    const flag = (key, def) => {
      const v = params.get(key);
      return v === null ? def : v !== '0';
    };
    cardUpgrades.checked     = flag('upgrades',     true);
    cardStats.checked        = flag('stats',         false);
    cardSize.checked         = flag('size',          true);
    cardCost.checked         = flag('cost',          true);
    cardTactical.checked     = flag('tactical',      true);
    cardTactResource.checked = flag('tact-resource', false);
    cardTactGas.checked      = flag('tact-gas',      false);
    cardTactSupply.checked   = flag('tact-supply',   false);
    cardSlots.checked        = flag('slots',         false);
    // Hide everything except the roster card so the screenshot is clean
    document.body.classList.add('img-render-mode');
  }

  if (urlTab) {
    const tabEl = document.querySelector(`.tab[data-tab="${urlTab}"]`);
    if (tabEl) activateTab(tabEl);
  }

  if (urlSeed) {
    const seed = urlSeed.trim().toUpperCase();
    if (SEED_RE.test(seed)) {
      seedInput.value = seed;
      loadRoster().then(() => {
        if (isImg) {
          // Signal to puppeteer that the card is ready
          document.documentElement.dataset.imgReady = '1';
        }
      }).catch(() => {
        if (isImg) document.documentElement.dataset.imgReady = 'error';
      });
    }
  }
})();

// If there is no URL seed override, restore the most recent active play session.
try {
  const hasSeedInUrl = new URLSearchParams(window.location.search).has('s');
  if (!hasSeedInUrl) restoreActivePlayGame();
} catch (_) { /* ignore URL parsing failures */ }
