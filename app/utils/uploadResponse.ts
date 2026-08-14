"use client";

const parseJsonSafely = (text: string): any => {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
};

const pickString = (...values: any[]): string => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return '';
};

export const extractUploadedFileLink = (payload: any): string => {
  return pickString(
    payload?.url,
    payload?.link,
    payload?.lien,
    payload?.src,
    payload?.path,
    payload?.filename,
    payload?.fileName,
    payload?.data?.url,
    payload?.data?.link,
    payload?.data?.lien,
    payload?.data?.src,
    payload?.data?.path,
    payload?.data?.filename,
    payload?.data?.fileName,
    payload?.file?.url,
    payload?.file?.link,
    payload?.file?.lien,
    payload?.file?.src
  );
};

export const readUploadResponseLink = async (response: Response): Promise<string> => {
  const text = await response.text().catch(() => '');
  const payload = parseJsonSafely(text);

  if (!response.ok) {
    const message = typeof payload?.message === 'string'
      ? payload.message
      : typeof payload?.error === 'string'
        ? payload.error
        : text;
    throw new Error(`Erreur upload fichier (${response.status})${message ? `: ${message}` : ''}`);
  }

  const lien = extractUploadedFileLink(payload);
  if (!lien) {
    throw new Error('Erreur upload fichier: lien du fichier absent dans la réponse serveur');
  }

  return lien;
};
