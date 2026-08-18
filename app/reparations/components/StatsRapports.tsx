"use client";

import React, { useMemo } from 'react';
import {
  FiBarChart2,
  FiGlobe,
  FiTrendingUp,
  FiUsers,
  FiMap,
  FiLayers,
  FiAward,
} from 'react-icons/fi';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell,
} from 'recharts';
import StatCard from './dashboard/StatCard';
import { COLORS } from './dashboard/constants';
import {
  getMockDashboardKpis,
  getMockRapportStats,
  getMockProgressionParZone,
} from '../mocks/data';

const StatsRapports: React.FC = () => {
  const kpis = useMemo(() => getMockDashboardKpis(), []);
  const rapport = useMemo(() => getMockRapportStats(), []);
  const zones = useMemo(() => getMockProgressionParZone(), []);

  const totalVictimes = kpis.totalVictimesLuc + kpis.totalVictimesMpu + kpis.totalVictimesPecmu;

  const zoneBarData = useMemo(() =>
    zones.map((z) => ({
      name: z.zone,
      LUC: z.luc,
      MPU: z.mpu,
      PECMU: z.pecmu,
      Réparées: z.reparees,
    })),
    [zones]
  );

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-indigo-50">
          <FiBarChart2 className="text-indigo-600" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistiques & Rapports</h1>
          <p className="text-sm text-gray-600">
            Vue consolidée des indicateurs de tous les programmes de réparation.
          </p>
        </div>
      </div>

      {/* KPIs consolidés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Victimes totales"
          value={totalVictimes.toLocaleString()}
          icon={<FiUsers className="text-white text-xl" />}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          subtitle="Tous programmes confondus"
        />
        <StatCard
          title="Contrats / Consentements"
          value={(kpis.contratsSignesLuc + kpis.consentsSignesMpu).toLocaleString()}
          icon={<FiLayers className="text-white text-xl" />}
          color="bg-gradient-to-br from-violet-500 to-violet-600"
          subtitle={`${kpis.contratsSignesLuc} LUC · ${kpis.consentsSignesMpu} MPU`}
        />
        <StatCard
          title="Totalement réparées"
          value={kpis.totalVictimesReparees}
          icon={<FiAward className="text-white text-xl" />}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          subtitle={`${totalVictimes > 0 ? ((kpis.totalVictimesReparees / totalVictimes) * 100).toFixed(1) : 0}% du total`}
        />
        <StatCard
          title="Couverture géographique"
          value={`${rapport.couvertureGeographique.provinces} provinces`}
          icon={<FiGlobe className="text-white text-xl" />}
          color="bg-gradient-to-br from-amber-500 to-amber-600"
          subtitle={`${rapport.couvertureGeographique.territoires} territoires · ${rapport.couvertureGeographique.villages} villages`}
        />
      </div>

      {/* KPIs par programme */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Programme LUC"
          value={kpis.totalVictimesLuc.toLocaleString()}
          icon={<FiUsers className="text-white text-xl" />}
          color="bg-gradient-to-br from-blue-400 to-blue-500"
          subtitle={`${kpis.contratsSignesLuc} contrats signés`}
        />
        <StatCard
          title="Programme MPU"
          value={kpis.totalVictimesMpu.toLocaleString()}
          icon={<FiUsers className="text-white text-xl" />}
          color="bg-gradient-to-br from-orange-400 to-orange-500"
          subtitle={`${kpis.consentsSignesMpu} consentements signés`}
        />
        <StatCard
          title="Programme PECMU"
          value={kpis.totalVictimesPecmu.toLocaleString()}
          icon={<FiUsers className="text-white text-xl" />}
          color="bg-gradient-to-br from-red-400 to-red-500"
          subtitle="Parcours PECMU"
        />
      </div>

      {/* Tendance mensuelle */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-50">
            <FiTrendingUp className="text-blue-600" size={20} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Tendance mensuelle</h3>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={rapport.tendanceMensuelle} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <defs>
              <linearGradient id="gradNouvelles" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradContrats" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradIndemnisees" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mois" fontSize={12} />
            <YAxis />
            <Tooltip
              content={({ active, payload, label }: any) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-sm">
                    <div className="font-semibold text-gray-900 mb-2">{label}</div>
                    {payload.map((p: any) => (
                      <div key={p.dataKey} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-gray-600">{p.name}:</span>
                        <span className="font-bold text-gray-900">{p.value}</span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend />
            <Area type="monotone" dataKey="nouvelles" name="Nouvelles victimes" stroke="#3b82f6" strokeWidth={2} fill="url(#gradNouvelles)" />
            <Area type="monotone" dataKey="contrats" name="Contrats signés" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradContrats)" />
            <Area type="monotone" dataKey="indemnisees" name="Indemnisées" stroke="#10b981" strokeWidth={2} fill="url(#gradIndemnisees)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Répartition par zone et programme (stacked bar) */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-purple-50">
            <FiMap className="text-purple-600" size={20} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Répartition par zone et programme</h3>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={zoneBarData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis />
            <Tooltip
              content={({ active, payload, label }: any) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-sm">
                    <div className="font-semibold text-gray-900 mb-2">{label}</div>
                    {payload.map((p: any) => (
                      <div key={p.dataKey} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-gray-600">{p.name}:</span>
                        <span className="font-bold text-gray-900">{p.value}</span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend />
            <Bar dataKey="LUC" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="MPU" stackId="a" fill="#f97316" />
            <Bar dataKey="PECMU" stackId="a" fill="#ef4444" />
            <Bar dataKey="Réparées" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tableau zones */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-indigo-50">
            <FiGlobe className="text-indigo-600" size={20} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Détail par zone géographique</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Zone</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">LUC</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">MPU</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">PECMU</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Réparées</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {zones.map((z, i) => {
                const total = z.luc + z.mpu + z.pecmu + z.reparees;
                return (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{z.zone}</td>
                    <td className="px-4 py-3 text-sm text-right text-blue-700 font-semibold">{z.luc.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right text-orange-700 font-semibold">{z.mpu.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right text-red-700 font-semibold">{z.pecmu.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right text-emerald-700 font-semibold">{z.reparees.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">{total.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-4 py-3 text-sm font-bold text-gray-900">Total</td>
                <td className="px-4 py-3 text-sm text-right font-bold text-blue-700">{zones.reduce((s, z) => s + z.luc, 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-right font-bold text-orange-700">{zones.reduce((s, z) => s + z.mpu, 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-right font-bold text-red-700">{zones.reduce((s, z) => s + z.pecmu, 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-right font-bold text-emerald-700">{zones.reduce((s, z) => s + z.reparees, 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">{zones.reduce((s, z) => s + z.luc + z.mpu + z.pecmu + z.reparees, 0).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Résumé */}
      <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <FiBarChart2 className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Résumé consolidé</h3>
            <p className="text-blue-100">Tous les programmes de réparation — Vue d'ensemble</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{totalVictimes.toLocaleString()}</div>
            <div className="text-blue-100 text-sm">Victimes enregistrées</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{(kpis.contratsSignesLuc + kpis.consentsSignesMpu).toLocaleString()}</div>
            <div className="text-blue-100 text-sm">Contrats / consentements</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{kpis.totalVictimesReparees}</div>
            <div className="text-blue-100 text-sm">Totalement réparées</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{rapport.couvertureGeographique.provinces}</div>
            <div className="text-blue-100 text-sm">Provinces couvertes</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsRapports;
