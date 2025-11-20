// Utilitaire IndexedDB pour le cache des victimes
const DB_NAME = 'VictimsCache';
const DB_VERSION = 1;
const STORE_NAME = 'victims';
const CACHE_DURATION = 100 * 24 * 60 * 60 * 1000; // 100 jours

interface CacheEntry {
  key: string;
  data: any;
  meta: any;
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
export const saveVictimsToCache = async (key: string, data: any[], meta: any): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const entry: CacheEntry = {
      key,
      data,
      meta,
      timestamp: Date.now()
    };

    store.put(entry);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log(`[VictimsCache] Sauvegardé: ${key} (${data.length} victimes)`);
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.log('[VictimsCache] Erreur sauvegarde:', error);
    throw error;
  }
};

// Récupérer depuis le cache
export const getVictimsFromCache = async (key: string): Promise<{ data: any[], meta: any } | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined;

        if (!entry) {
          console.log(`[VictimsCache] Aucune donnée pour: ${key}`);
          resolve(null);
          return;
        }

        // Vérifier si le cache est encore valide
        const age = Date.now() - entry.timestamp;
        if (age > CACHE_DURATION) {
          console.log(`[VictimsCache] Données expirées: ${key} (${Math.round(age / 1000)}s)`);
          resolve(null);
          return;
        }

        console.log(`[VictimsCache] Récupéré: ${key} (${entry.data.length} victimes, ${Math.round(age / 1000)}s)`);
        resolve({ data: entry.data, meta: entry.meta });
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.log('[VictimsCache] Erreur récupération:', error);
    return null;
  }
};

// Vider tout le cache
export const clearVictimsCache = async (): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.clear();

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log('[VictimsCache] Cache vidé');
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.log('[VictimsCache] Erreur vidage:', error);
    throw error;
  }
};

// Vérifier si on est en ligne avec une meilleure gestion des erreurs
export const isOnline = (): boolean => {
  try {
    // Vérifier si on est en ligne via l'API navigator
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    
    // Si on ne peut pas utiliser navigator.onLine, on suppose que l'application est en ligne
    // car c'est généralement le cas par défaut dans les navigateurs modernes
    return true;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'état en ligne:', error);
    // En cas d'erreur, on suppose que l'application est en ligne
    // pour éviter de bloquer inutilement les fonctionnalités
    return true;
  }
};
