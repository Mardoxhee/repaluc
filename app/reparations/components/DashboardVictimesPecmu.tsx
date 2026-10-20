'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, BellRing, HeartPulse, FolderCheck, Network, Activity, ShieldCheck, BedDouble } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import StatCard from './dashboard/StatCard';
import { getFichePecmuStatistics, type PecmuStatistics } from '../services/pecmuApi';
import { pecmuRequest } from '../services/pecmuWorkflowApi';

interface DashboardVictimesPecmuProps {
  onSelectAgentReparation?: (fullName: string) => void;
  onShowRecontactedVictims?: () => void;
  onShowSignedContractVictims?: () => void;
}
const colors = { blue: '#007fba', plum: '#901c67', green: '#059669', amber: '#d97706', slate: '#64748b' };
const panelClass = 'min-w-0 rounded-lg border border-slate-200/70 bg-white p-5 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.55)] md:p-6';
type Metric = { key: string; label: string; color: string };
const decisions: Metric[] = [
  { key: 'certified', label: 'Certifiées', color: colors.blue },
  { key: 'notCertified', label: 'Non certifiées', color: colors.slate },
  { key: 'eligible', label: 'Éligibles', color: colors.plum },
  { key: 'notEligible', label: 'Non éligibles', color: colors.amber },
];
const outcomes: Metric[] = [
  { key: 'stabilizedOrCured', label: 'Stabilisées / guéries', color: colors.green },
  { key: 'deceased', label: 'Décédées', color: colors.slate },
  { key: 'transferred', label: 'Transférées', color: colors.blue },
  { key: 'lostToFollowUp', label: 'Perdues de vue', color: colors.amber },
];
function MetricChart({ metrics, stats, loading }: { metrics: Metric[]; stats: PecmuStatistics | null; loading: boolean }) {
  const data = metrics.map(metric => ({ ...metric, value: stats?.[metric.key] != null && stats[metric.key] !== '' && Number.isFinite(Number(stats[metric.key])) ? Number(stats[metric.key]) : null }));
  const hasValues = data.some(row => row.value !== null);
  const hasPositiveValues = data.some(row => (row.value ?? 0) > 0);
  return <>
    <div className="h-64 w-full" aria-hidden="true">
      {loading ? <div className="flex h-full items-end gap-5 py-5 motion-safe:animate-pulse">{[45, 70, 35, 55].map((height, i) => <div key={i} className="flex-1 rounded-t-md bg-slate-100" style={{ height: `${height}%` }} />)}</div>
        : !hasValues ? <div className="flex h-full items-center justify-center text-sm text-slate-500">Données indisponibles</div>
          : <ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 0, left: 0 }} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" allowDecimals={false} domain={hasPositiveValues ? [0, 'auto'] : [0, 1]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
            <Bar dataKey="value" name="Dossiers" barSize={22} radius={[0, 5, 5, 0]} isAnimationActive={false}>{data.map(row => <Cell key={row.key} fill={row.color} />)}</Bar>
          </BarChart></ResponsiveContainer>}
    </div>
    <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">{data.map(row => <div key={row.key} className="flex items-start justify-between gap-2 text-sm"><dt className="flex items-center gap-2 text-slate-500"><span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ background: row.color }} />{row.label}</dt><dd className="font-bold tabular-nums text-slate-900">{loading ? '…' : row.value?.toLocaleString('fr-FR') ?? '—'}</dd></div>)}</dl>
  </>;
}

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
      <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Prise en charge médicale urgente</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Tableau de bord PECMU</h2><p className="mt-1 text-sm text-slate-500">Alertes, parcours de soins et devenir des victimes.</p></div>
      <button type="button" disabled={loading} onClick={() => setAttempt(value => value + 1)} className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-white px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/5 disabled:opacity-40"><RefreshCw size={17} className={loading ? 'motion-safe:animate-spin' : ''} />Actualiser</button>
    </header>
    {loading && <p role="status" className="sr-only">Chargement des statistiques…</p>}
    {error ? <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<button type="button" onClick={() => setAttempt(value => value + 1)} className="ml-3 font-semibold underline">Réessayer</button></div> : <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Alertes enregistrées" value={count('total')} icon={<BellRing size={20} className="text-white" />} color="bg-primary" subtitle="Dossiers actifs" loading={loading} />
        <StatCard title="Victimes prises en charge" value={count('treated')} icon={<HeartPulse size={20} className="text-white" />} color="bg-secondary" subtitle="Tous épisodes de soins confondus" loading={loading} />
        <StatCard title="Dossiers clôturés" value={count('closed')} icon={<FolderCheck size={20} className="text-white" />} color="bg-emerald-600" subtitle="Parcours PECMU clôturés" loading={loading} />
        <StatCard title="Victimes orientées" value={count('orientedToOtherPrograms')} icon={<Network size={20} className="text-white" />} color="bg-indigo-500" subtitle="Vers d’autres programmes" loading={loading} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className={panelClass}><div className="mb-3 flex items-center gap-3"><span className="rounded-md bg-primary/10 p-2.5 text-primary"><ShieldCheck size={21} /></span><div><h3 className="text-lg font-bold text-slate-900">Certification et éligibilité</h3><p className="text-xs text-slate-500">Validation des alertes et décisions du pool médical</p></div></div><MetricChart metrics={decisions} stats={stats} loading={loading} /></section>
        <section className={panelClass}><div className="mb-3 flex items-center gap-3"><span className="rounded-md bg-secondary/10 p-2.5 text-secondary"><Activity size={21} /></span><div><h3 className="text-lg font-bold text-slate-900">Évolution des victimes</h3><p className="text-xs text-slate-500">Issues médicales enregistrées</p></div></div><MetricChart metrics={outcomes} stats={stats} loading={loading} /></section>
      </div>
      <section className={panelClass}>
        <div className="mb-5 flex items-center gap-3"><span className="rounded-md bg-primary/10 p-2.5 text-primary"><BedDouble size={21} /></span><div><h3 className="text-lg font-bold text-slate-900">Modalités de prise en charge</h3><p className="text-xs text-slate-500">Nombre de victimes par modalité de soins</p></div></div>
        <div className="grid gap-5 md:grid-cols-2">{[{ key: 'hospitalized', label: 'Hospitalisées', color: colors.plum }, { key: 'nonHospitalized', label: 'Non hospitalisées', color: colors.blue }].map(metric => {
          const max = Math.max(Number(stats?.hospitalized) || 0, Number(stats?.nonHospitalized) || 0);
          const width = !loading && max > 0 ? Math.min(100, Math.max(0, Number(stats?.[metric.key]) || 0) / max * 100) : 0;
          return <div key={metric.key} className="rounded-md border border-slate-100 bg-slate-50 p-4"><div className="mb-4 flex items-center justify-between gap-3"><span className="text-sm font-medium text-slate-600">{metric.label}</span><span className="text-2xl font-black tabular-nums text-slate-950">{loading ? '…' : count(metric.key)}</span></div><div aria-hidden="true" className="h-3 overflow-hidden rounded-full bg-slate-200/70"><div className="h-full rounded-full" style={{ width: `${width}%`, background: metric.color }} /></div></div>;
        })}</div>
      </section>
      {!loading && stats && <p className="text-xs leading-relaxed text-slate-500">Comptage par victime/dossier distinct. Alertes supprimées exclues. Un dossier peut avoir plusieurs modalités ou issues successives : les catégories ne s’additionnent pas.</p>}
    </>}
  </div>;
}
