'use client';

import { authenticatedFetch, getAuthToken } from '@/app/utils/authFetch';
import { isOnline } from '@/app/utils/victimsCache';
import type { SyncProgressCallback } from './syncProgress';
import {
  deletePendingVictimUpdate,
  getAllPendingVictimUpdates,
  PendingVictimUpdate,
} from '@/app/utils/victimUpdatesCache';

let isSyncing = false;
let syncInterval: NodeJS.Timeout | null = null;

const patchVictim = async (item: PendingVictimUpdate): Promise<boolean> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006';
  const response = await authenticatedFetch(`${baseUrl}/victime/${item.victimId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item.payload),
  });

  if (!response.ok) {
    let bodyText = '';
    try {
      bodyText = await response.text();
    } catch {
      // ignore
    }
    console.warn('[VictimUpdatesSync] PATCH failed', {
      victimId: item.victimId,
      status: response.status,
      statusText: response.statusText,
      bodyText,
    });
  }

  return response.ok;
};

export const syncPendingVictimUpdates = async (opts?: { onProgress?: SyncProgressCallback }): Promise<{ synced: number; failed: number; skipped: number }> => {
  if (isSyncing) {
    return { synced: 0, failed: 0, skipped: 0 };
  }

  if (!isOnline() || !getAuthToken()) {
    return { synced: 0, failed: 0, skipped: 0 };
  }

  isSyncing = true;
  let synced = 0;
  let failed = 0;
  let skipped = 0;

  try {
    const pending = await getAllPendingVictimUpdates();
    let processed = 0;
    const reportProgress = (message?: string) => opts?.onProgress?.({ total: pending.length, processed, synced, failed, skipped, message });
    reportProgress(pending.length ? 'Préparation des modifications…' : 'Aucune modification à envoyer.');

    for (const item of pending) {
      if (!getAuthToken()) { reportProgress('Envoi interrompu : reconnectez-vous pour continuer.'); break; }
      if (!item.id) {
        skipped++;
        processed++;
        reportProgress('Modification locale sans identifiant.');
        continue;
      }

      try {
        const ok = await patchVictim(item);
        if (!ok) {
          failed++;
          processed++;
          reportProgress(`Le serveur a refusé la modification ${processed}/${pending.length}.`);
          continue;
        }

        await deletePendingVictimUpdate(item.id);
        synced++;
        processed++;
        reportProgress(`Modification ${processed}/${pending.length} synchronisée.`);
      } catch (error) {
        console.warn('[VictimUpdatesSync] Failed to sync victim update', {
          itemId: item.id,
          victimId: item.victimId,
          error,
        });
        failed++;
        processed++;
        const message = error instanceof Error ? error.message : String(error);
        reportProgress(`Blocage sur la modification ${processed}/${pending.length}: ${message}`);
      }
    }
    if (processed < pending.length && getAuthToken()) reportProgress('Synchronisation interrompue avant la fin.');
  } finally {
    isSyncing = false;
  }

  return { synced, failed, skipped };
};

export const startVictimUpdatesSyncService = () => {
  if (isOnline()) {
    syncPendingVictimUpdates();
  }

  const handleOnline = () => {
    syncPendingVictimUpdates();
  };

  window.addEventListener('online', handleOnline);

  syncInterval = setInterval(() => {
    if (isOnline()) {
      syncPendingVictimUpdates();
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
