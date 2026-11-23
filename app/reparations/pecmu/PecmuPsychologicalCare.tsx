'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Plus, Save, Upload } from 'lucide-react';
import type { PecmuFetcher } from '../services/pecmuApi';
import {
  addPsychologicalHomeVisit, addPsychologicalTherapySession, closePsychologicalCare,
  createPsychologicalCare, getMedicalSupervisorOptions, getPsychologicalCare,
  PecmuApiError, updatePsychologicalCare, uploadPsychologicalReport,
  type PsychologicalCare, type SupervisorOption,
} from '../services/pecmuWorkflowApi';
import { buttonClass, fieldClass } from './WorkflowForm';
import PecmuDocumentViewer, { type DocumentPreview } from './PecmuDocumentViewer';

const today = () => new Date().toISOString().slice(0, 10);
const errorMessages: Record<string, string> = {
  PSYCHOLOGICAL_CARE_ALREADY_EXISTS: 'Une prise en charge psychologique existe déjà.',
  PSYCHOLOGICAL_CARE_NOT_ALLOWED: 'Le statut actuel ne permet pas de commencer la psychologie.',
  PSYCHOLOGICAL_CARE_ALREADY_CLOSED: 'La prise en charge psychologique est déjà clôturée.',
  PSYCHOLOGICAL_REPORT_REQUIRED: 'Le rapport psychologique est obligatoire.',
  PSYCHOLOGICAL_CARE_CLOSURE_REQUIRED: 'Clôturez d’abord la prise en charge psychologique.',
  RESOURCE_OUT_OF_SCOPE: 'Ce dossier ne fait pas partie de votre périmètre.',
  INSUFFICIENT_PERMISSIONS: 'Vous ne possédez pas la permission requise.',
  CORE_SSO_UNAVAILABLE: 'Le service d’authentification est temporairement indisponible. Réessayez.',
};
const messageFor = (error: any) => errorMessages[error?.code] || error?.message || 'Une erreur est survenue.';
const hasReport = (care: PsychologicalCare | null) => Boolean(care && (care.report || care.reportFile || care.reportName || care.reportUploaded === true || care.reportMetadata));

type FormState = { supervisorName: string; supervisorOtherName: string; complaints: string; initialEvaluation: string; diagnosticHypothesis: string; therapiesReceived: string };
const blankForm = (): FormState => ({ supervisorName: '', supervisorOtherName: '', complaints: '', initialEvaluation: '', diagnosticHypothesis: '', therapiesReceived: '' });

export default function PecmuPsychologicalCare({ ficheId, fetcher, onChanged }: {
  ficheId: number; fetcher: PecmuFetcher; onChanged: () => void;
}) {
  const [care, setCare] = useState<PsychologicalCare | null>(null);
  const [supervisors, setSupervisors] = useState<SupervisorOption[]>([]);
  const [otherOption, setOtherOption] = useState<SupervisorOption & { requiresSpecification?: boolean }>({ value: 'OTHER', label: 'Autre à préciser', requiresSpecification: true });
  const [supervisorLookupFailed, setSupervisorLookupFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState<FormState>(blankForm);
  const [session, setSession] = useState({ date: today(), therapy: '', notes: '' });
  const [visit, setVisit] = useState({ date: today(), observations: '' });
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [postTherapyEvaluation, setPostTherapyEvaluation] = useState('');
  const [closureDate, setClosureDate] = useState(today());
  const [closureNotes, setClosureNotes] = useState('');
  const [reload, setReload] = useState(0);
  const [reportPreview, setReportPreview] = useState<DocumentPreview | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(''); setNotFound(false);
    try {
      const fresh = await getPsychologicalCare(fetcher, ficheId);
      setCare(fresh);
      setForm({
        supervisorName: fresh.supervisorName || '', supervisorOtherName: '', complaints: fresh.complaints || '',
        initialEvaluation: fresh.initialEvaluation || '', diagnosticHypothesis: fresh.diagnosticHypothesis || '', therapiesReceived: fresh.therapiesReceived || '',
      });
      setPostTherapyEvaluation(fresh.postTherapyEvaluation || '');
      setClosureDate(fresh.closureDate?.slice(0, 10) || today());
      setClosureNotes(fresh.closureNotes || '');
    } catch (e: any) {
      const code = e instanceof PecmuApiError ? e.code : e?.code;
      const statusCode = e instanceof PecmuApiError ? e.statusCode : e?.statusCode;
      if (statusCode === 404 && code === 'PSYCHOLOGICAL_CARE_NOT_FOUND') { setCare(null); setNotFound(true); }
      else { setError(messageFor(e)); setCare(null); }
    } finally { setLoading(false); }
  }, [fetcher, ficheId, reload]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    let active = true;
    void getMedicalSupervisorOptions(fetcher).then(result => {
      if (!active) return;
      setSupervisors(result.data); setOtherOption(result.other); setSupervisorLookupFailed(false);
    }).catch(() => { if (active) { setSupervisorLookupFailed(true); setSupervisors([]); } });
    return () => { active = false; };
  }, [fetcher]);

  const closed = care?.isClosed === true || care?.status === 'CLOSED';
  const createAllowed = !loading && !care;
  const updateAllowed = !loading && Boolean(care);
  const sessions = Array.isArray(care?.therapySessions) ? care.therapySessions : Array.isArray((care as any)?.sessions) ? (care as any).sessions : [];
  const visits = Array.isArray(care?.homeVisits) ? care.homeVisits : Array.isArray((care as any)?.visits) ? (care as any).visits : [];

  const run = async (operation: () => Promise<unknown>) => {
    if (busy) return false;
    setBusy(true); setError('');
    try { await operation(); setReload(value => value + 1); onChanged(); return true; }
    catch (e: any) { setError(messageFor(e)); return false; }
    finally { setBusy(false); }
  };
  const supervisorName = (values: FormState) => values.supervisorName === otherOption.value ? values.supervisorOtherName.trim() : values.supervisorName.trim();
  const saveCare = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = supervisorName(form);
    if (!name) { setError('Choisissez ou saisissez le nom du superviseur.'); return; }
    const payload = { supervisorName: name, complaints: form.complaints, initialEvaluation: form.initialEvaluation, diagnosticHypothesis: form.diagnosticHypothesis, therapiesReceived: form.therapiesReceived };
    if (care) await run(() => updatePsychologicalCare(fetcher, care.id, payload));
    else if (createAllowed) await run(() => createPsychologicalCare(fetcher, { fichePecmuId: ficheId, ...payload }));
  };
  const openReport = async () => {
    const report: any = care?.report;
    const url = typeof report === 'string' ? report : report?.url || report?.src || report?.file || report?.path || care?.reportFile;
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) { setError('L’URL directe du rapport psychologique est indisponible.'); return; }
    setError('');
    setReportPreview({ url, name: String(reportLabel || 'Rapport psychologique'), mimeType: typeof report === 'object' ? report?.mimeType : undefined });
  };
  const reportLabel = typeof care?.report === 'object' && care.report ? care.report.originalName || care.report.filename : care?.reportName || care?.reportFile;

  return <section className="space-y-5">
    {error && <div role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {loading ? <p role="status" className="text-sm text-slate-500">Chargement du dossier psychologique…</p> : null}
    {!loading && notFound && <section className="space-y-3 rounded border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-semibold">Aucune prise en charge psychologique</h3><p className="text-sm text-slate-600">Ce dossier est éligible à un suivi psychologique distinct du suivi médical.</p>
      {createAllowed ? <form onSubmit={saveCare} className="space-y-4">
        <SupervisorSelect form={form} setForm={setForm} supervisors={supervisors} otherOption={otherOption} freeEntry={supervisorLookupFailed} disabled={busy} />
        <button disabled={busy} className={`${buttonClass} inline-flex items-center gap-2`}><Plus size={16} />{busy ? 'Ouverture…' : 'Commencer la prise en charge psychologique'}</button>
      </form> : null}
    </section>}
    {!loading && care && <>
      <form onSubmit={saveCare} className="space-y-4 rounded border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-semibold">Dossier psychologique #{care.id}</h3><p className="text-sm text-slate-500">Statut : {closed ? 'Clôturé' : care.status || 'En cours'}</p></div><p className="rounded bg-primary/5 px-3 py-2 text-sm font-semibold text-primary">Séances réalisées : {Number.isFinite(Number(care.therapyCount)) ? care.therapyCount : 0}</p></div>
        <SupervisorSelect form={form} setForm={setForm} supervisors={supervisors} otherOption={otherOption} freeEntry={supervisorLookupFailed} disabled={!updateAllowed || busy} />
        <div className="grid gap-4 md:grid-cols-2">
          <TextArea label="Plaintes psychologiques" value={form.complaints} onChange={complaints => setForm(value => ({ ...value, complaints }))} disabled={!updateAllowed || busy} />
          <TextArea label="Évaluation initiale" value={form.initialEvaluation} onChange={initialEvaluation => setForm(value => ({ ...value, initialEvaluation }))} disabled={!updateAllowed || busy} />
          <TextArea label="Hypothèse diagnostique" value={form.diagnosticHypothesis} onChange={diagnosticHypothesis => setForm(value => ({ ...value, diagnosticHypothesis }))} disabled={!updateAllowed || busy} />
          <TextArea label="Thérapies reçues" value={form.therapiesReceived} onChange={therapiesReceived => setForm(value => ({ ...value, therapiesReceived }))} disabled={!updateAllowed || busy} />
        </div>
        {updateAllowed && <button disabled={busy} className={`${buttonClass} inline-flex items-center gap-2`}><Save size={16} />Enregistrer le dossier psychologique</button>}
      </form>

      <section className="space-y-4 rounded border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold">Séances de thérapie</h3>
        {sessions.length ? <ol className="space-y-3">{sessions.map((item: any, index: number) => <li key={item.id ?? index} className="border-l-2 border-primary/30 pl-4"><p className="font-medium">{item.therapy || 'Séance'}</p><p className="text-xs text-slate-500">{item.date || 'Date non renseignée'}{item.agent ? ` · ${item.agent}` : ''}</p>{item.notes && <p className="whitespace-pre-wrap text-sm">{item.notes}</p>}</li>)}</ol> : <p className="text-sm text-slate-500">Aucune séance enregistrée.</p>}
        {updateAllowed && <form onSubmit={event => { event.preventDefault(); void run(() => addPsychologicalTherapySession(fetcher, care.id, session)).then(ok => { if (ok) setSession({ date: today(), therapy: '', notes: '' }); }); }} className="grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-3">
          <label className="text-sm">Date<input required type="date" className={fieldClass} value={session.date} onChange={e => setSession(value => ({ ...value, date: e.target.value }))} /></label>
          <label className="text-sm">Thérapie<input required className={fieldClass} value={session.therapy} onChange={e => setSession(value => ({ ...value, therapy: e.target.value }))} /></label>
          <label className="text-sm md:col-span-3">Notes<textarea className={fieldClass} value={session.notes} onChange={e => setSession(value => ({ ...value, notes: e.target.value }))} /></label>
          <button disabled={busy} className={`${buttonClass} inline-flex items-center gap-2 md:col-span-3`}><Plus size={16} />Ajouter une séance</button>
        </form>}
      </section>

      <section className="space-y-4 rounded border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold">Visites à domicile</h3>
        {visits.length ? <ul className="space-y-3">{visits.map((item: any, index: number) => <li key={item.id ?? index} className="border-t border-slate-100 pt-3"><p className="font-medium">{item.date || 'Date non renseignée'}{item.agent ? ` · ${item.agent}` : ''}</p><p className="whitespace-pre-wrap text-sm text-slate-600">{item.observations}</p></li>)}</ul> : <p className="text-sm text-slate-500">Aucune visite enregistrée.</p>}
        {updateAllowed && <form onSubmit={event => { event.preventDefault(); void run(() => addPsychologicalHomeVisit(fetcher, care.id, visit)).then(ok => { if (ok) setVisit({ date: today(), observations: '' }); }); }} className="grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-2">
          <label className="text-sm">Date<input required type="date" className={fieldClass} value={visit.date} onChange={e => setVisit(value => ({ ...value, date: e.target.value }))} /></label>
          <label className="text-sm md:col-span-2">Observations<textarea required className={fieldClass} value={visit.observations} onChange={e => setVisit(value => ({ ...value, observations: e.target.value }))} /></label>
          <button disabled={busy} className={`${buttonClass} inline-flex items-center gap-2 md:col-span-2`}><Plus size={16} />Ajouter une visite</button>
        </form>}
      </section>

      <section className="space-y-3 rounded border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold">Rapport psychologique</h3>
        {hasReport(care) ? <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-slate-100 p-3"><span className="break-all text-sm">{String(reportLabel || 'Rapport psychologique enregistré')}</span><button type="button" onClick={openReport} className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><ExternalLink size={16} />Visualiser le rapport</button></div> : <p className="text-sm text-slate-500">Aucun rapport déposé.</p>}
        {updateAllowed && <form onSubmit={event => { event.preventDefault(); if (reportFile) void run(() => uploadPsychologicalReport(fetcher, care.id, reportFile)).then(ok => { if (ok) setReportFile(null); }); }} className="flex flex-wrap items-end gap-3">
          <label className="min-w-0 flex-1 text-sm">Fichier PDF, PNG ou JPEG<input required type="file" accept=".pdf,.png,.jpg,.jpeg" className={fieldClass} onChange={event => setReportFile(event.target.files?.[0] || null)} /></label>
          <button disabled={busy || !reportFile} className={`${buttonClass} inline-flex items-center gap-2`}><Upload size={16} />Téléverser le rapport</button>
        </form>}
      </section>

      {closed && <section className="rounded border border-slate-200 bg-white p-5"><h3 className="font-semibold">Prise en charge clôturée</h3><p className="mt-2 text-sm">{care.postTherapyEvaluation || postTherapyEvaluation || 'Évaluation post-thérapie non renseignée'}</p><p className="text-sm text-slate-600">Clôturée le {care.closureDate || '—'}{care.closureNotes ? ` · ${care.closureNotes}` : ''}</p></section>}
      {updateAllowed && <section className="space-y-4 rounded border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold">Clôture psychologique</h3>
        <p className="text-sm text-slate-600">Enregistrez les informations de clôture. Le backend validera les pièces obligatoires.</p>
        <label className="block text-sm">Évaluation post-thérapie<textarea className={fieldClass} value={postTherapyEvaluation} onChange={event => setPostTherapyEvaluation(event.target.value)} /></label>
        <label className="block text-sm">Date de clôture<input type="date" className={fieldClass} value={closureDate} onChange={event => setClosureDate(event.target.value)} /></label>
        <label className="block text-sm">Notes de clôture<textarea className={fieldClass} value={closureNotes} onChange={event => setClosureNotes(event.target.value)} /></label>
        <button type="button" disabled={busy} onClick={() => void run(() => closePsychologicalCare(fetcher, care.id, { postTherapyEvaluation, closureDate, closureNotes }))} className={buttonClass}>Clôturer le suivi psychologique</button>
      </section>}
    </>}
    {reportPreview && <PecmuDocumentViewer document={reportPreview} onClose={() => setReportPreview(null)} />}
  </section>;
}

function SupervisorSelect({ form, setForm, supervisors, otherOption, freeEntry, disabled }: {
  form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>>; supervisors: SupervisorOption[];
  otherOption: SupervisorOption & { requiresSpecification?: boolean }; freeEntry: boolean; disabled: boolean;
}) {
  const update = (key: keyof FormState, value: string) => setForm(previous => ({ ...previous, [key]: value }));
  return <div className="grid gap-3 md:grid-cols-2">
    {freeEntry ? <label className="text-sm font-medium">Superviseur<input required disabled={disabled} className={fieldClass} value={form.supervisorName} onChange={event => update('supervisorName', event.target.value)} placeholder="Nom du superviseur" /></label> : <label className="text-sm font-medium">Superviseur<select required disabled={disabled} className={fieldClass} value={form.supervisorName} onChange={event => update('supervisorName', event.target.value)}><option value="">Sélectionner</option>{supervisors.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}<option value={otherOption.value}>{otherOption.label}</option></select></label>}
    {!freeEntry && form.supervisorName === otherOption.value && <label className="text-sm font-medium">Nom du superviseur<input required disabled={disabled} className={fieldClass} value={form.supervisorOtherName} onChange={event => update('supervisorOtherName', event.target.value)} /></label>}
    {freeEntry && <p className="self-end text-xs text-amber-700">La liste des superviseurs est indisponible ; la saisie libre reste possible.</p>}
  </div>;
}

function TextArea({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean }) {
  return <label className="block text-sm font-medium">{label}<textarea disabled={disabled} className={`${fieldClass} min-h-24`} value={value} onChange={event => onChange(event.target.value)} /></label>;
}
