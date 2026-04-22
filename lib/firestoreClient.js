/**
 * Delete a roster by seed from Firestore.
 * @param {string} seed
 * @returns {Promise<void>}
 */
export async function deleteRoster(seed) {
  const baseUrl = getBaseUrlForSeed(seed);
  const url = `${baseUrl}/shared_rosters/${encodeURIComponent(seed.trim().toUpperCase())}?key=${FIREBASE_API_KEY}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error?.message ?? `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
}
/**
 * Firebase Firestore REST API client for StarCraft TMG.
 * The API key is the public client-side key embedded in the app's source code.
 * Access is restricted by Firestore security rules server-side.
 */
import { loadGameData } from './gameData.js';
import { cleanSeed } from './seedCleaner.js';

const FIREBASE_API_KEY = 'AIzaSyDHRhS4FIO_1s_2Tn2C77noJRgbs-y_mks';
const OFFICIAL_PROJECT  = 'starcrafttmgbeta';
const OFFICIAL_DATABASE = 'starcrafttmgbeta';
const OFFICIAL_BASE_URL = `https://firestore.googleapis.com/v1/projects/${OFFICIAL_PROJECT}/databases/${OFFICIAL_DATABASE}/documents`;

const USER_PROJECT  = 'starcrafttmg-dc616';
const USER_DATABASE = '(default)';
const USER_BASE_URL = `https://firestore.googleapis.com/v1/projects/${USER_PROJECT}/databases/${USER_DATABASE}/documents`;

// Helper to pick correct base URL for seed
function getBaseUrlForSeed(seed) {
  const sixDigit = /^[A-Z0-9]{6}$/.test(seed);
  return sixDigit ? OFFICIAL_BASE_URL : USER_BASE_URL;
}

const BASE_URL = getBaseUrlForSeed('TRN9X2');

// ─── Firestore value flattener ────────────────────────────────────────────────

/**
 * Recursively convert a Firestore typed value into a plain JS value.
 * Handles stringValue, integerValue, doubleValue, booleanValue,
 * timestampValue, nullValue, mapValue, and arrayValue.
 */
export function flattenValue(val) {
  if (val === null || typeof val !== 'object') return val;
  if ('stringValue'    in val) return val.stringValue;
  if ('integerValue'   in val) return parseInt(val.integerValue, 10);
  if ('doubleValue'    in val) return val.doubleValue;
  if ('booleanValue'   in val) return val.booleanValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue'      in val) return null;
  if ('mapValue' in val) {
    const fields = val.mapValue.fields ?? {};
    return Object.fromEntries(
      Object.entries(fields).map(([k, v]) => [k, flattenValue(v)])
    );
  }
  if ('arrayValue' in val) {
    return (val.arrayValue.values ?? []).map(flattenValue);
  }
  return val;
}

/**
 * Flatten all top-level fields in a Firestore document response.
 */
export function flattenDocument(doc) {
  const fields = doc.fields ?? {};
  const flattened = Object.fromEntries(
    Object.entries(fields).map(([k, v]) => [k, flattenValue(v)])
  );
  if (typeof doc.name === 'string') {
    flattened.id = doc.name.substring(doc.name.lastIndexOf('/') + 1);
  }
  return flattened;
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

/**
 * Fetch and flatten a single Firestore document.
 * @param {string} collection
 * @param {string} id
 * @returns {Promise<object>} Flattened document fields
 */
export async function fetchDocument(collection, id) {
  const baseUrl = getBaseUrlForSeed(id);
  const url = `${baseUrl}/${collection}/${encodeURIComponent(id)}?key=${FIREBASE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error?.message ?? `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  const doc = await res.json();
  return flattenDocument(doc);
}

/**
 * Fetch a saved army roster by its seed code.
 * Seed is normalised to uppercase before lookup.
 * @param {string} seed  e.g. "TRN9X2"
 * @returns {Promise<object>} Flattened roster document
 */
export async function fetchRoster(seed) {
  const flat = await fetchDocument('shared_rosters', seed.trim().toUpperCase());
  return cleanSeed(flat);
}

/**
 * Resolve tactical card documents from the local game-data repository.
 * @param {string[]} cardIds
 * @param {string} [faction]
 * @returns {Promise<Array<{id:string, name:string, slots:Record<string, number>}>>}
 */
export async function fetchTacticalCards(cardIds, faction = '') {
  const gameData = await loadGameData();
  const ids = [...new Set((cardIds ?? []).filter(Boolean))];
  return ids
    .map((id) => gameData.getTacticalCard(faction, id))
    .filter(Boolean)
    .map((card) => ({
      id: card.id ?? '',
      name: card.name ?? '',
      slots: card.slots ?? {},
      faction: typeof card.faction === 'string' ? card.faction : '',
      tags: typeof card.tags === 'string' ? card.tags : '',
      frontUrl: typeof card.frontUrl === 'string' ? card.frontUrl : '',
      isUnique: Boolean(card.isUnique),
      resource: typeof card.resource === 'number' ? card.resource : null,
      gasCost: typeof card.gasCost === 'number'
        ? card.gasCost
        : typeof card.gas === 'number'
          ? card.gas
          : typeof card.costGas === 'number'
            ? card.costGas
            : typeof card.cost === 'number'
              ? card.cost
              : null,
      abilities: Array.isArray(card.boosts)
        ? card.boosts
          .map((boost) => {
            const name = String(boost?.name ?? '').trim();
            const text = String(boost?.description ?? boost?.text ?? '').trim();
            if (!name && !text) return null;
            return { name, text };
          })
          .filter(Boolean)
        : [],
    }));
}
