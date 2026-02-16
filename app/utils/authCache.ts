'use client';

const DB_NAME = 'AuthCacheDB';
const DB_VERSION = 1;
const STORE_NAME = 'credentials';
const CREDENTIALS_KEY = 'offline-credentials';

interface OfflineCredentialsEntry {
  key: string;
  username: string;
  passwordHash: string;
  updatedAt: number;
}

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

const toHex = (buf: ArrayBuffer) => {
  const bytes = new Uint8Array(buf);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const fallbackHash = (input: string) => {
  let h1 = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h1 ^= input.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }
  return `fallback:${(h1 >>> 0).toString(16).padStart(8, '0')}`;
};

export const hashPassword = async (username: string, password: string): Promise<string> => {
  const input = `${username}:${password}`;
  const subtle = (globalThis as any)?.crypto?.subtle;
  if (!subtle) {
    return fallbackHash(input);
  }

  const enc = new TextEncoder();
  const data = enc.encode(input);
  const digest = await subtle.digest('SHA-256', data);
  return toHex(digest);
};

export const saveOfflineCredentials = async (username: string, passwordHash: string): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction([STORE_NAME], 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const entry: OfflineCredentialsEntry = {
    key: CREDENTIALS_KEY,
    username,
    passwordHash,
    updatedAt: Date.now(),
  };

  store.put(entry);

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  db.close();
};

export const getOfflineCredentials = async (): Promise<OfflineCredentialsEntry | null> => {
  const db = await openDB();
  const tx = db.transaction([STORE_NAME], 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const req = store.get(CREDENTIALS_KEY);

  const entry = await new Promise<OfflineCredentialsEntry | undefined>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  db.close();
  return entry || null;
};

export const verifyOfflineCredentials = async (username: string, password: string): Promise<boolean> => {
  const cached = await getOfflineCredentials();
  if (!cached) return false;
  if ((cached.username || '').toLowerCase() !== (username || '').toLowerCase()) return false;
  const hash = await hashPassword(username, password);
  return hash === cached.passwordHash;
};

export const clearOfflineCredentials = async (): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction([STORE_NAME], 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.delete(CREDENTIALS_KEY);

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  db.close();
};
