// ══════════════════════════════════════════════
// firebase-messaging-sw.js (PRO VERSION)
// Notifications Push TEV / TogoSheets Pro
// ══════════════════════════════════════════════

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDq6o-a00NDyMeN3mu7uPXSAQxaK6S3g0",
  authDomain: "lineops-production.firebaseapp.com",
  databaseURL: "https://lineops-production-default-rtdb.firebaseio.com",
  projectId: "lineops-production",
  storageBucket: "lineops-production.firebasestorage.app",
  messagingSenderId: "275802402542",
  appId: "1:275802402542:web:becc1b156a3f203b190dff"
});

const messaging = firebase.messaging();


// ─────────────────────────────────────────────
// NOTIFICATION BACKGROUND
// ─────────────────────────────────────────────
messaging.onBackgroundMessage(payload => {

  const title = payload.notification?.title || '🔔 TogoSheets';
  const body  = payload.notification?.body  || 'Nouvelle notification';

  // 🔥 IMPORTANT: page par défaut (modifiable)
  const url = payload.data?.url || '/index.html';

  self.registration.showNotification(title, {
    body,
    icon: '/icône-192.png',
    badge: '/icône-192.png',
    tag: 'togosheets-notification',
    renotify: true,
    requireInteraction: false,

    data: {
      url: url
    },

    actions: [
      { action: 'open', title: '📱 Ouvrir' },
      { action: 'dismiss', title: '✕ Fermer' }
    ]
  });
});


// ─────────────────────────────────────────────
// CLICK NOTIFICATION
// ─────────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/index.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {

      // 🔥 si déjà ouvert
      for (const client of clientList) {
        if (client.url.includes('alban3886.github.io') && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }

      // 🔥 sinon ouvrir
      return clients.openWindow('https://alban3886.github.io' + targetUrl);
    })
  );
});


// ─────────────────────────────────────────────
// INSTALL / ACTIVATE
// ─────────────────────────────────────────────
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
