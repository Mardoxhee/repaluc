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
  validationError?: string;
  superseded?: boolean;
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
    tx.oncomplete = () => resolve(request.result as number);
    tx.onabort = () => reject(tx.error ?? new Error('Enregistrement local de la photo interrompu.'));
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
      } else if (!value?.superseded) {
        pendingRecords++;
      }

      const victimId = value?.victimId;
      if (value?.synced !== true && !value?.superseded && typeof victimId === 'number') {
        counts.set(victimId, (counts.get(victimId) || 0) + 1);
      }
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
  });
};

export const getVictimPhotosForVictim = async (victimId: number): Promise<PendingVictimPhoto[]> => {
  const db = await openDB();
  const tx = db.transaction([STORE_NAME], 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const request = store.openCursor();
  const photos: PendingVictimPhoto[] = [];

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve(photos);
        return;
      }

      const photo = cursor.value as PendingVictimPhoto;
      if (photo?.victimId === victimId) {
        photos.push(photo);
      }
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
  });
};

export const getLatestVictimPhoto = async (victimId: number): Promise<PendingVictimPhoto | null> => {
  const photos = await getVictimPhotosForVictim(victimId);
  return photos.reverse().find(photo => !photo.superseded) ?? null;
};

const updatePhotoUpload = async (id: number, update: Partial<Pick<PendingVictimPhoto, 'synced' | 'remoteUrl' | 'syncedAt' | 'validationError' | 'superseded'>>): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction([STORE_NAME], 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  await new Promise<void>((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => {
      const entry: PendingVictimPhoto | undefined = request.result;
      if (!entry) {
        tx.abort();
        return;
      }
      store.put({ ...entry, ...update });
    };
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error('La photo en attente n’est plus disponible.'));
  });
};

export const saveVictimPhotoUploadReference = (id: number, remoteUrl: string) => updatePhotoUpload(id, { remoteUrl });
export const markVictimPhotoRejected = (id: number, validationError: string) => updatePhotoUpload(id, { validationError });
export const markVictimPhotoSuperseded = (id: number) => updatePhotoUpload(id, { superseded: true });
export const markVictimPhotoSynced = (id: number, remoteUrl: string) =>
  updatePhotoUpload(id, { remoteUrl, synced: true, syncedAt: Date.now(), validationError: undefined });

export const hasPendingVictimPhotosToSync = async (): Promise<boolean> => {
  try {
    const all = await getAllPendingVictimPhotos();
    return all.some((x) => !x.synced && !x.superseded);
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
