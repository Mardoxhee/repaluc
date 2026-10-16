"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { Modal, ModalBody } from 'flowbite-react';
import YesNoToggle from './YesNoToggle';
import { Download, LockKeyhole, X } from 'lucide-react';
import type { ActeConsentementPecmu, ActeMedicalPecmu, FichePecmu, PecmuFetcher, SuiviAccompagnement } from '../services/pecmuApi';
import { createActeMedicalPecmu, createConsentementPecmu, createSuiviAccompagnement, getFichePecmu, listActesMedicauxByFiche, listConsentementsByFiche, listSuivisByFiche } from '../services/pecmuPrototype';
import { assertMedicalActAllowed, consentLabels, finishEpisode, readSignedFile, readWorkflow, saveWorkflow, workflowAccess, type ConsentKind, type Outcome, type PecmuWorkflow } from '../services/pecmuWorkflow';

type Props = { ficheId: number; fetcher: PecmuFetcher; onClose: () => void; onChanged: () => void };
type Tab = 'certification' | 'pool' | 'consents' | 'care';
const tabs: Array<{ id: Tab; label: string }> = [{ id: 'certification', label: 'Certification' }, { id: 'pool', label: 'Pool médical' }, { id: 'consents', label: 'Actes de consentement' }, { id: 'care', label: 'Prise en charge médicale' }];
const input = 'mt-1 w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary';
const button = 'border border-primary bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40';
const emptyWorkflow: PecmuWorkflow = { version: 1, consents: [], acts: [], episodes: [] };
const date = (value?: string) => value ? new Date(value).toLocaleDateString('fr-FR') : '—';
const getId = (response: any): number => {
  const id = Number(response?.id ?? response?.data?.id);
  if (!Number.isInteger(id) || id === 0) throw new Error('Le serveur n’a pas retourné l’identifiant du document enregistré.');
  return id;
};
function download(content: Blob, filename: string) {
  const url = URL.createObjectURL(content);
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function downloadConsent(item: ActeConsentementPecmu) {
  const bytes = Uint8Array.from(atob(item.file.replace(/^data:[^,]+,/, '')), char => char.charCodeAt(0));
  download(new Blob([bytes]), item.filename);
}
function downloadClosure(fiche: FichePecmu, workflow: PecmuWorkflow) {
  if (!workflow.closedAt) return;
  const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
  const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><title>Fiche de clôture PECMU ${fiche.id}</title><style>body{font:16px Arial,sans-serif;max-width:800px;margin:48px auto;color:#172033}h1,h2{color:#007fba}section{border-top:1px solid #ccd5df;margin-top:24px}p{white-space:pre-wrap;line-height:1.6}@media print{body{margin:20mm}}</style><h1>Fiche de clôture PECMU</h1><p><strong>DOCUMENT DE DÉMONSTRATION — NON ENREGISTRÉ AU SERVEUR</strong></p><p>Dossier : ${fiche.id}\nVictime : ${escape(fiche.victimName)}\nÂge : ${escape(fiche.age)}\nSexe : ${escape(fiche.sex)}\nProvince : ${escape(fiche.province)}\nClôture : ${escape(date(workflow.closedAt))}\nIssue : ${escape(workflow.episodes.at(-1)?.outcome)}</p><h2>Décision du pool médical</h2><p>${escape(workflow.pool?.reason)}</p>${workflow.episodes.map(e => `<section><h2>Prise en charge ${e.number}</h2><p>Structure : ${escape(e.structure)}\nDu ${escape(date(e.openedAt))} au ${escape(date(e.endedAt))}\nIssue : ${escape(e.outcome)}\nSynthèse médicale : ${escape(e.summary)}</p></section>`).join('')}</html>`;
  download(new Blob([html], { type: 'text/html;charset=utf-8' }), `fiche-cloture-pecmu-${fiche.id}.html`);
}

export default function PecmuDossierModal({ ficheId, fetcher, onClose, onChanged }: Props) {
  const [tab, setTab] = useState<Tab>('certification');
  const [fiche, setFiche] = useState<FichePecmu | null>(null);
  const [workflow, setWorkflow] = useState<PecmuWorkflow>(emptyWorkflow);
  const [consents, setConsents] = useState<ActeConsentementPecmu[]>([]);
  const [acts, setActs] = useState<ActeMedicalPecmu[]>([]);
  const [suivis, setSuivis] = useState<SuiviAccompagnement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [signed, setSigned] = useState('Non');
  const [agent, setAgent] = useState('');
  const [signedAt, setSignedAt] = useState('');
  const [kind, setKind] = useState<ConsentKind>('care');
  const [document, setDocument] = useState<{ filename: string; file: string } | null>(null);
  const [reason, setReason] = useState('');
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [structure, setStructure] = useState('');
  const [summary, setSummary] = useState('');
  const [report, setReport] = useState('');
  const [cost, setCost] = useState('');
  const [procedureConsent, setProcedureConsent] = useState('');
  const [outcome, setOutcome] = useState<Outcome | ''>('');
  const [destination, setDestination] = useState('');
  const [transferConsent, setTransferConsent] = useState('');
  const [avis, setAvis] = useState('');
  const [rdv, setRdv] = useState('');

  const load = useCallback(async () => {
    const [record, documents, medicalActs, followups] = await Promise.all([getFichePecmu(fetcher, ficheId), listConsentementsByFiche(fetcher, ficheId), listActesMedicauxByFiche(fetcher, ficheId), listSuivisByFiche(fetcher, ficheId)]);
    const state = readWorkflow(record);
    setFiche(record); setWorkflow(state); setConsents(documents.filter(d => d.isActive !== false)); setActs(medicalActs); setSuivis(followups);
    setReason(state.pool?.reason || ''); setEligible(state.pool?.eligible ?? null);
    setStructure(state.episodes.at(-1)?.structure || record.careStructureName || '');
    setSummary(state.episodes.at(-1)?.summary || record.incidentDetails || '');
  }, [fetcher, ficheId]);
  useEffect(() => { setLoading(true); load().catch(e => setError(e.message)).finally(() => setLoading(false)); }, [load]);
  const access = workflowAccess(workflow, consents.map(c => c.id));
  const closed = Boolean(workflow.closedAt);
  const current = workflow.episodes.at(-1);
  useEffect(() => { if (!access[tab]) setTab('certification'); }, [access[tab], tab]);

  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true); setError('');
    try { await action(); onChanged(); }
    catch (e: any) { setError(e?.message || 'Enregistrement impossible. Réessayez.'); }
    finally { setBusy(false); }
  };
  const persist = async (next: PecmuWorkflow, extra: Partial<FichePecmu> = {}) => {
    const saved = await saveWorkflow(fetcher, ficheId, next, extra);
    setFiche(saved); setWorkflow(readWorkflow(saved));
  };
  const upload = (file?: File) => {
    setDocument(null);
    if (file) void run(async () => { setDocument(await readSignedFile(file)); });
  };
  const saveConsent = (certification: boolean) => run(async () => {
    if (closed || !document || !agent.trim() || !signedAt || (certification ? signed !== 'Oui' : !access.consents)) throw new Error('Confirmez la signature et complétez les informations du document.');
    const created = await createConsentementPecmu(fetcher, { ...document, agent: agent.trim(), fichePecmuId: ficheId });
    const id = getId(created);
    const next: PecmuWorkflow = certification
      ? { ...workflow, certification: { consentId: id, uploadedAt: new Date().toISOString() } }
      : { ...workflow, consents: [...workflow.consents, { id, kind, signedAt }] };
    await persist(next);
    setDocument(null); await load(); setTab(certification ? 'pool' : 'consents');
  });
  const validConsents = (type: ConsentKind) => workflow.consents.filter(c => c.kind === type && consents.some(d => d.id === c.id));
  const documentFields = <>
    <label>Agent responsable *<input required className={input} value={agent} onChange={e => setAgent(e.target.value)} /></label>
    <label>Date de signature *<input required type="date" className={input} value={signedAt} onChange={e => setSignedAt(e.target.value)} /></label>
    <label className="md:col-span-2">Formulaire dûment rempli et signé *<input key={`${tab}-${document?.filename || 'empty'}`} required={!document} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className={input} onChange={e => upload(e.target.files?.[0])} /><span className="mt-1 block text-xs text-slate-500">{document?.filename || 'PDF ou image, 10 Mo maximum.'}</span></label>
  </>;

  return <Modal show onClose={onClose} size="7xl" className="!z-[100] !h-dvh !bg-slate-950/60" aria-label="Dossier PECMU"><ModalBody className="!p-0">
    <div className="bg-white text-slate-900">
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Dossier PECMU {ficheId < 0 ? `· Démonstration ${Math.abs(ficheId)}` : `#${ficheId}`}{closed ? ' · Clôturé' : ''}</p><h2 className="mt-1 text-2xl font-bold">{fiche?.victimName || 'Dossier PECMU'}</h2></div><button type="button" onClick={onClose} aria-label="Fermer" className="p-2"><X /></button></header>
      <nav className="flex overflow-x-auto border-b border-slate-200" aria-label="Étapes du dossier">{tabs.map((item, index) => <button key={item.id} type="button" disabled={loading || !fiche || !access[item.id] || busy} onClick={() => { setTab(item.id); setDocument(null); }} className={`flex shrink-0 items-center gap-2 border-b-2 px-5 py-4 text-sm font-semibold disabled:cursor-not-allowed disabled:text-slate-400 ${tab === item.id ? 'border-primary text-primary' : 'border-transparent text-slate-600'}`}>{!access[item.id] && <LockKeyhole size={14} />}{index + 1}. {item.label}</button>)}</nav>
      <div className="max-h-[70vh] overflow-y-auto bg-slate-50 p-5 md:p-7">
        {error && <div role="alert" className="mb-4 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {loading && <p role="status">Chargement du dossier…</p>}
        {!loading && !fiche && <button className={button} onClick={() => run(load)}>Réessayer</button>}
        {!loading && fiche && <div className="space-y-5">
          {closed && <section className="flex flex-wrap items-center justify-between gap-3 border border-primary/20 bg-primary/5 p-4"><p>Dossier clôturé le {date(workflow.closedAt)} · {current?.outcome}</p><button className={button} onClick={() => downloadClosure(fiche, workflow)}><Download className="mr-2 inline" size={16} />Télécharger la fiche de clôture</button></section>}
          {tab === 'certification' && <>
            <Panel title="Consentement initial de la victime">
              {access.pool ? <p className="text-sm text-primary">Fiche signée chargée le {date(workflow.certification?.uploadedAt)}. La certification permet l’examen par le pool médical.</p> : <form onSubmit={e => { e.preventDefault(); void saveConsent(true); }}><fieldset disabled={busy || closed} className="grid gap-4 md:grid-cols-2"><YesNoToggle className="md:col-span-2" label="La victime a-t-elle signé la fiche de consentement ?" checked={signed === 'Oui'} onChange={checked => { setSigned(checked ? 'Oui' : 'Non'); setDocument(null); }} />{signed === 'Non' && <p className="md:col-span-2 text-sm text-slate-600">Le dossier reste à l’étape de certification jusqu’au chargement de la fiche signée.</p>}{signed === 'Oui' && <>{documentFields}<div><button disabled={!document} className={button}>Enregistrer la certification</button></div></>}</fieldset></form>}
              {consents.filter(c => c.id === workflow.certification?.consentId).map(c => <DocumentRow key={c.id} item={c} onDownload={() => run(async () => downloadConsent(c))} />)}
            </Panel>
            <Panel title="Fiche d’alerte"><dl className="grid gap-4 text-sm md:grid-cols-2">{[['Victime', fiche.victimName], ['Âge', fiche.age], ['Sexe', fiche.sex], ['Province', fiche.province], ['Localité', fiche.locality], ['Téléphone', fiche.victimPhone], ['Violation subie', fiche.violationType], ['Statut médical', fiche.medicalStatus], ['Détails de l’incident', fiche.incidentDetails], ['Pronostic vital', fiche.vitalPrognosis]].map(([label, value]) => <div key={label}><dt className="text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap font-medium">{value || '—'}</dd></div>)}</dl></Panel>
          </>}
          {tab === 'pool' && access.pool && <Panel title="Décision du pool des médecins du Fonds"><form onSubmit={e => { e.preventDefault(); void run(async () => {
            if (!access.pool || closed || workflow.consents.length || eligible === null || !reason.trim()) throw new Error('Choisissez une décision et motivez-la.');
            await persist({ ...workflow, pool: { eligible, reason: reason.trim(), decidedAt: new Date().toISOString() } }, { pecmuDecision: eligible ? 'Cas éligible' : 'Cas non-éligible', referralDecision: reason.trim() });
            if (eligible) setTab('consents');
          }); }}><fieldset disabled={busy || closed || workflow.consents.length > 0} className="space-y-4"><div className="flex flex-wrap gap-3">{[true, false].map(value => <button type="button" key={String(value)} aria-pressed={eligible === value} onClick={() => setEligible(value)} className={`border px-5 py-3 text-sm font-semibold ${eligible === value ? 'border-primary bg-primary text-white' : 'border-slate-300 bg-white text-slate-700'}`}>{value ? 'Dossier éligible' : 'Dossier non éligible'}</button>)}</div><label className="block">Motivation de la décision *<textarea required className={`${input} min-h-32`} value={reason} onChange={e => setReason(e.target.value)} /></label><button disabled={eligible === null} className={button}>Enregistrer la décision</button></fieldset></form>{workflow.pool && <p className="mt-4 text-sm text-slate-600">Décision enregistrée le {date(workflow.pool.decidedAt)}. {workflow.pool.eligible ? 'Les actes de consentement sont accessibles.' : 'Les consentements et la prise en charge restent verrouillés.'}</p>}</Panel>}
          {tab === 'consents' && access.consents && <Panel title="Actes de consentement">
            <p className="mb-4 text-sm text-slate-600">Le consentement signé à la prise en charge médicale ouvre l’étape suivante. Chaque acte et chaque transfert nécessitent leur propre consentement.</p>
            {!closed && <form onSubmit={e => { e.preventDefault(); void saveConsent(false); }}><fieldset disabled={busy} className="grid gap-4 md:grid-cols-2"><label className="md:col-span-2">Type de document *<select className={input} value={kind} onChange={e => { setKind(e.target.value as ConsentKind); setDocument(null); }}>{Object.entries(consentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>{documentFields}<div><button disabled={!document} className={button}>Enregistrer le document signé</button></div></fieldset></form>}
            {consents.filter(c => c.id !== workflow.certification?.consentId).map(c => <DocumentRow key={c.id} item={c} label={consentLabels[workflow.consents.find(entry => entry.id === c.id)?.kind as ConsentKind] || 'Document antérieur — type non renseigné'} onDownload={() => run(async () => downloadConsent(c))} />)}
          </Panel>}
          {tab === 'care' && access.care && <>
            {!current && !closed && <Panel title="Ouvrir la première fiche de prise en charge"><form onSubmit={e => { e.preventDefault(); void run(async () => { if (!access.care || !structure.trim() || closed) return; await persist({ ...workflow, episodes: [{ number: 1, structure: structure.trim(), summary, openedAt: new Date().toISOString() }] }); }); }}><fieldset disabled={busy} className="space-y-4"><label className="block">Structure de prise en charge *<input required className={input} value={structure} onChange={e => setStructure(e.target.value)} /></label><label className="block">Informations médicales de suivi<textarea className={input} value={summary} onChange={e => setSummary(e.target.value)} /></label><button className={button}>Ouvrir la prise en charge</button></fieldset></form></Panel>}
            {workflow.episodes.map(episode => <Panel key={episode.number} title={`Fiche de prise en charge ${episode.number} · ${episode.structure}`}><p className="text-sm text-slate-500">Ouverte le {date(episode.openedAt)}{episode.outcome ? ` · ${episode.outcome}` : ' · En cours'}</p><p className="mt-3 whitespace-pre-wrap text-sm">{episode.summary || 'Aucune synthèse renseignée.'}</p></Panel>)}
            {current && !closed && <Panel title="Enregistrer un acte médical"><form onSubmit={e => { e.preventDefault(); void run(async () => {
              const consentId = Number(procedureConsent);
              assertMedicalActAllowed(workflow, consents.map(c => c.id), consentId);
              if (!report.trim()) throw new Error('Renseignez le rapport médical.');
              const consent = consents.find(c => c.id === consentId)!;
              const created = await createActeMedicalPecmu(fetcher, { fichePecmuId: ficheId, rapportMedical: report.trim(), cout: Number(cost || 0), partenaireNom: current.structure, examens: [{ filename: consent.filename, file: consent.file }] });
              await persist({ ...workflow, acts: [...workflow.acts, { id: getId(created), consentId, episode: current.number }] });
              setReport(''); setCost(''); setProcedureConsent(''); await load();
            }); }}><fieldset disabled={busy} className="grid gap-4 md:grid-cols-2"><label className="md:col-span-2">Rapport / acte réalisé *<textarea required className={input} value={report} onChange={e => setReport(e.target.value)} /></label><label>Coût (USD)<input min="0" type="number" step="0.01" className={input} value={cost} onChange={e => setCost(e.target.value)} /></label><label>Consentement à cet acte *<select required className={input} value={procedureConsent} onChange={e => setProcedureConsent(e.target.value)}><option value="">Sélectionner le formulaire signé</option>{validConsents('procedure').filter(c => !workflow.acts.some(a => a.consentId === c.id)).map(c => <option key={c.id} value={c.id}>{consents.find(d => d.id === c.id)?.filename} · {date(c.signedAt)}</option>)}</select></label><p className="md:col-span-2 text-xs text-slate-500">Chargez le formulaire signé dans « Actes de consentement ». Il sera joint à cet acte médical.</p><div><button className={button}>Enregistrer l’acte médical</button></div></fieldset></form></Panel>}
            <Panel title="Actes médicaux enregistrés">{acts.length ? acts.map(act => <div key={act.id} className="border-b border-slate-100 py-3 text-sm"><p className="font-semibold">{act.rapportMedical}</p><p className="text-slate-500">{act.partenaireNom} · {Number(act.cout || 0).toLocaleString('fr-FR')} USD · {workflow.acts.find(a => a.id === act.id) ? `Prise en charge ${workflow.acts.find(a => a.id === act.id)?.episode}` : 'Acte antérieur'}</p></div>) : <p className="text-sm text-slate-500">Aucun acte enregistré.</p>}</Panel>
            {current && !closed && <Panel title="Issue de la prise en charge"><form onSubmit={e => { e.preventDefault(); void run(async () => {
              if (!outcome || !access.care) return;
              if (outcome === 'Transféré à un niveau supérieur' && !validConsents('transfer').some(c => c.id === Number(transferConsent))) throw new Error('Chargez un consentement au transfert signé.');
              const next = finishEpisode(workflow, outcome, summary, destination, Number(transferConsent) || undefined);
              await persist(next, { medicalStatus: next.closedAt ? `Clôturé — ${outcome}` : outcome });
              setOutcome(''); setDestination(''); setTransferConsent(''); await load();
            }); }}><fieldset disabled={busy} className="grid gap-4 md:grid-cols-2"><label className="md:col-span-2">Synthèse médicale et informations de suivi *<textarea required className={`${input} min-h-28`} value={summary} onChange={e => setSummary(e.target.value)} /></label><label className="md:col-span-2">Issue *<select required className={input} value={outcome} onChange={e => setOutcome(e.target.value as Outcome)}><option value="">Sélectionner</option>{(current.number === 2 ? ['Stabilisé/guéri', 'Décédé'] : ['Stabilisé/guéri', 'Décédé', 'Transféré à un niveau supérieur', 'Perdu de vue']).map(value => <option key={value}>{value}</option>)}</select></label>{outcome === 'Transféré à un niveau supérieur' && <><label>Structure receveuse *<input required className={input} value={destination} onChange={e => setDestination(e.target.value)} /></label><label>Consentement au transfert *<select required className={input} value={transferConsent} onChange={e => setTransferConsent(e.target.value)}><option value="">Sélectionner</option>{validConsents('transfer').map(c => <option key={c.id} value={c.id}>{consents.find(d => d.id === c.id)?.filename}</option>)}</select></label><p className="md:col-span-2 text-sm text-slate-600">Le dossier restera ouvert. Une deuxième fiche reprendra cette synthèse pour la structure receveuse.</p></>}{['Stabilisé/guéri', 'Décédé'].includes(outcome) && <p className="md:col-span-2 text-sm text-slate-600">Cette issue clôturera le dossier. La fiche de clôture sera disponible au téléchargement.</p>}{outcome === 'Perdu de vue' && <p className="md:col-span-2 text-sm text-slate-600">Le dossier restera ouvert pour permettre la reprise du suivi.</p>}<div><button className={button}>{['Stabilisé/guéri', 'Décédé'].includes(outcome) ? 'Clôturer le dossier' : outcome === 'Transféré à un niveau supérieur' ? 'Enregistrer le transfert et ouvrir la deuxième fiche' : 'Enregistrer l’issue'}</button></div></fieldset></form></Panel>}
            <Panel title="Suivis et accompagnements">{!closed && <form onSubmit={e => { e.preventDefault(); void run(async () => { if (!access.care || closed || !avis.trim()) return; await createSuiviAccompagnement(fetcher, { avis: avis.trim(), dateProchainRdv: rdv || undefined, fichePecmuId: ficheId }); setAvis(''); setRdv(''); await load(); }); }}><fieldset disabled={busy} className="grid gap-4 md:grid-cols-2"><label>Avis / commentaire *<textarea required className={input} value={avis} onChange={e => setAvis(e.target.value)} /></label><label>Prochain rendez-vous<input type="date" className={input} value={rdv} onChange={e => setRdv(e.target.value)} /></label><div><button className={button}>Enregistrer le suivi</button></div></fieldset></form>}{suivis.map(s => <div key={s.id} className="mt-4 border-t border-slate-200 pt-3 text-sm"><p>{s.avis}</p><p className="text-slate-500">Prochain rendez-vous : {date(s.dateProchainRdv)}</p></div>)}</Panel>
          </>}
        </div>}
      </div>
    </div>
  </ModalBody></Modal>;
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="border border-slate-200 bg-white p-5"><h3 className="mb-4 text-base font-semibold text-slate-900">{title}</h3>{children}</section>; }
function DocumentRow({ item, label, onDownload }: { item: ActeConsentementPecmu; label?: string; onDownload: () => void }) { return <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm"><div><p className="font-medium">{label || 'Fiche de consentement initiale'}</p><p className="break-all text-slate-500">{item.filename} · {item.agent}</p></div><button type="button" onClick={onDownload} disabled={!item.file} className="p-2 text-primary disabled:opacity-40" aria-label={`Télécharger ${item.filename}`}><Download size={18} /></button></div>; }
