// V17.2 : tri chronologique, filtres sources et lecture intégrée.
const CACHE = 'mon-sport-v17-2';
const ASSETS = [
  './',
  './index.html',
  './style.css?v=17.2.0',
  './style-light.css?v=17.2.0',
  './src.js?v=17.2.0',
  './session-loader.js?v=17.2.0',
  './tennis-history.js?v=17.2.0',
  './audit-2026.js?v=17.2.0',
  './audit-espn-2026.js?v=17.2.0',
  './audit-ui.js?v=17.2.0',
  './agenda-model.js?v=17.2.0',
  './agenda-ui.js?v=17.2.0',
  './agenda-fetch.js?v=17.2.0',
  './photos.js?v=17.2.0',
  './stats-view.js?v=17.2.0',
  './sports-profiles.js?v=17.2.0',
  './match-details.js?v=17.2.0',
  './version.js?v=17.2.0',
  './event-details.js?v=17.2.0',
  './news-view.js?v=17.2.0',
  './verified-program.js?v=17.2.0',
  './verified-extra-v11.js?v=17.2.0',
  './coverage-v11.js?v=17.2.0',
  './rankings-view.js?v=17.2.0',
  './sports-articles.js?v=17.2.0',
  './sports-media.js?v=17.2.0',
  './source-icons.js?v=17.2.0',
  './data/jeu-set-et-maths-bundle.js?v=17.2.0', // Données embarquées, chargées sans fetch JSON.
  './data/jeu-set-et-maths.json', // Dernier relevé vérifié : disponible hors connexion sur Android.
  './manifest.webmanifest',
  './icons/sources/ffl.png',
  './icons/sources/jsm.png',
  './icons/sources/franceinfo.png',
  './icons/sources/trashtalk.png',
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

// Réseau d'abord pour le document et les relevés ; cache d'abord pour les scripts
// et styles versionnés de la PWA. Les pages ouvertes ne sont jamais rechargées.
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
