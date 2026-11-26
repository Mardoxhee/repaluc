'use client';
import { getAllPendingContracts, recordPendingContractSync, type PendingContract } from './contractsCache';
import { isOnline } from './victimsCache';
import { authenticatedFetch, getAuthToken } from './authFetch';
import { getConnectedAgentFullName } from './currentUser';
import { ensureMpuConsentSignatureDocument, getLegacyMpuSignatureReference, readMpuConsentSignatureUrl } from './mpuConsentSignature';
import { readUploadedFileReference, readSyncHttpError } from './uploadResponse';
import type { SyncProgressCallback } from './syncProgress';

const getBaseUrl = () => (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006').replace(/\/$/, '');
const consentEndpoint = () => `${getBaseUrl()}/consentements-mpu`;
let queuedSync: Promise<unknown> = Promise.resolve();

const uploadSignature = async (dataUrl: string, victimId: number): Promise<string> => {
    const uploadEndpoint = process.env.NEXT_PUBLIC_UPLOAD_ENDPOINT || `${getBaseUrl()}/minio/files/upload`;

    const res = await fetch(dataUrl);
    const blob = await res.blob();

    const file = new File([blob], `signature_${victimId}_${Date.now()}.png`, { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', file);

    const resp = await authenticatedFetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
    });

    return readUploadedFileReference(resp, { allowSignedUrl: true });
};

const getPendingTargetType = (item: PendingContract): 'contrat' | 'consentement-mpu' => (
    item.targetType === 'consentement-mpu' ? 'consentement-mpu' : 'contrat'
);

const buildContractPayload = (item: PendingContract, finalSignature: string) => {
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
    };
};

const consentFields = [
    'etatVictimisation', 'situationVulnerabiliteUrgente', 'mesuresProposees', 'autresMesures',
    'vulnerabilites', 'autresVulnerabilites', 'informeMpu', 'droitsExpliques', 'aExerceDroit',
    'engagementsAcceptes', 'mediateurFonarev', 'accompagnementPersonneConfiance', 'incapableConsentir',
    'nomRepresentant', 'qualiteRepresentant', 'organisationRepresentant', 'pieceIdentiteRepresentant',
    'decisionConsentement', 'dateConsentement', 'lieuConsentement', 'nomAgentFonarev', 'fonctionAgentFonarev',
] as const;

const positiveId = (value: unknown): number | undefined => {
    if (typeof value !== 'number' && typeof value !== 'string') return undefined;
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : undefined;
};

const readConsentId = (raw: any, victimId: number): number | undefined => {
    const data = raw?.data ?? raw;
    if (data?.victimeId != null && positiveId(data.victimeId) !== victimId) {
        throw new Error('Le consentement retourné appartient à une autre victime.');
    }
    return positiveId(data?.id);
};

const findConsent = async (victimId: number): Promise<{ id: number; signature: string } | undefined> => {
    const resp = await authenticatedFetch(`${consentEndpoint()}/victime/${victimId}`, { cache: 'no-store' });
    if (resp.status === 404 || resp.status === 204) return undefined;
    if (!resp.ok) throw await readSyncHttpError(resp, 'Recherche du consentement MPU');
    const raw = await resp.json();
    if (raw === null || raw?.data === null) return undefined;
    const id = readConsentId(raw, victimId);
    if (!id) throw new Error('La recherche du consentement MPU a renvoyé un acte sans identifiant.');
    return { id, signature: getLegacyMpuSignatureReference(raw?.data ?? raw) };
};

const syncConsent = async (item: PendingContract) => {
    const data = item.contractData ?? {};
    const victimId = positiveId(item.victimId);
    if (!victimId) throw new Error('Identifiant de la victime manquant pour cet acte.');
    const signature = item.signatureDataUrl || getLegacyMpuSignatureReference(data);
    let consentId = positiveId(item.targetId);
    if (!consentId || !signature) {
        // An offline creation may refer to an existing act, including a POST whose response was lost.
        const existing = await findConsent(victimId);
        if (consentId && consentId !== existing?.id) throw new Error('Le consentement à modifier n’a pas été retrouvé pour cette victime.');
        consentId = existing?.id;
        if (!signature && !(existing && await readMpuConsentSignatureUrl(victimId, existing.id, existing.signature))) {
            throw new Error('Tracé de signature absent. Ouvrez l’acte de consentement dans la fiche de la victime pour le signer.');
        }
    }
    if (!item.consentMetadataSynced || !consentId) {
        const payload: Record<string, unknown> = {};
        for (const field of consentFields) {
            if (data[field] != null) payload[field] = data[field];
        }
        if (typeof payload.dateConsentement === 'string' && /^\d{4}-\d\d-\d\dT/.test(payload.dateConsentement)) {
            payload.dateConsentement = payload.dateConsentement.slice(0, 10);
        }
        if (!consentId) payload.victimeId = victimId;
        const resp = await authenticatedFetch(consentId ? `${consentEndpoint()}/${consentId}` : consentEndpoint(), {
            method: consentId ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!resp.ok) throw await readSyncHttpError(resp, 'Enregistrement du consentement MPU');
        if (!consentId) {
            consentId = readConsentId(await resp.json().catch(() => null), victimId) ?? (await findConsent(victimId))?.id;
        }
        if (!consentId) throw new Error('Le serveur n’a pas confirmé l’identifiant du consentement. La signature reste sur cet appareil.');
        if (!await recordPendingContractSync(item, consentId)) return false;
    }

    if (signature) await ensureMpuConsentSignatureDocument(victimId, consentId, signature, item.signatureCapturedAt ?? item.createdAt);
    return recordPendingContractSync(item);
};

const syncContract = async (item: PendingContract) => {
    const signature = item.signatureDataUrl
        ? await uploadSignature(item.signatureDataUrl, item.victimId)
        : item.contractData?.signature || item.contractData?.signatureBeneficiaire || item.contractData?.signatureRepresentant || 'SIG_ELEC';
    const isUpdate = item.action === 'update';
    if (isUpdate && !positiveId(item.targetId)) throw new Error('Identifiant du contrat à modifier manquant.');
    const endpoint = `${getBaseUrl()}/contrat${isUpdate ? `/${item.targetId}` : ''}`;
    const resp = await authenticatedFetch(endpoint, {
        method: isUpdate ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildContractPayload(item, signature)),
    });
    if (!resp.ok) throw await readSyncHttpError(resp, 'Enregistrement du contrat');
    return recordPendingContractSync(item);
};

type SyncOptions = { targetType?: PendingContract['targetType']; onProgress?: SyncProgressCallback };

const runPendingContracts = async (opts: SyncOptions) => {
    const pending = (await getAllPendingContracts()).filter((item) => !opts.targetType || getPendingTargetType(item) === opts.targetType);
    let synced = 0;
    let failed = 0;
    let skipped = 0;
    const report = (message: string) => opts.onProgress?.({ total: pending.length, processed: synced + failed + skipped, synced, failed, skipped, message });
    report(pending.length ? 'Préparation des contrats et actes…' : 'Aucun contrat ou acte à envoyer.');
    for (const item of pending) {
        if (!isOnline() || !getAuthToken()) {
            failed++;
            skipped = pending.length - synced - failed;
            report('Envoi interrompu. Vérifiez la connexion et la session pour continuer.');
            break;
        }
        try {
            const completed = getPendingTargetType(item) === 'consentement-mpu' ? await syncConsent(item) : await syncContract(item);
            if (!completed) throw new Error('L’élément a été modifié pendant l’envoi. Relancez la synchronisation de la nouvelle version.');
            synced++;
            report('Synchronisation confirmée.');
        } catch (error) {
            failed++;
            report(`Victime ${item.victimId} — ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    return { synced, failed, skipped };
};

export const syncPendingContracts = (opts: SyncOptions = {}) => {
    const run = () => runPendingContracts(opts);
    // The settings and automatic LUC sync may start together or run in separate tabs.
    const result = queuedSync.then(() => typeof navigator !== 'undefined' && navigator.locks
        ? navigator.locks.request('fonops-pending-contracts', run)
        : run());
    queuedSync = result.catch(() => {});
    return result;
};

export const startContractsSyncService = () => {
    const syncOnlineContracts = () => {
        if (isOnline()) {
            void syncPendingContracts({ targetType: 'contrat' }).catch(error => console.warn('[ContractsSyncService]', error));
        }
    };
    syncOnlineContracts();
    window.addEventListener('online', syncOnlineContracts);
    const interval = setInterval(syncOnlineContracts, 30000);
    return () => {
        window.removeEventListener('online', syncOnlineContracts);
        clearInterval(interval);
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
