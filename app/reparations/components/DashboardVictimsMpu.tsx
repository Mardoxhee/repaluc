"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiAlertCircle,
  FiCamera,
  FiBookOpen,
  FiCheckCircle,
  FiFileText,
  FiHeart,
  FiHome,
  FiMapPin,
  FiShield,
  FiTrendingUp,
  FiTruck,
  FiUser,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { getVictimsFromCache } from '../../utils/victimsCache';
import MpuCliniquesSection from './MpuCliniquesSection';
import { useFetch } from '../../context/FetchContext';
import {
  normalizeApiList,
  normalizeGlobalProgress,
  normalizeSexeRows,
  normalizeText,
  normalizeTrancheAgeRows,
  toNumber,
  type CountRow,
  type GlobalProgressStats,
} from '../utils/mentionStats';

interface DashboardVictimsMpuProps {
  onSelectAgentReparation?: (fullName: string) => void;
  onShowRecontactedVictims?: () => void;
  onShowSignedContractVictims?: () => void;
}

const isMpuVictim = (victim: any): boolean => {
  const mentionValue = normalizeText(victim?.mention);
  const statusValue = normalizeText(victim?.status);
  const categorieValue = normalizeText(victim?.categorie);
  const programmeValue = normalizeText(victim?.programme);
  return (
    mentionValue === 'mpu' ||
    statusValue.includes('mpu') ||
    statusValue.includes('mesure provisoire') ||
    statusValue.includes('provisoire urgente') ||
    categorieValue.includes('mpu') ||
    categorieValue.includes('mesure provisoire') ||
    programmeValue.includes('mpu')
  );
};

const hasConsentementSigne = (victim: any): boolean => {
  if (victim?.consentementSigne === true) return true;
  if (victim?.acteConsentementSigne === true) return true;
  if (victim?.contratSigne === true) return true;
  if (victim?.contrat && (victim.contrat.accepteReparation === true || victim.contrat.dateSignature)) return true;
  const c = victim?.consentements;
  if (c && (c.signataire === true || c.accepteReparation === true)) return true;
  return false;
};

const getSiteDeplaces = (victim: any): string => {
  const raw =
    victim?.siteDeplaces ||
    victim?.siteDeplace ||
    victim?.site ||
    victim?.campDeplaces ||
    victim?.lieuDeplacement ||
    victim?.village ||
    victim?.territoire ||
    '';
  const value = typeof raw === 'string' ? raw.trim() : '';
  return value.length > 0 ? value : 'Non renseigné';
};

const hasFormation = (victim: any): boolean => {
  if (victim?.formationSuivie === true) return true;
  if (victim?.formation === true) return true;
  if (Array.isArray(victim?.formations) && victim.formations.length > 0) return true;
  const prejudices = Array.isArray(victim?.prejudices) ? victim.prejudices : [];
  return prejudices.some((p: any) => {
    const mesures = Array.isArray(p?.mesures) ? p.mesures : [];
    return mesures.some((m: any) => {
      const nom = typeof m?.mesure === 'string' ? m.mesure.toLowerCase() : '';
      return nom.includes('formation');
    });
  });
};

const hasConsultationMedicale = (victim: any): boolean => {
  if (Array.isArray(victim?.consultationsMedicales) && victim.consultationsMedicales.length > 0) return true;
  if (Array.isArray(victim?.evaluationsMedicales) && victim.evaluationsMedicales.length > 0) return true;
  if (victim?.consultationMedicale === true) return true;
  if (victim?.evaluationMedicale) return true;
  const prejudices = Array.isArray(victim?.prejudices) ? victim.prejudices : [];
  return prejudices.some((p: any) => {
    const mesures = Array.isArray(p?.mesures) ? p.mesures : [];
    return mesures.some((m: any) => {
      const nom = typeof m?.mesure === 'string' ? m.mesure.toLowerCase() : '';
      return nom.includes('médical') || nom.includes('medical') || nom.includes('clinique');
    });
  });
};

const collectMesureNames = (victim: any): string[] => {
  const prejudices = Array.isArray(victim?.prejudices) ? victim.prejudices : [];
  const names: string[] = [];
  prejudices.forEach((p: any) => {
    const mesures = Array.isArray(p?.mesures) ? p.mesures : [];
    mesures.forEach((m: any) => {
      const nom = typeof m?.mesure === 'string' ? m.mesure : (typeof m?.nom === 'string' ? m.nom : '');
      if (nom) names.push(nom.toLowerCase());
    });
  });
  return names;
};

const hasCliniqueMobile = (victim: any): boolean => {
  if (victim?.cliniqueMobile === true) return true;
  if (typeof victim?.cliniqueMobile === 'string' && victim.cliniqueMobile.trim().length > 0) return true;
  return collectMesureNames(victim).some((n) => n.includes('clinique mobile'));
};

const hasCommenceMesuresMpu = (victim: any): boolean => {
  if (hasFormation(victim) || hasConsultationMedicale(victim) || hasCliniqueMobile(victim)) return true;
  if (victim?.mesuresMpuCommencees === true || victim?.priseEnChargeMpu === true) return true;

  const progression = victim?.progressionMpu ?? victim?.progressionMPU ?? victim?.progression?.mpu;
  if (!progression || typeof progression !== 'object') return false;

  const cliniques = Array.isArray(progression?.cliniques) ? progression.cliniques : [];
  if (cliniques.some((c: any) => c?.effectuee === true || c?.date)) return true;
  if (progression?.musoAvec?.paiementEffectue === true || progression?.musoAvec?.date) return true;

  const statuts = [
    progression?.psychologique?.statut,
    progression?.economique?.statut,
  ].map(normalizeText);

  return statuts.some((statut) => (
    statut.includes('en cours') ||
    statut.includes('evalue') ||
    statut.includes('termine')
  ));
};

const getCliniqueMobileId = (victim: any): string | null => {
  const raw =
    victim?.cliniqueMobileNom ||
    victim?.cliniqueMobile ||
    victim?.cliniqueMobileDeploiement ||
    '';
  const value = typeof raw === 'string' ? raw.trim() : '';
  return value.length > 0 ? value : null;
};

const computeAge = (victim: any): number | null => {
  const dn = victim?.dateNaissance;
  if (!dn) return null;
  const d = new Date(dn);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 && age <= 120 ? age : null;
};

const getAgeBucket = (age: number | null): string => {
  if (age === null) return 'Inconnu';
  if (age < 5) return '0–4';
  if (age < 18) return '5–17';
  if (age < 35) return '18–34';
  if (age < 60) return '35–59';
  return '60+';
};

const isVulnerable = (victim: any): boolean => {
  if (victim?.vulnerable === true) return true;
  if (victim?.estVulnerable === true) return true;
  if (victim?.enceinte === true || victim?.grossesse === true) return true;
  if (victim?.handicap === true || victim?.personneHandicapee === true) return true;
  const age = computeAge(victim);
  if (age !== null && (age < 18 || age >= 60)) return true;
  return false;
};

const getVictimFullName = (victim: any): string => {
  const nom = typeof victim?.nom === 'string' ? victim.nom : '';
  const prenom = typeof victim?.prenom === 'string' ? victim.prenom : '';
  const full = `${prenom} ${nom}`.trim();
  return full.length > 0 ? full : (victim?.reference || `Victime #${victim?.id ?? '?'}`);
};

type KpiProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  loading?: boolean;
  onClick?: () => void;
};

type MpuServerStats = {
  sexe: CountRow[];
  trancheAge: CountRow[];
  province: CountRow[];
  territoire: CountRow[];
  prejudiceFinal: CountRow[];
  agents: CountRow[];
  mesures: CountRow[];
  contratsCount: number;
};

const EMPTY_MPU_SERVER_STATS: MpuServerStats = {
  sexe: [],
  trancheAge: [],
  province: [],
  territoire: [],
  prejudiceFinal: [],
  agents: [],
  mesures: [],
  contratsCount: 0,
};

const KpiCard: React.FC<KpiProps> = ({ title, value, icon, color, subtitle, loading, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className={`relative overflow-hidden text-left bg-white/95 rounded-lg shadow-[0_14px_40px_-30px_rgba(15,23,42,0.58)] border border-slate-200/70 p-5 transition-all duration-200 ${onClick ? 'hover:shadow-[0_18px_44px_-28px_rgba(15,23,42,0.64)] hover:-translate-y-0.5 cursor-pointer' : 'cursor-default'
      }`}
  >
    <div className={`absolute inset-x-0 top-0 h-1 ${color}`} />
    <div className="flex items-start gap-3 mb-4">
      <div className={`p-2.5 rounded-md ${color} shadow-sm ring-1 ring-white/40`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{title}</h3>
        {subtitle ? <p className="text-[11px] text-slate-500 leading-snug">{subtitle}</p> : null}
      </div>
    </div>
    {loading ? (
      <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-lg" />
    ) : (
      <div className="text-2xl font-black tracking-tight text-slate-950">{value}</div>
    )}
  </button>
);

const EMPTY_PROGRESS: GlobalProgressStats = {
  total: 0,
  photo: { withPhoto: 0, withoutPhoto: 0 },
  piece: { withPiece: 0, withoutPiece: 0 },
  contrat: { withContrat: 0, withoutContrat: 0 },
  indemnisation: { commencee: 0, nonCommencee: 0, montantTotalIndemnise: 0 },
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

const formatMesureLabel = (key: string): string => {
  const normalized = normalizeText(key);
  const labels: Record<string, string> = {
    reinsertioneconomique: 'Réinsertion économique',
    priseenchargemedicale: 'Prise en charge médicale',
    accompagnementpsychosocial: 'Accompagnement psychosocial',
    accompagnementpsychologique: 'Accompagnement psychologique',
    formation: 'Formation',
    cliniquemobile: 'Clinique mobile',
    musoavec: 'MUSO / AVEC',
  };
  if (labels[normalized.replace(/\s/g, '')]) return labels[normalized.replace(/\s/g, '')];

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
      .filter(([key]) => !normalizeText(key).includes('indemnisation'))
      .map(([key, value]) => ({
        name: formatMesureLabel(key),
        fullName: formatMesureLabel(key),
        value: toNumber(value),
      }))
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value - a.value);
  }

  return normalizeCountRows(payload, ['mesure', 'nom', 'type', 'label', 'name'])
    .filter((row) => !normalizeText(row.name).includes('indemnisation'));
};

const DashboardVictimsMpu: React.FC<DashboardVictimsMpuProps> = ({ onSelectAgentReparation, onShowSignedContractVictims }) => {
  const { fetcher } = useFetch();
  const [victims, setVictims] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [progressLoading, setProgressLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<GlobalProgressStats>(EMPTY_PROGRESS);
  const [mpuServerStats, setMpuServerStats] = useState<MpuServerStats>(EMPTY_MPU_SERVER_STATS);
  const [showConsultationsModal, setShowConsultationsModal] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const loadMpuServerStats = async () => {
      setProgressLoading(true);
      try {
        const safeFetch = (endpoint: string) => fetcher(endpoint).catch(() => null);
        const [
          progressResp,
          agentsResp,
          sexeResp,
          trancheAgeResp,
          provinceResp,
          territoireResp,
          prejudiceFinalResp,
          ,
          mesuresResp,
          contratsResp,
        ] = await Promise.all([
          safeFetch('/victime/stats/reparation/globalProgress/MPU'),
          safeFetch('/victime/filtre/agent-reparation/MPU'),
          safeFetch('/victime/stats/sexe/MPU'),
          safeFetch('/victime/stats/tranche-age/MPU'),
          safeFetch('/victime/stats/province/MPU'),
          safeFetch('/victime/stats/territoire/MPU'),
          safeFetch('/victime/stats/prejudice-final/MPU'),
          safeFetch('/victime/stats/total-indemnisation/MPU'),
          safeFetch('/contrat/stats/mesures-reparation/MPU'),
          safeFetch('/contrat/MPU'),
        ]);

        if (!mounted) return;
        setProgress(normalizeGlobalProgress(progressResp));
        setMpuServerStats({
          sexe: normalizeSexeRows(sexeResp),
          trancheAge: normalizeTrancheAgeRows(trancheAgeResp),
          province: normalizeCountRows(provinceResp, ['province']),
          territoire: normalizeCountRows(territoireResp, ['territoire']),
          prejudiceFinal: normalizeCountRows(prejudiceFinalResp, ['prejudiceFinal', 'prejudice_final', 'prejudice', 'libelle']),
          agents: normalizeCountRows(agentsResp, ['agentReparation', 'agent_reparation', 'agent', 'fullName', 'nom']),
          mesures: normalizeMesuresRows(mesuresResp),
          contratsCount: normalizeApiList(contratsResp).length,
        });
      } catch {
        if (mounted) {
          setProgress(EMPTY_PROGRESS);
          setMpuServerStats(EMPTY_MPU_SERVER_STATS);
        }
      } finally {
        if (mounted) setProgressLoading(false);
      }
    };

    loadMpuServerStats();
    return () => {
      mounted = false;
    };
  }, [fetcher]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const cached = await getVictimsFromCache('all-victims-cache');
        if (mounted) setVictims(Array.isArray(cached?.data) ? cached!.data : []);
      } catch {
        if (mounted) setVictims([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const mpuVictims = useMemo(() => victims.filter(isMpuVictim), [victims]);

  const totalMpuFromCache = mpuVictims.length;
  const totalMpu = progress.total > 0 ? progress.total : totalMpuFromCache;
  const officialLoading = progressLoading;

  const provinceRowsFromCache = useMemo(() => {
    const counts = new Map<string, number>();
    mpuVictims.forEach((v) => {
      const province = typeof v?.province === 'string' ? v.province.trim() : '';
      if (province.length > 0) counts.set(province, (counts.get(province) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, fullName: name, value }))
      .sort((a, b) => b.value - a.value);
  }, [mpuVictims]);

  const provinceRows = mpuServerStats.province.length > 0 ? mpuServerStats.province : provinceRowsFromCache;
  const provinces = provinceRows.length;

  const totalConsentement = useMemo(
    () => mpuVictims.filter(hasConsentementSigne).length,
    [mpuVictims]
  );
  const totalRecontactes = useMemo(
    () => mpuVictims.filter((victim) => {
      const hasVictimPhoto = typeof victim?.photo === 'string' && victim.photo.trim().length > 0;
      const hasPieceIdentiteFromProgress = victim?.progression?.hasPieceIdentite === true;
      const hasPieceIdentiteFromDocs = Array.isArray(victim?.documentVictime)
        ? victim.documentVictime.some((d: any) => {
          const label = normalizeText(d?.label ?? d?.type ?? d?.nom);
          return label === "piece d'identite" || label === 'piece identite' || label === 'piece_identite';
        })
        : false;
      return hasVictimPhoto || hasPieceIdentiteFromProgress || hasPieceIdentiteFromDocs;
    }).length,
    [mpuVictims]
  );

  const perSite = useMemo(() => {
    const counts = new Map<string, number>();
    mpuVictims.forEach((v) => {
      const site = getSiteDeplaces(v);
      counts.set(site, (counts.get(site) || 0) + 1);
    });
    const rows = Array.from(counts.entries()).map(([site, count]) => ({
      site,
      count,
      percent: totalMpu > 0 ? Math.round((count / totalMpu) * 100) : 0,
    }));
    rows.sort((a, b) => b.count - a.count);
    return rows;
  }, [mpuVictims, totalMpu]);

  const territoireRows = mpuServerStats.territoire.length > 0
    ? mpuServerStats.territoire
    : perSite.map((row) => ({ name: row.site, fullName: row.site, value: row.count }));
  const topTerritoireRows = territoireRows.slice(0, 8);
  const maxTerritoire = Math.max(1, ...topTerritoireRows.map((row) => row.value));

  const totalFormations = useMemo(() => mpuVictims.filter(hasFormation).length, [mpuVictims]);

  const consultationsList = useMemo(
    () => mpuVictims.filter(hasConsultationMedicale),
    [mpuVictims]
  );
  const totalConsultations = consultationsList.length;
  const totalMesuresCommenceesCache = useMemo(
    () => mpuVictims.filter(hasCommenceMesuresMpu).length,
    [mpuVictims]
  );
  const totalMesuresCommenceesServer = mpuServerStats.mesures.reduce((max, row) => Math.max(max, row.value), 0);
  const totalMesuresCommencees = totalMesuresCommenceesServer || totalMesuresCommenceesCache;

  const consentementCount = progress.contrat.withContrat || mpuServerStats.contratsCount || totalConsentement;
  const recontactedCount = totalRecontactes > 0
    ? totalRecontactes
    : Math.max(progress.photo.withPhoto, progress.piece.withPiece);
  const percentConsentement = totalMpu > 0 ? Math.round((consentementCount / totalMpu) * 100) : 0;
  const percentRecontacted = totalMpu > 0 ? Math.round((recontactedCount / totalMpu) * 100) : 0;
  const percentMesuresCommencees = totalMpu > 0 ? Math.round((totalMesuresCommencees / totalMpu) * 100) : 0;
  const percentFormations = totalMpu > 0 ? Math.round((totalFormations / totalMpu) * 100) : 0;
  const percentConsultations = totalMpu > 0 ? Math.round((totalConsultations / totalMpu) * 100) : 0;

  // Camps = sites uniques (hors "Non renseigné")
  const totalCamps = useMemo(
    () => perSite.filter((s) => s.site !== 'Non renseigné').length,
    [perSite]
  );

  // Cliniques mobiles déployées (uniques par nom/id, ou nombre de sites couverts à défaut)
  const cliniqueVictims = useMemo(() => mpuVictims.filter(hasCliniqueMobile), [mpuVictims]);
  const totalPriseEnChargeCM = cliniqueVictims.length;
  const totalCliniquesMobiles = useMemo(() => {
    const uniqueNamed = new Set<string>();
    cliniqueVictims.forEach((v) => {
      const id = getCliniqueMobileId(v);
      if (id) uniqueNamed.add(id.toLowerCase());
    });
    if (uniqueNamed.size > 0) return uniqueNamed.size;
    // fallback: nombre de sites distincts où au moins une victime a été prise en charge
    const sites = new Set<string>();
    cliniqueVictims.forEach((v) => {
      const s = getSiteDeplaces(v);
      if (s && s !== 'Non renseigné') sites.add(s);
    });
    return sites.size;
  }, [cliniqueVictims]);

  // Répartition sexe
  const sexeStats = useMemo(() => {
    let femmes = 0;
    let hommes = 0;
    let autres = 0;
    mpuVictims.forEach((v) => {
      const s = typeof v?.sexe === 'string' ? v.sexe.trim().toLowerCase() : '';
      if (s.startsWith('f')) femmes += 1;
      else if (s.startsWith('h') || s.startsWith('m')) hommes += 1;
      else autres += 1;
    });
    return { femmes, hommes, autres };
  }, [mpuVictims]);
  const sexeRows = mpuServerStats.sexe.length > 0
    ? mpuServerStats.sexe
    : [
      { name: 'Femmes', fullName: 'Femmes', value: sexeStats.femmes },
      { name: 'Hommes', fullName: 'Hommes', value: sexeStats.hommes },
      ...(sexeStats.autres > 0 ? [{ name: 'Non précisé', fullName: 'Non précisé', value: sexeStats.autres }] : []),
    ].filter((row) => row.value > 0);

  // Répartition tranches d'âge
  const ageBuckets = useMemo(() => {
    const order = ['0–4', '5–17', '18–34', '35–59', '60+', 'Inconnu'];
    const counts = new Map<string, number>();
    order.forEach((k) => counts.set(k, 0));
    mpuVictims.forEach((v) => {
      const b = getAgeBucket(computeAge(v));
      counts.set(b, (counts.get(b) || 0) + 1);
    });
    return order.map((k) => ({ bucket: k, count: counts.get(k) || 0 }));
  }, [mpuVictims]);
  const ageRows = mpuServerStats.trancheAge.length > 0
    ? mpuServerStats.trancheAge
    : ageBuckets.map((bucket) => ({ name: bucket.bucket, fullName: bucket.bucket, value: bucket.count }));
  const maxAge = Math.max(1, ...ageRows.map((row) => row.value));
  const prejudiceRows = mpuServerStats.prejudiceFinal.slice(0, 6);
  const maxPrejudice = Math.max(1, ...prejudiceRows.map((row) => row.value));
  const mesureRows = mpuServerStats.mesures.slice(0, 6);
  const maxMesure = Math.max(1, ...mesureRows.map((row) => row.value));
  const agentRows = mpuServerStats.agents.slice(0, 6);
  const maxAgent = Math.max(1, ...agentRows.map((row) => row.value));

  const totalVulnerables = useMemo(() => mpuVictims.filter(isVulnerable).length, [mpuVictims]);
  const percentVulnerables = totalMpu > 0 ? Math.round((totalVulnerables / totalMpu) * 100) : 0;
  const percentCM = totalMpu > 0 ? Math.round((totalPriseEnChargeCM / totalMpu) * 100) : 0;

  return (
    <div className="w-full px-6 py-8 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="mb-6 flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-orange-50">
          <FiAlertCircle className="text-orange-600" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord — Victimes MPU</h1>
          <p className="text-sm text-gray-600">Mesure Provisoire Urgente — vue d’ensemble et indicateurs clés.</p>
        </div>
      </div>

      {/* KPI principaux */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <KpiCard
          title="Recontacté (photo et/ou pièce)"
          value={officialLoading && loading ? '…' : recontactedCount.toLocaleString()}
          icon={<FiCamera className="text-white" size={18} />}
          color="bg-sky-500"
          subtitle={`${percentRecontacted}% des MPU`}
          loading={officialLoading && loading}
        />
        <KpiCard
          title="Actes de consentement"
          value={officialLoading && loading ? '…' : consentementCount.toLocaleString()}
          icon={<FiFileText className="text-white" size={18} />}
          color="bg-emerald-500"
          subtitle={`${percentConsentement}% des MPU`}
          loading={officialLoading && loading}
          onClick={onShowSignedContractVictims}
        />
        <KpiCard
          title="A commencé à bénéficier des mesures"
          value={officialLoading && loading ? '…' : totalMesuresCommencees.toLocaleString()}
          icon={<FiActivity className="text-white" size={18} />}
          color="bg-orange-500"
          subtitle={`${percentMesuresCommencees}% des MPU`}
          loading={officialLoading && loading}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <KpiCard
          title="Total victimes MPU"
          value={officialLoading ? '…' : totalMpu.toLocaleString()}
          icon={<FiUsers className="text-white" size={18} />}
          color="bg-indigo-500"
          subtitle="Source officielle MPU"
          loading={officialLoading}
        />
        <KpiCard
          title="Provinces couvertes"
          value={officialLoading && loading ? '…' : provinces}
          icon={<FiMapPin className="text-white" size={18} />}
          color="bg-purple-500"
          subtitle="Statistiques province MPU"
          loading={officialLoading && loading}
        />
        <KpiCard
          title="Territoires couverts"
          value={officialLoading && loading ? '…' : territoireRows.length.toLocaleString()}
          icon={<FiHome className="text-white" size={18} />}
          color="bg-teal-500"
          subtitle="Statistiques territoire MPU"
          loading={officialLoading && loading}
        />
      </div>

      {/* Répartition territoriale */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-primary-50">
            <FiActivity className="text-primary-600" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Répartition territoriale des victimes MPU
            </h3>
            <p className="text-sm text-gray-600">
              Données par territoire, avec secours sur les sites terrain quand l’API est vide.
              {totalMpu > 0 ? (
                <span className="ml-1 font-medium text-gray-800">
                  Base: {totalMpu.toLocaleString()} victime{totalMpu > 1 ? 's' : ''} MPU.
                </span>
              ) : null}
            </p>
          </div>
        </div>

        {officialLoading && loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 bg-gray-100 animate-pulse rounded" />
            ))}
          </div>
        ) : topTerritoireRows.length === 0 ? (
          <div className="text-sm text-gray-500 italic">Aucune donnée territoriale disponible.</div>
        ) : (
          <div className="space-y-4">
            {topTerritoireRows.map((row) => {
              const pct = totalMpu > 0 ? Math.round((row.value / totalMpu) * 100) : 0;
              const width = Math.round((row.value / maxTerritoire) * 100);
              return (
              <div key={row.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium text-gray-800 truncate pr-3">{row.name}</div>
                  <div className="text-sm whitespace-nowrap">
                    <span className="font-semibold text-gray-900">{row.value.toLocaleString()}</span>
                    <span className="text-gray-500"> / {totalMpu.toLocaleString()}</span>
                    <span className="ml-2 text-xs font-bold text-primary-700">{pct}%</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-600 transition-all duration-500"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>

      {/* Formations + Consultations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <KpiCard
          title="Victimes formées"
          value={loading ? '…' : totalFormations.toLocaleString()}
          icon={<FiBookOpen className="text-white" size={18} />}
          color="bg-amber-500"
          subtitle={`${percentFormations}% des victimes MPU`}
          loading={loading}
        />
        <KpiCard
          title="Consultations médicales"
          value={loading ? '…' : totalConsultations.toLocaleString()}
          icon={<FiCheckCircle className="text-white" size={18} />}
          color="bg-rose-500"
          subtitle={
            totalConsultations > 0
              ? `${percentConsultations}% — cliquer pour voir la liste`
              : `${percentConsultations}% des victimes MPU`
          }
          loading={loading}
          onClick={totalConsultations > 0 ? () => setShowConsultationsModal(true) : undefined}
        />
      </div>

      {/* KPIs opérationnels : Camps, Cliniques mobiles, Prises en charge CM, Vulnérables */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Camps de déplacés"
          value={loading ? '…' : totalCamps.toLocaleString()}
          icon={<FiHome className="text-white" size={18} />}
          color="bg-indigo-500"
          subtitle="Sites identifiés"
          loading={loading}
        />
        <KpiCard
          title="Cliniques mobiles"
          value={loading ? '…' : totalCliniquesMobiles.toLocaleString()}
          icon={<FiTruck className="text-white" size={18} />}
          color="bg-cyan-500"
          subtitle="Déploiements"
          loading={loading}
        />
        <KpiCard
          title="Pris en charge (Clinique mobile)"
          value={loading ? '…' : totalPriseEnChargeCM.toLocaleString()}
          icon={<FiHeart className="text-white" size={18} />}
          color="bg-teal-500"
          subtitle={`${percentCM}% des victimes MPU`}
          loading={loading}
        />
        <KpiCard
          title="Victimes vulnérables"
          value={loading ? '…' : totalVulnerables.toLocaleString()}
          icon={<FiShield className="text-white" size={18} />}
          color="bg-red-500"
          subtitle={`${percentVulnerables}% — enfants, 60+, enceintes, handicap`}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-orange-50">
              <FiActivity className="text-orange-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Mesures enregistrées</h3>
              <p className="text-sm text-gray-600">Actes de consentement avec mesures MPU acceptées.</p>
            </div>
          </div>
          {officialLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : mesureRows.length === 0 ? (
            <div className="text-sm text-gray-500 italic">Aucune mesure enregistrée côté serveur.</div>
          ) : (
            <div className="space-y-3">
              {mesureRows.map((row, idx) => {
                const pct = Math.round((row.value / maxMesure) * 100);
                const palette = ['bg-orange-500', 'bg-teal-500', 'bg-cyan-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500'];
                return (
                  <div key={row.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800 truncate pr-3">{row.name}</span>
                      <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{row.value.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${palette[idx % palette.length]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-indigo-50">
              <FiUsers className="text-indigo-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Victimes par agent de réparation</h3>
              <p className="text-sm text-gray-600">Répartition issue de l’endpoint agent-réparation MPU.</p>
            </div>
          </div>
          {officialLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : agentRows.length === 0 ? (
            <div className="text-sm text-gray-500 italic">Aucune donnée agent disponible.</div>
          ) : (
            <div className="space-y-3">
              {agentRows.map((row) => {
                const pct = Math.round((row.value / maxAgent) * 100);
                return (
                  <button
                    key={row.name}
                    type="button"
                    onClick={() => onSelectAgentReparation?.(row.fullName || row.name)}
                    className="w-full text-left rounded-md border border-transparent p-1 transition-colors hover:border-indigo-100 hover:bg-indigo-50/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800 truncate pr-3">{row.name}</span>
                      <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{row.value.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Préjudices + Répartition sexe + âge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-red-50">
              <FiTrendingUp className="text-red-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Préjudices finaux les plus fréquents</h3>
              <p className="text-sm text-gray-600">Statistiques préjudice final filtrées sur MPU.</p>
            </div>
          </div>
          {officialLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-6 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : prejudiceRows.length === 0 ? (
            <div className="text-sm text-gray-500 italic">Aucune donnée de préjudice final disponible.</div>
          ) : (
            <div className="space-y-3">
              {prejudiceRows.map((row, idx) => {
                const pct = Math.round((row.value / maxPrejudice) * 100);
                const palette = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-rose-500', 'bg-fuchsia-500', 'bg-pink-500'];
                return (
                  <div key={row.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white ${palette[idx % palette.length]}`}>
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-800 truncate">{row.name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                        {row.value.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${palette[idx % palette.length]} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Répartition sexe */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-pink-50">
              <FiUser className="text-pink-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Répartition par sexe</h3>
          </div>
          {officialLoading && loading ? (
            <div className="h-24 bg-gray-100 animate-pulse rounded" />
          ) : sexeRows.length === 0 ? (
            <div className="text-sm text-gray-500 italic">Aucune donnée de sexe disponible.</div>
          ) : (
            <div className="space-y-3">
              {sexeRows.map((row, idx) => {
                const pct = totalMpu > 0 ? Math.round((row.value / totalMpu) * 100) : 0;
                const colors = [
                  { bar: 'bg-pink-500', text: 'text-pink-700' },
                  { bar: 'bg-blue-500', text: 'text-blue-700' },
                  { bar: 'bg-gray-400', text: 'text-gray-700' },
                ];
                const visual = colors[idx % colors.length];
                return (
                  <div key={row.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800">{row.name}</span>
                      <span className="text-sm text-gray-700">
                        <span className="font-bold text-gray-900">{row.value.toLocaleString()}</span>
                        <span className={`ml-2 text-xs font-bold ${visual.text}`}>{pct}%</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${visual.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tranches d'âge */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-amber-50">
            <FiUsers className="text-amber-600" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Répartition par tranches d’âge</h3>
            <p className="text-sm text-gray-600">Âge calculé à partir de la date de naissance.</p>
          </div>
        </div>
        {officialLoading && loading ? (
          <div className="h-24 bg-gray-100 animate-pulse rounded" />
        ) : ageRows.length === 0 ? (
          <div className="text-sm text-gray-500 italic">Aucune donnée d’âge disponible.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {ageRows.map((row) => {
              const pct = totalMpu > 0 ? Math.round((row.value / totalMpu) * 100) : 0;
              const heightPct = Math.round((row.value / maxAge) * 100);
              return (
                <div key={row.name} className="rounded-md border border-gray-100 bg-gray-50 p-3 flex flex-col">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{row.name}</div>
                  <div className="text-xl font-bold text-gray-900 mt-1 leading-none">{row.value.toLocaleString()}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{pct}% des MPU</div>
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${heightPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal consultations médicales */}
      {showConsultationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-rose-50">
                  <FiCheckCircle className="text-rose-600" size={18} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900">Consultations médicales — Victimes MPU</h4>
                  <p className="text-xs text-gray-500">{totalConsultations.toLocaleString()} victime(s) concernée(s)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConsultationsModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label="Fermer"
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {consultationsList.length === 0 ? (
                <div className="text-sm text-gray-500 italic">Aucune consultation enregistrée.</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {consultationsList.map((v: any) => (
                    <li key={v?.id ?? getVictimFullName(v)} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{getVictimFullName(v)}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {[v?.province, v?.territoire, getSiteDeplaces(v)]
                            .filter((x) => typeof x === 'string' && x.length > 0 && x !== 'Non renseigné')
                            .join(' • ') || 'Localisation non renseignée'}
                        </div>
                      </div>
                      {v?.reference ? (
                        <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
                          {v.reference}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowConsultationsModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Cliniques mobiles + MUSO/AVEC ─── */}
      <div className="mt-8">
        <MpuCliniquesSection />
      </div>
    </div>
  );
};

export default DashboardVictimsMpu;
