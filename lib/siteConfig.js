const DEFAULT_PUBLIC_WEB_ORIGIN = 'https://scadjutant.com';
const DEFAULT_PUBLIC_WEB_HOST = 'scadjutant.com';
const DEFAULT_FIREBASE_AUTH_DOMAIN = 'starcrafttmg-dc616.firebaseapp.com';

function normalizeHost(hostname) {
  return String(hostname || '').trim().toLowerCase();
}

function normalizeOrigin(origin) {
  const fallback = DEFAULT_PUBLIC_WEB_ORIGIN;
  const candidate = String(origin || fallback).trim() || fallback;
  try {
    const url = new URL(candidate);
    return url.origin.replace(/\/+$/, '');
  } catch (_) {
    return fallback;
  }
}

export function getPublicWebOrigin(origin = DEFAULT_PUBLIC_WEB_ORIGIN) {
  return normalizeOrigin(origin);
}

export function isCanonicalPublicHost(hostname) {
  const normalized = normalizeHost(hostname);
  return normalized === DEFAULT_PUBLIC_WEB_HOST || normalized === `www.${DEFAULT_PUBLIC_WEB_HOST}`;
}

export function isLocalDevelopmentHost(hostname) {
  const normalized = normalizeHost(hostname);
  return normalized === 'localhost' || normalized === '127.0.0.1';
}

export function getFirebaseAuthDomain(hostname = undefined) {
  const normalized = normalizeHost(hostname);
  if (isCanonicalPublicHost(normalized)) {
    return normalized;
  }
  return DEFAULT_FIREBASE_AUTH_DOMAIN;
}

export function buildPublicRosterUrl(seed, origin = DEFAULT_PUBLIC_WEB_ORIGIN) {
  const url = new URL('/', getPublicWebOrigin(origin));
  const normalizedSeed = String(seed || '').trim().toUpperCase();
  if (normalizedSeed) {
    url.searchParams.set('tab', 'roster');
    url.searchParams.set('s', normalizedSeed);
  }
  return url.toString();
}

export {
  DEFAULT_FIREBASE_AUTH_DOMAIN,
  DEFAULT_PUBLIC_WEB_HOST,
  DEFAULT_PUBLIC_WEB_ORIGIN,
};