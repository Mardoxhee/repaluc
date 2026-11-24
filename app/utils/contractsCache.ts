// IndexedDB utilitaire pour les contrats en attente de synchronisation

const DB_NAME = 'ContractsDB';
const DB_VERSION = 1;
const STORE_NAME = 'pendingContracts';

export interface PendingContract {
    id?: number;
    victimId: number;
    contractData: any;
    signatureDataUrl?: string | null;
    targetType?: 'contrat' | 'consentement-mpu';
    action?: 'create' | 'update';
    targetId?: number;
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
): Promise<PendingContract> => {
    const db = await openContractsDB();
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    let toSave: PendingContract = {
        ...entry,
        createdAt: Date.now(),
    };

    let saved: PendingContract;
    try {
        saved = await new Promise<PendingContract>((resolve, reject) => {
            const request = entry.targetType === 'consentement-mpu'
                ? store.getAll()
                : null;

            const write = (existing?: PendingContract) => {
                if (existing?.id !== undefined) {
                    // Keep one pending consent per victim, updating its local copy on each save.
                    toSave = {
                        ...toSave,
                        id: existing.id,
                        action: existing.action || entry.action,
                        targetId: existing.targetId ?? entry.targetId,
                    };
                }
                const writeRequest = existing ? store.put(toSave) : store.add(toSave);
                writeRequest.onsuccess = () => { toSave.id = Number(writeRequest.result); };
                writeRequest.onerror = () => reject(writeRequest.error);
            };

            if (request) {
                request.onsuccess = () => {
                    const existing = (request.result as PendingContract[]).find((item) => (
                        item.targetType === 'consentement-mpu' && item.victimId === entry.victimId
                    ));
                    write(existing);
                };
                request.onerror = () => reject(request.error);
            } else {
                write();
            }

            tx.oncomplete = () => {
                resolve(toSave);
            };
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error || new Error('La sauvegarde locale a été annulée.'));
        });
    } finally {
        db.close();
    }

    if (saved.id === undefined) {
        throw new Error('La sauvegarde locale a réussi sans identifiant de dossier.');
    }

    const persisted = (await getAllPendingContracts()).find((item) => item.id === saved.id);
    if (!persisted) {
        throw new Error('L’acte n’a pas été retrouvé après son enregistrement local.');
    }

    console.log('[ContractsCache] Acte en attente sauvegardé et vérifié localement', persisted.id);
    return persisted;
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
