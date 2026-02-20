'use client';

import { useEffect, useState } from 'react';
import { FiDownload, FiX } from 'react-icons/fi';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstaller: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIosStandalone = (navigator as any)?.standalone === true;
      return isStandalone || isIosStandalone;
    };

    // Vérifier si l'app est déjà installée
    if (checkInstalled()) {
      setIsInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
      console.log('[PWA] Application déjà installée');
    }

    // Capturer l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();

      if (checkInstalled()) {
        setIsInstalled(true);
        setShowInstallButton(false);
        setDeferredPrompt(null);
        return;
      }

      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setShowInstallButton(true);
      console.log('[PWA] Prompt d\'installation disponible');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Détecter si l'app a été installée
    const handleAppInstalled = () => {
      console.log('[PWA] Application installée avec succès');
      setShowInstallButton(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Service Worker et cache
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.ready.then((registration) => {
          console.log('[PWA] Service Worker prêt');

          const pagesToCache = [
            '/',
            '/reparations',
            '/luc',
          ];

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

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[PWA] Service Worker mis à jour');
        });
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('[PWA] Pas de prompt disponible');
      return;
    }

    // Afficher le prompt d'installation
    deferredPrompt.prompt();

    // Attendre la réponse de l'utilisateur
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Choix de l'utilisateur: ${outcome}`);

    if (outcome === 'accepted') {
      console.log('[PWA] Installation acceptée');
    } else {
      console.log('[PWA] Installation refusée');
    }

    // Réinitialiser le prompt
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const handleDismiss = () => {
    setShowInstallButton(false);
    // Garder le prompt pour plus tard
    console.log('[PWA] Bannière d\'installation masquée');
  };

  // Ne rien afficher si l'app est installée ou si le bouton ne doit pas être affiché
  if (isInstalled || !showInstallButton) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fadeInUp">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary-50 rounded-lg">
            <FiDownload className="text-primary-600" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              Installer l'application
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Installez l'app pour un accès rapide et hors ligne
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 text-white rounded-lg font-medium transition-all hover:shadow-md"
                style={{ backgroundColor: '#901c67' }}
              >
                Installer
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Plus tard
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <FiX className="text-gray-400" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstaller;
