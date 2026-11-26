'use client';
import { getAllPendingContracts, recordPendingContractSync, type PendingContract } from './contractsCache';
import { isOnline } from './victimsCache';
import { authenticatedFetch, getAuthToken } from './authFetch';
import { getConnectedAgentFullName } from './currentUser';
import { getMpuConsentDocumentReference, getMpuSignerField, getMpuSignatureFileKey } from './mpuConsentSignature';
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
    if ([data?.victimeId, data?.victime?.id].some(id => id != null && positiveId(id) !== victimId)) {
        throw new Error('Le consentement retourné appartient à une autre victime.');
    }
    return positiveId(data?.id);
};

type ServerConsent = {
    id: number;
    incapableConsentir?: boolean;
    signatureBeneficiaire?: string | null;
    signatureRepresentant?: string | null;
};

const findConsent = async (victimId: number): Promise<ServerConsent | undefined> => {
    const resp = await authenticatedFetch(`${consentEndpoint()}/victime/${victimId}`, { cache: 'no-store' });
    if (resp.status === 404 || resp.status === 204) return undefined;
    if (!resp.ok) throw await readSyncHttpError(resp, 'Lecture du consentement MPU');
    const raw = await resp.json();
    if (raw === null || raw?.data === null) return undefined;
    const id = readConsentId(raw, victimId);
    if (!id) throw new Error('La recherche du consentement MPU a renvoyé un acte sans identifiant.');
    return { ...(raw?.data ?? raw), id };
};

const writeConsentMetadata = async (data: Record<string, unknown>, victimId: number, consentId?: number) => {
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
    return consentId ?? readConsentId(await resp.json().catch(() => null), victimId);
};

const missingSignature = 'Tracé de signature absent. Ouvrez l’acte de consentement dans la fiche de la victime pour le signer.';

async function uploadMpuSignature(dataUrl: string, victimId: number, capturedAt: number): Promise<string> {
    const image = await (await fetch(dataUrl)).blob();
    const extensions: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
    const extension = extensions[image.type];
    if (!extension || !image.size) throw new Error('Le tracé de signature est vide ou illisible.');

    const form = new FormData();
    form.append('file', image, `signature_${victimId}_${capturedAt}.${extension}`);
    const response = await authenticatedFetch(`${getBaseUrl()}/minio/files/upload`, { method: 'POST', body: form });
    if (!response.ok) throw await readSyncHttpError(response, 'Envoi de la signature MPU à MinIO');

    const result = await response.json().catch(() => null);
    const filename = getMpuSignatureFileKey(result?.filename ?? result?.data?.filename);
    if (!filename) throw new Error('MinIO n’a pas renvoyé le champ filename permanent de la signature MPU.');
    return filename;
}

function localConsentSignature(item: PendingContract, role: unknown): string {
    const data = item.contractData ?? {};
    const hasRole = typeof role === 'boolean';
    const signerReference = hasRole ? data[getMpuSignerField(role)] : undefined;
    const otherReference = hasRole ? data[getMpuSignerField(!role)] : undefined;
    const legacyReference = data.signature !== otherReference ? data.signature : undefined;
    for (const reference of [item.signatureFileKey, item.signatureDataUrl, signerReference, legacyReference]) {
        if (typeof reference === 'string' && reference.startsWith('data:image/')) return reference;
        const key = getMpuSignatureFileKey(reference);
        if (key) return key;
    }
    return '';
}

const syncConsent = async (item: PendingContract) => {
    const data = item.contractData ?? {};
    const victimId = positiveId(item.victimId);
    if (!victimId) throw new Error('Identifiant de la victime manquant pour cet acte.');
    let consent = await findConsent(victimId);
    const targetId = positiveId(item.targetId);
    if ((targetId && targetId !== consent?.id) || (item.action === 'update' && !consent)) {
        throw new Error('Le consentement à modifier n’a pas été retrouvé pour cette victime.');
    }

    if (!consent || !item.consentMetadataSynced) {
        // Recover the server act first if an offline creation or its response was interrupted.
        if (!consent && !localConsentSignature(item, data.incapableConsentir)) throw new Error(missingSignature);
        const id = await writeConsentMetadata(data, victimId, consent?.id);
        if (id && !await recordPendingContractSync(item, id)) return false;
        consent = await findConsent(victimId);
        if (!consent || (id && consent.id !== id)) throw new Error('Le serveur n’a pas confirmé l’identifiant du consentement.');
        if (!id && !await recordPendingContractSync(item, consent.id)) return false;
    }

    const signerRole = consent.incapableConsentir ?? data.incapableConsentir;
    if (typeof signerRole !== 'boolean') throw new Error('Le rôle du signataire de cet acte MPU est indéterminé.');
    if (typeof data.incapableConsentir === 'boolean' && data.incapableConsentir !== signerRole) {
        throw new Error('Le rôle du signataire diffère entre la saisie locale et l’acte enregistré.');
    }
    const field = getMpuSignerField(signerRole);
    const local = localConsentSignature(item, signerRole);
    const remote = getMpuSignatureFileKey(consent[field]);
    if (item.expectedSignatureFileKey !== undefined && consent[field] && consent[field] !== 'SIG_ELEC' &&
        remote !== local && (remote || consent[field]) !== item.expectedSignatureFileKey) {
        throw new Error('La signature de cet acte a changé sur le serveur depuis la saisie. Vérifiez l’acte avant de le modifier.');
    }
    const capturedAt = item.signatureCapturedAt ?? item.createdAt;
    let key = getMpuSignatureFileKey(local);
    if (local.startsWith('data:image/')) {
        // The earlier sync could have attached this exact capture as a victim document.
        if (item.consentMetadataSynced && item.expectedSignatureFileKey === undefined) {
            key = await getMpuConsentDocumentReference(victimId, consent.id, capturedAt).catch(() => '');
        }
        if (!key) key = await uploadMpuSignature(local, victimId, capturedAt);
    } else if (!key) {
        key = remote || await getMpuConsentDocumentReference(victimId, consent.id, capturedAt);
        if (!key) throw new Error(missingSignature);
    }

    if (consent[field] !== key) {
        if (!await recordPendingContractSync(item, consent.id, key)) return false;
        const resp = await authenticatedFetch(`${consentEndpoint()}/${consent.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: key }),
        });
        if (!resp.ok) throw await readSyncHttpError(resp, `Rattachement du fichier à l’acte MPU dans ${field}`);
        const confirmed = await findConsent(victimId);
        if (confirmed?.id !== consent.id || confirmed[field] !== key ||
            (typeof confirmed.incapableConsentir === 'boolean' && confirmed.incapableConsentir !== signerRole)) {
            throw new Error(`Le serveur n’a pas confirmé le fichier de signature dans ${field}. L’acte reste en attente sur cet appareil.`);
        }
    }
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
