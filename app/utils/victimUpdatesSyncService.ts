'use client';

import { authenticatedFetch } from '@/app/utils/authFetch';
import { isOnline } from '@/app/utils/victimsCache';
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
    console.error('[VictimUpdatesSync] PATCH failed', {
      victimId: item.victimId,
      status: response.status,
      statusText: response.statusText,
      bodyText,
    });
  }

  return response.ok;
};

export const syncPendingVictimUpdates = async (): Promise<{ synced: number; failed: number; skipped: number }> => {
  if (isSyncing) {
    return { synced: 0, failed: 0, skipped: 0 };
  }

  if (!isOnline()) {
    return { synced: 0, failed: 0, skipped: 0 };
  }

  isSyncing = true;
  let synced = 0;
  let failed = 0;
  let skipped = 0;

  try {
    const pending = await getAllPendingVictimUpdates();

    for (const item of pending) {
      if (!item.id) {
        skipped++;
        continue;
      }

      try {
        const ok = await patchVictim(item);
        if (!ok) {
          failed++;
          continue;
        }

        await deletePendingVictimUpdate(item.id);
        synced++;
      } catch (error) {
        console.error('[VictimUpdatesSync] Failed to sync victim update', {
          itemId: item.id,
          victimId: item.victimId,
          error,
        });
        failed++;
      }
    }
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
