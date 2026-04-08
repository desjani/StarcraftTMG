const CACHE_VERSION = 'adjutant-mobile-v3';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const APP_SHELL_URLS = [
  '/mobile/',
  '/mobile/index.html',
  '/mobile/mobile.css',
  '/mobile/manifest.webmanifest',
  '/mobile/icon.svg',
  '/mobile/sw.js',
  '/app.js',
  '/lib/cloudSync.js',
  '/lib/firestoreClient.js',
  '/lib/formatter.js',
  '/lib/rosterParser.js',
  '/lib/siteConfig.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith('adjutant-mobile-') && key !== APP_SHELL_CACHE && key !== RUNTIME_CACHE)
        .map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Keep API/Firebase traffic network-first while caching static app shell content.
  const isStaticAsset =
    url.pathname.startsWith('/mobile/')
    || url.pathname.startsWith('/lib/')
    || url.pathname === '/app.js'
    || /\.(?:css|js|json|svg|png|jpg|jpeg|webp|ico)$/.test(url.pathname);

  if (!isStaticAsset) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response && response.ok) {
      const runtime = await caches.open(RUNTIME_CACHE);
      runtime.put(request, response.clone());
    }
    return response;
  })());
});
