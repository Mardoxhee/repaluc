"use client";

import React, { useMemo } from 'react';
import {
  FiAward,
  FiCheckCircle,
  FiMapPin,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts';
import StatCard from './dashboard/StatCard';
import CustomTooltip from './dashboard/CustomTooltip';
import { COLORS } from './dashboard/constants';
import { getMockVictimesReparees } from '../mocks/data';

interface DashboardVictimesRepareesProp {
  onSelectAgentReparation?: (fullName: string) => void;
  onShowRecontactedVictims?: () => void;
}

const DashboardVictimesReparees: React.FC<DashboardVictimesRepareesProp> = () => {
  const data = useMemo(() => getMockVictimesReparees(), []);

  const programmeData = useMemo(() =>
    data.parProgramme.map((p, i) => ({ name: p.programme, value: p.count, color: COLORS[i % COLORS.length] })),
    [data]
  );

  const provinceData = useMemo(() =>
    data.parProvince.map((p, i) => ({ name: p.province, value: p.count, color: COLORS[i % COLORS.length] })),
    [data]
  );

  const tendanceData = useMemo(() =>
    data.parMois.map((m) => ({ name: m.mois, victimes: m.count })),
    [data]
  );

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-emerald-50">
          <FiAward className="text-emerald-600" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Victimes totalement réparées
          </h1>
          <p className="text-sm text-gray-600">
            Toutes les victimes ayant complété l'intégralité de leur parcours de réparation.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total réparées"
          value={data.total}
          icon={<FiCheckCircle className="text-white text-xl" />}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          subtitle="Circuit complet terminé"
        />
        {data.parProgramme.map((p, i) => (
          <StatCard
            key={p.programme}
            title={`Via ${p.programme}`}
            value={p.count}
            icon={<FiUsers className="text-white text-xl" />}
            color={`bg-gradient-to-br ${i === 0 ? 'from-blue-500 to-blue-600' : i === 1 ? 'from-orange-500 to-orange-600' : 'from-red-500 to-red-600'}`}
            subtitle={`${data.total > 0 ? ((p.count / data.total) * 100).toFixed(1) : 0}% du total`}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Répartition par programme */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-emerald-50">
              <FiAward className="text-emerald-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Par programme</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={programmeData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {programmeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition par province */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-50">
              <FiMapPin className="text-purple-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Par province</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={provinceData} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" height={80} fontSize={11} interval={0} />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {provinceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tendance mensuelle */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-50">
            <FiTrendingUp className="text-blue-600" size={20} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Tendance mensuelle des réparations complètes</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={tendanceData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <defs>
              <linearGradient id="gradientReparees" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis />
            <Tooltip
              content={({ active, payload }: any) => {
                if (!active || !payload?.[0]) return null;
                return (
                  <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-sm">
                    <div className="font-semibold text-gray-900">{payload[0].payload.name}</div>
                    <div className="font-bold text-emerald-600">{payload[0].value} victimes réparées</div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="victimes"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#gradientReparees)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tableau province */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-indigo-50">
            <FiMapPin className="text-indigo-600" size={20} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Détail par province</h3>
        </div>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {data.parProvince.map((p, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="font-medium text-gray-800">{p.province}</span>
              </div>
              <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-semibold">
                {p.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Résumé */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <FiAward className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Résumé — Victimes réparées</h3>
            <p className="text-emerald-100">Circuit de réparation intégralement complété</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{data.total}</div>
            <div className="text-emerald-100 text-sm">Victimes totalement réparées</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{data.parProvince.length}</div>
            <div className="text-emerald-100 text-sm">Provinces couvertes</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{data.parProgramme.length}</div>
            <div className="text-emerald-100 text-sm">Programmes contributeurs</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardVictimesReparees;
