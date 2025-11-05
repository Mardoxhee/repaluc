// Utilitaire IndexedDB pour le cache du dashboard
const DB_NAME = 'DashboardCache';
const DB_VERSION = 1;
const STORE_NAME = 'stats';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
}

// Ouvrir la base de données
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });
};

// Sauvegarder dans le cache
export const saveToCache = async (key: string, data: any): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const entry: CacheEntry = {
      key,
      data,
      timestamp: Date.now()
    };

    store.put(entry);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log(`[Cache] Données sauvegardées: ${key}`);
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('[Cache] Erreur sauvegarde:', error);
    throw error;
  }
};

// Récupérer depuis le cache
export const getFromCache = async (key: string): Promise<any | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined;
        
        if (!entry) {
          console.log(`[Cache] Aucune donnée pour: ${key}`);
          resolve(null);
          return;
        }

        // Vérifier si le cache est encore valide
        const age = Date.now() - entry.timestamp;
        if (age > CACHE_DURATION) {
          console.log(`[Cache] Données expirées pour: ${key} (${Math.round(age / 1000)}s)`);
          resolve(null);
          return;
        }

        console.log(`[Cache] Données récupérées: ${key} (${Math.round(age / 1000)}s)`);
        resolve(entry.data);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[Cache] Erreur récupération:', error);
    return null;
  }
};

// Vider tout le cache
export const clearCache = async (): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.clear();

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log('[Cache] Cache vidé');
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('[Cache] Erreur vidage:', error);
    throw error;
  }
};

// Vérifier si on est en ligne
export const isOnline = (): boolean => {
  return navigator.onLine;
};
