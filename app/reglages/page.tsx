"use client";
import React, { useState, useEffect } from 'react';
import {
  CloudUpload,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
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

const API_PLANVIE_URL = process.env.NEXT_PUBLIC_API_PLANVIE_URL;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface PendingForm {
  key: string;
  victimeId: number;
  userId: number;
  formData: any;
  timestamp: number;
  status: string;
}

const ReglagesPage = () => {
  const [pendingForms, setPendingForms] = useState<PendingForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [checkingVictimsCache, setCheckingVictimsCache] = useState(false);
  const [victimsStoreExists, setVictimsStoreExists] = useState<boolean | null>(null);
  const [cachedVictimsCount, setCachedVictimsCount] = useState<number>(0);
  const [cachedVictimsData, setCachedVictimsData] = useState<any[]>([]);
  const [uploadingVictims, setUploadingVictims] = useState(false);
  const [victimsUploadProgress, setVictimsUploadProgress] = useState<{ sent: number; total: number } | null>(null);

  useEffect(() => {
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

  const checkVictimsCache = async () => {
    const VICTIMS_DB_NAME = 'VictimsCache';
    const VICTIMS_DB_VERSION = 2;
    const VICTIMS_STORE_NAME = 'victims';
    const cacheKey = 'all-victims-cache';

    try {
      setCheckingVictimsCache(true);
      setVictimsStoreExists(null);
      setCachedVictimsCount(0);
      setCachedVictimsData([]);

      const db: IDBDatabase = await new Promise((resolve, reject) => {
        const request = indexedDB.open(VICTIMS_DB_NAME, VICTIMS_DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });

      const storeExists = db.objectStoreNames.contains(VICTIMS_STORE_NAME);
      setVictimsStoreExists(storeExists);

      if (!storeExists) {
        db.close();
        return;
      }

      const entry = await new Promise<any | undefined>((resolve, reject) => {
        const tx = db.transaction([VICTIMS_STORE_NAME], 'readonly');
        const store = tx.objectStore(VICTIMS_STORE_NAME);
        const req = store.get(cacheKey);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      const data = Array.isArray(entry?.data) ? entry.data : [];
      setCachedVictimsData(data);
      setCachedVictimsCount(data.length);
      db.close();
    } catch (error) {
      console.error('[Reglages] Erreur vérification VictimsCache:', error);
      setVictimsStoreExists(false);
    } finally {
      setCheckingVictimsCache(false);
    }
  };

  const uploadCachedVictimsToApi = async () => {
    if (!online) {
      await Swal.fire({
        icon: 'warning',
        title: 'Hors ligne',
        text: 'Vous devez être en ligne pour renvoyer les victimes',
        confirmButtonColor: '#901c67'
      });
      return;
    }

    if (!API_BASE_URL) {
      await Swal.fire({
        icon: 'error',
        title: 'Configuration manquante',
        text: 'NEXT_PUBLIC_API_BASE_URL n\'est pas configurée',
        confirmButtonColor: '#901c67'
      });
      return;
    }

    if (cachedVictimsData.length === 0) {
      await Swal.fire({
        icon: 'info',
        title: 'Aucune donnée',
        text: 'Aucune victime à renvoyer depuis le cache',
        confirmButtonColor: '#901c67'
      });
      return;
    }

    const result = await Swal.fire({
      icon: 'question',
      title: 'Renvoyer vers la BD',
      text: `Voulez-vous renvoyer ${cachedVictimsData.length} victime(s) vers la BD ? (par lots de 20)`,
      showCancelButton: true,
      confirmButtonText: 'Oui, renvoyer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#901c67'
    });

    if (!result.isConfirmed) return;

    const url = `${API_BASE_URL}/victime/multiple`;
    const batchSize = 20;

    try {
      setUploadingVictims(true);
      setVictimsUploadProgress({ sent: 0, total: cachedVictimsData.length });

      for (let i = 0; i < cachedVictimsData.length; i += batchSize) {
        const batch = cachedVictimsData.slice(i, i + batchSize);

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: batch })
        });

        if (!response.ok) {
          throw new Error(`Erreur serveur (${response.status})`);
        }

        setVictimsUploadProgress({ sent: Math.min(i + batch.length, cachedVictimsData.length), total: cachedVictimsData.length });
      }

      await Swal.fire({
        icon: 'success',
        title: 'Terminé',
        text: 'Les victimes ont été renvoyées avec succès',
        confirmButtonColor: '#901c67'
      });
    } catch (error: any) {
      console.error('[Reglages] Erreur upload victims:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error?.message || 'Impossible de renvoyer les victimes',
        confirmButtonColor: '#901c67'
      });
    } finally {
      setUploadingVictims(false);
      setVictimsUploadProgress(null);
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
            <p className="text-base font-semibold text-purple-600">
              {new Date().toLocaleTimeString('fr-FR')}
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={loadPendingForms}
              disabled={loading}
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
              <CloudUpload size={18} />
              Synchroniser tout
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={checkVictimsCache}
                disabled={checkingVictimsCache}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 font-medium shadow-sm"
                title="Vérifier si IndexedDB contient le store victims"
              >
                <Database size={18} className={checkingVictimsCache ? 'animate-spin' : ''} />
                Vérifier victims
              </button>

              {victimsStoreExists === true && cachedVictimsCount > 0 && (
                <button
                  onClick={uploadCachedVictimsToApi}
                  disabled={!online || uploadingVictims || checkingVictimsCache}
                  className="flex items-center gap-2 px-6 py-2.5 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md"
                  style={{ backgroundColor: '#901c67' }}
                  title="Renvoyer les victimes du cache vers l'API"
                >
                  <CloudUpload size={18} />
                  Renvoyer ({cachedVictimsCount})
                </button>
              )}
            </div>
          </div>

          {victimsStoreExists === false && (
            <div className="mt-3 text-sm text-gray-600">
              Aucune table/store <span className="font-semibold">victims</span> trouvée dans IndexedDB.
            </div>
          )}
          {victimsStoreExists === true && cachedVictimsCount === 0 && (
            <div className="mt-3 text-sm text-gray-600">
              Table/store <span className="font-semibold">victims</span> détectée, mais aucune donnée en cache.
            </div>
          )}
          {victimsUploadProgress && (
            <div className="mt-3 text-sm text-gray-600">
              Envoi en cours: <span className="font-semibold">{victimsUploadProgress.sent}</span> / {victimsUploadProgress.total}
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
          ) : pendingForms.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Tout est synchronisé !
              </h3>
              <p className="text-gray-600">
                Aucun formulaire en attente de synchronisation
              </p>
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
                          <span className="text-gray-500">Victime ID:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            #{form.victimeId}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Questions:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {getQuestionCount(form.formData)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Date:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {formatDate(form.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
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
                        className="p-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Info Banner */}
        {!online && pendingForms.length > 0 && (
          <div className="mt-6 bg-white border border-orange-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-start gap-4 p-5">
              <div className="p-3 bg-orange-50 rounded-lg">
                <AlertCircle size={24} className="text-orange-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Mode hors ligne
                </h4>
                <p className="text-sm text-gray-600">
                  Vous devez être en ligne pour synchroniser les formulaires.
                  Les formulaires seront automatiquement synchronisés lors du retour de la connexion.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReglagesPage;