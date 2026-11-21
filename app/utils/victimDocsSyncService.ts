'use client';

import { getAllPendingVictimDocs, getPendingVictimDocsToSyncForVictim, markVictimDocSynced, markVictimDocSyncFailed, PendingVictimDoc } from './victimDocsCache';
import { isOnline } from './victimsCache';
import { uploadVictimDocument, VictimDocumentApiError } from './victimDocumentApi';
import { getAuthToken } from './authFetch';
import type { SyncProgressCallback } from './syncProgress';

let isSyncing = false;
let syncInterval: NodeJS.Timeout | null = null;

const uploadDoc = async (doc: PendingVictimDoc): Promise<string> => {
  const file = new File([doc.fileData], doc.fileName, { type: doc.mimeType || 'application/octet-stream' });
  const result = await uploadVictimDocument(doc.victimId, file, doc.label, doc.category || 'document');
  const documentId = result?.id ?? result?.data?.id ?? result?.document?.id;
  return String(documentId ?? doc.fileName);
};

export const syncPendingVictimDocsForVictim = async (
  victimId: number,
  opts?: { limit?: number; retryRejected?: boolean; onProgress?: SyncProgressCallback }
): Promise<{ synced: number; failed: number; skipped: number }> => {
  if (isSyncing) return { synced: 0, failed: 0, skipped: 0 };
  if (!isOnline() || !getAuthToken()) return { synced: 0, failed: 0, skipped: 0 };

  isSyncing = true;
  let synced = 0;
  let failed = 0;
  let skipped = 0;

  try {
    const filtered = await getPendingVictimDocsToSyncForVictim(victimId);

    const limit = typeof opts?.limit === 'number' && opts.limit > 0 ? opts.limit : undefined;
    const toSync = typeof limit === 'number' ? filtered.slice(0, limit) : filtered;
    let processed = 0;
    const reportProgress = (message?: string) => opts?.onProgress?.({ total: toSync.length, processed, synced, failed, skipped, message });
    reportProgress(toSync.length ? 'Préparation des documents…' : 'Aucun document à envoyer.');

    for (const item of toSync) {
      if (!getAuthToken()) { reportProgress('Envoi interrompu : reconnectez-vous pour continuer.'); break; }
      if (!opts?.retryRejected && item.lastSyncStatus && item.lastSyncStatus >= 400 && item.lastSyncStatus < 500) {
        skipped++;
        processed++;
        reportProgress(`Élément ${processed}/${toSync.length} en attente d’une nouvelle tentative manuelle.`);
        continue;
      }
      if (item.synced) {
        skipped++;
        processed++;
        reportProgress();
        continue;
      }
      if (!item.id) {
        failed++;
        processed++;
        reportProgress('Document local sans identifiant.');
        continue;
      }

      try {
        const reference = await uploadDoc(item);
        await markVictimDocSynced(item.id, reference);
        synced++;
        processed++;
        reportProgress(`Document ${processed}/${toSync.length} synchronisé.`);
      } catch (e) {
        const status = e instanceof VictimDocumentApiError ? e.status : undefined;
        const message = e instanceof Error ? e.message : String(e);
        await markVictimDocSyncFailed(item.id, status, message).catch(() => undefined);
        console.warn('[VictimDocsSync] Document conservé en attente', { itemId: item.id, victimId: item.victimId, status, message });
        failed++;
        processed++;
        reportProgress(`Blocage sur le document ${item.fileName}: ${message}`);
      }
    }
    if (processed < toSync.length && getAuthToken()) reportProgress('Synchronisation interrompue avant la fin.');
  } finally {
    isSyncing = false;
  }

  return { synced, failed, skipped };
};

export const syncPendingVictimDocs = async (
  opts?: { retryRejected?: boolean; onProgress?: SyncProgressCallback }
): Promise<{ synced: number; failed: number; skipped: number }> => {
  if (isSyncing) return { synced: 0, failed: 0, skipped: 0 };
  if (!isOnline() || !getAuthToken()) return { synced: 0, failed: 0, skipped: 0 };

  isSyncing = true;
  let synced = 0;
  let failed = 0;
  let skipped = 0;

  try {
    const pending = await getAllPendingVictimDocs();
    const toSync = pending.filter((item) => item.synced !== true);
    let processed = 0;
    const reportProgress = (message?: string) => opts?.onProgress?.({ total: toSync.length, processed, synced, failed, skipped, message });
    reportProgress(toSync.length ? 'Préparation des documents…' : 'Aucun document à envoyer.');

    for (const item of toSync) {
      if (!getAuthToken()) { reportProgress('Envoi interrompu : reconnectez-vous pour continuer.'); break; }
      if (!opts?.retryRejected && item.lastSyncStatus && item.lastSyncStatus >= 400 && item.lastSyncStatus < 500) {
        skipped++;
        processed++;
        reportProgress(`Élément ${processed}/${toSync.length} en attente d’une nouvelle tentative manuelle.`);
        continue;
      }
      if (item.synced) {
        skipped++;
        continue;
      }
      if (!item.id) {
        failed++;
        processed++;
        reportProgress('Document local sans identifiant.');
        continue;
      }

      try {
        const reference = await uploadDoc(item);
        await markVictimDocSynced(item.id, reference);
        synced++;
        processed++;
        reportProgress(`Document ${processed}/${toSync.length} synchronisé.`);
      } catch (e) {
        const status = e instanceof VictimDocumentApiError ? e.status : undefined;
        const message = e instanceof Error ? e.message : String(e);
        await markVictimDocSyncFailed(item.id, status, message).catch(() => undefined);
        console.warn('[VictimDocsSync] Document conservé en attente', { itemId: item.id, victimId: item.victimId, status, message });
        failed++;
        processed++;
        reportProgress(`Blocage sur le document ${item.fileName}: ${message}`);
      }
    }
    if (processed < toSync.length && getAuthToken()) reportProgress('Synchronisation interrompue avant la fin.');
  } finally {
    isSyncing = false;
  }

  return { synced, failed, skipped };
};

export const startVictimDocsSyncService = () => {
  if (isOnline()) {
    syncPendingVictimDocs();
  }

  const handleOnline = () => {
    syncPendingVictimDocs();
  };

  window.addEventListener('online', handleOnline);

  syncInterval = setInterval(() => {
    if (isOnline()) {
      syncPendingVictimDocs();
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
