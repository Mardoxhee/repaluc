'use client';

import { authenticatedFetch, getAuthToken } from './authFetch';
import { deleteDraft, deletePendingForm, getPendingForms, isOnline } from './planVieCache';

let isSyncing = false;
let syncInterval: ReturnType<typeof setInterval> | null = null;

export const syncPendingPlanVieForms = async (): Promise<{ synced: number; failed: number }> => {
  if (isSyncing || !isOnline() || !getAuthToken()) return { synced: 0, failed: 0 };

  isSyncing = true;
  let synced = 0;
  let failed = 0;
  try {
    const pending = await getPendingForms();
    for (const form of pending) {
      if (!getAuthToken()) break;
      const questionResponse = Object.entries(form.formData || {}).map(([questionId, response]) => ({
        questionId: Number.parseInt(questionId, 10),
        reponse: Array.isArray(response) ? response.join(', ') : String(response ?? ''),
      })).filter((item) => item.reponse.trim());

      try {
        if (!process.env.NEXT_PUBLIC_CORE_POWERVIZ) throw new Error('NEXT_PUBLIC_CORE_POWERVIZ n’est pas configurée');
        const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_CORE_POWERVIZ}/plan-vie-enquette`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: form.userId,
            victimeId: form.victimeId,
            status: 'Draft',
            isSign: false,
            questionResponse,
          }),
        });
        if (!response.ok) {
          failed++;
          continue;
        }

        await deleteDraft(form.victimeId);
        await deletePendingForm(form.key);
        try {
          const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006';
          await authenticatedFetch(`${apiBase}/victime/${form.victimeId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'interrogé' }),
          });
        } catch {
          // Le formulaire est déjà enregistré; le statut peut être repris séparément.
        }
        synced++;
      } catch {
        failed++;
      }
    }
  } finally {
    isSyncing = false;
  }
  return { synced, failed };
};

export const startPlanVieSyncService = () => {
  const sync = () => { void syncPendingPlanVieForms(); };
  if (isOnline()) sync();
  window.addEventListener('online', sync);
  syncInterval = setInterval(sync, 30_000);
  return () => {
    window.removeEventListener('online', sync);
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = null;
  };
};
