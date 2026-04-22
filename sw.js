// ══════════════════════════════════════════════════
//  Service Worker — AP Industry Eau Vitale
//  Cache offline complet
// ══════════════════════════════════════════════════

const CACHE_NAME = 'apindustry-v3';
const OFFLINE_URL = '/index.html';

// Ressources à mettre en cache immédiatement
const PRECACHE_ASSETS = [
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// ── INSTALL : pré-cache les ressources essentielles ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        // Si certains assets manquent, on continue quand même
        console.warn('SW: certains assets non cachés:', err);
        return cache.add('/index.html').catch(() => {});
      });
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE : supprime les vieux caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH : stratégie Network First avec fallback cache ──
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET et Firebase/externes
  if (request.method !== 'GET') return;
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('emailjs.com') ||
      url.hostname.includes('cdnjs.cloudflare.com') ||
      url.hostname.includes('fonts.g') ||
      url.origin !== self.location.origin) {
    // Pour les ressources externes : network only (pas de cache)
    return;
  }

  // Pour les ressources locales : Network First → Cache → Offline page
  event.respondWith(
    fetch(request)
      .then(response => {
        // Mettre en cache la réponse fraîche
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Réseau indisponible → chercher dans le cache
        return caches.match(request).then(cached => {
          if (cached) return cached;
          // Pas dans le cache → retourner la page principale offline
          if (request.destination === 'document') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('', { status: 408, statusText: 'Offline' });
        });
      })
  );
});

// ── MESSAGE : forcer la mise à jour du cache ──
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0]?.postMessage({ success: true });
    });
  }
});
