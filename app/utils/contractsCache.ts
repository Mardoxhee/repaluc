// IndexedDB utilitaire pour les contrats en attente de synchronisation
import { getMpuSignerField, getMpuSignatureFileKey } from './mpuConsentSignature';

const DB_NAME = 'ContractsDB';
const DB_VERSION = 1;
const STORE_NAME = 'pendingContracts';

export interface PendingContract {
    id?: number;
    victimId: number;
    contractData: any;
    signatureDataUrl?: string | null;
    signatureCapturedAt?: number;
    signatureFileKey?: string;
    expectedSignatureFileKey?: string;
    targetType?: 'contrat' | 'consentement-mpu';
    action?: 'create' | 'update';
    targetId?: number;
    revision?: number;
    consentMetadataSynced?: boolean;
    consentChanges?: Record<string, unknown>;
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
        revision: 1,
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
                    const sameSigner = entry.contractData?.incapableConsentir === existing.contractData?.incapableConsentir;
                    const selectedKey = !entry.signatureDataUrl && typeof entry.contractData?.incapableConsentir === 'boolean'
                        ? getMpuSignatureFileKey(entry.contractData[getMpuSignerField(entry.contractData.incapableConsentir)]) : '';
                    const sameDrawing = sameSigner &&
                        (!entry.signatureDataUrl || entry.signatureDataUrl === existing.signatureDataUrl) &&
                        (!selectedKey || selectedKey === existing.signatureFileKey);
                    const targetId = existing.targetId ?? entry.targetId;
                    toSave = {
                        ...toSave,
                        id: existing.id,
                        action: targetId ? 'update' : entry.action,
                        targetId,
                        signatureDataUrl: entry.signatureDataUrl || (sameDrawing ? existing.signatureDataUrl : null),
                        signatureCapturedAt: sameDrawing ? existing.signatureCapturedAt ?? existing.createdAt : toSave.createdAt,
                        signatureFileKey: sameDrawing ? existing.signatureFileKey : undefined,
                        revision: (existing.revision ?? 0) + 1,
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
    tx.oncomplete = () => db.close();
    tx.onabort = () => db.close();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            resolve((request.result as PendingContract[]) || []);
        };
        request.onerror = () => reject(request.error);
    });
};

// A new signature or edit saved while the request is in flight must stay queued.
export const recordPendingContractSync = async (
    sent: PendingContract, checkpoint?: { signatureFileKey?: string; consentId?: number }
): Promise<boolean> => {
    const localId = sent.id;
    if (localId == null) throw new Error('Identifiant local de l’acte manquant.');
    const db = await openContractsDB();
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(localId);
    let matched = false;
    try {
        return await new Promise<boolean>((resolve, reject) => {
            request.onsuccess = () => {
                const current: PendingContract | undefined = request.result;
                if (!current || current.revision !== sent.revision) return;
                matched = true;
                if (!checkpoint) store.delete(localId);
                else store.put({
                    ...current,
                    ...(checkpoint.consentId !== undefined ? { targetId: checkpoint.consentId, action: 'update' } : {}),
                    ...(checkpoint.signatureFileKey !== undefined ? { signatureFileKey: checkpoint.signatureFileKey } : {}),
                });
            };
            tx.oncomplete = () => resolve(matched);
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error || new Error('La mise à jour locale a été interrompue.'));
        });
    } finally {
        db.close();
    }
};
