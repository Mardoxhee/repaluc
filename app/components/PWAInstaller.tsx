'use client';

import { useEffect } from 'react';

const PWAInstaller: React.FC = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Attendre que la page soit complètement chargée
      window.addEventListener('load', () => {
        // Le service worker principal est déjà enregistré par next-pwa
        // On va juste s'assurer que les pages sont bien en cache
        
        navigator.serviceWorker.ready.then((registration) => {
          console.log('[PWA] Service Worker prêt');
          
          // Pré-cacher les pages importantes
          const pagesToCache = [
            '/',
            '/reparations',
            '/luc',
          ];
          
          // Ouvrir le cache et ajouter les pages
          caches.open('manual-precache-v1').then((cache) => {
            pagesToCache.forEach((url) => {
              fetch(url)
                .then((response) => {
                  if (response.ok) {
                    cache.put(url, response);
                    console.log(`[PWA] Page mise en cache: ${url}`);
                  }
                })
                .catch((err) => {
                  console.log(`[PWA] Impossible de cacher ${url}:`, err);
                });
            });
          });
        });
        
        // Écouter les mises à jour du service worker
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[PWA] Service Worker mis à jour');
          // Optionnel : recharger la page
          // window.location.reload();
        });
      });
    }
  }, []);

  return null; // Ce composant ne rend rien
};

export default PWAInstaller;
