'use client';

import { getAllPendingVictimPhotos, markVictimPhotoSynced, PendingVictimPhoto } from './victimPhotosCache';
import { isOnline } from './victimsCache';

let isSyncing = false;
let syncInterval: NodeJS.Timeout | null = null;

const getAgentFullNameFromLocalStorage = (): string | null => {
  try {
    const raw = localStorage.getItem('usr');
    if (!raw) {
      const authRaw = localStorage.getItem('repaluc_auth');
      if (!authRaw) return null;
      const auth = JSON.parse(authRaw);
      const username = auth?.username;
      if (typeof username === 'string' && username.trim().length > 0) return username.trim();
      return null;
    }

    const user = JSON.parse(raw);
    if (!user || typeof user !== 'object') return null;

    const direct =
      user.fullName ??
      user.nomComplet ??
      user.nom_complet ??
      user.name;
    if (typeof direct === 'string' && direct.trim().length > 0) return direct.trim();

    const first = user.prenom ?? user.firstName ?? user.firstname;
    const last = user.nom ?? user.lastName ?? user.lastname;
    const parts = [first, last].filter((x: any) => typeof x === 'string' && x.trim().length > 0).map((x: string) => x.trim());
    if (parts.length > 0) return parts.join(' ');

    const username = user.username ?? user.userName ?? user.email;
    if (typeof username === 'string' && username.trim().length > 0) return username.trim();

    return null;
  } catch {
    return null;
  }
};

const uploadPhoto = async (dataUrl: string, victimId: number): Promise<string> => {
  const uploadEndpoint = process.env.NEXT_PUBLIC_UPLOAD_ENDPOINT;

  if (!uploadEndpoint) {
    throw new Error('NEXT_PUBLIC_UPLOAD_ENDPOINT n\'est pas configurée');
  }

  const res = await fetch(dataUrl);
  const blob = await res.blob();

  const extension = blob.type === 'image/jpeg' ? 'jpg' : 'png';
  const file = new File([blob], `victim_photo_${victimId}_${Date.now()}.${extension}`, { type: blob.type || 'image/png' });

  const formData = new FormData();
  formData.append('file', file);

  const resp = await fetch(uploadEndpoint, {
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
    throw new Error(`Failed to upload photo: ${resp.status} ${resp.statusText}${bodyText ? ` - ${bodyText}` : ''}`);
  }

  const data = await resp.json();
  return data.url || data.link || '';
};

const patchVictimPhoto = async (victimId: number, photoUrl: string): Promise<boolean> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL n\'est pas configurée');
  }

  const resp = await fetch(`${baseUrl}/victime/${victimId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ photo: photoUrl }),
  });

  if (!resp.ok) {
    let bodyText = '';
    try {
      bodyText = await resp.text();
    } catch {
      // ignore
    }
    console.error('[VictimPhotosSync] PATCH failed', { victimId, status: resp.status, statusText: resp.statusText, bodyText });
  }

  return resp.ok;
};

const getVictimVariablesSpecifiques = async (victimId: number): Promise<Record<string, any> | null> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL n\'est pas configurée');
  }

  const resp = await fetch(`${baseUrl}/victime/${victimId}`, {
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

  const resp = await fetch(`${baseUrl}/victime/${victimId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ variablesSpecifiques: { ...existingVars, agentReparation: agentFullName } }),
  });

  if (!resp.ok) {
    let bodyText = '';
    try {
      bodyText = await resp.text();
    } catch {
      // ignore
    }
    console.error('[VictimPhotosSync] PATCH agentReparation failed', {
      victimId,
      status: resp.status,
      statusText: resp.statusText,
      bodyText,
    });
  }

  return resp.ok;
};

export const syncPendingVictimPhotos = async (): Promise<{ synced: number; failed: number; skipped: number }> => {
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
    const pending: PendingVictimPhoto[] = await getAllPendingVictimPhotos();

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
        const remoteUrl = await uploadPhoto(item.photoDataUrl, item.victimId);

        if (!remoteUrl) {
          failed++;
          continue;
        }

        const ok = await patchVictimPhoto(item.victimId, remoteUrl);

        if (!ok) {
          failed++;
          continue;
        }

        try {
          const agentFullName = getAgentFullNameFromLocalStorage();
          if (agentFullName) {
            await patchVictimAgentReparation(item.victimId, agentFullName);
          }
        } catch {
          // ignore
        }

        await markVictimPhotoSynced(item.id, remoteUrl);
        synced++;
      } catch (e) {
        console.error('[VictimPhotosSync] Failed to sync photo', {
          itemId: item.id,
          victimId: item.victimId,
          error: e,
        });
        failed++;
      }
    }
  } finally {
    isSyncing = false;
  }

  return { synced, failed, skipped };
};

export const startVictimPhotosSyncService = () => {
  if (isOnline()) {
    syncPendingVictimPhotos();
  }

  const handleOnline = () => {
    syncPendingVictimPhotos();
  };

  window.addEventListener('online', handleOnline);

  syncInterval = setInterval(() => {
    if (isOnline()) {
      syncPendingVictimPhotos();
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
