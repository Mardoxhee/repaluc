'use client';

import {
  getAllPendingVictimPhotos, getVictimPhotosForVictim, markVictimPhotoRejected,
  markVictimPhotoSynced, markVictimPhotoSuperseded, saveVictimPhotoUploadReference, type PendingVictimPhoto,
} from './victimPhotosCache';
import { isOnline } from './victimsCache';
import { authenticatedFetch, getAuthToken } from './authFetch';
import { getConnectedAgentFullName } from './currentUser';
import { readSyncHttpError, readUploadedFileReference } from './uploadResponse';
import type { SyncProgressCallback } from './syncProgress';

let isSyncing = false;
let syncInterval: NodeJS.Timeout | null = null;

const uploadPhoto = async (item: PendingVictimPhoto): Promise<string> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
  const uploadEndpoint = process.env.NEXT_PUBLIC_UPLOAD_ENDPOINT || (baseUrl && `${baseUrl}/minio/files/upload`);
  if (!uploadEndpoint) throw new Error("L’adresse d’envoi des photos n’est pas configurée.");

  if (!item.photoDataUrl?.startsWith('data:')) throw new Error('Image locale introuvable.');
  const blob = await fetch(item.photoDataUrl).then(response => response.blob()).catch(() => {
    throw new Error('Lecture de l’image locale impossible.');
  });
  if (!blob.size) throw new Error('Le fichier photo est vide.');
  const mimeType = blob.type.split(';')[0].toLowerCase();
  const subtype = /^image\/([a-z0-9-]+)(?:\+[a-z0-9-]+)?$/.exec(mimeType)?.[1];
  if (!subtype) throw new Error('Le type de l’image locale est inconnu.');
  const extension = subtype === 'jpeg' ? 'jpg' : subtype;
  const filename = `victim_photo_${item.victimId}_${item.createdAt ?? item.id}.${extension}`;
  const formData = new FormData();
  formData.append('file', blob, filename);

  const response = await authenticatedFetch(uploadEndpoint, { method: 'POST', body: formData });
  return readUploadedFileReference(response);
};

const syncPhoto = async (item: PendingVictimPhoto): Promise<void> => {
  if (!item.id) throw new Error('Photo locale sans identifiant.');
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
  if (!baseUrl) throw new Error("L’adresse de l’API victimes n’est pas configurée.");

  let reference = item.remoteUrl;
  if (!reference) {
    reference = await uploadPhoto(item);
    await saveVictimPhotoUploadReference(item.id, reference);
  }

  const response = await authenticatedFetch(`${baseUrl}/victime/${item.victimId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photo: reference }),
  });
  if (!response.ok) throw await readSyncHttpError(response, 'Association de la photo à la victime');

  await markVictimPhotoSynced(item.id, reference);
  const agentName = getConnectedAgentFullName();
  if (agentName) {
    // L’association de la photo est déjà confirmée, même si le suivi de l’agent échoue.
    await patchVictimAgentReparation(item.victimId, agentName).catch(() => false);
  }
};

const getVictimVariablesSpecifiques = async (victimId: number): Promise<Record<string, any> | null> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL n\'est pas configurée');
  }

  const resp = await authenticatedFetch(`${baseUrl}/victime/${victimId}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!resp.ok) return null;

  const payload = await resp.json().catch(() => null);
  const victim = payload?.data ?? payload;
  const vars = victim?.variablesSpecifiques;
  if (!vars || typeof vars !== 'object') return {};
  return vars;
};

const patchVictimAgentReparation = async (victimId: number, agentFullName: string): Promise<boolean> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL n\'est pas configurée');
  }

  const existingVars = await getVictimVariablesSpecifiques(victimId);
  if (existingVars == null) {
    return false;
  }
  if (existingVars.agentReparation === agentFullName) return true;

  const resp = await authenticatedFetch(`${baseUrl}/victime/${victimId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ variablesSpecifiques: { ...existingVars, agentReparation: agentFullName } }),
  });

  if (!resp.ok) {
    const error = await readSyncHttpError(resp, 'Mise à jour de l’agent de réparation');
    console.warn('[VictimPhotosSync]', error.message);
  }

  return resp.ok;
};

type PhotoSyncResult = { synced: number; failed: number; skipped: number; lastError?: string };
type PhotoSyncOptions = { limit?: number; automatic?: boolean; onProgress?: SyncProgressCallback };

const syncPhotos = async (
  loadPhotos: () => Promise<PendingVictimPhoto[]>,
  options?: PhotoSyncOptions,
): Promise<PhotoSyncResult> => {
  const result: PhotoSyncResult = { synced: 0, failed: 0, skipped: 0 };
  if (isSyncing || !isOnline() || !getAuthToken()) return result;

  isSyncing = true;
  try {
    const photos = await loadPhotos();
    const latestSyncedId = new Map<number, number>();
    for (const photo of photos) {
      if (photo.synced && photo.id) latestSyncedId.set(photo.victimId, Math.max(photo.id, latestSyncedId.get(photo.victimId) ?? 0));
    }
    const limit = options?.limit && options.limit > 0 ? options.limit : undefined;
    const pending = photos.filter(photo => !photo.synced && !photo.superseded).slice(0, limit);
    let processed = 0;
    const reportProgress = (message: string) => options?.onProgress?.({ total: pending.length, processed, ...result, message });
    reportProgress(pending.length ? 'Préparation des photos…' : 'Aucune photo à envoyer.');
    for (const item of pending) {
      if (!getAuthToken()) {
        reportProgress('Envoi interrompu. Reconnectez-vous pour continuer.');
        break;
      }

      processed++;
      try {
        if (item.id && (latestSyncedId.get(item.victimId) ?? 0) > item.id) {
          await markVictimPhotoSuperseded(item.id);
          result.skipped++;
          reportProgress('Photo remplacée par une photo plus récente déjà associée à la victime.');
          continue;
        }
        if (options?.automatic && item.validationError) {
          result.skipped++;
          reportProgress(item.validationError);
          continue;
        }
        await syncPhoto(item);
        if (item.id) latestSyncedId.set(item.victimId, item.id);
        result.synced++;
        reportProgress(`Photo ${processed}/${pending.length} synchronisée.`);
      } catch (error) {
        result.failed++;
        const detail = error instanceof Error ? error.message : 'Erreur de synchronisation.';
        if (item.id && error instanceof Error && 'status' in error && error.status === 400) {
          await markVictimPhotoRejected(item.id, detail);
        }
        result.lastError = `Photo ${processed}/${pending.length} (victime #${item.victimId}) — ${detail}`;
        reportProgress(result.lastError);
      }
    }
    return result;
  } finally {
    isSyncing = false;
  }
};

export const syncPendingVictimPhotosForVictim = (
  victimId: number,
  opts?: { limit?: number; onProgress?: SyncProgressCallback },
): Promise<PhotoSyncResult> => syncPhotos(() => getVictimPhotosForVictim(victimId), opts);

export const syncPendingVictimPhotos = (opts?: Pick<PhotoSyncOptions, 'automatic' | 'onProgress'>): Promise<PhotoSyncResult> =>
  syncPhotos(getAllPendingVictimPhotos, opts);

export const startVictimPhotosSyncService = () => {
  if (isOnline()) {
    syncPendingVictimPhotos({ automatic: true });
  }

  const handleOnline = () => {
    syncPendingVictimPhotos({ automatic: true });
  };

  window.addEventListener('online', handleOnline);

  syncInterval = setInterval(() => {
    if (isOnline()) {
      syncPendingVictimPhotos({ automatic: true });
    }
  }, 30000);

  return () => {
    window.removeEventListener('online', handleOnline);
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
  };
};
