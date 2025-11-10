'use client';

import React from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-orange-100 rounded-full">
            <WifiOff className="text-orange-600" size={48} />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Vous êtes hors ligne
        </h1>
        
        <p className="text-gray-600 mb-6">
          Il semble que vous n'ayez pas de connexion Internet. 
          Certaines fonctionnalités peuvent être limitées.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            💡 Les données en cache restent accessibles. 
            Reconnectez-vous pour synchroniser vos modifications.
          </p>
        </div>
        
        <button
          onClick={() => window.location.reload()}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
        
        <button
          onClick={() => window.history.back()}
          className="w-full mt-3 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
        >
          Retour
        </button>
      </div>
    </div>
  );
}
