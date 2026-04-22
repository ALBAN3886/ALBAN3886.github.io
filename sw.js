// ══════════════════════════════════════════════════
//  Service Worker — AP Industry Eau Vitale
//  v4 — Cache offline robuste
// ══════════════════════════════════════════════════

const CACHE_NAME = 'apindustry-v4';

// ── INSTALL : cache l'index.html en priorité ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.add('/index.html'))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

// ── ACTIVATE : supprime les vieux caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH ──
self.addEventListener('fetch', event => {
  const { request } = event;

  // Ignorer non-GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Ressources externes (Firebase, fonts, CDN...) :
  // → On tente le réseau, si offline on retourne une réponse vide propre
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response('', {
          status: 503,
          statusText: 'Offline',
          headers: { 'Content-Type': 'text/plain' }
        })
      )
    );
    return;
  }

  // Ressources locales : Cache First → Network → Fallback index.html
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        // Rafraîchir en arrière-plan
        fetch(request).then(fresh => {
          if (fresh && fresh.status === 200) {
            caches.open(CACHE_NAME).then(c => c.put(request, fresh));
          }
        }).catch(() => {});
        return cached;
      }

      // Pas en cache → réseau
      return fetch(request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
        }
        return response;
      }).catch(() => {
        // Réseau et cache indisponibles → page principale
        if (request.destination === 'document' || request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
