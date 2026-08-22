"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiMapPin,
  FiRefreshCw,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import { useFetch } from '../../context/FetchContext';

interface TableauBordLucTerritoire {
  territoire: string;
  cibleTotale: number;
  victimesRecontactees: number;
  pourcentageRecontactees: number;
  contratsSignes: number;
  pourcentageContratsSignes: number;
  victimesAyantCommenceIndemnisation: number;
  pourcentageVictimesAyantCommenceIndemnisation: number;
  resteVictimesACommencerIndemnisation: number;
  montantTotalPlanifieUSD: number;
  montantTotalPayeUSD: number;
  resteAPayer: number;
}

type TableauBordLucTotal = Omit<TableauBordLucTerritoire, 'territoire'>;

interface TableauBordLucResponse {
  success: boolean;
  mention: 'LUC';
  totalTerritoires: number;
  territoires: TableauBordLucTerritoire[];
  totalGeneral: TableauBordLucTotal;
}

const EMPTY_TOTAL: TableauBordLucTotal = {
  cibleTotale: 0,
  victimesRecontactees: 0,
  pourcentageRecontactees: 0,
  contratsSignes: 0,
  pourcentageContratsSignes: 0,
  victimesAyantCommenceIndemnisation: 0,
  pourcentageVictimesAyantCommenceIndemnisation: 0,
  resteVictimesACommencerIndemnisation: 0,
  montantTotalPlanifieUSD: 0,
  montantTotalPayeUSD: 0,
  resteAPayer: 0,
};

const COLORS = {
  cible: '#1f4e78',
  recontact: '#5b9bd5',
  contrat: '#2f855a',
  indemnisation: '#ed7d31',
  reste: '#b91c1c',
  planifie: '#475569',
  paye: '#0f766e',
};

const formatNombre = new Intl.NumberFormat('fr-FR');
const formatUSD = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const toNumber = (value: unknown): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeTerritory = (row: any): TableauBordLucTerritoire => ({
  territoire: String(row?.territoire || 'INCONNU'),
  cibleTotale: toNumber(row?.cibleTotale),
  victimesRecontactees: toNumber(row?.victimesRecontactees),
  pourcentageRecontactees: toNumber(row?.pourcentageRecontactees),
  contratsSignes: toNumber(row?.contratsSignes),
  pourcentageContratsSignes: toNumber(row?.pourcentageContratsSignes),
  victimesAyantCommenceIndemnisation: toNumber(row?.victimesAyantCommenceIndemnisation),
  pourcentageVictimesAyantCommenceIndemnisation: toNumber(row?.pourcentageVictimesAyantCommenceIndemnisation),
  resteVictimesACommencerIndemnisation: toNumber(row?.resteVictimesACommencerIndemnisation),
  montantTotalPlanifieUSD: toNumber(row?.montantTotalPlanifieUSD),
  montantTotalPayeUSD: toNumber(row?.montantTotalPayeUSD),
  resteAPayer: toNumber(row?.resteAPayer),
});

const normalizeResponse = (payload: any): TableauBordLucResponse => {
  const data = payload?.data ?? payload ?? {};
  const territoires = Array.isArray(data?.territoires)
    ? data.territoires.map(normalizeTerritory)
    : [];
  const totalGeneral = data?.totalGeneral
    ? normalizeTerritory({ territoire: 'TOTAL', ...data.totalGeneral })
    : { territoire: 'TOTAL', ...EMPTY_TOTAL };

  return {
    success: Boolean(data?.success ?? true),
    mention: 'LUC',
    totalTerritoires: toNumber(data?.totalTerritoires ?? territoires.length),
    territoires,
    totalGeneral: {
      cibleTotale: totalGeneral.cibleTotale,
      victimesRecontactees: totalGeneral.victimesRecontactees,
      pourcentageRecontactees: totalGeneral.pourcentageRecontactees,
      contratsSignes: totalGeneral.contratsSignes,
      pourcentageContratsSignes: totalGeneral.pourcentageContratsSignes,
      victimesAyantCommenceIndemnisation: totalGeneral.victimesAyantCommenceIndemnisation,
      pourcentageVictimesAyantCommenceIndemnisation: totalGeneral.pourcentageVictimesAyantCommenceIndemnisation,
      resteVictimesACommencerIndemnisation: totalGeneral.resteVictimesACommencerIndemnisation,
      montantTotalPlanifieUSD: totalGeneral.montantTotalPlanifieUSD,
      montantTotalPayeUSD: totalGeneral.montantTotalPayeUSD,
      resteAPayer: totalGeneral.resteAPayer,
    },
  };
};

const formatPercent = (value: number) => `${value.toFixed(2)} %`;

const KpiCard = ({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
}) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>
      <div className={`p-2.5 rounded-lg ${accent}`}>
        {icon}
      </div>
    </div>
  </div>
);

const LucTerritoryIndemnisationStats: React.FC = () => {
  const { fetcher } = useFetch();
  const [data, setData] = useState<TableauBordLucResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetcher('/victime/stats/tableau-bord/LUC/par-territoire');
      setData(normalizeResponse(response));
    } catch (err: any) {
      setData(null);
      setError(err?.message || 'Chargement impossible pour les statistiques par territoire.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [fetcher]);

  const territoires = data?.territoires || [];
  const total = data?.totalGeneral || EMPTY_TOTAL;

  const progressChartData = useMemo(() => (
    territoires.map((item) => ({
      territoire: item.territoire,
      cible: item.cibleTotale,
      recontactees: item.victimesRecontactees,
      contrats: item.contratsSignes,
      indemnisation: item.victimesAyantCommenceIndemnisation,
    }))
  ), [territoires]);

  const financeChartData = useMemo(() => (
    territoires.map((item) => ({
      territoire: item.territoire,
      planifie: item.montantTotalPlanifieUSD,
      paye: item.montantTotalPayeUSD,
      reste: item.resteAPayer,
    }))
  ), [territoires]);

  const reportingSteps = [
    {
      label: 'Recontact',
      value: total.victimesRecontactees,
      pct: total.pourcentageRecontactees,
      color: COLORS.recontact,
    },
    {
      label: 'Contrat signé',
      value: total.contratsSignes,
      pct: total.pourcentageContratsSignes,
      color: COLORS.contrat,
    },
    {
      label: 'Indemnisation démarrée',
      value: total.victimesAyantCommenceIndemnisation,
      pct: total.pourcentageVictimesAyantCommenceIndemnisation,
      color: COLORS.indemnisation,
    },
  ];

  return (
    <section className="mb-8">
      <div className="mb-5 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50">
            <FiMapPin className="text-emerald-700" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Suivi LUC par territoire</h2>
            <p className="text-sm text-gray-500 max-w-3xl">
              Lecture douce du circuit: recontact, contrat, démarrage des indemnisations et reste à payer.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadStats}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} size={16} />
          Actualiser
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-28 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-100 shadow-sm p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <FiAlertCircle className="text-red-600" size={18} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Statistiques LUC indisponibles</p>
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadStats}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            <FiRefreshCw size={16} />
            Réessayer
          </button>
        </div>
      ) : territoires.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
          <p className="font-semibold text-gray-900">Aucune donnée territoriale LUC</p>
          <p className="text-sm text-gray-500 mt-1">Les graphiques apparaîtront dès que le backend retournera des territoires.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              title="Cible totale"
              value={formatNombre.format(total.cibleTotale)}
              subtitle={`${data?.totalTerritoires || territoires.length} territoire(s) suivis`}
              icon={<FiUsers className="text-blue-700" size={18} />}
              accent="bg-blue-50"
            />
            <KpiCard
              title="Contrats signés"
              value={formatNombre.format(total.contratsSignes)}
              subtitle={formatPercent(total.pourcentageContratsSignes)}
              icon={<FiFileText className="text-emerald-700" size={18} />}
              accent="bg-emerald-50"
            />
            <KpiCard
              title="Indemnisation commencée"
              value={formatNombre.format(total.victimesAyantCommenceIndemnisation)}
              subtitle={`${formatNombre.format(total.resteVictimesACommencerIndemnisation)} à démarrer`}
              icon={<FiTrendingUp className="text-orange-700" size={18} />}
              accent="bg-orange-50"
            />
            <KpiCard
              title="Reste à payer"
              value={formatUSD.format(total.resteAPayer)}
              subtitle={`${formatUSD.format(total.montantTotalPayeUSD)} déjà payé`}
              icon={<FiCreditCard className="text-rose-700" size={18} />}
              accent="bg-rose-50"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Circuit de reporting LUC</h3>
                <p className="text-sm text-gray-500">Synthèse du parcours mentionné dans le document de reporting.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:min-w-[640px]">
                {reportingSteps.map((step) => (
                  <div key={step.label} className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{step.label}</span>
                      <span className="text-sm font-bold text-gray-900">{formatPercent(step.pct)}</span>
                    </div>
                    <div className="h-2 bg-white rounded-full overflow-hidden border border-gray-100">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, step.pct))}%`, backgroundColor: step.color }}
                      />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mt-2">{formatNombre.format(step.value)} victime(s)</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg bg-blue-50">
                  <FiCheckCircle className="text-blue-700" size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Progression par territoire</h3>
                  <p className="text-sm text-gray-500">Volumes de victimes à chaque étape du circuit.</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={progressChartData} margin={{ top: 10, right: 20, left: 0, bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                  <XAxis dataKey="territoire" angle={-40} textAnchor="end" height={90} fontSize={11} interval={0} />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value: any) => formatNombre.format(Number(value) || 0)} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="cible" name="Cible totale" fill={COLORS.cible} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="recontactees" name="Recontactées" fill={COLORS.recontact} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="contrats" name="Contrats signés" fill={COLORS.contrat} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="indemnisation" name="Indemnisation commencée" fill={COLORS.indemnisation} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <FiDollarSign className="text-emerald-700" size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Flux financiers par territoire</h3>
                  <p className="text-sm text-gray-500">Montants planifiés, payés et restant à payer.</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={financeChartData} margin={{ top: 10, right: 20, left: 8, bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                  <XAxis dataKey="territoire" angle={-40} textAnchor="end" height={90} fontSize={11} interval={0} />
                  <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                  <Tooltip formatter={(value: any) => formatUSD.format(Number(value) || 0)} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="planifie" name="Planifié" fill={COLORS.planifie} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="paye" name="Payé" fill={COLORS.paye} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="reste" name="Reste à payer" fill={COLORS.reste} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Tableau territorial</h3>
                <p className="text-sm text-gray-500">Détail opérationnel pour lecture et comparaison rapide.</p>
              </div>
            </div>
            <div className="overflow-hidden">
              <table className="w-full table-fixed text-[11px] md:text-xs">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    {[
                      'Territoire',
                      'Cible',
                      'Recontactées',
                      '%',
                      'Contrats',
                      '%',
                      'Indemnisation commencée',
                      '%',
                      'À démarrer',
                      'Planifié',
                      'Payé',
                      'Reste à payer',
                    ].map((label) => (
                      <th key={label} className="px-2 py-3 text-left text-[10px] font-semibold uppercase tracking-wide break-words">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {territoires.map((row) => (
                    <tr key={row.territoire} className="hover:bg-gray-50">
                      <td className="px-2 py-3 font-semibold text-gray-900 break-words">{row.territoire}</td>
                      <td className="px-2 py-3 break-words">{formatNombre.format(row.cibleTotale)}</td>
                      <td className="px-2 py-3 break-words">{formatNombre.format(row.victimesRecontactees)}</td>
                      <td className="px-2 py-3 text-blue-700 font-medium break-words">{formatPercent(row.pourcentageRecontactees)}</td>
                      <td className="px-2 py-3 break-words">{formatNombre.format(row.contratsSignes)}</td>
                      <td className="px-2 py-3 text-emerald-700 font-medium break-words">{formatPercent(row.pourcentageContratsSignes)}</td>
                      <td className="px-2 py-3 break-words">{formatNombre.format(row.victimesAyantCommenceIndemnisation)}</td>
                      <td className="px-2 py-3 text-orange-700 font-medium break-words">{formatPercent(row.pourcentageVictimesAyantCommenceIndemnisation)}</td>
                      <td className="px-2 py-3 break-words">{formatNombre.format(row.resteVictimesACommencerIndemnisation)}</td>
                      <td className="px-2 py-3 break-words">{formatUSD.format(row.montantTotalPlanifieUSD)}</td>
                      <td className="px-2 py-3 break-words">{formatUSD.format(row.montantTotalPayeUSD)}</td>
                      <td className="px-2 py-3 font-semibold text-rose-700 break-words">{formatUSD.format(row.resteAPayer)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-900 text-white">
                    <td className="px-2 py-3 font-bold break-words">TOTAL GÉNÉRAL</td>
                    <td className="px-2 py-3 break-words">{formatNombre.format(total.cibleTotale)}</td>
                    <td className="px-2 py-3 break-words">{formatNombre.format(total.victimesRecontactees)}</td>
                    <td className="px-2 py-3 break-words">{formatPercent(total.pourcentageRecontactees)}</td>
                    <td className="px-2 py-3 break-words">{formatNombre.format(total.contratsSignes)}</td>
                    <td className="px-2 py-3 break-words">{formatPercent(total.pourcentageContratsSignes)}</td>
                    <td className="px-2 py-3 break-words">{formatNombre.format(total.victimesAyantCommenceIndemnisation)}</td>
                    <td className="px-2 py-3 break-words">{formatPercent(total.pourcentageVictimesAyantCommenceIndemnisation)}</td>
                    <td className="px-2 py-3 break-words">{formatNombre.format(total.resteVictimesACommencerIndemnisation)}</td>
                    <td className="px-2 py-3 break-words">{formatUSD.format(total.montantTotalPlanifieUSD)}</td>
                    <td className="px-2 py-3 break-words">{formatUSD.format(total.montantTotalPayeUSD)}</td>
                    <td className="px-2 py-3 font-bold break-words">{formatUSD.format(total.resteAPayer)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default LucTerritoryIndemnisationStats;
