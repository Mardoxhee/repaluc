'use client';

import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, Trash2 } from 'lucide-react';
import { countStore, STORES, clearStore, exportDB } from '../utils/indexedDB';

const DBStatus: React.FC = () => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadCounts = async () => {
    setLoading(true);
    const newCounts: Record<string, number> = {};
    
    for (const [key, storeName] of Object.entries(STORES)) {
      try {
        const count = await countStore(storeName);
        newCounts[key] = count;
      } catch (err) {
        newCounts[key] = 0;
      }
    }
    
    setCounts(newCounts);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadCounts();
    }
  }, [isOpen]);

  const handleClearStore = async (storeName: string) => {
    if (confirm(`Voulez-vous vraiment vider le store ${storeName} ?`)) {
      await clearStore(storeName);
      loadCounts();
    }
  };

  const handleExport = async () => {
    const data = await exportDB();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repaluc-db-${Date.now()}.json`;
    a.click();
  };

  const totalItems = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-[9998] p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all"
        title="État de la base de données"
      >
        <Database size={24} />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="bg-purple-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database size={24} />
                <div>
                  <h2 className="text-xl font-bold">État IndexedDB</h2>
                  <p className="text-sm opacity-90">{totalItems} éléments au total</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-purple-700 p-2 rounded"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="animate-spin text-purple-600" size={32} />
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(STORES).map(([key, storeName]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">{key}</p>
                        <p className="text-sm text-gray-600">{storeName}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-semibold">
                          {counts[key] || 0}
                        </span>
                        {counts[key] > 0 && (
                          <button
                            onClick={() => handleClearStore(storeName)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Vider ce store"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
              <button
                onClick={loadCounts}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                <RefreshCw size={16} />
                Actualiser
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                <Database size={16} />
                Exporter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DBStatus;
