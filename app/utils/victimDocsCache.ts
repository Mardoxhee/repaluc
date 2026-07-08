'use client';

const DB_NAME = 'VictimDocsDB';
const DB_VERSION = 2;
const STORE_NAME = 'pendingVictimDocs';
const SYNCED_VICTIM_INDEX = 'syncedVictimId';

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

export interface PendingVictimMediaSummary {
  victimId: number;
  count: number;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      let store: IDBObjectStore;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      } else {
        store = request.transaction!.objectStore(STORE_NAME);
      }

      if (!store.indexNames.contains(SYNCED_VICTIM_INDEX)) {
        store.createIndex(SYNCED_VICTIM_INDEX, ['synced', 'victimId'], { unique: false });
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

export const getPendingVictimDocsSummary = async (): Promise<PendingVictimMediaSummary[]> => {
  const db = await openDB();
  const tx = db.transaction([STORE_NAME], 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index(SYNCED_VICTIM_INDEX);
  const range = IDBKeyRange.bound([false], [false, Number.MAX_SAFE_INTEGER]);
  const request = index.openKeyCursor(range);
  const counts = new Map<number, number>();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve(
          Array.from(counts.entries()).map(([victimId, count]) => ({
            victimId,
            count,
          }))
        );
        return;
      }

      const key = cursor.key as [boolean, number];
      const victimId = key?.[1];
      if (typeof victimId === 'number') {
        counts.set(victimId, (counts.get(victimId) || 0) + 1);
      }
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
  });
};

export const getPendingVictimDocsToSyncForVictim = async (victimId: number): Promise<PendingVictimDoc[]> => {
  const db = await openDB();
  const tx = db.transaction([STORE_NAME], 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index(SYNCED_VICTIM_INDEX);
  const request = index.openCursor(IDBKeyRange.only([false, victimId]));
  const docs: PendingVictimDoc[] = [];

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve(docs.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
        return;
      }

      docs.push(cursor.value as PendingVictimDoc);
      cursor.continue();
    };
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
