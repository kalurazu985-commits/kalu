/* KALU service worker — caches the static app shell only.
 * Never touches /api, /socket.io, non-GET requests, authenticated requests
 * or cross-origin requests, so login, chat, uploads and real-time messaging
 * are always served directly by the network. */
const VERSION = 'v1';
const SHELL_CACHE = `kalu-shell-${VERSION}`;
const ASSET_CACHE = `kalu-assets-${VERSION}`;
const SHELL_URLS = [
  '/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/kalu-192.png',
  '/icons/kalu-512.png',
  '/icons/kalu-maskable-512.png',
  '/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      // Tolerate a single failed URL so install never blocks the app.
      .then((cache) => Promise.all(SHELL_URLS.map((u) => cache.add(u).catch(() => {}))))
  );
  // Safe to activate immediately: navigations are network-first and build
  // assets are content-hashed, so a new worker never serves stale code.
  self.skipWaiting();
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((k) => k.startsWith('kalu-') && k !== SHELL_CACHE && k !== ASSET_CACHE)
        .map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const isBypassed = (req, url) =>
  req.method !== 'GET' ||
  url.origin !== self.location.origin ||
  url.pathname.startsWith('/api') ||
  url.pathname.startsWith('/socket.io') ||
  req.headers.has('authorization') ||
  req.headers.has('range') ||
  url.pathname === '/service-worker.js';

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (isBypassed(req, url)) return; // default browser/network handling

  // Page navigations: network first, cached shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && url.pathname === '/') {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put('/', copy));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match('/', { cacheName: SHELL_CACHE });
          return cached || new Response(
            '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
            '<title>KALU</title><body style="margin:0;height:100vh;display:grid;place-items:center;background:#0b0d12;color:#e8eaf0;font-family:system-ui,sans-serif;text-align:center">' +
            '<div><h1>KALU</h1><p>You are offline. Reconnect to keep chatting.</p></div>',
            { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        })
    );
    return;
  }

  // Hashed build assets and static files: cache first, fill on miss.
  const isStatic = url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/') ||
    url.pathname === '/favicon.svg' || url.pathname === '/manifest.webmanifest';
  if (isStatic) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        // Only cache real files (the server falls back to index.html for unknown paths).
        const type = res.headers.get('content-type') || '';
        if (res.ok && !type.includes('text/html')) {
          const copy = res.clone();
          caches.open(ASSET_CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }))
    );
  }
});
