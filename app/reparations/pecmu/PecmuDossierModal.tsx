'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, ModalBody } from 'flowbite-react';
import { Eye, RefreshCw, X } from 'lucide-react';
import Swal from 'sweetalert2';
import type { PecmuFetcher } from '../services/pecmuApi';
import {
  certifyPecmuAlert, uploadCertificationNote, activeWorkflowTab, canPerform, consentTypes, getPecmuPermissions, loadPecmuWorkflow,
  medicalDocumentTypes, outcomeLabels, PecmuApiError, statusLabels, uploadPecmuFile, validatePecmuFile, workflowJson,
  type FileMetadata, type MedicalCare, type WorkflowSnapshot, type WorkflowTab,
} from '../services/pecmuWorkflowApi';
import YesNoToggle from './YesNoToggle';
import PecmuDocumentViewer, { type DocumentPreview } from './PecmuDocumentViewer';
import { buttonClass, fieldClass, WorkflowForm, type WorkflowField } from './WorkflowForm';

type Props = { ficheId: number; fetcher: PecmuFetcher; onClose: () => void; onChanged: () => void };
const tabs: Array<{ id: WorkflowTab; label: string }> = [
  { id: 'identity', label: 'Identification et alerte' }, { id: 'certification', label: 'Certification' },
  { id: 'decision', label: 'Pool médical' }, { id: 'consents', label: 'Consentements' },
  { id: 'care', label: 'Prises en charge' }, { id: 'followups', label: 'Suivis et rendez-vous' },
  { id: 'closure', label: 'Clôture' }, { id: 'orientations', label: 'Orientations' }, { id: 'history', label: 'Historique' },
];
const careFields: WorkflowField[] = [
  { key: 'supervisorName', label: 'Superviseur médical', required: true },
  { key: 'careMode', label: 'Mode de prise en charge', type: 'select', required: true, options: { OUTPATIENT: 'Ambulatoire', HOSPITALIZATION: 'Hospitalisation' } },
  { key: 'careDate', label: 'Date des soins', type: 'date', required: true, when: values => values.careMode === 'OUTPATIENT' },
  { key: 'hospitalizationStartDate', label: 'Début d’hospitalisation', type: 'date', required: true, when: values => values.careMode === 'HOSPITALIZATION' },
  { key: 'hospitalizationEndDate', label: 'Fin d’hospitalisation', type: 'date', when: values => values.careMode === 'HOSPITALIZATION' },
  { key: 'careStructureName', label: 'Structure de prise en charge', required: true }, { key: 'careProvince', label: 'Province', required: true },
  { key: 'treatingDoctorName', label: 'Médecin traitant' }, { key: 'treatingDoctorPhone', label: 'Téléphone du médecin' },
  { key: 'complaints', label: 'Plaintes', type: 'textarea' }, { key: 'diagnosis', label: 'Diagnostic', type: 'textarea' },
  { key: 'treatmentReceived', label: 'Traitement reçu', type: 'textarea' },
  { key: 'appointmentDate1', label: 'Premier rendez-vous', type: 'date' }, { key: 'appointmentDate2', label: 'Deuxième rendez-vous', type: 'date' }, { key: 'appointmentDate3', label: 'Troisième rendez-vous', type: 'date' },
  { key: 'cout', label: 'Coût (USD)', type: 'number' }, { key: 'partenaireNom', label: 'Partenaire médical' }, { key: 'partenaireTitre', label: 'Titre / convention' }, { key: 'observation', label: 'Observation', type: 'textarea' },
];
const consentFields: WorkflowField[] = [
  { key: 'agent', label: 'Agent responsable', required: true },
  { key: 'consentType', label: 'Type de consentement', type: 'select', options: consentTypes, required: true },
  { key: 'consentStatus', label: 'Signature', type: 'select', options: { SIGNED: 'Signé', REFUSED: 'Refusé' }, required: true },
  { key: 'consentDate', label: 'Date du consentement', type: 'date', required: true }, { key: 'notes', label: 'Notes', type: 'textarea' },
];
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
  const [editCare, setEditCare] = useState(false);
  const [certificationChoice, setCertificationChoice] = useState<boolean | null>(null);
  const [certificationFile, setCertificationFile] = useState<File | null>(null);
  const uploadedCertification = useRef<string | null>(null);
  const [consentFile, setConsentFile] = useState<File | null>(null);
  const [editingConsent, setEditingConsent] = useState<number | null>(null);
  const [editingFollowup, setEditingFollowup] = useState<number | null>(null);
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
    if (statusRef.current !== fresh.currentStatus) { setTab(activeWorkflowTab(fresh.currentStatus)); statusRef.current = fresh.currentStatus; }
    return fresh;
  }, [fetcher, ficheId]);
  useEffect(() => {
    setPermissions(getPecmuPermissions());
    void load().catch(e => { setError(e.message); setSyncFailed(true); }).finally(() => setLoading(false));
  }, [load]);
  const permitted = (permission: string) => permissions === null || permissions.includes(permission);
  const can = (action: string) => Boolean(state && !syncFailed && canPerform(state, action, permissions));
  const closed = state?.currentStatus === 'CLOSED';
  const certifyAlert = certificationChoice ?? state?.fiche.incidentCertification === true;
  const latest = state?.medicalCare.at(-1);
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
  const ficheDocument = (type: 'CERTIFICATION_NOTE' | 'CLOSURE_FORM', label: string) => {
    const metadata = state?.fiche.documents?.find(file => fileType(file) === type);
    return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 py-3"><span className="text-sm font-medium">{metadata ? documentName(metadata, label) : label}</span>{permitted('fiche-pecmu:read') && docButton(`${base}/documents/${type}/download-url`, metadata ? documentName(metadata, label) : `${label}.pdf`, metadata?.mimeType)}</div>;
  };
  const upload = (path: string, label: string) => <Upload key={`${path}-${version}`} label={label} busy={busy || syncFailed} onUpload={file => mutate(() => uploadPecmuFile(fetcher, path, file))} />;
  const docRows = (care: MedicalCare) => <>
    {(care.documents || []).map((file, index) => <div key={file.id ?? index} className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 py-3"><span className="text-sm">{documentName(file, medicalDocumentTypes[fileType(file) as keyof typeof medicalDocumentTypes] || 'Document médical')}</span>{file.id != null && permitted('acte-medical-pecmu:read') && docButton(`/acte-medical-pecmu/${care.id}/documents/${file.id}/download-url`, documentName(file, 'Document médical.pdf'), file.mimeType)}</div>)}
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
              <fieldset disabled={busy || (!can('CERTIFY_ALERT') && !can('UPLOAD_CERTIFICATION_NOTE'))}>
                <YesNoToggle label="Certifier l’alerte" checked={certifyAlert} onChange={setCertificationChoice} />
              </fieldset>
              {certifyAlert && <>
                {(can('CERTIFY_ALERT') || can('UPLOAD_CERTIFICATION_NOTE')) && <label className="block text-sm font-medium">Ajouter la note de certification
                  <input disabled={busy} type="file" accept=".pdf,.png,.jpg,.jpeg" className={fieldClass} onChange={event => {
                    setCertificationFile(event.target.files?.[0] || null);
                    uploadedCertification.current = null;
                  }} />
                  {certificationFile && <span className="mt-2 block text-xs text-slate-500">{certificationFile.name} sera envoyé sur MinIO à l’enregistrement.</span>}
                </label>}
                {ficheDocument('CERTIFICATION_NOTE', 'Note de certification')}
              </>}
              {can('CERTIFY_ALERT') && <button type="button" disabled={busy} className={buttonClass} onClick={async () => {
                if (!certifyAlert && !await confirm('Rejeter la certification de cette alerte ?')) return;
                const success = await mutate(async () => {
                  let reference = uploadedCertification.current || state.fiche.certificationFile;
                  if (certifyAlert && certificationFile && !uploadedCertification.current) {
                    reference = await uploadCertificationNote(fetcher, certificationFile);
                    uploadedCertification.current = reference;
                  }
                  await certifyPecmuAlert(fetcher, ficheId, certifyAlert, reference);
                });
                if (success) { setCertificationChoice(null); setCertificationFile(null); uploadedCertification.current = null; }
              }}>{busy ? 'Enregistrement…' : 'Enregistrer la certification'}</button>}
            </Panel>}
            {tab === 'decision' && <Panel title="Décision du pool médical">
              {ficheDocument('CERTIFICATION_NOTE', 'Consulter la note de certification')}
              <Details values={state.fiche} fields={[[ 'pecmuDecision', 'Décision enregistrée'], ['medicalDecisionComment', 'Motivation'], ['decisionMakerName', 'Médecin du pool'], ['decisionDate', 'Date de décision']]} />
              {can('RECORD_MEDICAL_DECISION') ? <WorkflowForm key={version} busy={busy} submitLabel="Enregistrer la décision" fields={[
                { key: 'eligible', label: 'Dossier éligible', type: 'boolean' }, { key: 'decisionMakerName', label: 'Nom du décideur', required: true }, { key: 'decisionMakerFunction', label: 'Fonction', required: true }, { key: 'decisionDate', label: 'Date de décision', type: 'date', required: true }, { key: 'comment', label: 'Motivation de la décision', type: 'textarea', required: true },
              ]} onSubmit={async values => { if (!values.eligible && !await confirm('Déclarer ce dossier non éligible ?')) return false; return json(`${base}/medical-decision`, values); }} /> : <ReadOnly />}
            </Panel>}
            {tab === 'consents' && !negative && <>
              {can('RECORD_CONSENT') && <Panel title="Enregistrer un consentement"><p className="mb-4 text-sm text-slate-600">Un consentement général signé et son fichier sont nécessaires pour ouvrir les soins.</p><WorkflowForm key={`new-${version}`} fields={consentFields} initial={{ consentType: 'MEDICAL_CARE', consentStatus: 'SIGNED' }} busy={busy} submitLabel="Enregistrer le consentement et son document" onSubmit={values => mutate(async () => {
                if (!consentFile) throw new Error('Sélectionnez le document signé ou le formulaire de refus.');
                validatePecmuFile(consentFile);
                const response = await workflowJson(fetcher, '/acte-consentement-pecmu', { ...values, fichePecmuId: ficheId });
                const id = response?.id ?? response?.data?.id;
                await load();
                if (!id) throw new Error('Le serveur n’a pas retourné l’identifiant du consentement. Actualisez le dossier.');
                try { await uploadPecmuFile(fetcher, `/acte-consentement-pecmu/${id}/file`, consentFile); } catch (e: any) { throw new Error(`Consentement créé. Le fichier n’a pas été déposé : ${e.message} Utilisez « Déposer le fichier » sur ce consentement pour réessayer sans le recréer.`); }
                setConsentFile(null);
              })}><label className="text-sm font-medium md:col-span-2">Document signé / refus *<input required type="file" accept=".pdf,.png,.jpg,.jpeg" className={fieldClass} onChange={event => setConsentFile(event.target.files?.[0] || null)} /></label></WorkflowForm></Panel>}
              <Panel title="Consentements du dossier">{state.consents.length === 0 && <Empty text="Aucun consentement enregistré." />}{state.consents.filter(c => c.isActive !== false).map(consent => <article key={consent.id} className="space-y-3 border-b border-slate-200 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="font-semibold">{consentTypes[consent.consentType] || 'Consentement'}</h4><p className="text-sm text-slate-500">{consent.agent} · {dateLabel(consent.consentDate)} · {consent.consentStatus === 'SIGNED' ? 'Signé' : 'Refusé'}</p><p className="text-sm">{consent.notes}</p></div>{permitted('acte-consentement-pecmu:read') && docButton(`/acte-consentement-pecmu/${consent.id}/file/download-url`, documentName(consent, 'Consentement.pdf'), consent.mimeType)}</div>
                {can('RECORD_CONSENT') && upload(`/acte-consentement-pecmu/${consent.id}/file`, 'Déposer le fichier signé / réessayer le dépôt')}
                {!closed && state.medicalCare.length === 0 && !syncFailed && <div className="flex gap-4 text-sm">{permitted('acte-consentement-pecmu:update') && <button disabled={busy} className="text-primary" onClick={() => setEditingConsent(editingConsent === consent.id ? null : consent.id)}>Corriger</button>}{permitted('acte-consentement-pecmu:delete') && <button disabled={busy} className="text-red-600" onClick={() => remove(`/acte-consentement-pecmu/${consent.id}`)}>Supprimer</button>}</div>}
                {editingConsent === consent.id && !closed && state.medicalCare.length === 0 && <WorkflowForm key={`${consent.id}-${version}`} fields={consentFields} initial={consent} busy={busy || syncFailed} submitLabel="Enregistrer la correction" onSubmit={async values => { const success = await json(`/acte-consentement-pecmu/${consent.id}`, values, 'PUT'); if (success) setEditingConsent(null); return success; }} />}
              </article>)}</Panel>
            </>}
            {tab === 'care' && !negative && <>
              <Panel title="Parcours des prises en charge">{state.medicalCare.length === 0 && <Empty text="La prise en charge sera disponible après le consentement signé et le dépôt de son fichier." />}<ol className="space-y-5 border-l-2 border-primary/20 pl-5">{state.medicalCare.map(care => <li key={care.id} className="space-y-3"><h3 className="font-semibold text-primary">Prise en charge {care.sequenceNumber} · {care.careStructureName || 'Structure non renseignée'}</h3><p className="text-sm text-slate-500">{care.careMode === 'HOSPITALIZATION' ? 'Hospitalisation' : 'Ambulatoire'} · {care.careProvince} · {care.outcome ? outcomeLabels[care.outcome] : 'En cours'}</p><Details values={care} fields={careFields.map(field => [field.key, field.label] as [string, string]).concat([['outcomeDate', 'Date de l’issue'], ['transferStructureName', 'Structure receveuse'], ['transferProvince', 'Province de transfert'], ['transferNotes', 'Note de suivi du transfert']])} />{docRows(care)}</li>)}</ol></Panel>
              {can('UPLOAD_TRANSFER_NOTE') && latest && <Panel title="Note de transfert obligatoire">{upload(`/acte-medical-pecmu/${latest.id}/documents/TRANSFER_NOTE`, 'Ajouter la note de transfert')}</Panel>}
              {(can('OPEN_MEDICAL_CARE') || can('OPEN_TRANSFERRED_MEDICAL_CARE')) && <Panel title={latest ? 'Ouvrir la prise en charge suivante' : 'Ouvrir la première prise en charge'}><p className="mb-4 text-sm text-slate-600">{latest ? 'La nouvelle fiche reste liée à la précédente. Vérifiez les informations de suivi reprises et déposez la note de transfert avant de continuer.' : 'Renseignez le mode de soins et la structure médicale.'}</p><WorkflowForm key={`open-${version}`} fields={careFields} initial={latest ? { careMode: latest.careMode, careStructureName: latest.transferStructureName, careProvince: latest.transferProvince, complaints: latest.complaints, diagnosis: latest.diagnosis, treatmentReceived: latest.treatmentReceived } : { careStructureName: state.fiche.careStructureName, careProvince: state.fiche.province }} busy={busy} submitLabel="Ouvrir la prise en charge" onSubmit={values => json('/acte-medical-pecmu', { ...values, fichePecmuId: ficheId, ...(can('OPEN_TRANSFERRED_MEDICAL_CARE') && latest ? { previousCareId: latest.id } : {}) })} /></Panel>}
              {can('UPDATE_MEDICAL_CARE') && latest && <Panel title="Soins en cours"><button type="button" className={buttonClass} onClick={() => setEditCare(value => !value)}>{editCare ? 'Masquer le formulaire' : 'Mettre à jour les soins'}</button>{editCare && <div className="mt-4"><WorkflowForm key={`edit-${latest.id}-${version}`} fields={careFields} initial={latest} busy={busy} submitLabel="Enregistrer les soins" onSubmit={values => { const changed = Object.fromEntries(Object.entries(values).filter(([key, value]) => value !== latest[key as keyof MedicalCare])); return json(`/acte-medical-pecmu/${latest.id}`, changed, 'PUT'); }} /></div>}</Panel>}
              {can('UPLOAD_MEDICAL_DOCUMENT') && latest && <Panel title="Examens et documents médicaux"><MedicalUpload busy={busy} onUpload={(type, file) => mutate(() => uploadPecmuFile(fetcher, type === 'EXAM' ? `/acte-medical-pecmu/${latest.id}/exams` : `/acte-medical-pecmu/${latest.id}/documents/${type}`, file))} /></Panel>}
              {can('UPDATE_MEDICAL_CARE') && latest && <Panel title="Issue de la dernière prise en charge"><WorkflowForm key={`outcome-${version}`} busy={busy} submitLabel="Enregistrer l’issue médicale" fields={[
                { key: 'outcome', label: 'Issue', type: 'select', options: outcomeLabels, required: true }, { key: 'outcomeDate', label: 'Date de l’issue', type: 'date', required: true },
                { key: 'transferStructureName', label: 'Structure receveuse', required: true, when: values => values.outcome === 'TRANSFERRED' }, { key: 'transferProvince', label: 'Province de transfert', required: true, when: values => values.outcome === 'TRANSFERRED' }, { key: 'transferNotes', label: 'Informations de suivi pour la structure receveuse', type: 'textarea', when: values => values.outcome === 'TRANSFERRED' },
              ]} onSubmit={values => json(`/acte-medical-pecmu/${latest.id}`, values, 'PUT')} /><p className="mt-4 text-sm text-slate-500">Une guérison ou un décès prépare la clôture ; le dossier n’est clôturé qu’après dépôt des pièces finales et validation explicite.</p></Panel>}
              {!closed && !syncFailed && latest && !latest.outcome && permitted('acte-medical-pecmu:delete') && <button disabled={busy} className="text-sm text-red-600" onClick={() => remove(`/acte-medical-pecmu/${latest.id}`)}>Supprimer la dernière prise en charge sans issue</button>}
            </>}
            {tab === 'followups' && <>
              {can('CONTINUE_FOLLOW_UP') && <Panel title="Ajouter un suivi ou un rendez-vous"><WorkflowForm key={version} fields={followupFields} busy={busy} submitLabel="Enregistrer le suivi" onSubmit={values => json('/suivi-accompagnement', { ...values, fichePecmuId: ficheId })} /></Panel>}
              <Panel title="Suivis et rendez-vous">{state.followUps.length === 0 && <Empty text="Aucun suivi enregistré." />}{state.followUps.map(followup => <article key={followup.id} className="space-y-3 border-b border-slate-200 py-4"><p className="whitespace-pre-wrap text-sm">{followup.avis}</p><p className="text-xs text-slate-500">Prochain rendez-vous : {dateLabel(followup.dateProchainRdv)}</p>{!closed && !syncFailed && <div className="flex gap-4 text-sm">{permitted('suivi-accompagnement:update') && <button disabled={busy} className="text-primary" onClick={() => setEditingFollowup(editingFollowup === followup.id ? null : followup.id)}>Corriger</button>}{permitted('suivi-accompagnement:delete') && <button disabled={busy} className="text-red-600" onClick={() => remove(`/suivi-accompagnement/${followup.id}`)}>Supprimer</button>}</div>}{editingFollowup === followup.id && !closed && <WorkflowForm key={`${followup.id}-${version}`} fields={followupFields} initial={followup} busy={busy || syncFailed} submitLabel="Enregistrer la correction" onSubmit={async values => { const success = await json(`/suivi-accompagnement/${followup.id}`, values, 'PUT'); if (success) setEditingFollowup(null); return success; }} />}</article>)}</Panel>
            </>}
            {tab === 'closure' && !negative && <Panel title={closed ? 'Dossier clôturé' : 'Clôture du dossier'}>
              {state.currentStatus === 'LOST_TO_FOLLOW_UP' && <p className="mb-4 text-sm text-secondary">Le patient est perdu de vue. Le suivi reste accessible ; la clôture nécessite une décision explicite.</p>}
              <p className="mb-4 text-sm text-slate-600">Pièces requises : issue médicale datée, rapport médical final, formulaire de clôture et certificat de décès si le patient est décédé.</p>
              {latest && <><p className="mb-4 text-sm font-medium">Issue : {latest.outcome ? outcomeLabels[latest.outcome] : 'Non renseignée'} · {dateLabel(latest.outcomeDate)}</p>{docRows(latest)}{can('UPLOAD_MEDICAL_REPORT') && upload(`/acte-medical-pecmu/${latest.id}/documents/MEDICAL_REPORT`, 'Ajouter le rapport médical final')}{!closed && latest.outcome === 'DECEASED' && (can('UPLOAD_MEDICAL_DOCUMENT') || can('UPLOAD_MEDICAL_REPORT')) && upload(`/acte-medical-pecmu/${latest.id}/documents/DEATH_CERTIFICATE`, 'Ajouter le certificat de décès')}</>}
              {ficheDocument('CLOSURE_FORM', 'Formulaire de clôture')}
              {can('UPLOAD_CLOSURE_FORM') && upload(`${base}/documents/CLOSURE_FORM`, 'Ajouter le formulaire de clôture')}
              {can('CLOSE_CASE') && <WorkflowForm key={version} busy={busy} submitLabel="Clôturer le dossier" fields={[{ key: 'reason', label: 'Motif de clôture', required: true }, { key: 'closureDate', label: 'Date de clôture', type: 'date', required: true }, { key: 'notes', label: 'Notes de clôture', type: 'textarea' }]} onSubmit={async values => { if (!await confirm('Clôturer ce dossier PECMU ? Les soins ne pourront plus être modifiés.')) return false; return json(`${base}/close`, values); }} />}
              {closed && <Details values={state.fiche} fields={[[ 'closureDate', 'Date de clôture'], ['closureReason', 'Motif de clôture'], ['closureNotes', 'Notes']]} />}
            </Panel>}
            {tab === 'orientations' && !negative && <Panel title="Orientations après PECMU">
              {!closed ? <Empty text="Les orientations sont disponibles après la clôture du dossier." /> : <>
                <Details values={state.fiche} fields={[[ 'orientations', 'Orientations enregistrées'], ['orientationNotes', 'Notes']]} />
                {can('RECORD_POST_PECMU_ORIENTATIONS') && <form onSubmit={async event => { event.preventDefault(); await json(`${base}/orientations`, { orientations: [...new Set(selectedOrientations)], notes: orientationNotes }); }}><fieldset disabled={busy} className="space-y-4">{Object.entries(orientationLabels).map(([value, label]) => <label key={value} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={selectedOrientations.includes(value)} onChange={event => setSelectedOrientations(previous => event.target.checked ? [...previous, value] : previous.filter(item => item !== value))} />{label}</label>)}<label className="block text-sm">Notes<textarea className={fieldClass} value={orientationNotes} onChange={event => setOrientationNotes(event.target.value)} /></label><button className={buttonClass}>Enregistrer les orientations</button></fieldset></form>}
              </>}
            </Panel>}
            {tab === 'history' && <Panel title="Historique du dossier">{state.history?.length ? <ol className="space-y-3">{state.history.map((entry, index) => <li key={entry.id ?? index} className="border-l-2 border-primary/30 pl-4 text-sm"><p className="font-medium">{entry.action || entry.status}</p><p className="text-slate-500">{dateLabel(entry.createdAt)}</p><p>{entry.comment}</p></li>)}</ol> : <><p className="mb-4 text-sm text-slate-500">L’API ne fournit pas d’historique détaillé pour ce dossier. Les prises en charge sont consultables dans leur onglet.</p><Details values={state.fiche} fields={[[ 'createdAt', 'Création du dossier'], ['updatedAt', 'Dernière mise à jour']]} /></>}</Panel>}
          </>}
        </main>
      </div>
    </ModalBody></Modal>
    {preview && <PecmuDocumentViewer document={preview} fetcher={fetcher} onClose={() => setPreview(null)} />}
  </>;
}
const followupFields: WorkflowField[] = [{ key: 'avis', label: 'Avis / commentaire', type: 'textarea', required: true }, { key: 'dateProchainRdv', label: 'Prochain rendez-vous', type: 'date' }];
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
