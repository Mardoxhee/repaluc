import { getVictimFileUrl, listVictimDocuments, uploadVictimDocument, VictimDocumentApiError } from './victimDocumentApi';
import type { VictimDocument } from './victimDocumentApi';

const labelPrefix = (consentId: number) => `Signature de l’acte de consentement MPU n°${consentId} · `;
const filePrefix = (consentId: number) => `signature_consentement_mpu_${consentId}_`;

type LegacySignatures = { signature?: unknown; signatureBeneficiaire?: unknown; signatureRepresentant?: unknown };

export function getLegacyMpuSignatureReference(data?: LegacySignatures | null): string {
    for (const value of [data?.signature, data?.signatureBeneficiaire, data?.signatureRepresentant]) {
        if (typeof value === 'string' && value.trim() && value.trim() !== 'SIG_ELEC') return value.trim();
    }
    return '';
}

function resolveSignatureUrl(reference: string): Promise<string> {
    if (reference.startsWith('data:image/')) return Promise.resolve(reference);
    if (/^https?:\/\//i.test(reference)) {
        const { pathname } = new URL(reference);
        const index = pathname.indexOf('/minio/files/');
        if (index >= 0) return getVictimFileUrl(pathname.slice(index));
    }
    return getVictimFileUrl(reference);
}

async function readSignatureImage(reference: string): Promise<Blob> {
    if (reference.startsWith('data:')) {
        const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/i.exec(reference);
        if (!match) throw new Error('Le tracé local de la signature est illisible.');
        return new Blob([Uint8Array.from(atob(match[2]), char => char.charCodeAt(0))], { type: match[1] });
    }
    const url = await resolveSignatureUrl(reference);
    const response = await fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!response.ok) throw new Error(`Lecture de la signature enregistrée impossible (HTTP ${response.status}).`);
    return response.blob();
}

function capturedAtOf(document: VictimDocument, consentId: number): number {
    const prefix = labelPrefix(consentId);
    if (document.label.startsWith(prefix)) {
        const capturedAt = Date.parse(document.label.slice(prefix.length));
        if (Number.isFinite(capturedAt)) return capturedAt;
    }
    // Some versions of the document API return the original filename instead of the label.
    const namePrefix = filePrefix(consentId);
    for (const name of [document.originalName, document.name, document.label]) {
        if (typeof name !== 'string' || !name.startsWith(namePrefix)) continue;
        const match = /^(\d+)\.(png|jpg|webp|gif)$/.exec(name.slice(namePrefix.length));
        if (match) return Number(match[1]);
    }
    return NaN;
}

function storedReferenceOf(document: VictimDocument): string {
    // originalName identifies the capture but the server can rename the stored object.
    const permanentLink = document.lien && !/[?&]X-Amz-(?:Signature|Credential)=/i.test(document.lien) ? document.lien : undefined;
    const storageName = document.name !== document.originalName ? document.name : undefined;
    for (const value of [document.key, permanentLink, document.fileName, document.filename, storageName, document.lien]) {
        if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
}

export async function ensureMpuConsentSignatureDocument(
    victimId: number,
    consentId: number,
    signatureReference: string,
    capturedAt: number,
): Promise<void> {
    const alreadyUploaded = async () => {
        const matching = (await listVictimDocuments(victimId)).filter(document => capturedAtOf(document, consentId) === capturedAt);
        if (matching.some(document => storedReferenceOf(document))) return true;
        if (matching.length) throw new Error('La pièce de signature est enregistrée, mais sa référence de fichier manque dans le dossier.');
        return false;
    };
    if (await alreadyUploaded()) return;

    const image = await readSignatureImage(signatureReference);
    if (!image.size || !/^image\/(png|jpeg|webp|gif)$/.test(image.type)) throw new Error('Le fichier de signature ne contient pas une image prise en charge.');
    const extension = image.type === 'image/jpeg' ? 'jpg' : image.type.slice('image/'.length);
    const file = new File([image], `${filePrefix(consentId)}${capturedAt}.${extension}`, { type: image.type });
    const label = `${labelPrefix(consentId)}${new Date(capturedAt).toISOString()}`;
    try {
        await uploadVictimDocument(victimId, file, label, 'signature');
    } catch (error) {
        if (error instanceof VictimDocumentApiError && error.status < 500 && error.status !== 409 && error.status !== 408) throw error;
        // The server might have stored the document before the response was lost.
        if (await alreadyUploaded().catch(() => false)) return;
        throw error;
    }
    if (!await alreadyUploaded()) throw new Error('L’envoi a été accepté, mais la signature n’a pas été retrouvée dans le dossier de la victime.');
}

export async function readMpuConsentSignatureUrl(victimId: number, consentId: number, legacySignature: string): Promise<string> {
    let newest: VictimDocument | undefined;
    try {
        const documents = await listVictimDocuments(victimId);
        newest = documents.map(document => ({
            document,
            capturedAt: capturedAtOf(document, consentId),
            hasFile: Boolean(storedReferenceOf(document)),
        }))
            .filter(({ capturedAt }) => Number.isFinite(capturedAt))
            .sort((a, b) => b.capturedAt - a.capturedAt || Number(b.hasFile) - Number(a.hasFile))[0]?.document;
    } catch (error) {
        if (!legacySignature || legacySignature === 'SIG_ELEC') throw error;
    }
    if (newest) {
        const reference = storedReferenceOf(newest);
        if (!reference) throw new Error('La référence du fichier de signature est absente du dossier.');
        return resolveSignatureUrl(reference);
    }
    return legacySignature && legacySignature !== 'SIG_ELEC' ? resolveSignatureUrl(legacySignature) : '';
}
