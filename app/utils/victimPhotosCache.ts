'use client';

const DB_NAME = 'VictimPhotosDB';
const DB_VERSION = 3;
const STORE_NAME = 'pendingVictimPhotos';
const SYNCED_VICTIM_INDEX = 'syncedVictimId';

export interface PendingVictimPhoto {
  id?: number;
  victimId: number;
  photoDataUrl: string;
  createdAt: number;
  synced: boolean;
  syncedAt?: number;
  remoteUrl?: string;
}

export interface PendingVictimMediaSummary {
  victimId: number;
  count: number;
}

export interface PendingVictimMediaSummaryResult {
  rows: PendingVictimMediaSummary[];
  totalRecords: number;
  pendingRecords: number;
  syncedRecords: number;
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

      if (store.indexNames.contains(SYNCED_VICTIM_INDEX)) {
        store.deleteIndex(SYNCED_VICTIM_INDEX);
      }
    };
  });
};

export const savePendingVictimPhoto = async (victimId: number, photoDataUrl: string): Promise<number> => {
  const db = await openDB();
  const tx = db.transaction([STORE_NAME], 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const entry: PendingVictimPhoto = {
    victimId,
    photoDataUrl,
    createdAt: Date.now(),
    synced: false,
  };

  const request = store.put(entry);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
};

export const getAllPendingVictimPhotos = async (): Promise<PendingVictimPhoto[]> => {
  const db = await openDB();
  const tx = db.transaction([STORE_NAME], 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve((request.result as PendingVictimPhoto[]) || []);
    request.onerror = () => reject(request.error);
  });
};

export const getPendingVictimPhotosSummary = async (): Promise<PendingVictimMediaSummaryResult> => {
  const db = await openDB();
  const tx = db.transaction([STORE_NAME], 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const request = store.openCursor();
  const counts = new Map<number, number>();
  let totalRecords = 0;
  let pendingRecords = 0;
  let syncedRecords = 0;

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve({
          rows: Array.from(counts.entries()).map(([victimId, count]) => ({
            victimId,
            count,
          })),
          totalRecords,
          pendingRecords,
          syncedRecords,
        });
        return;
      }

      const value = cursor.value as PendingVictimPhoto;
      totalRecords++;
      if (value?.synced === true) {
        syncedRecords++;
      } else {
        pendingRecords++;
      }

      const victimId = value?.victimId;
      if (value?.synced !== true && typeof victimId === 'number') {
        counts.set(victimId, (counts.get(victimId) || 0) + 1);
      }
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
  });
};

export const getPendingVictimPhotosToSyncForVictim = async (victimId: number): Promise<PendingVictimPhoto[]> => {
  const db = await openDB();
  const tx = db.transaction([STORE_NAME], 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const request = store.openCursor();
  const photos: PendingVictimPhoto[] = [];

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve(photos.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
        return;
      }

      const photo = cursor.value as PendingVictimPhoto;
      if (photo?.victimId === victimId && photo?.synced !== true) {
        photos.push(photo);
      }
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
  });
};

export const getLatestVictimPhoto = async (victimId: number): Promise<PendingVictimPhoto | null> => {
  const all = await getAllPendingVictimPhotos();
  const filtered = all.filter((x) => x.victimId === victimId);
  if (filtered.length === 0) return null;
  filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return filtered[0] || null;
};

export const markVictimPhotoSynced = async (id: number, remoteUrl: string): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction([STORE_NAME], 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const getReq = store.get(id);

  const entry = await new Promise<PendingVictimPhoto | undefined>((resolve, reject) => {
    getReq.onsuccess = () => resolve(getReq.result as PendingVictimPhoto | undefined);
    getReq.onerror = () => reject(getReq.error);
  });

  if (!entry) return;

  const updated: PendingVictimPhoto = {
    ...entry,
    synced: true,
    syncedAt: Date.now(),
    remoteUrl,
  };

  store.put(updated);

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const hasPendingVictimPhotosToSync = async (): Promise<boolean> => {
  try {
    const all = await getAllPendingVictimPhotos();
    return all.some((x) => !x.synced);
  } catch {
    return false;
  }
};

export const deletePendingVictimPhotoById = async (id: number): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction([STORE_NAME], 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  store.delete(id);

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const deletePendingVictimPhotosForVictim = async (victimId: number): Promise<number> => {
  const all = await getAllPendingVictimPhotos();
  const idsToDelete = all.filter((x) => x.victimId === victimId && typeof x.id === 'number').map((x) => x.id as number);
  if (idsToDelete.length === 0) return 0;

  const db = await openDB();
  const tx = db.transaction([STORE_NAME], 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  for (const id of idsToDelete) {
    store.delete(id);
  }

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return idsToDelete.length;
};
