const CACHE_NAME = 'watheeq-v1';
const STATIC_CACHE = 'watheeq-static-v1';
const DYNAMIC_CACHE = 'watheeq-dynamic-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
];

// Install Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Strategy: Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip Chrome extensions and external URLs
    if (request.url.startsWith('chrome-extension') ||
        !request.url.startsWith(self.location.origin)) {
        return;
    }

    // API requests: Network first, cache fallback
    if (request.url.includes('/api/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone and cache successful responses
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(request);
                })
        );
        return;
    }

    // Static assets: Cache first, network fallback
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(request)
                .then((response) => {
                    // Cache successful responses
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Return offline page for navigation requests
                    if (request.destination === 'document') {
                        return caches.match('/');
                    }
                    return new Response('Offline', { status: 503 });
                });
        })
    );
});

// Background Sync
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-pending-data') {
        event.waitUntil(syncPendingData());
    }
});

// Push Notifications
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    const data = event.data?.json() || {};
    const title = data.title || 'Watheeq';
    const options = {
        body: data.body || 'إشعار جديد',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        tag: data.tag || 'default',
        requireInteraction: data.requireInteraction || false,
        data: data.data || {},
        actions: [
            { action: 'open', title: 'فتح' },
            { action: 'close', title: 'إغلاق' },
        ],
        dir: 'rtl',
        lang: 'ar',
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.action);

    event.notification.close();

    if (event.action === 'open' || !event.action) {
        const url = event.notification.data?.url || '/';
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then((clientList) => {
                // Focus existing window if available
                for (const client of clientList) {
                    if (client.url === url && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
        );
    }
});

// Helper: Sync Pending Data
async function syncPendingData() {
    try {
        const cache = await caches.open('watheeq-pending');
        const requests = await cache.keys();

        for (const request of requests) {
            try {
                const cachedResponse = await cache.match(request);
                const data = await cachedResponse.json();

                // Retry the request
                await fetch(request.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                // Delete from cache after successful sync
                await cache.delete(request);
                console.log('[SW] Synced:', request.url);
            } catch (error) {
                console.error('[SW] Failed to sync:', request.url, error);
            }
        }

        console.log('[SW] Pending data synced successfully');
    } catch (error) {
        console.error('[SW] Sync failed:', error);
        throw error;
    }
}
