'use client';
import { authenticatedFetch } from '../../utils/authFetch';
import { useFetch } from '../../context/FetchContext';
import { normalizeApiList } from '../utils/mentionStats';
import React, { useEffect, useRef, useState } from 'react';
import { getPecmuPermissions } from '../services/pecmuWorkflowApi';
import { progressionRequest, progressionPath, progressionFields, progressionChanges, ProgressionError, type Programme, type ProgressionPatch, type VictimProgression as Snapshot } from '../services/victimProgressionApi';

const labels: Record<string, string> = { NOT_EVALUATED: 'Non évaluée', EVALUATED: 'Évaluée', NOT_STARTED: 'Non commencée', PLANNED: 'Planifiée', STARTED: 'Commencée', IN_PROGRESS: 'En cours', COMPLETED: 'Terminée', CANCELLED: 'Annulée', TRADE: 'Métier', FORMAL_EDUCATION: 'Éducation formelle', LITERACY: 'Alphabétisation', OTHER: 'Autre formation' };
const input = 'mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900';
const button = 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50';
const statuses = ['NOT_STARTED', 'STARTED', 'COMPLETED'];
const text = (v: unknown) => v === null || v === undefined || v === '' ? 'Non renseigné' : String(v);
const money = (v: number) => Number(v).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
function Card({ title, children }: { title: string; children: React.ReactNode }) { return <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4"><h4 className="font-semibold text-gray-900">{title}</h4>{children}</section>; }
function Select({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (v: string) => void }) { return <label className="block text-sm">{label}<select className={input} value={value} onChange={e => onChange(e.target.value)}>{values.map(v => <option key={v} value={v}>{labels[v] || v || 'Non renseigné'}</option>)}</select></label>; }

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
  const [data, setData] = useState<Snapshot | null>(null);
  const [draft, setDraft] = useState<ProgressionPatch>({});
  const [activities, setActivities] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [forbidden, setForbidden] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [permissions, setPermissions] = useState<string[] | null>(null);
  const generation = useRef(0);
  const mutationPending = useRef(false);
  useEffect(() => {
    if (editor) document.getElementById('victim-progression-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [editor?.path]);
  const updateRef = useRef(onUpdate); updateRef.current = onUpdate;
  const path = progressionPath(victimId, programme);
  const required = programme === 'LUC' ? 'indemnisation:read' : 'consentements-mpu:read';
  const canEdit = !forbidden && (permissions === null || ['victime:update', required].every(p => permissions.includes(p)));
  const accept = (next: Snapshot) => { setData(next); setDraft(progressionFields(next)); setActivities(next.progression.economique.activitesGeneratricesRevenus.join('\n')); updateRef.current?.(next); };
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
  return <div className="space-y-5 text-gray-900">
    <div className="flex items-center justify-between gap-3"><div><h3 className="text-lg font-semibold">Progression individuelle — {programme}</h3><p className="text-sm text-gray-500">Documents, réadaptation et suivi des paiements</p></div><button type="button" className={button} disabled={busy} onClick={() => { if (window.confirm('Actualiser la progression ? Les modifications non enregistrées seront abandonnées.')) { setEditor(null); void load(); } }}>Actualiser</button></div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
    {success && <p role="status" className="rounded-lg bg-green-50 p-3 text-green-700">{success}</p>}
    {busy && <p role="status">Chargement / enregistrement en cours…</p>}
    {data && p && <>
      {!canEdit && <p className="text-sm text-amber-700">Lecture seule : habilitations de modification insuffisantes.</p>}
      <Card title="Documents et dossier"><div className="flex flex-wrap gap-2">{[
        ['Photo', data.documents.photoDisponible], ['Pièce d’identité', data.documents.pieceIdentiteDisponible],
        ...(programme === 'LUC' ? [['Contrat', data.documents.contratDisponible]] : [['Consentement enregistré', data.documents.consentementEnregistre], ['Acte de consentement', data.documents.acteConsentementDisponible]]),
      ].map(([name, ok]) => <span key={String(name)} className={`rounded-full px-3 py-1 text-xs ${ok ? 'bg-green-50 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{ok ? '●' : '○'} {name}</span>)}</div><p className="text-sm">{data.documents.nombreDocuments} document(s){programme === 'MPU' && <> · Camps : {data.victime.camps?.join(', ') || 'Non renseigné'}</>}</p><div className="flex gap-2"><button className={button} onClick={() => onNavigate('dossier')}>Gérer les documents</button><button className={button} onClick={() => onNavigate('contrat')}>{programme === 'MPU' ? 'Gérer le consentement' : 'Gérer le contrat'}</button></div></Card>
      {data.prejudices && <Card title="Violations et préjudices"><dl className="grid gap-2 text-sm">{Object.entries({ Violation: data.prejudices.typeViolation, 'Préjudices subis': data.prejudices.prejudicesSubis, 'Préjudice final': data.prejudices.prejudiceFinal, Réparations: data.prejudices.reparations }).map(([k, v]) => <div key={k}><dt className="font-medium">{k}</dt><dd>{text(v)}</dd></div>)}</dl></Card>}
      {programme === 'LUC' && <Card title="Contrat">{data.contrat ? <div className="text-sm space-y-1"><p>{data.contrat.typeContrat} · signé le {text(data.contrat.dateSignature)} · {money(data.contrat.montantTotalUSD)} USD</p><p>Mesures acceptées : {data.contrat.mesuresReparationAcceptees.join(', ') || 'Aucune'}</p><p>Mesures renoncées : {data.contrat.mesuresReparationRenoncees.join(', ') || 'Aucune'}</p></div> : <p>Aucun contrat enregistré.</p>}</Card>}
      {programme === 'MPU' && <Card title="Consentement"><label className="block text-sm">Déposer l’acte de consentement<input type="file" className={input} disabled={readonly || !!editor} onChange={e => { const file = e.target.files?.[0]; if (file && window.confirm('Déposer cet acte ? Les modifications de réadaptation non enregistrées seront abandonnées.')) void uploadConsent(file); e.target.value = ''; }} /></label>{data.consentement ? <div className="text-sm space-y-1"><p>{data.consentement.accepte ? 'Accepté' : data.consentement.decision} · {text(data.consentement.date)} · {text(data.consentement.lieu)} · {data.consentement.signe ? 'Signé' : 'Non signé'}</p><p>Mesures : {data.consentement.mesuresProposees.join(', ') || 'Non renseigné'}</p><p>Autres mesures : {text(data.consentement.autresMesures)}</p><p>Vulnérabilités : {data.consentement.vulnerabilites.join(', ') || 'Non renseigné'}</p></div> : <p>Aucun consentement enregistré.</p>}</Card>}
      <form onSubmit={e => { e.preventDefault(); try { const changes = progressionChanges(progressionFields(data), { ...draft, incomeGeneratingActivities: activities.split('\n').map(v => v.trim()).filter(Boolean) }); if (Object.keys(changes).length) void mutate(path, 'PATCH', changes); else setSuccess('Aucune modification à enregistrer.'); } catch (err) { report(err); } }}>
        <fieldset disabled={readonly || !!editor} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {programme === 'LUC' && <Card title="Réadaptation médicale"><Select label="Statut médical" value={draft.medicalStatus || ''} values={['NOT_EVALUATED', 'EVALUATED', 'STARTED', 'COMPLETED']} onChange={v => edit('medicalStatus', v)} /><button type="button" className={button} onClick={() => onNavigate('info')}>Consulter la fiche et l’évaluation médicale</button><p className="text-xs text-gray-500">{p.medicale.nombreEvaluations ?? 0} évaluation(s) · Dernière : {text(p.medicale.derniereEvaluation)}</p><label className="block text-sm">Notes médicales<textarea className={input} maxLength={5000} value={draft.medicalNotes ?? ''} onChange={e => edit('medicalNotes', e.target.value || null)} /></label></Card>}
            <Card title="Réadaptation psychologique"><Select label="Statut psychologique" value={draft.psychologicalStatus || 'NOT_STARTED'} values={statuses} onChange={v => edit('psychologicalStatus', v)} /><label className="block text-sm">Notes psychologiques<textarea className={input} maxLength={5000} value={draft.psychologicalNotes ?? ''} onChange={e => edit('psychologicalNotes', e.target.value || null)} /></label></Card>
          </div>
          <Card title="Accompagnement économique"><div className="grid gap-3 md:grid-cols-2"><Select label="Statut économique" value={draft.economicStatus || 'NOT_STARTED'} values={statuses} onChange={v => edit('economicStatus', v)} /><Select label="Formation" value={draft.trainingType || ''} values={['', 'TRADE', 'FORMAL_EDUCATION', 'LITERACY', 'OTHER']} onChange={v => edit('trainingType', v || null)} /><label className="block text-sm">Précisions de formation<textarea className={input} maxLength={2000} value={draft.trainingDetails ?? ''} onChange={e => edit('trainingDetails', e.target.value || null)} /></label><label className="block text-sm">Activités génératrices de revenus (une par ligne)<textarea className={input} value={activities} onChange={e => setActivities(e.target.value)} /></label><label className="block text-sm md:col-span-2">Notes économiques<textarea className={input} maxLength={5000} value={draft.economicNotes ?? ''} onChange={e => edit('economicNotes', e.target.value || null)} /></label></div></Card>
          <button className={button} type="submit">Enregistrer la réadaptation</button>
        </fieldset>
      </form>
      {programme === 'LUC' && p.indemnisation && <Card title="Indemnisation et tranches"><p className="text-sm">{labels[p.indemnisation.statut] || p.indemnisation.statut} · {p.indemnisation.pourcentage} % · Palier {p.indemnisation.palier} %</p><progress className="w-full" max={100} value={p.indemnisation.pourcentage} aria-label="Pourcentage indemnisé" /><p>{money(p.indemnisation.montantPaye)} / {money(p.indemnisation.montantTotal)} USD · Reste : {money(p.indemnisation.montantRestant)} USD</p><p className="text-sm">{p.indemnisation.tranchesPayees} / {p.indemnisation.nombreTranches} tranches payées · {p.indemnisation.mecanismesPaiement.join(', ')}</p><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Tranche', 'Montant USD', 'Statut', 'Date', 'Mode'].map(v => <th className="p-2" key={v}>{v}</th>)}</tr></thead><tbody>{p.indemnisation.tranches.map(t => <tr className="border-t" key={t.id}><td className="p-2">{t.periode}</td><td>{money(t.montantUSD)}</td><td>{t.payee ? 'Payée' : t.statut}</td><td>{text(t.datePaiementEffectif)}</td><td>{text(t.modePaiement)}</td></tr>)}</tbody></table>{!p.indemnisation.tranches.length && <p className="p-2 text-sm text-gray-500">Aucune tranche enregistrée.</p>}</div><button className={button} onClick={() => onNavigate(data.documents.contratDisponible ? 'paiement' : 'contrat')}>{data.documents.contratDisponible ? 'Gérer les tranches et paiements' : 'Créer le contrat pour planifier les paiements'}</button></Card>}
      {programme === 'MPU' && <>
        <Card title="Réadaptation médicale · Cliniques mobiles"><p>{labels[p.medicale.statut] || p.medicale.statut} · {p.medicale.nombreCliniquesTerminees ?? 0} / {p.medicale.nombreCliniques ?? 0} passages terminés</p>
          {(p.medicale.cliniques || []).map(c => <div key={c.id} className="rounded-lg border p-3 text-sm space-y-2"><p className="font-medium">{c.libelle || `Clinique mobile ${c.numero}`} · {labels[c.statut] || c.statut}</p><p>{text(c.date)} · {text(c.camp)} · {text(c.partenaire?.structure)}</p><p>{c.mesures.join(', ') || 'Aucune mesure renseignée'}</p><p>{text(c.observations)}</p><div className="flex gap-2"><button className={button} disabled={readonly || !!editor} onClick={() => open('Modifier le passage', `/cliniques-mobiles/${c.id}`, 'PATCH', clinicFields, { visitDate: c.date?.slice(0, 10), camp: c.camp, partenaireId: c.partenaire?.id, status: c.statut, measures: c.mesures, observations: c.observations })}>Modifier</button><button className={button} disabled={readonly || !!editor} onClick={() => remove(`/cliniques-mobiles/${c.id}`, 'ce passage en clinique')}>Supprimer</button></div></div>)}
          {!p.medicale.cliniques?.length && <p className="text-sm text-gray-500">Aucun passage enregistré.</p>}<button className={button} disabled={readonly || !!editor} onClick={() => open('Ajouter un passage en clinique', '/cliniques-mobiles', 'POST', clinicFields, { status: 'PLANNED', camp: data.victime.camps?.[0] })}>Ajouter une clinique mobile</button>
        </Card>
        <Card title="MUSO / AVEC">{p.musoAvec ? <><p className="font-medium">{p.musoAvec.type} · {p.musoAvec.nom} · {labels[p.musoAvec.statutAdhesion]}</p><p className="text-sm">Adhésion : {text(p.musoAvec.dateAdhesion)} · {text(p.musoAvec.notes)}</p><p>{money(p.musoAvec.montantPaye)} / {money(p.musoAvec.montantAttendu)} · Reste : {money(p.musoAvec.montantRestant)} · {p.musoAvec.pourcentagePaiement} %</p><progress className="w-full" max={100} value={p.musoAvec.pourcentagePaiement} aria-label="Paiements MUSO / AVEC" /><p>{labels[p.musoAvec.statutPaiement]}</p></> : <p>Aucune adhésion enregistrée. Créez-la avant d’ajouter un paiement.</p>}
          <button className={button} disabled={readonly || !!editor} onClick={() => { const m = p.musoAvec; open(m ? 'Modifier l’adhésion' : 'Créer l’adhésion', '/muso-avec', 'PUT', membershipFields, { organizationType: m?.type || 'MUSO', organizationName: m?.nom, membershipStatus: m?.statutAdhesion || 'NOT_STARTED', expectedAmount: m?.montantAttendu ?? 0, membershipDate: m?.dateAdhesion?.slice(0, 10), notes: m?.notes }); }}>{p.musoAvec ? 'Modifier l’adhésion' : 'Créer l’adhésion'}</button>
          {p.musoAvec && <><h5 className="font-medium">Historique des paiements</h5>{p.musoAvec.paiements.map(v => <div key={v.id} className="rounded-lg border p-3 text-sm space-y-2"><p>{money(v.montant)} · {text(v.date)} · {text(v.mode)} · Réf. {text(v.reference)}</p><p>{text(v.notes)}</p><div className="flex gap-2"><button className={button} disabled={readonly || !!editor} onClick={() => open('Modifier le paiement', `/muso-avec/paiements/${v.id}`, 'PATCH', paymentFields, { amount: v.montant, paymentDate: v.date?.slice(0, 10), paymentMethod: v.mode, paymentReference: v.reference, notes: v.notes })}>Modifier</button><button className={button} disabled={readonly || !!editor} onClick={() => remove(`/muso-avec/paiements/${v.id}`, 'ce paiement')}>Supprimer</button></div></div>)}{!p.musoAvec.paiements.length && <p className="text-sm text-gray-500">Aucun paiement enregistré.</p>}<button className={button} disabled={readonly || !!editor} onClick={() => open('Ajouter un paiement', '/muso-avec/paiements', 'POST', paymentFields, {})}>Ajouter un paiement</button></>}
        </Card>
      </>}
      {editor && <div id="victim-progression-editor" className="scroll-mt-4"><Card title={editor.title}>{referenceError && <p role="status" className="text-sm text-amber-700">{referenceError}</p>}{editor.fields === clinicFields && measures.length > 0 && <div className="flex flex-wrap gap-2"><span className="text-sm">Ajouter une mesure :</span>{measures.map(m => <button type="button" key={m.id} disabled={readonly} className={button} onClick={() => setEditor({ ...editor, values: { ...editor.values, measures: [...new Set([...(editor.values.measures || '').split('\n').filter(Boolean), m.label])].join('\n') } })}>{m.label}</button>)}</div>}<form onSubmit={e => {
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
      }}><fieldset disabled={readonly} className="grid gap-3 md:grid-cols-2">{editor.fields.map(f => <label key={f.key} className="block text-sm">{f.label}{f.required ? ' *' : ''}{f.key === 'partenaireId' ? <select className={input} value={editor.values[f.key]} onChange={e => setEditor({ ...editor, values: { ...editor.values, [f.key]: e.target.value } })}><option value="">Aucun partenaire</option>{editor.values[f.key] && !partners.some(p => String(p.id) === editor.values[f.key]) && <option value={editor.values[f.key]}>Partenaire #{editor.values[f.key]}</option>}{partners.map(p => <option key={p.id} value={p.id}>{p.structure || `Partenaire #${p.id}`}</option>)}</select> : f.options ? <select className={input} required={f.required} value={editor.values[f.key]} onChange={e => setEditor({ ...editor, values: { ...editor.values, [f.key]: e.target.value } })}>{f.options.map(o => <option key={o} value={o}>{labels[o] || o}</option>)}</select> : f.type === 'notes' || f.type === 'list' ? <textarea className={input} maxLength={f.max} value={editor.values[f.key]} onChange={e => setEditor({ ...editor, values: { ...editor.values, [f.key]: e.target.value } })} /> : <input className={input} type={f.type || 'text'} required={f.required} min={f.min} step={f.step} maxLength={f.max} value={editor.values[f.key]} onChange={e => setEditor({ ...editor, values: { ...editor.values, [f.key]: e.target.value } })} />}</label>)}<div className="flex gap-2 md:col-span-2"><button className={button} type="submit">Enregistrer</button><button className={button} type="button" onClick={() => setEditor(null)}>Annuler</button></div></fieldset></form></Card></div>}
      <p className="text-xs text-gray-500">{data.suivi.renseigne ? `Dernière mise à jour : ${text(data.suivi.misAJourLe)} · ${text(data.suivi.misAJourPar)}` : 'Aucun suivi manuel enregistré.'}</p>
    </>}
  </div>;
}
