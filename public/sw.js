// public/sw.js
const CACHE_NAME = 'baby-bear-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

const urlsToCache = [
  '/',
  '/offline',
  '/all-products',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add your key static assets here
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all pages
      self.clients.claim()
    ])
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Don't cache if not successful
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Cache successful responses
            const responseToCache = networkResponse.clone();
            
            // Cache different types of resources appropriately
            if (request.destination === 'document' || 
                request.destination === 'script' || 
                request.destination === 'style' ||
                request.destination === 'image') {
              
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            }

            return networkResponse;
          })
          .catch(() => {
            // If both cache and network fail
            if (request.destination === 'document') {
              return caches.match('/offline');
            }
            
            // For images, return a placeholder
            if (request.destination === 'image') {
              return new Response('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#ddd"/><text x="50%" y="50%" text-anchor="middle" dy=".3em">Image offline</text></svg>', {
                headers: { 'Content-Type': 'image/svg+xml' }
              });
            }
          });
      })
  );
});

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  // Handle background sync tasks here
});

// Push notifications (if you plan to add them)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received', event);
  // Handle push notifications here
});