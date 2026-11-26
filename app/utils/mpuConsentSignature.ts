import { getVictimFileUrl, listVictimDocuments, type VictimDocument } from './victimDocumentApi';

export const getMpuSignerField = (incapableConsentir: boolean) =>
    incapableConsentir ? 'signatureRepresentant' : 'signatureBeneficiaire';

// Les actes conservent la clé de l’objet, y compris son éventuel préfixe de dossier.
export function getMpuSignatureFileKey(value: unknown): string {
    if (typeof value !== 'string') return '';
    const reference = value.trim();
    if (!reference || reference === 'SIG_ELEC' || /[?#]/.test(reference)) return '';

    let key = reference;
    if (/^https?:\/\//i.test(reference) || /^\/?minio\/files\//.test(reference)) {
        try {
            const { pathname } = new URL(reference, 'https://local.invalid/');
            const marker = '/minio/files/';
            const index = pathname.indexOf(marker);
            if (index === -1) return '';
            key = decodeURIComponent(pathname.slice(index + marker.length));
        } catch {
            return '';
        }
    }
    if (!key || /^[a-z][\w+.-]*:/i.test(key) || /[?#\\]/.test(key) || key.split('/').some(part => !part || part === '.' || part === '..')) return '';
    return key;
}

export function resolveMpuSignatureUrl(reference: string): Promise<string> {
    if (reference.startsWith('data:image/')) return Promise.resolve(reference);
    const key = getMpuSignatureFileKey(reference);
    if (key) return getVictimFileUrl(key);
    // Les anciens liens directs restent affichables même s’ils ne peuvent pas être écrits comme clé.
    if (/^https?:\/\//i.test(reference)) return Promise.resolve(reference);
    return Promise.reject(new Error('La référence de la signature est illisible.'));
}

function capturedAtOf(document: VictimDocument, consentId: number): number | undefined {
    const prefix = `Signature de l’acte de consentement MPU n°${consentId} · `;
    if (document.label.startsWith(prefix)) {
        const time = Date.parse(document.label.slice(prefix.length));
        if (Number.isFinite(time)) return time;
    }
    // Les pièces de l’ancien parcours portent l’identifiant d’acte dans le nom d’origine.
    const pattern = new RegExp(`^signature_consentement_mpu_${consentId}_(\\d+)\\.(?:png|jpg|webp|gif)$`, 'i');
    for (const name of [document.originalName, document.name, document.label]) {
        const match = typeof name === 'string' && pattern.exec(name);
        if (match) return Number(match[1]);
    }
}

// Sans horodatage précis, la fiche peut proposer de rattacher la dernière capture de cet acte.
export async function getMpuConsentDocumentReference(victimId: number, consentId: number, capturedAt?: number): Promise<string> {
    const documents = await listVictimDocuments(victimId);
    let latestTime = -Infinity;
    let reference = '';
    for (const doc of documents) {
        const time = capturedAtOf(doc, consentId);
        if (time === undefined || (capturedAt !== undefined && time !== capturedAt) || time < latestTime) continue;
        const storedName = doc.name === doc.originalName ? undefined : doc.name;
        const key = [doc.key, doc.fileName, doc.filename, doc.lien, storedName].map(getMpuSignatureFileKey).find(Boolean);
        if (time > latestTime || !reference) reference = key || '';
        latestTime = time;
    }
    if (latestTime > -Infinity && !reference) throw new Error('La pièce retrouvée pour cet acte ne contient pas de clé MinIO permanente.');
    return reference;
}
