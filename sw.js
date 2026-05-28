/**
 * Explore Three Cities — Service Worker
 * Cache-first strategy for full offline support.
 * Uses relative paths for subdirectory deployment compatibility.
 */

const CACHE_NAME = 'explore3cities-v1';

/* ─── Install: Precache app shell ──── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Use relative URLs from the SW scope
        const base = self.registration.scope;
        const urls = [
          '',
          'index.html',
          'style.css',
          'js/data.js',
          'js/favorites.js',
          'js/app.js',
          'manifest.json',
          'images/icons/icon-192.png',
          'images/icons/icon-512.png',
        ].map(url => new URL(url, base).href);

        return cache.addAll(urls);
      })
      .then(() => self.skipWaiting())
  );
});

/* ─── Activate: Clean old caches ───── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

/* ─── Fetch: Cache-first, network fallback ─── */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (except Google Fonts)
  if (!request.url.startsWith(self.location.origin)) {
    // For Google Fonts: network-first with cache fallback
    if (request.url.includes('fonts.googleapis.com') || request.url.includes('fonts.gstatic.com')) {
      event.respondWith(
        caches.open(CACHE_NAME).then(cache =>
          fetch(request)
            .then(response => {
              cache.put(request, response.clone());
              return response;
            })
            .catch(() => cache.match(request))
        )
      );
    }
    return;
  }

  // Same-origin: cache-first
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;

        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
      .catch(() => {
        // Fallback for navigation requests
        if (request.mode === 'navigate') {
          return caches.match(new URL('index.html', self.registration.scope).href);
        }
      })
  );
});
