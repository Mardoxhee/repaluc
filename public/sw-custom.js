// Service Worker personnalisé pour améliorer le mode offline

const CACHE_VERSION = 'v1';
const CACHE_NAMES = {
  pages: `pages-cache-${CACHE_VERSION}`,
  api: `api-cache-${CACHE_VERSION}`,
  static: `static-cache-${CACHE_VERSION}`,
  images: `images-cache-${CACHE_VERSION}`,
};

// Événement d'installation
self.addEventListener('install', (event) => {
  console.log('[SW] Installation...');
  
  event.waitUntil(
    caches.open(CACHE_NAMES.pages).then((cache) => {
      return cache.addAll([
        '/',
        '/reparations',
        '/luc',
        '/offline.html',
      ]).catch((err) => {
        console.error('[SW] Erreur lors du pré-cache:', err);
      });
    })
  );
  
  // Force le nouveau service worker à devenir actif immédiatement
  self.skipWaiting();
});

// Événement d'activation
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Supprimer les anciens caches
          if (!Object.values(CACHE_NAMES).includes(cacheName)) {
            console.log('[SW] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Prendre le contrôle immédiatement
  return self.clients.claim();
});

// Événement de fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-HTTP
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Stratégie pour les pages HTML
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Retourner la version en cache immédiatement
            console.log('[SW] Page servie depuis le cache:', url.pathname);
            
            // Mettre à jour le cache en arrière-plan
            fetch(request)
              .then((response) => {
                if (response && response.status === 200) {
                  caches.open(CACHE_NAMES.pages).then((cache) => {
                    cache.put(request, response.clone());
                  });
                }
              })
              .catch(() => {
                // Réseau indisponible, on garde la version en cache
              });
            
            return cachedResponse;
          }
          
          // Pas en cache, essayer le réseau
          return fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAMES.pages).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            })
            .catch(() => {
              // Réseau indisponible et pas en cache, retourner la page offline
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }
  
  // Stratégie pour les API
  if (url.hostname.includes('10.140.0')) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          // Toujours retourner le cache d'abord si disponible
          if (cachedResponse) {
            console.log('[SW] API servie depuis le cache:', url.pathname);
            
            // Mettre à jour en arrière-plan
            fetch(request)
              .then((response) => {
                if (response && response.status === 200) {
                  caches.open(CACHE_NAMES.api).then((cache) => {
                    cache.put(request, response.clone());
                  });
                }
              })
              .catch(() => {});
            
            return cachedResponse;
          }
          
          // Pas en cache, essayer le réseau avec timeout
          return fetchWithTimeout(request, 5000)
            .then((response) => {
              if (response && response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAMES.api).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            })
            .catch(() => {
              // Retourner une réponse vide en cas d'erreur
              return new Response(JSON.stringify({ error: 'Offline', cached: false }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              });
            });
        })
    );
    return;
  }
  
  // Stratégie pour les images
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAMES.images).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            })
            .catch(() => {
              // Retourner une image placeholder si nécessaire
              return new Response('', { status: 404 });
            });
        })
    );
    return;
  }
  
  // Stratégie pour les ressources statiques (JS, CSS, fonts)
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    url.pathname.match(/\.(js|css|woff2?|ttf|otf|eot)$/)
  ) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAMES.static).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            });
        })
    );
    return;
  }
  
  // Par défaut, laisser passer la requête
  event.respondWith(fetch(request));
});

// Fonction helper pour fetch avec timeout
function fetchWithTimeout(request, timeout) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout)
    )
  ]);
}

// Écouter les messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('[SW] Service Worker chargé');
