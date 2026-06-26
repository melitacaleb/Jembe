// sw.js — Farmers Connect service worker
const CACHE_NAME = 'farmers-connect-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.css',
  '/js/app.js',
  '/js/services/api.js',
  '/js/services/router.js',
  '/js/services/store.js',
  '/js/views/AuthView.js',
  '/js/views/FeedView.js',
  '/js/views/MarketplaceView.js',
  '/js/views/EducationView.js',
  '/js/views/ProfileView.js',
  '/js/views/NavView.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for API calls, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => new Response(JSON.stringify({ error: 'Offline' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 503,
      }))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((resp) => {
      const respClone = resp.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone));
      return resp;
    }).catch(() => caches.match('/index.html')))
  );
});
