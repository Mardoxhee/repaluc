// IndexedDB utilitaire pour les contrats en attente de synchronisation

const DB_NAME = 'ContractsDB';
const DB_VERSION = 1;
const STORE_NAME = 'pendingContracts';

export interface PendingContract {
    id?: number;
    victimId: number;
    contractData: any;
    signatureDataUrl?: string | null;
    createdAt: number;
}

const openContractsDB = (): Promise<IDBDatabase> => {
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

export const savePendingContract = async (
    entry: Omit<PendingContract, 'id' | 'createdAt'>
): Promise<void> => {
    const db = await openContractsDB();
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const toSave: PendingContract = {
        ...entry,
        createdAt: Date.now(),
    };

    store.put(toSave);

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => {
            console.log('[ContractsCache] Contrat en attente sauvegardé');
            resolve();
        };
        tx.onerror = () => reject(tx.error);
    });
};

export const getAllPendingContracts = async (): Promise<PendingContract[]> => {
    const db = await openContractsDB();
    const tx = db.transaction([STORE_NAME], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            resolve((request.result as PendingContract[]) || []);
        };
        request.onerror = () => reject(request.error);
    });
};

export const deletePendingContract = async (id: number): Promise<void> => {
    const db = await openContractsDB();
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    store.delete(id);

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => {
            console.log('[ContractsCache] Contrat en attente supprimé', id);
            resolve();
        };
        tx.onerror = () => reject(tx.error);
    });
};
