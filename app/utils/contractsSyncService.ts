'use client';
import { getAllPendingContracts, deletePendingContract, PendingContract } from './contractsCache';
import { isOnline } from './victimsCache';

let isSyncing = false;
let syncInterval: NodeJS.Timeout | null = null;

const uploadSignature = async (dataUrl: string, victimId: number): Promise<string> => {
    const uploadEndpoint = process.env.NEXT_PUBLIC_UPLOAD_ENDPOINT || 'https://360.fonasite.app:5521/minio/files/upload';

    const res = await fetch(dataUrl);
    const blob = await res.blob();

    const file = new File([blob], `signature_${victimId}_${Date.now()}.png`, { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', file);

    const resp = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
    });

    if (!resp.ok) {
        throw new Error(`Failed to upload signature: ${resp.statusText}`);
    }

    const data = await resp.json();
    console.log('[ContractsSyncService] Signature uploaded:', data);
    return data.url || data.link || '';
};

export const syncPendingContracts = async (): Promise<{ synced: number; failed: number }> => {
    if (isSyncing) {
        console.log('[ContractsSyncService] Synchronisation déjà en cours...');
        return { synced: 0, failed: 0 };
    }

    if (!isOnline()) {
        console.log('[ContractsSyncService] Hors ligne, synchronisation reportée');
        return { synced: 0, failed: 0 };
    }

    isSyncing = true;
    let synced = 0;
    let failed = 0;

    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006';
        const pending: PendingContract[] = await getAllPendingContracts();

        if (pending.length === 0) {
            console.log('[ContractsSyncService] Aucun contrat en attente');
            return { synced: 0, failed: 0 };
        }

        console.log(`[ContractsSyncService] ${pending.length} contrat(s) en attente de synchronisation`);

        for (const item of pending) {
            try {
                let finalSignature = item.contractData.signature || 'SIG_ELEC';

                // Upload de la signature si présente
                if (item.signatureDataUrl) {
                    finalSignature = await uploadSignature(item.signatureDataUrl, item.victimId);
                }

                const payload = {
                    ...item.contractData,
                    signature: finalSignature,
                };

                const resp = await fetch(`${baseUrl}/contrat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (!resp.ok) {
                    const errorText = await resp.text();
                    console.log('[ContractsSyncService] Erreur API:', errorText);
                    failed++;
                    continue;
                }

                await deletePendingContract(item.id as number);
                synced++;
                console.log(`[ContractsSyncService] ✓ Contrat synchronisé pour victime ${item.victimId}`);
            } catch (err) {
                console.log('[ContractsSyncService] Erreur lors de la synchro d\'un contrat:', err);
                failed++;
            }
        }

        console.log(`[ContractsSyncService] Synchronisation terminée: ${synced} réussi(s), ${failed} échec(s)`);
    } catch (err) {
        console.log('[ContractsSyncService] Erreur globale de synchro:', err);
    } finally {
        isSyncing = false;
    }

    return { synced, failed };
};

// Démarrer la synchronisation automatique
export const startContractsSyncService = () => {
    console.log('[ContractsSyncService] Démarrage du service de synchronisation');

    // Synchroniser immédiatement si en ligne
    if (isOnline()) {
        syncPendingContracts();
    }

    // Écouter l'événement online
    const handleOnline = () => {
        console.log('[ContractsSyncService] Connexion rétablie, synchronisation...');
        syncPendingContracts();
    };

    window.addEventListener('online', handleOnline);

    // Synchronisation périodique toutes les 30 secondes (si en ligne)
    syncInterval = setInterval(() => {
        if (isOnline()) {
            syncPendingContracts();
        }
    }, 30000);

    // Retourner une fonction de cleanup
    return () => {
        console.log('[ContractsSyncService] Arrêt du service de synchronisation');
        window.removeEventListener('online', handleOnline);
        if (syncInterval) {
            clearInterval(syncInterval);
            syncInterval = null;
        }
    };
};

// Vérifier s'il y a des contrats en attente
export const hasPendingContracts = async (): Promise<boolean> => {
    try {
        const pending = await getAllPendingContracts();
        return pending.length > 0;
    } catch {
        return false;
    }
};

// Obtenir le nombre de contrats en attente
export const getPendingContractsCount = async (): Promise<number> => {
    try {
        const pending = await getAllPendingContracts();
        return pending.length;
    } catch {
        return 0;
    }
};
