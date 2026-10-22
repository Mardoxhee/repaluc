'use client';
import { authenticatedFetch } from '../../utils/authFetch';
import { useFetch } from '../../context/FetchContext';
import { normalizeApiList } from '../utils/mentionStats';
import styles from './VictimProgression.module.css';
import { Activity, HeartPulse, Brain, BriefcaseBusiness, Wallet, FolderCheck, ShieldCheck, FileSignature, RefreshCw, CheckCircle2, Clock3, Circle, ArrowUpRight, Save, Plus, Pencil, Trash2, CalendarDays, MapPin, Upload, Landmark, ChevronRight, AlertCircle, LockKeyhole, type LucideIcon } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { getPecmuPermissions } from '../services/pecmuWorkflowApi';
import { progressionRequest, progressionPath, progressionFields, progressionChanges, ProgressionError, type Programme, type ProgressionPatch, type VictimProgression as Snapshot } from '../services/victimProgressionApi';

const labels: Record<string, string> = { NOT_EVALUATED: 'Non évaluée', EVALUATED: 'Évaluée', NOT_STARTED: 'Non commencée', PLANNED: 'Planifiée', STARTED: 'Commencée', IN_PROGRESS: 'En cours', COMPLETED: 'Terminée', CANCELLED: 'Annulée', TRADE: 'Métier', FORMAL_EDUCATION: 'Éducation formelle', LITERACY: 'Alphabétisation', OTHER: 'Autre formation' };
const input = styles.input;
const button = styles.button;
const statuses = ['NOT_STARTED', 'STARTED', 'COMPLETED'];
const text = (v: unknown) => v === null || v === undefined || v === '' ? 'Non renseigné' : String(v);
const money = (v: number) => Number(v).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
const dateLabel = (value?: string | null) => {
  if (!value) return 'Non renseignée';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Kinshasa' });
};
const cardDesign = (title: string): { icon: LucideIcon; tone: string; subtitle?: string } => {
  if (title.includes('médicale')) return { icon: HeartPulse, tone: 'blue', subtitle: title.includes('Cliniques') ? 'Historique des passages et des soins' : 'Évaluations et continuité des soins' };
  if (title.includes('psychologique')) return { icon: Brain, tone: 'plum', subtitle: 'Accompagnement et suivi psychologique' };
  if (title.includes('économique')) return { icon: BriefcaseBusiness, tone: 'teal', subtitle: 'Formation, autonomie et activités de revenus' };
  if (title.includes('Indemnisation')) return { icon: Wallet, tone: 'blue', subtitle: 'Versements et échéancier de réparation' };
  if (title.includes('MUSO')) return { icon: Landmark, tone: 'teal', subtitle: 'Adhésion et historique des contributions' };
  if (title.includes('préjudices')) return { icon: ShieldCheck, tone: 'plum' };
  if (title.includes('Documents')) return { icon: FolderCheck, tone: 'blue' };
  return { icon: FileSignature, tone: 'plum' };
};
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  const { icon: Icon, tone, subtitle } = cardDesign(title);
  return <section className={styles.card} data-tone={tone}>
    <header className={styles.cardHeading}><span className={styles.iconTile}><Icon size={19} strokeWidth={1.8} /></span><div><h4>{title}</h4>{subtitle && <p>{subtitle}</p>}</div></header>
    <div className={styles.cardBody}>{children}</div>
  </section>;
}
function Status({ value }: { value: string }) {
  const complete = value === 'COMPLETED';
  const started = ['STARTED', 'IN_PROGRESS', 'EVALUATED', 'PLANNED'].includes(value);
  const Icon = complete ? CheckCircle2 : started ? Clock3 : Circle;
  return <span className={styles.status} data-state={complete ? 'complete' : started ? 'active' : 'pending'}><Icon size={13} />{labels[value] || value}</span>;
}
function Select({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (v: string) => void }) {
  return <label className={styles.field}>{label}<select className={input} value={value} onChange={e => onChange(e.target.value)}>{values.map(v => <option key={v} value={v}>{labels[v] || v || 'Non renseigné'}</option>)}</select></label>;
}

type Field = { key: string; label: string; type?: 'date' | 'number' | 'list' | 'notes'; options?: string[]; required?: boolean; min?: number; step?: string; max?: number };
type Editor = { title: string; path: string; method: string; values: Record<string, string>; initialValues: Record<string, string>; fields: Field[] };
const clinicFields: Field[] = [
  { key: 'visitDate', label: 'Date du passage', type: 'date' }, { key: 'camp', label: 'Camp' },
  { key: 'partenaireId', label: 'Partenaire (facultatif)', type: 'number', min: 1, step: '1' },
  { key: 'status', label: 'Statut', options: ['PLANNED', 'STARTED', 'COMPLETED', 'CANCELLED'], required: true },
  { key: 'measures', label: 'Mesures réalisées (une par ligne)', type: 'list' }, { key: 'observations', label: 'Observations', type: 'notes', max: 5000 },
];
const membershipFields: Field[] = [
  { key: 'organizationType', label: 'Type', options: ['MUSO', 'AVEC'], required: true }, { key: 'organizationName', label: 'Nom de l’organisation', required: true },
  { key: 'membershipStatus', label: 'Adhésion', options: statuses }, { key: 'expectedAmount', label: 'Montant attendu', type: 'number', min: 0, step: '0.01' },
  { key: 'membershipDate', label: 'Date d’adhésion', type: 'date' }, { key: 'notes', label: 'Notes', type: 'notes', max: 5000 },
];
const paymentFields: Field[] = [
  { key: 'amount', label: 'Montant', type: 'number', required: true, min: 0.01, step: '0.01' }, { key: 'paymentDate', label: 'Date de paiement', type: 'date', required: true },
  { key: 'paymentMethod', label: 'Mode de paiement' }, { key: 'paymentReference', label: 'Référence' }, { key: 'notes', label: 'Notes', type: 'notes', max: 5000 },
];
export default function VictimProgression({ victimId, programme, onNavigate, onUpdate }: {
  victimId: number | string; programme: Programme; onNavigate: (tab: 'dossier' | 'contrat' | 'paiement' | 'info') => void; onUpdate?: (data: Snapshot) => void;
}) {
  const { fetcher } = useFetch();
  const [partners, setPartners] = useState<Array<{ id: number; structure: string }>>([]);
  const [measures, setMeasures] = useState<Array<{ id: number; label: string }>>([]);
  const [referenceError, setReferenceError] = useState('');
  const [panel, setPanel] = useState<'care' | 'clinics' | 'payments'>('care');
  const [data, setData] = useState<Snapshot | null>(null);
  const [draft, setDraft] = useState<ProgressionPatch>({});
  const [activities, setActivities] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [forbidden, setForbidden] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [editingCare, setEditingCare] = useState(false);
  const [editingConsent, setEditingConsent] = useState(false);
  const [permissions, setPermissions] = useState<string[] | null>(null);
  const generation = useRef(0);
  const mutationPending = useRef(false);
  useEffect(() => {
    if (editor) document.getElementById('victim-progression-editor')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }, [editor?.path]);
  const updateRef = useRef(onUpdate); updateRef.current = onUpdate;
  const path = progressionPath(victimId, programme);
  const required = programme === 'LUC' ? 'indemnisation:read' : 'consentements-mpu:read';
  const canEdit = !forbidden && (permissions === null || ['victime:update', required].every(p => permissions.includes(p)));
  const accept = (next: Snapshot) => { setEditingCare(false); setEditingConsent(false); setData(next); setDraft(progressionFields(next)); setActivities(next.progression.economique.activitesGeneratricesRevenus.join('\n')); updateRef.current?.(next); };
  const report = (e: unknown, mutation = false) => { setError(e instanceof Error ? e.message : 'Une erreur est survenue.'); if (mutation && e instanceof ProgressionError && e.status === 403) setForbidden(true); };
  const load = async () => {
    const version = ++generation.current; setBusy(true); setError(''); setSuccess('');
    try { const next = await progressionRequest(path); if (version === generation.current) accept(next); }
    catch (e) { if (version === generation.current) report(e); }
    finally { if (version === generation.current) setBusy(false); }
  };
  useEffect(() => {
    const claims = getPecmuPermissions(); setPermissions(claims); setData(null); setEditor(null); setForbidden(false);
    if (claims !== null && !['victime:read', required].every(p => claims.includes(p))) { setError('Habilitations de lecture insuffisantes.'); return; }
    void load(); return () => { generation.current++; };
    // The component is remounted when returning from documents, contracts or payments.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, required]);
  useEffect(() => {
    if (programme !== 'MPU') return;
    let active = true;
    Promise.all([fetcher('/partenaires'), fetcher('/mesures-reparation')]).then(([partnersResult, measuresResult]) => {
      if (!active) return;
      setPartners(normalizeApiList(partnersResult)); setMeasures(normalizeApiList(measuresResult));
      if (!partnersResult || !measuresResult) setReferenceError('Certains référentiels sont indisponibles. Actualisez la fiche pour réessayer.');
    }).catch(() => { if (active) setReferenceError('Référentiels indisponibles.'); });
    return () => { active = false; };
  }, [programme, fetcher]);
  const mutate = async (url: string, method: string, payload?: unknown) => {
    if (busy || mutationPending.current || !canEdit) return;
    mutationPending.current = true;
    const version = generation.current; setBusy(true); setError(''); setSuccess('');
    try { const next = await progressionRequest(url, method, payload); if (version === generation.current) { accept(next); setEditor(null); setSuccess('Progression enregistrée.'); } }
    catch (e) { if (version === generation.current) report(e, true); }
    finally { mutationPending.current = false; if (version === generation.current) setBusy(false); }
  };
  const edit = (key: keyof ProgressionPatch, value: unknown) => setDraft(d => ({ ...d, [key]: value }));
  const open = (title: string, suffix: string, method: string, fields: Field[], values: Record<string, unknown>) => {
    if (data && JSON.stringify(progressionFields(data)) !== JSON.stringify({ ...draft, incomeGeneratingActivities: activities.split('\n').map(v => v.trim()).filter(Boolean) }) && !window.confirm('Abandonner les modifications de réadaptation non enregistrées ?')) return;
    if (data) { setDraft(progressionFields(data)); setActivities(data.progression.economique.activitesGeneratricesRevenus.join('\n')); }
    const initialValues = Object.fromEntries(fields.map(f => [f.key, Array.isArray(values[f.key]) ? (values[f.key] as string[]).join('\n') : String(values[f.key] ?? '')]));
    setEditingCare(false);
    setEditor({ title, path: path + suffix, method, fields, values: { ...initialValues }, initialValues }); setError(''); setSuccess('');
  };
  const remove = (suffix: string, label: string) => { if (window.confirm(`Supprimer ${label} ? Les modifications non enregistrées seront abandonnées.`)) void mutate(path + suffix, 'DELETE'); };
  const uploadConsent = async (file: File) => {
    if (busy || mutationPending.current || !canEdit) return;
    if (!file.size) { setError('Le fichier sélectionné est vide.'); return; }
    mutationPending.current = true;
    const version = generation.current;
    setBusy(true); setError(''); setSuccess('');
    try {
      const form = new FormData(); form.append('file', file); form.append('category', 'consent'); form.append('label', 'Acte de consentement MPU');
      const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
      const response = await authenticatedFetch(`${base}/document-victime/victime/${encodeURIComponent(victimId)}/upload`, { method: 'POST', body: form });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new ProgressionError(response.status, body?.message || 'Impossible de déposer l’acte de consentement.');
      }
      const next = await progressionRequest(path);
      if (version === generation.current) { accept(next); setSuccess('Acte de consentement déposé.'); }
    } catch (e) { if (version === generation.current) report(e, true); }
    finally { mutationPending.current = false; if (version === generation.current) setBusy(false); }
  };
  const readonly = busy || !canEdit;
  const p = data?.progression;
  const dirty = !!data && JSON.stringify(progressionFields(data)) !== JSON.stringify({ ...draft, incomeGeneratingActivities: activities.split('\n').map(v => v.trim()).filter(Boolean) });
  const switchPanel = (next: typeof panel) => {
    if (editor && !window.confirm('Fermer ce formulaire sans enregistrer ?')) return;
    setEditor(null); setPanel(next);
  };
  const progressItems = p ? [
    { name: 'Médicale', icon: HeartPulse, tone: 'blue', status: p.medicale.statut, detail: programme === 'LUC' ? `${p.medicale.nombreEvaluations ?? 0} évaluation(s)` : `${p.medicale.nombreCliniquesTerminees ?? 0} passage(s) terminé(s)`, target: programme === 'LUC' ? 'care' as const : 'clinics' as const },
    { name: 'Psychologique', icon: Brain, tone: 'plum', status: p.psychologique.statut, detail: 'Suivi de la réadaptation', target: 'care' as const },
    { name: 'Économique', icon: BriefcaseBusiness, tone: 'teal', status: p.economique.statut, detail: p.economique.formation?.type ? labels[p.economique.formation.type] : 'Formation et autonomie', target: 'care' as const },
    { name: programme === 'LUC' ? 'Indemnisation' : 'MUSO / AVEC', icon: Wallet, tone: 'blue', status: (programme === 'LUC' ? p.indemnisation?.statut : p.musoAvec?.statutPaiement) || 'NOT_STARTED', detail: programme === 'LUC' ? `${p.indemnisation?.tranchesPayees ?? 0} / ${p.indemnisation?.nombreTranches ?? 0} tranches payées` : p.musoAvec?.nom || 'Adhésion à renseigner', target: 'payments' as const },
  ] : [];
  return <div className={styles.root}>
    <header className={styles.heading}>
      <div className={styles.headingIdentity}><span className={styles.programme}>{programme}</span><div><span className={styles.eyebrow}>PARCOURS DE RÉPARATION</span><h3>Progression individuelle</h3><p>{data?.victime.nom || 'Suivi de la victime'}</p></div></div>
      <button type="button" aria-label="Actualiser la progression" className={button} disabled={busy} onClick={() => { if ((!dirty && !editor) || window.confirm('Actualiser la progression ? Les modifications non enregistrées seront abandonnées.')) { setEditor(null); void load(); } }}><RefreshCw size={15} className={busy ? styles.spinning : ''} />Actualiser</button>
    </header>
    {error && <p role="alert" className={styles.error}><AlertCircle size={17} />{error}</p>}
    {success && <p role="status" className={styles.success}><CheckCircle2 size={17} />{success}</p>}
    {busy && <p role="status" className={styles.loading}><RefreshCw size={15} className={styles.spinning} />{data ? 'Enregistrement en cours…' : 'Chargement du parcours…'}</p>}
    {data && p && <>
      {!canEdit && <p className={styles.notice}><LockKeyhole size={15} />Lecture seule : habilitations de modification insuffisantes.</p>}
      <div className={styles.overview} aria-label="Synthèse du parcours">
        {progressItems.map(({ name, icon: Icon, tone, status, detail, target }) => <button type="button" key={name} className={styles.overviewItem} data-tone={tone} onClick={() => switchPanel(target)}>
          <span className={styles.overviewLabel}><span className={styles.iconTile}><Icon size={20} strokeWidth={1.8} /></span><span>{name}</span><ChevronRight size={15} /></span>
          <Status value={status} /><span className={styles.overviewDetail}>{detail}</span>
        </button>)}
      </div>
      <div className={styles.layout}>
      <aside className={styles.sidebar} aria-label="Dossier de la victime">
      <Card title="Documents et dossier"><div className={styles.documentList}>{[
        ['Photo', data.documents.photoDisponible], ['Pièce d’identité', data.documents.pieceIdentiteDisponible],
        ...(programme === 'LUC' ? [['Contrat', data.documents.contratDisponible]] : [['Consentement', data.documents.consentementEnregistre], ['Acte signé', data.documents.acteConsentementDisponible]]),
      ].map(([name, ok]) => <div key={String(name)}><span>{String(name)}</span><span data-ready={!!ok}>{ok ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}{ok ? 'Disponible' : 'À compléter'}</span></div>)}</div><p className={styles.caption}>{data.documents.nombreDocuments} document(s) au dossier{programme === 'MPU' && <> · {data.victime.camps?.join(', ') || 'Camp non renseigné'}</>}</p><div className={styles.sideActions}><button className={button} onClick={() => onNavigate('dossier')}><FolderCheck size={14} />Documents<ArrowUpRight size={13} /></button><button className={button} onClick={() => onNavigate('contrat')}><FileSignature size={14} />{programme === 'MPU' ? 'Consentement' : 'Contrat'}<ArrowUpRight size={13} /></button></div></Card>
      {data.prejudices && <Card title="Violations et préjudices"><dl className={styles.facts}>{Object.entries({ Violation: data.prejudices.typeViolation, 'Préjudices subis': data.prejudices.prejudicesSubis, 'Préjudice final': data.prejudices.prejudiceFinal, Réparations: data.prejudices.reparations }).map(([k, v]) => <div key={k}><dt className="font-medium">{k}</dt><dd>{text(v)}</dd></div>)}</dl></Card>}
      {programme === 'LUC' && <Card title="Contrat">{data.contrat ? <div className={styles.contractSummary}><span className={styles.contractAmount}>{money(data.contrat.montantTotalUSD)} <small>USD</small></span><p>{data.contrat.typeContrat}</p><p className={styles.historyMeta}><CalendarDays size={13} />Signé le {dateLabel(data.contrat.dateSignature)}</p><dl className={styles.facts}><div><dt>Mesures acceptées</dt><dd>{data.contrat.mesuresReparationAcceptees.join(', ') || 'Aucune'}</dd></div><div><dt>Mesures renoncées</dt><dd>{data.contrat.mesuresReparationRenoncees.join(', ') || 'Aucune'}</dd></div></dl></div> : <p>Aucun contrat enregistré.</p>}</Card>}
      {programme === 'MPU' && <Card title="Consentement">{!editingConsent ? <button type="button" className={button} disabled={readonly || !!editor} onClick={() => setEditingConsent(true)}><Upload size={15} />Déposer un acte</button> : <label className={styles.upload}><Upload size={17} />Déposer l’acte de consentement<input type="file" className={input} disabled={readonly || !!editor} onChange={e => { const file = e.target.files?.[0]; if (file && window.confirm('Déposer cet acte ? Les modifications de réadaptation non enregistrées seront abandonnées.')) void uploadConsent(file); e.target.value = ''; }} /><button type="button" className={button} disabled={busy} onClick={() => setEditingConsent(false)}>Annuler</button></label>}{data.consentement ? <div className="text-sm space-y-1"><p>{data.consentement.accepte ? 'Accepté' : data.consentement.decision} · {dateLabel(data.consentement.date)} · {text(data.consentement.lieu)} · {data.consentement.signe ? 'Signé' : 'Non signé'}</p><p>Mesures : {data.consentement.mesuresProposees.join(', ') || 'Non renseigné'}</p><p>Autres mesures : {text(data.consentement.autresMesures)}</p><p>Vulnérabilités : {data.consentement.vulnerabilites.join(', ') || 'Non renseigné'}</p></div> : <p>Aucun consentement enregistré.</p>}</Card>}
      </aside>
      <div className={styles.workspace}>
        <nav className={styles.tabs} aria-label="Volets de progression">
          <button type="button" aria-pressed={panel === 'care'} onClick={() => switchPanel('care')}><Activity size={16} />Réadaptation</button>
          {programme === 'MPU' && <button type="button" aria-pressed={panel === 'clinics'} onClick={() => switchPanel('clinics')}><HeartPulse size={16} />Cliniques mobiles</button>}
          <button type="button" aria-pressed={panel === 'payments'} onClick={() => switchPanel('payments')}><Wallet size={16} />{programme === 'LUC' ? 'Indemnisation' : 'MUSO / AVEC'}</button>
        </nav>
        <div hidden={panel !== 'care'}>
      {!editingCare ? <div className={styles.readCare}>
        <div className={styles.readToolbar}><span>Suivi de la réadaptation</span>{canEdit && <button type="button" className={button} disabled={busy || !!editor} onClick={() => { setEditingCare(true); setSuccess(''); setError(''); }}><Pencil size={14} />Modifier</button>}</div>
        <div className={styles.careGrid}>
          {programme === 'LUC' && <Card title="Réadaptation médicale">
            <Status value={p.medicale.statut} />
            <p className={styles.historyMeta}><CalendarDays size={13} />{p.medicale.nombreEvaluations ?? 0} évaluation(s) · {dateLabel(p.medicale.derniereEvaluation)}</p>
            <div className={styles.readNote}><span>Notes médicales</span><p>{p.medicale.notes || 'Aucune note renseignée.'}</p></div>
            <button type="button" className={button} onClick={() => onNavigate('info')}><ArrowUpRight size={14} />Voir l’évaluation</button>
          </Card>}
          <Card title="Réadaptation psychologique">
            <Status value={p.psychologique.statut} />
            <div className={styles.readNote}><span>Notes psychologiques</span><p>{p.psychologique.notes || 'Aucune note renseignée.'}</p></div>
          </Card>
        </div>
        <Card title="Accompagnement économique">
          <Status value={p.economique.statut} />
          <div className={styles.readFacts}>
            <div><span>Formation</span><strong>{p.economique.formation?.type ? labels[p.economique.formation.type] : 'Non renseignée'}</strong><p>{p.economique.formation?.precision || 'Aucune précision renseignée.'}</p></div>
            <div><span>Activités génératrices de revenus</span>{p.economique.activitesGeneratricesRevenus.length ? <ul>{p.economique.activitesGeneratricesRevenus.map(activity => <li key={activity}>{activity}</li>)}</ul> : <p>Aucune activité renseignée.</p>}</div>
          </div>
          <div className={styles.readNote}><span>Notes économiques</span><p>{p.economique.notes || 'Aucune note renseignée.'}</p></div>
        </Card>
      </div> : (
      <form onSubmit={e => { e.preventDefault(); try { const changes = progressionChanges(progressionFields(data), { ...draft, incomeGeneratingActivities: activities.split('\n').map(v => v.trim()).filter(Boolean) }); if (Object.keys(changes).length) void mutate(path, 'PATCH', changes); else setSuccess('Aucune modification à enregistrer.'); } catch (err) { report(err); } }}>
        <fieldset disabled={readonly || !!editor} className={styles.careFields}>
          <div className={styles.careGrid}>
            {programme === 'LUC' && <Card title="Réadaptation médicale"><Select label="Statut médical" value={draft.medicalStatus || ''} values={['NOT_EVALUATED', 'EVALUATED', 'STARTED', 'COMPLETED']} onChange={v => edit('medicalStatus', v)} /><button type="button" className={button} onClick={() => onNavigate('info')}><ArrowUpRight size={14} />Voir l’évaluation</button><p className="text-xs text-gray-500">{p.medicale.nombreEvaluations ?? 0} évaluation(s) · Dernière : {dateLabel(p.medicale.derniereEvaluation)}</p><label className="block text-sm">Notes médicales<textarea className={input} maxLength={5000} value={draft.medicalNotes ?? ''} onChange={e => edit('medicalNotes', e.target.value || null)} /></label></Card>}
            <Card title="Réadaptation psychologique"><Select label="Statut psychologique" value={draft.psychologicalStatus || 'NOT_STARTED'} values={statuses} onChange={v => edit('psychologicalStatus', v)} /><label className="block text-sm">Notes psychologiques<textarea className={input} maxLength={5000} value={draft.psychologicalNotes ?? ''} onChange={e => edit('psychologicalNotes', e.target.value || null)} /></label></Card>
          </div>
          <Card title="Accompagnement économique"><div className="grid gap-3 md:grid-cols-2"><Select label="Statut économique" value={draft.economicStatus || 'NOT_STARTED'} values={statuses} onChange={v => edit('economicStatus', v)} /><Select label="Formation" value={draft.trainingType || ''} values={['', 'TRADE', 'FORMAL_EDUCATION', 'LITERACY', 'OTHER']} onChange={v => edit('trainingType', v || null)} /><label className="block text-sm">Précisions de formation<textarea className={input} maxLength={2000} value={draft.trainingDetails ?? ''} onChange={e => edit('trainingDetails', e.target.value || null)} /></label><label className="block text-sm">Activités génératrices de revenus (une par ligne)<textarea className={input} value={activities} onChange={e => setActivities(e.target.value)} /></label><label className="block text-sm md:col-span-2">Notes économiques<textarea className={input} maxLength={5000} value={draft.economicNotes ?? ''} onChange={e => edit('economicNotes', e.target.value || null)} /></label></div></Card>
          <div className={styles.saveBar}><span><span className={dirty ? styles.unsavedDot : styles.savedDot} />{dirty ? 'Modifications non enregistrées' : 'Mode édition'}</span><div className={styles.editActions}><button type="button" className={button} onClick={() => { setDraft(progressionFields(data)); setActivities(p.economique.activitesGeneratricesRevenus.join('\n')); setEditingCare(false); setError(''); }}>Annuler</button><button className={styles.primaryButton} type="submit" disabled={!dirty}><Save size={16} />Enregistrer le suivi</button></div></div>
        </fieldset>
      </form>
      )}
      </div>
      {panel === 'payments' && programme === 'LUC' && p.indemnisation && <Card title="Indemnisation et tranches"><div className={styles.paymentHero}><div><span className={styles.eyebrow}>INDEMNISATION VERSÉE</span><div className={styles.amount}>{money(p.indemnisation.montantPaye)} <small>USD</small></div><p>sur {money(p.indemnisation.montantTotal)} USD prévus</p><Status value={p.indemnisation.statut} /></div><div className={styles.percentage}><strong>{money(p.indemnisation.pourcentage)}<small>%</small></strong><span>du montant total</span></div></div><div className={styles.paymentTrack}><progress max={100} value={p.indemnisation.pourcentage} aria-label="Pourcentage indemnisé" /><div>{[0, 25, 50, 75, 100].map(step => <span key={step} data-reached={step <= p.indemnisation!.palier}>{step} %</span>)}</div></div><div className={styles.paymentStats}><div><span>Reste à verser</span><strong>{money(p.indemnisation.montantRestant)} USD</strong></div><div><span>Tranches payées</span><strong>{p.indemnisation.tranchesPayees} <small>/ {p.indemnisation.nombreTranches}</small></strong></div><div><span>Mode de paiement</span><strong>{p.indemnisation.mecanismesPaiement.join(', ') || 'Non renseigné'}</strong></div></div><div className={styles.tableWrap}><table className="w-full text-left text-sm"><thead><tr>{['Tranche', 'Montant USD', 'Statut', 'Date', 'Mode'].map(v => <th className="p-2" key={v}>{v}</th>)}</tr></thead><tbody>{p.indemnisation.tranches.map(t => <tr className="border-t" key={t.id}><td className="p-2">{t.periode}</td><td>{money(t.montantUSD)}</td><td><span className={styles.status} data-state={t.payee ? 'complete' : 'pending'}>{t.payee ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}{t.payee ? 'Payée' : t.statut}</span></td><td>{dateLabel(t.datePaiementEffectif)}</td><td>{text(t.modePaiement)}</td></tr>)}</tbody></table>{!p.indemnisation.tranches.length && <p className="p-2 text-sm text-gray-500">Aucune tranche enregistrée.</p>}</div><button className={button} onClick={() => onNavigate(data.documents.contratDisponible ? 'paiement' : 'contrat')}><Wallet size={15} />{data.documents.contratDisponible ? 'Gérer les tranches et paiements' : 'Créer le contrat pour planifier les paiements'}</button></Card>}
      {panel === 'payments' && programme === 'LUC' && !p.indemnisation && <Card title="Indemnisation et tranches"><p>Le suivi des paiements n’est pas disponible pour ce dossier.</p><button className={button} onClick={() => onNavigate('contrat')}><FileSignature size={15} />Consulter le contrat</button></Card>}
      {programme === 'MPU' && <>
        <div hidden={panel !== 'clinics'}><Card title="Réadaptation médicale · Cliniques mobiles"><p>{labels[p.medicale.statut] || p.medicale.statut} · {p.medicale.nombreCliniquesTerminees ?? 0} / {p.medicale.nombreCliniques ?? 0} passages terminés</p>
          {(p.medicale.cliniques || []).map(c => <div key={c.id} className={styles.historyItem}><div className={styles.historyTitle}><span><span className={styles.visitNumber}>{c.numero}</span>{c.libelle || `Clinique mobile ${c.numero}`}</span><Status value={c.statut} /></div><p className={styles.historyMeta}><CalendarDays size={13} />{dateLabel(c.date)}<MapPin size={13} />{text(c.camp)} · {text(c.partenaire?.structure)}</p><p>{c.mesures.join(', ') || 'Aucune mesure renseignée'}</p><p>{text(c.observations)}</p><div className="flex gap-2"><button className={button} disabled={readonly || !!editor} onClick={() => open('Modifier le passage', `/cliniques-mobiles/${c.id}`, 'PATCH', clinicFields, { visitDate: c.date?.slice(0, 10), camp: c.camp, partenaireId: c.partenaire?.id, status: c.statut, measures: c.mesures, observations: c.observations })}><Pencil size={13} />Modifier</button><button className={button} disabled={readonly || !!editor} onClick={() => remove(`/cliniques-mobiles/${c.id}`, 'ce passage en clinique')}><Trash2 size={13} />Supprimer</button></div></div>)}
          {!p.medicale.cliniques?.length && <p className="text-sm text-gray-500">Aucun passage enregistré.</p>}<button className={styles.primaryButton} disabled={readonly || !!editor} onClick={() => open('Ajouter un passage en clinique', '/cliniques-mobiles', 'POST', clinicFields, { status: 'PLANNED', camp: data.victime.camps?.[0] })}><Plus size={16} />Ajouter un passage</button>
        </Card>
        </div><div hidden={panel !== 'payments'}><Card title="MUSO / AVEC">{p.musoAvec ? <><div className={styles.membershipHeader}><span className={styles.membershipMark}><Landmark size={24} /></span><div><span className={styles.eyebrow}>{p.musoAvec.type}</span><h5>{p.musoAvec.nom}</h5><p className={styles.historyMeta}><CalendarDays size={13} />Adhésion du {dateLabel(p.musoAvec.dateAdhesion)}</p></div><Status value={p.musoAvec.statutAdhesion} /></div><div className={styles.paymentHero}><div><span className={styles.eyebrow}>CONTRIBUTIONS VERSÉES</span><div className={styles.amount}>{money(p.musoAvec.montantPaye)} <small>/ {money(p.musoAvec.montantAttendu)}</small></div><Status value={p.musoAvec.statutPaiement} /></div><div className={styles.percentage}><strong>{money(p.musoAvec.pourcentagePaiement)}<small>%</small></strong><span>du montant attendu</span></div></div><progress max={100} value={p.musoAvec.pourcentagePaiement} aria-label="Paiements MUSO / AVEC" /><p>Reste à verser : <strong>{money(p.musoAvec.montantRestant)}</strong>{p.musoAvec.notes && <> · {p.musoAvec.notes}</>}</p></> : <p>Aucune adhésion enregistrée. Créez-la avant d’ajouter un paiement.</p>}
          <button className={button} disabled={readonly || !!editor} onClick={() => { const m = p.musoAvec; open(m ? 'Modifier l’adhésion' : 'Créer l’adhésion', '/muso-avec', 'PUT', membershipFields, { organizationType: m?.type || 'MUSO', organizationName: m?.nom, membershipStatus: m?.statutAdhesion || 'NOT_STARTED', expectedAmount: m?.montantAttendu ?? 0, membershipDate: m?.dateAdhesion?.slice(0, 10), notes: m?.notes }); }}><Landmark size={15} />{p.musoAvec ? 'Modifier l’adhésion' : 'Créer l’adhésion'}</button>
          {p.musoAvec && <><h5 className="font-medium">Historique des paiements</h5>{p.musoAvec.paiements.map(v => <div key={v.id} className={styles.historyItem}><div className={styles.historyTitle}><span><Wallet size={16} />{money(v.montant)}</span><span className={styles.status} data-state="complete"><CheckCircle2 size={13} />Enregistré</span></div><p className={styles.historyMeta}><CalendarDays size={13} />{dateLabel(v.date)} · {text(v.mode)} · Réf. {text(v.reference)}</p><p>{text(v.notes)}</p><div className="flex gap-2"><button className={button} disabled={readonly || !!editor} onClick={() => open('Modifier le paiement', `/muso-avec/paiements/${v.id}`, 'PATCH', paymentFields, { amount: v.montant, paymentDate: v.date?.slice(0, 10), paymentMethod: v.mode, paymentReference: v.reference, notes: v.notes })}><Pencil size={13} />Modifier</button><button className={button} disabled={readonly || !!editor} onClick={() => remove(`/muso-avec/paiements/${v.id}`, 'ce paiement')}><Trash2 size={13} />Supprimer</button></div></div>)}{!p.musoAvec.paiements.length && <p className="text-sm text-gray-500">Aucun paiement enregistré.</p>}<button className={styles.primaryButton} disabled={readonly || !!editor} onClick={() => open('Ajouter un paiement', '/muso-avec/paiements', 'POST', paymentFields, {})}><Plus size={16} />Ajouter un paiement</button></>}
        </Card></div>
      </>}
      {editor && <div id="victim-progression-editor" className={styles.editor}><Card title={editor.title}>{referenceError && <p role="status" className="text-sm text-amber-700">{referenceError}</p>}{editor.fields === clinicFields && measures.length > 0 && <div className="flex flex-wrap gap-2"><span className="text-sm">Ajouter une mesure :</span>{measures.map(m => <button type="button" key={m.id} disabled={readonly} className={button} onClick={() => setEditor({ ...editor, values: { ...editor.values, measures: [...new Set([...(editor.values.measures || '').split('\n').filter(Boolean), m.label])].join('\n') } })}>{m.label}</button>)}</div>}<form onSubmit={e => {
        e.preventDefault();
        const payload: Record<string, unknown> = {};
        for (const f of editor.fields) {
          if (editor.method === 'PATCH' && editor.values[f.key] === editor.initialValues[f.key]) continue;
          const value = editor.values[f.key]?.trim() || '';
          if (f.type === 'list') payload[f.key] = value.split('\n').map(v => v.trim()).filter(Boolean);
          else if (value) payload[f.key] = f.type === 'number' ? Number(value) : value;
          else if (editor.method === 'PATCH' || (editor.method === 'PUT' && f.type !== 'number')) payload[f.key] = null;
        }
        if (editor.method === 'PATCH' && !Object.keys(payload).length) { setEditor(null); return; }
        void mutate(editor.path, editor.method, payload);
      }}><fieldset disabled={readonly} className="grid gap-3 md:grid-cols-2">{editor.fields.map(f => <label key={f.key} className="block text-sm">{f.label}{f.required ? ' *' : ''}{f.key === 'partenaireId' ? <select className={input} value={editor.values[f.key]} onChange={e => setEditor({ ...editor, values: { ...editor.values, [f.key]: e.target.value } })}><option value="">Aucun partenaire</option>{editor.values[f.key] && !partners.some(p => String(p.id) === editor.values[f.key]) && <option value={editor.values[f.key]}>Partenaire #{editor.values[f.key]}</option>}{partners.map(p => <option key={p.id} value={p.id}>{p.structure || `Partenaire #${p.id}`}</option>)}</select> : f.options ? <select className={input} required={f.required} value={editor.values[f.key]} onChange={e => setEditor({ ...editor, values: { ...editor.values, [f.key]: e.target.value } })}>{f.options.map(o => <option key={o} value={o}>{labels[o] || o}</option>)}</select> : f.type === 'notes' || f.type === 'list' ? <textarea className={input} maxLength={f.max} value={editor.values[f.key]} onChange={e => setEditor({ ...editor, values: { ...editor.values, [f.key]: e.target.value } })} /> : <input className={input} type={f.type || 'text'} required={f.required} min={f.min} step={f.step} maxLength={f.max} value={editor.values[f.key]} onChange={e => setEditor({ ...editor, values: { ...editor.values, [f.key]: e.target.value } })} />}</label>)}<div className="flex gap-2 md:col-span-2"><button className={styles.primaryButton} type="submit"><Save size={15} />Enregistrer</button><button className={button} type="button" onClick={() => setEditor(null)}>Annuler</button></div></fieldset></form></Card></div>}
      </div></div>
      <p className={styles.audit}><Clock3 size={13} />{data.suivi.renseigne ? `Dernière mise à jour : ${dateLabel(data.suivi.misAJourLe)} · ${text(data.suivi.misAJourPar)}` : 'Aucun suivi manuel enregistré.'}</p>
    </>}
  </div>;
}
