'use client';

import React, { useState, useEffect, useRef } from 'react';
import { WifiOff, Wifi, X } from 'lucide-react';

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hideNotification = () => {
    setShowNotification(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    // Vérifier l'état initial
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      // Effacer le timeout précédent s'il existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
      // Effacer le timeout précédent s'il existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setShowNotification(false), 3000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!showNotification) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 transition-all duration-300 ${isOnline
          ? 'bg-green-500 text-white'
          : 'bg-orange-500 text-white'
        }`}
      style={{
        animation: showNotification ? 'slideIn 0.3s ease-out' : 'none',
      }}
    >
      {isOnline ? (
        <>
          <Wifi size={20} />
          <div className="flex-1">
            <p className="font-semibold text-sm">Connexion rétablie</p>
            <p className="text-xs opacity-90">Vous êtes de nouveau en ligne</p>
          </div>
        </>
      ) : (
        <>
          <WifiOff size={20} />
          <div className="flex-1">
            <p className="font-semibold text-sm">Mode Hors Ligne</p>
            <p className="text-xs opacity-90">Vous travaillez avec les données en cache</p>
          </div>
        </>
      )}
      
      {/* Bouton de fermeture */}
      <button
        onClick={hideNotification}
        className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
        title="Fermer"
        aria-label="Fermer la notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default OfflineIndicator;
