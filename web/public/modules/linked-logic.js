/**
 * Linked game protocol — pure logic, no DOM, no global state.
 * All state-dependent functions accept state / linkedSession as arguments.
 */
import { sanitizeSeed } from './utils.js';
import { createEmptyLinkedConsensus, createPlayUnitsByKey, getPlayTrackerCurrentHealth } from './play-state.js';

// ─── Code normalisation ───────────────────────────────────────────────────────
export function normalizeLinkedCode(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
}

// ─── Consensus normalisation ──────────────────────────────────────────────────
export function normalizeLinkedConsensus(consensus) {
  const src = consensus && typeof consensus === 'object' ? consensus : {};

  const normalizeEndGameRequest = (value) => {
    if (!value || typeof value !== 'object') return null;
    return {
      type: 'end-game',
      requestId: String(value.requestId || `end-game-${Date.now()}`),
      requestedBy:      value.requestedBy === 'opponent' ? 'opponent' : 'player',
      playerApproved:   Boolean(value.playerApproved),
      opponentApproved: Boolean(value.opponentApproved),
      targetRound:      Number(value.targetRound || 0),
      targetPhaseIndex: Number(value.targetPhaseIndex || 0),
    };
  };

  const normalizePassState = (value) => {
    if (!value || typeof value !== 'object') return null;
    const firstPassedBy = value.firstPassedBy === 'opponent'
      ? 'opponent'
      : (value.firstPassedBy === 'player' ? 'player' : null);
    return {
      targetRound:      Number(value.targetRound || 0),
      targetPhaseIndex: Number(value.targetPhaseIndex || 0),
      playerPassed:     Boolean(value.playerPassed),
      opponentPassed:   Boolean(value.opponentPassed),
      firstPassedBy,
    };
  };

  const phaseAdvanceFallback = src.phaseAdvance && typeof src.phaseAdvance === 'object'
    ? {
      targetRound:      Number(src.phaseAdvance.targetRound || 0),
      targetPhaseIndex: Number(src.phaseAdvance.targetPhaseIndex || 0),
      playerPassed:     Boolean(src.phaseAdvance.playerApproved),
      opponentPassed:   Boolean(src.phaseAdvance.opponentApproved),
      firstPassedBy:    src.phaseAdvance.requestedBy === 'opponent' ? 'opponent' : 'player',
    }
    : null;

  const pass = normalizePassState(src.pass) || phaseAdvanceFallback;
  return { pass, endGame: normalizeEndGameRequest(src.endGame) };
}

export function hasBothLinkedApprovals(request) {
  return Boolean(request?.playerApproved && request?.opponentApproved);
}

// ─── Session queries (read from linkedSession object) ─────────────────────────
export function getLinkedSide(linkedSession) {
  return linkedSession?.side === 'opponent' ? 'opponent' : 'player';
}

export function isLinkedModeActive(linkedSession) {
  return Boolean(linkedSession?.matchId);
}

export function isLinkedGameState(state, linkedSession) {
  return Boolean(state?.isLinkedGame || linkedSession?.matchId);
}

export function isLinkedGameReady(state, linkedSession) {
  if (!isLinkedGameState(state, linkedSession)) return true;
  return Boolean(
    state?.linkedReady
    && state?.playerRoster
    && state?.opponentRoster
    && sanitizeSeed(state?.playerSeed)
    && sanitizeSeed(state?.opponentSeed)
  );
}

export function isLinkedSideEditable(side, linkedSession) {
  if (!isLinkedModeActive(linkedSession)) return true;
  return getLinkedSide(linkedSession) === (side === 'opponent' ? 'opponent' : 'player');
}

export function getLinkedTrackerDisabledAttrs(side, linkedSession) {
  if (isLinkedSideEditable(side, linkedSession)) return '';
  return ' disabled aria-disabled="true" title="Only the owner of this linked seed can edit these trackers."';
}

export function assertLinkedActionAllowed(action, { side = '', tracker = null } = {}, linkedSession) {
  if (!isLinkedModeActive(linkedSession)) return true;
  const linkedSide = getLinkedSide(linkedSession);
  if (['score-inc', 'score-dec', 'resource-inc', 'resource-dec'].includes(action)) {
    return side === linkedSide;
  }
  if (['hp-inc', 'hp-dec', 'toggle-activation', 'toggle-deployed'].includes(action)) {
    return tracker?.side === linkedSide;
  }
  return true;
}

// ─── Ready state ──────────────────────────────────────────────────────────────
export function updateLinkedReadyState(state, { match = null, playerSide = null, opponentSide = null } = {}, linkedSession) {
  if (!state) return false;
  const participants  = match?.participants || {};
  const bothUsersJoined = Boolean(participants.playerUid && participants.opponentUid);
  const bothSeedsLoaded = Boolean(
    sanitizeSeed(playerSide?.seed || state?.playerSeed)
    && sanitizeSeed(opponentSide?.seed || state?.opponentSeed)
  );
  const bothRostersLoaded = Boolean(
    (playerSide?.roster || state?.playerRoster)
    && (opponentSide?.roster || state?.opponentRoster)
  );
  const ready = bothUsersJoined && bothSeedsLoaded && bothRostersLoaded;
  state.isLinkedGame = isLinkedGameState(state, linkedSession);
  state.linkedReady  = ready;
  if (linkedSession) linkedSession.ready = ready;
  return ready;
}

// ─── State builders (for Firestore sync) ─────────────────────────────────────
export function buildLinkedSharedState(state) {
  return {
    hasStarted:       Boolean(state?.hasStarted),
    round:            Number(state?.round || 1),
    phaseIndex:       Number(state?.phaseIndex || 0),
    firstPlayer:      state?.firstPlayer === 'opponent' ? 'opponent' : 'player',
    missionName:      String(state?.missionName || 'Mission'),
    gameLength:       Number(state?.gameLength || 5),
    startingSupply:   Number(state?.startingSupply || 10),
    supplyPerRound:   Number(state?.supplyPerRound || 2),
    gameSize:         Number(state?.gameSize || 2000),
    queuedFirstPlayer: state?.queuedFirstPlayer === 'opponent'
      ? 'opponent'
      : (state?.queuedFirstPlayer === 'player' ? 'player' : null),
    consensus: normalizeLinkedConsensus(state?.linkedConsensus),
  };
}

export function buildLinkedSideState(state, side) {
  const normalizedSide = side === 'opponent' ? 'opponent' : 'player';
  const isPlayer = normalizedSide === 'player';
  const roster   = isPlayer ? state?.playerRoster : state?.opponentRoster;
  const faction  = roster?.faction || (isPlayer ? state?.playerRoster?.faction : state?.opponentFaction) || 'Terran';
  return {
    side: normalizedSide,
    name: String(isPlayer ? state?.playerName : (state?.opponentName || (isPlayer ? 'Player' : 'Opponent'))),
    seed: String(isPlayer ? state?.playerSeed : (state?.opponentSeed || '')),
    faction: String(faction || 'Terran'),
    score:    Number(isPlayer ? state?.playerScore    : (state?.opponentScore    || 0)),
    resource: Number(isPlayer ? state?.playerResource : (state?.opponentResource || 0)),
    activationRound: Number(state?.round || 1),
    roster,
    unitsByKey: getUnitsBySide(state?.unitsByKey, normalizedSide),
  };
}

// ─── Unit key helpers ─────────────────────────────────────────────────────────
export function getUnitsBySide(unitsByKey, side) {
  const normalizedSide = side === 'opponent' ? 'opponent' : 'player';
  const prefix = `${normalizedSide}:`;
  const source = unitsByKey && typeof unitsByKey === 'object' ? unitsByKey : {};
  const out = {};
  for (const [key, value] of Object.entries(source)) {
    if (String(key).startsWith(prefix)) out[key] = value;
  }
  return out;
}

export function buildLinkedUnitsBySide({ roster = null, side = 'player', existingUnitsByKey = null, incomingUnitsByKey = null } = {}) {
  const normalizedSide      = side === 'opponent' ? 'opponent' : 'player';
  const fallbackUnitsByKey  = roster ? createPlayUnitsByKey(roster, normalizedSide) : {};
  return {
    ...fallbackUnitsByKey,
    ...getUnitsBySide(existingUnitsByKey, normalizedSide),
    ...getUnitsBySide(incomingUnitsByKey, normalizedSide),
  };
}

// ─── Tracker normalisation ────────────────────────────────────────────────────
export function normalizeTrackerActivation(tracker) {
  const activation = tracker?.activation && typeof tracker.activation === 'object'
    ? tracker.activation : {};
  return {
    movement: Boolean(activation.movement),
    assault:  Boolean(activation.assault),
    combat:   Boolean(activation.combat),
  };
}

export function resetTrackerActivation(tracker) {
  return { ...tracker, activation: { movement: false, assault: false, combat: false } };
}

export function sanitizeLinkedSideUnitsForRound(unitsByKey, side, activationRound, currentRound) {
  const scoped = getUnitsBySide(unitsByKey, side);
  const normalizedCurrentRound    = Number(currentRound || 1);
  const normalizedActivationRound = Number(activationRound || 0);
  const shouldResetActivation     = normalizedActivationRound !== normalizedCurrentRound;
  const next = {};
  for (const [key, tracker] of Object.entries(scoped)) {
    if (!tracker || typeof tracker !== 'object') { next[key] = tracker; continue; }
    const normalizedTracker = { ...tracker, activation: normalizeTrackerActivation(tracker) };
    next[key] = shouldResetActivation ? resetTrackerActivation(normalizedTracker) : normalizedTracker;
  }
  return next;
}

// ─── Payload application ──────────────────────────────────────────────────────
/**
 * Apply a Firestore snapshot payload onto the current play state.
 * Returns the mutated (or replaced) play state.
 */
export function applyLinkedPayload({ match, playerSide, opponentSide } = {}, currentState, linkedSession) {
  if (!match || !playerSide || !opponentSide) return currentState;

  const shared        = match.sharedState || {};
  const playerRoster  = playerSide.roster  || currentState?.playerRoster  || null;
  const opponentRoster= opponentSide.roster|| currentState?.opponentRoster || null;
  if (!playerRoster && !opponentRoster) return currentState;

  const setup = {
    playerSeed:       playerSide.seed  || playerRoster?.seed  || '',
    opponentSeed:     opponentSide.seed|| opponentRoster?.seed|| '',
    playerName:       playerSide.name  || currentState?.playerName   || 'Player',
    opponentName:     opponentSide.name|| currentState?.opponentName || 'Opponent',
    opponentFaction:  opponentSide.faction || opponentRoster?.faction || 'Terran',
    missionName:      shared.missionName   || 'Mission',
    gameLength:       shared.gameLength    ?? 5,
    startingSupply:   shared.startingSupply ?? 10,
    supplyPerRound:   shared.supplyPerRound ?? 2,
    gameSize:         shared.gameSize       ?? 2000,
    queuedFirstPlayer: shared.queuedFirstPlayer === 'opponent'
      ? 'opponent'
      : (shared.queuedFirstPlayer === 'player' ? 'player' : null),
    hasStarted: Boolean(shared.hasStarted ?? true),
  };
  const consensus = normalizeLinkedConsensus(shared.consensus);

  // Import createPlayModeState lazily to avoid circular reference at module evaluation time.
  // (play-state imports nothing from linked-logic, so this is safe at call time.)
  let state = currentState;
  if (!state?.hasStarted) {
    const { createPlayModeState, applyPhaseTarget } = /** @type {any} */({ createPlayModeState: null });
    // We can't import createPlayModeState here due to circular dep; callers must do it.
    // This function returns a "diff" object instead; app.js applies it.
    // See applyLinkedPayloadToState in app.js.
    return { _needsInit: true, playerRoster, opponentRoster, setup, consensus, shared, playerSide, opponentSide };
  }

  state.playerRoster   = playerRoster;
  state.opponentRoster = opponentRoster;
  Object.assign(state, {
    playerSeed: setup.playerSeed, opponentSeed: setup.opponentSeed,
    playerName: setup.playerName, opponentName: setup.opponentName,
    opponentFaction: setup.opponentFaction,
    missionName: setup.missionName, gameLength: setup.gameLength,
    startingSupply: setup.startingSupply, supplyPerRound: setup.supplyPerRound,
    gameSize: setup.gameSize, queuedFirstPlayer: setup.queuedFirstPlayer,
    hasStarted: setup.hasStarted,
  });

  state.linkedConsensus  = consensus;
  const existingUnitsByKey = state.unitsByKey && typeof state.unitsByKey === 'object' ? state.unitsByKey : {};

  state.round      = Number(shared.round || 1);
  state.phaseIndex = Number(shared.phaseIndex || 0);
  state.firstPlayer = shared.firstPlayer === 'opponent' ? 'opponent' : 'player';
  state.activeBoardSide = state.activeBoardSide === 'opponent' ? 'opponent' : 'player';
  state.playerScore    = Number(playerSide.score    || 0);
  state.opponentScore  = Number(opponentSide.score  || 0);
  state.playerResource = Number(playerSide.resource || 0);
  state.opponentResource = Number(opponentSide.resource || 0);
  state.unitsByKey = {
    ...buildLinkedUnitsBySide({
      roster: playerRoster, side: 'player',
      existingUnitsByKey,
      incomingUnitsByKey: sanitizeLinkedSideUnitsForRound(playerSide.unitsByKey, 'player', playerSide.activationRound, shared.round || 1),
    }),
    ...buildLinkedUnitsBySide({
      roster: opponentRoster, side: 'opponent',
      existingUnitsByKey,
      incomingUnitsByKey: sanitizeLinkedSideUnitsForRound(opponentSide.unitsByKey, 'opponent', opponentSide.activationRound, shared.round || 1),
    }),
  };
  state.history = [];
  state.isLinkedGame   = true;
  state.linkedMatchId  = match.matchId || linkedSession?.matchId || null;
  state.linkedSide     = linkedSession?.side || null;
  updateLinkedReadyState(state, { match, playerSide, opponentSide }, linkedSession);
  return state;
}
