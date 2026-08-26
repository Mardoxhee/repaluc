"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { FiAlertTriangle, FiChevronLeft, FiChevronRight, FiMapPin, FiUsers } from 'react-icons/fi';
import { useFetch } from '../../context/FetchContext';
import { normalizeApiList, toNumber } from '../utils/mentionStats';

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type LocalisationRow = {
  label: string;
  province: string;
  territoire: string;
  total: number;
};

const DEFAULT_META: PaginationMeta = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

const getPayloadData = (payload: any) => (
  payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
    ? payload.data
    : payload
);

const normalizeMeta = (payload: any, rowsLength: number, page: number, limit: number): PaginationMeta => {
  const meta = payload?.meta ?? payload?.pagination ?? payload?.data?.meta ?? {};
  const total = toNumber(meta?.total ?? payload?.total ?? payload?.data?.total) || rowsLength;
  const totalPages = toNumber(meta?.totalPages ?? meta?.lastPage) || Math.max(1, Math.ceil(total / limit));
  const currentPage = toNumber(meta?.page ?? meta?.currentPage) || page;

  return {
    total,
    page: currentPage,
    limit: toNumber(meta?.limit ?? meta?.perPage) || limit,
    totalPages,
    hasNextPage: Boolean(meta?.hasNextPage ?? currentPage < totalPages),
    hasPreviousPage: Boolean(meta?.hasPreviousPage ?? currentPage > 1),
  };
};

const getVictimName = (victim: any) => {
  const fullName = String(victim?.fullName ?? victim?.nomComplet ?? victim?.name ?? '').trim();
  if (fullName) return fullName;

  return [victim?.nom, victim?.postnom, victim?.prenom]
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)
    .join(' ') || 'Non renseigné';
};

const getVictimLocalisation = (victim: any) => {
  const origin = victim?.["PROVINCE, TERRITOIRE, SECTEUR, GROUPEMENT  ET VILLAGE D'ORIGINE"];
  const province = victim?.province ?? victim?.Province ?? victim?.localisation?.province;
  const territoire = victim?.territoire ?? victim?.Territoire ?? victim?.localisation?.territoire;
  const village = victim?.village ?? victim?.Village ?? victim?.localisation?.village;

  return String(origin ?? [province, territoire, village].filter(Boolean).join(' / ') ?? '').trim() || 'Non renseignée';
};

const normalizeLocalisations = (payload: any): LocalisationRow[] => {
  const data = getPayloadData(payload);
  const rows: any[] = Array.isArray(data?.localisations)
    ? data.localisations
    : Array.isArray(data?.parLocalisation)
      ? data.parLocalisation
      : Array.isArray(data?.repartitions)
        ? data.repartitions
        : normalizeApiList(payload);

  return rows
    .map((item: any) => {
      const province = String(item?.province ?? item?.Province ?? item?.localisation?.province ?? '').trim();
      const territoire = String(item?.territoire ?? item?.Territoire ?? item?.localisation?.territoire ?? '').trim();
      const label = String(
        item?.localisation ??
        item?.label ??
        item?.name ??
        [province, territoire].filter(Boolean).join(' / ') ??
        'Non renseignée'
      ).trim() || 'Non renseignée';
      const total = toNumber(item?.total ?? item?.count ?? item?.nombre ?? item?.value);

      return {
        label,
        province: province || '-',
        territoire: territoire || '-',
        total,
      };
    })
    .filter((item) => item.total > 0 || item.label !== 'Non renseignée')
    .sort((a, b) => b.total - a.total);
};

const VictimesContratSigneNonIndemnisees: React.FC = () => {
  const { fetcher } = useFetch();
  const [loading, setLoading] = useState(true);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [victims, setVictims] = useState<any[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(DEFAULT_META);
  const [localisations, setLocalisations] = useState<LocalisationRow[]>([]);

  const topLocalisations = useMemo(() => localisations.slice(0, 6), [localisations]);

  useEffect(() => {
    let mounted = true;

    const fetchLocalisations = async () => {
      setLoading(true);
      try {
        const payload = await fetcher('/victime/contrat-signe/non-indemnisees/par-localisation');
        if (!mounted) return;
        setLocalisations(normalizeLocalisations(payload));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchLocalisations();

    return () => {
      mounted = false;
    };
  }, [fetcher]);

  useEffect(() => {
    let mounted = true;

    const fetchVictims = async () => {
      setRowsLoading(true);
      try {
        const limit = 20;
        const payload = await fetcher(`/victime/contrat-signe/non-indemnisees?page=${page}&limit=${limit}`);
        if (!mounted) return;
        const normalizedRows = normalizeApiList(payload);
        setVictims(normalizedRows);
        setMeta(normalizeMeta(payload, normalizedRows.length, page, limit));
      } finally {
        if (mounted) setRowsLoading(false);
      }
    };

    fetchVictims();

    return () => {
      mounted = false;
    };
  }, [fetcher, page]);

  const total = meta.total || localisations.reduce((sum, item) => sum + item.total, 0);
  const maxLocalisationTotal = Math.max(...topLocalisations.map((item) => item.total), 0);

  return (
    <div className="mb-8 overflow-hidden rounded-lg border border-amber-100 bg-white shadow-lg">
      <div className="border-b border-amber-100 bg-amber-50/70 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-amber-100 p-2.5">
              <FiAlertTriangle className="text-amber-700" size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Contrats signés non indemnisés</h2>
              <p className="text-sm text-gray-600">Victimes ayant signé un contrat mais sans indemnisation démarrée.</p>
            </div>
          </div>
          <div className="rounded-md border border-amber-200 bg-white px-4 py-3 text-right">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">Total</div>
            <div className="text-2xl font-black text-gray-950">{loading || rowsLoading ? '...' : total.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 p-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="min-w-0">
          <div className="mb-4 flex items-center gap-2">
            <FiMapPin className="text-amber-700" size={18} />
            <h3 className="text-sm font-bold text-gray-900">Répartition par localisation</h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-11 rounded-md bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : topLocalisations.length > 0 ? (
            <div className="space-y-3">
              {topLocalisations.map((item) => {
                const width = maxLocalisationTotal > 0 ? Math.max(6, Math.round((item.total / maxLocalisationTotal) * 100)) : 0;
                return (
                  <div key={`${item.label}-${item.total}`} className="rounded-md border border-gray-100 bg-gray-50 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-gray-900" title={item.label}>{item.label}</div>
                        <div className="text-xs text-gray-500">{item.province} · {item.territoire}</div>
                      </div>
                      <div className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">{item.total.toLocaleString()}</div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
              Aucune donnée par localisation disponible.
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <FiUsers className="text-amber-700" size={18} />
              <h3 className="text-sm font-bold text-gray-900">Victimes concernées</h3>
            </div>
            <div className="text-xs font-semibold text-gray-500">
              Page {meta.page} / {meta.totalPages}
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900">N°</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900">Victime</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900">Mention</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900">Localisation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {rowsLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3" colSpan={4}>
                          <div className="h-4 rounded bg-gray-100 animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : victims.length > 0 ? (
                    victims.map((victim, index) => (
                      <tr key={victim?.id ?? `${page}-${index}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700">{index + 1 + (meta.page - 1) * meta.limit}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{getVictimName(victim)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{victim?.mention ?? '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{getVictimLocalisation(victim)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-8 text-center text-sm text-gray-500" colSpan={4}>Aucune victime à afficher.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={rowsLoading || !meta.hasPreviousPage}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <FiChevronLeft size={16} />
              Précédent
            </button>
            <div className="text-center text-xs text-gray-500">
              {total.toLocaleString()} victime{total > 1 ? 's' : ''}
            </div>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={rowsLoading || !meta.hasNextPage}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Suivant
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VictimesContratSigneNonIndemnisees;
