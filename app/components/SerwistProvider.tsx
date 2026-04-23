'use client';

import { useEffect } from 'react';

export default function SerwistProvider() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker enregistré:', registration.scope);

          // Vérifier les mises à jour toutes les heures
          setInterval(() => {
            registration.update();
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

      // Écouter les changements de statut en ligne/hors ligne
      window.addEventListener('online', () => {
        console.log('🌐 Connexion rétablie');
        // Optionnel : afficher une notification
      });

      window.addEventListener('offline', () => {
        console.log('📡 Connexion perdue - Mode hors ligne');
        // Optionnel : afficher une notification
      });
    }
  }, []);

  return null;
}
