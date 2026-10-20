'use client';

import { rdcProvinces } from '../constants/provinces';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, ModalBody } from 'flowbite-react';
import { Download, Eye, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { getConnectedAgentFullName, getConnectedAgentFunction } from '../../utils/currentUser';
import type { PecmuFetcher } from '../services/pecmuApi';
import {
  certifyPecmuAlert, uploadCertificationNote, activeWorkflowTab, canPerform, consentTypes, getPecmuDocumentUrl, getPecmuPermissions, loadPecmuWorkflow,
  medicalDocumentTypes, outcomeLabels, PecmuApiError, statusLabels, uploadPecmuFile, validatePecmuFile, workflowJson,
  type FileMetadata, type MedicalCare, type WorkflowSnapshot, type WorkflowTab,
} from '../services/pecmuWorkflowApi';
import PecmuFollowUps from './PecmuFollowUps';
import PecmuCareCard from './PecmuCareCard';
import PecmuEvolutionForm from './PecmuEvolutionForm';
import YesNoToggle from './YesNoToggle';
import PecmuDocumentViewer, { type DocumentPreview } from './PecmuDocumentViewer';
import { buttonClass, fieldClass, WorkflowForm, type WorkflowField } from './WorkflowForm';

type Props = { ficheId: number; fetcher: PecmuFetcher; onClose: () => void; onChanged: () => void };
const tabs: Array<{ id: WorkflowTab; label: string }> = [
  { id: 'identity', label: 'Identification et alerte' }, { id: 'certification', label: 'Certification' },
  { id: 'decision', label: 'Pool médical' }, { id: 'consents', label: 'Consentements' },
  { id: 'care', label: 'Prises en charge' }, { id: 'followups', label: 'Suivis et rendez-vous' },
  { id: 'orientations', label: 'Orientations' }, { id: 'history', label: 'Historique' },
];
const provinceOptions = Object.fromEntries(rdcProvinces.map(province => [province, province]));
const careFields: WorkflowField[] = [
  { key: 'supervisorName', label: 'Superviseur médical', required: true },
  { key: 'careMode', label: 'Mode de prise en charge', type: 'select', required: true, options: { OUTPATIENT: 'Ambulatoire', HOSPITALIZATION: 'Hospitalisation' } },
  { key: 'careDate', label: 'Date des soins', type: 'date', required: true, when: values => values.careMode === 'OUTPATIENT' },
  { key: 'hospitalizationStartDate', label: 'Début d’hospitalisation', type: 'date', required: true, when: values => values.careMode === 'HOSPITALIZATION' },
  { key: 'hospitalizationEndDate', label: 'Fin d’hospitalisation', type: 'date', when: values => values.careMode === 'HOSPITALIZATION' },
  { key: 'careStructureName', label: 'Structure de prise en charge', required: true }, { key: 'careProvince', label: 'Province', type: 'select', options: provinceOptions, required: true },
  { key: 'treatingDoctorName', label: 'Médecin traitant' }, { key: 'treatingDoctorPhone', label: 'Téléphone du médecin' },
  { key: 'complaints', label: 'Plaintes', type: 'list', itemLabel: 'Plainte', addLabel: 'Ajouter une plainte' }, { key: 'diagnosis', label: 'Diagnostics', type: 'list', itemLabel: 'Diagnostic', addLabel: 'Ajouter un diagnostic' },
  { key: 'treatmentReceived', label: 'Traitements reçus', type: 'list', itemLabel: 'Traitement', addLabel: 'Ajouter un traitement' },
  { key: 'appointmentDate1', label: 'Premier rendez-vous', type: 'date' }, { key: 'appointmentDate2', label: 'Deuxième rendez-vous', type: 'date' }, { key: 'appointmentDate3', label: 'Troisième rendez-vous', type: 'date' },
  { key: 'cout', label: 'Coût (USD)', type: 'number' }, { key: 'partenaireNom', label: 'Partenaire médical' }, { key: 'partenaireTitre', label: 'Titre / convention' }, { key: 'observation', label: 'Observation', type: 'textarea' },
];
const consentFields: WorkflowField[] = [
  { key: 'consentType', label: 'Type de consentement', type: 'select', options: consentTypes, required: true },
];
const consentPayload = (values: Record<string, any>, consentDate?: string) => {
  const agent = getConnectedAgentFullName();
  if (!agent) throw new Error('Impossible de retrouver votre identité dans la session. Reconnectez-vous.');
  const today = new Date();
  return {
    consentType: values.consentType,
    consentStatus: values.consentType === 'REFUSAL' ? 'REFUSED' : 'SIGNED',
    agent,
    consentDate: consentDate || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
  };
};
const dateLabel = (value?: string) => value ? new Date(value).toLocaleDateString('fr-FR') : '—';
const documentName = (file: FileMetadata, fallback: string) => file.originalName || file.filename || fallback;
const fileType = (file: FileMetadata) => file.type || file.documentType;
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
  const [permissions, setPermissions] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncFailed, setSyncFailed] = useState(false);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const [preview, setPreview] = useState<DocumentPreview | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [showNewCare, setShowNewCare] = useState(false);
  const [editCare, setEditCare] = useState(false);
  const [certificationChoice, setCertificationChoice] = useState<boolean | null>(null);
  const [certificationFile, setCertificationFile] = useState<File | null>(null);
  const uploadedCertification = useRef<string | null>(null);
  const [recordedCertification, setRecordedCertification] = useState<{ ficheId: number; reference: string } | null>(null);
  const [recordedDecision, setRecordedDecision] = useState<{ ficheId: number; values: Record<string, any> } | null>(null);
  const [consentFile, setConsentFile] = useState<File | null>(null);
  const [editingConsent, setEditingConsent] = useState<number | null>(null);
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
    setPermissions(getPecmuPermissions());
    void load().catch(e => { setError(e.message); setSyncFailed(true); }).finally(() => setLoading(false));
  }, [load]);
  const permitted = (permission: string) => permissions === null || permissions.includes(permission);
  const can = (action: string) => Boolean(state && !syncFailed && canPerform(state, action, permissions));
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
  const canAddCare = !closed && !syncFailed && (can('OPEN_MEDICAL_CARE') || can('OPEN_TRANSFERRED_MEDICAL_CARE') || (Boolean(latest) && permitted('acte-medical-pecmu:create')));
  const negative = state?.currentStatus === 'NOT_CERTIFIED' || state?.currentStatus === 'NOT_ELIGIBLE';

  const mutate = async (operation: () => Promise<unknown>): Promise<boolean> => {
    if (mutationLock.current || syncFailed) return false;
    mutationLock.current = true; setBusy(true); setError('');
    let succeeded = false;
    try {
      await operation(); succeeded = true;
      await load(); setVersion(value => value + 1); onChanged();
      return true;
    } catch (e: any) {
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
  const visualise = (path: string, name: string, mimeType?: string) => setPreview({ path, name, mimeType });
  const docButton = (path: string, name: string, mimeType?: string) => <button type="button" onClick={() => visualise(path, name, mimeType)} className="inline-flex shrink-0 items-center gap-2 rounded-md border border-primary/30 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/5"><Eye size={17} />Visualiser</button>;
  const downloadButton = (path: string, name: string) => <button type="button" disabled={downloading} className="inline-flex items-center gap-2 rounded-md border border-primary/30 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/5 disabled:opacity-40" onClick={async () => {
    setDownloading(true); setError('');
    try {
      const url = await getPecmuDocumentUrl(fetcher, path);
      const response = await fetch(url, { credentials: 'omit' });
      if (!response.ok) throw new Error('Téléchargement impossible. Vous pouvez utiliser « Visualiser » pour ouvrir le document.');
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = objectUrl; link.download = name; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (e: any) { setError(e.message || 'Téléchargement impossible. Utilisez « Visualiser » pour ouvrir le document.'); }
    finally { setDownloading(false); }
  }}><Download size={17} />Télécharger</button>;
  const ficheDocument = (type: 'CERTIFICATION_NOTE' | 'CLOSURE_FORM', label: string) => {
    const metadata = state?.fiche.documents?.find(file => fileType(file) === type);
    if (type === 'CERTIFICATION_NOTE') {
      const name = metadata ? documentName(metadata, label) : savedCertificationFile?.split('?')[0].split('/').pop() || label;
      return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 py-3">
        <div><p className="text-sm font-medium">{label}</p><p className="break-all text-xs text-slate-500">{name}</p></div>
        {permitted('fiche-pecmu:read') && <button type="button" onClick={async () => {
          try {
            setError('');
            let reference = savedCertificationFile;
            if (!reference) {
              const response = await fetcher(base);
              const fiche = response?.data ?? response;
              reference = typeof fiche?.certification?.certificationFile === 'string' ? fiche.certification.certificationFile.trim() : undefined;
            }
            if (!reference) throw new Error('Le serveur ne renvoie pas la référence certification.certificationFile nécessaire pour afficher la note.');
            setRecordedCertification({ ficheId, reference });
            setPreview({ path: '', reference, name: metadata ? documentName(metadata, label) : reference.split('?')[0].split('/').pop() || label, mimeType: metadata?.mimeType });
          } catch (e: any) {
            setError(e.message || 'Impossible de récupérer le fichier de certification.');
          }
        }} className="inline-flex shrink-0 items-center gap-2 rounded-md border border-primary/30 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/5"><Eye size={17} />Visualiser</button>}
      </div>;
    }
    return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 py-3"><span className="text-sm font-medium">{metadata ? documentName(metadata, label) : label}</span>{permitted('fiche-pecmu:read') && docButton(`${base}/documents/${type}/download-url`, metadata ? documentName(metadata, label) : `${label}.pdf`, metadata?.mimeType)}</div>;
  };
  const upload = (path: string, label: string) => <Upload key={`${path}-${version}`} label={label} busy={busy || syncFailed} onUpload={file => mutate(() => uploadPecmuFile(fetcher, path, file))} />;
  const docRows = (care: MedicalCare) => <>
    {(care.documents || []).filter(file => (fileType(file) !== 'TRANSFER_NOTE' || care.outcome === 'TRANSFERRED') && (fileType(file) !== 'DEATH_CERTIFICATE' || care.outcome === 'DECEASED')).map((file, index) => <div key={file.id ?? index} className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 py-3"><span className="text-sm">{documentName(file, medicalDocumentTypes[fileType(file) as keyof typeof medicalDocumentTypes] || 'Document médical')}</span>{file.id != null && permitted('acte-medical-pecmu:read') && docButton(`/acte-medical-pecmu/${care.id}/documents/${file.id}/download-url`, documentName(file, 'Document médical.pdf'), file.mimeType)}</div>)}
    {(care.examens || []).map((file, index) => <div key={file.id ?? index} className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 py-3"><span className="text-sm">{documentName(file, 'Examen')}</span>{file.id != null && permitted('acte-medical-pecmu:read') && docButton(`/acte-medical-pecmu/${care.id}/exams/${file.id}/download-url`, documentName(file, 'Examen.pdf'), file.mimeType)}</div>)}
  </>;

  return <>
    <Modal show onClose={onClose} size="7xl" className="!z-[100] !h-dvh !bg-slate-950/60" aria-label="Dossier PECMU"><ModalBody className="!p-0">
      <div className="bg-white text-slate-900">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Dossier PECMU #{ficheId}</p><h2 className="mt-1 text-2xl font-bold">{state?.fiche.victimName || 'Dossier PECMU'}</h2>{state && <p className="mt-2 text-sm font-medium text-secondary">{statusLabels[state.currentStatus] || state.currentStatus}</p>}</div><div className="flex gap-2"><button disabled={busy || loading} type="button" aria-label="Actualiser le parcours" onClick={async () => { setLoading(true); setError(''); try { await load(); } catch (e: any) { setError(e.message); setSyncFailed(true); } finally { setLoading(false); } }} className="p-2 text-primary"><RefreshCw size={20} /></button><button onClick={onClose} aria-label="Fermer" className="p-2"><X /></button></div></header>
        <nav aria-label="Étapes du dossier" className="flex overflow-x-auto border-b border-slate-200">{tabs.filter(item => !negative || !['consents', 'care', 'closure', 'orientations'].includes(item.id)).map(item => <button key={item.id} type="button" onClick={() => setTab(item.id)} disabled={busy || loading || !state} aria-current={tab === item.id ? 'step' : undefined} className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold disabled:opacity-40 ${tab === item.id ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>{item.label}</button>)}</nav>
        <main className="max-h-[70vh] space-y-5 overflow-y-auto bg-slate-50 p-4 md:p-6">
          {error && <div role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}{syncFailed && <p className="mt-2">Utilisez « Actualiser le parcours » pour réessayer.</p>}</div>}
          {loading && <p role="status">Chargement du parcours…</p>}
          {!loading && state && <>
            {negative && <p className="border border-secondary/20 bg-secondary/5 p-4 text-sm">{statusLabels[state.currentStatus]}. Le parcours ne peut pas se poursuivre vers la prise en charge.</p>}
            {tab === 'identity' && <>
              <Panel title="Fiche d’alerte"><Details values={state.fiche} fields={[
                ['victimName', 'Nom de la victime'], ['lucNumber', 'Numéro LUC'], ['age', 'Âge'], ['sex', 'Sexe'], ['province', 'Province'], ['locality', 'Localité'], ['victimAddress', 'Adresse'], ['victimPhone', 'Téléphone'],
                ['emergencyContactName', 'Contact d’urgence'], ['emergencyContactRelationship', 'Lien de parenté'], ['careStructureName', 'Structure de prise en charge'], ['healthZone', 'Zone de santé'], ['healthArea', 'Aire de santé'], ['careStructureAddress', 'Adresse de la structure'], ['doctorOrNurseContact', 'Contact médical'],
                ['alertSourceFullName', 'Source de l’alerte'], ['alertSourcePhone', 'Téléphone de la source'], ['alertSourceRelationship', 'Relation avec la victime'], ['alertSourceAddress', 'Adresse de la source'], ['violationType', 'Violation subie'], ['incidentDetails', 'Détails de l’incident'], ['incidentPeriod', 'Période'], ['affectedBodyParts', 'Parties du corps atteintes'], ['medicalStatus', 'Statut médical'], ['vitalPrognosis', 'Pronostic vital'], ['otherComplaints', 'Autres plaintes'],
                ['highFever', 'Forte fièvre'], ['comaOrLossOfConsciousness', 'Coma / perte de connaissance'], ['convulsions', 'Convulsions'], ['extremeFatigue', 'Fatigue intense'], ['hypertension', 'Hypertension'], ['hyperglycemia', 'Hyperglycémie'], ['bleeding', 'Saignement'], ['wounds', 'Plaies'], ['breathingDifficulty', 'Difficulté à respirer'], ['severeDiarrhea', 'Diarrhée sévère'], ['vomiting', 'Vomissement'],
              ]} /></Panel>
              {!closed && !negative && permitted('fiche-pecmu:update') && <Panel title="complément d'infos"><WorkflowForm key={version} initial={state.fiche} busy={busy || syncFailed} submitLabel="Enregistrer les informations" onSubmit={values => json(base, values, 'PUT')} fields={[
                { key: 'lucNumber', label: 'Numéro LUC' },
              ]} /></Panel>}
            </>}
            {tab === 'certification' && <Panel title="Certification de l’alerte">
              <fieldset disabled={busy || hasRecordedCertification || (!can('CERTIFY_ALERT') && !can('UPLOAD_CERTIFICATION_NOTE'))}>
                <YesNoToggle label="Certifier l’alerte" checked={certifyAlert} onChange={setCertificationChoice} />
              </fieldset>
              {certifyAlert && <>
                {!hasRecordedCertification && (can('CERTIFY_ALERT') || can('UPLOAD_CERTIFICATION_NOTE')) && <label className="block text-sm font-medium">Ajouter la note de certification
                  <input disabled={busy} type="file" accept=".pdf,.png,.jpg,.jpeg" className={fieldClass} onChange={event => {
                    setCertificationFile(event.target.files?.[0] || null);
                    uploadedCertification.current = null;
                  }} />
                  {certificationFile && <span className="mt-2 block text-xs text-slate-500">{certificationFile.name} sera envoyé sur MinIO à l’enregistrement.</span>}
                </label>}
                {hasRecordedCertification && <><p className="text-sm text-primary">Note de certification enregistrée.</p>{ficheDocument('CERTIFICATION_NOTE', 'Note de certification')}</>}
              </>}
              {!hasRecordedCertification && can('CERTIFY_ALERT') && <button type="button" disabled={busy} className={buttonClass} onClick={async () => {
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
            {tab === 'consents' && !negative && <>
              {can('RECORD_CONSENT') && <Panel title="Enregistrer un consentement"><p className="mb-4 text-sm text-slate-600">Un consentement général signé et son fichier sont nécessaires pour ouvrir les soins.</p><WorkflowForm key={`new-${version}`} fields={consentFields} initial={{ consentType: 'MEDICAL_CARE', consentStatus: 'SIGNED' }} busy={busy} submitLabel="Enregistrer le consentement et son document" onSubmit={values => mutate(async () => {
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
                <div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="font-semibold">{consentTypes[consent.consentType] || 'Consentement'}</h4><p className="text-sm text-slate-500">{consent.agent} · {dateLabel(consent.consentDate)} · {consent.consentStatus === 'SIGNED' ? 'Signé' : 'Refusé'}</p><p className="text-sm">{consent.notes}</p></div>{permitted('acte-consentement-pecmu:read') && docButton(`/acte-consentement-pecmu/${consent.id}/file/download-url`, documentName(consent, 'Consentement.pdf'), consent.mimeType)}</div>
                {can('RECORD_CONSENT') && upload(`/acte-consentement-pecmu/${consent.id}/file`, consent.consentType === 'REFUSAL' ? 'Déposer le document de refus' : 'Déposer le document signé')}
                {!closed && state.medicalCare.length === 0 && !syncFailed && <div className="flex items-center gap-1 text-sm">{permitted('acte-consentement-pecmu:update') && <button disabled={busy} type="button" title="Modifier" aria-label="Modifier" className="rounded-md p-2 text-primary hover:bg-primary/10 disabled:opacity-40" onClick={() => setEditingConsent(editingConsent === consent.id ? null : consent.id)}><Pencil size={18} aria-hidden="true" /></button>}{permitted('acte-consentement-pecmu:delete') && <button disabled={busy} type="button" title="Supprimer" aria-label="Supprimer" className="rounded-md p-2 text-red-600 hover:bg-red-50 disabled:opacity-40" onClick={() => remove(`/acte-consentement-pecmu/${consent.id}`)}><Trash2 size={18} aria-hidden="true" /></button>}</div>}
                {editingConsent === consent.id && !closed && state.medicalCare.length === 0 && <WorkflowForm key={`${consent.id}-${version}`} fields={consentFields} initial={consent} busy={busy || syncFailed} submitLabel="Enregistrer la correction" onSubmit={async values => { const success = await mutate(() => workflowJson(fetcher, `/acte-consentement-pecmu/${consent.id}`, consentPayload(values, consent.consentDate), 'PUT')); if (success) setEditingConsent(null); return success; }} />}
              </article>)}</Panel>
            </>}
            {tab === 'care' && !negative && <>
              <section aria-label="Prises en charge" className="w-full space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">Prises en charge <span className="ml-2 text-sm font-normal text-slate-500">({state.medicalCare.length})</span></h2>
                  <button type="button" disabled={busy || !canAddCare} className={`${buttonClass} inline-flex items-center gap-2`} onClick={() => setShowNewCare(value => !value)}><Plus size={18} aria-hidden="true" />{showNewCare ? 'Annuler l’ajout' : 'Ajouter une prise en charge'}</button>
                </div>
                {!canAddCare && <p className="text-sm text-slate-500">{closed ? 'Le dossier est clôturé.' : syncFailed ? 'Actualisez le dossier pour rétablir les actions disponibles.' : !permitted('acte-medical-pecmu:create') ? 'Votre profil ne permet pas de créer une prise en charge.' : 'La création sera disponible après validation du consentement et de son document.'}</p>}
                {state.medicalCare.length === 0 && <Empty text="La prise en charge sera disponible après le consentement signé et le dépôt de son fichier." />}
                {state.medicalCare.map(care => <PecmuCareCard key={care.id} care={care}>
                  {Boolean(care.documents?.length || care.examens?.length) && <section className="space-y-3 border-t border-slate-100 pt-4"><h4 className="text-sm font-semibold text-primary">Documents et examens</h4>{docRows(care)}</section>}
                </PecmuCareCard>)}
              </section>

              {canAddCare && (showNewCare || !latest) && <Panel title={`Nouvelle prise en charge · ${(latest?.sequenceNumber || 0) + 1}`}><p className="mb-4 text-sm text-slate-600">{can('OPEN_TRANSFERRED_MEDICAL_CARE') && latest ? 'La nouvelle fiche reste liée à la précédente. Vérifiez les informations de suivi reprises et déposez la note de transfert avant de continuer.' : 'Renseignez le mode de soins et la structure médicale.'}</p><PecmuEvolutionForm key={`open-${version}`} care={{ id: 0, fichePecmuId: ficheId, sequenceNumber: (latest?.sequenceNumber || 0) + 1 }} hasClosureForm={false} careFields={careFields} initial={can('OPEN_TRANSFERRED_MEDICAL_CARE') && latest ? { careMode: latest.careMode, careStructureName: latest.transferStructureName, careProvince: latest.transferProvince, complaints: latest.complaints, diagnosis: latest.diagnosis, treatmentReceived: latest.treatmentReceived } : { careStructureName: state.fiche.careStructureName, careProvince: state.fiche.province }} busy={busy} submitLabel="Ouvrir la prise en charge" onSave={(values, files, closeCase) => mutate(async () => {
                for (const file of Object.values(files)) validatePecmuFile(file);
                const evolutionKeys = ['outcome', 'outcomeDate', 'transferStructureName', 'transferProvince', 'transferNotes'];
                const careValues = Object.fromEntries(Object.entries(values).filter(([key]) => !evolutionKeys.includes(key)));
                const evolutionValues = Object.fromEntries(Object.entries(values).filter(([key]) => evolutionKeys.includes(key)));
                const response = await workflowJson(fetcher, '/acte-medical-pecmu', { ...careValues, fichePecmuId: ficheId, ...(can('OPEN_TRANSFERRED_MEDICAL_CARE') && latest ? { previousCareId: latest.id } : {}) });
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
              {can('UPDATE_MEDICAL_CARE') && latest && <Panel title="Soins en cours"><button type="button" className={buttonClass} onClick={() => setEditCare(value => !value)}>{editCare ? 'Masquer le formulaire' : 'Mettre à jour les soins'}</button>{editCare && <div className="mt-4"><WorkflowForm key={`edit-${latest.id}-${version}`} fields={careFields} initial={latest} busy={busy} submitLabel="Enregistrer les soins" onSubmit={values => { const changed = Object.fromEntries(Object.entries(values).filter(([key, value]) => value !== latest[key as keyof MedicalCare])); return json(`/acte-medical-pecmu/${latest.id}`, changed, 'PUT'); }} /></div>}</Panel>}
              {can('UPLOAD_MEDICAL_DOCUMENT') && latest && <Panel title="Examens et documents médicaux"><MedicalUpload busy={busy} onUpload={(type, file) => mutate(() => uploadPecmuFile(fetcher, type === 'EXAM' ? `/acte-medical-pecmu/${latest.id}/exams` : `/acte-medical-pecmu/${latest.id}/documents/${type}`, file))} /></Panel>}
              {latest && <Panel title="Évolution">
                {!closed && (can('UPDATE_MEDICAL_CARE') || can('UPLOAD_MEDICAL_REPORT') || can('UPLOAD_TRANSFER_NOTE') || can('UPLOAD_CLOSURE_FORM') || can('CLOSE_CASE')) ? <PecmuEvolutionForm key={`${latest.id}-${version}`} care={latest} hasClosureForm={Boolean(state.fiche.documents?.some(file => fileType(file) === 'CLOSURE_FORM'))} busy={busy || syncFailed} onSave={(values, files, closeCase) => mutate(async () => {
                  for (const file of Object.values(files)) validatePecmuFile(file);
                  if (Object.entries(values).some(([key, value]) => value !== (key === 'outcomeDate' ? latest.outcomeDate?.slice(0, 10) : latest[key as keyof MedicalCare]))) await workflowJson(fetcher, `/acte-medical-pecmu/${latest.id}`, values, 'PUT');
                  for (const [type, file] of Object.entries(files)) await uploadPecmuFile(fetcher, type === 'CLOSURE_FORM' ? `${base}/documents/CLOSURE_FORM` : `/acte-medical-pecmu/${latest.id}/documents/${type}`, file);
                  if (closeCase) {
                    const today = new Date();
                    const closureDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    await workflowJson(fetcher, `${base}/close`, { reason: outcomeLabels[values.outcome as keyof typeof outcomeLabels], closureDate });
                  }
                })} /> : <p className="text-sm">{latest.outcome ? outcomeLabels[latest.outcome] : 'Évolution non renseignée'}</p>}
                {closed && <><p className="mt-4 text-sm font-semibold text-primary">Dossier clôturé</p>{ficheDocument('CLOSURE_FORM', 'Formulaire de clôture')}{permitted('fiche-pecmu:read') && downloadButton(`${base}/documents/CLOSURE_FORM/download-url`, 'Formulaire de clôture.pdf')}</>}
              </Panel>}
              {!closed && !syncFailed && latest && !latest.outcome && permitted('acte-medical-pecmu:delete') && <button disabled={busy} className="text-sm text-red-600" onClick={() => remove(`/acte-medical-pecmu/${latest.id}`)}>Supprimer la dernière prise en charge sans issue</button>}
            </>}
            {tab === 'followups' && <PecmuFollowUps ficheId={ficheId} fetcher={fetcher} version={version} busy={busy || syncFailed}
              canRead={permitted('suivi-accompagnement:read')}
              canCreate={!closed && !syncFailed && ['IN_CARE', 'LOST_TO_FOLLOW_UP'].includes(state.currentStatus) && permitted('suivi-accompagnement:create')}
              canUpdate={!closed && !syncFailed && permitted('suivi-accompagnement:update')}
              canDelete={!closed && !syncFailed && permitted('suivi-accompagnement:delete')}
              save={json} remove={remove} />}
            {tab === 'orientations' && !negative && <div className="space-y-6">
              {!closed ? <Panel title="Orientations après PECMU"><Empty text="Les orientations sont disponibles après la clôture du dossier." /></Panel> : <>
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
              </>}
            </div>}
            {tab === 'history' && <Panel title="Historique du dossier">{state.history?.length ? <ol className="space-y-3">{state.history.map((entry, index) => <li key={entry.id ?? index} className="border-l-2 border-primary/30 pl-4 text-sm"><p className="font-medium">{entry.action || entry.status}</p><p className="text-slate-500">{dateLabel(entry.createdAt)}</p><p>{entry.comment}</p></li>)}</ol> : <><p className="mb-4 text-sm text-slate-500">L’API ne fournit pas d’historique détaillé pour ce dossier. Les prises en charge sont consultables dans leur onglet.</p><Details values={state.fiche} fields={[[ 'createdAt', 'Création du dossier'], ['updatedAt', 'Dernière mise à jour']]} /></>}</Panel>}
          </>}
        </main>
      </div>
    </ModalBody></Modal>
    {preview && <PecmuDocumentViewer document={preview} fetcher={fetcher} onClose={() => setPreview(null)} />}
  </>;
}

const orientationLabels: Record<string, string> = { PSYCHOLOGICAL_SUPPORT: 'Accompagnement psychologique', ECONOMIC_POOL: 'Pool économique', COMPENSATION: 'Indemnisation' };
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="space-y-4 border border-slate-200 bg-white p-5"><h3 className="text-lg font-semibold">{title}</h3>{children}</section>; }
function Empty({ text }: { text: string }) { return <p className="py-4 text-sm text-slate-500">{text}</p>; }
function ReadOnly() { return <p className="text-sm text-slate-500">Cette étape est en consultation. Les actions disponibles dépendent de l’état du dossier et de vos droits.</p>; }
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
