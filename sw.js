// V4.1 : ne pas conserver une ancienne version sur Android.
const CACHE = 'mon-sport-v6-0';
const ASSETS = [
  './', './index.html', './style.css?v=6.0.0', './src.js?v=6.0.0', './tennis-history.js?v=6.0.0', './audit-2026.js?v=6.0.0', './audit-espn-2026.js?v=6.0.0', './audit-ui.js?v=6.0.0',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('mon-sport-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

// Réseau d'abord, y compris pour index.html et src.js.
// Le cache reste disponible pour la consultation hors ligne.
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request, {cache: 'no-store'});
      if (response.ok) {
        const cache = await caches.open(CACHE);
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      const saved = await caches.match(request, {ignoreSearch: true});
      if (saved) return saved;
      if (request.mode === 'navigate') return (await caches.match('./index.html')) || Response.error();
      return Response.error();
    }
  })());
});
