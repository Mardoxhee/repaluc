'use client';

import { authenticatedFetch } from './authFetch';
import { readSyncHttpError } from './uploadResponse';

export interface VictimDocument {
  id: number;
  label: string;
  name?: string;
  lien?: string;
  [key: string]: unknown;
}

const getBaseUrl = () => (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006').replace(/\/$/, '');
export type VictimDocumentCategory = 'document' | 'medical' | 'consent' | 'proof' | 'signature';

export class VictimDocumentApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'VictimDocumentApiError';
    this.status = status;
  }
}

const readPayload = async (response: Response, action: string): Promise<any> => {
  if (!response.ok) {
    const error = await readSyncHttpError(response, action);
    throw new VictimDocumentApiError(error.message, response.status);
  }
  return response.json().catch(() => null);
};

const asDocumentArray = (payload: any): any[] => {
  const candidates = [payload, payload?.data, payload?.documentVictime, payload?.documents,
    payload?.data?.documentVictime, payload?.data?.documents, payload?.result];
  return candidates.find(Array.isArray) || [];
};

export const normalizeVictimDocuments = (payload: any): VictimDocument[] => asDocumentArray(payload)
  .map((doc: any) => {
    const reference = doc?.lien ?? doc?.key ?? doc?.path ?? doc?.url ?? doc?.src ?? (typeof doc?.file === 'string' ? doc.file : doc?.file?.url);
    return {
      ...doc,
      id: Number(doc?.id ?? doc?.documentId),
      label: String(doc?.label ?? doc?.originalName ?? doc?.fileName ?? doc?.filename ?? 'Document'),
      name: String(doc?.fileName ?? doc?.filename ?? doc?.name ?? doc?.originalName ?? reference ?? ''),
      lien: typeof reference === 'string' ? reference : undefined,
    };
  })
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

export const getVictimFileUrl = async (reference: string): Promise<string> => {
  const value = reference.trim();
  if (!value) throw new Error('Référence du document indisponible.');
  let endpoint: string;
  if (/^https?:\/\//i.test(value)) {
    const parsed = new URL(value);
    if (!parsed.pathname.includes('/minio/files/')) return value;
    endpoint = value;
  } else if (value.startsWith('/minio/files/')) {
    endpoint = `${getBaseUrl()}${value}`;
  } else if (value.startsWith('minio/files/')) {
    endpoint = `${getBaseUrl()}/${value}`;
  } else {
    endpoint = `${getBaseUrl()}/minio/files/${value.split('/').map(encodeURIComponent).join('/')}`;
  }

  const response = await authenticatedFetch(endpoint, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const payload = await readPayload(response, 'Récupération du lien du document impossible');
  const candidates = [payload?.url, payload?.data?.url, payload?.data?.src, payload?.src, payload?.data?.data?.url];
  const url = candidates.find((candidate) => typeof candidate === 'string' && /^https?:\/\//i.test(candidate));
  if (!url) throw new Error('Le serveur n’a pas renvoyé l’URL directe du document.');
  return url;
};
