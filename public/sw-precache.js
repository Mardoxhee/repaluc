// Liste des URLs à pré-cacher pour fonctionnement offline
const PRECACHE_URLS = [
  '/',
  '/reparations',
  '/luc',
  '/offline.html',
];

// Fonction pour pré-cacher les URLs au premier chargement
self.addEventListener('install', (event) => {
  console.log('[SW Precache] Installation et pré-cache des pages...');
  
  event.waitUntil(
    caches.open('precache-v1').then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
       console.log('[SW Precache] Erreur lors du pré-cache:', err);
      });
    })
  );
  
  self.skipWaiting();
});

// Activer immédiatement
self.addEventListener('activate', (event) => {
  console.log('[SW Precache] Activation...');
  event.waitUntil(self.clients.claim());
});

console.log('[SW Precache] Script chargé');
