// This is a simple service worker for cache management
// It uses the Cache-then-Network strategy for assets but ensures HTML is fresh

const CACHE_NAME = 'customer-management-cache-v2-no-api-cache';
const APP_VERSION = '%REACT_APP_VERSION%';

// Assets to cache immediately on service worker install
const STATIC_ASSETS = [
  '/favicon.ico',
  '/styles.css',
];

// Authentication paths and SPA routes to NEVER cache
const AUTH_PATHS = [
  '/auth',
  '/login',
  '/logout',
  '/documents',
  '/chatbot',
  '/document-chat',
  '/mcp-chat',
  '/mcp-tools',
  '/mcp-analytics',
  '/Upload',
  '/file-list',
  '/ai-workflow',
  '/notifications',
  'login.microsoftonline.com',
  'graph.microsoft.com'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('Service Worker activated with cache:', CACHE_NAME);
        return self.clients.claim(); // Take control of all clients
      })
  );
});

// Fetch event - handle requests with appropriate caching strategy
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Skip cross-origin requests
  if (requestUrl.origin !== location.origin) {
    return;
  }

  // Skip authentication requests
  if (AUTH_PATHS.some(path => event.request.url.includes(path))) {
    return;
  }

  // HTML files and SPA routes - always fetch from network to avoid caching issues
  if (requestUrl.pathname.endsWith('.html') || 
      requestUrl.pathname === '/' ||
      AUTH_PATHS.some(path => requestUrl.pathname.includes(path))) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Don't cache HTML or SPA routes to avoid routing issues
          return response;
        })
        .catch(() => {
          // For HTML fallback, return the main index.html from cache
          if (requestUrl.pathname.endsWith('.html') || requestUrl.pathname === '/') {
            return caches.match('/');
          }
          // For SPA routes, don't provide fallback to avoid routing conflicts
          return new Response('', { status: 200 });
        })
    );
    return;
  }
  
  // For JS and CSS files - cache-first for performance, but revalidate
  if (requestUrl.pathname.endsWith('.js') || requestUrl.pathname.endsWith('.css')) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          const fetchPromise = fetch(event.request)
            .then(networkResponse => {
              // Update cache with fresh version
              if (networkResponse.ok) {
                try {
                  caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                  });
                } catch (error) {
                  // Response body already used, skip caching
                }
              }
              return networkResponse;
            });
          
          // Return cached response immediately, then update cache in background
          return cachedResponse || fetchPromise;
        })
    );
    return;
  }
  
  // For other assets - standard cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            // Don't cache responses that aren't successful
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            try {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            } catch (error) {
              // Response body already used, skip caching
            }

            return response;
          });
      })
  );
});

// Listen for version change messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'VERSION_CHANGE') {
    console.log('Version change detected in service worker, clearing caches');
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      // Tell clients to refresh
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({
          type: 'REFRESH_PAGE'
        }));
      });
    });
  }
}); 