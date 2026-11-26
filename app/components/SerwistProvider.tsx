'use client';

import { useEffect } from 'react';

export default function SerwistProvider() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      let disposed = false;
      let updateTimer: number | undefined;
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          if (disposed || !registration) return;
          console.log('✅ Service Worker enregistré:', registration.scope);

          // Vérifier les mises à jour toutes les heures
          updateTimer = window.setInterval(() => {
            void registration.update().catch(() => undefined);
          }, 60 * 60 * 1000);
        })
        .catch((error) => {
          console.error('❌ Erreur Service Worker:', error);
        });

      // Demande la persistance du stockage pour empêcher le navigateur
      // d'évincer les caches du SW et IndexedDB sous pression de stockage
      // ou après une longue inactivité. Indispensable pour un mode offline
      // illimité.
      try {
        if (navigator.storage && typeof navigator.storage.persist === 'function') {
          navigator.storage.persisted().then((already) => {
            if (already) {
              console.log('💾 Stockage déjà persistant');
              return;
            }
            navigator.storage.persist().then((granted) => {
              console.log(granted ? '💾 Stockage persistant accordé' : '⚠️ Stockage non persistant (peut être évincé)');
            }).catch(() => undefined);
          }).catch(() => undefined);
        }
      } catch {
        // ignore
      }

      return () => {
        disposed = true;
        window.clearInterval(updateTimer);
      };
    }
  }, []);

  return null;
}
