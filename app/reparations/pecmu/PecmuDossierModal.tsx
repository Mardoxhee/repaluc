'use client';

import { rdcProvinces } from '../constants/provinces';
import { healthZonesByProvince } from '../constants/healthZonesByProvince';
import { spreadsheetPartners } from '../constants/spreadsheetPartners';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, ModalBody } from 'flowbite-react';
import { Eye, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { getConnectedAgentFullName, getConnectedAgentFunction } from '../../utils/currentUser';
import { normalizeApiList } from '../utils/mentionStats';
import type { PecmuFetcher } from '../services/pecmuApi';
import {
  certifyPecmuAlert, uploadCertificationNote, activeWorkflowTab, consentTypes, loadPecmuWorkflow,
  getMedicalSupervisorOptions, medicalDocumentTypes, outcomeLabels, PecmuApiError, statusLabels, uploadPecmuFile, validatePecmuFile, workflowJson,
  type FileMetadata, type MedicalCare, type SupervisorOption, type WorkflowSnapshot, type WorkflowTab,
} from '../services/pecmuWorkflowApi';
import PecmuFollowUps from './PecmuFollowUps';
import PecmuCareCard from './PecmuCareCard';
import PecmuEvolutionForm from './PecmuEvolutionForm';
import YesNoToggle from './YesNoToggle';
import PecmuDocumentViewer, { type DocumentPreview } from './PecmuDocumentViewer';
import { buttonClass, fieldClass, WorkflowForm, type WorkflowField } from './WorkflowForm';
import PecmuPsychologicalCare from './PecmuPsychologicalCare';
import PecmuVictimSearch, { masterVictimName, type MasterVictim } from './PecmuVictimSearch';

type Props = { ficheId: number; fetcher: PecmuFetcher; onClose: () => void; onChanged: () => void };
const tabs: Array<{ id: WorkflowTab; label: string }> = [
  { id: 'identity', label: 'Identification et alerte' }, { id: 'certification', label: 'Certification' },
  { id: 'decision', label: 'Pool médical' }, { id: 'consents', label: 'Consentements' },
  { id: 'care', label: 'Prise en charge médicale' }, { id: 'psychological', label: 'Prise en charge psychologique' }, { id: 'followups', label: 'Suivis et rendez-vous' },
  { id: 'orientations', label: 'Orientations' }, { id: 'history', label: 'Historique' },
];
const provinceOptions = Object.fromEntries(rdcProvinces.map(province => [province, province]));
const alertStructureTypes: Record<string, string> = {
  STRUCTURE_MEDICALE: 'Structure médicale', ONG: 'ONG', RELAIS_COMMUNAUTAIRE: 'Relais communautaire',
  SERVICE_PUBLIC: 'Service public', AUTRE: 'Autre',
};
const careFields: WorkflowField[] = [
  { key: 'careMode', label: 'Mode de prise en charge', type: 'select', required: true, options: { OUTPATIENT: 'Ambulatoire', HOSPITALIZATION: 'Hospitalisation' } },
  { key: 'careDate', label: 'Date des soins', type: 'date', required: true, when: values => values.careMode === 'OUTPATIENT' },
  { key: 'hospitalizationStartDate', label: 'Début d’hospitalisation', type: 'date', required: true, when: values => values.careMode === 'HOSPITALIZATION' },
  { key: 'hospitalizationEndDate', label: 'Fin d’hospitalisation', type: 'date', when: values => values.careMode === 'HOSPITALIZATION' },
  { key: 'careProvince', label: 'Province', type: 'select', options: provinceOptions, required: true, resetOnChange: ['careHealthZone', 'careStructureName'] },
  { key: 'careHealthZone', label: 'Zone de santé', type: 'select', required: true, resetOnChange: ['careStructureName'], options: values => Object.fromEntries((healthZonesByProvince[values.careProvince] || []).map(zone => [zone, zone])) },
  { key: 'careStructureName', label: 'Structure de prise en charge', type: 'select', required: true, options: (values) => Object.fromEntries(spreadsheetPartners
    .filter(partner => partner.province === values.careProvince && partner.zoneSante === values.careHealthZone)
    .map(partner => [partner.nom, partner.nom])) },
  { key: 'treatingDoctorName', label: 'Médecin traitant' }, { key: 'treatingDoctorPhone', label: 'Téléphone du médecin' },
  { key: 'complaints', label: 'Plaintes', type: 'list', itemLabel: 'Plainte', addLabel: 'Ajouter une plainte' }, { key: 'diagnosis', label: 'Diagnostics', type: 'list', itemLabel: 'Diagnostic', addLabel: 'Ajouter un diagnostic' },
  { key: 'treatmentReceived', label: 'Traitements reçus', type: 'list', itemLabel: 'Traitement', addLabel: 'Ajouter un traitement' },
  { key: 'appointmentDate1', label: 'Premier rendez-vous', type: 'date' }, { key: 'appointmentComment1', label: 'Commentaires du premier rendez-vous', type: 'textarea' },
  { key: 'appointmentDate2', label: 'Deuxième rendez-vous', type: 'date' }, { key: 'appointmentComment2', label: 'Commentaires du deuxième rendez-vous', type: 'textarea' },
  { key: 'appointmentDate3', label: 'Troisième rendez-vous', type: 'date' }, { key: 'appointmentComment3', label: 'Commentaires du troisième rendez-vous', type: 'textarea' },
  { key: 'bilanParaclinique', label: 'Bilan paraclinique', type: 'textarea' },
  { key: 'cout', label: 'Coût (USD)', type: 'number' }, { key: 'observation', label: 'Observation', type: 'textarea' },
];
const selectableConsentTypes = Object.fromEntries(Object.entries(consentTypes).filter(([key]) => key !== 'PSYCHOLOGICAL_ACT'));
const consentFields: WorkflowField[] = [
  { key: 'consentType', label: 'Type de consentement', type: 'select', options: selectableConsentTypes, required: true },
  { key: 'consentDate', label: 'Date du consentement', type: 'date', required: true },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];
const consentPayload = (values: Record<string, any>, consentDate?: string) => {
  const agent = getConnectedAgentFullName();
  if (!agent) throw new Error('Impossible de retrouver votre identité dans la session. Reconnectez-vous.');
  const today = new Date();
  return {
    consentType: values.consentType,
    consentStatus: values.consentType === 'REFUSAL' ? 'REFUSED' : 'SIGNED',
    agent,
    consentDate: consentDate || values.consentDate || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
    notes: values.notes,
  };
};
const dateLabel = (value?: string) => value ? new Date(value).toLocaleDateString('fr-FR') : '—';
const documentName = (file: FileMetadata, fallback: string) => file.originalName || file.filename || fallback;
const fileType = (file: FileMetadata) => file.type || file.documentType;
const directDocumentUrl = (file: any): string | undefined => {
  const candidates = [file?.url, file?.src, file?.file, file?.path, file?.documentUrl, file?.document?.url, file?.file?.url];
  return candidates.find(value => typeof value === 'string' && /^https?:\/\//i.test(value.trim()))?.trim();
};
const errorHints: Record<string, string> = {
  CERTIFICATION_NOTE_REQUIRED: 'Ajoutez la note dans l’onglet Certification.',
  SIGNED_MEDICAL_CARE_CONSENT_REQUIRED: 'Ajoutez un consentement signé à la prise en charge et téléversez son fichier.',
  TRANSFER_NOTE_REQUIRED: 'Ajoutez la note de transfert sur la prise en charge précédente.',
  MEDICAL_REPORT_REQUIRED: 'Ajoutez le rapport final dans l’onglet Clôture.',
  DEATH_CERTIFICATE_REQUIRED: 'Ajoutez le certificat de décès dans l’onglet Clôture.',
  CLOSURE_FORM_REQUIRED: 'Ajoutez le formulaire de clôture.',
  FINAL_MEDICAL_OUTCOME_REQUIRED: 'Renseignez l’issue et sa date sur la dernière prise en charge.',
  INSUFFICIENT_PERMISSIONS: 'Votre compte n’est pas autorisé à effectuer cette action.',
  RESOURCE_OUT_OF_SCOPE: 'Ce dossier est hors de votre périmètre SSO.',
  CORE_SSO_UNAVAILABLE: 'Le service d’authentification est temporairement indisponible. Réessayez.',
};

export default function PecmuDossierModal({ ficheId, fetcher, onClose, onChanged }: Props) {
  const [state, setState] = useState<WorkflowSnapshot | null>(null);
  const [tab, setTab] = useState<WorkflowTab>('certification');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncFailed, setSyncFailed] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [version, setVersion] = useState(0);
  const [preview, setPreview] = useState<DocumentPreview | null>(null);
  const [showNewCare, setShowNewCare] = useState(false);
  const [editCare, setEditCare] = useState(false);
  const [certificationChoice, setCertificationChoice] = useState<boolean | null>(null);
  const [certificationFile, setCertificationFile] = useState<File | null>(null);
  const uploadedCertification = useRef<string | null>(null);
  const [recordedCertification, setRecordedCertification] = useState<{ ficheId: number; reference: string } | null>(null);
  const [recordedDecision, setRecordedDecision] = useState<{ ficheId: number; values: Record<string, any> } | null>(null);
  const [consentFile, setConsentFile] = useState<File | null>(null);
  const [editingConsent, setEditingConsent] = useState<number | null>(null);
  const [supervisors, setSupervisors] = useState<SupervisorOption[]>([]);
  const [otherSupervisor, setOtherSupervisor] = useState<SupervisorOption & { requiresSpecification?: boolean }>({ value: 'OTHER', label: 'Autre à préciser', requiresSpecification: true });
  const [supervisorLookupFailed, setSupervisorLookupFailed] = useState(false);
  const [carePartners, setCarePartners] = useState<Array<{ id?: number; nom?: string; structure?: string; province?: string; zoneSante?: string; healthZone?: string }>>([...spreadsheetPartners]);
  const [linkedVictim, setLinkedVictim] = useState<MasterVictim | null>(null);
  const [selectedOrientations, setSelectedOrientations] = useState<string[]>([]);
  const [orientationNotes, setOrientationNotes] = useState('');
  const mutationLock = useRef(false);
  const statusRef = useRef<string | null>(null);
  const base = `/fiche-pecmu/${ficheId}`;
  const load = useCallback(async () => {
    const fresh = await loadPecmuWorkflow(fetcher, ficheId);
    setState(fresh); setSyncFailed(false);
    setSelectedOrientations(Array.isArray(fresh.fiche.orientations) ? fresh.fiche.orientations.filter((value: unknown): value is string => typeof value === 'string' && value in orientationLabels) : []);
    setOrientationNotes(typeof fresh.fiche.orientationNotes === 'string' ? fresh.fiche.orientationNotes : '');
    if (statusRef.current !== fresh.currentStatus) { setTab(activeWorkflowTab(fresh.currentStatus) === 'closure' ? 'care' : activeWorkflowTab(fresh.currentStatus)); statusRef.current = fresh.currentStatus; }
    return fresh;
  }, [fetcher, ficheId]);
  useEffect(() => {
    void load().catch(e => { setError(e.message); setSyncFailed(true); }).finally(() => setLoading(false));
  }, [load]);
  useEffect(() => {
    let active = true;
    void getMedicalSupervisorOptions(fetcher).then(result => {
      if (!active) return;
      setSupervisors(result.data); setOtherSupervisor(result.other); setSupervisorLookupFailed(false);
    }).catch(() => { if (active) { setSupervisors([]); setSupervisorLookupFailed(true); } });
    return () => { active = false; };
  }, [fetcher]);
  useEffect(() => {
    let active = true;
    void fetcher('/partenaires').then(result => {
      if (active) setCarePartners([...spreadsheetPartners, ...normalizeApiList(result)]);
    }).catch(() => { if (active) setCarePartners([...spreadsheetPartners]); });
    return () => { active = false; };
  }, [fetcher]);
  // Authorization and workflow transition rules are enforced by the API.
  const can = (_action: string) => Boolean(state);
  const closed = state?.currentStatus === 'CLOSED';
  const medicalDecision = state?.medicalDecision ?? state?.fiche.medicalDecision;
  const decisionValues = {
    ...(recordedDecision?.ficheId === ficheId ? recordedDecision.values : {}),
    ...Object.fromEntries(Object.entries(state?.fiche || {}).filter(([, value]) => value != null && value !== '')),
    ...Object.fromEntries(Object.entries(medicalDecision || {}).filter(([, value]) => value != null && value !== '')),
  };
  const hasMedicalDecision = Boolean(decisionValues.pecmuDecision) || typeof decisionValues.eligible === 'boolean';
  if (typeof decisionValues.eligible === 'boolean') decisionValues.pecmuDecision = decisionValues.eligible ? 'Éligible' : 'Non éligible';
  if (decisionValues.comment) decisionValues.medicalDecisionComment = decisionValues.comment;
  if (decisionValues.decisionDate) decisionValues.decisionDate = dateLabel(decisionValues.decisionDate);
  const certification = state?.certification ?? state?.fiche.certification;
  const savedCertificationFile = certification?.certificationFile?.trim() || (recordedCertification?.ficheId === ficheId ? recordedCertification.reference : undefined);
  const hasRecordedCertification = Boolean(savedCertificationFile || certification?.certified === true || state?.fiche.documents?.some(file => fileType(file) === 'CERTIFICATION_NOTE'));
  const certifyAlert = hasRecordedCertification || (certificationChoice ?? false);
  const latest = state?.medicalCare.at(-1);
  const canAddCare = Boolean(state);
  const isTransferred = state?.currentStatus === 'TRANSFERRED';
  const supervisorField: WorkflowField = {
    key: 'supervisorName', label: 'Superviseur médical', required: true,
    type: supervisorLookupFailed ? 'text' : 'select',
    options: Object.fromEntries([...supervisors, otherSupervisor].map(option => [option.value, option.label])),
  };
  const careFormFields: WorkflowField[] = [
    supervisorField,
    { key: 'supervisorOtherName', label: 'Nom du superviseur', required: true, when: values => !supervisorLookupFailed && values.supervisorName === otherSupervisor.value },
    ...careFields.map(field => field.key === 'careStructureName' ? {
      ...field,
      options: (values: Record<string, any>) => {
        const options: Record<string, string> = {};
        carePartners.filter(partner => partner.province === values.careProvince && (partner.zoneSante || partner.healthZone) === values.careHealthZone).forEach(partner => {
          const name = partner.nom || partner.structure || '';
          if (name) options[name] = name;
        });
        const current = String(values.careStructureName || '');
        if (current && !(current in options)) options[current] = current;
        return options;
      },
    } : field),
  ];
  const normalizeSupervisorValues = (values: Record<string, any>) => {
    const result = { ...values };
    result.supervisorName = supervisorLookupFailed || values.supervisorName !== otherSupervisor.value ? values.supervisorName : values.supervisorOtherName;
    delete result.supervisorOtherName;
    if (!result.supervisorName?.trim()) throw new Error('Choisissez ou saisissez le nom du superviseur.');
    return result;
  };

  const mutate = async (operation: () => Promise<unknown>): Promise<boolean> => {
    if (mutationLock.current) return false;
    mutationLock.current = true; setBusy(true); setError(''); setErrorCode('');
    let succeeded = false;
    try {
      await operation(); succeeded = true;
      await load(); setVersion(value => value + 1); onChanged();
      return true;
    } catch (e: any) {
      setErrorCode(e?.code || '');
      let message = `${e.message || 'Enregistrement impossible.'}${errorHints[e.code] ? ` ${errorHints[e.code]}` : ''}`;
      if (succeeded) { setSyncFailed(true); message = 'L’opération a été enregistrée, mais le dossier n’a pas pu être rechargé. Actualisez le parcours avant de continuer.'; }
      else {
        // Also refresh after partially completed multi-request operations (consent + file).
        try { await load(); } catch { setSyncFailed(true); }
      }
      if (e instanceof PecmuApiError && e.statusCode === 409) { statusRef.current = null; try { await load(); } catch { setSyncFailed(true); } }
      setError(message); return false;
    } finally { mutationLock.current = false; setBusy(false); }
  };
  const json = (path: string, values: unknown, method = 'POST') => mutate(() => workflowJson(fetcher, path, values, method));
  const confirm = async (title: string) => (await Swal.fire({ title, icon: 'warning', showCancelButton: true, confirmButtonText: 'Confirmer', cancelButtonText: 'Annuler', confirmButtonColor: '#007fba' })).isConfirmed;
  const remove = async (path: string) => { if (await confirm('Supprimer cet élément ?')) await mutate(() => fetcher(path, { method: 'DELETE' })); };
  const docButton = (file: any, name: string, mimeType?: string) => {
    const url = directDocumentUrl(file);
    return url ? <button type="button" onClick={() => setPreview({ url, name, mimeType })} className="inline-flex shrink-0 items-center gap-2 rounded-md border border-primary/30 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/5"><Eye size={17} />Visualiser</button> : <span className="text-xs text-slate-500">URL du document indisponible</span>;
  };
  const ficheDocument = (type: 'CERTIFICATION_NOTE' | 'CLOSURE_FORM', label: string) => {
    const metadata = state?.fiche.documents?.find(file => fileType(file) === type);
    if (type === 'CERTIFICATION_NOTE') {
      const name = metadata ? documentName(metadata, label) : savedCertificationFile?.split('?')[0].split('/').pop() || label;
      return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 py-3">
        <div><p className="text-sm font-medium">{label}</p><p className="break-all text-xs text-slate-500">{name}</p></div>
        {docButton({ ...metadata, url: directDocumentUrl(metadata) || savedCertificationFile }, name, metadata?.mimeType)}
      </div>;
    }
    return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 py-3"><span className="text-sm font-medium">{metadata ? documentName(metadata, label) : label}</span>{docButton(metadata, metadata ? documentName(metadata, label) : `${label}.pdf`, metadata?.mimeType)}</div>;
  };
  const upload = (path: string, label: string) => <Upload key={`${path}-${version}`} label={label} busy={busy} onUpload={file => mutate(() => uploadPecmuFile(fetcher, path, file))} />;
  const docRows = (care: MedicalCare) => <>
    {(care.documents || []).filter(file => (fileType(file) !== 'TRANSFER_NOTE' || care.outcome === 'TRANSFERRED') && (fileType(file) !== 'DEATH_CERTIFICATE' || care.outcome === 'DECEASED')).map((file, index) => <div key={file.id ?? index} className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 py-3"><span className="text-sm">{documentName(file, medicalDocumentTypes[fileType(file) as keyof typeof medicalDocumentTypes] || 'Document médical')}</span>{docButton(file, documentName(file, 'Document médical.pdf'), file.mimeType)}</div>)}
    {(care.examens || []).map((file, index) => <div key={file.id ?? index} className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 py-3"><span className="text-sm">{documentName(file, 'Examen')}</span>{docButton(file, documentName(file, 'Examen.pdf'), file.mimeType)}</div>)}
  </>;

  return <>
    <Modal show onClose={onClose} size="7xl" className="!z-[100] !h-dvh !bg-slate-950/60" aria-label="Dossier PECMU"><ModalBody className="!p-0">
      <div className="bg-white text-slate-900">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Dossier PECMU #{ficheId}</p><h2 className="mt-1 text-2xl font-bold">{state?.fiche.victimName || 'Dossier PECMU'}</h2>{state && <p className="mt-2 text-sm font-medium text-secondary">{statusLabels[state.currentStatus] || state.currentStatus}</p>}</div><div className="flex gap-2"><button disabled={busy || loading} type="button" aria-label="Actualiser le parcours" onClick={async () => { setLoading(true); setError(''); try { await load(); } catch (e: any) { setError(e.message); setSyncFailed(true); } finally { setLoading(false); } }} className="p-2 text-primary"><RefreshCw size={20} /></button><button onClick={onClose} aria-label="Fermer" className="p-2"><X /></button></div></header>
        <nav aria-label="Étapes du dossier" className="flex overflow-x-auto border-b border-slate-200">{tabs.map(item => <button key={item.id} type="button" onClick={() => setTab(item.id)} aria-current={tab === item.id ? 'step' : undefined} className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${tab === item.id ? 'border-primary text-primary' : 'border-transparent text-slate-700 hover:border-slate-300 hover:text-slate-900'}`}>{item.label}</button>)}</nav>
        <main className="max-h-[70vh] space-y-5 overflow-y-auto bg-slate-50 p-4 md:p-6">
          {error && <div role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}{errorCode === 'PSYCHOLOGICAL_CARE_CLOSURE_REQUIRED' && <button type="button" className="ml-2 font-semibold underline" onClick={() => setTab('psychological')}>Ouvrir la prise en charge psychologique</button>}{syncFailed && <p className="mt-2">Utilisez « Actualiser le parcours » pour réessayer.</p>}</div>}
          {loading && <p role="status">Chargement du parcours…</p>}
          {!loading && state && <>
            {tab === 'identity' && <>
              <MedicalAlertSheet fiche={state.fiche} />
              {!state.fiche.victimeId && !state.fiche.victimId && <Panel title="Rattacher à une victime">
                <PecmuVictimSearch fetcher={fetcher} selected={linkedVictim} disabled={busy} onSelect={setLinkedVictim} />
                {linkedVictim && <div className="space-y-3 rounded border border-amber-200 bg-amber-50 p-4 text-sm"><p className="font-semibold text-amber-900">Attention : l’identité de la fiche sera resynchronisée depuis « {masterVictimName(linkedVictim)} ». Ce rattachement ne pourra plus être remplacé.</p><button type="button" disabled={busy} className={buttonClass} onClick={async () => {
                  if (!await confirm(`Rattacher définitivement cette fiche à ${masterVictimName(linkedVictim)} ?`)) return;
                  await mutate(() => workflowJson(fetcher, base, { victimeId: linkedVictim.id }, 'PUT'));
                  setLinkedVictim(null);
                }}>Confirmer le rattachement</button></div>}
              </Panel>}
              {state.fiche.victimeId || state.fiche.victimId ? <p className="rounded border border-primary/20 bg-primary/5 p-3 text-sm text-slate-700">L’identité est liée à la victime maître et affichée en lecture seule. Toute correction doit se faire dans la fiche principale de la victime.</p> : null}
              <Panel title={state.fiche.status === 'BROUILLON' ? 'Reprendre le brouillon' : 'Compléter la fiche d’alerte'}><WorkflowForm key={version} initial={state.fiche} busy={busy} submitLabel={state.fiche.status === 'BROUILLON' ? 'Mettre à jour le brouillon' : 'Enregistrer les informations'} onSubmit={values => json(base, values, state.fiche.status === 'BROUILLON' ? 'PATCH' : 'PUT')} fields={[
                { key: 'lucNumber', label: 'Numéro LUC' },
                { key: 'alertSourceStructureName', label: 'Nom de la structure ayant lancé l’alerte' },
                { key: 'alertSourceStructureType', label: 'Type de structure', type: 'select', options: alertStructureTypes, required: true },
                { key: 'alertSourceOtherStructureType', label: 'Précisez le type de structure', required: true, when: values => values.alertSourceStructureType === 'AUTRE' },
                { key: 'alertSourceFullName', label: 'Personne de contact' }, { key: 'alertSourcePhone', label: 'Téléphone de contact' },
                { key: 'alertSourceAddress', label: 'Adresse de contact', type: 'textarea' },
              ]} /></Panel>
            </>}
            {tab === 'certification' && <Panel title="Certification de l’alerte">
              <fieldset disabled={busy || hasRecordedCertification}>
                <YesNoToggle label="Certifier l’alerte" checked={certifyAlert} onChange={setCertificationChoice} />
              </fieldset>
              {certifyAlert && <>
                {!hasRecordedCertification && <label className="block text-sm font-medium">Ajouter la note de certification
                  <input disabled={busy} type="file" accept=".pdf,.png,.jpg,.jpeg" className={fieldClass} onChange={event => {
                    setCertificationFile(event.target.files?.[0] || null);
                    uploadedCertification.current = null;
                  }} />
                  {certificationFile && <span className="mt-2 block text-xs text-slate-500">{certificationFile.name} sera envoyé sur MinIO à l’enregistrement.</span>}
                </label>}
                {hasRecordedCertification && <><p className="text-sm text-primary">Note de certification enregistrée.</p>{ficheDocument('CERTIFICATION_NOTE', 'Note de certification')}</>}
              </>}
              {!hasRecordedCertification && <button type="button" disabled={busy} className={buttonClass} onClick={async () => {
                if (!certifyAlert && !await confirm('Rejeter la certification de cette alerte ?')) return;
                const success = await mutate(async () => {
                  let reference = uploadedCertification.current || savedCertificationFile;
                  if (certifyAlert && certificationFile && !uploadedCertification.current) {
                    reference = await uploadCertificationNote(fetcher, certificationFile);
                    uploadedCertification.current = reference;
                  }
                  await certifyPecmuAlert(fetcher, ficheId, certifyAlert, reference);
                  if (certifyAlert && reference) setRecordedCertification({ ficheId, reference });
                });
                if (success) { setCertificationChoice(null); setCertificationFile(null); uploadedCertification.current = null; }
              }}>{busy ? 'Enregistrement…' : 'Enregistrer la certification'}</button>}
            </Panel>}
            {tab === 'decision' && <Panel title="Décision du pool médical">
              {ficheDocument('CERTIFICATION_NOTE', 'Consulter la note de certification')}
              {hasMedicalDecision && <Details values={decisionValues} fields={[[ 'pecmuDecision', 'Décision enregistrée'], ['medicalDecisionComment', 'Motivation'], ['decisionMakerName', 'Médecin du pool'], ['decisionDate', 'Date de décision']]} />}
              {can('RECORD_MEDICAL_DECISION') ? <WorkflowForm key={version} busy={busy} submitLabel="Enregistrer la décision" fields={[
                { key: 'eligible', label: 'Dossier éligible', type: 'boolean' }, { key: 'comment', label: 'Motivation de la décision', type: 'textarea', required: true },
              ]} onSubmit={async values => {
                if (!values.eligible && !await confirm('Déclarer ce dossier non éligible ?')) return false;
                const decisionMakerName = getConnectedAgentFullName();
                const decisionMakerFunction = getConnectedAgentFunction();
                if (!decisionMakerName) {
                  setError('Impossible de retrouver votre identité dans la session. Reconnectez-vous pour enregistrer votre avis.');
                  return false;
                }
                const today = new Date();
                const decisionDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                const payload = {
                  ...values, decisionMakerName, ...(decisionMakerFunction ? { decisionMakerFunction } : {}), decisionDate,
                };
                return mutate(async () => {
                  await workflowJson(fetcher, `${base}/medical-decision`, payload);
                  setRecordedDecision({ ficheId, values: payload });
                });
              }} /> : <ReadOnly />}
            </Panel>}
            {tab === 'consents' && <>
              {can('RECORD_CONSENT') && <Panel title="Ajouter un consentement"><p className="mb-4 text-sm text-slate-600">Chaque consentement est créé comme une entrée distincte avec son propre fichier.</p><WorkflowForm key={`new-${version}`} fields={consentFields} initial={{ consentType: 'MEDICAL_CARE', consentStatus: 'SIGNED', consentDate: new Date().toISOString().slice(0, 10) }} busy={busy} submitLabel="Créer le consentement et déposer son fichier" onSubmit={values => mutate(async () => {
                if (!consentFile) throw new Error('Sélectionnez le document signé ou le formulaire de refus.');
                validatePecmuFile(consentFile);
                const response = await workflowJson(fetcher, '/acte-consentement-pecmu', { ...consentPayload(values), fichePecmuId: ficheId });
                const id = response?.id ?? response?.data?.id;
                await load();
                if (!id) throw new Error('Le serveur n’a pas retourné l’identifiant du consentement. Actualisez le dossier.');
                try { await uploadPecmuFile(fetcher, `/acte-consentement-pecmu/${id}/file`, consentFile); } catch (e: any) { throw new Error(`Consentement créé. Le fichier n’a pas été déposé : ${e.message} Utilisez « Déposer le fichier » sur ce consentement pour réessayer sans le recréer.`); }
                setConsentFile(null);
              })}>{values => <label className="text-sm font-medium md:col-span-2">{values.consentType === 'REFUSAL' ? 'Document de refus' : 'Document signé'} *<input required type="file" accept=".pdf,.png,.jpg,.jpeg" className={fieldClass} onChange={event => setConsentFile(event.target.files?.[0] || null)} /></label>}</WorkflowForm></Panel>}
              <Panel title="Consentements du dossier">{state.consents.length === 0 && <Empty text="Aucun consentement enregistré." />}{state.consents.filter(c => c.isActive !== false).map(consent => <article key={consent.id} className="space-y-3 border-b border-slate-200 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="font-semibold">{consentTypes[consent.consentType] || 'Consentement'}</h4><p className="text-sm text-slate-500">{consent.agent} · {dateLabel(consent.consentDate)} · {consent.consentStatus === 'SIGNED' ? 'Signé' : 'Refusé'}</p><p className="text-sm">{consent.notes}</p><p className="break-all text-xs text-slate-500">{documentName(consent, 'Fichier non déposé')}</p></div>{docButton(consent, documentName(consent, 'Consentement.pdf'), consent.mimeType)}</div>
                {upload(`/acte-consentement-pecmu/${consent.id}/file`, consent.consentType === 'REFUSAL' ? 'Déposer le document de refus' : 'Déposer le document signé')}
                <div className="flex items-center gap-1 text-sm"><button disabled={busy} type="button" title="Modifier" aria-label="Modifier" className="rounded-md p-2 text-primary hover:bg-primary/10 disabled:opacity-40" onClick={() => setEditingConsent(editingConsent === consent.id ? null : consent.id)}><Pencil size={18} aria-hidden="true" /></button><button disabled={busy} type="button" title="Supprimer" aria-label="Supprimer" className="rounded-md p-2 text-red-600 hover:bg-red-50 disabled:opacity-40" onClick={() => remove(`/acte-consentement-pecmu/${consent.id}`)}><Trash2 size={18} aria-hidden="true" /></button></div>
                {editingConsent === consent.id && <WorkflowForm key={`${consent.id}-${version}`} fields={consentFields} initial={consent} busy={busy} submitLabel="Enregistrer la correction" onSubmit={async values => { const success = await mutate(() => workflowJson(fetcher, `/acte-consentement-pecmu/${consent.id}`, consentPayload(values), 'PUT')); if (success) setEditingConsent(null); return success; }} />}
              </article>)}</Panel>
            </>}
            {tab === 'care' && <>
              <section aria-label="Prises en charge" className="w-full space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">Prises en charge <span className="ml-2 text-sm font-normal text-slate-500">({state.medicalCare.length})</span></h2>
                  <button type="button" disabled={busy || !canAddCare} className={`${buttonClass} inline-flex items-center gap-2`} onClick={() => setShowNewCare(value => !value)}><Plus size={18} aria-hidden="true" />{showNewCare ? 'Annuler l’ajout' : 'Ajouter une prise en charge'}</button>
                </div>
                {state.medicalCare.length === 0 && <Empty text="La prise en charge sera disponible après le consentement signé et le dépôt de son fichier." />}
                {state.medicalCare.map(care => <PecmuCareCard key={care.id} care={care}>
                  {Boolean(care.documents?.length || care.examens?.length) && <section className="space-y-3 border-t border-slate-100 pt-4"><h4 className="text-sm font-semibold text-primary">Documents et examens</h4>{docRows(care)}</section>}
                </PecmuCareCard>)}
              </section>

              {canAddCare && (showNewCare || !latest) && <Panel title={`Nouvelle prise en charge · ${(latest?.sequenceNumber || 0) + 1}`}><p className="mb-4 text-sm text-slate-600">{isTransferred && latest ? 'La nouvelle fiche reste liée à la précédente. Vérifiez les informations de suivi reprises et déposez la note de transfert avant de continuer.' : 'Renseignez le mode de soins et la structure médicale.'}</p><PecmuEvolutionForm key={`open-${version}`} care={{ id: 0, fichePecmuId: ficheId, sequenceNumber: (latest?.sequenceNumber || 0) + 1 }} hasClosureForm={false} careFields={careFormFields} carePartners={carePartners} initial={isTransferred && latest ? { supervisorName: latest.supervisorName, careMode: latest.careMode, careStructureName: latest.transferStructureName, careProvince: latest.transferProvince, careHealthZone: latest.transferHealthZone, complaints: latest.complaints, diagnosis: latest.diagnosis, treatmentReceived: latest.treatmentReceived } : { supervisorName: latest?.supervisorName || '', careStructureName: state.fiche.careStructureName, careProvince: state.fiche.province }} busy={busy} submitLabel="Enregistrer la prise en charge" onSave={(values, files, closeCase) => mutate(async () => {
                for (const file of Object.values(files)) validatePecmuFile(file);
                const evolutionKeys = ['outcome', 'outcomeDate', 'transferStructureName', 'transferProvince', 'transferHealthZone', 'transferNotes'];
                const careValues = normalizeSupervisorValues(Object.fromEntries(Object.entries(values).filter(([key]) => !evolutionKeys.includes(key))));
                const evolutionValues = Object.fromEntries(Object.entries(values).filter(([key]) => evolutionKeys.includes(key)));
                const response = await workflowJson(fetcher, '/acte-medical-pecmu', { ...careValues, fichePecmuId: ficheId, ...(isTransferred && latest ? { previousCareId: latest.id } : {}) });
                const careId = response?.id ?? response?.data?.id;
                setShowNewCare(false);
                if (!values.outcome) return;
                if (!careId) throw new Error('Prise en charge créée, mais son identifiant est absent de la réponse. Actualisez le dossier pour compléter l’évolution.');
                await workflowJson(fetcher, `/acte-medical-pecmu/${careId}`, evolutionValues, 'PUT');
                for (const [type, file] of Object.entries(files)) await uploadPecmuFile(fetcher, type === 'CLOSURE_FORM' ? `${base}/documents/CLOSURE_FORM` : `/acte-medical-pecmu/${careId}/documents/${type}`, file);
                if (closeCase) {
                  const today = new Date();
                  const closureDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                  await workflowJson(fetcher, `${base}/close`, { reason: outcomeLabels[values.outcome as keyof typeof outcomeLabels], closureDate });
                }
              })} /></Panel>}
              {can('UPDATE_MEDICAL_CARE') && latest && <Panel title="Soins en cours"><button type="button" className={buttonClass} onClick={() => setEditCare(value => !value)}>{editCare ? 'Masquer le formulaire' : 'Mettre à jour les soins'}</button>{editCare && <div className="mt-4"><WorkflowForm key={`edit-${latest.id}-${version}`} fields={careFormFields} initial={{ ...latest, supervisorName: supervisors.some(option => option.value === latest.supervisorName) || supervisorLookupFailed ? latest.supervisorName : otherSupervisor.value, supervisorOtherName: !supervisorLookupFailed && !supervisors.some(option => option.value === latest.supervisorName) ? latest.supervisorName : '' }} busy={busy} submitLabel="Enregistrer les soins" onSubmit={values => { const normalized = normalizeSupervisorValues(values); const changed = Object.fromEntries(Object.entries(normalized).filter(([key, value]) => value !== latest[key as keyof MedicalCare])); return json(`/acte-medical-pecmu/${latest.id}`, changed, 'PUT'); }} /></div>}</Panel>}
              {can('UPLOAD_MEDICAL_DOCUMENT') && latest && <Panel title="Examens et documents médicaux"><MedicalUpload busy={busy} onUpload={(type, file) => mutate(() => uploadPecmuFile(fetcher, type === 'EXAM' ? `/acte-medical-pecmu/${latest.id}/exams` : `/acte-medical-pecmu/${latest.id}/documents/${type}`, file))} /></Panel>}
              {latest && <Panel title="Évolution">
                <PecmuEvolutionForm key={`${latest.id}-${version}`} care={latest} careFields={careFormFields} carePartners={carePartners} hasClosureForm={Boolean(state.fiche.documents?.some(file => fileType(file) === 'CLOSURE_FORM'))} busy={busy} onSave={(values, files, closeCase) => mutate(async () => {
                  for (const file of Object.values(files)) validatePecmuFile(file);
                  const normalized = normalizeSupervisorValues(values);
                  if (Object.entries(normalized).some(([key, value]) => value !== (key === 'outcomeDate' ? latest.outcomeDate?.slice(0, 10) : latest[key as keyof MedicalCare]))) await workflowJson(fetcher, `/acte-medical-pecmu/${latest.id}`, normalized, 'PUT');
                  for (const [type, file] of Object.entries(files)) await uploadPecmuFile(fetcher, type === 'CLOSURE_FORM' ? `${base}/documents/CLOSURE_FORM` : `/acte-medical-pecmu/${latest.id}/documents/${type}`, file);
                  if (closeCase) {
                    const today = new Date();
                    const closureDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    await workflowJson(fetcher, `${base}/close`, { reason: outcomeLabels[values.outcome as keyof typeof outcomeLabels], closureDate });
                  }
                })} />
                {closed && <><p className="mt-4 text-sm font-semibold text-primary">Dossier clôturé</p>{ficheDocument('CLOSURE_FORM', 'Formulaire de clôture')}</>}
              </Panel>}
              {latest && !latest.outcome && <button disabled={busy} className="text-sm text-red-600" onClick={() => remove(`/acte-medical-pecmu/${latest.id}`)}>Supprimer la dernière prise en charge sans issue</button>}
            </>}
            {tab === 'psychological' && <PecmuPsychologicalCare ficheId={ficheId} fetcher={fetcher} onChanged={onChanged} />}
            {tab === 'followups' && <PecmuFollowUps ficheId={ficheId} fetcher={fetcher} version={version} busy={busy}
              canRead={true}
              canCreate={true}
              canUpdate={true}
              canDelete={true}
              save={json} remove={remove} />}
            {tab === 'orientations' && <div className="space-y-6">
              <>
                <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <header className="border-b border-slate-100 bg-slate-50 px-5 py-4"><h3 className="text-lg font-semibold">Orientations enregistrées</h3><p className="mt-1 text-sm text-slate-500">Situation actuelle du dossier après la PECMU.</p></header>
                  <div className="space-y-5 p-5">
                    {Array.isArray(state.fiche.orientations) && state.fiche.orientations.length > 0 ? <ul className="flex flex-wrap gap-2">{state.fiche.orientations.map((value: any, index: number) => <li key={index} className="rounded-md border border-primary/15 bg-primary/5 px-3 py-2 text-sm font-medium text-primary">{typeof value === 'string' ? orientationLabels[value] || value : value.label || orientationLabels[value.type] || value.type}</li>)}</ul> : <p className="text-sm text-slate-500">Aucune orientation enregistrée.</p>}
                    {state.fiche.orientationNotes && <div className="border-t border-slate-100 pt-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Notes enregistrées</p><p className="whitespace-pre-wrap text-sm text-slate-700">{state.fiche.orientationNotes}</p></div>}
                  </div>
                </section>
                {can('RECORD_POST_PECMU_ORIENTATIONS') && <section className="rounded-lg border border-primary/20 bg-white p-5">
                  <h3 className="text-lg font-semibold">Modifier les orientations</h3><p className="mb-5 mt-1 text-sm text-slate-500">Sélectionnez les accompagnements à prévoir, puis enregistrez vos modifications.</p>
                  <form onSubmit={async event => { event.preventDefault(); await json(`${base}/orientations`, { orientations: [...new Set(selectedOrientations)], notes: orientationNotes }); }}><fieldset disabled={busy} className="space-y-5">
                    <div className="grid gap-3 md:grid-cols-3">{Object.entries(orientationLabels).map(([value, label]) => <label key={value} className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 text-sm transition-colors ${selectedOrientations.includes(value) ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}><input type="checkbox" className="mt-0.5 accent-primary" checked={selectedOrientations.includes(value)} onChange={event => setSelectedOrientations(previous => event.target.checked ? [...previous, value] : previous.filter(item => item !== value))} /><span className="font-medium">{label}</span></label>)}</div>
                    <label className="block text-sm font-medium">Notes<textarea className={`${fieldClass} min-h-24`} value={orientationNotes} onChange={event => setOrientationNotes(event.target.value)} /></label>
                    <div className="flex justify-end border-t border-slate-100 pt-4"><button className={buttonClass}>{busy ? 'Enregistrement…' : 'Enregistrer les modifications'}</button></div>
                  </fieldset></form>
                </section>}
              </>
            </div>}
            {tab === 'history' && <Panel title="Historique du dossier">{state.history?.length ? <ol className="space-y-3">{state.history.map((entry, index) => <li key={entry.id ?? index} className="border-l-2 border-primary/30 pl-4 text-sm"><p className="font-medium">{entry.action || entry.status}</p><p className="text-slate-500">{dateLabel(entry.createdAt)}</p><p>{entry.comment}</p></li>)}</ol> : <><p className="mb-4 text-sm text-slate-500">L’API ne fournit pas d’historique détaillé pour ce dossier. Les prises en charge sont consultables dans leur onglet.</p><Details values={state.fiche} fields={[[ 'createdAt', 'Création du dossier'], ['updatedAt', 'Dernière mise à jour']]} /></>}</Panel>}
          </>}
        </main>
      </div>
    </ModalBody></Modal>
    {preview && <PecmuDocumentViewer document={preview} onClose={() => setPreview(null)} />}
  </>;
}

const orientationLabels: Record<string, string> = { PSYCHOLOGICAL_SUPPORT: 'Accompagnement psychologique', ECONOMIC_POOL: 'Pool économique', COMPENSATION: 'Indemnisation' };
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="space-y-4 border border-slate-200 bg-white p-5"><h3 className="text-lg font-semibold">{title}</h3>{children}</section>; }
function Empty({ text }: { text: string }) { return <p className="py-4 text-sm text-slate-500">{text}</p>; }
function ReadOnly() { return <p className="text-sm text-slate-500">Cette étape est en consultation. Les actions disponibles dépendent de l’état du dossier et de vos droits.</p>; }
const medicalSheetValue = (value: any, key?: string) => {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (Array.isArray(value)) return value.map(item => typeof item === 'string' ? orientationLabels[item] || item : item?.label || item?.type || '—').join(', ') || '—';
  if (typeof value === 'object') return '—';
  if (key === 'sex') {
    const sex = String(value).trim().toUpperCase();
    if (['M', 'MALE', 'MASCULIN'].includes(sex)) return 'Masculin';
    if (['F', 'FEMALE', 'FÉMININ', 'FEMININ'].includes(sex)) return 'Féminin';
  }
  if (key === 'alertSourceStructureType') return alertStructureTypes[String(value)] || String(value);
  return String(value);
};
function MedicalAlertSheet({ fiche }: { fiche: Record<string, any> }) {
  const values = { ...fiche, sex: medicalSheetValue(fiche.sex, 'sex'), alertSourceStructureType: medicalSheetValue(fiche.alertSourceStructureType, 'alertSourceStructureType') };
  const sections: Array<{ title: string; fields: Array<[string, string]> }> = [
    { title: 'Identification de la victime', fields: [
      ['victimName', 'Nom de la victime'], ['victimeId', 'Identifiant de la victime maître'], ['lucNumber', 'Numéro LUC'], ['age', 'Âge'], ['sex', 'Sexe'], ['province', 'Province'], ['locality', 'Localité'], ['victimAddress', 'Adresse'], ['victimPhone', 'Téléphone'], ['emergencyContactName', 'Contact d’urgence'], ['emergencyContactRelationship', 'Lien de parenté'],
    ] },
    { title: 'Structure de prise en charge', fields: [
      ['careStructureName', 'Établissement'], ['healthZone', 'Zone de santé'], ['healthArea', 'Aire de santé'], ['careStructureAddress', 'Adresse de la structure'], ['doctorOrNurseContact', 'Contact médical'],
    ] },
    { title: 'Origine de l’alerte', fields: [
      ['alertSourceStructureName', 'Structure ayant lancé l’alerte'], ['alertSourceStructureType', 'Type de structure'], ['alertSourceOtherStructureType', 'Précision (autre type)'], ['alertSourceFullName', 'Personne de contact'], ['alertSourcePhone', 'Téléphone de la source'], ['alertSourceRelationship', 'Relation avec la victime'], ['alertSourceAddress', 'Adresse de la source'],
    ] },
    { title: 'Situation médicale', fields: [
      ['violationType', 'Violation(s) signalée(s)'], ['incidentDetails', 'Détails de l’incident'], ['incidentPeriod', 'Période / dates'], ['affectedBodyParts', 'Parties du corps atteintes'], ['medicalStatus', 'Statut médical'], ['vitalPrognosis', 'Pronostic vital'], ['otherComplaints', 'Autres plaintes'],
    ] },
    { title: 'Signes cliniques', fields: [
      ['highFever', 'Forte fièvre'], ['comaOrLossOfConsciousness', 'Coma / perte de connaissance'], ['convulsions', 'Convulsions'], ['extremeFatigue', 'Fatigue intense'], ['hypertension', 'Hypertension'], ['hyperglycemia', 'Hyperglycémie'], ['bleeding', 'Saignement'], ['wounds', 'Plaies'], ['breathingDifficulty', 'Difficulté à respirer'], ['severeDiarrhea', 'Diarrhée sévère'], ['vomiting', 'Vomissement'],
    ] },
  ];
  return <Panel title="Fiche d’alerte"><div className="divide-y divide-slate-200">{sections.map(section => <section key={section.title} className="py-3 first:pt-0 last:pb-0"><h4 className="border-b border-slate-100 pb-2 text-sm font-semibold text-slate-800">{section.title}</h4><Details values={values} fields={section.fields} /></section>)}</div></Panel>;
}
function Details({ values, fields }: { values: Record<string, any>; fields: Array<[string, string]> }) {
  return <dl className="grid gap-3 py-3 text-sm md:grid-cols-2">{fields.map(([key, label]) => <div key={key}><dt className="text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words font-medium">{typeof values[key] === 'boolean' ? values[key] ? 'Oui' : 'Non' : Array.isArray(values[key]) ? values[key].map((value: any) => typeof value === 'string' ? orientationLabels[value] || value : value.label || value.type || '—').join(', ') : typeof values[key] === 'object' ? '—' : values[key] ?? '—'}</dd></div>)}</dl>;
}
function Upload({ label, busy, onUpload }: { label: string; busy: boolean; onUpload: (file: File) => Promise<boolean> }) {
  const [file, setFile] = useState<File | null>(null);
  return <form onSubmit={async event => { event.preventDefault(); if (file) await onUpload(file); }}><fieldset disabled={busy} className="flex flex-wrap items-end gap-3 border border-slate-200 bg-slate-50 p-3"><label className="min-w-0 flex-1 text-sm font-medium">{label}<input required type="file" accept=".pdf,.png,.jpg,.jpeg" className={fieldClass} onChange={event => setFile(event.target.files?.[0] || null)} /></label><button disabled={!file} className={buttonClass}>Déposer le fichier</button></fieldset></form>;
}
function MedicalUpload({ busy, onUpload }: { busy: boolean; onUpload: (type: string, file: File) => Promise<boolean> }) {
  const [type, setType] = useState('MEDICAL_REPORT');
  return <div className="space-y-3"><label className="block text-sm">Type de pièce<select disabled={busy} className={fieldClass} value={type} onChange={event => setType(event.target.value)}>{Object.entries({ EXAM: 'Examen médical', ...medicalDocumentTypes }).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><Upload key={type} label="Fichier PDF, PNG ou JPEG" busy={busy} onUpload={file => onUpload(type, file)} /></div>;
}
