/**
 * Play mode state machine — pure logic, no DOM, no global state.
 * All functions that need current state accept it as a parameter.
 *
 * Also exports renderPlayHealthReadout (HTML string, no DOM mutation).
 */
import { escapeHtml, sanitizeSeed, cloneDeep } from './utils.js';
import { PLAY_PHASES } from './constants.js';

// ─── Linked consensus helpers ─────────────────────────────────────────────────
export function createEmptyLinkedConsensus() {
  return { pass: null, endGame: null, firstPlayerChoice: null, startGame: null };
}

// ─── Game ID ──────────────────────────────────────────────────────────────────
export function createPlayGameId() {
  return `play_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Unit tracker creation ────────────────────────────────────────────────────
export function createPlayUnitsByKey(roster, side) {
  const unitsByKey = {};
  (roster.units ?? []).forEach((u, idx) => {
    const key = `${side}:${String(u?.id || 'unit')}-${idx}`;
    const hpPerModel  = Number.parseInt(String(u?.stats?.hp ?? '0'), 10);
    const shieldValue = Number.parseInt(String(u?.stats?.shield ?? '0'), 10);
    const models      = Number(u?.models ?? 1);
    const maxHealthPools = [];
    if (Number.isFinite(hpPerModel) && hpPerModel > 0) {
      for (let i = 0; i < Math.max(1, models); i++) {
        maxHealthPools.push({ type: 'hp', value: hpPerModel });
      }
    }
    if (Number.isFinite(shieldValue) && shieldValue > 0) {
      maxHealthPools.push({ type: 'shield', value: shieldValue });
    }
    unitsByKey[key] = {
      key, side,
      unitName: String(u?.name ?? ''),
      startingModels: models,
      maxHealthPools,
      currentHealthPools: maxHealthPools.map(pool => ({ ...pool })),
      supply: Number(u?.supply ?? 0) || 0,
      baseSupply: Number(u?.supply ?? 0) || 0,
      squadProfile: Array.isArray(u?.squadProfile) ? cloneDeep(u.squadProfile) : [],
      deployed: false,
      activation: { movement: false, assault: false, combat: false },
    };
  });
  return unitsByKey;
}

// ─── Health helpers ───────────────────────────────────────────────────────────
export function getPlayTrackerCurrentHealth(tracker) {
  return (tracker?.currentHealthPools ?? []).reduce((sum, pool) => sum + Number(pool?.value || 0), 0);
}

export function getPlayTrackerRemainingModels(tracker) {
  const pools = tracker?.currentHealthPools ?? [];
  if (!pools.length) {
    return Math.max(0, Number(tracker?.startingModels ?? 0) || 0);
  }
  return pools.reduce((count, pool) => {
    if (pool?.type === 'shield') return count;
    return count + (Number(pool?.value || 0) > 0 ? 1 : 0);
  }, 0);
}

export function getPlayTrackerSupplyTier(tracker) {
  const remainingModels = getPlayTrackerRemainingModels(tracker);
  const profile = Array.isArray(tracker?.squadProfile) ? tracker.squadProfile : [];
  const activeTier = profile.find((tier) => {
    const min = Number(tier?.minModels);
    const max = Number(tier?.maxModels);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return false;
    return remainingModels >= min && remainingModels <= max;
  }) ?? null;
  return {
    remainingModels,
    activeTier,
    currentSupply: remainingModels <= 0
      ? 0
      : activeTier
        ? Number(activeTier.supply ?? 0)
        : Number(tracker?.baseSupply ?? tracker?.supply ?? 0) || 0,
  };
}

export function getPlayTrackerCurrentSupply(tracker) {
  return getPlayTrackerSupplyTier(tracker).currentSupply;
}

export function renderPlayHealthReadout(tracker) {
  const pools    = tracker?.currentHealthPools ?? [];
  const maxPools = tracker?.maxHealthPools ?? [];
  if (!pools.length) return '<span class="play-health-empty">-</span>';
  const hpPoolIndexes = pools
    .map((pool, index) => ({ pool, index }))
    .filter(({ pool }) => pool?.type !== 'shield');
  const shouldCollapseHpPools = hpPoolIndexes.length > 1
    && hpPoolIndexes.every(({ index }) => Number(maxPools[index]?.value || 0) === 1);
  if (shouldCollapseHpPools) {
    const collapsedHpValue = hpPoolIndexes.reduce((sum, { pool }) => sum + Number(pool?.value || 0), 0);
    const hpMaxValue = hpPoolIndexes.length;
    const segments = [];
    const hpCls = [
      'play-health-segment',
      'is-hp',
      collapsedHpValue <= 0 ? 'is-zero' : '',
      collapsedHpValue > 0 && collapsedHpValue >= hpMaxValue ? 'is-full' : '',
    ].filter(Boolean).join(' ');
    segments.push(`<span class="${hpCls}">${escapeHtml(String(collapsedHpValue))}</span>`);
    pools.forEach((pool, index) => {
      if (pool?.type !== 'shield') return;
      const value = Number(pool.value || 0);
      const shieldCls = [
        'play-health-segment',
        'is-shield',
        value <= 0 ? 'is-zero' : '',
      ].filter(Boolean).join(' ');
      segments.push(`<span class="${shieldCls}">${escapeHtml(String(pool.value))}</span>`);
    });
    return segments.join('<span class="play-health-sep">/</span>');
  }
  return pools.map((pool, index) => {
    const value    = Number(pool.value || 0);
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

export function adjustPlayTrackerHealth(tracker, delta) {
  if (!tracker || !delta) return;
  const currentPools = tracker.currentHealthPools ?? [];
  const maxPools     = tracker.maxHealthPools ?? [];
  if (!currentPools.length || !maxPools.length) return;

  if (delta < 0) {
    for (let remaining = Math.abs(delta); remaining > 0; remaining--) {
      const targetIndex = currentPools.map(p => Number(p.value || 0)).reduceRight((found, value, index) => {
        if (found !== -1) return found;
        return value > 0 ? index : -1;
      }, -1);
      if (targetIndex === -1) break;
      currentPools[targetIndex].value = Math.max(0, Number(currentPools[targetIndex].value || 0) - 1);
    }
    return;
  }

  for (let remaining = delta; remaining > 0; remaining--) {
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

// ─── State factory ────────────────────────────────────────────────────────────
export function createPlayModeState(playerRoster, opponentRoster, setup = {}) {
  const clamp = (val, min, max, def) => {
    const n = Number.parseInt(String(val ?? def), 10);
    return Math.min(max, Math.max(min, Number.isFinite(n) ? n : def));
  };
  const gameSize       = clamp(setup.gameSize, 1, 100000, 2000);
  const gameLength     = clamp(setup.gameLength, 1, 20, 5);
  const startingSupply = clamp(setup.startingSupply, 0, 200, 10);
  const supplyPerRound = clamp(setup.supplyPerRound, 0, 50, 2);

  const playerSeed   = sanitizeSeed(setup.playerSeed || playerRoster?.seed || '');
  const opponentSeed = sanitizeSeed(setup.opponentSeed || opponentRoster?.seed || '');
  const unitsByKey = {
    ...createPlayUnitsByKey(playerRoster, 'player'),
    ...(opponentRoster ? createPlayUnitsByKey(opponentRoster, 'opponent') : {}),
  };

  return {
    playerSeed, opponentSeed, playerRoster, opponentRoster,
    playerName:     String(setup.playerName   || 'Player').trim()   || 'Player',
    opponentName:   String(setup.opponentName || 'Opponent').trim() || 'Opponent',
    opponentFaction: setup.opponentFaction || opponentRoster?.faction || 'Unknown',
    missionName:    String(setup.missionName  || 'Mission').trim()  || 'Mission',
    gameLength, startingSupply, supplyPerRound, gameSize,
    hasStarted:    !!setup.hasStarted,
    isLinkedGame:  Boolean(setup.isLinkedGame),
    linkedReady:   Boolean(setup.linkedReady),
    linkedMatchId: setup.linkedMatchId ? String(setup.linkedMatchId) : null,
    linkedSide:    setup.linkedSide === 'opponent' ? 'opponent' : 'player',
    linkedConsensus: createEmptyLinkedConsensus(),
    playerScore: 0, opponentScore: 0,
    playerResource: 0, opponentResource: 0,
    round: 1, phaseIndex: 0,
    firstPlayer: 'player',
    firstPlayerChosen: Boolean(setup.firstPlayerChosen),
    queuedFirstPlayer: setup.queuedFirstPlayer === 'opponent'
      ? 'opponent'
      : (setup.queuedFirstPlayer === 'player' ? 'player' : null),
    activeBoardSide: 'player',
    collapsedHealthWidthBySide: { player: null, opponent: null },
    collapsedNameWidthBySide:   { player: null, opponent: null },
    unitsByKey,
    history: [],
  };
}

export function ensurePlayStateMetadata(state) {
  if (!state) return;
  if (!state.gameId) state.gameId = createPlayGameId();
  if (!state.createdAt) state.createdAt = new Date().toISOString();
  state.updatedAt = new Date().toISOString();
}

// ─── Library helpers ──────────────────────────────────────────────────────────
export function upsertGameRecord(records, record) {
  const list = Array.isArray(records) ? records : [];
  const idx  = list.findIndex(item => item?.id === record?.id);
  if (idx >= 0) { list[idx] = record; return list; }
  return [record, ...list];
}

export function getPlayWinnerLabel(state) {
  if (!state) return 'Unknown';
  if (state.playerScore === state.opponentScore) return 'Draw';
  return state.playerScore > state.opponentScore ? state.playerName : state.opponentName;
}

export function buildPlayBreakdown(state, getHealth) {
  const trackers = Object.values(state?.unitsByKey ?? {});
  const summarizeSide = (side) => {
    const sideTrackers = trackers.filter(t => t.side === side);
    const deployed   = sideTrackers.filter(t => t.deployed).length;
    const destroyed  = sideTrackers.filter(t => t.deployed && getHealth(t) <= 0).length;
    const wounded    = sideTrackers.filter(t => {
      if (!t.deployed || getHealth(t) <= 0) return false;
      return getHealth(t) < (t.maxHealthPools ?? []).reduce((s, p) => s + Number(p?.value || 0), 0);
    }).length;
    return { deployed, destroyed, wounded };
  };
  return { player: summarizeSide('player'), opponent: summarizeSide('opponent') };
}

// ─── Snapshot helpers ─────────────────────────────────────────────────────────
export function clonePlaySnapshot(state) {
  if (!state) return null;
  return {
    round:            state.round,
    phaseIndex:       state.phaseIndex,
    firstPlayer:      state.firstPlayer,
    firstPlayerChosen: Boolean(state.firstPlayerChosen),
    playerResource:   state.playerResource,
    opponentResource: state.opponentResource,
    playerScore:      state.playerScore,
    opponentScore:    state.opponentScore,
    queuedFirstPlayer: state.queuedFirstPlayer,
    unitsByKey:       JSON.parse(JSON.stringify(state.unitsByKey)),
  };
}

export function restoreSnapshotIntoState(state, snapshot) {
  if (!state || !snapshot) return;
  state.round            = snapshot.round;
  state.phaseIndex       = snapshot.phaseIndex;
  state.firstPlayer      = snapshot.firstPlayer;
  state.firstPlayerChosen = Boolean(snapshot.firstPlayerChosen);
  state.playerResource   = snapshot.playerResource;
  state.opponentResource = snapshot.opponentResource;
  state.playerScore      = snapshot.playerScore;
  state.opponentScore    = snapshot.opponentScore;
  state.queuedFirstPlayer = snapshot.queuedFirstPlayer === 'opponent'
    ? 'opponent'
    : (snapshot.queuedFirstPlayer === 'player' ? 'player' : null);
  state.unitsByKey = snapshot.unitsByKey;
}

// ─── Round management ─────────────────────────────────────────────────────────
export function resetRoundTrackers(state) {
  if (!state) return;
  state.playerResource   = 0;
  state.opponentResource = 0;
  for (const tracker of Object.values(state.unitsByKey)) {
    tracker.activation.movement = false;
    tracker.activation.assault  = false;
    tracker.activation.combat   = false;
  }
}

export function getPlayCurrentPhase(state) {
  return PLAY_PHASES[state?.phaseIndex ?? 0] ?? PLAY_PHASES[0];
}

export function getNextPhaseTarget(state) {
  const currentPhase = PLAY_PHASES[state?.phaseIndex ?? 0] ?? PLAY_PHASES[0];
  if (currentPhase === 'Scoring') {
    return { round: Number(state?.round || 1) + 1, phaseIndex: 0 };
  }
  return {
    round:      Number(state?.round || 1),
    phaseIndex: Math.min(Number(state?.phaseIndex || 0) + 1, PLAY_PHASES.length - 1),
  };
}

export function applyPhaseTarget(state, target, { onResetRoundTrackers } = {}) {
  const scoringPhaseIndex = PLAY_PHASES.indexOf('Scoring');
  const previousRound     = Number(state?.round || 1);
  const targetRound       = Number(target?.round || state?.round || 1);
  const targetPhaseIndex  = Math.max(0, Math.min(PLAY_PHASES.length - 1, Number(target?.phaseIndex || 0)));
  const wasScoringRollover = targetRound > previousRound;
  const movingIntoScoring  = targetRound === previousRound && targetPhaseIndex === scoringPhaseIndex;

  if (movingIntoScoring && !state.queuedFirstPlayer) {
    state.queuedFirstPlayer = state.firstPlayer === 'opponent' ? 'opponent' : 'player';
  }
  state.round      = targetRound;
  state.phaseIndex = targetPhaseIndex;

  if (wasScoringRollover && (state.queuedFirstPlayer === 'player' || state.queuedFirstPlayer === 'opponent')) {
    state.firstPlayer       = state.queuedFirstPlayer;
    state.queuedFirstPlayer = null;
  }
  if (wasScoringRollover) {
    if (onResetRoundTrackers) {
      onResetRoundTrackers(state);
    } else {
      resetRoundTrackers(state);
    }
  }
}
