'use client';

import { extractUploadedFileLink } from '../../utils/uploadResponse';
import { authenticatedFetch } from '../../utils/authFetch';
import type { FichePecmu, PecmuAccess, PecmuFetcher, SuiviAccompagnement } from './pecmuApi';

export type WorkflowStatus = 'CERTIFICATION_PENDING' | 'MEDICAL_DECISION_PENDING' | 'NOT_CERTIFIED' | 'CONSENT_PENDING' | 'NOT_ELIGIBLE' | 'CONSENT_REFUSED' | 'READY_FOR_CARE' | 'IN_CARE' | 'TRANSFERRED' | 'CLOSURE_PENDING' | 'LOST_TO_FOLLOW_UP' | 'CLOSED';
export const statusLabels: Record<WorkflowStatus, string> = {
  CERTIFICATION_PENDING: 'Certification en attente', MEDICAL_DECISION_PENDING: 'Décision médicale en attente',
  NOT_CERTIFIED: 'Alerte non certifiée', CONSENT_PENDING: 'Consentement en attente', NOT_ELIGIBLE: 'Dossier non éligible',
  CONSENT_REFUSED: 'Consentement refusé', READY_FOR_CARE: 'Prêt pour la prise en charge', IN_CARE: 'En cours de soins',
  TRANSFERRED: 'Transféré', CLOSURE_PENDING: 'Clôture en attente', LOST_TO_FOLLOW_UP: 'Perdu de vue', CLOSED: 'Clôturé',
};
export const consentTypes = {
  MEDICAL_CARE: 'Consentement à la prise en charge médicale', MEDICAL_TRANSFER: 'Consentement au transfert médical',
  MEDICAL_ACT: 'Consentement à l’acte médical', PSYCHOLOGICAL_CARE: 'Consentement à la prise en charge psychologique',
  PSYCHOLOGICAL_ACT: 'Consentement à l’acte psychologique', REFUSAL: 'Formulaire de refus', OTHER: 'Autre consentement',
};
export const outcomeLabels = { STABILIZED_OR_CURED: 'Stabilisé/guéri', DECEASED: 'Décédé', TRANSFERRED: 'Transféré à un niveau supérieur', LOST_TO_FOLLOW_UP: 'Perdu de vue' };
export const medicalDocumentTypes = { INVOICE: 'Facture', MEDICAL_REPORT: 'Rapport médical', DEATH_CERTIFICATE: 'Certificat de décès', TRANSFER_NOTE: 'Note de transfert', OTHER: 'Autre document médical' };
export type FileMetadata = { id?: number | string; type?: string; documentType?: string; originalName?: string; filename?: string; mimeType?: string; size?: number; url?: string; src?: string; file?: string; path?: string };
export type WorkflowConsent = FileMetadata & { id: number; agent: string; consentType: keyof typeof consentTypes; consentStatus: 'SIGNED' | 'REFUSED'; consentDate?: string; notes?: string; file?: unknown; isActive?: boolean };
export type MedicalCare = {
  id: number; fichePecmuId: number; sequenceNumber: number; previousCareId?: number; admissionType?: 'STANDARD' | 'TRANSFER' | 'READMISSION';
  careMode?: 'OUTPATIENT' | 'HOSPITALIZATION'; careDate?: string; hospitalizationStartDate?: string; hospitalizationEndDate?: string;
  supervisorName?: string; careStructureName?: string; careProvince?: string; treatingDoctorName?: string; treatingDoctorPhone?: string;
  careHealthZone?: string; complaints?: string; diagnosis?: string; treatmentReceived?: string; bilanParaclinique?: string; appointmentDate1?: string; appointmentComment1?: string; appointmentDate2?: string; appointmentComment2?: string; appointmentDate3?: string; appointmentComment3?: string;
  cout?: number; observation?: string; partenaireNom?: string; partenaireTitre?: string;
  outcome?: keyof typeof outcomeLabels; outcomeDate?: string; transferStructureName?: string; transferProvince?: string; transferHealthZone?: string; transferNotes?: string;
  documents?: FileMetadata[]; examens?: FileMetadata[]; createdAt?: string;
};
export type WorkflowSnapshot = {
  access?: PecmuAccess;
  medicalDecision?: { eligible?: boolean; comment?: string; decisionMakerName?: string; decisionMakerFunction?: string; decisionDate?: string };
  certification?: { certified?: boolean; certificationFile?: string };
  fiche: FichePecmu & { documents?: FileMetadata[] };
  consents: WorkflowConsent[]; medicalCare: MedicalCare[]; followUps: SuiviAccompagnement[];
  currentStatus: WorkflowStatus; nextActions: string[];
  psychologicalCare?: PsychologicalCare | null;
  history?: Array<{ id?: string | number; action?: string; status?: string; createdAt?: string; comment?: string }>;
};
export type PsychologicalCare = {
  id: number; fichePecmuId: number; status?: string; supervisorName?: string; complaints?: string;
  initialEvaluation?: string; diagnosticHypothesis?: string; therapiesReceived?: string; therapyCount?: number;
  therapySessions?: Array<{ id?: number; date?: string; therapy?: string; notes?: string; agent?: string }>;
  homeVisits?: Array<{ id?: number; date?: string; observations?: string; agent?: string }>;
  report?: (FileMetadata & { downloadUrl?: string }) | string | null; reportFile?: string; reportName?: string; postTherapyEvaluation?: string;
  closureDate?: string; closureNotes?: string; isClosed?: boolean; [key: string]: any;
};
export function canEditPecmuWorkflow(state: WorkflowSnapshot | null): boolean {
  return state !== null && state.access?.canEdit !== false && state.fiche.access?.canEdit !== false;
}
export type SupervisorOption = { value: string; label: string };
export class PecmuApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public responseBody?: unknown,
    public responseText?: string,
  ) { super(message); this.name = 'PecmuApiError'; }
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
    throw new PecmuApiError(response.status, body?.code || 'PECMU_REQUEST_FAILED', message || `La requête PECMU a échoué (${response.status}).`, body, body === undefined ? text : undefined);
  }
  return body;
};
export async function loadPecmuWorkflow(fetcher: PecmuFetcher, id: number): Promise<WorkflowSnapshot> {
  const result = await fetcher(`/fiche-pecmu/${id}/workflow`);
  const state = result?.data?.fiche ? result.data : result;
  if (state?.access?.canRead === false || state?.fiche?.access?.canRead === false) {
    throw new PecmuApiError(403, 'RESOURCE_OUT_OF_SCOPE', 'Vous n’avez pas accès à ce dossier.');
  }
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
const invoiceRequestKeys = new WeakMap<File, string>();

export async function createPecmuCareEpisode(fetcher: PecmuFetcher, payload: Record<string, unknown>, requestId: string) {
  return fetcher('/acte-medical-pecmu', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': requestId },
    body: JSON.stringify(payload),
  });
}

export async function uploadPecmuFile(fetcher: PecmuFetcher, path: string, file: File) {
  validatePecmuFile(file);
  const form = new FormData(); form.append('file', file);
  if (path.endsWith('/documents/INVOICE')) {
    const key = invoiceRequestKeys.get(file) || crypto.randomUUID();
    invoiceRequestKeys.set(file, key);
    return fetcher(path, { method: 'POST', headers: { 'Idempotency-Key': key }, body: form });
  }
  return fetcher(path, { method: 'POST', body: form });
}
export async function uploadCareInvoices(fetcher: PecmuFetcher, careId: number, invoices: File[], uploaded: WeakSet<File>) {
  for (const file of invoices) {
    if (uploaded.has(file)) continue;
    try {
      await uploadPecmuFile(fetcher, `/acte-medical-pecmu/${careId}/documents/INVOICE`, file);
      uploaded.add(file);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Envoi impossible.';
      throw new Error(`Facture « ${file.name} » de la prise en charge #${careId} : ${reason}`);
    }
  }
}

export async function uploadCertificationNote(fetcher: PecmuFetcher, file: File): Promise<string> {
  const response = await uploadPecmuFile(fetcher, '/minio/files/upload', file);
  const url = extractUploadedFileLink(response);
  if (!url || !/^https?:\/\//i.test(url)) throw new Error('MinIO n’a pas retourné l’URL de la note de certification.');
  return url;
}
export async function certifyPecmuAlert(fetcher: PecmuFetcher, id: number, certified: boolean, certificationFile?: string) {
  if (certified && !certificationFile?.trim()) throw new Error('Ajoutez la note de certification avant de certifier l’alerte.');
  return workflowJson(fetcher, `/fiche-pecmu/${id}/certification`, certified
    ? { certified: true, certificationFile }
    : { certified: false });
}
export async function getMedicalSupervisorOptions(fetcher: PecmuFetcher): Promise<{ data: SupervisorOption[]; other: SupervisorOption & { requiresSpecification?: boolean } }> {
  const response = await fetcher('/acte-medical-pecmu/supervisors/options');
  const payload = response?.data?.data ? response.data : response;
  return {
    data: Array.isArray(payload?.data) ? payload.data.filter((item: any) => typeof item?.value === 'string' && typeof item?.label === 'string') : [],
    other: payload?.other && typeof payload.other.value === 'string'
      ? payload.other
      : { value: 'OTHER', label: 'Autre à préciser', requiresSpecification: true },
  };
}

const psychologicalBase = '/prise-en-charge-psychologique-pecmu';
export async function getPsychologicalCare(fetcher: PecmuFetcher, ficheId: number): Promise<PsychologicalCare> {
  const response = await fetcher(`${psychologicalBase}/by-fiche/${ficheId}`);
  return (response?.data ?? response) as PsychologicalCare;
}
export async function createPsychologicalCare(fetcher: PecmuFetcher, payload: Record<string, unknown>) {
  return fetcher(psychologicalBase, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}
export async function updatePsychologicalCare(fetcher: PecmuFetcher, id: number, payload: Record<string, unknown>) {
  return fetcher(`${psychologicalBase}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}
export async function addPsychologicalTherapySession(fetcher: PecmuFetcher, id: number, payload: Record<string, unknown>) {
  return fetcher(`${psychologicalBase}/${id}/therapy-sessions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}
export async function addPsychologicalHomeVisit(fetcher: PecmuFetcher, id: number, payload: Record<string, unknown>) {
  return fetcher(`${psychologicalBase}/${id}/home-visits`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}
export async function uploadPsychologicalReport(fetcher: PecmuFetcher, id: number, file: File) {
  return uploadPecmuFile(fetcher, `${psychologicalBase}/${id}/report`, file);
}
export async function closePsychologicalCare(fetcher: PecmuFetcher, id: number, payload: Record<string, unknown>) {
  return fetcher(`${psychologicalBase}/${id}/close`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}
export const actionPermissions: Record<string, string> = {
  UPLOAD_CERTIFICATION_NOTE: 'fiche-pecmu:update', CERTIFY_ALERT: 'fiche-pecmu:update', RECORD_MEDICAL_DECISION: 'fiche-pecmu:update',
  RECORD_CONSENT: 'acte-consentement-pecmu:create', OPEN_MEDICAL_CARE: 'acte-medical-pecmu:create', UPDATE_MEDICAL_CARE: 'acte-medical-pecmu:update',
  UPLOAD_MEDICAL_DOCUMENT: 'acte-medical-pecmu:create', UPLOAD_TRANSFER_NOTE: 'acte-medical-pecmu:create', OPEN_TRANSFERRED_MEDICAL_CARE: 'acte-medical-pecmu:create',
  CONTINUE_FOLLOW_UP: 'suivi-accompagnement:create', UPLOAD_MEDICAL_REPORT: 'acte-medical-pecmu:create', UPLOAD_CLOSURE_FORM: 'fiche-pecmu:update',
  CLOSE_CASE: 'fiche-pecmu:update', RECORD_POST_PECMU_ORIENTATIONS: 'fiche-pecmu:update',
  OPEN_PSYCHOLOGICAL_CARE: 'prise-en-charge-psychologique-pecmu:create',
  OPEN_OR_UPDATE_PSYCHOLOGICAL_CARE: 'prise-en-charge-psychologique-pecmu:update',
  CLOSE_PSYCHOLOGICAL_CARE_IF_OPEN: 'prise-en-charge-psychologique-pecmu:update',
};
export function canPerform(state: WorkflowSnapshot, action: string, permissions: string[] | null) {
  const permission = actionPermissions[action];
  return state.nextActions.includes(action) && Boolean(permission && permissions?.includes(permission));
}
// Only consume explicit permission claims; never infer privileges from a role label.
export function getPecmuPermissions(): string[] | null {
  if (typeof window === 'undefined') return null;
  const collect = (value: any, depth = 0): string[] | null => {
    if (!value || depth > 4 || typeof value !== 'object') return null;
    if (Array.isArray(value)) {
      const strings = value.filter((entry): entry is string => typeof entry === 'string');
      if (strings.length === value.length) return strings;
      const nested = value.flatMap(entry => collect(entry, depth + 1) || []);
      return nested.length ? nested : null;
    }
    for (const key of ['permissions', 'permissionList', 'privileges', 'perms']) {
      if (Array.isArray(value[key])) {
        const list = value[key].map((entry: any) => typeof entry === 'string' ? entry : entry?.name ?? entry?.code ?? entry?.permission).filter((entry: unknown): entry is string => typeof entry === 'string');
        if (list.length) return list;
      }
    }
    for (const key of ['data', 'user', 'usr', 'auth', 'apps', 'access', 'claims']) {
      const nested = collect(value[key], depth + 1);
      if (nested) return nested;
    }
    return null;
  };
  try {
    for (const key of ['auth', 'usr', 'apps']) {
      const list = collect(JSON.parse(localStorage.getItem(key) || 'null'));
      if (list) return list;
    }
    const token = localStorage.getItem('token');
    if (token) {
      const claims = token.split('.')[1];
      if (claims) {
        const decoded = JSON.parse(atob(claims.replace(/-/g, '+').replace(/_/g, '/')));
        return collect(decoded) || [];
      }
    }
  } catch { /* Missing SSO claims are treated as no granted permissions. */ }
  return null;
}
export type WorkflowTab = 'identity' | 'certification' | 'decision' | 'consents' | 'care' | 'psychological' | 'followups' | 'closure' | 'orientations' | 'history' | 'readmission';
export function isWorkflowTabAvailable(_status: WorkflowStatus, _tab: WorkflowTab): boolean {
  // The backend owns authorization and stage-transition validation. Keep every tab accessible.
  return true;
}
export function activeWorkflowTab(status: WorkflowStatus): WorkflowTab {
  if (['CERTIFICATION_PENDING', 'NOT_CERTIFIED'].includes(status)) return 'certification';
  if (['MEDICAL_DECISION_PENDING', 'NOT_ELIGIBLE'].includes(status)) return 'decision';
  if (['CONSENT_PENDING', 'CONSENT_REFUSED'].includes(status)) return 'consents';
  if (['CLOSURE_PENDING', 'LOST_TO_FOLLOW_UP'].includes(status)) return 'closure';
  if (status === 'CLOSED') return 'orientations';
  return 'care';
}
