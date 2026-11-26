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

export const readSyncHttpError = async (response: Response, action: string): Promise<Error> => {
  const text = await response.text().catch(() => '');
  const payload = parseJsonSafely(text);
  const detail = payload?.message ?? payload?.error ?? (payload === null && !text.trimStart().startsWith('<') ? text : '');
  const messages = (Array.isArray(detail) ? detail : [detail]).filter((value): value is string => typeof value === 'string');
  const message = messages.join(' · ')
    .replace(/(?:https?:\/\/|data:[\w.+/-]+;base64,|Bearer\s+)\S+/gi, '…')
    .slice(0, 500).trim();
  return Object.assign(new Error(`${action} (HTTP ${response.status})${message ? ` — ${message}` : ''}`), { status: response.status });
};

const readUploadPayload = async (response: Response) => {
  if (!response.ok) {
    throw await readSyncHttpError(response, 'Envoi du fichier refusé');
  }
  return response.json().catch(() => null);
};

export const readUploadResponseLink = async (response: Response): Promise<string> => {
  const link = extractUploadedFileLink(await readUploadPayload(response));
  if (!link) throw new Error('Le serveur n’a pas renvoyé la référence du fichier envoyé.');
  return link;
};

// Une URL MinIO signée sert à afficher le fichier et expire. L’API conserve sa clé.
export const readUploadedFileReference = async (response: Response, { allowSignedUrl = false } = {}): Promise<string> => {
  const payload = await readUploadPayload(response);
  const records = [payload, payload?.data, payload?.file, payload?.data?.file];
  for (const file of records) {
    const key = pickString(file?.key, file?.filename, file?.fileName);
    if (key) return key;
  }
  for (const file of records) {
    for (const value of [file?.path, file?.lien, file?.src, file?.link, file?.url]) {
      const link = pickString(value);
      if (link && !/[?&]X-Amz-(?:Signature|Credential)=/i.test(link)) return link;
    }
  }
  const fallback = allowSignedUrl && extractUploadedFileLink(payload);
  if (fallback) return fallback;
  throw new Error('Le serveur n’a pas renvoyé de référence permanente pour le fichier envoyé.');
};
