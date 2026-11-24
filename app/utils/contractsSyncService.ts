'use client';
import { getAllPendingContracts, deletePendingContract, PendingContract } from './contractsCache';
import { isOnline } from './victimsCache';
import { authenticatedFetch, getAuthToken } from './authFetch';
import { getConnectedAgentFullName } from './currentUser';
import type { SyncProgressCallback } from './syncProgress';

let isSyncing = false;
let syncInterval: NodeJS.Timeout | null = null;

const uploadSignature = async (dataUrl: string, victimId: number): Promise<string> => {
    const uploadEndpoint = process.env.NEXT_PUBLIC_UPLOAD_ENDPOINT || 'https://360.fonasite.app:5521/minio/files/upload';

    const res = await fetch(dataUrl);
    const blob = await res.blob();

    const file = new File([blob], `signature_${victimId}_${Date.now()}.png`, { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', file);

    const resp = await authenticatedFetch(uploadEndpoint, {
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

const getPendingTargetType = (item: PendingContract): 'contrat' | 'consentement-mpu' => (
    item.targetType === 'consentement-mpu' ? 'consentement-mpu' : 'contrat'
);

const buildPendingPayload = (
    item: PendingContract,
    finalSignature: string
): { endpoint: string; payload: any; label: string } => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006';
    const targetType = getPendingTargetType(item);

    if (targetType === 'consentement-mpu') {
        const isRepresentantSignature = Boolean(
            item.contractData?.incapableConsentir ||
            item.contractData?.nomRepresentant ||
            item.contractData?.signatureRepresentant
        );
        const signatureField = isRepresentantSignature ? 'signatureRepresentant' : 'signatureBeneficiaire';

        return {
            endpoint: `${baseUrl}/consentements-mpu`,
            label: 'Acte de consentement MPU',
            payload: {
                ...item.contractData,
                [signatureField]: finalSignature,
                nomAgentFonarev: item.contractData?.nomAgentFonarev || getConnectedAgentFullName(),
            },
        };
    }

    const {
        nomAgentFonarev: pendingAgentName,
        metadataContrat,
        ...contractDataWithoutAgent
    } = item.contractData || {};
    const { nomAgentFonarev: _metadataAgentName, ...metadataWithoutAgent } = metadataContrat || {};
    const agentFullName = typeof pendingAgentName === 'string' && pendingAgentName.trim()
        ? pendingAgentName.trim()
        : getConnectedAgentFullName() || '';

    return {
        endpoint: `${baseUrl}/contrat`,
        label: 'Contrat',
        payload: {
            ...contractDataWithoutAgent,
            ...(metadataContrat ? { metadataContrat: metadataWithoutAgent } : {}),
            signature: finalSignature,
            planIndemnisation: Array.isArray(contractDataWithoutAgent.planIndemnisation)
                ? contractDataWithoutAgent.planIndemnisation.map((plan: any) => ({
                    ...plan,
                    nomAgentFonarev: typeof plan?.nomAgentFonarev === 'string' && plan.nomAgentFonarev.trim()
                        ? plan.nomAgentFonarev.trim()
                        : agentFullName,
                }))
                : contractDataWithoutAgent.planIndemnisation,
        },
    };
};

export const syncPendingContracts = async (opts?: {
    targetType?: 'contrat' | 'consentement-mpu';
    onProgress?: SyncProgressCallback;
}): Promise<{ synced: number; failed: number; skipped: number }> => {
    if (isSyncing) {
        console.log('[ContractsSyncService] Synchronisation déjà en cours...');
        return { synced: 0, failed: 0, skipped: 0 };
    }

    if (!isOnline() || !getAuthToken()) {
        console.log('[ContractsSyncService] Hors ligne, synchronisation reportée');
        return { synced: 0, failed: 0, skipped: 0 };
    }

    isSyncing = true;
    let synced = 0;
    let failed = 0;
    let skipped = 0;

    try {
        const allPending: PendingContract[] = await getAllPendingContracts();
        const pending = opts?.targetType
            ? allPending.filter((item) => getPendingTargetType(item) === opts.targetType)
            : allPending;
        let processed = 0;
        const reportProgress = (message?: string) => opts?.onProgress?.({ total: pending.length, processed, synced, failed, skipped, message });
        reportProgress(pending.length ? 'Préparation des contrats et actes…' : 'Aucun contrat ou acte à envoyer.');

        if (pending.length === 0) {
            console.log('[ContractsSyncService] Aucun document en attente');
            return { synced: 0, failed: 0, skipped: 0 };
        }

        console.log(`[ContractsSyncService] ${pending.length} document(s) en attente de synchronisation`);

        for (const item of pending) {
            if (!getAuthToken()) { reportProgress('Envoi interrompu : reconnectez-vous pour continuer.'); break; }
            try {
                const targetType = getPendingTargetType(item);
                const isUpdate = item.action === 'update' && Number.isFinite(item.targetId);
                let finalSignature = item.contractData.signature
                    || item.contractData.signatureBeneficiaire
                    || item.contractData.signatureRepresentant
                    || 'SIG_ELEC';

                // Upload de la signature si présente
                if (item.signatureDataUrl) {
                    finalSignature = await uploadSignature(item.signatureDataUrl, item.victimId);
                }

                const built = buildPendingPayload(item, finalSignature);
                const endpoint = isUpdate
                    ? `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006'}/${targetType === 'consentement-mpu' ? 'consentements-mpu' : 'contrat'}/${item.targetId}`
                    : built.endpoint;
                const payload = built.payload;
                const label = built.label;

                const resp = await authenticatedFetch(endpoint, {
                    method: isUpdate ? 'PATCH' : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (!resp.ok) {
                    const errorText = await resp.text();
                    console.log('[ContractsSyncService] Erreur API:', errorText);

                    failed++;
                    processed++;
                    const reason = resp.status === 409 || errorText.toLowerCase().includes('exist')
                        ? `conflit détecté, l’acte reste conservé dans la file (${errorText || `HTTP ${resp.status}`})`
                        : errorText || `HTTP ${resp.status}`;
                    reportProgress(`Blocage sur l’élément ${processed}/${pending.length}: ${reason}`);
                    continue;
                }

                await deletePendingContract(item.id as number);
                synced++;
                processed++;
                reportProgress(`Élément ${processed}/${pending.length} synchronisé.`);
                console.log(`[ContractsSyncService] ✓ ${label} synchronisé pour victime ${item.victimId}`);
            } catch (err) {
                console.log('[ContractsSyncService] Erreur lors de la synchro d\'un document:', err);
                failed++;
                processed++;
                const message = err instanceof Error ? err.message : String(err);
                reportProgress(`Blocage sur l’élément ${processed}/${pending.length}: ${message}`);
            }
        }

        if (processed < pending.length && getAuthToken()) reportProgress('Synchronisation interrompue avant la fin.');

        console.log(`[ContractsSyncService] Synchronisation terminée: ${synced} créé(s), ${skipped} déjà existant(s), ${failed} échec(s)`);
    } catch (err) {
        console.log('[ContractsSyncService] Erreur globale de synchro:', err);
    } finally {
        isSyncing = false;
    }

    return { synced, failed, skipped };
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
