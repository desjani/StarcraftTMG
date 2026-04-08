/**
 * Firebase Auth + Firestore helpers for Play Mode cloud saves.
 * Uses lazy dynamic imports so the app still works if Firebase is unavailable.
 */

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDEAYGa0_BaLwIKIDFA37WEsBw6_Pf_1v4',
  authDomain: 'starcrafttmg-dc616.firebaseapp.com',
  projectId: 'starcrafttmg-dc616',
  storageBucket: 'starcrafttmg-dc616.firebasestorage.app',
  messagingSenderId: '561160921740',
  appId: '1:561160921740:web:2b9425e53cd0f6928451a9',
  measurementId: 'G-6165SBS0VS',
};

const FIREBASE_VERSION = '10.12.5';

let firebaseReadyPromise = null;
let firebaseContext = null;

function createEmptyLibrary() {
  return { activeGameId: null, inProgress: [], completed: [] };
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

function dateMs(value) {
  const ms = Date.parse(String(value || ''));
  return Number.isFinite(ms) ? ms : 0;
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
      const db = firestoreMod.getFirestore(app);

      firebaseContext = {
        app,
        auth,
        db,
        GoogleAuthProvider: authMod.GoogleAuthProvider,
        FacebookAuthProvider: authMod.FacebookAuthProvider,
        OAuthProvider: authMod.OAuthProvider,
        onAuthStateChanged: authMod.onAuthStateChanged,
        signInWithPopup: authMod.signInWithPopup,
        signInWithEmailAndPassword: authMod.signInWithEmailAndPassword,
        createUserWithEmailAndPassword: authMod.createUserWithEmailAndPassword,
        sendPasswordResetEmail: authMod.sendPasswordResetEmail,
        signOut: authMod.signOut,
        doc: firestoreMod.doc,
        collection: firestoreMod.collection,
        getDoc: firestoreMod.getDoc,
        getDocs: firestoreMod.getDocs,
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
  const ctx = await ensureFirebaseContext();
  const uid = getSignedInUid(ctx);

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

  return normalizeLibrary({
    activeGameId: meta.activeGameId || null,
    inProgress,
    completed,
  });
}

export async function syncLibraryToCloud(library) {
  const ctx = await ensureFirebaseContext();
  const uid = getSignedInUid(ctx);
  const normalized = normalizeLibrary(library);

  const playGamesRef = ctx.collection(ctx.db, 'users', uid, 'playGames');
  const existingSnapshot = await ctx.getDocs(playGamesRef);
  const existingIds = new Set();
  existingSnapshot.forEach((docSnap) => existingIds.add(docSnap.id));

  const allRecords = [...normalized.inProgress, ...normalized.completed];
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
    activeGameId: normalized.activeGameId || null,
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
    syncedAt: ctx.serverTimestamp(),
  }, { merge: true });

  await batch.commit();
  return true;
}

export function hasCloudSyncConfig() {
  return hasFirebaseConfig();
}
