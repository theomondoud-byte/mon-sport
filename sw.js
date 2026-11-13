// V14 : classements et flux d'articles sportifs, nouveaux modules en précache.
const CACHE = 'mon-sport-v15-0';
const ASSETS = [
  './',
  './index.html',
  './style.css?v=15.0.0',
  './src.js?v=15.0.0',
  './session-loader.js?v=14.9.0',
  './tennis-history.js?v=14.0.0',
  './audit-2026.js?v=14.0.0',
  './audit-espn-2026.js?v=14.0.0',
  './audit-ui.js?v=14.0.0',
  './agenda-model.js?v=15.0.0',
  './agenda-ui.js?v=15.0.0',
  './agenda-fetch.js?v=14.0.0',
  './photos.js?v=14.0.0',
  './stats-view.js?v=14.9.0',
  './match-details.js?v=14.0.0',
  './sports-profiles.js?v=14.0.0',
  './event-details.js?v=15.0.0',
  './news-view.js?v=15.0.0',
  './verified-program.js?v=14.0.0',
  './verified-extra-v11.js?v=14.0.0',
  './coverage-v11.js?v=14.0.0',
  './rankings-view.js?v=14.9.0',
  './sports-articles.js?v=15.0.0',
  './sports-media.js?v=14.0.0',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
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
    // Conserver les pages déjà ouvertes sous leur contrôleur actuel : aucun écran ne redémarre.
  })());
});

// Réseau d'abord, y compris pour index.html et src.js.
// Le cache reste disponible pour la consultation hors ligne.
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const url = new URL(request.url);
    // Scripts et styles versionnés : réponse instantanée depuis le précache.
    // Les documents et fichiers de classement restent en réseau d'abord.
    const versionedAsset=request.mode!=='navigate'&&
      /\.(?:js|css|png|svg|webp|webmanifest)$/i.test(url.pathname);
    if(versionedAsset){
      const saved = await caches.match(request);
      if(saved)return saved;
    }
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
