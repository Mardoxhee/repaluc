"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiCamera,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiHeart,
  FiScissors,
  FiHome,
  FiEye,
  FiUsers,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import StatCard from './dashboard/StatCard';
import { ProgressionBreakdownCard } from './shared';
import { ProgressionTimeline } from './shared';
import { getMockPecmuKpis, getMockPecmuTimeline } from '../mocks/data';
import { COLORS } from './dashboard/constants';
import { useFetch } from '../../context/FetchContext';
import { getVictimsFromCache } from '../../utils/victimsCache';
import { normalizeApiList, normalizeGlobalProgress, normalizeText, type GlobalProgressStats } from '../utils/mentionStats';

interface DashboardVictimesPecmuProps {
  onSelectAgentReparation?: (fullName: string) => void;
  onShowRecontactedVictims?: () => void;
}

const EMPTY_PROGRESS: GlobalProgressStats = {
  total: 0,
  photo: { withPhoto: 0, withoutPhoto: 0 },
  piece: { withPiece: 0, withoutPiece: 0 },
  contrat: { withContrat: 0, withoutContrat: 0 },
  indemnisation: { commencee: 0, nonCommencee: 0, montantTotalIndemnise: 0 },
};

const isPecmuVictim = (victim: any): boolean => {
  const mentionValue = normalizeText(victim?.mention);
  const statusValue = normalizeText(victim?.status);
  const categorieValue = normalizeText(victim?.categorie);
  const programmeValue = normalizeText(victim?.programme);
  return (
    mentionValue === 'pecmu' ||
    statusValue.includes('pecmu') ||
    statusValue.includes('prise en charge medicale urgente') ||
    categorieValue.includes('pecmu') ||
    programmeValue.includes('pecmu')
  );
};

const DashboardVictimesPecmu: React.FC<DashboardVictimesPecmuProps> = () => {
  const { fetcher } = useFetch();
  const kpis = useMemo(() => getMockPecmuKpis(), []);
  const timeline = useMemo(() => getMockPecmuTimeline(), []);
  const [progress, setProgress] = useState<GlobalProgressStats>(EMPTY_PROGRESS);
  const [contractsCount, setContractsCount] = useState(0);
  const [victimsFromCache, setVictimsFromCache] = useState<any[]>([]);
  const [loadingOfficial, setLoadingOfficial] = useState(true);
  const [loadingCache, setLoadingCache] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadOfficialStats = async () => {
      setLoadingOfficial(true);
      try {
        const [progressResp, contratsResp] = await Promise.all([
          fetcher('/victime/stats/reparation/globalProgress/PECMU'),
          fetcher('/contrat/PECMU'),
        ]);
        if (!mounted) return;
        setProgress(normalizeGlobalProgress(progressResp));
        setContractsCount(normalizeApiList(contratsResp).length);
      } catch {
        if (!mounted) return;
        setProgress(EMPTY_PROGRESS);
        setContractsCount(0);
      } finally {
        if (mounted) setLoadingOfficial(false);
      }
    };

    loadOfficialStats();
    return () => {
      mounted = false;
    };
  }, [fetcher]);

  useEffect(() => {
    let mounted = true;

    const loadCache = async () => {
      setLoadingCache(true);
      try {
        const cached = await getVictimsFromCache('all-victims-cache');
        if (mounted) setVictimsFromCache(Array.isArray(cached?.data) ? cached!.data.filter(isPecmuVictim) : []);
      } catch {
        if (mounted) setVictimsFromCache([]);
      } finally {
        if (mounted) setLoadingCache(false);
      }
    };

    loadCache();
    return () => {
      mounted = false;
    };
  }, []);

  const totalPecmu = progress.total > 0 ? progress.total : victimsFromCache.length;

  const etatData = useMemo(() =>
    kpis.parEtatVictimisation.map((e, i) => ({
      name: e.etat,
      value: e.count,
      color: COLORS[i % COLORS.length],
    })),
    [kpis]
  );

  const partenaireData = useMemo(() =>
    kpis.partenaires.map((p) => ({
      name: p.nom,
      victimes: p.victimesPrises,
      domaine: p.domaine,
    })),
    [kpis]
  );

  const provinceCount = useMemo(() => {
    const provinces = new Set<string>();
    victimsFromCache.forEach((v) => {
      const province = typeof v?.province === 'string' ? v.province.trim() : '';
      if (province) provinces.add(province);
    });
    return provinces.size;
  }, [victimsFromCache]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-red-50">
          <FiHeart className="text-red-600" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tableau de bord — Prise en charge médicale urgente (PECMU)
          </h1>
          <p className="text-sm text-gray-600">
            Suivi des victimes en urgence médicale : chirurgie, soins, suivi et accompagnement psychologique.
          </p>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Total victimes PECMU"
          value={loadingOfficial && !victimsFromCache.length ? '...' : totalPecmu.toLocaleString()}
          icon={<FiUsers className="text-white text-xl" />}
          color="bg-gradient-to-br from-red-500 to-red-600"
          subtitle="Source officielle PECMU"
          loading={loadingOfficial && !victimsFromCache.length}
        />
        <StatCard
          title="Avec photo"
          value={loadingOfficial ? '...' : progress.photo.withPhoto.toLocaleString()}
          icon={<FiCamera className="text-white text-xl" />}
          color="bg-gradient-to-br from-sky-500 to-blue-600"
          subtitle={`${totalPecmu > 0 ? Math.round((progress.photo.withPhoto / totalPecmu) * 100) : 0}% des PECMU`}
          loading={loadingOfficial}
        />
        <StatCard
          title="Avec pièce"
          value={loadingOfficial ? '...' : progress.piece.withPiece.toLocaleString()}
          icon={<FiFileText className="text-white text-xl" />}
          color="bg-gradient-to-br from-violet-500 to-purple-600"
          subtitle={`${totalPecmu > 0 ? Math.round((progress.piece.withPiece / totalPecmu) * 100) : 0}% documentées`}
          loading={loadingOfficial}
        />
        <StatCard
          title="Contrats PECMU"
          value={loadingOfficial ? '...' : (progress.contrat.withContrat || contractsCount).toLocaleString()}
          icon={<FiCreditCard className="text-white text-xl" />}
          color="bg-gradient-to-br from-emerald-500 to-teal-600"
          subtitle={`${totalPecmu > 0 ? Math.round(((progress.contrat.withContrat || contractsCount) / totalPecmu) * 100) : 0}% des PECMU`}
          loading={loadingOfficial}
        />
        <StatCard
          title="Déjà indemnisé"
          value={loadingOfficial ? '...' : `${progress.indemnisation.montantTotalIndemnise.toLocaleString()} USD`}
          icon={<FiDollarSign className="text-white text-xl" />}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
          subtitle={`${progress.indemnisation.commencee.toLocaleString()} paiement(s) démarré(s)`}
          loading={loadingOfficial}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-red-100 bg-red-50/70 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-red-700">PECMU séparé</div>
          <div className="mt-1 text-sm text-red-900">Les chiffres ci-dessus viennent des endpoints filtrés par mention.</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Provinces cache</div>
          <div className="mt-1 text-2xl font-black text-slate-950">{loadingCache ? '...' : provinceCount.toLocaleString()}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Victimes cache</div>
          <div className="mt-1 text-2xl font-black text-slate-950">{loadingCache ? '...' : victimsFromCache.length.toLocaleString()}</div>
        </div>
      </div>

      {/* Aspects médicaux breakdown + Psychologique */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ProgressionBreakdownCard
          title="Aspects médicaux"
          icon={<FiHeart className="text-white" size={18} />}
          iconBg="bg-gradient-to-br from-red-500 to-rose-600"
          items={[
            { label: 'Chirurgie terminée', count: kpis.chirurgies.terminees, color: '#10b981' },
            { label: 'Chirurgie en cours', count: kpis.chirurgies.enCours, color: '#f59e0b' },
            { label: 'Soins terminés', count: kpis.soinsDomicile.terminees, color: '#06b6d4' },
            { label: 'Soins en cours', count: kpis.soinsDomicile.enCours, color: '#8b5cf6' },
            { label: 'Suivi terminé', count: kpis.suivis.terminees, color: '#3b82f6' },
            { label: 'Suivi en cours', count: kpis.suivis.enCours, color: '#ec4899' },
          ]}
        />

        <ProgressionBreakdownCard
          title="Aspects psychologiques"
          icon={<FiActivity className="text-white" size={18} />}
          iconBg="bg-gradient-to-br from-violet-500 to-purple-600"
          items={[
            { label: 'En cours', count: kpis.psychologique.enCours, color: '#f59e0b' },
            { label: 'Terminés', count: kpis.psychologique.terminees, color: '#10b981' },
          ]}
        />
      </div>

      {/* État de victimisation (pie) + Partenaires (bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pie — état de victimisation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-amber-50">
              <FiAlertCircle className="text-amber-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">État de victimisation</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={etatData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {etatData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar — partenaires */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-50">
              <FiUsers className="text-blue-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Partenaires de prise en charge</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={partenaireData} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" height={80} fontSize={11} interval={0} />
              <YAxis />
              <Tooltip
                content={({ active, payload }: any) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-sm">
                      <div className="font-semibold text-gray-900">{d.name}</div>
                      <div className="text-gray-600">{d.domaine}</div>
                      <div className="font-bold text-gray-900 mt-1">{d.victimes} victimes</div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="victimes" radius={[4, 4, 0, 0]} fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tableau partenaires */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-emerald-50">
            <FiCheckCircle className="text-emerald-600" size={20} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Détail des partenaires médicaux</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Partenaire</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Domaine</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Victimes prises en charge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {kpis.partenaires.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.nom}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.domaine}</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{p.victimesPrises}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timeline médicale type */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-indigo-50">
            <FiActivity className="text-indigo-600" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Circuit type PECMU</h3>
            <p className="text-xs text-gray-500">Parcours de prise en charge médicale urgente d'une victime</p>
          </div>
        </div>
        <ProgressionTimeline steps={timeline} orientation="horizontal" />
      </div>

      {/* Résumé */}
      <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <FiHeart className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Résumé PECMU</h3>
            <p className="text-red-100">Prise en charge médicale urgente</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{kpis.totalVictimes}</div>
            <div className="text-red-100 text-sm">Victimes total</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{kpis.chirurgies.terminees + kpis.soinsDomicile.terminees + kpis.suivis.terminees}</div>
            <div className="text-red-100 text-sm">Prises en charge terminées</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{kpis.partenaires.length}</div>
            <div className="text-red-100 text-sm">Partenaires actifs</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{kpis.psychologique.terminees}</div>
            <div className="text-red-100 text-sm">Suivis psy terminés</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardVictimesPecmu;
