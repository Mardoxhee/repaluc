'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Vérifier l'état initial
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showNotification && isOnline) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 transition-all duration-300 ${
        isOnline
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
          <div>
            <p className="font-semibold text-sm">Connexion rétablie</p>
            <p className="text-xs opacity-90">Vous êtes de nouveau en ligne</p>
          </div>
        </>
      ) : (
        <>
          <WifiOff size={20} />
          <div>
            <p className="font-semibold text-sm">Mode Hors Ligne</p>
            <p className="text-xs opacity-90">Vous travaillez avec les données en cache</p>
          </div>
        </>
      )}
    </div>
  );
};

export default OfflineIndicator;
