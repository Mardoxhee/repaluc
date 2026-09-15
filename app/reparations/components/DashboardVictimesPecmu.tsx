"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiAlertCircle,
  FiCheckCircle,
  FiFileText,
  FiHeart,
  FiMapPin,
  FiUsers,
} from 'react-icons/fi';
import StatCard from './dashboard/StatCard';
import { useFetch } from '../../context/FetchContext';
import { getVictimsFromCache } from '../../utils/victimsCache';
import {
  normalizeApiList,
  normalizeGlobalProgress,
  normalizeText,
  toNumber,
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
  province: CountRow[];
  contratsCount: number;
  partenairesParProvince: CountRow[];
};

const EMPTY_PECMU_SERVER_STATS: PecmuServerStats = {
  province: [],
  contratsCount: 0,
  partenairesParProvince: [],
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

const hasPecmuAlert = (victim: any): boolean => {
  if (victim?.alerte === true || victim?.alert === true || victim?.hasAlert === true) return true;
  if (Array.isArray(victim?.alertes) && victim.alertes.length > 0) return true;
  if (Array.isArray(victim?.alerts) && victim.alerts.length > 0) return true;

  const priority = normalizeText(victim?.orientation_Priorisation ?? victim?.priorisation ?? victim?.urgence);
  const status = normalizeText(victim?.status);

  return (
    priority === '1' ||
    priority.includes('tres urgent') ||
    priority.includes('urgent') ||
    status.includes('alerte')
  );
};

const getProvince = (item: any): string => {
  const raw =
    item?.province ||
    item?.provinceName ||
    item?.nomProvince ||
    item?.localisation?.province ||
    item?.adresse?.province ||
    '';
  const value = typeof raw === 'string' ? raw.trim() : '';
  return value.length > 0 ? value : 'Non renseigné';
};

const getPartnerIdentifier = (victim: any): string => {
  const partenaire = victim?.partenaire;
  const raw =
    victim?.partenaireId ??
    victim?.partenaire_id ??
    victim?.partenaireNom ??
    victim?.structurePartenaire ??
    victim?.structure_partenaire ??
    victim?.evaluation?.partenaireId ??
    victim?.evaluationMedicale?.partenaireId ??
    victim?.variablesSpecifiques?.partenaireId ??
    (typeof partenaire === 'object' ? partenaire?.id ?? partenaire?.structure ?? partenaire?.nom ?? partenaire?.name : partenaire);

  const value = String(raw ?? '').trim();
  return value && value !== '0' ? value : '';
};

const isAffecteePartenaire = (victim: any): boolean => getPartnerIdentifier(victim).length > 0;

const hasStartedCare = (victim: any): boolean => {
  if (victim?.priseEnChargePecmu === true) return true;
  if (victim?.priseEnChargeMedicale === true) return true;
  if (victim?.prisEnCharge === true) return true;
  if (Array.isArray(victim?.prisesEnCharge) && victim.prisesEnCharge.length > 0) return true;
  if (Array.isArray(victim?.evaluationsMedicales) && victim.evaluationsMedicales.length > 0) return true;

  const status = normalizeText(victim?.status);
  const statuses = collectPecmuStatuses(victim);

  return (
    status.includes('prise en charge') ||
    statuses.some((s) => (
      s.includes('en cours') ||
      s.includes('evalue') ||
      s.includes('termine') ||
      s.includes('cloture') ||
      s.includes('finalise')
    ))
  );
};

const isBeneficiairePriseEnCharge = (victim: any): boolean => (
  isAffecteePartenaire(victim) && hasStartedCare(victim)
);

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

const groupByProvince = (items: any[]): CountRow[] => {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    const province = getProvince(item);
    counts.set(province, (counts.get(province) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, fullName: name, value }))
    .sort((a, b) => b.value - a.value);
};

const groupPartnersByProvince = (payload: any): CountRow[] => {
  const partenaires = normalizeApiList(payload);
  const seen = new Set<string>();
  const counts = new Map<string, number>();

  partenaires.forEach((partenaire: any, index: number) => {
    const key = String(partenaire?.id ?? partenaire?.structure ?? partenaire?.nom ?? partenaire?.name ?? index);
    if (seen.has(key)) return;
    seen.add(key);

    const province = getProvince(partenaire);
    counts.set(province, (counts.get(province) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, fullName: name, value }))
    .sort((a, b) => b.value - a.value);
};

const DashboardVictimesPecmu: React.FC<DashboardVictimesPecmuProps> = ({ onShowSignedContractVictims }) => {
  const { fetcher } = useFetch();
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
        const [contratsResp, progressResp, provinceResp, partenairesResp] = await Promise.all([
          safeFetch('/contrat/PECMU?page=1&limit=20'),
          safeFetch('/victime/stats/reparation/globalProgress/PECMU'),
          safeFetch('/victime/stats/province/PECMU'),
          safeFetch('/partenaires'),
        ]);

        if (!mounted) return;

        setProgress(normalizeGlobalProgress(progressResp));
        setPecmuServerStats({
          province: normalizeCountRows(provinceResp, ['province']),
          contratsCount: getPayloadTotal(contratsResp),
          partenairesParProvince: groupPartnersByProvince(partenairesResp),
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
        const victims = Array.isArray(cached?.data) ? cached!.data.filter(isPecmuVictim) : [];
        if (mounted) setVictimsFromCache(victims);
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
  const alertesCount = useMemo(
    () => victimsFromCache.filter(hasPecmuAlert).length,
    [victimsFromCache]
  );
  const consentementsFromCache = useMemo(
    () => victimsFromCache.filter(hasActeConsentement).length,
    [victimsFromCache]
  );
  const affecteesPartenaireCount = useMemo(
    () => victimsFromCache.filter(isAffecteePartenaire).length,
    [victimsFromCache]
  );
  const beneficiairesPriseEnCharge = useMemo(
    () => victimsFromCache.filter(isBeneficiairePriseEnCharge),
    [victimsFromCache]
  );
  const beneficiairesPriseEnChargeCount = beneficiairesPriseEnCharge.length;
  const consentementCount = progress.contrat.withContrat || pecmuServerStats.contratsCount || consentementsFromCache;
  const percentConsentement = totalPecmu > 0 ? Math.round((consentementCount / totalPecmu) * 100) : 0;
  const percentAffectees = totalPecmu > 0 ? Math.round((affecteesPartenaireCount / totalPecmu) * 100) : 0;
  const percentPriseEnCharge = totalPecmu > 0 ? Math.round((beneficiairesPriseEnChargeCount / totalPecmu) * 100) : 0;

  const victimesPrisesEnChargeParProvince = useMemo(
    () => groupByProvince(beneficiairesPriseEnCharge),
    [beneficiairesPriseEnCharge]
  );
  const provinceRows = victimesPrisesEnChargeParProvince.length > 0
    ? victimesPrisesEnChargeParProvince
    : (pecmuServerStats.province.length > 0 ? pecmuServerStats.province : groupByProvince(victimsFromCache));
  const maxVictimesProvince = Math.max(1, ...provinceRows.map((row) => row.value));
  const maxPartenairesProvince = Math.max(1, ...pecmuServerStats.partenairesParProvince.map((row) => row.value));

  const renderProvinceRows = (
    rows: CountRow[],
    maxValue: number,
    colorClass: string,
    emptyLabel: string
  ) => {
    if (loadingOfficial && loadingCache && rows.length === 0) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 rounded bg-slate-100 animate-pulse" />
          ))}
        </div>
      );
    }

    if (rows.length === 0) {
      return <div className="text-sm italic text-slate-500">{emptyLabel}</div>;
    }

    return (
      <div className="space-y-3">
        {rows.map((row) => {
          const pct = Math.round((row.value / maxValue) * 100);

          return (
            <div key={row.name}>
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium text-slate-800">{row.name}</span>
                <span className="whitespace-nowrap text-sm font-black text-slate-950">{row.value.toLocaleString()}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex items-start gap-3">
        <div className="rounded-lg bg-red-50 p-2.5">
          <FiHeart className="text-red-600" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tableau de bord - PECMU
          </h1>
          <p className="text-sm text-gray-600">
            Suivi des alertes, consentements et affectations partenaires PECMU.
          </p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total victimes PECMU"
          value={totalPecmu.toLocaleString()}
          icon={<FiUsers className="text-white text-xl" />}
          color="bg-gradient-to-br from-red-500 to-red-600"
          subtitle="Victimes PECMU enregistrées"
          loading={loadingOfficial && !victimsFromCache.length}
        />
        <StatCard
          title="Nombre d'alertes"
          value={alertesCount.toLocaleString()}
          icon={<FiAlertCircle className="text-white text-xl" />}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
          subtitle="Alertes PECMU documentées"
          loading={loadingCache}
        />
        <StatCard
          title="Consentements signés"
          value={consentementCount.toLocaleString()}
          icon={<FiFileText className="text-white text-xl" />}
          color="bg-gradient-to-br from-violet-500 to-purple-600"
          subtitle={`${percentConsentement}% des PECMU`}
          loading={loadingOfficial && loadingCache}
          onClick={onShowSignedContractVictims}
        />
        <StatCard
          title="Affectées à un partenaire"
          value={affecteesPartenaireCount.toLocaleString()}
          icon={<FiCheckCircle className="text-white text-xl" />}
          color="bg-gradient-to-br from-sky-500 to-blue-600"
          subtitle={`${percentAffectees}% des PECMU`}
          loading={loadingCache}
        />
        <StatCard
          title="Déjà prises en charge"
          value={beneficiairesPriseEnChargeCount.toLocaleString()}
          icon={<FiActivity className="text-white text-xl" />}
          color="bg-gradient-to-br from-emerald-500 to-teal-600"
          subtitle={`${percentPriseEnCharge}% auprès des partenaires`}
          loading={loadingCache}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_14px_40px_-30px_rgba(15,23,42,0.58)]">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-red-50 p-2">
              <FiMapPin className="text-red-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Victimes prises en charge par province</h3>
              <p className="text-xs text-gray-500">Répartition PECMU par province.</p>
            </div>
          </div>
          {renderProvinceRows(
            provinceRows,
            maxVictimesProvince,
            'bg-red-500',
            'Aucune donnée province disponible pour les victimes prises en charge.'
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_14px_40px_-30px_rgba(15,23,42,0.58)]">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <FiUsers className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Partenaires par province</h3>
              <p className="text-xs text-gray-500">Nombre de partenaires enregistrés par province.</p>
            </div>
          </div>
          {renderProvinceRows(
            pecmuServerStats.partenairesParProvince,
            maxPartenairesProvince,
            'bg-blue-500',
            'Aucune donnée province disponible pour les partenaires.'
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardVictimesPecmu;
