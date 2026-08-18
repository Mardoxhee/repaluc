"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiCamera,
  FiFileText,
  FiHeart,
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
import {
  normalizeApiList,
  normalizeGlobalProgress,
  normalizeSexeRows,
  normalizeText,
  normalizeTrancheAgeRows,
  toNumber,
  totalIndemnisationFromPayload,
  type CountRow,
  type GlobalProgressStats,
} from '../utils/mentionStats';

interface DashboardVictimesPecmuProps {
  onSelectAgentReparation?: (fullName: string) => void;
  onShowRecontactedVictims?: () => void;
  onShowSignedContractVictims?: () => void;
}

const EMPTY_PROGRESS: GlobalProgressStats = {
  total: 0,
  photo: { withPhoto: 0, withoutPhoto: 0 },
  piece: { withPiece: 0, withoutPiece: 0 },
  contrat: { withContrat: 0, withoutContrat: 0 },
  indemnisation: { commencee: 0, nonCommencee: 0, montantTotalIndemnise: 0 },
};

type PecmuServerStats = {
  sexe: CountRow[];
  trancheAge: CountRow[];
  province: CountRow[];
  territoire: CountRow[];
  prejudiceFinal: CountRow[];
  agents: CountRow[];
  mesures: CountRow[];
  contratsCount: number;
  recontactesCount: number;
  totalIndemnisationUSD: number;
};

const EMPTY_PECMU_SERVER_STATS: PecmuServerStats = {
  sexe: [],
  trancheAge: [],
  province: [],
  territoire: [],
  prejudiceFinal: [],
  agents: [],
  mesures: [],
  contratsCount: 0,
  recontactesCount: 0,
  totalIndemnisationUSD: 0,
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

const hasPhoto = (victim: any): boolean => (
  typeof victim?.photo === 'string' && victim.photo.trim().length > 0
);

const hasPieceIdentite = (victim: any): boolean => {
  if (victim?.progression?.hasPieceIdentite === true) return true;
  if (victim?.pieceIdentite) return true;
  if (!Array.isArray(victim?.documentVictime)) return false;
  return victim.documentVictime.some((d: any) => {
    const label = normalizeText(d?.label ?? d?.type ?? d?.nom);
    return label === "piece d'identite" || label === 'piece identite' || label === 'piece_identite';
  });
};

const hasActeConsentement = (victim: any): boolean => {
  if (victim?.consentementSigne === true) return true;
  if (victim?.acteConsentementSigne === true) return true;
  if (victim?.contratSigne === true) return true;
  if (victim?.contrat && (victim.contrat.accepteReparation === true || victim.contrat.dateSignature)) return true;
  const consentements = victim?.consentements;
  return Boolean(consentements && (consentements.signataire === true || consentements.accepteReparation === true));
};

const collectPecmuStatuses = (victim: any): string[] => {
  const statuses: string[] = [];
  const visit = (value: any) => {
    if (!value || typeof value !== 'object') return;
    Object.entries(value).forEach(([key, child]) => {
      if (['statut', 'status', 'etat'].includes(normalizeText(key)) && typeof child === 'string') {
        statuses.push(normalizeText(child));
      } else if (typeof child === 'object') {
        visit(child);
      }
    });
  };
  visit(victim?.progressionPecmu ?? victim?.progressionPECMU ?? victim?.progression?.pecmu);
  return statuses;
};

const isPecmuProcessFinished = (victim: any): boolean => {
  const progression = victim?.progression;
  if (
    typeof progression?.done === 'number' &&
    typeof progression?.total === 'number' &&
    progression.total > 0 &&
    progression.done >= progression.total
  ) {
    return true;
  }
  const statuses = collectPecmuStatuses(victim);
  if (statuses.some((status) => status.includes('cloture') || status.includes('finalise'))) return true;
  const knownStatuses = statuses.filter((status) => status && !status.includes('non commence'));
  return knownStatuses.length > 0 && knownStatuses.every((status) => (
    status.includes('terminee') || status.includes('termine')
  ));
};

const isPecmuProcessInProgress = (victim: any): boolean => {
  if (isPecmuProcessFinished(victim)) return false;
  const statuses = collectPecmuStatuses(victim);
  if (statuses.some((status) => status.includes('en cours') || status.includes('evalue'))) return true;
  return hasActeConsentement(victim) || hasPhoto(victim) || hasPieceIdentite(victim);
};

const normalizeCountRows = (
  payload: any,
  labelKeys: string[],
  fallback = 'Non renseigné'
): CountRow[] => {
  const grouped = new Map<string, number>();

  normalizeApiList(payload).forEach((item: any) => {
    const rawLabel = labelKeys
      .map((key) => item?.[key])
      .find((value) => typeof value === 'string' && value.trim().length > 0);
    const label = String(rawLabel ?? item?.label ?? item?.name ?? fallback).trim() || fallback;
    const value = toNumber(item?.total ?? item?.count ?? item?.nombre ?? item?.value);
    grouped.set(label, (grouped.get(label) || 0) + value);
  });

  return Array.from(grouped.entries())
    .map(([name, value]) => ({ name, fullName: name, value }))
    .filter((row) => row.value > 0 || row.name !== fallback)
    .sort((a, b) => b.value - a.value);
};

const getPayloadTotal = (payload: any): number => (
  toNumber(payload?.meta?.total)
  || toNumber(payload?.data?.meta?.total)
  || toNumber(payload?.total)
  || toNumber(payload?.data?.total)
  || normalizeApiList(payload).length
);

const formatMesureLabel = (key: string): string => {
  const normalized = normalizeText(key).replace(/\s/g, '');
  const labels: Record<string, string> = {
    indemnisation: 'Indemnisation',
    reinsertioneconomique: 'Réinsertion économique',
    priseenchargemedicale: 'Prise en charge médicale',
    accompagnementpsychosocial: 'Accompagnement psychosocial',
    accompagnementpsychologique: 'Accompagnement psychologique',
  };
  if (labels[normalized]) return labels[normalized];

  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
};

const normalizeMesuresRows = (payload: any): CountRow[] => {
  const data = payload?.data ?? payload ?? {};
  const mesuresObject = data?.mesuresReparationAcceptees;

  if (mesuresObject && typeof mesuresObject === 'object' && !Array.isArray(mesuresObject)) {
    return Object.entries(mesuresObject)
      .map(([key, value]) => ({
        name: formatMesureLabel(key),
        fullName: formatMesureLabel(key),
        value: toNumber(value),
      }))
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value - a.value);
  }

  return normalizeCountRows(payload, ['mesure', 'nom', 'type', 'label', 'name']);
};

const DashboardVictimesPecmu: React.FC<DashboardVictimesPecmuProps> = ({ onSelectAgentReparation, onShowRecontactedVictims, onShowSignedContractVictims }) => {
  const { fetcher } = useFetch();
  const kpis = useMemo(() => getMockPecmuKpis(), []);
  const timeline = useMemo(() => getMockPecmuTimeline(), []);
  const [progress, setProgress] = useState<GlobalProgressStats>(EMPTY_PROGRESS);
  const [pecmuServerStats, setPecmuServerStats] = useState<PecmuServerStats>(EMPTY_PECMU_SERVER_STATS);
  const [victimsFromCache, setVictimsFromCache] = useState<any[]>([]);
  const [loadingOfficial, setLoadingOfficial] = useState(true);
  const [loadingCache, setLoadingCache] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadOfficialStats = async () => {
      setLoadingOfficial(true);
      try {
        const safeFetch = (endpoint: string) => fetcher(endpoint).catch(() => null);
        const [
          contratsResp,
          mesuresResp,
          progressResp,
          sexeResp,
          trancheAgeResp,
          provinceResp,
          territoireResp,
          prejudiceFinalResp,
          totalIndemnisationResp,
          recontacteResp,
        ] = await Promise.all([
          safeFetch('/contrat/PECMU?page=1&limit=20'),
          safeFetch('/contrat/stats/mesures-reparation/PECMU'),
          safeFetch('/victime/stats/reparation/globalProgress/PECMU'),
          safeFetch('/victime/stats/sexe/PECMU'),
          safeFetch('/victime/stats/tranche-age/PECMU'),
          safeFetch('/victime/stats/province/PECMU'),
          safeFetch('/victime/stats/territoire/PECMU'),
          safeFetch('/victime/stats/prejudice-final/PECMU'),
          safeFetch('/victime/stats/total-indemnisation/PECMU'),
          safeFetch('/victime/recontacte/PECMU?page=1&limit=20'),
        ]);

        if (!mounted) return;
        setProgress(normalizeGlobalProgress(progressResp));
        setPecmuServerStats({
          sexe: normalizeSexeRows(sexeResp),
          trancheAge: normalizeTrancheAgeRows(trancheAgeResp),
          province: normalizeCountRows(provinceResp, ['province']),
          territoire: normalizeCountRows(territoireResp, ['territoire']),
          prejudiceFinal: normalizeCountRows(prejudiceFinalResp, ['prejudiceFinal', 'prejudice_final', 'prejudice', 'libelle']),
          agents: [],
          mesures: normalizeMesuresRows(mesuresResp),
          contratsCount: getPayloadTotal(contratsResp),
          recontactesCount: getPayloadTotal(recontacteResp),
          totalIndemnisationUSD: totalIndemnisationFromPayload(totalIndemnisationResp),
        });
      } catch {
        if (!mounted) return;
        setProgress(EMPTY_PROGRESS);
        setPecmuServerStats(EMPTY_PECMU_SERVER_STATS);
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
  const recontactedFromCache = useMemo(
    () => victimsFromCache.filter((victim) => hasPhoto(victim) || hasPieceIdentite(victim)).length,
    [victimsFromCache]
  );
  const consentementsFromCache = useMemo(
    () => victimsFromCache.filter(hasActeConsentement).length,
    [victimsFromCache]
  );
  const finProcessusFromCache = useMemo(
    () => victimsFromCache.filter(isPecmuProcessFinished).length,
    [victimsFromCache]
  );
  const circuitFromCache = useMemo(
    () => victimsFromCache.filter(isPecmuProcessInProgress).length,
    [victimsFromCache]
  );

  const recontactedCount = recontactedFromCache > 0
    ? recontactedFromCache
    : (pecmuServerStats.recontactesCount || Math.max(progress.photo.withPhoto, progress.piece.withPiece));
  const consentementCount = progress.contrat.withContrat || pecmuServerStats.contratsCount || consentementsFromCache;
  const finProcessusCount = finProcessusFromCache;
  const circuitCount = circuitFromCache > 0
    ? circuitFromCache
    : Math.max(0, totalPecmu - finProcessusCount);
  const priseEnChargeDocumentee = Math.max(0, finProcessusCount + circuitCount);
  const percentRecontacted = totalPecmu > 0 ? Math.round((recontactedCount / totalPecmu) * 100) : 0;
  const percentConsentement = totalPecmu > 0 ? Math.round((consentementCount / totalPecmu) * 100) : 0;
  const percentCircuit = totalPecmu > 0 ? Math.round((circuitCount / totalPecmu) * 100) : 0;
  const timelineSansChirurgie = useMemo(
    () => timeline.filter((step) => step.key !== 'chirurgie'),
    [timeline]
  );

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

  const provinceRowsFromCache = useMemo(() => {
    const counts = new Map<string, number>();
    victimsFromCache.forEach((v) => {
      const province = typeof v?.province === 'string' ? v.province.trim() : '';
      if (province) counts.set(province, (counts.get(province) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, fullName: name, value }))
      .sort((a, b) => b.value - a.value);
  }, [victimsFromCache]);
  const provinceRows = pecmuServerStats.province.length > 0 ? pecmuServerStats.province : provinceRowsFromCache;
  const topProvinceRows = provinceRows.slice(0, 6);
  const maxProvince = Math.max(1, ...topProvinceRows.map((row) => row.value));
  const provinceCount = provinceRows.length;

  const territoireRowsFromCache = useMemo(() => {
    const counts = new Map<string, number>();
    victimsFromCache.forEach((v) => {
      const territoire = typeof v?.territoire === 'string' ? v.territoire.trim() : '';
      if (territoire) counts.set(territoire, (counts.get(territoire) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, fullName: name, value }))
      .sort((a, b) => b.value - a.value);
  }, [victimsFromCache]);
  const territoireRows = pecmuServerStats.territoire.length > 0 ? pecmuServerStats.territoire : territoireRowsFromCache;
  const topTerritoireRows = territoireRows.slice(0, 6);
  const maxTerritoire = Math.max(1, ...topTerritoireRows.map((row) => row.value));

  const agentRowsFromCache = useMemo(() => {
    const counts = new Map<string, number>();
    victimsFromCache.forEach((v) => {
      const agent = typeof v?.variablesSpecifiques?.agentReparation === 'string'
        ? v.variablesSpecifiques.agentReparation.trim()
        : typeof v?.agentReparation === 'string'
          ? v.agentReparation.trim()
          : '';
      if (agent) counts.set(agent, (counts.get(agent) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, fullName: name, value }))
      .sort((a, b) => b.value - a.value);
  }, [victimsFromCache]);
  const agentRows = agentRowsFromCache.slice(0, 6);
  const maxAgent = Math.max(1, ...agentRows.map((row) => row.value));

  const sexeRows = pecmuServerStats.sexe;
  const ageRows = pecmuServerStats.trancheAge;
  const maxAge = Math.max(1, ...ageRows.map((row) => row.value));
  const prejudiceRows = pecmuServerStats.prejudiceFinal.slice(0, 6);
  const maxPrejudice = Math.max(1, ...prejudiceRows.map((row) => row.value));
  const mesureRows = pecmuServerStats.mesures.slice(0, 6);
  const maxMesure = Math.max(1, ...mesureRows.map((row) => row.value));

  const renderRankedRows = (
    rows: CountRow[],
    maxValue: number,
    colorClass: string,
    emptyLabel: string,
    onRowClick?: (row: CountRow) => void
  ) => {
    if (loadingOfficial && rows.length === 0) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 bg-gray-100 animate-pulse rounded" />
          ))}
        </div>
      );
    }

    if (rows.length === 0) {
      return <div className="text-sm text-gray-500 italic">{emptyLabel}</div>;
    }

    return (
      <div className="space-y-3">
        {rows.map((row) => {
          const pct = Math.round((row.value / maxValue) * 100);
          const content = (
            <>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-800 truncate pr-3">{row.name}</span>
                <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{row.value.toLocaleString()}</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
              </div>
            </>
          );

          if (onRowClick) {
            return (
              <button
                key={row.name}
                type="button"
                onClick={() => onRowClick(row)}
                className="w-full text-left rounded-md border border-transparent p-1 transition-colors hover:border-red-100 hover:bg-red-50/60"
              >
                {content}
              </button>
            );
          }

          return <div key={row.name}>{content}</div>;
        })}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-red-50">
          <FiHeart className="text-red-600" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tableau de bord — PECMU
          </h1>
          <p className="text-sm text-gray-600">
            Suivi PECMU : recontact, acte de consentement, avancement du circuit et indemnisation.
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
          title="Recontacté (photo et/ou pièce)"
          value={loadingOfficial && loadingCache ? '...' : recontactedCount.toLocaleString()}
          icon={<FiCamera className="text-white text-xl" />}
          color="bg-gradient-to-br from-sky-500 to-blue-600"
          subtitle={`${percentRecontacted}% des PECMU`}
          loading={loadingOfficial && loadingCache}
          onClick={onShowRecontactedVictims}
        />
        <StatCard
          title="Consentement"
          value={loadingOfficial && loadingCache ? '...' : consentementCount.toLocaleString()}
          icon={<FiFileText className="text-white text-xl" />}
          color="bg-gradient-to-br from-violet-500 to-purple-600"
          subtitle={`${percentConsentement}% des PECMU`}
          loading={loadingOfficial && loadingCache}
          onClick={onShowSignedContractVictims}
        />
        <StatCard
          title="Dans le circuit"
          value={loadingOfficial && loadingCache ? '...' : circuitCount.toLocaleString()}
          icon={<FiActivity className="text-white text-xl" />}
          color="bg-gradient-to-br from-emerald-500 to-teal-600"
          subtitle={`${percentCircuit}% des PECMU`}
          loading={loadingOfficial && loadingCache}
        />
        <StatCard
          title="Fin de processus"
          value={loadingOfficial && loadingCache ? '...' : finProcessusCount.toLocaleString()}
          icon={<FiCheckCircle className="text-white text-xl" />}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
          subtitle="Personnes arrivées en fin de circuit"
          loading={loadingOfficial && loadingCache}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-red-100 bg-red-50/70 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-red-700">PECMU séparé</div>
          <div className="mt-1 text-sm text-red-900">Les chiffres ci-dessus viennent des endpoints filtrés par mention.</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Provinces</div>
          <div className="mt-1 text-2xl font-black text-slate-950">{loadingOfficial && loadingCache ? '...' : provinceCount.toLocaleString()}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Indemnisation</div>
          <div className="mt-1 text-2xl font-black text-slate-950">{loadingOfficial ? '...' : `${pecmuServerStats.totalIndemnisationUSD.toLocaleString()} USD`}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-red-50">
              <FiActivity className="text-red-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Provinces PECMU</h3>
              <p className="text-xs text-gray-500">Endpoint province PECMU, avec secours cache.</p>
            </div>
          </div>
          {renderRankedRows(topProvinceRows, maxProvince, 'bg-red-500', 'Aucune donnée province disponible.')}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-teal-50">
              <FiHeart className="text-teal-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Territoires PECMU</h3>
              <p className="text-xs text-gray-500">Endpoint territoire PECMU, avec secours cache.</p>
            </div>
          </div>
          {renderRankedRows(topTerritoireRows, maxTerritoire, 'bg-teal-500', 'Aucune donnée territoire disponible.')}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-violet-50">
              <FiUsers className="text-violet-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Agents PECMU</h3>
              <p className="text-xs text-gray-500">Cliquez pour ouvrir les victimes PECMU de l’agent.</p>
            </div>
          </div>
          {renderRankedRows(
            agentRows,
            maxAgent,
            'bg-violet-500',
            'Aucune donnée agent disponible dans le cache.',
            (row) => onSelectAgentReparation?.(row.fullName || row.name)
          )}
        </div>
      </div>

      {/* Aspects médicaux breakdown + Psychologique */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ProgressionBreakdownCard
          title="Circuit de prise en charge PECMU"
          icon={<FiHeart className="text-white" size={18} />}
          iconBg="bg-gradient-to-br from-red-500 to-rose-600"
          items={[
            { label: 'Recontactés avec photo ou pièce', count: recontactedCount, color: '#0ea5e9' },
            { label: 'Actes de consentement signés', count: consentementCount, color: '#8b5cf6' },
            { label: 'Personnes dans le circuit', count: circuitCount, color: '#10b981' },
            { label: 'Personnes en fin de processus', count: finProcessusCount, color: '#f59e0b' },
          ]}
        />

        <ProgressionBreakdownCard
          title="Suivi de la prise en charge"
          icon={<FiActivity className="text-white" size={18} />}
          iconBg="bg-gradient-to-br from-violet-500 to-purple-600"
          items={[
            { label: 'Dossiers PECMU documentés', count: priseEnChargeDocumentee, color: '#14b8a6' },
            { label: 'Soins à domicile suivis', count: kpis.soinsDomicile.enCours + kpis.soinsDomicile.terminees, color: '#06b6d4' },
            { label: 'Suivi médical documenté', count: kpis.suivis.enCours + kpis.suivis.terminees, color: '#3b82f6' },
            { label: 'Accompagnement psychologique', count: kpis.psychologique.enCours + kpis.psychologique.terminees, color: '#ec4899' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-emerald-50">
              <FiCheckCircle className="text-emerald-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Mesures PECMU acceptées</h3>
              <p className="text-xs text-gray-500">Endpoint mesures de réparation PECMU.</p>
            </div>
          </div>
          {renderRankedRows(mesureRows, maxMesure, 'bg-emerald-500', 'Aucune mesure PECMU disponible.')}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-amber-50">
              <FiAlertCircle className="text-amber-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Préjudices finaux PECMU</h3>
              <p className="text-xs text-gray-500">Endpoint préjudice final PECMU.</p>
            </div>
          </div>
          {renderRankedRows(prejudiceRows, maxPrejudice, 'bg-amber-500', 'Aucune donnée de préjudice final disponible.')}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-pink-50">
              <FiUsers className="text-pink-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Répartition par sexe PECMU</h3>
          </div>
          {renderRankedRows(sexeRows, Math.max(1, ...sexeRows.map((row) => row.value)), 'bg-pink-500', 'Aucune donnée sexe disponible.')}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-blue-50">
              <FiUsers className="text-blue-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Tranches d’âge PECMU</h3>
          </div>
          {renderRankedRows(ageRows, maxAge, 'bg-blue-500', 'Aucune donnée âge disponible.')}
        </div>
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
            <p className="text-xs text-gray-500">Parcours PECMU d'une victime</p>
          </div>
        </div>
        <ProgressionTimeline steps={timelineSansChirurgie} orientation="horizontal" />
      </div>

      {/* Résumé */}
      <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <FiHeart className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Résumé PECMU</h3>
            <p className="text-red-100">Parcours PECMU</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{totalPecmu.toLocaleString()}</div>
            <div className="text-red-100 text-sm">Victimes total</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{finProcessusCount.toLocaleString()}</div>
            <div className="text-red-100 text-sm">Fin de processus</div>
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
