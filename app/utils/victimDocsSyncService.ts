'use client';

import { getAllPendingVictimDocs, getPendingVictimDocsToSyncForVictim, markVictimDocSynced, PendingVictimDoc } from './victimDocsCache';
import { isOnline } from './victimsCache';
import { uploadVictimDocument } from './victimDocumentApi';

let isSyncing = false;
let syncInterval: NodeJS.Timeout | null = null;

const uploadDoc = async (doc: PendingVictimDoc): Promise<string> => {
  const file = new File([doc.fileData], doc.fileName, { type: doc.mimeType || 'application/octet-stream' });
  const result = await uploadVictimDocument(doc.victimId, file, doc.label);
  const documentId = result?.id ?? result?.data?.id ?? result?.document?.id;
  return String(documentId ?? doc.fileName);
};

export const syncPendingVictimDocsForVictim = async (
  victimId: number,
  opts?: { limit?: number }
): Promise<{ synced: number; failed: number; skipped: number }> => {
  if (isSyncing) return { synced: 0, failed: 0, skipped: 0 };
  if (!isOnline()) return { synced: 0, failed: 0, skipped: 0 };

  isSyncing = true;
  let synced = 0;
  let failed = 0;
  let skipped = 0;

  try {
    const filtered = await getPendingVictimDocsToSyncForVictim(victimId);

    const limit = typeof opts?.limit === 'number' && opts.limit > 0 ? opts.limit : undefined;
    const toSync = typeof limit === 'number' ? filtered.slice(0, limit) : filtered;

    for (const item of toSync) {
      if (item.synced) {
        skipped++;
        continue;
      }
      if (!item.id) {
        failed++;
        continue;
      }

      try {
        const reference = await uploadDoc(item);
        await markVictimDocSynced(item.id, reference);
        synced++;
      } catch (e) {
        console.error('[VictimDocsSync] Failed to sync doc (per victim)', { itemId: item.id, victimId: item.victimId, error: e });
        failed++;
      }
    }
  } finally {
    isSyncing = false;
  }

  return { synced, failed, skipped };
};

export const syncPendingVictimDocs = async (): Promise<{ synced: number; failed: number; skipped: number }> => {
  if (isSyncing) return { synced: 0, failed: 0, skipped: 0 };
  if (!isOnline()) return { synced: 0, failed: 0, skipped: 0 };

  isSyncing = true;
  let synced = 0;
  let failed = 0;
  let skipped = 0;

  try {
    const pending = await getAllPendingVictimDocs();

    for (const item of pending) {
      if (item.synced) {
        skipped++;
        continue;
      }
      if (!item.id) {
        failed++;
        continue;
      }

      try {
        const reference = await uploadDoc(item);
        await markVictimDocSynced(item.id, reference);
        synced++;
      } catch (e) {
        console.error('[VictimDocsSync] Failed to sync doc', { itemId: item.id, victimId: item.victimId, error: e });
        failed++;
      }
    }
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
