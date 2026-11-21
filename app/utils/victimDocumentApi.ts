'use client';

import { authenticatedFetch } from './authFetch';

export interface VictimDocument {
  id: number;
  label: string;
  name?: string;
  lien?: string;
  [key: string]: unknown;
}

const getBaseUrl = () => (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006').replace(/\/$/, '');
export type VictimDocumentCategory = 'document' | 'medical' | 'consent' | 'proof' | 'signature';

const readPayload = async (response: Response, action: string): Promise<any> => {
  const text = await response.text().catch(() => '');
  let payload: any = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = null; }
  if (!response.ok) {
    const message = payload?.message || payload?.error || text;
    throw new Error(`${action} (${response.status})${message ? `: ${message}` : ''}`);
  }
  return payload;
};

const asDocumentArray = (payload: any): any[] => {
  const candidates = [payload, payload?.data, payload?.documentVictime, payload?.documents,
    payload?.data?.documentVictime, payload?.data?.documents, payload?.result];
  return candidates.find(Array.isArray) || [];
};

export const normalizeVictimDocuments = (payload: any): VictimDocument[] => asDocumentArray(payload)
  .map((doc: any) => ({
    ...doc,
    id: Number(doc?.id ?? doc?.documentId),
    label: String(doc?.label ?? doc?.originalName ?? doc?.fileName ?? doc?.filename ?? 'Document'),
    name: String(doc?.fileName ?? doc?.filename ?? doc?.originalName ?? doc?.name ?? doc?.lien ?? ''),
    lien: typeof (doc?.lien ?? doc?.key ?? doc?.path) === 'string' ? (doc.lien ?? doc.key ?? doc.path) : undefined,
  }))
  .filter((doc: VictimDocument) => Number.isFinite(doc.id) && doc.id > 0);

export const listVictimDocuments = async (victimId: number): Promise<VictimDocument[]> => {
  const response = await authenticatedFetch(`${getBaseUrl()}/document-victime/by-id-victime/${victimId}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  return normalizeVictimDocuments(await readPayload(response, 'Récupération des documents impossible'));
};

export const uploadVictimDocument = async (
  victimId: number,
  file: File,
  label: string,
  category: VictimDocumentCategory = 'document'
): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  if (label.trim()) formData.append('label', label.trim());

  const response = await authenticatedFetch(`${getBaseUrl()}/document-victime/victime/${victimId}/upload`, {
    method: 'POST',
    body: formData,
  });
  return readPayload(response, 'Upload du document impossible');
};

export const getVictimDocumentDownloadUrl = async (documentId: number): Promise<string> => {
  const response = await authenticatedFetch(`${getBaseUrl()}/document-victime/${documentId}/download-url`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const payload = await readPayload(response, 'Lien de téléchargement indisponible');
  const candidates = [payload, payload?.url, payload?.src, payload?.downloadUrl, payload?.signedUrl, payload?.link,
    payload?.data, payload?.data?.url, payload?.data?.src, payload?.data?.downloadUrl, payload?.data?.signedUrl, payload?.data?.link];
  const url = candidates.find((value) => typeof value === 'string' && /^https?:\/\//i.test(value));
  if (!url) throw new Error('Le serveur n’a pas renvoyé de lien de téléchargement valide.');
  return url;
};
