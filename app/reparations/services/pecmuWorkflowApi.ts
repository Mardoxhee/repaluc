'use client';

import { extractUploadedFileLink } from '../../utils/uploadResponse';
import { authenticatedFetch } from '../../utils/authFetch';
import type { FichePecmu, PecmuFetcher, SuiviAccompagnement } from './pecmuApi';

export type WorkflowStatus = 'CERTIFICATION_PENDING' | 'MEDICAL_DECISION_PENDING' | 'NOT_CERTIFIED' | 'CONSENT_PENDING' | 'NOT_ELIGIBLE' | 'CONSENT_REFUSED' | 'READY_FOR_CARE' | 'IN_CARE' | 'TRANSFERRED' | 'CLOSURE_PENDING' | 'LOST_TO_FOLLOW_UP' | 'CLOSED';
export const statusLabels: Record<WorkflowStatus, string> = {
  CERTIFICATION_PENDING: 'Certification en attente', MEDICAL_DECISION_PENDING: 'Décision médicale en attente',
  NOT_CERTIFIED: 'Alerte non certifiée', CONSENT_PENDING: 'Consentement en attente', NOT_ELIGIBLE: 'Dossier non éligible',
  CONSENT_REFUSED: 'Consentement refusé', READY_FOR_CARE: 'Prêt pour la prise en charge', IN_CARE: 'En cours de soins',
  TRANSFERRED: 'Transféré', CLOSURE_PENDING: 'Clôture en attente', LOST_TO_FOLLOW_UP: 'Perdu de vue', CLOSED: 'Clôturé',
};
export const consentTypes = { MEDICAL_CARE: 'Consentement à la prise en charge médicale', MEDICAL_TRANSFER: 'Consentement au transfert médical', MEDICAL_ACT: 'Consentement à l’acte médical', REFUSAL: 'Formulaire de refus' };
export const outcomeLabels = { STABILIZED_OR_CURED: 'Stabilisé/guéri', DECEASED: 'Décédé', TRANSFERRED: 'Transféré à un niveau supérieur', LOST_TO_FOLLOW_UP: 'Perdu de vue' };
export const medicalDocumentTypes = { MEDICAL_REPORT: 'Rapport médical', DEATH_CERTIFICATE: 'Certificat de décès', TRANSFER_NOTE: 'Note de transfert', OTHER: 'Autre document médical' };
export type FileMetadata = { id?: number | string; type?: string; documentType?: string; originalName?: string; filename?: string; mimeType?: string; size?: number };
export type WorkflowConsent = FileMetadata & { id: number; agent: string; consentType: keyof typeof consentTypes; consentStatus: 'SIGNED' | 'REFUSED'; consentDate?: string; notes?: string; file?: unknown; isActive?: boolean };
export type MedicalCare = {
  id: number; fichePecmuId: number; sequenceNumber: number; previousCareId?: number;
  careMode?: 'OUTPATIENT' | 'HOSPITALIZATION'; careDate?: string; hospitalizationStartDate?: string; hospitalizationEndDate?: string;
  supervisorName?: string; careStructureName?: string; careProvince?: string; treatingDoctorName?: string; treatingDoctorPhone?: string;
  complaints?: string; diagnosis?: string; treatmentReceived?: string; appointmentDate1?: string; appointmentDate2?: string; appointmentDate3?: string;
  cout?: number; observation?: string; partenaireNom?: string; partenaireTitre?: string;
  outcome?: keyof typeof outcomeLabels; outcomeDate?: string; transferStructureName?: string; transferProvince?: string; transferNotes?: string;
  documents?: FileMetadata[]; examens?: FileMetadata[]; createdAt?: string;
};
export type WorkflowSnapshot = {
  fiche: FichePecmu & { documents?: FileMetadata[] };
  consents: WorkflowConsent[]; medicalCare: MedicalCare[]; followUps: SuiviAccompagnement[];
  currentStatus: WorkflowStatus; nextActions: string[];
  history?: Array<{ id?: string | number; action?: string; status?: string; createdAt?: string; comment?: string }>;
};
export class PecmuApiError extends Error {
  constructor(public statusCode: number, public code: string, message: string) { super(message); this.name = 'PecmuApiError'; }
}
// Unlike the legacy fetcher this preserves business errors and handles 204 responses.
export const pecmuRequest: PecmuFetcher = async (path, options = {}) => {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  const response = await authenticatedFetch(`${base}${path}`, { ...options, cache: 'no-store' });
  const text = await response.text();
  let body: any;
  try { body = text ? JSON.parse(text) : undefined; } catch { body = undefined; }
  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(' · ') : body?.message;
    throw new PecmuApiError(response.status, body?.code || 'PECMU_REQUEST_FAILED', message || `La requête PECMU a échoué (${response.status}).`);
  }
  return body;
};
export async function loadPecmuWorkflow(fetcher: PecmuFetcher, id: number): Promise<WorkflowSnapshot> {
  const result = await fetcher(`/fiche-pecmu/${id}/workflow`);
  const state = result?.data?.fiche ? result.data : result;
  if (!state?.fiche || !state.currentStatus || !Array.isArray(state.nextActions)) throw new Error('Le serveur a retourné un parcours PECMU incomplet.');
  return { ...state, consents: state.consents || [], followUps: state.followUps || [], medicalCare: [...(state.medicalCare || [])].sort((a, b) => a.sequenceNumber - b.sequenceNumber) };
}
export async function workflowJson(fetcher: PecmuFetcher, path: string, payload: unknown, method = 'POST') {
  return fetcher(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}
export function validatePecmuFile(file: File) {
  if (!file.size) throw new Error('Le fichier est vide.');
  if (!/\.(pdf|png|jpe?g)$/i.test(file.name)) throw new Error('Formats acceptés : PDF, PNG et JPEG.');
}
export async function uploadPecmuFile(fetcher: PecmuFetcher, path: string, file: File) {
  validatePecmuFile(file);
  const form = new FormData(); form.append('file', file);
  return fetcher(path, { method: 'POST', body: form });
}
export async function uploadCertificationNote(fetcher: PecmuFetcher, file: File): Promise<string> {
  const response = await uploadPecmuFile(fetcher, '/minio/files/upload', file);
  const reference = extractUploadedFileLink(response);
  if (!reference) throw new Error('MinIO n’a pas retourné la référence de la note de certification.');
  return reference;
}
export async function certifyPecmuAlert(fetcher: PecmuFetcher, id: number, certified: boolean, certificationFile?: string) {
  if (certified && !certificationFile?.trim()) throw new Error('Ajoutez la note de certification avant de certifier l’alerte.');
  return workflowJson(fetcher, `/fiche-pecmu/${id}/certification`, certified
    ? { certified: true, certificationFile }
    : { certified: false });
}
export async function getPecmuDocumentUrl(fetcher: PecmuFetcher, path: string): Promise<string> {
  const response = await fetcher(path);
  const url = response?.url ?? response?.data?.url;
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) throw new Error('L’URL du document est indisponible.');
  return url;
}
export async function getCertificationFileUrl(fetcher: PecmuFetcher, reference: string): Promise<string> {
  if (/^https?:\/\//i.test(reference)) return reference;
  const key = reference.split('/').map(segment => encodeURIComponent(segment)).join('/');
  const response = await fetcher(`/minio/files/${key}`);
  const url = extractUploadedFileLink(response);
  if (!/^https?:\/\//i.test(url)) throw new Error('Le lien de la note de certification est indisponible.');
  return url;
}
export const actionPermissions: Record<string, string> = {
  UPLOAD_CERTIFICATION_NOTE: 'fiche-pecmu:update', CERTIFY_ALERT: 'fiche-pecmu:update', RECORD_MEDICAL_DECISION: 'fiche-pecmu:medical-decision',
  RECORD_CONSENT: 'acte-consentement-pecmu:create', OPEN_MEDICAL_CARE: 'acte-medical-pecmu:create', UPDATE_MEDICAL_CARE: 'acte-medical-pecmu:update',
  UPLOAD_MEDICAL_DOCUMENT: 'acte-medical-pecmu:create', UPLOAD_TRANSFER_NOTE: 'acte-medical-pecmu:create', OPEN_TRANSFERRED_MEDICAL_CARE: 'acte-medical-pecmu:create',
  CONTINUE_FOLLOW_UP: 'suivi-accompagnement:create', UPLOAD_MEDICAL_REPORT: 'acte-medical-pecmu:create', UPLOAD_CLOSURE_FORM: 'fiche-pecmu:update',
  CLOSE_CASE: 'fiche-pecmu:update', RECORD_POST_PECMU_ORIENTATIONS: 'fiche-pecmu:update',
};
export function canPerform(state: WorkflowSnapshot, action: string, permissions: string[] | null) {
  return state.nextActions.includes(action) && (permissions === null || permissions.includes(actionPermissions[action]));
}
// Only consume explicit permission claims. If the SSO does not expose them here,
// nextActions controls presentation and every request is still authorized by the API.
export function getPecmuPermissions(): string[] | null {
  if (typeof window === 'undefined') return null;
  try {
    for (const key of ['auth', 'usr']) {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      const list = Array.isArray(value) ? value : value?.permissions;
      if (Array.isArray(list) && list.every(p => typeof p === 'string')) return list;
    }
  } catch { /* Missing SSO claims are not inferred from role names. */ }
  return null;
}
export type WorkflowTab = 'identity' | 'certification' | 'decision' | 'consents' | 'care' | 'followups' | 'closure' | 'orientations' | 'history';
export function activeWorkflowTab(status: WorkflowStatus): WorkflowTab {
  if (['CERTIFICATION_PENDING', 'NOT_CERTIFIED'].includes(status)) return 'certification';
  if (['MEDICAL_DECISION_PENDING', 'NOT_ELIGIBLE'].includes(status)) return 'decision';
  if (['CONSENT_PENDING', 'CONSENT_REFUSED'].includes(status)) return 'consents';
  if (['CLOSURE_PENDING', 'LOST_TO_FOLLOW_UP'].includes(status)) return 'closure';
  if (status === 'CLOSED') return 'orientations';
  return 'care';
}
