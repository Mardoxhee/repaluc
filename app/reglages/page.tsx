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
  isOnline
} from '@/app/utils/planVieCache';
import { getAllPendingVictimDocs } from '@/app/utils/victimDocsCache';
import { getAllPendingVictimPhotos } from '@/app/utils/victimPhotosCache';
import { syncPendingVictimDocsForVictim } from '@/app/utils/victimDocsSyncService';
import { syncPendingVictimPhotosForVictim } from '@/app/utils/victimPhotosSyncService';

const API_PLANVIE_URL = process.env.NEXT_PUBLIC_API_PLANVIE_URL;

interface PendingForm {
  key: string;
  victimeId: number;
  userId: number;
  formData: any;
  timestamp: number;
  status: string;
}

type PendingVictimRow = {
  victimId: number;
  victimName?: string;
  pendingDocs: number;
  pendingPhotos: number;
};

const ReglagesPage = () => {
  const [pendingForms, setPendingForms] = useState<PendingForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'sync' | 'cache'>('sync');

  const [showVictimPending, setShowVictimPending] = useState(false);
  const [pendingVictimRows, setPendingVictimRows] = useState<PendingVictimRow[]>([]);
  const [loadingVictimPending, setLoadingVictimPending] = useState(false);
  const [syncingVictimId, setSyncingVictimId] = useState<number | null>(null);
  const [selectedVictims, setSelectedVictims] = useState<Record<number, boolean>>({});
  const [batchCount, setBatchCount] = useState<number>(10);
  const [batchSyncing, setBatchSyncing] = useState<boolean>(false);

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
      const resp = await fetch(`${baseUrl}/victime/${victimId}`, {
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

  useEffect(() => {
    setMounted(true);
    setLastUpdateTime(new Date().toLocaleTimeString('fr-FR'));

    loadPendingForms();
    checkOnlineStatus();

    const handleOnline = () => {
      setOnline(true);
      loadPendingForms();
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadPendingVictimMedia = async () => {
    try {
      setLoadingVictimPending(true);
      const [docs, photos] = await Promise.all([getAllPendingVictimDocs(), getAllPendingVictimPhotos()]);
      const rowsByVictim = new Map<number, PendingVictimRow>();

      const cacheMap = await getVictimsCacheMap();

      for (const d of docs || []) {
        if (d.synced) continue;
        const row = rowsByVictim.get(d.victimId) || { victimId: d.victimId, victimName: cacheMap.get(d.victimId) || '', pendingDocs: 0, pendingPhotos: 0 };
        row.pendingDocs += 1;
        rowsByVictim.set(d.victimId, row);
      }

      for (const p of photos || []) {
        if (p.synced) continue;
        const row = rowsByVictim.get(p.victimId) || { victimId: p.victimId, victimName: cacheMap.get(p.victimId) || '', pendingDocs: 0, pendingPhotos: 0 };
        row.pendingPhotos += 1;
        rowsByVictim.set(p.victimId, row);
      }

      const missingNames = Array.from(rowsByVictim.values())
        .filter((r) => !r.victimName)
        .map((r) => r.victimId);

      if (online && missingNames.length > 0) {
        for (const id of missingNames.slice(0, 50)) {
          const n = await fetchVictimNameFromApi(id);
          if (!n) continue;
          const existing = rowsByVictim.get(id);
          if (existing) {
            existing.victimName = n;
            rowsByVictim.set(id, existing);
          }
        }
      }

      const rows = Array.from(rowsByVictim.values()).sort((a, b) => a.victimId - b.victimId);
      setPendingVictimRows(rows);

      setSelectedVictims((prev) => {
        const next: Record<number, boolean> = { ...prev };
        const existingIds = new Set(rows.map((r) => r.victimId));
        for (const key of Object.keys(next)) {
          const id = Number(key);
          if (!existingIds.has(id)) delete next[id];
        }
        return next;
      });
    } catch (e) {
      console.error('[Reglages] Erreur chargement pending victim media', e);
      setPendingVictimRows([]);
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
      await loadPendingVictimMedia();
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
        await loadPendingVictimMedia();
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

      const response = await fetch(`${API_PLANVIE_URL}/plan-vie-enquette`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
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

        const response = await fetch(`${API_PLANVIE_URL}/plan-vie-enquette`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          await deletePendingForm(form.key);
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`Erreur sync ${form.key}:`, error);
        errorCount++;
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

  return (
    <div className="p-6 pt-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Paramètres & Synchronisation
          </h1>
          <p className="text-gray-600">
            Gérez les formulaires en attente de synchronisation
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
            onClick={() => setActiveTab('cache')}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${activeTab === 'cache'
              ? 'bg-white border-gray-300 text-gray-900 shadow-sm'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-white'
              }`}
          >
            Cache
          </button>
        </div>

        {/* Status Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                {/* <button
                  onClick={loadPendingForms}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 font-medium shadow-sm"
                >
                  <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                  Actualiser
                </button> */}

                {/* <button
                  onClick={syncAllForms}
                  disabled={!online || pendingForms.length === 0 || syncing !== null}
                  className="flex items-center gap-2 px-6 py-2.5 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md"
                  style={{ backgroundColor: '#901c67' }}
                >
                  <CloudUpload size={18} />
                  Synchroniser tout
                </button> */}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={async () => {
                      const next = !showVictimPending;
                      setShowVictimPending(next);
                      if (next) await loadPendingVictimMedia();
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
                      Victimes en attente: <span className="font-semibold">{pendingVictimRows.length}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={loadPendingVictimMedia}
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

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Victime ID</p>
                              <p className="font-medium text-gray-900">{form.victimeId}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Questions</p>
                              <p className="font-medium text-gray-900">{getQuestionCount(form.formData)}</p>
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
                  onClick={clearAllCachesAndReload}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 hover:border-red-400 transition-all font-medium shadow-sm"
                  title="Supprimer toutes les bases IndexedDB et recharger"
                >
                  <Trash2 size={16} />
                  Vider les caches
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReglagesPage;