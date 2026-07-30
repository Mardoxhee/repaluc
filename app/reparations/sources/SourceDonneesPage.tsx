"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiCheckCircle, FiClock, FiDatabase, FiFileText, FiRefreshCw, FiTrash2, FiUploadCloud, FiXCircle } from 'react-icons/fi';

type ImportStatus = 'success' | 'error';

type ImportHistoryItem = {
  id: string;
  fileName: string;
  importedAt: string;
  status: ImportStatus;
  count?: number | null;
  message?: string;
};

const HISTORY_KEY = 'repaluc_import_history';

const readHistory = (): ImportHistoryItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveHistory = (items: ImportHistoryItem[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 12)));
};

const formatDate = (value: string) => {
  try {
    return new Date(value).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
};

const SourceDonneesPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<ImportHistoryItem[]>([]);

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  const addHistory = useCallback((item: ImportHistoryItem) => {
    setHistory((prev) => {
      const next = [item, ...prev].slice(0, 12);
      saveHistory(next);
      return next;
    });
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const excelFile = acceptedFiles.find((f) => f.name.endsWith('.xlsx') || f.name.endsWith('.xls'));
    setSuccessMessage(null);

    if (!excelFile) {
      setError('Merci de charger un fichier Excel (.xlsx ou .xls).');
      setFile(null);
      return;
    }

    setFile(excelFile);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    disabled: loading,
  });

  const latestSuccessful = useMemo(() => history.find((item) => item.status === 'success'), [history]);
  const totalSuccess = history.filter((item) => item.status === 'success').length;
  const totalErrors = history.filter((item) => item.status === 'error').length;

  const uploadFile = async () => {
    if (!file || loading) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const responseData = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${process.env.NEXT_PUBLIC_API_BASE_URL}/analysis-mapping/upload`);
        xhr.responseType = 'json';

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 78));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setProgress(100);
            resolve(xhr.response ?? null);
            return;
          }

          reject(new Error(`Erreur lors du chargement (${xhr.status}).`));
        };

        xhr.onerror = () => reject(new Error('Erreur réseau pendant le chargement.'));
        xhr.send(formData);
      });

      const count = typeof responseData?.count === 'number' ? responseData.count : null;
      const message = count !== null
        ? `${count.toLocaleString()} donnée(s) traitée(s) avec succès.`
        : 'Fichier chargé avec succès.';

      setSuccessMessage(message);
      addHistory({
        id: `${Date.now()}-${file.name}`,
        fileName: file.name,
        importedAt: new Date().toISOString(),
        status: 'success',
        count,
        message,
      });
      setFile(null);
    } catch (e: any) {
      const message = e?.message || 'Impossible de charger le fichier.';
      setError(message);
      addHistory({
        id: `${Date.now()}-${file?.name || 'unknown'}`,
        fileName: file?.name || 'Fichier inconnu',
        importedAt: new Date().toISOString(),
        status: 'error',
        count: null,
        message,
      });
    } finally {
      setLoading(false);
      window.setTimeout(() => setProgress(0), 700);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 px-4 py-6 md:px-6">
      <section className="mb-6 rounded-lg border border-primary-100 bg-white p-5 shadow-[0_18px_50px_-38px_rgba(0,127,186,0.55)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-primary-600">
              Module source de données
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
              Chargement des données
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Import des fichiers Excel, suivi des derniers chargements et visibilité rapide sur les erreurs.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-primary-50 px-4 py-3">
              <div className="text-lg font-black text-primary-700">{history.length}</div>
              <div className="text-[11px] font-semibold text-primary-700/80">chargements</div>
            </div>
            <div className="rounded-lg bg-emerald-50 px-4 py-3">
              <div className="text-lg font-black text-emerald-700">{totalSuccess}</div>
              <div className="text-[11px] font-semibold text-emerald-700/80">réussis</div>
            </div>
            <div className="rounded-lg bg-rose-50 px-4 py-3">
              <div className="text-lg font-black text-rose-700">{totalErrors}</div>
              <div className="text-[11px] font-semibold text-rose-700/80">erreurs</div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.7)]">
          <div className="mb-4 flex items-start gap-3">
            <div className="rounded-lg bg-primary-50 p-3 text-primary-600">
              <FiUploadCloud size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">Importer un fichier Excel</h2>
              <p className="text-sm text-slate-600">
                Formats acceptés: `.xlsx` et `.xls`. Le fichier est envoyé à l’endpoint existant de mapping.
              </p>
            </div>
          </div>

          <div
            {...getRootProps()}
            className={`flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-all ${
              isDragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-slate-300 bg-slate-50 hover:border-primary-300 hover:bg-primary-50/40'
            } ${loading ? 'cursor-not-allowed opacity-70' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="mb-4 rounded-lg bg-white p-4 text-primary-600 shadow-sm">
              <FiFileText size={34} />
            </div>
            <p className="max-w-lg text-base font-bold text-slate-900">
              {isDragActive ? 'Dépose le fichier ici…' : 'Glisse-dépose le fichier Excel ou clique pour sélectionner'}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Le chargement sera ajouté automatiquement dans l’historique.
            </p>
          </div>

          {file && (
            <div className="mt-4 flex flex-col gap-3 rounded-lg border border-primary-100 bg-primary-50/70 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-white p-2 text-primary-600">
                  <FiFileText size={18} />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-950">{file.name}</div>
                  <div className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
              </div>
              <button
                type="button"
                onClick={uploadFile}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <FiRefreshCw className="animate-spin" /> : <FiUploadCloud />}
                Charger les données
              </button>
            </div>
          )}

          {loading && (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-primary-700">
                <span>Chargement en cours</span>
                <span>{progress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-100 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
              <FiXCircle />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              <FiCheckCircle />
              {successMessage}
            </div>
          )}
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.7)]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary-50 p-3 text-primary-600">
                <FiDatabase size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-950">Historique</h2>
                <p className="text-sm text-slate-600">Derniers chargements locaux.</p>
              </div>
            </div>
            {history.length > 0 && (
              <button
                type="button"
                onClick={clearHistory}
                className="rounded-md border border-slate-200 p-2 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                title="Vider l’historique"
              >
                <FiTrash2 size={16} />
              </button>
            )}
          </div>

          {latestSuccessful && (
            <div className="mb-4 rounded-lg border border-primary-100 bg-primary-50/70 p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-primary-700">
                Dernier chargement réussi
              </div>
              <div className="mt-1 truncate text-sm font-black text-slate-950">{latestSuccessful.fileName}</div>
              <div className="mt-1 text-xs text-slate-500">{formatDate(latestSuccessful.importedAt)}</div>
            </div>
          )}

          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                Aucun chargement enregistré pour le moment.
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-slate-950">{item.fileName}</div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <FiClock size={12} />
                        {formatDate(item.importedAt)}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${
                        item.status === 'success'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {item.status === 'success' ? <FiCheckCircle size={12} /> : <FiXCircle size={12} />}
                      {item.status === 'success' ? 'Réussi' : 'Erreur'}
                    </span>
                  </div>
                  {typeof item.count === 'number' && (
                    <div className="mt-3 text-sm font-semibold text-primary-700">
                      {item.count.toLocaleString()} donnée(s) traitée(s)
                    </div>
                  )}
                  {item.message && (
                    <div className="mt-2 text-xs text-slate-500">{item.message}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SourceDonneesPage;
