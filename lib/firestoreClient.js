/**
 * Firebase Firestore REST API client for StarCraft TMG.
 * The API key is the public client-side key embedded in the app's source code.
 * Access is restricted by Firestore security rules server-side.
 */

const FIREBASE_API_KEY = 'AIzaSyDHRhS4FIO_1s_2Tn2C77noJRgbs-y_mks';
const PROJECT  = 'starcrafttmgbeta';
const DATABASE = 'starcrafttmgbeta';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/${DATABASE}/documents`;

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
  return Object.fromEntries(
    Object.entries(fields).map(([k, v]) => [k, flattenValue(v)])
  );
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

/**
 * Fetch and flatten a single Firestore document.
 * @param {string} collection
 * @param {string} id
 * @returns {Promise<object>} Flattened document fields
 */
export async function fetchDocument(collection, id) {
  const url = `${BASE_URL}/${collection}/${encodeURIComponent(id)}?key=${FIREBASE_API_KEY}`;
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
  return fetchDocument('shared_rosters', seed.trim().toUpperCase());
}

/**
 * Fetch tactical card documents by ID.
 * Missing cards are skipped (not treated as fatal).
 * @param {string[]} cardIds
 * @returns {Promise<Array<{id:string, name:string, slots:Record<string, number>}>>}
 */
export async function fetchTacticalCards(cardIds) {
  const ids = [...new Set((cardIds ?? []).filter(Boolean))];
  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        const doc = await fetchDocument('tactical_cards', id);
        return {
          id,
          name: doc.name ?? id,
          slots: doc.slots ?? {},
          resource: typeof doc.resource === 'number' ? doc.resource : null,
          // Tactical card docs currently store this as "cost".
          gasCost: typeof doc.gasCost === 'number'
            ? doc.gasCost
            : typeof doc.gas === 'number'
              ? doc.gas
              : typeof doc.costGas === 'number'
                ? doc.costGas
                : typeof doc.cost === 'number'
                  ? doc.cost
                  : null,
        };
      } catch {
        return null;
      }
    })
  );
  return results.filter(Boolean);
}
