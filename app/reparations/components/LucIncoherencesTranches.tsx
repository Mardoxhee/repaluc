"use client";

import React, { useEffect, useState } from 'react';
import { FiAlertOctagon, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
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

const formatUSD = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

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

const getNestedVictim = (row: any) => row?.victime ?? row?.victim ?? row;

const getVictimName = (row: any) => {
  const victim = getNestedVictim(row);
  const fullName = String(victim?.fullName ?? victim?.nomComplet ?? victim?.name ?? row?.nomComplet ?? '').trim();
  if (fullName) return fullName;

  return [victim?.nom ?? row?.nom, victim?.postnom ?? row?.postnom, victim?.prenom ?? row?.prenom]
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)
    .join(' ') || 'Non renseigné';
};

const getVictimCode = (row: any) => {
  const victim = getNestedVictim(row);
  return String(victim?.code ?? victim?.numeroVictime ?? victim?.id ?? row?.victimeId ?? row?.id ?? '-');
};

const getPlanAmount = (plan: any) => toNumber(plan?.montantUSD ?? plan?.montant ?? plan?.amount);

const getPlannedTranchesTotal = (row: any) => {
  const explicit = toNumber(
    row?.sommeTranchesPlanifiees ??
    row?.sommeTranches ??
    row?.totalTranchesPlanifiees ??
    row?.montantTotalPlanifieUSD ??
    row?.totalPlanifieUSD ??
    row?.totalPlanifie
  );
  if (explicit > 0) return explicit;

  const plans = normalizeApiList(row?.planIndemnisation ?? row?.plans ?? row?.contrat?.planIndemnisation);
  return plans.reduce((sum, plan) => sum + getPlanAmount(plan), 0);
};

const getRegisteredIndemnisation = (row: any) => {
  const victim = getNestedVictim(row);
  return toNumber(
    row?.indemnisationVictime ??
    row?.montantVictimeIndemnisation ??
    row?.montantIndemnisationReference ??
    victim?.indemnisation
  );
};

const getDifference = (row: any) => {
  const explicit = toNumber(row?.ecart ?? row?.difference ?? row?.depassement ?? row?.montantDepassement);
  if (explicit > 0) return explicit;
  return Math.max(0, getPlannedTranchesTotal(row) - getRegisteredIndemnisation(row));
};

const LucIncoherencesTranches: React.FC = () => {
  const { fetcher } = useFetch();
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<any[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(DEFAULT_META);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchRows = async () => {
      setLoading(true);
      try {
        const limit = 20;
        const payload = await fetcher(`/victime/indemnisation/incoherences-tranches/LUC?page=${page}&limit=${limit}`);
        if (!mounted) return;
        const normalizedRows = normalizeApiList(payload);
        setRows(normalizedRows);
        setMeta(normalizeMeta(payload, normalizedRows.length, page, limit));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRows();

    return () => {
      mounted = false;
    };
  }, [fetcher, page]);

  const totalDifference = rows.reduce((sum, row) => sum + getDifference(row), 0);

  return (
    <div className="mb-8 overflow-hidden rounded-lg border border-red-200 bg-white shadow-lg">
      <div className="border-b border-red-200 bg-red-50 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-red-100 p-2.5">
              <FiAlertOctagon className="text-red-700" size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Incohérences des tranches LUC</h2>
              <p className="text-sm text-gray-600">Somme des tranches planifiées supérieure au montant enregistré dans victime.indemnisation.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-red-200 bg-white px-4 py-3 text-right">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-red-700">Victimes</div>
              <div className="text-2xl font-black text-gray-950">{loading ? '...' : meta.total.toLocaleString()}</div>
            </div>
            <div className="rounded-md border border-red-200 bg-white px-4 py-3 text-right">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-red-700">Écart page</div>
              <div className="text-lg font-black text-gray-950">{loading ? '...' : formatUSD.format(totalDifference)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-bold text-gray-900">Victimes à vérifier</h3>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900">Victime</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-900">Indemnisation</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-900">Tranches planifiées</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-900">Écart</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3" colSpan={6}>
                        <div className="h-4 rounded bg-gray-100 animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : rows.length > 0 ? (
                  rows.map((row, index) => {
                    const indemnisation = getRegisteredIndemnisation(row);
                    const planned = getPlannedTranchesTotal(row);
                    const difference = getDifference(row);

                    return (
                      <tr key={row?.id ?? row?.victimeId ?? `${page}-${index}`} className="hover:bg-red-50/40">
                        <td className="px-4 py-3 text-sm text-gray-700">{index + 1 + (meta.page - 1) * meta.limit}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{getVictimCode(row)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{getVictimName(row)}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-700">{formatUSD.format(indemnisation)}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-700">{formatUSD.format(planned)}</td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-red-700">{formatUSD.format(difference)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-4 py-8 text-center text-sm text-gray-500" colSpan={6}>Aucune incohérence détectée.</td>
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
  );
};

export default LucIncoherencesTranches;
