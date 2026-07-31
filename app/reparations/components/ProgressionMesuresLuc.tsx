"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiHeart,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import { useFetch } from '../../context/FetchContext';
import { isOnline } from '../../utils/victimsCache';

type MesureStatsKey =
  | 'indemnisation'
  | 'reinsertionEconomique'
  | 'priseEnChargeMedicale'
  | 'accompagnementPsychosocial';

type Mesure = { id: MesureStatsKey; nom: string; apiKey: MesureStatsKey };

type MesuresReparationStats = {
  totalContrats: number;
  mesuresReparationAcceptees: Record<MesureStatsKey, number>;
};

const EMPTY_MESURE_COUNTS: Record<MesureStatsKey, number> = {
  indemnisation: 0,
  reinsertionEconomique: 0,
  priseEnChargeMedicale: 0,
  accompagnementPsychosocial: 0,
};

const LUC_MESURES: Mesure[] = [
  { id: 'indemnisation', apiKey: 'indemnisation', nom: 'Indemnisation financière' },
  { id: 'reinsertionEconomique', apiKey: 'reinsertionEconomique', nom: 'Réinsertion économique' },
  { id: 'priseEnChargeMedicale', apiKey: 'priseEnChargeMedicale', nom: 'Prise en charge médicale' },
  { id: 'accompagnementPsychosocial', apiKey: 'accompagnementPsychosocial', nom: 'Accompagnement psychosocial' },
];

const normalizeMeasureName = (nom: string): string => {
  return nom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
};

type Visual = {
  icon: React.ReactNode;
  gradient: string;
  pill: string;
  subtitle?: string;
};

const DEFAULT_VISUAL: Visual = {
  icon: <FiCheckCircle size={20} className="text-white" />,
  gradient: 'from-slate-500 to-gray-600',
  pill: 'bg-slate-50 text-slate-700',
};

const MESURE_VISUALS: Record<string, Visual> = {
  'prise en charge medicale': {
    icon: <FiHeart size={20} className="text-white" />,
    gradient: 'from-rose-500 to-red-600',
    pill: 'bg-rose-50 text-rose-700',
  },
  'accompagnement psychologique': {
    icon: <FiActivity size={20} className="text-white" />,
    gradient: 'from-purple-500 to-fuchsia-600',
    pill: 'bg-purple-50 text-purple-700',
  },
  'accompagnement psychosocial': {
    icon: <FiActivity size={20} className="text-white" />,
    gradient: 'from-purple-500 to-fuchsia-600',
    pill: 'bg-purple-50 text-purple-700',
  },
  'indemnisation financiere': {
    icon: <FiDollarSign size={20} className="text-white" />,
    gradient: 'from-emerald-500 to-green-600',
    pill: 'bg-emerald-50 text-emerald-700',
  },
  'appui economique': {
    icon: <FiBriefcase size={20} className="text-white" />,
    gradient: 'from-amber-500 to-orange-600',
    pill: 'bg-amber-50 text-amber-700',
    subtitle: 'Prise en charge économique',
  },
  'prise en charge economique': {
    icon: <FiTrendingUp size={20} className="text-white" />,
    gradient: 'from-orange-500 to-amber-600',
    pill: 'bg-orange-50 text-orange-700',
  },
  'reinsertion economique': {
    icon: <FiBriefcase size={20} className="text-white" />,
    gradient: 'from-amber-500 to-orange-600',
    pill: 'bg-amber-50 text-amber-700',
  },
};

const getVisual = (nom: string): Visual => {
  const key = normalizeMeasureName(nom);
  return MESURE_VISUALS[key] || DEFAULT_VISUAL;
};

const toNumber = (value: unknown): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeMesuresStats = (payload: any): MesuresReparationStats => {
  const data = payload?.data ?? payload ?? {};
  const mesures = data?.mesuresReparationAcceptees ?? {};
  return {
    totalContrats: toNumber(data?.totalContrats),
    mesuresReparationAcceptees: {
      indemnisation: toNumber(mesures?.indemnisation),
      reinsertionEconomique: toNumber(mesures?.reinsertionEconomique),
      priseEnChargeMedicale: toNumber(mesures?.priseEnChargeMedicale),
      accompagnementPsychosocial: toNumber(mesures?.accompagnementPsychosocial),
    },
  };
};

const ProgressionMesuresLuc: React.FC = () => {
  const { fetcher } = useFetch();
  const [mesuresStats, setMesuresStats] = useState<MesuresReparationStats>({
    totalContrats: 0,
    mesuresReparationAcceptees: EMPTY_MESURE_COUNTS,
  });
  const [totalVictimesLuc, setTotalVictimesLuc] = useState<number>(0);
  const [indemnisationBeneficiaires, setIndemnisationBeneficiaires] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      setLoading(true);
      try {
        if (!isOnline() || !fetcher) {
          if (mounted) {
            setMesuresStats({
              totalContrats: 0,
              mesuresReparationAcceptees: EMPTY_MESURE_COUNTS,
            });
            setTotalVictimesLuc(0);
            setIndemnisationBeneficiaires(0);
          }
          return;
        }

        const [mesuresResp, progressResp] = await Promise.all([
          fetcher('/contrat/stats/mesures-reparation/LUC'),
          fetcher('/victime/stats/reparation/globalProgress/LUC'),
        ]);
        if (!mounted) return;

        const normalizedStats = normalizeMesuresStats(mesuresResp);
        const progressData = progressResp?.data ?? progressResp ?? {};
        setMesuresStats(normalizedStats);
        setTotalVictimesLuc(toNumber(progressData?.total));
        setIndemnisationBeneficiaires(toNumber(progressData?.indemnisation?.commencee));
      } catch {
        if (mounted) {
          setMesuresStats({
            totalContrats: 0,
            mesuresReparationAcceptees: EMPTY_MESURE_COUNTS,
          });
          setTotalVictimesLuc(0);
          setIndemnisationBeneficiaires(0);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadStats();
    return () => {
      mounted = false;
    };
  }, [fetcher]);

  const perMesure = useMemo(() => {
    return LUC_MESURES.map((m) => {
      const concernees = mesuresStats.mesuresReparationAcceptees[m.apiKey] ?? 0;
      let beneficiaires = 0;
      if (m.apiKey === 'indemnisation') {
        beneficiaires = Math.min(indemnisationBeneficiaires, concernees || indemnisationBeneficiaires);
      }
      const hasBeneficiaireStats = m.apiKey === 'indemnisation';
      const percent = concernees > 0 ? Math.round((beneficiaires / concernees) * 100) : 0;
      const enAttente = Math.max(0, concernees - beneficiaires);
      return {
        id: m.id,
        nom: m.nom,
        concernees,
        beneficiaires,
        beneficiaireNote: hasBeneficiaireStats ? 'ont déjà perçu un paiement' : 'suivi bénéficiaire à confirmer',
        attenteLabel: hasBeneficiaireStats ? 'en attente' : 'à confirmer',
        percent,
        enAttente,
        visual: getVisual(m.nom),
      };
    });
  }, [mesuresStats, indemnisationBeneficiaires]);

  const baseLabel = totalVictimesLuc > 0
    ? `${totalVictimesLuc.toLocaleString()} victime${totalVictimesLuc > 1 ? 's' : ''} LUC`
    : mesuresStats.totalContrats > 0
      ? `${mesuresStats.totalContrats.toLocaleString()} contrat${mesuresStats.totalContrats > 1 ? 's' : ''} LUC`
      : '';

  const totalConcernees = perMesure.reduce((acc, r) => acc + r.concernees, 0);
  const totalBeneficiaires = perMesure.reduce((acc, r) => acc + r.beneficiaires, 0);
  const totalEnAttente = Math.max(0, totalConcernees - totalBeneficiaires);
  const globalPercent = totalConcernees > 0 ? Math.round((totalBeneficiaires / totalConcernees) * 100) : 0;

  return (
    <div className="w-full mb-8">
      {/* Bandeau récap global — bleu charte graphique, sans dégradé */}
      <div className="rounded-2xl shadow-md mb-6 overflow-hidden bg-primary-600 text-white">
        <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-white/15">
              <FiActivity size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold leading-tight">
                Progression des réparations (victimes LUC)
              </h3>
              <p className="text-white/85 text-sm mt-1 max-w-2xl">
                Suivi humanitaire: victimes concernées par chaque mesure vs bénéficiaires effectifs.
                {baseLabel ? (
                  <span className="ml-1 font-semibold text-white">
                    Base: {baseLabel}.
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          <div className="flex items-stretch rounded-xl bg-white/10 ring-1 ring-white/20 divide-x divide-white/15 min-w-[320px] overflow-hidden">
            <div className="flex-1 px-4 py-3">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/75">
                <FiUsers size={12} />
                <span>Concernées</span>
              </div>
              <div className="text-2xl font-bold text-white mt-1 leading-none">
                {totalConcernees.toLocaleString()}
              </div>
            </div>

            <div className="flex-1 px-4 py-3 relative">
              <span className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-300" />
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-200">
                <FiCheckCircle size={12} />
                <span>Bénéficiaires</span>
              </div>
              <div className="text-2xl font-bold text-white mt-1 leading-none">
                {totalBeneficiaires.toLocaleString()}
              </div>
            </div>

            <div className="flex-1 px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/75">
                Couverture
              </div>
              <div className="text-2xl font-bold text-white mt-1 leading-none">
                {globalPercent}
                <span className="text-sm font-semibold text-white/80 ml-0.5">%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-5">
          <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-white transition-all duration-700"
              style={{ width: `${globalPercent}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-white/85">
            <span className="inline-flex items-center gap-1">
              <FiCheckCircle size={12} /> {totalBeneficiaires.toLocaleString()} pris en charge
            </span>
            <span className="inline-flex items-center gap-1">
              <FiClock size={12} /> {totalEnAttente.toLocaleString()} en attente
            </span>
          </div>
        </div>
      </div>

      {/* Cartes par mesure */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {(loading
          ? Array.from({ length: LUC_MESURES.length }).map((_, i) => ({ skeleton: true as const, id: `s-${i}` }))
          : perMesure.map((r) => ({ skeleton: false as const, ...r }))
        ).map((row: any) => (
          <div
            key={row.id}
            className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            {row.skeleton ? (
              <div className="p-5 space-y-3">
                <div className="h-6 w-2/3 bg-gray-100 animate-pulse rounded" />
                <div className="h-16 bg-gray-100 animate-pulse rounded-xl" />
                <div className="h-2 bg-gray-100 animate-pulse rounded" />
              </div>
            ) : (
              <>
                <div className={`h-1 w-full bg-gradient-to-r ${row.visual.gradient}`} />
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${row.visual.gradient} shadow-sm flex-shrink-0`}>
                      {row.visual.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base font-semibold text-gray-900 truncate">{row.nom}</h4>
                      {row.visual.subtitle ? (
                        <p className="text-xs text-gray-500">{row.visual.subtitle}</p>
                      ) : (
                        <p className="text-xs text-gray-500">Mesure de réparation</p>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${row.visual.pill} whitespace-nowrap`}>
                      {row.percent}%
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                        <FiUsers size={12} /> Concernées
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mt-0.5 leading-tight">
                        {row.concernees.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-gray-500">à prendre en charge</div>
                    </div>
                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
                        <FiCheckCircle size={12} /> Bénéficiaires
                      </div>
                      <div className="text-2xl font-bold text-emerald-700 mt-0.5 leading-tight">
                        {row.beneficiaires.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-emerald-700/80">{row.beneficiaireNote}</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] text-gray-600 mb-1">
                      <span className="font-medium">Progression</span>
                      <span>
                        <span className="font-semibold text-gray-900">{row.beneficiaires.toLocaleString()}</span>
                        <span className="text-gray-500"> / {row.concernees.toLocaleString()}</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${row.visual.gradient} transition-all duration-700`}
                        style={{ width: `${row.percent}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="inline-flex items-center gap-1 text-gray-500">
                        <FiClock size={12} /> {row.enAttente.toLocaleString()} {row.attenteLabel}
                      </span>
                      {row.concernees === 0 ? (
                        <span className="text-gray-400 italic">Aucune victime assignée</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressionMesuresLuc;
