/**
 * Firebase Auth + Firestore helpers for Play Mode cloud saves.
 * Uses lazy dynamic imports so the app still works if Firebase is unavailable.
 */

import { getFirebaseAuthDomain } from './siteConfig.js';

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDEAYGa0_BaLwIKIDFA37WEsBw6_Pf_1v4',
  authDomain: getFirebaseAuthDomain(typeof window !== 'undefined' ? window.location.hostname : ''),
  projectId: 'starcrafttmg-dc616',
  storageBucket: 'starcrafttmg-dc616.firebasestorage.app',
  messagingSenderId: '561160921740',
  appId: '1:561160921740:web:2b9425e53cd0f6928451a9',
  measurementId: 'G-6165SBS0VS',
};

const FIREBASE_VERSION = '10.12.5';
const LINKED_MATCH_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

let firebaseReadyPromise = null;
let firebaseContext = null;

function createEmptyLibrary() {
  return { activeGameId: null, inProgress: [], completed: [] };
}

function createEmptySeedHistory() {
  return { recentSeeds: [], favorites: [] };
}

function normalizeRecord(record, fallbackBucket) {
  if (!record || typeof record !== 'object') return null;
  const id = String(record.id || '').trim();
  if (!id) return null;
  const state = record.state && typeof record.state === 'object' ? record.state : null;
  if (!state) return null;
  const updatedAt = String(record.updatedAt || state.updatedAt || state.completedAt || '').trim();
  const bucket = fallbackBucket === 'completed' ? 'completed' : 'inProgress';
  return { id, updatedAt, state, bucket };
}

function normalizeLibrary(library) {
  const src = library && typeof library === 'object' ? library : createEmptyLibrary();
  const inProgress = Array.isArray(src.inProgress)
    ? src.inProgress.map(item => normalizeRecord(item, 'inProgress')).filter(Boolean)
    : [];
  const completed = Array.isArray(src.completed)
    ? src.completed.map(item => normalizeRecord(item, 'completed')).filter(Boolean)
    : [];
  const activeGameId = src.activeGameId ? String(src.activeGameId) : null;
  return { activeGameId, inProgress, completed };
}

function normalizeSeed(seed) {
  return String(seed || '').trim().toUpperCase();
}

function normalizeSeedHistory(seedHistory) {
  const src = seedHistory && typeof seedHistory === 'object' ? seedHistory : createEmptySeedHistory();
  const recentSeeds = Array.isArray(src.recentSeeds)
    ? src.recentSeeds.map(normalizeSeed).filter(Boolean)
    : [];
  const favorites = Array.isArray(src.favorites)
    ? src.favorites
      .filter(item => item && typeof item === 'object')
      .map(item => ({
        name: String(item.name || '').trim(),
        seed: normalizeSeed(item.seed),
      }))
      .filter(item => item.name && item.seed)
    : [];
  return { recentSeeds, favorites };
}

function dateMs(value) {
  const ms = Date.parse(String(value || ''));
  return Number.isFinite(ms) ? ms : 0;
}

function nowIso() {
  return new Date().toISOString();
}

function generateLinkedMatchCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * LINKED_MATCH_CODE_ALPHABET.length);
    code += LINKED_MATCH_CODE_ALPHABET[idx];
  }
  return code;
}

function pickNewerRecord(a, b) {
  if (!a) return b;
  if (!b) return a;
  return dateMs(a.updatedAt) >= dateMs(b.updatedAt) ? a : b;
}

export function mergeLibraries(localLibrary, cloudLibrary) {
  const local = normalizeLibrary(localLibrary);
  const cloud = normalizeLibrary(cloudLibrary);
  const inProgressMap = new Map();
  const completedMap = new Map();

  for (const record of local.inProgress) {
    inProgressMap.set(record.id, record);
  }
  for (const record of cloud.inProgress) {
    const current = inProgressMap.get(record.id);
    inProgressMap.set(record.id, pickNewerRecord(current, record));
  }

  for (const record of local.completed) {
    completedMap.set(record.id, record);
  }
  for (const record of cloud.completed) {
    const current = completedMap.get(record.id);
    completedMap.set(record.id, pickNewerRecord(current, record));
  }

  // Completed records win over in-progress records with the same id.
  for (const id of completedMap.keys()) {
    inProgressMap.delete(id);
  }

  const inProgress = [...inProgressMap.values()]
    .sort((a, b) => dateMs(b.updatedAt) - dateMs(a.updatedAt));
  const completed = [...completedMap.values()]
    .sort((a, b) => dateMs(b.updatedAt) - dateMs(a.updatedAt));

  const activeGameId = inProgressMap.has(local.activeGameId)
    ? local.activeGameId
    : inProgressMap.has(cloud.activeGameId)
      ? cloud.activeGameId
      : inProgress[0]?.id || null;

  return { activeGameId, inProgress, completed };
}

export function mergeSeedHistories(localSeedHistory, cloudSeedHistory, maxRecentSeeds = 10) {
  const local = normalizeSeedHistory(localSeedHistory);
  const cloud = normalizeSeedHistory(cloudSeedHistory);

  const recentSeeds = [];
  const seenRecent = new Set();
  for (const seed of [...local.recentSeeds, ...cloud.recentSeeds]) {
    if (!seed || seenRecent.has(seed)) continue;
    seenRecent.add(seed);
    recentSeeds.push(seed);
    if (recentSeeds.length >= maxRecentSeeds) break;
  }

  const favorites = [];
  const seenFavoriteSeeds = new Set();
  for (const entry of [...local.favorites, ...cloud.favorites]) {
    if (!entry?.seed || seenFavoriteSeeds.has(entry.seed)) continue;
    seenFavoriteSeeds.add(entry.seed);
    favorites.push({ name: entry.name, seed: entry.seed });
  }

  return { recentSeeds, favorites };
}

function hasFirebaseConfig() {
  return Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.appId);
}

async function ensureFirebaseContext() {
  if (!hasFirebaseConfig()) throw new Error('Firebase config missing.');

  if (!firebaseReadyPromise) {
    firebaseReadyPromise = (async () => {
      const appMod = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`);
      const authMod = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`);
      const firestoreMod = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`);

      const app = appMod.initializeApp(FIREBASE_CONFIG);
      const auth = authMod.getAuth(app);
      const db = firestoreMod.initializeFirestore(app, {
        experimentalForceLongPolling: true
      });
      const authReadyPromise = new Promise((resolve) => {
        let settled = false;
        const unsubscribe = authMod.onAuthStateChanged(
          auth,
          () => {
            if (settled) return;
            settled = true;
            unsubscribe();
            resolve();
          },
          () => {
            if (settled) return;
            settled = true;
            unsubscribe();
            resolve();
          }
        );
      });

      firebaseContext = {
        app,
        auth,
        authReadyPromise,
        db,
        GoogleAuthProvider: authMod.GoogleAuthProvider,
        FacebookAuthProvider: authMod.FacebookAuthProvider,
        OAuthProvider: authMod.OAuthProvider,
        onAuthStateChanged: authMod.onAuthStateChanged,
        signInWithPopup: authMod.signInWithPopup,
        signInAnonymously: authMod.signInAnonymously,
        signInWithEmailAndPassword: authMod.signInWithEmailAndPassword,
        createUserWithEmailAndPassword: authMod.createUserWithEmailAndPassword,
        sendPasswordResetEmail: authMod.sendPasswordResetEmail,
        signOut: authMod.signOut,
        doc: firestoreMod.doc,
        collection: firestoreMod.collection,
        getDoc: firestoreMod.getDoc,
        getDocs: firestoreMod.getDocs,
        setDoc: firestoreMod.setDoc,
        onSnapshot: firestoreMod.onSnapshot,
        runTransaction: firestoreMod.runTransaction,
        writeBatch: firestoreMod.writeBatch,
        serverTimestamp: firestoreMod.serverTimestamp,
      };

      return firebaseContext;
    })();
  }

  return firebaseReadyPromise;
}

function getSignedInUid(ctx) {
  const uid = ctx?.auth?.currentUser?.uid;
  if (!uid) throw new Error('You must be signed in for cloud sync.');
  return uid;
}

async function waitForSignedInUid(ctx, timeoutMs = 8000) {
  const existingUid = ctx?.auth?.currentUser?.uid;
  if (existingUid) return existingUid;

  return new Promise((resolve, reject) => {
    let settled = false;
    let timeoutId = null;

    const finish = (handler, value) => {
      if (settled) return;
      settled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      try {
        unsubscribe();
      } catch (_) { /* ignore */ }
      handler(value);
    };

    const unsubscribe = ctx.onAuthStateChanged(
      ctx.auth,
      (user) => {
        const uid = user?.uid;
        if (!uid) return;
        finish(resolve, uid);
      },
      (err) => {
        finish(reject, err);
      }
    );

    timeoutId = window.setTimeout(() => {
      finish(reject, new Error('You must be signed in for cloud sync.'));
    }, timeoutMs);
  });
}

async function requireSignedInContext() {
  const ctx = await ensureFirebaseContext();
  await ctx.authReadyPromise;
  const uid = await waitForSignedInUid(ctx);
  return { ctx, uid };
}

export async function initCloudAuth(onChange) {
  const ctx = await ensureFirebaseContext();
  return ctx.onAuthStateChanged(ctx.auth, onChange);
}

export async function signInWithGoogle() {
  return signInWithProvider('google');
}

export async function signInWithProvider(providerKey = 'google') {
  const ctx = await ensureFirebaseContext();
  const key = String(providerKey || '').toLowerCase();

  let provider;
  if (key === 'google') {
    provider = new ctx.GoogleAuthProvider();
  } else if (key === 'facebook') {
    provider = new ctx.FacebookAuthProvider();
  } else if (key === 'microsoft') {
    provider = new ctx.OAuthProvider('microsoft.com');
  } else if (key === 'apple') {
    provider = new ctx.OAuthProvider('apple.com');
  } else {
    throw new Error(`Unsupported auth provider: ${providerKey}`);
  }

  provider.setCustomParameters({ prompt: 'select_account' });
  return ctx.signInWithPopup(ctx.auth, provider);
}

export async function signInWithEmailPassword(email, password) {
  const ctx = await ensureFirebaseContext();
  return ctx.signInWithEmailAndPassword(ctx.auth, String(email || '').trim(), String(password || ''));
}

export async function signInAnonymouslyCloud() {
  const ctx = await ensureFirebaseContext();
  return ctx.signInAnonymously(ctx.auth);
}

export async function createEmailPasswordAccount(email, password) {
  const ctx = await ensureFirebaseContext();
  return ctx.createUserWithEmailAndPassword(ctx.auth, String(email || '').trim(), String(password || ''));
}

export async function sendPasswordReset(email) {
  const ctx = await ensureFirebaseContext();
  return ctx.sendPasswordResetEmail(ctx.auth, String(email || '').trim());
}

export async function signOutCloud() {
  const ctx = await ensureFirebaseContext();
  return ctx.signOut(ctx.auth);
}

export async function fetchLibraryFromCloud() {
  const state = await fetchCloudState();
  return state.library;
}

export async function fetchCloudState() {
  const { ctx, uid } = await requireSignedInContext();

  const playGamesRef = ctx.collection(ctx.db, 'users', uid, 'playGames');
  const snapshot = await ctx.getDocs(playGamesRef);

  const inProgress = [];
  const completed = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const bucket = data.bucket === 'completed' ? 'completed' : 'inProgress';
    const normalized = normalizeRecord({
      id: data.id || docSnap.id,
      updatedAt: data.updatedAt,
      state: data.state,
    }, bucket);
    if (!normalized) return;
    if (bucket === 'completed') completed.push(normalized);
    else inProgress.push(normalized);
  });

  const metaRef = ctx.doc(ctx.db, 'users', uid, 'meta', 'sync');
  const metaSnap = await ctx.getDoc(metaRef);
  const meta = metaSnap.exists() ? (metaSnap.data() || {}) : {};

  return {
    library: normalizeLibrary({
      activeGameId: meta.activeGameId || null,
      inProgress,
      completed,
    }),
    seedHistory: normalizeSeedHistory(meta.seedHistory),
  };
}

export async function syncLibraryToCloud(library) {
  return syncCloudState({ library });
}

export async function syncCloudState({ library, seedHistory } = {}) {
  const { ctx, uid } = await requireSignedInContext();
  const normalizedLibrary = normalizeLibrary(library);
  const normalizedSeedHistory = normalizeSeedHistory(seedHistory);

  const playGamesRef = ctx.collection(ctx.db, 'users', uid, 'playGames');
  const existingSnapshot = await ctx.getDocs(playGamesRef);
  const existingIds = new Set();
  existingSnapshot.forEach((docSnap) => existingIds.add(docSnap.id));

  const allRecords = [...normalizedLibrary.inProgress, ...normalizedLibrary.completed];
  const keepIds = new Set(allRecords.map(record => record.id));

  const batch = ctx.writeBatch(ctx.db);

  for (const record of allRecords) {
    const gameRef = ctx.doc(ctx.db, 'users', uid, 'playGames', record.id);
    batch.set(gameRef, {
      id: record.id,
      bucket: record.bucket,
      updatedAt: record.updatedAt || new Date().toISOString(),
      state: record.state,
      syncedAt: ctx.serverTimestamp(),
    }, { merge: true });
  }

  for (const id of existingIds) {
    if (keepIds.has(id)) continue;
    const gameRef = ctx.doc(ctx.db, 'users', uid, 'playGames', id);
    batch.delete(gameRef);
  }

  const metaRef = ctx.doc(ctx.db, 'users', uid, 'meta', 'sync');
  batch.set(metaRef, {
    activeGameId: normalizedLibrary.activeGameId || null,
    seedHistory: normalizedSeedHistory,
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
    syncedAt: ctx.serverTimestamp(),
  }, { merge: true });

  await batch.commit();
  return true;
}

function normalizeLinkedCode(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
}

function linkedMatchRef(ctx, matchId) {
  return ctx.doc(ctx.db, 'linkedMatches', normalizeLinkedCode(matchId));
}

function linkedSideRef(ctx, matchId, side) {
  const normalizedSide = side === 'opponent' ? 'opponent' : 'player';
  return ctx.doc(ctx.db, 'linkedMatches', normalizeLinkedCode(matchId), 'sides', normalizedSide);
}

function normalizeLinkedParticipantSide(side) {
  return side === 'opponent' ? 'opponent' : 'player';
}

export async function createLinkedMatch({ sharedState, playerSideState, opponentSideState, hostSide = 'player' } = {}) {
  const { ctx, uid } = await requireSignedInContext();
  const normalizedHostSide = normalizeLinkedParticipantSide(hostSide);

  if (!sharedState || typeof sharedState !== 'object') {
    throw new Error('Shared match state is required.');
  }

  if (!playerSideState || !opponentSideState) {
    throw new Error('Both side states are required.');
  }

  let matchId = '';
  let attempts = 0;
  while (!matchId && attempts < 8) {
    attempts += 1;
    const candidate = generateLinkedMatchCode(6);
    const existing = await ctx.getDoc(linkedMatchRef(ctx, candidate));
    if (!existing.exists()) matchId = candidate;
  }
  if (!matchId) throw new Error('Unable to allocate a linked game code. Try again.');

  const participants = {
    playerUid: normalizedHostSide === 'player' ? uid : null,
    opponentUid: normalizedHostSide === 'opponent' ? uid : null,
  };

  const createdAt = nowIso();
  const matchRef = linkedMatchRef(ctx, matchId);
  const batch = ctx.writeBatch(ctx.db);

  batch.set(matchRef, {
    matchId,
    ownerUid: uid,
    status: 'active',
    createdAt,
    updatedAt: createdAt,
    participants,
    sharedState,
    schemaVersion: 1,
    syncedAt: ctx.serverTimestamp(),
  });

  await batch.commit();
  return { matchId, side: normalizedHostSide };
}

export async function joinLinkedMatch(matchId, preferredSide = null) {
  const { ctx, uid } = await requireSignedInContext();
  const normalizedMatchId = normalizeLinkedCode(matchId);
  if (!normalizedMatchId) throw new Error('Match code is required.');

  const normalizedPreferredSide = preferredSide == null
    ? null
    : normalizeLinkedParticipantSide(preferredSide);

  const matchRef = linkedMatchRef(ctx, normalizedMatchId);

  const resolved = await ctx.runTransaction(ctx.db, async (txn) => {
    const snap = await txn.get(matchRef);
    if (!snap.exists()) throw new Error('Linked game not found.');
    const data = snap.data() || {};
    const participants = data.participants || {};

    if (participants.playerUid === uid) {
      return { side: 'player', participants };
    }
    if (participants.opponentUid === uid) {
      return { side: 'opponent', participants };
    }

    const playerOpen = !participants.playerUid;
    const opponentOpen = !participants.opponentUid;

    let assignedSide = null;
    if (normalizedPreferredSide === 'player' && playerOpen) assignedSide = 'player';
    if (normalizedPreferredSide === 'opponent' && opponentOpen) assignedSide = 'opponent';
    if (!assignedSide) {
      if (playerOpen) assignedSide = 'player';
      else if (opponentOpen) assignedSide = 'opponent';
    }

    if (!assignedSide) {
      throw new Error('Linked game already has two players.');
    }

    const nextParticipants = {
      playerUid: assignedSide === 'player' ? uid : (participants.playerUid || null),
      opponentUid: assignedSide === 'opponent' ? uid : (participants.opponentUid || null),
    };

    txn.set(matchRef, {
      participants: nextParticipants,
      updatedAt: nowIso(),
      syncedAt: ctx.serverTimestamp(),
    }, { merge: true });

    txn.set(linkedSideRef(ctx, normalizedMatchId, assignedSide), {
      uid,
      updatedAt: nowIso(),
      syncedAt: ctx.serverTimestamp(),
    }, { merge: true });

    return { side: assignedSide, participants: nextParticipants };
  });

  return { matchId: normalizedMatchId, side: resolved.side, participants: resolved.participants };
}

export async function leaveLinkedMatch(matchId, side) {
  const { ctx, uid } = await requireSignedInContext();
  const normalizedMatchId = normalizeLinkedCode(matchId);
  const normalizedSide = normalizeLinkedParticipantSide(side);
  if (!normalizedMatchId) throw new Error('Match code is required.');

  const matchRef = linkedMatchRef(ctx, normalizedMatchId);
  await ctx.runTransaction(ctx.db, async (txn) => {
    const snap = await txn.get(matchRef);
    if (!snap.exists()) return;
    const data = snap.data() || {};
    const participants = data.participants || {};
    const currentSideUid = normalizedSide === 'player' ? participants.playerUid : participants.opponentUid;
    if (currentSideUid && currentSideUid !== uid) {
      throw new Error('Cannot leave a side controlled by another user.');
    }
    const nextParticipants = {
      playerUid: normalizedSide === 'player' ? null : (participants.playerUid || null),
      opponentUid: normalizedSide === 'opponent' ? null : (participants.opponentUid || null),
    };
    txn.set(matchRef, {
      participants: nextParticipants,
      updatedAt: nowIso(),
      syncedAt: ctx.serverTimestamp(),
    }, { merge: true });
    txn.set(linkedSideRef(ctx, normalizedMatchId, normalizedSide), {
      uid: null,
      updatedAt: nowIso(),
      syncedAt: ctx.serverTimestamp(),
    }, { merge: true });
  });
}

export async function updateLinkedMatchSharedState(matchId, sharedPatch = {}) {
  const { ctx } = await requireSignedInContext();
  const normalizedMatchId = normalizeLinkedCode(matchId);
  if (!normalizedMatchId) throw new Error('Match code is required.');
  if (!sharedPatch || typeof sharedPatch !== 'object') return;
  await ctx.setDoc(linkedMatchRef(ctx, normalizedMatchId), {
    sharedState: sharedPatch,
    updatedAt: nowIso(),
    syncedAt: ctx.serverTimestamp(),
  }, { merge: true });
}

export async function updateLinkedMatchSideState(matchId, side, sidePatch = {}) {
  const { ctx, uid } = await requireSignedInContext();
  const normalizedMatchId = normalizeLinkedCode(matchId);
  const normalizedSide = normalizeLinkedParticipantSide(side);
  if (!normalizedMatchId) throw new Error('Match code is required.');
  if (!sidePatch || typeof sidePatch !== 'object') return;
  await ctx.setDoc(linkedSideRef(ctx, normalizedMatchId, normalizedSide), {
    ...sidePatch,
    uid,
    updatedAt: nowIso(),
    syncedAt: ctx.serverTimestamp(),
  }, { merge: true });
}

export async function subscribeToLinkedMatch(matchId, onChange, onError) {
  const { ctx } = await requireSignedInContext();
  const normalizedMatchId = normalizeLinkedCode(matchId);
  if (!normalizedMatchId) throw new Error('Match code is required.');

  const state = {
    match: null,
    player: null,
    opponent: null,
  };

  const emit = () => {
    if (!state.match || !state.player || !state.opponent) return;
    if (typeof onChange === 'function') {
      onChange({
        matchId: normalizedMatchId,
        match: state.match,
        playerSide: state.player,
        opponentSide: state.opponent,
      });
    }
  };

  const handleError = (err) => {
    if (typeof onError === 'function') onError(err);
  };

  const unsubs = [];
  unsubs.push(ctx.onSnapshot(linkedMatchRef(ctx, normalizedMatchId), (snap) => {
    state.match = snap.exists() ? (snap.data() || null) : null;
    emit();
  }, handleError));

  unsubs.push(ctx.onSnapshot(linkedSideRef(ctx, normalizedMatchId, 'player'), (snap) => {
    state.player = snap.exists() ? (snap.data() || {}) : {};
    emit();
  }, handleError));

  unsubs.push(ctx.onSnapshot(linkedSideRef(ctx, normalizedMatchId, 'opponent'), (snap) => {
    state.opponent = snap.exists() ? (snap.data() || {}) : {};
    emit();
  }, handleError));

  return () => {
    for (const unsub of unsubs) {
      try { unsub(); } catch (_) { /* ignore */ }
    }
  };
}

export function hasCloudSyncConfig() {
  return hasFirebaseConfig();
}
