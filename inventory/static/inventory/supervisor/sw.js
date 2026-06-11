/* Supervisor PWA service worker — static assets only; no HTML shell caching. */

const CACHE_NAME = 'supervisor-pwa-v1';
const STATIC_ASSETS = [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (event.request.method !== 'GET') return;
    if (url.pathname.includes('/inventory/supervisor/') && !url.pathname.endsWith('.js')) {
        return;
    }
    if (url.pathname.startsWith('/static/')) {
        event.respondWith(
            caches.match(event.request).then((cached) => cached || fetch(event.request))
        );
    }
});

self.addEventListener('push', (event) => {
    let data = { title: 'Stock sheet reminder', body: 'Tap to upload yesterday\'s sheet.', url: '/inventory/supervisor/' };
    try {
        if (event.data) {
            data = { ...data, ...event.data.json() };
        }
    } catch (e) { /* use defaults */ }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/favicon.png',
            badge: '/favicon.png',
            data: { url: data.url || '/inventory/supervisor/' },
            tag: 'supervisor-upload-reminder',
            renotify: true,
            requireInteraction: true,
            vibrate: [200, 100, 200],
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = (event.notification.data && event.notification.data.url) || '/inventory/supervisor/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes('/inventory/supervisor') && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
