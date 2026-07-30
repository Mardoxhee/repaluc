"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiBriefcase,
  FiDollarSign,
  FiHeart,
  FiCreditCard,
  FiFileText,
} from 'react-icons/fi';
import { IndemnisationGauge, ProgressionBreakdownCard } from './shared';
import { getMockProgressionLucStats } from '../mocks/data';
import { useFetch } from '../../context/FetchContext';
import {
  buildIndemnisationDashboardStats,
  IndemnisationDashboardStats,
  normalizeApiList,
} from '../utils/indemnisationDashboard';

const emptyIndemnisationStats = (): IndemnisationDashboardStats =>
  buildIndemnisationDashboardStats({ contrats: [], plans: [], indemnisations: [] });

const formatUsd = (amount: number): string => {
  return `${Math.round(amount).toLocaleString()} USD`;
};

const ProgressionDetailLuc: React.FC = () => {
  const { fetcher } = useFetch();
  const [indemnStats, setIndemnStats] = useState<IndemnisationDashboardStats>(() => emptyIndemnisationStats());
  const [loadingIndemnisation, setLoadingIndemnisation] = useState<boolean>(true);
  const lucStats = useMemo(() => getMockProgressionLucStats(), []);

  useEffect(() => {
    let mounted = true;

    const loadIndemnisationStats = async () => {
      setLoadingIndemnisation(true);
      try {
        const contratsResp = await fetcher('/contrat/LUC');

        if (!mounted) return;
        setIndemnStats(buildIndemnisationDashboardStats({
          contrats: normalizeApiList(contratsResp),
          plans: [],
          indemnisations: [],
        }));
      } catch {
        if (mounted) setIndemnStats(emptyIndemnisationStats());
      } finally {
        if (mounted) setLoadingIndemnisation(false);
      }
    };

    loadIndemnisationStats();
    return () => {
      mounted = false;
    };
  }, [fetcher]);

  return (
    <div className="space-y-8">
      {/* Section titre */}
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-indigo-50">
          <FiDollarSign className="text-indigo-600" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Progression détaillée — LUC</h2>
          <p className="text-sm text-gray-500">
            Réadaptation médicale, psychologique, accompagnement économique et indemnisation.
          </p>
        </div>
      </div>

      {/* Indemnisation par palier 0-25-50-75-100% */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50">
              <FiCreditCard className="text-emerald-600" size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Déjà versé</p>
              <p className="text-xl font-bold text-gray-900">
                {loadingIndemnisation ? '...' : formatUsd(indemnStats.totalVerseUSD)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50">
              <FiDollarSign className="text-blue-600" size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Planifié</p>
              <p className="text-xl font-bold text-gray-900">
                {loadingIndemnisation ? '...' : formatUsd(indemnStats.totalPlanifieUSD)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50">
              <FiFileText className="text-amber-600" size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Contrats</p>
              <p className="text-xl font-bold text-gray-900">
                {loadingIndemnisation ? '...' : indemnStats.totalContrats.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-50">
              <FiActivity className="text-violet-600" size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Paiements démarrés</p>
              <p className="text-xl font-bold text-gray-900">
                {loadingIndemnisation ? '...' : indemnStats.contratsAvecPaiement.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <IndemnisationGauge
        data={indemnStats.gaugeData}
        title="Progression des indemnisations (par palier)"
      />

      {/* Médicale / Psy / Éco side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ProgressionBreakdownCard
          title="Réadaptation médicale"
          icon={<FiHeart className="text-white" size={16} />}
          iconBg="bg-gradient-to-br from-rose-500 to-red-600"
          items={lucStats.medicale}
        />
        <ProgressionBreakdownCard
          title="Réadaptation psychologique"
          icon={<FiActivity className="text-white" size={16} />}
          iconBg="bg-gradient-to-br from-violet-500 to-purple-600"
          items={lucStats.psychologique}
        />
        <ProgressionBreakdownCard
          title="Accompagnement économique"
          icon={<FiBriefcase className="text-white" size={16} />}
          iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
          items={lucStats.economique}
        />
      </div>

      {/* Barème d'indemnisation */}
      {/* <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-amber-50">
            <FiDollarSign className="text-amber-600" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Barème d'indemnisation</h3>
            <p className="text-xs text-gray-500">Montants indicatifs par type de préjudice</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Préjudice</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Min (USD)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Max (USD)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Fourchette</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bareme.map((b, i) => {
                const range = b.montantMax - b.montantMin;
                const maxRange = Math.max(...bareme.map(x => x.montantMax - x.montantMin));
                const pct = maxRange > 0 ? (range / maxRange) * 100 : 0;
                return (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{b.prejudice}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{b.montantMin.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{b.montantMax.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden max-w-[200px]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div> */}
    </div>
  );
};

export default ProgressionDetailLuc;
