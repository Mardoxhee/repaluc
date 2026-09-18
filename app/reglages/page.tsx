"use client";
import React, { useState, useEffect } from 'react';
import {
  CloudUpload,
  Trash2,
  RefreshCw,
  AlertCircle,
  Clock,
  Wifi,
  WifiOff,
  Database,
  FileText
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  getPendingForms,
  deletePendingForm,
  deleteDraft,
  isOnline
} from '@/app/utils/planVieCache';
import { getPendingVictimDocsSummary } from '@/app/utils/victimDocsCache';
import { getPendingVictimPhotosSummary } from '@/app/utils/victimPhotosCache';
import { syncPendingVictimDocsForVictim } from '@/app/utils/victimDocsSyncService';
import { syncPendingVictimPhotosForVictim } from '@/app/utils/victimPhotosSyncService';
import { getAllPendingContracts, type PendingContract } from '@/app/utils/contractsCache';
import { syncPendingContracts } from '@/app/utils/contractsSyncService';
import { authenticatedFetch } from '@/app/utils/authFetch';
import {
  refreshVictimsCacheInBackground,
  type VictimsCacheSyncProgress
} from '@/app/utils/victimsCacheSync';
import { getCacheInventory, type CacheTableInfo } from '@/app/utils/cacheInventory';

const CORE_POWERVIZ_URL = process.env.NEXT_PUBLIC_CORE_POWERVIZ;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006';
const PENDING_VICTIM_PAGE_SIZE = 20;

interface PendingForm {
  key: string;
  victimeId: number;
  userId: number;
  formData: any;
  categoriePV?: string;
  victimName?: string;
  timestamp: number;
  status: string;
}

type PendingVictimRow = {
  victimId: number;
  victimName?: string;
  pendingDocs: number;
  pendingPhotos: number;
};

type PendingVictimCacheInfo = {
  docsPending: number;
  photosPending: number;
};

const ReglagesPage = () => {
  const [pendingForms, setPendingForms] = useState<PendingForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [planSyncProgress, setPlanSyncProgress] = useState<{
    total: number;
    completed: number;
    success: number;
    errors: number;
  } | null>(null);
  const [online, setOnline] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'sync' | 'plans' | 'contracts' | 'cache'>('sync');

  const [showVictimPending, setShowVictimPending] = useState(false);
  const [pendingVictimRows, setPendingVictimRows] = useState<PendingVictimRow[]>([]);
  const [pendingVictimTotal, setPendingVictimTotal] = useState(0);
  const [pendingVictimPage, setPendingVictimPage] = useState(1);
  const [pendingVictimCacheInfo, setPendingVictimCacheInfo] = useState<PendingVictimCacheInfo | null>(null);
  const [loadingVictimPending, setLoadingVictimPending] = useState(false);
  const [syncingVictimId, setSyncingVictimId] = useState<number | null>(null);
  const [selectedVictims, setSelectedVictims] = useState<Record<number, boolean>>({});
  const [batchCount, setBatchCount] = useState<number>(10);
  const [batchSyncing, setBatchSyncing] = useState<boolean>(false);
  const [victimsCacheSyncing, setVictimsCacheSyncing] = useState(false);
  const [victimsCacheProgress, setVictimsCacheProgress] = useState<VictimsCacheSyncProgress | null>(null);
  const [victimsCacheMessage, setVictimsCacheMessage] = useState('');
  const [cacheInventory, setCacheInventory] = useState<CacheTableInfo[]>([]);
  const [loadingCacheInventory, setLoadingCacheInventory] = useState(false);
  const [pendingContracts, setPendingContracts] = useState<PendingContract[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [contractsSyncing, setContractsSyncing] = useState(false);
  const [contractsSyncResult, setContractsSyncResult] = useState<{
    total: number;
    synced: number;
    failed: number;
    skipped: number;
  } | null>(null);

  const formatVictimName = (victim: any): string => {
    if (!victim || typeof victim !== 'object') return '';
    const first = victim.prenom ?? victim.firstName ?? victim.firstname;
    const last = victim.nom ?? victim.lastName ?? victim.lastname;
    const direct = victim.nomComplet ?? victim.fullName ?? victim.name;
    if (typeof direct === 'string' && direct.trim()) return direct.trim();
    const parts = [first, last]
      .filter((x: any) => typeof x === 'string' && x.trim())
      .map((x: string) => x.trim());
    return parts.join(' ').trim();
  };

  const getVictimsCacheMap = async (): Promise<Map<number, string>> => {
    const map = new Map<number, string>();
    try {
      const VICTIMS_DB_NAME = 'VictimsCache';
      const VICTIMS_DB_VERSION = 2;
      const VICTIMS_STORE_NAME = 'victims';
      const cacheKey = 'all-victims-cache';

      const db: IDBDatabase = await new Promise((resolve, reject) => {
        const request = indexedDB.open(VICTIMS_DB_NAME, VICTIMS_DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });

      const storeExists = db.objectStoreNames.contains(VICTIMS_STORE_NAME);
      if (!storeExists) {
        db.close();
        return map;
      }

      const entry = await new Promise<any | undefined>((resolve, reject) => {
        const tx = db.transaction([VICTIMS_STORE_NAME], 'readonly');
        const store = tx.objectStore(VICTIMS_STORE_NAME);
        const req = store.get(cacheKey);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      const data = Array.isArray(entry?.data) ? entry.data : [];
      for (const v of data) {
        const id = v?.id;
        if (typeof id !== 'number') continue;
        const name = formatVictimName(v);
        if (name) map.set(id, name);
      }
      db.close();
    } catch {
      // ignore
    }
    return map;
  };

  const fetchVictimNameFromApi = async (victimId: number): Promise<string> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) return '';
    try {
      const resp = await authenticatedFetch(`${baseUrl}/victime/${victimId}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!resp.ok) return '';
      const payload = await resp.json().catch(() => null);
      const victim = payload?.data ?? payload;
      return formatVictimName(victim);
    } catch {
      return '';
    }
  };

  const deleteDatabase = async (dbName: string): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(dbName);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => resolve();
    });
  };

  const clearAllCachesAndReload = async () => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Vider les caches',
      text: 'Cette action supprime toutes les bases IndexedDB (toutes les tables) de l\'application. Voulez-vous continuer ?',
      showCancelButton: true,
      confirmButtonText: 'Oui, vider',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc2626'
    });

    if (!result.isConfirmed) return;

    try {
      const knownDbNames = [
        'VictimsCache',
        'PlanVieCache',
        'ContractsDB',
        'VictimPhotosDB',
        'VictimDocsDB',
        'DashboardCache',
        'plan-vie-questions-db',
      ];

      const dbNamesToDelete = new Set<string>();
      const dbApi = indexedDB as any;
      if (typeof dbApi.databases === 'function') {
        const dbs: Array<{ name?: string | null }> = await dbApi.databases();
        for (const db of dbs) {
          if (db?.name) dbNamesToDelete.add(db.name);
        }
      } else {
        for (const name of knownDbNames) dbNamesToDelete.add(name);
      }

      for (const name of dbNamesToDelete) {
        await deleteDatabase(name);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Caches vidés',
        text: 'Toutes les bases IndexedDB ont été supprimées. Rechargement...',
        timer: 1200,
        showConfirmButton: false
      });

      window.location.reload();
    } catch (error: any) {
      console.error('[Reglages] Erreur vidage caches:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error?.message || 'Impossible de vider les caches',
        confirmButtonColor: '#901c67'
      });
    }
  };

  const refreshVictimsCache = async () => {
    if (victimsCacheSyncing) return;

    if (!online) {
      setVictimsCacheMessage('Connexion absente: impossible de compléter le cache maintenant.');
      return;
    }

    setVictimsCacheSyncing(true);
    setVictimsCacheMessage('Synchronisation du cache lancée en arrière-plan.');
    setVictimsCacheProgress({
      currentPage: 0,
      totalPages: 1,
      records: 0,
      status: 'running',
      message: 'Préparation',
    });

    try {
      const result = await refreshVictimsCacheInBackground({
        onProgress: setVictimsCacheProgress,
      });
      setVictimsCacheMessage(`${result.totalRecords.toLocaleString('fr-FR')} victime(s) disponibles dans le cache hors ligne.`);
      setLastUpdateTime(new Date().toLocaleTimeString('fr-FR'));
      await loadCacheInventory();
    } catch (error: any) {
      console.error('[Reglages] Erreur rafraîchissement cache victimes:', error);
      setVictimsCacheProgress(prev => prev ? { ...prev, status: 'error', message: error?.message || 'Erreur' } : null);
      setVictimsCacheMessage(error?.message || 'Impossible de compléter le cache des victimes.');
    } finally {
      setVictimsCacheSyncing(false);
    }
  };

  const loadCacheInventory = async () => {
    try {
      setLoadingCacheInventory(true);
      const rows = await getCacheInventory();
      setCacheInventory(rows);
    } catch (error) {
      console.error('[Reglages] Erreur inventaire cache:', error);
      setCacheInventory([]);
    } finally {
      setLoadingCacheInventory(false);
    }
  };

  const loadPendingContracts = async () => {
    try {
      setLoadingContracts(true);
      const contracts = await getAllPendingContracts();
      setPendingContracts(
        [...contracts].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      );
    } catch (error) {
      console.error('[Reglages] Erreur chargement contrats en attente:', error);
      setPendingContracts([]);
    } finally {
      setLoadingContracts(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    setLastUpdateTime(new Date().toLocaleTimeString('fr-FR'));

    loadPendingForms();
    loadPendingContracts();
    checkOnlineStatus();

    const handleOnline = () => {
      setOnline(true);
      loadPendingForms();
      loadPendingContracts();
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadPendingVictimMedia = async (page = pendingVictimPage) => {
    try {
      setLoadingVictimPending(true);
      const [docs, photos] = await Promise.all([getPendingVictimDocsSummary(), getPendingVictimPhotosSummary()]);
      const rowsByVictim = new Map<number, PendingVictimRow>();

      const cacheMap = await getVictimsCacheMap();

      setPendingVictimCacheInfo({
        docsPending: docs.pendingRecords,
        photosPending: photos.pendingRecords,
      });

      for (const d of docs.rows || []) {
        const row = rowsByVictim.get(d.victimId) || { victimId: d.victimId, victimName: cacheMap.get(d.victimId) || '', pendingDocs: 0, pendingPhotos: 0 };
        row.pendingDocs += d.count;
        rowsByVictim.set(d.victimId, row);
      }

      for (const p of photos.rows || []) {
        const row = rowsByVictim.get(p.victimId) || { victimId: p.victimId, victimName: cacheMap.get(p.victimId) || '', pendingDocs: 0, pendingPhotos: 0 };
        row.pendingPhotos += p.count;
        rowsByVictim.set(p.victimId, row);
      }

      const allRows = Array.from(rowsByVictim.values()).sort((a, b) => a.victimId - b.victimId);
      const totalPages = Math.max(1, Math.ceil(allRows.length / PENDING_VICTIM_PAGE_SIZE));
      const safePage = Math.min(Math.max(1, page), totalPages);
      const start = (safePage - 1) * PENDING_VICTIM_PAGE_SIZE;
      const rows = allRows.slice(start, start + PENDING_VICTIM_PAGE_SIZE);

      const missingNames = rows
        .filter((r) => !r.victimName)
        .map((r) => r.victimId);

      if (online && missingNames.length > 0) {
        for (const id of missingNames) {
          const n = await fetchVictimNameFromApi(id);
          if (!n) continue;
          const existing = rowsByVictim.get(id);
          if (existing) {
            existing.victimName = n;
            rowsByVictim.set(id, existing);
          }
        }
      }

      setPendingVictimTotal(allRows.length);
      setPendingVictimPage(safePage);
      setPendingVictimRows(rows);

      setSelectedVictims((prev) => {
        const next: Record<number, boolean> = { ...prev };
        const existingIds = new Set(allRows.map((r) => r.victimId));
        for (const key of Object.keys(next)) {
          const id = Number(key);
          if (!existingIds.has(id)) delete next[id];
        }
        return next;
      });
    } catch (e) {
      console.error('[Reglages] Erreur chargement pending victim media', e);
      setPendingVictimRows([]);
      setPendingVictimTotal(0);
      setPendingVictimPage(1);
      setPendingVictimCacheInfo(null);
    } finally {
      setLoadingVictimPending(false);
    }
  };

  const syncOneVictim = async (victimId: number) => {
    if (!online) {
      await Swal.fire({
        icon: 'warning',
        title: 'Hors ligne',
        text: 'Vous devez être en ligne pour synchroniser',
        confirmButtonColor: '#901c67'
      });
      return;
    }

    setSyncingVictimId(victimId);
    try {
      await Promise.allSettled([
        syncPendingVictimPhotosForVictim(victimId),
        syncPendingVictimDocsForVictim(victimId),
      ]);
    } finally {
      await loadPendingVictimMedia(pendingVictimPage);
      setSyncingVictimId(null);
    }
  };

  const syncBatchSelectedVictims = async () => {
    if (!online) {
      await Swal.fire({
        icon: 'warning',
        title: 'Hors ligne',
        text: 'Vous devez être en ligne pour synchroniser',
        confirmButtonColor: '#901c67'
      });
      return;
    }

    const selectedIds = Object.entries(selectedVictims)
      .filter(([, v]) => v)
      .map(([k]) => Number(k))
      .filter((x) => Number.isFinite(x));

    if (selectedIds.length === 0) return;

    const limit = typeof batchCount === 'number' && batchCount > 0 ? Math.floor(batchCount) : selectedIds.length;
    const toSync = selectedIds.slice(0, limit);

    const result = await Swal.fire({
      icon: 'question',
      title: 'Synchroniser en boucle',
      text: `Voulez-vous synchroniser ${toSync.length} victime(s) sélectionnée(s) ?`,
      showCancelButton: true,
      confirmButtonText: 'Oui, synchroniser',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#901c67'
    });

    if (!result.isConfirmed) return;

    setBatchSyncing(true);
    try {
      for (const victimId of toSync) {
        setSyncingVictimId(victimId);
        await Promise.allSettled([
          syncPendingVictimPhotosForVictim(victimId),
          syncPendingVictimDocsForVictim(victimId),
        ]);
        await loadPendingVictimMedia(pendingVictimPage);
      }
    } finally {
      setSyncingVictimId(null);
      setBatchSyncing(false);
    }
  };

  const checkOnlineStatus = () => {
    setOnline(isOnline());
  };

  const loadPendingForms = async () => {
    try {
      setLoading(true);
      const forms = await getPendingForms();
      setPendingForms(forms);
    } catch (error) {
      console.error('Erreur chargement formulaires:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncForm = async (form: PendingForm) => {
    if (!online) {
      await Swal.fire({
        icon: 'warning',
        title: 'Hors ligne',
        text: 'Vous devez être en ligne pour synchroniser',
        confirmButtonColor: '#901c67'
      });
      return;
    }

    setSyncing(form.key);
    setPlanSyncProgress(null);

    try {
      const questionResponse = Object.entries(form.formData).map(([questionId, reponse]) => {
        const reponseFormatted = Array.isArray(reponse) ? reponse.join(', ') : String(reponse);
        return {
          questionId: parseInt(questionId),
          reponse: reponseFormatted
        };
      }).filter(item => item.reponse && item.reponse.trim() !== '');

      const payload = {
        userId: form.userId,
        victimeId: form.victimeId,
        status: "Draft",
        isSign: false,
        questionResponse
      };

      if (!CORE_POWERVIZ_URL) {
        throw new Error('NEXT_PUBLIC_CORE_POWERVIZ n’est pas configurée');
      }

      const response = await authenticatedFetch(`${CORE_POWERVIZ_URL}/plan-vie-enquette`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await markVictimPlanVieDone(form.victimeId);
        await deleteDraft(form.victimeId);
        await deletePendingForm(form.key);
        await Swal.fire({
          icon: 'success',
          title: 'Synchronisé',
          text: 'Le formulaire a été synchronisé avec succès',
          timer: 2000,
          showConfirmButton: false
        });
        await loadPendingForms();
      } else {
        throw new Error('Erreur serveur');
      }
    } catch (error: any) {
      console.error('Erreur sync:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.message || 'Impossible de synchroniser le formulaire',
        confirmButtonColor: '#901c67'
      });
    } finally {
      setSyncing(null);
    }
  };

  const syncAllForms = async () => {
    if (!online) {
      await Swal.fire({
        icon: 'warning',
        title: 'Hors ligne',
        text: 'Vous devez être en ligne pour synchroniser',
        confirmButtonColor: '#901c67'
      });
      return;
    }

    if (pendingForms.length === 0) return;

    const result = await Swal.fire({
      icon: 'question',
      title: 'Synchroniser tout',
      text: `Voulez-vous synchroniser les ${pendingForms.length} formulaire(s) en attente ?`,
      showCancelButton: true,
      confirmButtonText: 'Oui, synchroniser',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#901c67'
    });

    if (!result.isConfirmed) return;

    let successCount = 0;
    let errorCount = 0;
    let completedCount = 0;
    const totalCount = pendingForms.length;

    setPlanSyncProgress({
      total: totalCount,
      completed: 0,
      success: 0,
      errors: 0
    });

    for (const form of pendingForms) {
      try {
        setSyncing(form.key);

        const questionResponse = Object.entries(form.formData).map(([questionId, reponse]) => {
          const reponseFormatted = Array.isArray(reponse) ? reponse.join(', ') : String(reponse);
          return {
            questionId: parseInt(questionId),
            reponse: reponseFormatted
          };
        }).filter(item => item.reponse && item.reponse.trim() !== '');

        const payload = {
          userId: form.userId,
          victimeId: form.victimeId,
          status: "Draft",
          isSign: false,
          questionResponse
        };

        if (!CORE_POWERVIZ_URL) {
          throw new Error('NEXT_PUBLIC_CORE_POWERVIZ n’est pas configurée');
        }

        const response = await authenticatedFetch(`${CORE_POWERVIZ_URL}/plan-vie-enquette`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          await markVictimPlanVieDone(form.victimeId);
          await deleteDraft(form.victimeId);
          await deletePendingForm(form.key);
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`Erreur sync ${form.key}:`, error);
        errorCount++;
      } finally {
        completedCount++;
        setPlanSyncProgress({
          total: totalCount,
          completed: completedCount,
          success: successCount,
          errors: errorCount
        });
      }
    }

    setSyncing(null);
    await loadPendingForms();

    await Swal.fire({
      icon: errorCount === 0 ? 'success' : 'warning',
      title: 'Synchronisation terminée',
      html: `
        <p>${successCount} formulaire(s) synchronisé(s)</p>
        ${errorCount > 0 ? `<p class="text-red-600">${errorCount} erreur(s)</p>` : ''}
      `,
      confirmButtonColor: '#901c67'
    });
  };

  const syncAllContracts = async () => {
    if (!online) {
      await Swal.fire({
        icon: 'warning',
        title: 'Hors ligne',
        text: 'Vous devez être en ligne pour synchroniser',
        confirmButtonColor: '#901c67'
      });
      return;
    }

    if (pendingContracts.length === 0) return;

    const result = await Swal.fire({
      icon: 'question',
      title: 'Resoumettre les documents',
      text: `Voulez-vous resoumettre les ${pendingContracts.length} document(s) en attente ?`,
      showCancelButton: true,
      confirmButtonText: 'Oui, resoumettre',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#901c67'
    });

    if (!result.isConfirmed) return;

    setContractsSyncing(true);
    setContractsSyncResult(null);

    try {
      const total = pendingContracts.length;
      const syncResult = await syncPendingContracts();
      setContractsSyncResult({ total, ...syncResult });
      await loadPendingContracts();
      await loadCacheInventory();

      await Swal.fire({
        icon: syncResult.failed === 0 ? 'success' : 'warning',
        title: 'Resoumission terminée',
        html: `
          <p>${syncResult.synced} document(s) synchronisé(s)</p>
          ${syncResult.skipped > 0 ? `<p>${syncResult.skipped} document(s) déjà existant(s)</p>` : ''}
          ${syncResult.failed > 0 ? `<p class="text-red-600">${syncResult.failed} échec(s)</p>` : ''}
        `,
        confirmButtonColor: '#901c67'
      });
    } catch (error: any) {
      console.error('[Reglages] Erreur resoumission documents:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error?.message || 'Impossible de resoumettre les documents',
        confirmButtonColor: '#901c67'
      });
    } finally {
      setContractsSyncing(false);
    }
  };

  const deleteForm = async (form: PendingForm) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Supprimer le formulaire',
      text: 'Cette action est irréversible. Voulez-vous continuer ?',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc2626'
    });

    if (!result.isConfirmed) return;

    try {
      await deletePendingForm(form.key);
      await Swal.fire({
        icon: 'success',
        title: 'Supprimé',
        text: 'Le formulaire a été supprimé',
        timer: 2000,
        showConfirmButton: false
      });
      await loadPendingForms();
    } catch (error) {
      console.error('Erreur suppression:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de supprimer le formulaire',
        confirmButtonColor: '#901c67'
      });
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getQuestionCount = (formData: any) => {
    return Object.keys(formData).length;
  };

  const getContractBeneficiary = (contract: PendingContract) => {
    const data = contract.contractData || {};
    const direct = data.nomBeneficiaire || data.nomComplet || data.fullName || data.name;
    if (typeof direct === 'string' && direct.trim()) return direct.trim();

    return [data.nomPostnom, data.prenom]
      .filter((value) => typeof value === 'string' && value.trim())
      .map((value) => value.trim())
      .join(' ') || `ID ${contract.victimId}`;
  };

  const getContractTypeLabel = (contract: PendingContract) => {
    if (contract.targetType === 'consentement-mpu') return 'Acte de consentement MPU';
    const data = contract.contractData || {};
    return data.typeContrat || data.typePrejudiceReconnu || data.prejudiceFinal || 'Contrat';
  };

  const markVictimPlanVieDone = async (victimId: number) => {
    try {
      await authenticatedFetch(`${API_BASE_URL}/victime/${victimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'interrogé' })
      });
    } catch (error) {
      console.log('[Reglages] Statut victime non mis à jour après sync plan de vie:', error);
    }
  };

  return (
    <div className="p-6 pt-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Paramètres & Synchronisation
          </h1>
          <p className="text-gray-600">
            Gérez les données locales et les synchronisations manuelles
          </p>
        </div>

        <div className="mb-6 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${activeTab === 'sync'
              ? 'bg-white border-gray-300 text-gray-900 shadow-sm'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-white'
              }`}
          >
            Synchronisation
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('plans');
              loadPendingForms();
            }}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${activeTab === 'plans'
              ? 'bg-white border-gray-300 text-gray-900 shadow-sm'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-white'
              }`}
          >
            Plans de vie
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('contracts');
              loadPendingContracts();
            }}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${activeTab === 'contracts'
              ? 'bg-white border-gray-300 text-gray-900 shadow-sm'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-white'
              }`}
          >
            Contrats
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('cache');
              loadCacheInventory();
            }}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${activeTab === 'cache'
              ? 'bg-white border-gray-300 text-gray-900 shadow-sm'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-white'
              }`}
          >
            Cache
          </button>
        </div>

        {/* Status Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Connection Status */}
          <div className={`p-4 rounded-xl border transition-all ${online
            ? 'bg-white border-green-200 shadow-sm hover:shadow-md'
            : 'bg-white border-orange-200 shadow-sm hover:shadow-md'
            }`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${online ? 'bg-green-50' : 'bg-orange-50'
                }`}>
                {online ? <Wifi size={20} className="text-green-600" /> : <WifiOff size={20} className="text-orange-600" />}
              </div>
            </div>
            <h3 className="text-xs font-medium text-gray-600 mb-1">Connexion</h3>
            <p className={`text-xl font-bold ${online ? 'text-green-600' : 'text-orange-600'
              }`}>
              {online ? 'En ligne' : 'Hors ligne'}
            </p>
          </div>

          {/* Pending Forms Count */}
          <div className="bg-white border border-blue-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Database size={20} className="text-blue-600" />
              </div>
            </div>
            <h3 className="text-xs font-medium text-gray-600 mb-1">Formulaires en attente</h3>
            <p className="text-xl font-bold text-blue-600">{pendingForms.length}</p>
          </div>

          <div className={`bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all ${pendingContracts.length > 0 ? 'border border-orange-200' : 'border border-green-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${pendingContracts.length > 0 ? 'bg-orange-50' : 'bg-green-50'}`}>
                <FileText size={20} className={pendingContracts.length > 0 ? 'text-orange-600' : 'text-green-600'} />
              </div>
            </div>
            <h3 className="text-xs font-medium text-gray-600 mb-1">Contrats en attente</h3>
            <p className={`text-xl font-bold ${pendingContracts.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {pendingContracts.length}
            </p>
          </div>

          {/* Last Update */}
          <div className="bg-white border border-purple-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <Clock size={20} className="text-purple-600" />
              </div>
            </div>
            <h3 className="text-xs font-medium text-gray-600 mb-1">Dernière mise à jour</h3>
            <p className="text-base font-semibold text-purple-600" suppressHydrationWarning>
              {mounted ? lastUpdateTime : ''}
            </p>
          </div>
        </div>

        {activeTab === 'sync' && (
          <>
            {/* Actions Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={async () => {
                      const next = !showVictimPending;
                      setShowVictimPending(next);
                      if (next) await loadPendingVictimMedia(1);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium shadow-sm"
                    title="Afficher les données victimes (photos/docs) non synchronisées"
                  >
                    <FileText size={18} />
                    Données non synchronisées
                  </button>
                </div>
              </div>

              {showVictimPending && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-gray-700 font-medium">
                      Victimes en attente: <span className="font-semibold">{pendingVictimTotal}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => loadPendingVictimMedia(pendingVictimPage)}
                        disabled={loadingVictimPending || batchSyncing}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 font-medium shadow-sm"
                      >
                        <RefreshCw size={16} className={loadingVictimPending ? 'animate-spin' : ''} />
                        Actualiser liste
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">Boucle:</span>
                        <input
                          type="number"
                          min={1}
                          value={batchCount}
                          onChange={(e) => setBatchCount(parseInt(e.target.value || '1', 10))}
                          className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <button
                          onClick={syncBatchSelectedVictims}
                          disabled={!online || batchSyncing}
                          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                          style={{ backgroundColor: '#901c67' }}
                          title="Synchroniser en boucle les victimes sélectionnées"
                        >
                          <CloudUpload size={16} className={batchSyncing ? 'animate-spin' : ''} />
                          Synchroniser sélection
                        </button>
                      </div>
                    </div>
                  </div>

                  {pendingVictimTotal > 0 && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                      <span>
                        Affichage de {(pendingVictimPage - 1) * PENDING_VICTIM_PAGE_SIZE + 1} à {Math.min(pendingVictimPage * PENDING_VICTIM_PAGE_SIZE, pendingVictimTotal)} sur {pendingVictimTotal}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => loadPendingVictimMedia(pendingVictimPage - 1)}
                          disabled={loadingVictimPending || batchSyncing || pendingVictimPage <= 1}
                          className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-all disabled:opacity-50 font-medium"
                        >
                          Précédent
                        </button>
                        <span className="font-medium text-gray-700">
                          Page {pendingVictimPage} / {Math.max(1, Math.ceil(pendingVictimTotal / PENDING_VICTIM_PAGE_SIZE))}
                        </span>
                        <button
                          onClick={() => loadPendingVictimMedia(pendingVictimPage + 1)}
                          disabled={loadingVictimPending || batchSyncing || pendingVictimPage >= Math.ceil(pendingVictimTotal / PENDING_VICTIM_PAGE_SIZE)}
                          className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-all disabled:opacity-50 font-medium"
                        >
                          Suivant
                        </button>
                      </div>
                    </div>
                  )}

                  {pendingVictimCacheInfo && (
                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-700 sm:grid-cols-3">
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                        <div className="font-semibold text-gray-900">{pendingVictimCacheInfo.photosPending}</div>
                        <div>photos en attente</div>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                        <div className="font-semibold text-gray-900">{pendingVictimCacheInfo.docsPending}</div>
                        <div>autres documents</div>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                        <div className="font-semibold text-gray-900">{pendingVictimTotal}</div>
                        <div>victimes concernées</div>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600 border-b">
                          <th className="py-2 pr-3">Sel.</th>
                          <th className="py-2 pr-3">Victime ID</th>
                          <th className="py-2 pr-3">Nom</th>
                          <th className="py-2 pr-3">Docs</th>
                          <th className="py-2 pr-3">Photos</th>
                          <th className="py-2 pr-0 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {pendingVictimRows.map((row) => {
                          const isSyncingRow = syncingVictimId === row.victimId;
                          return (
                            <tr key={row.victimId} className="text-gray-800">
                              <td className="py-2 pr-3">
                                <input
                                  type="checkbox"
                                  checked={!!selectedVictims[row.victimId]}
                                  onChange={(e) => setSelectedVictims((prev) => ({ ...prev, [row.victimId]: e.target.checked }))}
                                  disabled={batchSyncing}
                                />
                              </td>
                              <td className="py-2 pr-3 font-semibold">{row.victimId}</td>
                              <td className="py-2 pr-3">{row.victimName || '-'}</td>
                              <td className="py-2 pr-3">{row.pendingDocs}</td>
                              <td className="py-2 pr-3">{row.pendingPhotos}</td>
                              <td className="py-2 pr-0 text-right">
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => syncOneVictim(row.victimId)}
                                    disabled={!online || isSyncingRow || batchSyncing}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-all disabled:opacity-50 font-medium"
                                    title="Synchroniser cette victime (docs + photos)"
                                  >
                                    <CloudUpload size={16} className={isSyncingRow ? 'animate-spin' : ''} />
                                    Synchroniser
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {!loadingVictimPending && pendingVictimRows.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-gray-600">
                              Aucune photo / aucun document en attente.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          </>
        )}

        {activeTab === 'plans' && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Plans de vie en attente</h2>
                  <p className="text-sm text-gray-600">Formulaires stockés localement dans IndexedDB, à synchroniser manuellement.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={loadPendingForms}
                    disabled={loading || syncing !== null}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 font-medium shadow-sm"
                  >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Actualiser
                  </button>

                  <button
                    onClick={syncAllForms}
                    disabled={!online || pendingForms.length === 0 || syncing !== null}
                    className="flex items-center gap-2 px-6 py-2.5 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md"
                    style={{ backgroundColor: '#901c67' }}
                  >
                    {planSyncProgress && planSyncProgress.completed < planSyncProgress.total ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <CloudUpload size={18} />
                    )}
                    {planSyncProgress && planSyncProgress.completed < planSyncProgress.total ? 'Synchronisation...' : 'Synchroniser tout'}
                  </button>
                </div>
              </div>

              {planSyncProgress && (
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                      <RefreshCw
                        size={16}
                        className={planSyncProgress.completed < planSyncProgress.total ? 'animate-spin' : ''}
                      />
                      <span>
                        {planSyncProgress.completed} / {planSyncProgress.total} plan(s) de vie traité(s)
                      </span>
                    </div>
                    <div className="text-xs font-medium text-blue-800">
                      {planSyncProgress.success} synchronisé(s)
                      {planSyncProgress.errors > 0 ? ` · ${planSyncProgress.errors} erreur(s)` : ''}
                    </div>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-blue-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-300"
                      style={{
                        width: `${planSyncProgress.total > 0
                          ? Math.round((planSyncProgress.completed / planSyncProgress.total) * 100)
                          : 0}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Forms List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {loading ? (
                <div className="p-12 text-center">
                  <RefreshCw size={48} className="animate-spin text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Chargement...</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {pendingForms.map((form) => (
                    <div
                      key={form.key}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <FileText size={20} className="text-blue-600" />
                            <h3 className="font-semibold text-gray-900">
                              Formulaire Plan de Vie
                            </h3>
                            {syncing === form.key && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                                <RefreshCw size={12} className="animate-spin" />
                                Synchronisation...
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Victime</p>
                              <p className="font-medium text-gray-900">
                                {form.victimName || `ID ${form.victimeId}`}
                              </p>
                              {form.victimName && (
                                <p className="text-xs text-gray-500">ID {form.victimeId}</p>
                              )}
                            </div>
                            <div>
                              <p className="text-gray-500">Questions</p>
                              <p className="font-medium text-gray-900">{getQuestionCount(form.formData)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Catégorie</p>
                              <p className="font-medium text-gray-900">{form.categoriePV || 'Standard'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Date</p>
                              <p className="font-medium text-gray-900">{formatDate(form.timestamp)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => syncForm(form)}
                            disabled={!online || syncing !== null}
                            className="p-2.5 text-white rounded-lg hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: '#901c67' }}
                            title="Synchroniser"
                          >
                            <CloudUpload size={18} />
                          </button>
                          <button
                            onClick={() => deleteForm(form)}
                            disabled={syncing !== null}
                            className="p-2.5 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all disabled:opacity-50"
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pendingForms.length === 0 && (
                    <div className="p-12 text-center">
                      <FileText size={44} className="text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-700 font-medium">Aucun plan de vie en attente</p>
                      <p className="text-sm text-gray-500 mt-1">Les formulaires sauvegardés hors ligne apparaîtront ici.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'contracts' && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Contrats et actes MPU en attente</h2>
                  <p className="text-sm text-gray-600">Contrats et actes MPU stockés localement dans IndexedDB, resoumis avec la même logique que la synchronisation automatique.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={loadPendingContracts}
                    disabled={loadingContracts || contractsSyncing}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 font-medium shadow-sm"
                  >
                    <RefreshCw size={18} className={loadingContracts ? 'animate-spin' : ''} />
                    Actualiser
                  </button>

                  <button
                    onClick={syncAllContracts}
                    disabled={!online || pendingContracts.length === 0 || contractsSyncing}
                    className="flex items-center gap-2 px-6 py-2.5 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md"
                    style={{ backgroundColor: '#901c67' }}
                  >
                    {contractsSyncing ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <CloudUpload size={18} />
                    )}
                    {contractsSyncing ? 'Resoumission...' : 'Resoumettre tout'}
                  </button>
                </div>
              </div>

              {contractsSyncResult && (
                <div className={`mt-4 rounded-lg border p-4 ${contractsSyncResult.failed > 0 ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <CloudUpload size={16} />
                      <span>{contractsSyncResult.total} document(s) traité(s)</span>
                    </div>
                    <div className="text-xs font-medium text-gray-700">
                      {contractsSyncResult.synced} synchronisé(s)
                      {contractsSyncResult.skipped > 0 ? ` · ${contractsSyncResult.skipped} déjà existant(s)` : ''}
                      {contractsSyncResult.failed > 0 ? ` · ${contractsSyncResult.failed} échec(s)` : ''}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {loadingContracts ? (
                <div className="p-12 text-center">
                  <RefreshCw size={48} className="animate-spin text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Chargement...</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {pendingContracts.map((contract) => (
                    <div
                      key={contract.id ?? `${contract.victimId}-${contract.createdAt}`}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <FileText size={20} className="text-orange-600" />
                            <h3 className="font-semibold text-gray-900">
                              {getContractTypeLabel(contract)}
                            </h3>
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                              En attente
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Victime</p>
                              <p className="font-medium text-gray-900">{getContractBeneficiary(contract)}</p>
                              <p className="text-xs text-gray-500">ID {contract.victimId}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Préjudice</p>
                              <p className="font-medium text-gray-900">{contract.contractData?.typePrejudiceReconnu || '-'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Montant total</p>
                              <p className="font-medium text-gray-900">
                                {Number(contract.contractData?.montantTotalUSD || 0).toLocaleString('fr-FR')} USD
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Date locale</p>
                              <p className="font-medium text-gray-900">{formatDate(contract.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pendingContracts.length === 0 && (
                    <div className="p-12 text-center">
                      <FileText size={44} className="text-green-500 mx-auto mb-4" />
                      <p className="text-gray-700 font-medium">Tous les contrats et actes MPU sont synchronisés</p>
                      <p className="text-sm text-gray-500 mt-1">Les documents dont la synchronisation a échoué resteront ici pour être resoumis.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'cache' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Gestion du cache</h2>
                <p className="text-sm text-gray-600">Visualiser les enregistrements en cache et vider les bases IndexedDB.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadCacheInventory}
                  disabled={loadingCacheInventory || victimsCacheSyncing}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                  title="Actualiser les informations du cache"
                >
                  <RefreshCw size={16} className={loadingCacheInventory ? 'animate-spin' : ''} />
                  Actualiser infos cache
                </button>
                <button
                  onClick={refreshVictimsCache}
                  disabled={!online || victimsCacheSyncing}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                  title="Compléter le cache local avec les nouvelles victimes de la base de données"
                >
                  <RefreshCw size={16} className={victimsCacheSyncing ? 'animate-spin' : ''} />
                  Compléter les nouvelles données
                </button>
                <button
                  onClick={clearAllCachesAndReload}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 hover:border-red-400 transition-all font-medium shadow-sm"
                  title="Supprimer toutes les bases IndexedDB et recharger"
                >
                  <Trash2 size={16} />
                  Vider les caches
                </button>
              </div>
            </div>

            {(victimsCacheProgress || victimsCacheMessage) && (
              <div className={`mt-5 rounded-lg border p-4 ${
                victimsCacheProgress?.status === 'error'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-blue-200 bg-blue-50 text-blue-900'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <RefreshCw size={16} className={victimsCacheSyncing ? 'animate-spin' : ''} />
                    <span>{victimsCacheMessage || victimsCacheProgress?.message}</span>
                  </div>
                  {victimsCacheProgress && (
                    <span className="text-xs font-medium">
                      Page {victimsCacheProgress.currentPage} / {victimsCacheProgress.totalPages} · {victimsCacheProgress.records.toLocaleString('fr-FR')} ligne(s)
                    </span>
                  )}
                </div>
                {victimsCacheProgress && victimsCacheProgress.totalPages > 0 && (
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/70">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.round((victimsCacheProgress.currentPage / victimsCacheProgress.totalPages) * 100))}%`
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="mt-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Données en cache</h3>
                  <p className="text-xs text-gray-500">
                    Tables IndexedDB contenant au moins un enregistrement local.
                  </p>
                </div>
                <div className="text-xs font-semibold text-gray-600">
                  {cacheInventory.length.toLocaleString('fr-FR')} table(s)
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-600">
                    <tr>
                      <th className="px-4 py-3">Base</th>
                      <th className="px-4 py-3">Table</th>
                      <th className="px-4 py-3 text-right">Enregistrements</th>
                      <th className="px-4 py-3">Nom technique</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {loadingCacheInventory && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-600">
                          <RefreshCw size={28} className="mx-auto mb-2 animate-spin text-gray-400" />
                          Lecture du cache...
                        </td>
                      </tr>
                    )}

                    {!loadingCacheInventory && cacheInventory.map((row) => (
                      <tr key={`${row.dbName}-${row.tableName}`} className="text-gray-800">
                        <td className="px-4 py-3 font-semibold text-gray-900">{row.dbLabel}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{row.tableLabel}</div>
                          {row.error && <div className="text-xs text-red-600">{row.error}</div>}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-blue-700">
                          {row.records.toLocaleString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {row.dbName}.{row.tableName}
                        </td>
                      </tr>
                    ))}

                    {!loadingCacheInventory && cacheInventory.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-600">
                          Aucune donnée en cache détectée.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReglagesPage;
