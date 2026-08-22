'use client';

const DB_NAME = 'VictimUpdatesDB';
const DB_VERSION = 1;
const STORE_NAME = 'pendingVictimUpdates';

export interface PendingVictimUpdate {
  id?: number;
  victimId: number;
  payload: Record<string, any>;
  createdAt: number;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

export const savePendingVictimUpdate = async (
  victimId: number,
  payload: Record<string, any>
): Promise<number> => {
  const db = await openDB();
  const tx = db.transaction([STORE_NAME], 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const entry: PendingVictimUpdate = {
    victimId,
    payload,
    createdAt: Date.now(),
  };

  const request = store.put(entry);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
};

export const getAllPendingVictimUpdates = async (): Promise<PendingVictimUpdate[]> => {
  const db = await openDB();
  const tx = db.transaction([STORE_NAME], 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const rows = (request.result as PendingVictimUpdate[]) || [];
      resolve(rows.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
    };
    request.onerror = () => reject(request.error);
  });
};

export const deletePendingVictimUpdate = async (id: number): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction([STORE_NAME], 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  store.delete(id);

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};
