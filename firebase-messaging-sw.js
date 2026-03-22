// ══════════════════════════════════════════════
// firebase-messaging-sw.js
// Service Worker pour les notifications Push TEV
// Uploadez ce fichier à la RACINE de votre dépôt GitHub
// (même endroit que index.html)
// ══════════════════════════════════════════════

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyDq6o-a00NDyMe-Nzmu7uPXSAQxaK6S3g0",
  authDomain:        "lineops-production.firebaseapp.com",
  databaseURL:       "https://lineops-production-default-rtdb.firebaseio.com",
  projectId:         "lineops-production",
  storageBucket:     "lineops-production.firebasestorage.app",
  messagingSenderId: "275802402542",
  appId:             "1:275802402542:web:becc1b156a3f203b190dff"
});

const messaging = firebase.messaging();

// ── Notification quand l'app est en arrière-plan ou fermée ──
messaging.onBackgroundMessage(payload => {
  const title = payload.notification?.title || '🔔 TEV';
  const body  = payload.notification?.body  || 'Nouvelle notification';

  self.registration.showNotification(title, {
    body,
    icon:  '/icône-192.png',
    badge: '/icône-192.png',
    tag:   'tev-notification',
    renotify: true,
    requireInteraction: false,
    data: payload.data || {},
    actions: [
      { action: 'open',    title: '📱 Ouvrir l\'app' },
      { action: 'dismiss', title: '✕ Ignorer'        }
    ]
  });
});

// ── Clic sur la notification → ouvrir l'app ──
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Si l'app est déjà ouverte → la mettre au premier plan
      for (const client of clientList) {
        if (client.url.includes('alban3886.github.io') && 'focus' in client) {
          return client.focus();
        }
      }
      // Sinon ouvrir l'app
      if (clients.openWindow) {
        return clients.openWindow('https://alban3886.github.io');
      }
    })
  );
});

// ── Écouter la file pushQueue dans Firebase Database ──
// (pour les notifications déclenchées depuis le site)
self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', e  => e.waitUntil(clients.claim()));
