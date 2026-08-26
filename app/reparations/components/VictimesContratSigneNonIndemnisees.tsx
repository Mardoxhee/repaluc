"use client";

import React, { useEffect, useState } from 'react';
import { FiAlertTriangle, FiChevronLeft, FiChevronRight, FiUsers } from 'react-icons/fi';
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

const DEFAULT_META: PaginationMeta = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

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

const VictimesContratSigneNonIndemnisees: React.FC = () => {
  const { fetcher } = useFetch();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [victims, setVictims] = useState<any[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(DEFAULT_META);

  useEffect(() => {
    let mounted = true;

    const fetchVictims = async () => {
      setLoading(true);
      try {
        const limit = 20;
        const payload = await fetcher(`/victime/contrat-signe/non-indemnisees?page=${page}&limit=${limit}`);
        if (!mounted) return;
        const normalizedRows = normalizeApiList(payload);
        setVictims(normalizedRows);
        setMeta(normalizeMeta(payload, normalizedRows.length, page, limit));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchVictims();

    return () => {
      mounted = false;
    };
  }, [fetcher, page]);

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
            <div className="text-2xl font-black text-gray-950">{loading ? '...' : meta.total.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="p-5">
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
                  {loading ? (
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
              disabled={loading || !meta.hasPreviousPage}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <FiChevronLeft size={16} />
              Précédent
            </button>
            <div className="text-center text-xs text-gray-500">
              {meta.total.toLocaleString()} victime{meta.total > 1 ? 's' : ''}
            </div>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={loading || !meta.hasNextPage}
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
