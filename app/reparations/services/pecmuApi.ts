"use client";

import { statusLabels, type WorkflowStatus } from './pecmuWorkflowApi';
import { readAlertSources, cleanAlertSources, type AlertSource } from './pecmuAlertSources';
import { normalizeApiList } from '../utils/mentionStats';

export type PecmuFetcher = (url: string, options?: RequestInit) => Promise<any>;

export type PecmuPageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PecmuFilterRule = {
  field: string;
  operator: string;
  value: string;
};

export type PecmuAccess = { canRead: boolean; canEdit: boolean };

export type FichePecmu = {
  access?: PecmuAccess;
  workflowStatus?: WorkflowStatus;
  status?: string | null;
  id: number;
  victimeId?: number;
  victimId?: number;
  victimName?: string;
  age?: number;
  sex?: string;
  province?: string;
  locality?: string;
  victimAddress?: string;
  victimPhone?: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  careStructureName?: string;
  healthZone?: string;
  healthArea?: string;
  careStructureAddress?: string;
  doctorOrNurseContact?: string;
  alertSources?: AlertSource[];
  alertSourceFullName?: string;
  alertSourceStructureName?: string;
  alertSourceStructureType?: string;
  alertSourceOtherStructureType?: string | null;
  alertSourcePhone?: string;
  alertSourceRelationship?: string;
  alertSourceAddress?: string;
  violationType?: string;
  incidentDetails?: string;
  incidentPeriod?: string;
  affectedBodyParts?: string;
  medicalStatus?: string;
  vitalPrognosis?: string;
  highFever?: boolean;
  comaOrLossOfConsciousness?: boolean;
  convulsions?: boolean;
  extremeFatigue?: boolean;
  hypertension?: boolean;
  hyperglycemia?: boolean;
  bleeding?: boolean;
  wounds?: boolean;
  breathingDifficulty?: boolean;
  severeDiarrhea?: boolean;
  vomiting?: boolean;
  otherComplaints?: string;
  incidentCertification?: boolean;
  victimIdentification?: boolean;
  certificationNote?: string;
  certificationFile?: string;
  certification?: { certified?: boolean; certificationFile?: string };
  validatorName?: string;
  validatorRole?: string;
  validatorSignature?: string;
  pecmuDecision?: string;
  referralDecision?: string;
  partnerNameAndAddress?: string;
  requiredTiming?: string;
  medicalCareToPlan?: string;
  urgentMedicalReferralRequired?: boolean;
  comments?: string;
  responsibleNameAndSignature?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  [key: string]: any;
};

export type ActeMedicalPecmu = {
  id: number;
  rapportMedical?: string;
  cout?: number | string;
  observation?: string;
  partenaireNom?: string;
  partenaireTitre?: string;
  examens?: Array<{ filename: string; file: string }>;
  fichePecmuId?: number;
  createdAt?: string;
  isActive?: boolean;
};

export type ActeConsentementPecmu = {
  id: number;
  filename: string;
  file: string;
  agent: string;
  fichePecmuId: number;
  createdAt?: string;
  isActive?: boolean;
};

export type SuiviAccompagnement = {
  id: number;
  avis: string;
  dateProchainRdv?: string;
  fichePecmuId: number;
  createdAt?: string;
  isActive?: boolean;
};

export type PecmuStatistics = {
  total?: number;
  submitted?: number;
  drafts?: number;
  certified?: number;
  notCertified?: number;
  eligible?: number;
  notEligible?: number;
  treated?: number;
  hospitalized?: number;
  nonHospitalized?: number;
  stabilizedOrCured?: number;
  deceased?: number;
  transferred?: number;
  lostToFollowUp?: number;
  closed?: number;
  orientedToOtherPrograms?: number;
  bySex?: Record<string, number>;
  byProvince?: Record<string, number>;
  byMedicalStatus?: Record<string, number>;
  byViolationType?: Record<string, number>;
  urgentCases?: number;
  [key: string]: any;
};

const fieldParamMap: Record<string, string> = {
  structurePriseEnCharge: 'careStructureName',
  province: 'province',
  territoire: 'locality',
  age: 'age',
  sexe: 'sex',
  status: 'medicalStatus',
  nom: 'victimName',
};

const symptomMap: Record<string, keyof FichePecmu> = {
  'Forte fièvre': 'highFever',
  'Coma / perte de connaissance': 'comaOrLossOfConsciousness',
  Convulsions: 'convulsions',
  'Fatigue intense': 'extremeFatigue',
  'Tension élevée / hypertension': 'hypertension',
  'Taux de sucre élevé / hyperglycémie': 'hyperglycemia',
  Saignement: 'bleeding',
  'Présence des plaies': 'wounds',
  'Difficulté à respirer': 'breathingDifficulty',
  'Diarrhée ++ / déshydratation sévère': 'severeDiarrhea',
  'Vomissement / déshydratation sévère': 'vomiting',
};

const toBoolean = (value: unknown): boolean | undefined => {
  if (value === true || value === 'true' || value === 'Oui') return true;
  if (value === false || value === 'false' || value === 'Non') return false;
  return undefined;
};

const toOptionalNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const compactPayload = <T extends Record<string, any>>(payload: T): Partial<T> => (
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== '')
  ) as Partial<T>
);

export const normalizePecmuMeta = (payload: any, fallback: PecmuPageMeta, rowsLength: number): PecmuPageMeta => {
  const meta = payload?.meta ?? payload?.data?.meta ?? payload ?? {};
  const total = Number(meta.total ?? payload?.total ?? rowsLength);
  const limit = Number(meta.limit ?? fallback.limit);
  const page = Number(meta.page ?? fallback.page);
  const totalPages = Number(meta.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, limit))));

  return {
    page: Number.isFinite(page) && page > 0 ? page : fallback.page,
    limit: Number.isFinite(limit) && limit > 0 ? limit : fallback.limit,
    total: Number.isFinite(total) ? total : rowsLength,
    totalPages: Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1,
    hasNextPage: Boolean(meta.hasNextPage ?? page < totalPages),
    hasPreviousPage: Boolean(meta.hasPreviousPage ?? page > 1),
  };
};

export const buildFichePecmuQuery = (params: {
  page: number;
  limit: number;
  search?: string;
  filters?: PecmuFilterRule[];
}): string => {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });

  const search = params.search?.trim();
  if (search) query.set('victimName', search);

  params.filters?.forEach((rule) => {
    if (!rule.value) return;
    const apiField = fieldParamMap[rule.field] || rule.field;

    if (apiField === 'age' && rule.operator === 'gt') {
      query.set('ageMin', rule.value);
      return;
    }

    if (apiField === 'age' && rule.operator === 'lt') {
      query.set('ageMax', rule.value);
      return;
    }

    query.set(apiField, rule.value);
  });

  return query.toString();
};

export const mapFichePecmuToVictimRow = (fiche: FichePecmu) => ({
  id: Number(fiche.victimeId ?? fiche.victimId ?? (fiche as any).victime?.id) || fiche.id,
  pecmuFicheId: fiche.id,
  masterVictimId: Number(fiche.victimeId ?? fiche.victimId ?? (fiche as any).victime?.id) || undefined,
  nom: fiche.victimName || `Fiche PECMU #${fiche.id}`,
  age: fiche.age,
  sexe: fiche.sex,
  province: fiche.province,
  territoire: fiche.locality,
  adresse: fiche.victimAddress,
  status: fiche.status === 'BROUILLON' ? 'Brouillon' : fiche.workflowStatus ? statusLabels[fiche.workflowStatus] || fiche.workflowStatus : fiche.medicalStatus || '-',
  workflowStatus: fiche.workflowStatus,
  mention: 'PECMU',
  reference: `PECMU-${fiche.id}`,
  structurePriseEnCharge: fiche.careStructureName,
  partenairePriseEnCharge: fiche.partnerNameAndAddress,
  rawPecmuFiche: fiche,
});

export const mapF2ValuesToFichePecmuPayload = (values: Record<string, string>, preserveEmpty = false, sources = readAlertSources(values)): Partial<FichePecmu> => {
  const payload: Partial<FichePecmu> = {
    victimName: values.nomVictime,
    age: values.age === '' && preserveEmpty ? null as any : toOptionalNumber(values.age),
    sex: values.sexe,
    province: values.province,
    locality: values.localite,
    victimAddress: values.adresseVictime,
    victimPhone: values.telephoneVictime,
    emergencyContactName: values.contactUrgenceNom,
    emergencyContactRelationship: values.contactUrgenceLien,
    emergencyContactPhone: values.contactUrgenceTelephone,
    careStructureName: values.structureNom,
    healthZone: values.zoneSante,
    healthArea: values.aireSante,
    careStructureAddress: values.adresseStructure,
    doctorOrNurseContact: values.contactMedecin,
    alertSources: cleanAlertSources(sources),
    violationType: values.typeViolation,
    incidentDetails: values.detailsIncident,
    incidentPeriod: values.periodeIncident,
    affectedBodyParts: values.partiesCorps,
    medicalStatus: values.statutMedical,
    vitalPrognosis: values.pronosticVital,
    otherComplaints: values.autresPlaintes || values.plaintes,
    victimIdentification: toBoolean(values.identificationVictime),
    validatorName: values.validationNom,
    validatorRole: values.validationFonction,
    referralDecision: values.decision,
    partnerNameAndAddress: values.partenaireDecision,
    requiredTiming: values.timingReferencement,
    medicalCareToPlan: values.priseEnChargePlanifier,
    urgentMedicalReferralRequired: toBoolean(values.referencementUrgent),
    comments: values.commentaires,
    responsibleNameAndSignature: values.responsable,
  };

  Object.entries(symptomMap).forEach(([label, apiField]) => {
    const value = toBoolean(values[`plainte_${label}`]);
    if (value !== undefined) {
      (payload as Record<string, any>)[apiField] = value;
    }
  });

  return preserveEmpty ? payload : compactPayload(payload);
};

export const mapFichePecmuToF2Values = (fiche: FichePecmu): Record<string, string> => {
  const yesNo = (value: unknown) => value === true ? 'Oui' : value === false ? 'Non' : '';
  const values: Record<string, string> = {
    nomVictime: fiche.victimName || '',
    age: fiche.age == null ? '' : String(fiche.age),
    sexe: fiche.sex || '',
    province: fiche.province || '',
    localite: fiche.locality || '',
    adresseVictime: fiche.victimAddress || '',
    telephoneVictime: fiche.victimPhone || '',
    contactUrgenceNom: fiche.emergencyContactName || '',
    contactUrgenceLien: fiche.emergencyContactRelationship || '',
    contactUrgenceTelephone: fiche.emergencyContactPhone || '',
    structureNom: fiche.careStructureName || '',
    zoneSante: fiche.healthZone || '',
    aireSante: fiche.healthArea || '',
    adresseStructure: fiche.careStructureAddress || '',
    contactMedecin: fiche.doctorOrNurseContact || '',
    typeViolation: fiche.violationType || '',
    detailsIncident: fiche.incidentDetails || '',
    periodeIncident: fiche.incidentPeriod || '',
    partiesCorps: fiche.affectedBodyParts || '',
    statutMedical: fiche.medicalStatus || '',
    pronosticVital: fiche.vitalPrognosis || '',
    autresPlaintes: fiche.otherComplaints || '',
    identificationVictime: yesNo(fiche.victimIdentification),
    validationNom: fiche.validatorName || '',
    validationFonction: fiche.validatorRole || '',
    decision: fiche.referralDecision || '',
    partenaireDecision: fiche.partnerNameAndAddress || '',
    timingReferencement: fiche.requiredTiming || '',
    priseEnChargePlanifier: fiche.medicalCareToPlan || '',
    referencementUrgent: yesNo(fiche.urgentMedicalReferralRequired),
    commentaires: fiche.comments || '',
    responsable: fiche.responsibleNameAndSignature || '',
  };

  Object.entries(symptomMap).forEach(([label, apiField]) => {
    values[`plainte_${label}`] = yesNo(fiche[apiField]);
  });
  return values;
};

export const listFichesPecmu = async (
  fetcher: PecmuFetcher,
  params: { page: number; limit: number; search?: string; filters?: PecmuFilterRule[] }
) => {
  const query = buildFichePecmuQuery(params);
  const response = await fetcher(`/fiche-pecmu?${query}`);
  if (!response) return null;

  const rows = normalizeApiList(response)
    .filter((item: FichePecmu) => item.access?.canRead !== false)
    .map((item: FichePecmu) => mapFichePecmuToVictimRow(item));
  return {
    response,
    rows,
    meta: normalizePecmuMeta(response, {
      page: params.page,
      limit: params.limit,
      total: rows.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: params.page > 1,
    }, rows.length),
  };
};

export const createFichePecmu = async (fetcher: PecmuFetcher, values: Record<string, string>, victimId?: number, options: { status?: 'BROUILLON'; sources?: AlertSource[]; confirmDuplicate?: boolean } = {}) => {
  const { status, sources, confirmDuplicate } = options;
  const payload = mapF2ValuesToFichePecmuPayload(values, false, sources);
  if (status) (payload as Record<string, unknown>).status = status;
  if (victimId) {
    for (const key of ['victimName', 'age', 'sex', 'province', 'locality', 'victimAddress', 'victimPhone'] as const) delete payload[key];
    (payload as Record<string, unknown>).victimeId = victimId;
  }
  const response = await fetcher('/fiche-pecmu', {
    method: 'POST',
    headers: ficheSubmissionHeaders(confirmDuplicate),
    body: JSON.stringify(payload),
  });

  const created = response?.data ?? response;
  if (!Number.isInteger(created?.id) || created.id <= 0) {
    throw new Error("Le serveur n’a pas confirmé l’identifiant de la fiche. Vérifiez la liste avant de réessayer.");
  }
  return created as FichePecmu;
};

export const listFichesPecmuByVictim = async (fetcher: PecmuFetcher, victimId: number): Promise<FichePecmu[]> => {
  const response = await fetcher(`/fiche-pecmu/by-victime/${victimId}`);
  return normalizeApiList(response).filter((item: FichePecmu) => item.access?.canRead !== false);
};

export const searchMasterVictims = async (fetcher: PecmuFetcher, search: string): Promise<any[]> => {
  const params = new URLSearchParams({ page: '1', limit: '20', nom: search });
  const response = await fetcher(`/victime/paginate/filtered?${params.toString()}`);
  return normalizeApiList(response);
};

const requireResponse = <T,>(response: T | null | undefined, message: string): T => {
  if (!response) throw new Error(message);
  return response;
};

export const getFichePecmu = async (fetcher: PecmuFetcher, id: number): Promise<FichePecmu> => (
  requireResponse(await fetcher(`/fiche-pecmu/${id}`), 'Impossible de charger la fiche PECMU.')
);

export const updateFichePecmu = async (fetcher: PecmuFetcher, id: number, payload: Partial<FichePecmu>, preserveEmpty = false): Promise<FichePecmu> => {
  if (['incidentCertification', 'consentement', 'certificationNote', 'pecmuDecision'].some(key => key in payload)) {
    throw new Error('Les champs du parcours doivent être modifiés via les actions dédiées du workflow PECMU.');
  }
  return (
  requireResponse(await fetcher(`/fiche-pecmu/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(preserveEmpty ? payload : compactPayload(payload)),
  }), 'Impossible de modifier la fiche PECMU.')
  );
};

const ficheSubmissionHeaders = (confirmDuplicate?: boolean): Record<string, string> =>
  confirmDuplicate ? { 'Content-Type': 'application/json', 'X-Confirm-Duplicate': 'true' } : { 'Content-Type': 'application/json' };

export const submitFichePecmu = async (fetcher: PecmuFetcher, id: number, confirmDuplicate = false): Promise<void> => {
  await fetcher(`/fiche-pecmu/${id}`, {
    method: 'PATCH',
    headers: ficheSubmissionHeaders(confirmDuplicate),
    body: JSON.stringify({ status: 'SOUMIS' }),
  });
};

export const deleteFichePecmu = async (fetcher: PecmuFetcher, id: number) => {
  await fetcher(`/fiche-pecmu/${id}`, { method: 'DELETE' });
};

export const listActesMedicauxByFiche = async (fetcher: PecmuFetcher, fichePecmuId: number): Promise<ActeMedicalPecmu[]> => {
  const response = await fetcher(`/acte-medical-pecmu/by-fiche/${fichePecmuId}`);
  return response ? normalizeApiList(response) : [];
};

export const createActeMedicalPecmu = async (fetcher: PecmuFetcher, payload: Omit<ActeMedicalPecmu, 'id'>) => (
  requireResponse(await fetcher('/acte-medical-pecmu', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  }), "Impossible d'enregistrer l'acte médical.")
);

export const updateActeMedicalPecmu = async (fetcher: PecmuFetcher, id: number, payload: Partial<ActeMedicalPecmu>) => (
  requireResponse(await fetcher(`/acte-medical-pecmu/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  }), "Impossible de modifier l'acte médical.")
);

export const deleteActeMedicalPecmu = async (fetcher: PecmuFetcher, id: number) => {
  await fetcher(`/acte-medical-pecmu/${id}`, { method: 'DELETE' });
};

export const listConsentementsByFiche = async (fetcher: PecmuFetcher, fichePecmuId: number): Promise<ActeConsentementPecmu[]> => {
  const response = await fetcher(`/acte-consentement-pecmu/by-fiche/${fichePecmuId}`);
  return response ? normalizeApiList(response) : [];
};

export const createConsentementPecmu = async (fetcher: PecmuFetcher, payload: Omit<ActeConsentementPecmu, 'id'>) => (
  requireResponse(await fetcher('/acte-consentement-pecmu', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  }), "Impossible d'enregistrer le consentement.")
);

export const updateConsentementPecmu = async (fetcher: PecmuFetcher, id: number, payload: Partial<ActeConsentementPecmu>) => (
  requireResponse(await fetcher(`/acte-consentement-pecmu/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  }), 'Impossible de modifier le consentement.')
);

export const deleteConsentementPecmu = async (fetcher: PecmuFetcher, id: number) => {
  await fetcher(`/acte-consentement-pecmu/${id}`, { method: 'DELETE' });
};

export const listSuivisByFiche = async (fetcher: PecmuFetcher, fichePecmuId: number): Promise<SuiviAccompagnement[]> => {
  const response = await fetcher(`/suivi-accompagnement/by-fiche/${fichePecmuId}`);
  return response ? normalizeApiList(response) : [];
};

export const createSuiviAccompagnement = async (fetcher: PecmuFetcher, payload: Omit<SuiviAccompagnement, 'id'>) => (
  requireResponse(await fetcher('/suivi-accompagnement', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  }), "Impossible d'enregistrer le suivi.")
);

export const updateSuiviAccompagnement = async (fetcher: PecmuFetcher, id: number, payload: Partial<SuiviAccompagnement>) => (
  requireResponse(await fetcher(`/suivi-accompagnement/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  }), 'Impossible de modifier le suivi.')
);

export const deleteSuiviAccompagnement = async (fetcher: PecmuFetcher, id: number) => {
  await fetcher(`/suivi-accompagnement/${id}`, { method: 'DELETE' });
};

export const getFichePecmuStatistics = async (fetcher: PecmuFetcher): Promise<PecmuStatistics | null> => {
  const response = await fetcher('/fiche-pecmu/statistics');
  return response?.data ?? response ?? null;
};

export const getActeConsentementPecmuStatistics = async (fetcher: PecmuFetcher): Promise<any | null> => (
  await fetcher('/acte-consentement-pecmu/statistics')
);

export const getActeMedicalPecmuStatistics = async (fetcher: PecmuFetcher): Promise<any | null> => (
  await fetcher('/acte-medical-pecmu/statistics')
);
