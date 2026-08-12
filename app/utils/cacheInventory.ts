"use client";

export type CacheTableInfo = {
  dbName: string;
  dbLabel: string;
  tableName: string;
  tableLabel: string;
  records: number;
  rawRecords: number;
  error?: string;
};

const knownDbLabels: Record<string, string> = {
  VictimsCache: 'Victimes',
  PlanVieCache: 'Plans de vie',
  ContractsDB: 'Contrats',
  VictimPhotosDB: 'Photos victimes',
  VictimDocsDB: 'Documents victimes',
  DashboardCache: 'Tableaux de bord',
  'plan-vie-questions-db': 'Questions plan de vie',
  AuthCacheDB: 'Authentification',
};

const knownTableLabels: Record<string, string> = {
  victims: 'Victimes en cache',
  progress: 'Progression chargement victimes',
  forms: 'Brouillons plans de vie',
  pendingForms: 'Plans de vie à synchroniser',
  existingForms: 'Plans de vie existants',
  pendingContracts: 'Contrats à synchroniser',
  pendingVictimPhotos: 'Photos victimes',
  pendingVictimDocs: 'Documents victimes',
  stats: 'Statistiques dashboard',
  questions: 'Questions du formulaire',
  credentials: 'Identifiants',
};

const knownDbNames = [
  'VictimsCache',
  'PlanVieCache',
  'ContractsDB',
  'VictimPhotosDB',
  'VictimDocsDB',
  'DashboardCache',
  'plan-vie-questions-db',
  'AuthCacheDB',
];

const openExistingDB = (dbName: string): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onblocked = () => reject(new Error('Base bloquée par un autre onglet'));
  });
};

const countStore = async (db: IDBDatabase, storeName: string): Promise<{ records: number; rawRecords: number }> => {
  const tx = db.transaction([storeName], 'readonly');
  const store = tx.objectStore(storeName);

  if (db.name === 'VictimsCache' && storeName === 'victims') {
    const request = store.getAll();
    const entries = await new Promise<any[]>((resolve, reject) => {
      request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
      request.onerror = () => reject(request.error);
    });

    const records = entries.reduce((total, entry) => {
      if (Array.isArray(entry?.data)) return total + entry.data.length;
      return total + 1;
    }, 0);

    return { records, rawRecords: entries.length };
  }

  const request = store.count();
  const rawRecords = await new Promise<number>((resolve, reject) => {
    request.onsuccess = () => resolve(Number(request.result) || 0);
    request.onerror = () => reject(request.error);
  });

  return { records: rawRecords, rawRecords };
};

const getAvailableDbNames = async (): Promise<string[]> => {
  const indexedDBWithDatabases = indexedDB as IDBFactory & {
    databases?: () => Promise<Array<{ name?: string | null }>>;
  };

  if (typeof indexedDBWithDatabases.databases === 'function') {
    const dbs = await indexedDBWithDatabases.databases();
    return dbs
      .map((db) => db.name)
      .filter((name): name is string => Boolean(name));
  }

  return knownDbNames;
};

export const getCacheInventory = async (): Promise<CacheTableInfo[]> => {
  if (typeof indexedDB === 'undefined') return [];

  const dbNames = await getAvailableDbNames();
  const rows: CacheTableInfo[] = [];

  for (const dbName of dbNames) {
    let db: IDBDatabase | null = null;

    try {
      db = await openExistingDB(dbName);
      const storeNames = Array.from(db.objectStoreNames);

      for (const tableName of storeNames) {
        try {
          const counts = await countStore(db, tableName);
          if (counts.records <= 0) continue;

          rows.push({
            dbName,
            dbLabel: knownDbLabels[dbName] || dbName,
            tableName,
            tableLabel: knownTableLabels[tableName] || tableName,
            records: counts.records,
            rawRecords: counts.rawRecords,
          });
        } catch (error: any) {
          rows.push({
            dbName,
            dbLabel: knownDbLabels[dbName] || dbName,
            tableName,
            tableLabel: knownTableLabels[tableName] || tableName,
            records: 0,
            rawRecords: 0,
            error: error?.message || 'Lecture impossible',
          });
        }
      }
    } catch {
      // La base peut ne pas exister dans certains navigateurs; on ignore les bases vides.
    } finally {
      db?.close();
    }
  }

  return rows.sort((a, b) => {
    const dbCompare = a.dbLabel.localeCompare(b.dbLabel, 'fr');
    if (dbCompare !== 0) return dbCompare;
    return a.tableLabel.localeCompare(b.tableLabel, 'fr');
  });
};
