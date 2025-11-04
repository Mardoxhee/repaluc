// Utilitaire pour gérer IndexedDB
const DB_NAME = 'RepalucDB';
const DB_VERSION = 1;

// Stores (tables)
export const STORES = {
  VICTIMS: 'victims',
  EVALUATIONS: 'evaluations',
  PLAN_VIE: 'planVie',
  QUESTIONS: 'questions',
  STATS: 'stats',
  METADATA: 'metadata',
};

// Interface pour les métadonnées
interface Metadata {
  key: string;
  value: any;
  timestamp: number;
}

// Initialiser la base de données
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[IndexedDB] Erreur d\'ouverture:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('[IndexedDB] Base de données ouverte avec succès');
      resolve(request.result);
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      console.log('[IndexedDB] Mise à jour de la structure...');

      // Store pour les victimes
      if (!db.objectStoreNames.contains(STORES.VICTIMS)) {
        const victimStore = db.createObjectStore(STORES.VICTIMS, { keyPath: 'id' });
        victimStore.createIndex('status', 'status', { unique: false });
        victimStore.createIndex('province', 'province', { unique: false });
        console.log('[IndexedDB] Store VICTIMS créé');
      }

      // Store pour les évaluations
      if (!db.objectStoreNames.contains(STORES.EVALUATIONS)) {
        const evalStore = db.createObjectStore(STORES.EVALUATIONS, { keyPath: 'id' });
        evalStore.createIndex('victimeId', 'victimeId', { unique: false });
        console.log('[IndexedDB] Store EVALUATIONS créé');
      }

      // Store pour les plans de vie
      if (!db.objectStoreNames.contains(STORES.PLAN_VIE)) {
        const planStore = db.createObjectStore(STORES.PLAN_VIE, { keyPath: 'id' });
        planStore.createIndex('victimeId', 'victimeId', { unique: false });
        console.log('[IndexedDB] Store PLAN_VIE créé');
      }

      // Store pour les questions
      if (!db.objectStoreNames.contains(STORES.QUESTIONS)) {
        const questionStore = db.createObjectStore(STORES.QUESTIONS, { keyPath: 'id' });
        questionStore.createIndex('type', 'categorieId', { unique: false });
        console.log('[IndexedDB] Store QUESTIONS créé');
      }

      // Store pour les statistiques
      if (!db.objectStoreNames.contains(STORES.STATS)) {
        db.createObjectStore(STORES.STATS, { keyPath: 'key' });
        console.log('[IndexedDB] Store STATS créé');
      }

      // Store pour les métadonnées (dernière sync, etc.)
      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
        console.log('[IndexedDB] Store METADATA créé');
      }
    };
  });
};

// Sauvegarder des données dans un store
export const saveToStore = async <T>(storeName: string, data: T | T[]): Promise<void> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    const items = Array.isArray(data) ? data : [data];
    
    items.forEach(item => {
      store.put(item);
    });

    transaction.oncomplete = () => {
      console.log(`[IndexedDB] ${items.length} élément(s) sauvegardé(s) dans ${storeName}`);
      resolve();
    };

    transaction.onerror = () => {
      console.error(`[IndexedDB] Erreur de sauvegarde dans ${storeName}:`, transaction.error);
      reject(transaction.error);
    };
  });
};

// Récupérer toutes les données d'un store
export const getAllFromStore = async <T>(storeName: string): Promise<T[]> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      console.log(`[IndexedDB] ${request.result.length} élément(s) récupéré(s) de ${storeName}`);
      resolve(request.result as T[]);
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Erreur de lecture de ${storeName}:`, request.error);
      reject(request.error);
    };
  });
};

// Récupérer un élément par ID
export const getFromStore = async <T>(storeName: string, id: number | string): Promise<T | null> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result as T || null);
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Erreur de lecture de ${storeName}:`, request.error);
      reject(request.error);
    };
  });
};

// Récupérer par index
export const getByIndex = async <T>(
  storeName: string,
  indexName: string,
  value: any
): Promise<T[]> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onsuccess = () => {
      resolve(request.result as T[]);
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Erreur de lecture par index:`, request.error);
      reject(request.error);
    };
  });
};

// Supprimer un élément
export const deleteFromStore = async (storeName: string, id: number | string): Promise<void> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => {
      console.log(`[IndexedDB] Élément ${id} supprimé de ${storeName}`);
      resolve();
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Erreur de suppression:`, request.error);
      reject(request.error);
    };
  });
};

// Vider un store
export const clearStore = async (storeName: string): Promise<void> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => {
      console.log(`[IndexedDB] Store ${storeName} vidé`);
      resolve();
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Erreur de vidage:`, request.error);
      reject(request.error);
    };
  });
};

// Sauvegarder les métadonnées (dernière sync, etc.)
export const saveMetadata = async (key: string, value: any): Promise<void> => {
  const metadata: Metadata = {
    key,
    value,
    timestamp: Date.now(),
  };
  
  return saveToStore(STORES.METADATA, metadata);
};

// Récupérer les métadonnées
export const getMetadata = async (key: string): Promise<any> => {
  const metadata = await getFromStore<Metadata>(STORES.METADATA, key);
  return metadata?.value || null;
};

// Vérifier si les données sont récentes (moins de X minutes)
export const isDataFresh = async (key: string, maxAgeMinutes: number = 5): Promise<boolean> => {
  const metadata = await getFromStore<Metadata>(STORES.METADATA, key);
  
  if (!metadata) return false;
  
  const ageMs = Date.now() - metadata.timestamp;
  const ageMinutes = ageMs / (1000 * 60);
  
  return ageMinutes < maxAgeMinutes;
};

// Compter les éléments dans un store
export const countStore = async (storeName: string): Promise<number> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.count();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Exporter toute la base de données (pour debug)
export const exportDB = async (): Promise<any> => {
  const data: any = {};
  
  for (const storeName of Object.values(STORES)) {
    data[storeName] = await getAllFromStore(storeName);
  }
  
  return data;
};

// Importer des données (pour debug/restore)
export const importDB = async (data: any): Promise<void> => {
  for (const [storeName, items] of Object.entries(data)) {
    if (Array.isArray(items)) {
      await saveToStore(storeName, items);
    }
  }
};

console.log('[IndexedDB] Module chargé');
