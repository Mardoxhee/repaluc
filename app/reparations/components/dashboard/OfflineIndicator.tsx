"use client";

import React from 'react';
import { FiWifi, FiWifiOff } from 'react-icons/fi';

interface OfflineIndicatorProps {
  isOffline: boolean;
  showOfflineIndicator: boolean;
  setShowOfflineIndicator: (v: boolean) => void;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOffline,
  showOfflineIndicator,
  setShowOfflineIndicator,
}) => {
  if (!isOffline) return null;

  return (
    <>
      {showOfflineIndicator && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div
              className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${isOffline
                ? 'bg-orange-50 text-orange-800 border-orange-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}
            >
              {isOffline ? (
                <>
                  <FiWifiOff size={18} />
                  <span className="text-sm font-medium">Mode Hors Ligne</span>
                </>
              ) : (
                <>
                  <FiWifi size={18} />
                  <span className="text-sm font-medium">Données en cache</span>
                </>
              )}
              <button
                onClick={() => setShowOfflineIndicator(false)}
                className="ml-2 p-1 hover:bg-white/50 rounded transition-colors"
                title="Fermer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {!showOfflineIndicator && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setShowOfflineIndicator(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg border ${isOffline
              ? 'bg-orange-100 text-orange-800 border-orange-300'
              : 'bg-blue-100 text-blue-800 border-blue-300'
              } hover:scale-105 transition-transform`}
            title={isOffline ? 'Mode Hors Ligne' : 'Données en cache'}
          >
            {isOffline ? <FiWifiOff size={16} /> : <FiWifi size={16} />}
          </button>
        </div>
      )}
    </>
  );
};

export default OfflineIndicator;
