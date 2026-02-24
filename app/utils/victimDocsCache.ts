'use client';

const DB_NAME = 'VictimDocsDB';
const DB_VERSION = 1;
const STORE_NAME = 'pendingVictimDocs';

export interface PendingVictimDoc {
  id?: number;
  victimId: number;
  label: string;
  fileName: string;
  mimeType: string;
  fileData: Blob;
  createdAt: number;
  synced: boolean;
  syncedAt?: number;
  remoteLien?: string;
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

export const deletePendingVictimDocById = async (id: number): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction([STORE_NAME], 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  store.delete(id);

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const savePendingVictimDoc = async (params: {
  victimId: number;
  label: string;
  file: File;
}): Promise<number> => {
  const db = await openDB();
  const tx = db.transaction([STORE_NAME], 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const entry: PendingVictimDoc = {
    victimId: params.victimId,
    label: params.label,
    fileName: params.file.name,
    mimeType: params.file.type || 'application/octet-stream',
    fileData: params.file,
    createdAt: Date.now(),
    synced: false,
  };

  const request = store.put(entry);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
};

export const getAllPendingVictimDocs = async (): Promise<PendingVictimDoc[]> => {
  const db = await openDB();
  const tx = db.transaction([STORE_NAME], 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve((request.result as PendingVictimDoc[]) || []);
    request.onerror = () => reject(request.error);
  });
};

export const getPendingDocsForVictim = async (victimId: number): Promise<PendingVictimDoc[]> => {
  const all = await getAllPendingVictimDocs();
  return all
    .filter((x) => x.victimId === victimId)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
};

export const getPendingVictimDocById = async (id: number): Promise<PendingVictimDoc | null> => {
  const all = await getAllPendingVictimDocs();
  const found = all.find((x) => x.id === id);
  return found || null;
};

export const markVictimDocSynced = async (id: number, remoteLien: string): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction([STORE_NAME], 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const getReq = store.get(id);

  const entry = await new Promise<PendingVictimDoc | undefined>((resolve, reject) => {
    getReq.onsuccess = () => resolve(getReq.result as PendingVictimDoc | undefined);
    getReq.onerror = () => reject(getReq.error);
  });

  if (!entry) return;

  const updated: PendingVictimDoc = {
    ...entry,
    synced: true,
    syncedAt: Date.now(),
    remoteLien,
  };

  store.put(updated);

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const hasPendingVictimDocsToSync = async (): Promise<boolean> => {
  try {
    const all = await getAllPendingVictimDocs();
    return all.some((x) => !x.synced);
  } catch {
    return false;
  }
};
