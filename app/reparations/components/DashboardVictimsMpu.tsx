"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiAlertCircle,
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

interface DashboardVictimsMpuProps {
  onSelectAgentReparation?: (fullName: string) => void;
  onShowRecontactedVictims?: () => void;
}

const isMpuVictim = (victim: any): boolean => {
  const statusValue = typeof victim?.status === 'string' ? victim.status.trim().toLowerCase() : '';
  const categorieValue = typeof victim?.categorie === 'string' ? victim.categorie.trim().toLowerCase() : '';
  const programmeValue = typeof victim?.programme === 'string' ? victim.programme.trim().toLowerCase() : '';
  return (
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

const getCliniqueMobileId = (victim: any): string | null => {
  const raw =
    victim?.cliniqueMobileNom ||
    victim?.cliniqueMobile ||
    victim?.cliniqueMobileDeploiement ||
    '';
  const value = typeof raw === 'string' ? raw.trim() : '';
  return value.length > 0 ? value : null;
};

const collectMaladies = (victim: any): string[] => {
  const out: string[] = [];
  const pushStr = (v: any) => {
    if (typeof v === 'string' && v.trim().length > 0) out.push(v.trim());
  };
  if (Array.isArray(victim?.maladies)) victim.maladies.forEach(pushStr);
  if (Array.isArray(victim?.pathologies)) victim.pathologies.forEach(pushStr);
  if (Array.isArray(victim?.diagnostics)) victim.diagnostics.forEach((d: any) => {
    if (typeof d === 'string') pushStr(d);
    else pushStr(d?.libelle || d?.nom || d?.diagnostic);
  });
  if (Array.isArray(victim?.consultationsMedicales)) victim.consultationsMedicales.forEach((c: any) => {
    pushStr(c?.diagnostic || c?.maladie || c?.pathologie);
  });
  pushStr(victim?.diagnostic);
  pushStr(victim?.maladie);
  return out;
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

const KpiCard: React.FC<KpiProps> = ({ title, value, icon, color, subtitle, loading, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className={`text-left bg-white rounded-2xl shadow-sm border border-gray-100 p-5 transition-all duration-200 ${onClick ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : 'cursor-default'
      }`}
  >
    <div className="flex items-center gap-3 mb-3">
      <div className={`p-2.5 rounded-xl ${color} shadow-sm`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
        {subtitle ? <p className="text-[11px] text-gray-500 truncate">{subtitle}</p> : null}
      </div>
    </div>
    {loading ? (
      <div className="h-8 w-24 bg-gray-100 animate-pulse rounded" />
    ) : (
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    )}
  </button>
);

const DashboardVictimsMpu: React.FC<DashboardVictimsMpuProps> = () => {
  const [victims, setVictims] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showConsultationsModal, setShowConsultationsModal] = useState<boolean>(false);

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

  const totalMpu = mpuVictims.length;

  const provinces = useMemo(() => {
    const set = new Set<string>();
    mpuVictims.forEach((v) => {
      const p = typeof v?.province === 'string' ? v.province.trim() : '';
      if (p.length > 0) set.add(p);
    });
    return set.size;
  }, [mpuVictims]);

  const totalConsentement = useMemo(
    () => mpuVictims.filter(hasConsentementSigne).length,
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

  const totalFormations = useMemo(() => mpuVictims.filter(hasFormation).length, [mpuVictims]);

  const consultationsList = useMemo(
    () => mpuVictims.filter(hasConsultationMedicale),
    [mpuVictims]
  );
  const totalConsultations = consultationsList.length;

  const percentConsentement = totalMpu > 0 ? Math.round((totalConsentement / totalMpu) * 100) : 0;
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

  // Top maladies / diagnostics
  const topMaladies = useMemo(() => {
    const counts = new Map<string, number>();
    mpuVictims.forEach((v) => {
      collectMaladies(v).forEach((m) => {
        const key = m.trim();
        if (!key) return;
        const normalized = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
        counts.set(normalized, (counts.get(normalized) || 0) + 1);
      });
    });
    const rows = Array.from(counts.entries()).map(([nom, count]) => ({ nom, count }));
    rows.sort((a, b) => b.count - a.count);
    return rows.slice(0, 6);
  }, [mpuVictims]);
  const maxMaladie = topMaladies[0]?.count || 0;

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
  const maxAge = Math.max(1, ...ageBuckets.map((b) => b.count));

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

      {/* KPI classiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <KpiCard
          title="Total victimes MPU"
          value={loading ? '…' : totalMpu.toLocaleString()}
          icon={<FiUsers className="text-white" size={18} />}
          color="bg-orange-500"
          subtitle="Victimes enregistrées"
          loading={loading}
        />
        <KpiCard
          title="Provinces couvertes"
          value={loading ? '…' : provinces}
          icon={<FiMapPin className="text-white" size={18} />}
          color="bg-purple-500"
          subtitle="Zones géographiques"
          loading={loading}
        />
        <KpiCard
          title="Acte de consentement signé"
          value={loading ? '…' : `${totalConsentement.toLocaleString()}`}
          icon={<FiFileText className="text-white" size={18} />}
          color="bg-emerald-500"
          subtitle={`${percentConsentement}% des victimes MPU`}
          loading={loading}
        />
      </div>

      {/* Progression par site de déplacés */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-primary-50">
            <FiActivity className="text-primary-600" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Progression générale des victimes MPU
            </h3>
            <p className="text-sm text-gray-600">
              Répartition par sites de déplacés — en nombre et en pourcentage.
              {totalMpu > 0 ? (
                <span className="ml-1 font-medium text-gray-800">
                  Base: {totalMpu.toLocaleString()} victime{totalMpu > 1 ? 's' : ''} MPU.
                </span>
              ) : null}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 bg-gray-100 animate-pulse rounded" />
            ))}
          </div>
        ) : perSite.length === 0 ? (
          <div className="text-sm text-gray-500 italic">Aucune donnée de site disponible.</div>
        ) : (
          <div className="space-y-4">
            {perSite.map((row) => (
              <div key={row.site}>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium text-gray-800 truncate pr-3">{row.site}</div>
                  <div className="text-sm whitespace-nowrap">
                    <span className="font-semibold text-gray-900">{row.count.toLocaleString()}</span>
                    <span className="text-gray-500"> / {totalMpu.toLocaleString()}</span>
                    <span className="ml-2 text-xs font-bold text-primary-700">{row.percent}%</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-600 transition-all duration-500"
                    style={{ width: `${row.percent}%` }}
                  />
                </div>
              </div>
            ))}
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

      {/* Tendance maladies + Répartition sexe + âge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Top maladies */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-red-50">
              <FiTrendingUp className="text-red-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Maladies les plus récurrentes</h3>
              <p className="text-sm text-gray-600">Top diagnostics observés chez les victimes MPU.</p>
            </div>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-6 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : topMaladies.length === 0 ? (
            <div className="text-sm text-gray-500 italic">Aucun diagnostic disponible dans les données.</div>
          ) : (
            <div className="space-y-3">
              {topMaladies.map((m, idx) => {
                const pct = maxMaladie > 0 ? Math.round((m.count / maxMaladie) * 100) : 0;
                const palette = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-rose-500', 'bg-fuchsia-500', 'bg-pink-500'];
                return (
                  <div key={m.nom}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white ${palette[idx % palette.length]}`}>
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-800 truncate">{m.nom}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                        {m.count.toLocaleString()}
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-pink-50">
              <FiUser className="text-pink-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Répartition par sexe</h3>
          </div>
          {loading ? (
            <div className="h-24 bg-gray-100 animate-pulse rounded" />
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Femmes', value: sexeStats.femmes, color: 'bg-pink-500', text: 'text-pink-700' },
                { label: 'Hommes', value: sexeStats.hommes, color: 'bg-blue-500', text: 'text-blue-700' },
                ...(sexeStats.autres > 0
                  ? [{ label: 'Non précisé', value: sexeStats.autres, color: 'bg-gray-400', text: 'text-gray-700' }]
                  : []),
              ].map((r) => {
                const pct = totalMpu > 0 ? Math.round((r.value / totalMpu) * 100) : 0;
                return (
                  <div key={r.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800">{r.label}</span>
                      <span className="text-sm text-gray-700">
                        <span className="font-bold text-gray-900">{r.value.toLocaleString()}</span>
                        <span className={`ml-2 text-xs font-bold ${r.text}`}>{pct}%</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${r.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tranches d'âge */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-amber-50">
            <FiUsers className="text-amber-600" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Répartition par tranches d’âge</h3>
            <p className="text-sm text-gray-600">Âge calculé à partir de la date de naissance.</p>
          </div>
        </div>
        {loading ? (
          <div className="h-24 bg-gray-100 animate-pulse rounded" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {ageBuckets.map((b) => {
              const pct = totalMpu > 0 ? Math.round((b.count / totalMpu) * 100) : 0;
              const heightPct = maxAge > 0 ? Math.round((b.count / maxAge) * 100) : 0;
              return (
                <div key={b.bucket} className="rounded-xl border border-gray-100 bg-gray-50 p-3 flex flex-col">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{b.bucket}</div>
                  <div className="text-xl font-bold text-gray-900 mt-1 leading-none">{b.count.toLocaleString()}</div>
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
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
    </div>
  );
};

export default DashboardVictimsMpu;
