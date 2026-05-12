"use client";

import React, { useMemo } from 'react';
import {
  FiActivity,
  FiBriefcase,
  FiDollarSign,
  FiHeart,
} from 'react-icons/fi';
import { IndemnisationGauge, ProgressionBreakdownCard } from './shared';
import {
  getMockIndemnisationByPourcentage,
  getMockProgressionLucStats,
  getMockBareme,
} from '../mocks/data';
import { COLORS } from './dashboard/constants';

const ProgressionDetailLuc: React.FC = () => {
  const indemnData = useMemo(() => getMockIndemnisationByPourcentage(), []);
  const lucStats = useMemo(() => getMockProgressionLucStats(), []);
  const bareme = useMemo(() => getMockBareme(), []);

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
      <IndemnisationGauge
        data={indemnData}
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
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-10">
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
      </div>
    </div>
  );
};

export default ProgressionDetailLuc;
