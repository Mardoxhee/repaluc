'use client';

import { getAllPendingVictimDocs, markVictimDocSynced, PendingVictimDoc } from './victimDocsCache';
import { isOnline } from './victimsCache';

let isSyncing = false;
let syncInterval: NodeJS.Timeout | null = null;

const uploadDoc = async (doc: PendingVictimDoc): Promise<string> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL n'est pas configurée");
  }

  const file = new File([doc.fileData], doc.fileName, { type: doc.mimeType || 'application/octet-stream' });
  const formData = new FormData();
  formData.append('file', file);

  const resp = await fetch(`${baseUrl}/minio/files/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!resp.ok) {
    let bodyText = '';
    try {
      bodyText = await resp.text();
    } catch {
      // ignore
    }
    throw new Error(`Failed to upload document: ${resp.status} ${resp.statusText}${bodyText ? ` - ${bodyText}` : ''}`);
  }

  const data = await resp.json();
  return data?.url || '';
};

const attachDocToVictim = async (doc: PendingVictimDoc, lien: string): Promise<boolean> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL n'est pas configurée");
  }

  const resp = await fetch(`${baseUrl}/document-victime`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      label: doc.label,
      lien,
      victimeId: doc.victimId,
      userId: 1,
    }),
  });

  if (!resp.ok) {
    let bodyText = '';
    try {
      bodyText = await resp.text();
    } catch {
      // ignore
    }
    console.error('[VictimDocsSync] POST document-victime failed', {
      victimId: doc.victimId,
      status: resp.status,
      statusText: resp.statusText,
      bodyText,
    });
  }

  return resp.ok;
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
        const lien = await uploadDoc(item);
        if (!lien) {
          failed++;
          continue;
        }

        const ok = await attachDocToVictim(item, lien);
        if (!ok) {
          failed++;
          continue;
        }

        await markVictimDocSynced(item.id, lien);
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
