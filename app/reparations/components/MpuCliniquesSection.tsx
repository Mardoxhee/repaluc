"use client";

import React, { useMemo } from 'react';
import { FiCheck, FiX, FiTruck, FiUsers } from 'react-icons/fi';
import StatCard from './dashboard/StatCard';
import { getMockCliniquesParCamp, getMockMusoAvecStats } from '../mocks/data';

const MpuCliniquesSection: React.FC = () => {
  const cliniques = useMemo(() => getMockCliniquesParCamp(), []);
  const muso = useMemo(() => getMockMusoAvecStats(), []);

  const totalVictimesCamps = cliniques.reduce((s, c) => s + c.total, 0);

  return (
    <div className="space-y-8">
      {/* ─── Section Cliniques Mobiles ─── */}
      <div>
        <div className="flex items-start gap-3 mb-5">
          <div className="p-2.5 rounded-lg bg-cyan-50">
            <FiTruck className="text-cyan-600" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Cliniques mobiles par camp</h2>
            <p className="text-sm text-gray-500">
              Suivi des 4 passages de clinique mobile par site de déplacés.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Camp / Site</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Clinique 1</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Clinique 2</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Clinique 3</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Clinique 4</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Victimes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cliniques.map((camp, i) => {
                  const completed = [camp.clinique1, camp.clinique2, camp.clinique3, camp.clinique4].filter(Boolean).length;
                  return (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{camp.camp}</div>
                        <div className="text-xs text-gray-500">{completed}/4 cliniques effectuées</div>
                      </td>
                      {[camp.clinique1, camp.clinique2, camp.clinique3, camp.clinique4].map((done, j) => (
                        <td key={j} className="px-4 py-3 text-center">
                          {done ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100">
                              <FiCheck className="text-emerald-600" size={14} />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100">
                              <FiX className="text-gray-400" size={14} />
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <span className="bg-cyan-100 text-cyan-800 px-2.5 py-1 rounded-full text-sm font-semibold">
                          {camp.total}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900" colSpan={5}>Total</td>
                  <td className="px-4 py-3 text-right">
                    <span className="bg-cyan-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {totalVictimesCamps}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* ─── Section MUSO / AVEC ─── */}
      <div>
        <div className="flex items-start gap-3 mb-5">
          <div className="p-2.5 rounded-lg bg-violet-50">
            <FiUsers className="text-violet-600" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">MUSO / AVEC</h2>
            <p className="text-sm text-gray-500">
              Mutuelles de solidarité et associations villageoises d'épargne et de crédit.
            </p>
          </div>
        </div>

        {/* KPIs MUSO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Mutuelles actives"
            value={muso.totalMutuelles}
            icon={<FiUsers className="text-white text-xl" />}
            color="bg-gradient-to-br from-violet-500 to-violet-600"
          />
          <StatCard
            title="Membres inscrits"
            value={muso.membresInscrits}
            icon={<FiUsers className="text-white text-xl" />}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            title="Paiements effectués"
            value={muso.paiementsEffectues}
            icon={<FiCheck className="text-white text-xl" />}
            color="bg-gradient-to-br from-emerald-500 to-emerald-600"
            subtitle={`${muso.membresInscrits > 0 ? Math.round((muso.paiementsEffectues / muso.membresInscrits) * 100) : 0}% des membres`}
          />
          <StatCard
            title="Montant total"
            value={`${muso.montantTotalUSD.toLocaleString()} USD`}
            icon={<FiTruck className="text-white text-xl" />}
            color="bg-gradient-to-br from-amber-500 to-amber-600"
          />
        </div>

        {/* Tableau mutuelles */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Mutuelle</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Membres</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Paiements</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Montant (USD)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Taux</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {muso.mutuelles.map((m, i) => {
                  const taux = m.membres > 0 ? Math.round((m.paiements / m.membres) * 100) : 0;
                  return (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.nom}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">{m.membres}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">{m.paiements}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{m.montant.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-violet-600 transition-all duration-500"
                              style={{ width: `${taux}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700">{taux}%</span>
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
    </div>
  );
};

export default MpuCliniquesSection;
