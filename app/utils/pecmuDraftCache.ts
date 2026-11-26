'use client';

const DB_NAME = 'PecmuLocalDrafts';
const DB_VERSION = 1;
const STORE_NAME = 'alertDrafts';

export type PecmuDraftSnapshot = {
  key: string;
  data: Record<string, unknown>;
  updatedAt: number;
};

const openDraftDB = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'key' });
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error('Impossible d’ouvrir le stockage local PECMU.'));
});

const userScope = () => {
  try {
    const raw = localStorage.getItem('usr');
    const user = raw ? JSON.parse(raw) : null;
    const login = JSON.parse(localStorage.getItem('repaluc_auth') || 'null');
    return user?.id ?? user?.username ?? user?.email ?? login?.username;
  } catch {
    return null;
  }
};

export const getPecmuDraftKey = (scope: string, id?: number | null) => {
  const user = userScope();
  return user == null || user === '' ? '' : `alert:${user}:${scope}:${id ?? 'new'}`;
};

export const getPecmuDraft = async (key: string): Promise<PecmuDraftSnapshot | null> => {
  const db = await openDraftDB();
  try {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
    return await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve((request.result as PecmuDraftSnapshot | undefined) || null);
      request.onerror = () => reject(request.error || new Error('Impossible de lire le brouillon PECMU local.'));
    });
  } finally {
    db.close();
  }
};

export const savePecmuDraft = async (key: string, data: Record<string, unknown>): Promise<void> => {
  const db = await openDraftDB();
  try {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put({ key, data, updatedAt: Date.now() } satisfies PecmuDraftSnapshot);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Impossible d’enregistrer le brouillon PECMU local.'));
      transaction.onabort = () => reject(transaction.error || new Error('La sauvegarde locale PECMU a été annulée.'));
    });
  } finally {
    db.close();
  }
};

export const deletePecmuDraft = async (key: string): Promise<void> => {
  const db = await openDraftDB();
  try {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(key);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Impossible de supprimer le brouillon PECMU local.'));
      transaction.onabort = () => reject(transaction.error || new Error('La suppression du brouillon PECMU local a été annulée.'));
    });
  } finally {
    db.close();
  }
};
