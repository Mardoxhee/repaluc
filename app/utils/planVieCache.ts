// Utilitaire IndexedDB pour le cache des formulaires de plan de vie
const DB_NAME = 'PlanVieCache';
const DB_VERSION = 1;
const STORE_NAME = 'forms';
const PENDING_STORE_NAME = 'pendingForms';

interface FormCacheEntry {
  key: string;
  victimeId: number;
  userId: number;
  formData: any;
  timestamp: number;
  status: 'draft' | 'pending_sync';
}

// Ouvrir la base de données
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Store pour les brouillons de formulaires
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
      
      // Store pour les formulaires en attente de synchronisation
      if (!db.objectStoreNames.contains(PENDING_STORE_NAME)) {
        const pendingStore = db.createObjectStore(PENDING_STORE_NAME, { keyPath: 'key' });
        pendingStore.createIndex('status', 'status', { unique: false });
      }
    };
  });
};

// Sauvegarder un brouillon de formulaire
export const saveDraftToCache = async (
  victimeId: number,
  userId: number,
  formData: any
): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const entry: FormCacheEntry = {
      key: `draft_${victimeId}`,
      victimeId,
      userId,
      formData,
      timestamp: Date.now(),
      status: 'draft'
    };

    store.put(entry);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log(`[PlanVieCache] Brouillon sauvegardé pour victime ${victimeId}`);
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('[PlanVieCache] Erreur sauvegarde brouillon:', error);
    throw error;
  }
};

// Récupérer un brouillon de formulaire
export const getDraftFromCache = async (victimeId: number): Promise<any | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(`draft_${victimeId}`);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const entry = request.result as FormCacheEntry | undefined;

        if (!entry) {
          console.log(`[PlanVieCache] Aucun brouillon pour victime ${victimeId}`);
          resolve(null);
          return;
        }

        const age = Date.now() - entry.timestamp;
        console.log(`[PlanVieCache] Brouillon récupéré pour victime ${victimeId} (${Math.round(age / 1000)}s)`);
        resolve(entry.formData);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[PlanVieCache] Erreur récupération brouillon:', error);
    return null;
  }
};

// Supprimer un brouillon
export const deleteDraft = async (victimeId: number): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(`draft_${victimeId}`);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log(`[PlanVieCache] Brouillon supprimé pour victime ${victimeId}`);
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('[PlanVieCache] Erreur suppression brouillon:', error);
    throw error;
  }
};

// Sauvegarder un formulaire en attente de synchronisation (hors ligne)
export const savePendingForm = async (
  victimeId: number,
  userId: number,
  formData: any
): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([PENDING_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(PENDING_STORE_NAME);

    const entry: FormCacheEntry = {
      key: `pending_${victimeId}_${Date.now()}`,
      victimeId,
      userId,
      formData,
      timestamp: Date.now(),
      status: 'pending_sync'
    };

    store.put(entry);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log(`[PlanVieCache] Formulaire en attente de sync pour victime ${victimeId}`);
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('[PlanVieCache] Erreur sauvegarde formulaire en attente:', error);
    throw error;
  }
};

// Récupérer tous les formulaires en attente de synchronisation
export const getPendingForms = async (): Promise<FormCacheEntry[]> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([PENDING_STORE_NAME], 'readonly');
    const store = transaction.objectStore(PENDING_STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const entries = request.result as FormCacheEntry[];
        console.log(`[PlanVieCache] ${entries.length} formulaire(s) en attente de sync`);
        resolve(entries);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[PlanVieCache] Erreur récupération formulaires en attente:', error);
    return [];
  }
};

// Supprimer un formulaire en attente après synchronisation réussie
export const deletePendingForm = async (key: string): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([PENDING_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(PENDING_STORE_NAME);
    store.delete(key);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log(`[PlanVieCache] Formulaire en attente supprimé: ${key}`);
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('[PlanVieCache] Erreur suppression formulaire en attente:', error);
    throw error;
  }
};

// Vérifier si on est en ligne
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Vider tous les caches
export const clearAllCache = async (): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME, PENDING_STORE_NAME], 'readwrite');
    
    transaction.objectStore(STORE_NAME).clear();
    transaction.objectStore(PENDING_STORE_NAME).clear();

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log('[PlanVieCache] Tous les caches vidés');
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('[PlanVieCache] Erreur vidage cache:', error);
    throw error;
  }
};
