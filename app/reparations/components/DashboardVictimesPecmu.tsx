'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { getFichePecmuStatistics, type PecmuStatistics } from '../services/pecmuApi';
import { pecmuRequest } from '../services/pecmuWorkflowApi';

interface DashboardVictimesPecmuProps {
  onSelectAgentReparation?: (fullName: string) => void;
  onShowRecontactedVictims?: () => void;
  onShowSignedContractVictims?: () => void;
}
const stages = [
  { title: 'Alertes et certification', description: 'Entrée des dossiers dans le parcours PECMU.', metrics: [['total', 'Alertes enregistrées'], ['certified', 'Certifiées'], ['notCertified', 'Non certifiées']] },
  { title: 'Décision du pool médical', description: 'Éligibilité des dossiers examinés.', metrics: [['eligible', 'Éligibles'], ['notEligible', 'Non éligibles']] },
  { title: 'Prise en charge médicale', description: 'Victimes prises en charge, quel que soit le nombre de séjours.', metrics: [['treated', 'Victimes prises en charge'], ['hospitalized', 'Hospitalisées'], ['nonHospitalized', 'Non hospitalisées']] },
  { title: 'Évolution', description: 'Issues médicales enregistrées dans les dossiers.', metrics: [['stabilizedOrCured', 'Stabilisées ou guéries'], ['deceased', 'Décédées'], ['transferred', 'Transférées'], ['lostToFollowUp', 'Perdues de vue']] },
  { title: 'Clôture et orientation', description: 'Suite du parcours après la prise en charge.', metrics: [['closed', 'Dossiers clôturés'], ['orientedToOtherPrograms', 'Orientées vers d’autres programmes']] },
];

export default function DashboardVictimesPecmu(_props: DashboardVictimesPecmuProps) {
  const [stats, setStats] = useState<PecmuStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setStats(null);
    getFichePecmuStatistics(pecmuRequest).then(result => {
      if (!result) throw new Error('Les statistiques PECMU sont indisponibles.');
      if (active) setStats(result);
    }).catch(e => { if (active) setError(e.message || 'Impossible de charger les statistiques PECMU.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  const count = (key: string) => {
    const value = stats?.[key];
    if (value == null || value === '' || !Number.isFinite(Number(value))) return '—';
    return Number(value).toLocaleString('fr-FR');
  };
  return <div className="space-y-6" aria-busy={loading}>
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-2xl font-bold text-slate-950">Tableau de bord PECMU</h2><p className="mt-1 text-sm text-slate-500">Des alertes enregistrées aux orientations après la prise en charge.</p></div>
      <button type="button" disabled={loading} onClick={() => setAttempt(value => value + 1)} className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-white px-3 py-2 text-sm font-semibold text-primary disabled:opacity-40"><RefreshCw size={17} className={loading ? 'animate-spin motion-reduce:animate-none' : ''} />Actualiser</button>
    </header>
    {loading && <p role="status" className="text-sm text-slate-500">Chargement des statistiques…</p>}
    {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<button type="button" onClick={() => setAttempt(value => value + 1)} className="ml-3 font-semibold underline">Réessayer</button></div>}
    {!error && stages.map((stage, index) => <section key={stage.title} className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">{index + 1}</span><div><h3 className="font-semibold text-slate-900">{stage.title}</h3><p className="mt-1 text-xs text-slate-500">{stage.description}</p></div></div>
      <dl className={`grid gap-3 sm:grid-cols-2 ${stage.metrics.length === 4 ? 'xl:grid-cols-4' : stage.metrics.length === 3 ? 'xl:grid-cols-3' : ''}`}>{stage.metrics.map(([key, label]) => <div key={key} className="rounded-md border border-slate-100 bg-slate-50 p-4"><dt className="text-sm font-medium text-slate-600">{label}</dt><dd className="mt-2 text-3xl font-bold tabular-nums text-primary">{loading ? '…' : count(key)}</dd></div>)}</dl>
    </section>)}
    {!loading && stats && <p className="text-xs leading-relaxed text-slate-500">Les alertes supprimées sont exclues. Les indicateurs médicaux comptent les victimes/dossiers distincts, même en cas de prises en charge multiples. Les catégories peuvent se recouper et ne doivent pas être additionnées.</p>}
  </div>;
}
