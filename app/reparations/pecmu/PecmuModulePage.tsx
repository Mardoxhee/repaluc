"use client";

import { rdcProvinces } from '../constants/provinces';
import { healthZonesByProvince } from '../constants/healthZonesByProvince';
import { allBodyParts } from '../constants/bodyParts';
import { spreadsheetPartners } from '../constants/spreadsheetPartners';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  Plus,
  Save,
  Search,
  Users,
  X,
} from 'lucide-react';
import { Modal, ModalBody } from 'flowbite-react';
import Swal from 'sweetalert2';
import { pecmuRequest, PecmuApiError, statusLabels } from '../services/pecmuWorkflowApi';
import { getVictimsFromCache, isOnline } from '../../utils/victimsCache';
import { deletePecmuDraft, getPecmuDraft, getPecmuDraftKey, savePecmuDraft } from '../../utils/pecmuDraftCache';
import { normalizeApiList, normalizeText } from '../utils/mentionStats';
import {
  createFichePecmu,
  mapFichePecmuToF2Values,
  mapF2ValuesToFichePecmuPayload,
  listActesMedicauxByFiche,
  listFichesPecmuByVictim,
  listFichesPecmu,
  updateFichePecmu,
  submitFichePecmu,
  type FichePecmu,
} from '../services/pecmuApi';
import { violationGroups, violationOptions } from '../constants/violations';
import { alertSourceLabel, readAlertSources, type AlertSource } from '../services/pecmuAlertSources';
import PecmuAlertSources from './PecmuAlertSources';
import YesNoToggle from './YesNoToggle';
import PecmuDossierModal from './PecmuDossierModal';
import type { CareMode } from './PecmuNewCareModal';
import PecmuPartnersSettings from '../../reglages/PecmuPartnersSettings';
import PecmuVictimSearch, { masterVictimAge, masterVictimLocality, masterVictimName, type MasterVictim } from './PecmuVictimSearch';

type Victim = {
  id: number;
  nom?: string;
  prenom?: string;
  postnom?: string;
  codeUnique?: string;
  reference?: string;
  age?: number;
  dateNaissance?: string;
  sexe?: string;
  adresse?: string;
  province?: string;
  territoire?: string;
  commune?: string;
  village?: string;
  status?: string;
  categorie?: string;
  programme?: string;
  mention?: string;
  photo?: string | null;
  pecmuFicheId?: number;
  masterVictimId?: number;
  pecmuAlertCount?: number;
  pecmuFicheIds?: number[];
  variablesSpecifiques?: Record<string, string | null | undefined>;
  [key: string]: any;
};

type CarePartner = { id: number; nom?: string; structure?: string; province?: string; territoire?: string; zoneSante?: string; healthZone?: string };
const alphabeticBodyParts = [...allBodyParts].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
const normalizePartnerText = (value: unknown) => normalizeText(value).replace(/[^a-z0-9]/g, '');
const partnerLookupKey = (partner: CarePartner) => [partner.nom || partner.structure, partner.province, partner.territoire, partner.zoneSante || partner.healthZone]
  .map(normalizePartnerText).join('|');

type PageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type PecmuAlert = {
  id: string;
  victimId: number | null;
  patientName: string;
  province: string;
  priority: string;
  motif: string;
  createdAt: string;
  values: Record<string, string>;
};

type MedicalAct = {
  id: string;
  victimId: number;
  date: string;
  acte: string;
  partenaire: string;
  diagnostic: string;
  prescription: string;
  statut: string;
  observation: string;
};

type FieldType = 'text' | 'number' | 'date' | 'textarea' | 'select';

type FormField = {
  key: string;
  label: string;
  type?: FieldType;
  options?: string[];
  required?: boolean;
};

type FilterRule = {
  id: string;
  field: string;
  operator: string;
  value: string;
};

type FilterField = {
  key: string;
  label: string;
  type: FieldType | 'number';
  options?: string[];
};

const ALERTS_STORAGE_KEY = 'pecmu-alertes-v1';
const ACTS_STORAGE_KEY = 'pecmu-actes-medicaux-v1';



const emptyMeta: PageMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

const f2Sections: Array<{ title: string; fields: FormField[] }> = [
  {
    title: 'Identité et localisation de la victime',
    fields: [
      { key: 'nomVictime', label: 'Nom de la victime' },
      { key: 'age', label: 'Âge (années)', type: 'number' },
      { key: 'sexe', label: 'Sexe', type: 'select', options: ['Féminin', 'Masculin', 'Autre'] },
      { key: 'province', label: 'Province', type: 'select', options: rdcProvinces },
      { key: 'localite', label: 'Localité / ville' },
      { key: 'adresseVictime', label: 'Adresse de la victime', type: 'textarea' },
      { key: 'telephoneVictime', label: 'Contacts de la victime (si existant)' },
    ],
  },
  {
    title: 'Contact d’urgence',
    fields: [
      { key: 'contactUrgenceNom', label: 'Nom' },
      { key: 'contactUrgenceLien', label: 'Lien de parenté' },
      { key: 'contactUrgenceTelephone', label: 'Téléphone' },
    ],
  },
  {
    title: 'Structure de prise en charge',
    fields: [
      { key: 'zoneSante', label: 'Zone de santé' },
      { key: 'structureNom', label: 'Nom de la structure qui prend en charge', required: true },
      { key: 'aireSante', label: 'Aire de santé' },
      { key: 'adresseStructure', label: 'Adresse de la structure où elle est suivie', type: 'textarea' },
      { key: 'contactMedecin', label: 'Contact du médecin ou infirmier' },
    ],
  },
  {
    title: 'Sources de l’alerte',
    fields: [{ key: 'alertSources', label: 'Sources de l’alerte' }],
  },
  {
    title: 'Situation médicale de la victime',
    fields: [
      { key: 'typeViolation', label: 'Type de violation subie', type: 'select' },
      { key: 'detailsIncident', label: 'Détails de l’incident', type: 'textarea' },
      { key: 'periodeIncident', label: 'Période / dates' },
      { key: 'partiesCorps', label: 'Parties du corps atteintes', type: 'textarea' },
      { key: 'statutMedical', label: 'Statut médical', type: 'select', options: ['Était déjà traité', 'Rien n’est fait', 'Traitement en cours'] },
      { key: 'autresPlaintes', label: 'Autres plaintes', type: 'textarea' },
      { key: 'pronosticVital', label: 'Pronostic vital', type: 'select', options: ['Bon (normal)', 'Réservé (moyen)', 'Engagé (grave)'] },
    ],
  },
  {
    title: 'ORIENTATION SELON LA NOTE DE CERTIFICATION DEE',
    fields: [
      { key: 'identificationVictime', label: 'Identification de la victime', type: 'select', options: ['Oui', 'Non'] },
    ],
  },
];

const complaintFields = [
  'Forte fièvre',
  'Coma / perte de connaissance',
  'Convulsions',
  'Fatigue intense',
  'Tension élevée / hypertension',
  'Taux de sucre élevé / hyperglycémie',
  'Saignement',
  'Présence des plaies',
  'Difficulté à respirer',
  'Diarrhée ++ / déshydratation sévère',
  'Vomissement / déshydratation sévère',
];

const pecmuFilterFields: FilterField[] = [
  { key: 'workflowStatus', label: 'Étape du parcours', type: 'select', options: Object.keys(statusLabels) },
  { key: 'structurePriseEnCharge', label: 'Structure de prise en charge', type: 'text' },
  { key: 'province', label: 'Province', type: 'select', options: rdcProvinces },
  { key: 'territoire', label: 'Territoire / localité', type: 'text' },
  { key: 'age', label: 'Âge', type: 'number' },
  { key: 'sexe', label: 'Sexe', type: 'select', options: ['Féminin', 'Masculin', 'Autre'] },
  { key: 'status', label: 'Statut médical', type: 'text' },
  { key: 'nom', label: 'Nom', type: 'text' },
];

const filterOperators = [
  { key: 'equals', label: 'Égal à', types: ['text', 'select', 'number', 'date'] },
  { key: 'contains', label: 'Contient', types: ['text'] },
  { key: 'startsWith', label: 'Commence par', types: ['text'] },
  { key: 'gt', label: 'Supérieur à', types: ['number', 'date'] },
  { key: 'lt', label: 'Inférieur à', types: ['number', 'date'] },
];

const readStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const getVictimName = (victim?: Victim | null): string => {
  if (!victim) return '';
  const parts = [victim.prenom, victim.nom, victim.postnom].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : victim.nom || victim.reference || `Victime #${victim.id}`;
};

const isPecmuVictim = (victim: Victim): boolean => {
  const mention = normalizeText(victim?.mention);
  const status = normalizeText(victim?.status);
  const categorie = normalizeText(victim?.categorie);
  const programme = normalizeText(victim?.programme);

  return (
    mention === 'pecmu' ||
    status.includes('pecmu') ||
    status.includes('prise en charge medicale urgente') ||
    categorie.includes('pecmu') ||
    programme.includes('pecmu')
  );
};

async function withDuplicateConfirmation<T>(save: (confirmed: boolean) => Promise<T>): Promise<T | null> {
  try {
    return await save(false);
  } catch (error) {
    if (!(error instanceof PecmuApiError) || error.statusCode !== 409 || error.code !== 'PECMU_POSSIBLE_DUPLICATE') throw error;
    const body = error.responseBody as { matches?: Array<{ id: number }> } | undefined;
    const matches = Array.isArray(body?.matches) ? body.matches : [];
    const refs = matches.filter(item => Number.isInteger(item?.id)).map(item => '#' + item.id).join(', ');
    const result = await Swal.fire({
      icon: 'warning', title: 'Doublon possible',
      text: (refs ? 'Fiches similaires : ' + refs + '. ' : 'Une fiche similaire existe déjà. ') + 'Voulez-vous poursuivre la soumission ?',
      showCancelButton: true, confirmButtonText: 'Soumettre quand même', cancelButtonText: 'Revenir à la fiche',
      focusCancel: true, confirmButtonColor: '#901c67',
    });
    return result.isConfirmed ? save(true) : null;
  }
}

const buildF2Values = (victim?: Victim | null): Record<string, string> => {
  const values: Record<string, string> = {};
  f2Sections.forEach((section) => {
    section.fields.forEach((field) => {
      values[field.key] = field.options?.length === 2 && field.options.includes('Oui') && field.options.includes('Non') ? 'Non' : '';
    });
  });
  complaintFields.forEach((field) => {
    values[`plainte_${field}`] = 'Non';
  });

  if (victim) {
    values.nomVictime = getVictimName(victim);
    values.age = String(victim.age ?? victim.variablesSpecifiques?.AGE ?? '');
    values.sexe = victim.sexe || '';
    values.province = victim.province || '';
    values.localite = victim.village || victim.commune || victim.territoire || '';
    values.adresseVictime = victim.adresse || '';
    values.typeViolation = victim.typeViolation || '';
    values.detailsIncident = victim.lieuIncident || '';
    values.periodeIncident = victim.dateIncident || '';
  }

  return values;
};

const parseViolationSelection = (value?: string) => {
  const entries = (value || '').split(/\s*;\s*/).map(item => item.trim()).filter(Boolean);
  const selected = entries.filter(item => violationOptions.includes(item));
  const custom = entries.filter(item => !violationOptions.includes(item)).join('; ');
  return { selected, custom, other: Boolean(custom) };
};

const getFilterValue = (victim: Victim, field: string, victimAlerts: PecmuAlert[]): string => {
  const alertValues = victimAlerts.map((alert) => alert.values);

  if (field === 'structurePriseEnCharge') {
    return [
      victim.structurePriseEnCharge,
      victim.structureNom,
      victim.partenairePriseEnCharge,
      victim.partenaire,
      victim.variablesSpecifiques?.structurePriseEnCharge,
      victim.variablesSpecifiques?.structureNom,
      ...alertValues.map((values) => values.structureNom),
      ...alertValues.map((values) => values.partenaireDecision),
    ].filter(Boolean).join(' ');
  }

  if (field === 'nom') return getVictimName(victim);
  if (field === 'age') return String(victim.age ?? victim.variablesSpecifiques?.AGE ?? '');

  const directValue = victim[field];
  if (directValue !== undefined && directValue !== null) return String(directValue);

  const specificValue = victim.variablesSpecifiques?.[field];
  return specificValue !== undefined && specificValue !== null ? String(specificValue) : '';
};

const matchesFilterRule = (victim: Victim, rule: FilterRule, victimAlerts: PecmuAlert[]): boolean => {
  if (!rule.value) return true;

  const field = pecmuFilterFields.find((item) => item.key === rule.field);
  const rawValue = getFilterValue(victim, rule.field, victimAlerts);
  const expected = rule.value;

  if (field?.type === 'number') {
    const current = Number(rawValue);
    const target = Number(expected);
    if (!Number.isFinite(current) || !Number.isFinite(target)) return false;
    if (rule.operator === 'gt') return current > target;
    if (rule.operator === 'lt') return current < target;
    return current === target;
  }

  const currentText = normalizeText(rawValue);
  const expectedText = normalizeText(expected);

  if (rule.operator === 'contains') return currentText.includes(expectedText);
  if (rule.operator === 'startsWith') return currentText.startsWith(expectedText);
  return currentText === expectedText;
};

const PecmuModulePage: React.FC = () => {
  const fetcher = pecmuRequest;
  const [listError, setListError] = useState('');
  const [victims, setVictims] = useState<Victim[]>([]);
  const [meta, setMeta] = useState<PageMeta>(emptyMeta);
  const [loadingVictims, setLoadingVictims] = useState(true);
  const [usingCache, setUsingCache] = useState(false);
  const [query, setQuery] = useState('');
  const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);
  const [selectedVictim, setSelectedVictim] = useState<Victim | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [openDossierId, setOpenDossierId] = useState<number | null>(null);
  const [returnedDossier, setReturnedDossier] = useState<{ id: number; tab: 'readmission' | 'care'; mode?: CareMode } | null>(null);
  useEffect(() => {
    const url = new URL(window.location.href);
    const id = Number(url.searchParams.get('dossier'));
    if (!Number.isSafeInteger(id) || id <= 0) return;
    const mode = url.searchParams.get('soins');
    setReturnedDossier({
      id, tab: url.searchParams.get('etape') === 'readmission' ? 'readmission' : 'care',
      mode: mode === 'nouveau' || mode === 'transfert' || mode === 'readmission' ? mode : undefined,
    });
    setOpenDossierId(id);
    url.searchParams.delete('dossier');
    url.searchParams.delete('etape');
    url.searchParams.delete('soins');
    window.history.replaceState(window.history.state, '', url.toString());
  }, []);

  const [activeView, setActiveView] = useState<'victimes' | 'partenaires'>('victimes');
  const [alerts, setAlerts] = useState<PecmuAlert[]>([]);
  const [medicalActs, setMedicalActs] = useState<MedicalAct[]>([]);
  const [medicalActCounts, setMedicalActCounts] = useState<Record<number, number>>({});
  const [alertMasterVictim, setAlertMasterVictim] = useState<MasterVictim | null>(null);
  const [existingVictimAlerts, setExistingVictimAlerts] = useState<FichePecmu[]>([]);
  const [editingDraft, setEditingDraft] = useState<FichePecmu | null>(null);
  const [loadingVictimAlerts, setLoadingVictimAlerts] = useState(false);
  const [showVictimAlerts, setShowVictimAlerts] = useState(false);
  const [alertValues, setAlertValues] = useState<Record<string, string>>(() => buildF2Values(null));
  const [alertSources, setAlertSources] = useState<AlertSource[]>([]);
  const [carePartners, setCarePartners] = useState<CarePartner[]>(() => spreadsheetPartners.map((partner, index) => ({ ...partner, id: -(index + 1) })));
  const [incidentDateMode, setIncidentDateMode] = useState<'date' | 'period'>('date');
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentStartDate, setIncidentStartDate] = useState('');
  const [incidentEndDate, setIncidentEndDate] = useState('');
  const [submittingAlert, setSubmittingAlert] = useState(false);
  const [otherViolation, setOtherViolation] = useState(false);
  const [selectedViolations, setSelectedViolations] = useState<string[]>([]);
  const [customViolation, setCustomViolation] = useState('');
  const [localDraftKey, setLocalDraftKey] = useState('');
  const [localDraftStatus, setLocalDraftStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const draftBaseline = useRef('');
  const editHasLocalCopy = useRef(false);
  const draftFields = editingDraft
    ? JSON.stringify([alertValues, alertSources, selectedViolations, customViolation, otherViolation, incidentDateMode, incidentDate, incidentStartDate, incidentEndDate])
    : '';

  const groupFicheRows = (rows: Victim[]) => {
    const grouped = new Map<string, Victim>();
    rows.forEach(row => {
      const key = row.masterVictimId ? `victim:${row.masterVictimId}` : `fiche:${row.pecmuFicheId || row.id}`;
      const current = grouped.get(key);
      if (!current) grouped.set(key, { ...row, pecmuAlertCount: 1, pecmuFicheIds: row.pecmuFicheId ? [row.pecmuFicheId] : [] });
      else {
        current.pecmuAlertCount = (current.pecmuAlertCount || 1) + 1;
        if (row.pecmuFicheId && !current.pecmuFicheIds?.includes(row.pecmuFicheId)) current.pecmuFicheIds = [...(current.pecmuFicheIds || []), row.pecmuFicheId];
      }
    });
    return [...grouped.values()];
  };

  useEffect(() => {
    setAlerts(readStorage<PecmuAlert[]>(ALERTS_STORAGE_KEY, []));
    setMedicalActs(readStorage<MedicalAct[]>(ACTS_STORAGE_KEY, []));
  }, []);

  useEffect(() => {
    if (!showAlertModal || !localDraftKey || submittingAlert) return;
    if (editingDraft && draftBaseline.current === draftFields) {
      if (!editHasLocalCopy.current) return;
      editHasLocalCopy.current = false;
      let active = true;
      void deletePecmuDraft(localDraftKey).then(() => { if (active) setLocalDraftStatus('idle'); })
        .catch(() => { if (active) setLocalDraftStatus('error'); });
      return () => { active = false; };
    }
    if (editingDraft) editHasLocalCopy.current = true;
    let current = true;
    setLocalDraftStatus('saving');
    void savePecmuDraft(localDraftKey, {
      ...(editingDraft ? { serverBaseline: draftBaseline.current } : {}),
      alertValues, alertSources, selectedViolations, customViolation, otherViolation,
      incidentDateMode, incidentDate, incidentStartDate, incidentEndDate, alertMasterVictim,
    }).then(() => {
      if (current) setLocalDraftStatus('saved');
    }).catch(() => {
      if (current) setLocalDraftStatus('error');
    });
    return () => { current = false; };
  }, [showAlertModal, editingDraft, draftFields, localDraftKey, submittingAlert, alertValues, alertSources, selectedViolations, customViolation, otherViolation, incidentDateMode, incidentDate, incidentStartDate, incidentEndDate, alertMasterVictim]);

  useEffect(() => {
    if (!showAlertModal) return;
    let active = true;
    void pecmuRequest('/partenaires').then(result => {
      if (!active) return;
      const merged = normalizeApiList(result) as CarePartner[];
      const known = new Set(merged.map(partnerLookupKey));
      spreadsheetPartners.forEach((partner, index) => {
        const fallback: CarePartner = { ...partner, id: -(index + 1) };
        if (!known.has(partnerLookupKey(fallback))) merged.push(fallback);
      });
      setCarePartners(merged);
    }).catch(() => {
      if (active) setCarePartners(spreadsheetPartners.map((partner, index) => ({ ...partner, id: -(index + 1) })));
    });
    return () => { active = false; };
  }, [showAlertModal]);

  const loadVictims = useCallback(async () => {
    setLoadingVictims(true);
    setListError('');
    const cacheKey = 'all-victims-cache';
    const search = query.trim();

    const applyFilterRules = (rows: Victim[]) => {
      if (filterRules.length === 0) return rows;
      return rows.filter((victim) => {
        const victimAlerts = alerts.filter((alert) => alert.victimId === victim.id);
        return filterRules.every((rule) => matchesFilterRule(victim, rule, victimAlerts));
      });
    };

    try {
      // Rendre immédiatement les victimes déjà synchronisées. La présence du Wi-Fi
      // ne signifie pas forcément que l'API est joignable; le cache reste donc visible
      // pendant la tentative réseau et sert de repli si elle échoue.
      const cached = await getVictimsFromCache(cacheKey);
      const cachedRows = groupFicheRows((Array.isArray(cached?.data) ? cached.data : []).filter(isPecmuVictim));
      const cachedMatches = search
        ? cachedRows.filter((victim: Victim) => (
          [getVictimName(victim), victim.reference, victim.codeUnique, victim.province, victim.territoire, victim.status]
            .map(normalizeText).join(' ').includes(normalizeText(search))
        ))
        : cachedRows;
      const cachedFiltered = applyFilterRules(cachedMatches);
      const cachedTotalPages = Math.max(1, Math.ceil(cachedFiltered.length / meta.limit));
      const cachedPage = Math.min(meta.page, cachedTotalPages);
      const cachedStart = (cachedPage - 1) * meta.limit;
      const cachedPageRows = cachedFiltered.slice(cachedStart, cachedStart + meta.limit);

      if (cachedRows.length > 0) {
        setVictims(cachedPageRows);
        setMeta((prev) => ({
          ...prev,
          page: cachedPage,
          total: cachedFiltered.length,
          totalPages: cachedTotalPages,
          hasNextPage: cachedStart + meta.limit < cachedFiltered.length,
          hasPreviousPage: cachedPage > 1,
        }));
        setUsingCache(true);
        setSelectedVictim((current) => {
          if (current && cachedPageRows.some((victim: Victim) => victim.id === current.id)) return current;
          return cachedPageRows[0] || null;
        });
        setLoadingVictims(false);
      }

      if (isOnline()) {
        const pecmuResult = await listFichesPecmu(fetcher, {
          page: meta.page,
          limit: meta.limit,
          search,
          filters: filterRules,
        });

        if (pecmuResult) {
          const rows = groupFicheRows(pecmuResult.rows as Victim[]);
          const filteredRows = applyFilterRules(rows);
          setVictims(filteredRows);
          setMeta((prev) => ({
            ...prev,
            ...pecmuResult.meta,
            total: filterRules.length > 0 ? filteredRows.length : pecmuResult.meta.total,
          }));
          setUsingCache(false);
          setSelectedVictim((current) => {
            if (current && filteredRows.some((victim: Victim) => victim.id === current.id)) return current;
            return filteredRows[0] || null;
          });
          setLoadingVictims(false);
          return;
        }
      }

      setVictims(cachedPageRows);
      setMeta((prev) => ({
        ...prev,
        page: cachedPage,
        total: cachedFiltered.length,
        totalPages: cachedTotalPages,
        hasNextPage: cachedStart + meta.limit < cachedFiltered.length,
        hasPreviousPage: cachedPage > 1,
      }));
      setUsingCache(true);
      setSelectedVictim((current) => {
        if (current && cachedPageRows.some((victim: Victim) => victim.id === current.id)) return current;
        return cachedPageRows[0] || null;
      });
    } catch (error: any) {
      setListError(error?.message || 'Impossible de charger les dossiers PECMU.');
    } finally {
      setLoadingVictims(false);
    }
  }, [alerts, fetcher, filterRules, meta.limit, meta.page, query]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadVictims();
    }, 250);
    return () => clearTimeout(timeout);
  }, [loadVictims]);

  useEffect(() => {
    setMeta((prev) => ({ ...prev, page: 1 }));
  }, [filterRules, query]);

  useEffect(() => {
    let mounted = true;
    const ficheIds = victims
      .flatMap((victim) => victim.pecmuFicheIds || (victim.pecmuFicheId ? [victim.pecmuFicheId] : []))
      .filter((id): id is number => Number.isFinite(Number(id)));

    if (ficheIds.length === 0 || usingCache) {
      setMedicalActCounts({});
      return;
    }

    const loadActCounts = async () => {
      const entries = await Promise.all(
        ficheIds.map(async (ficheId) => {
          const actes = await listActesMedicauxByFiche(fetcher, ficheId).catch(() => []);
          return [ficheId, actes.length] as const;
        })
      );

      if (mounted) {
        const counts: Record<number, number> = {};
        const byFiche = Object.fromEntries(entries);
        victims.forEach(victim => {
          counts[victim.id] = (victim.pecmuFicheIds || (victim.pecmuFicheId ? [victim.pecmuFicheId] : [])).reduce((total, ficheId) => total + (byFiche[ficheId] || 0), 0);
        });
        setMedicalActCounts(counts);
      }
    };

    loadActCounts();
    return () => {
      mounted = false;
    };
  }, [fetcher, usingCache, victims]);

  const addFilterRule = useCallback(() => {
    setFilterRules((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        field: 'structurePriseEnCharge',
        operator: 'contains',
        value: '',
      },
    ]);
  }, []);

  const updateFilterRule = useCallback((id: string, updates: Partial<FilterRule>) => {
    setFilterRules((rules) => rules.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule)));
  }, []);

  const removeFilterRule = useCallback((id: string) => {
    setFilterRules((rules) => rules.filter((rule) => rule.id !== id));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilterRules([]);
    setQuery('');
  }, []);

  const hydrateIncidentDates = (value?: string) => {
    const dates = String(value || '').match(/\d{4}-\d{2}-\d{2}/g) || [];
    if (dates.length >= 2) {
      setIncidentDateMode('period'); setIncidentStartDate(dates[0] || ''); setIncidentEndDate(dates[1] || ''); setIncidentDate('');
    } else {
      setIncidentDateMode('date'); setIncidentDate(dates[0] || ''); setIncidentStartDate(''); setIncidentEndDate('');
    }
  };

  const openAlertModal = async (victim?: Victim | null) => {
    setEditingDraft(null);
    const selected = victim ?? null;
    const linked = selected?.masterVictimId ? ({
      id: selected.masterVictimId, nom: selected.nom, prenom: selected.prenom, postnom: selected.postnom,
      age: selected.age, sexe: selected.sexe, province: selected.province, territoire: selected.territoire,
      commune: selected.commune, village: selected.village, adresse: selected.adresse,
    } as MasterVictim) : null;
    setAlertMasterVictim(linked);
    const draftKey = getPecmuDraftKey(selected && !linked ? 'fiche' : 'alert', linked?.id ?? selected?.pecmuFicheId);
    setLocalDraftKey(draftKey);
    setLocalDraftStatus(draftKey ? 'idle' : 'error');
    setExistingVictimAlerts([]);
    if (linked) void listFichesPecmuByVictim(fetcher, linked.id).then(setExistingVictimAlerts).catch(() => setExistingVictimAlerts([]));
    let values = buildF2Values(selected);
    let savedDraft: Record<string, unknown> | null = null;
    try {
      const localDraft = draftKey ? await getPecmuDraft(draftKey) : null;
      if (localDraft) {
        const answer = await Swal.fire({
          icon: 'question', title: 'Brouillon local disponible',
          text: 'Un brouillon enregistré sur cet appareil existe. Voulez-vous le reprendre ?',
          showCancelButton: true, confirmButtonText: 'Reprendre', cancelButtonText: 'Supprimer',
          confirmButtonColor: '#901c67', cancelButtonColor: '#64748b',
        });
        if (answer.isConfirmed) savedDraft = localDraft.data;
        else if (answer.dismiss === Swal.DismissReason.cancel) await deletePecmuDraft(draftKey);
        else return;
      }
    } catch {
      setLocalDraftStatus('error');
    }
    if (savedDraft) {
      values = { ...values, ...(savedDraft.alertValues as Record<string, string> || {}) };
      setAlertMasterVictim((savedDraft.alertMasterVictim as MasterVictim | null) || linked);
      setSelectedViolations(Array.isArray(savedDraft.selectedViolations) ? savedDraft.selectedViolations as string[] : []);
      setCustomViolation(String(savedDraft.customViolation || ''));
      setOtherViolation(Boolean(savedDraft.otherViolation));
      setIncidentDateMode(savedDraft.incidentDateMode === 'period' ? 'period' : 'date');
      setIncidentDate(String(savedDraft.incidentDate || ''));
      setIncidentStartDate(String(savedDraft.incidentStartDate || ''));
      setIncidentEndDate(String(savedDraft.incidentEndDate || ''));
    } else {
      const violations = parseViolationSelection(values.typeViolation);
      setSelectedViolations(violations.selected);
      setCustomViolation(violations.custom);
      setOtherViolation(violations.other);
      hydrateIncidentDates(values.periodeIncident);
    }
    setAlertSources(readAlertSources({ ...values, alertSources: savedDraft?.alertSources }));
    setAlertValues(values);
    setShowAlertModal(true);
  };

  const openDraftEditor = async (draft: FichePecmu, victim?: Victim) => {
    if (draft.access?.canEdit === false) return;
    const key = getPecmuDraftKey('edit', draft.id);
    const values = mapFichePecmuToF2Values(draft);
    const sources = readAlertSources(draft);
    const violations = parseViolationSelection(values.typeViolation);
    const dates = values.periodeIncident?.match(/\d{4}-\d{2}-\d{2}/g) || [];
    const period = dates.length >= 2;
    const baseline = JSON.stringify([values, sources, violations.selected, violations.custom, violations.other,
      period ? 'period' : 'date', period ? '' : dates[0] || '', period ? dates[0] : '', period ? dates[1] : '']);
    let saved: Record<string, unknown> | null = null;
    let cacheAvailable = Boolean(key);
    try {
      const snapshot = key ? await getPecmuDraft(key) : null;
      if (snapshot) {
        const changed = baseline !== snapshot.data.serverBaseline;
        const answer = await Swal.fire({
          icon: changed ? 'warning' : 'question', title: 'Modifications locales disponibles',
          text: changed ? 'La version du serveur a changé depuis votre saisie. Reprendre la copie locale permet de la relire avant de mettre à jour le serveur.' : 'Voulez-vous reprendre les modifications enregistrées sur cet appareil ?',
          showCancelButton: true, confirmButtonText: 'Reprendre', cancelButtonText: 'Supprimer la copie locale', confirmButtonColor: '#901c67',
        });
        if (answer.isConfirmed) saved = snapshot.data;
        else if (answer.dismiss === Swal.DismissReason.cancel) await deletePecmuDraft(key);
        else return;
      }
    } catch { cacheAvailable = false; }
    setLocalDraftKey(cacheAvailable ? key : '');
    setLocalDraftStatus(cacheAvailable ? 'idle' : 'error');
    if (victim) {
      setSelectedVictim(victim);
      setAlertMasterVictim(victim.masterVictimId ? {
        id: victim.masterVictimId, nom: victim.nom, prenom: victim.prenom, postnom: victim.postnom,
        age: victim.age, sexe: victim.sexe, province: victim.province, territoire: victim.territoire,
        commune: victim.commune, village: victim.village, adresse: victim.adresse,
      } : null);
    }
    draftBaseline.current = baseline;
    editHasLocalCopy.current = Boolean(saved);
    setEditingDraft(draft);
    setAlertValues(saved ? { ...values, ...saved.alertValues as Record<string, string> } : values);
    setAlertSources(saved && Array.isArray(saved.alertSources) ? saved.alertSources as AlertSource[] : sources);
    setSelectedViolations(saved && Array.isArray(saved.selectedViolations) ? saved.selectedViolations as string[] : violations.selected);
    setCustomViolation(saved ? String(saved.customViolation || '') : violations.custom);
    setOtherViolation(saved ? Boolean(saved.otherViolation) : violations.other);
    if (saved) {
      setIncidentDateMode(saved.incidentDateMode === 'period' ? 'period' : 'date');
      setIncidentDate(String(saved.incidentDate || ''));
      setIncidentStartDate(String(saved.incidentStartDate || ''));
      setIncidentEndDate(String(saved.incidentEndDate || ''));
    } else hydrateIncidentDates(values.periodeIncident);
    setShowVictimAlerts(false);
    setShowAlertModal(true);
  };

  const requestAlertModal = (victim?: Victim | null) => openAlertModal(victim);

  const selectAlertVictim = async (victim: MasterVictim | null) => {
    setAlertMasterVictim(victim);
    setExistingVictimAlerts([]);
    if (!victim) return;
    const values = buildF2Values(victim as Victim);
    const violations = parseViolationSelection(values.typeViolation);
    setSelectedViolations(violations.selected);
    setCustomViolation(violations.custom);
    setOtherViolation(violations.other);
    setAlertValues(previous => ({ ...previous, ...values }));
    hydrateIncidentDates(values.periodeIncident);
    setLoadingVictimAlerts(true);
    try { setExistingVictimAlerts(await listFichesPecmuByVictim(fetcher, victim.id)); }
    catch (error: any) { setListError(error?.message || 'Impossible de charger les alertes précédentes.'); }
    finally { setLoadingVictimAlerts(false); }
  };

  const openVictimAlertHistory = async (victim: Victim) => {
    if (!victim.masterVictimId) {
      if (victim.pecmuFicheId) setOpenDossierId(victim.pecmuFicheId);
      return;
    }
    setSelectedVictim(victim);
    setAlertMasterVictim({
      id: victim.masterVictimId, nom: victim.nom, prenom: victim.prenom, postnom: victim.postnom,
      age: victim.age, sexe: victim.sexe, province: victim.province, territoire: victim.territoire,
      commune: victim.commune, village: victim.village, adresse: victim.adresse,
    });
    setLoadingVictimAlerts(true); setExistingVictimAlerts([]); setShowVictimAlerts(true);
    try { setExistingVictimAlerts(await listFichesPecmuByVictim(fetcher, victim.masterVictimId)); }
    catch (error: any) { setListError(error?.message || 'Impossible de charger les alertes de cette victime.'); }
    finally { setLoadingVictimAlerts(false); }
  };

  const handleAlertSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingAlert) return;
    const saveAsDraft = (event.nativeEvent as SubmitEvent).submitter instanceof HTMLElement && (event.nativeEvent as SubmitEvent).submitter?.hasAttribute('data-save-draft');
    if (editingDraft) {
      if (editingDraft.access?.canEdit === false) return;
      setSubmittingAlert(true);
      try {
        const incidentPeriod = incidentDateMode === 'date' ? incidentDate : [incidentStartDate, incidentEndDate].filter(Boolean).join(' au ');
        const violationType = [...selectedViolations, ...(otherViolation && customViolation.trim() ? [customViolation.trim()] : [])].join(' ; ');
        if (saveAsDraft) {
          const payload = mapF2ValuesToFichePecmuPayload({ ...alertValues, periodeIncident: incidentPeriod, typeViolation: violationType }, true, alertSources);
          payload.status = 'BROUILLON';
          await updateFichePecmu(fetcher, editingDraft.id, payload, true);
        } else {
          if (draftBaseline.current !== draftFields) {
            await Swal.fire({ icon: 'info', title: 'Modifications en cours', text: 'Cliquez sur « Mettre à jour » pour enregistrer les modifications avant de soumettre le brouillon.' });
            return;
          }
          const result = await withDuplicateConfirmation(confirmed => submitFichePecmu(fetcher, editingDraft.id, confirmed));
          if (result === null) return;
        }
        if (localDraftKey) {
          try { await deletePecmuDraft(localDraftKey); } catch { setLocalDraftStatus('error'); }
        }
        const savedDraftId = editingDraft.id;
        setEditingDraft(null);
        setShowAlertModal(false);
        await loadVictims();

        if (saveAsDraft) {
          if (alertMasterVictim) {
            setExistingVictimAlerts(await listFichesPecmuByVictim(fetcher, alertMasterVictim.id));
            setShowVictimAlerts(true);
          }
          await Swal.fire({ icon: 'success', title: 'Brouillon mis à jour', text: 'Les modifications ont été enregistrées dans le brouillon.', confirmButtonColor: '#901c67' });
        } else {
          setShowVictimAlerts(false);
          setOpenDossierId(savedDraftId);
          await Swal.fire({ icon: 'success', title: 'Fiche soumise', text: 'Le brouillon a été soumis et son dossier est prêt à être suivi.', confirmButtonColor: '#901c67' });
        }
      } catch (error: any) {
        const backendResponse = error instanceof PecmuApiError
          ? `Réponse du backend (HTTP ${error.statusCode}, code ${error.code}) :\n${error.responseBody !== undefined ? JSON.stringify(error.responseBody, null, 2) : error.responseText || error.message}`
          : 'Aucune réponse structurée du backend n’a été reçue.';
        await Swal.fire({ icon: 'error', title: saveAsDraft ? 'Brouillon non mis à jour' : 'Fiche non soumise', text: `${error?.message || 'La fiche PECMU n’a pas pu être mise à jour.'}\n\n${backendResponse}`, confirmButtonColor: '#901c67' });
      } finally {
        setSubmittingAlert(false);
      }
      return;
    }
    if (saveAsDraft) {
      setSubmittingAlert(true);
      try {
        const incidentPeriod = incidentDateMode === 'date' ? incidentDate : [incidentStartDate, incidentEndDate].filter(Boolean).join(' au ');
        const violationType = [...selectedViolations, ...(otherViolation && customViolation.trim() ? [customViolation.trim()] : [])].join(' ; ');
        await createFichePecmu(fetcher, { ...alertValues, periodeIncident: incidentPeriod, typeViolation: violationType }, alertMasterVictim?.id, { status: 'BROUILLON', sources: alertSources });
        if (localDraftKey) { try { await deletePecmuDraft(localDraftKey); } catch { setLocalDraftStatus('error'); } }
        setShowAlertModal(false);
        await loadVictims();
        await Swal.fire({ icon: 'success', title: 'Brouillon enregistré', text: 'Le dossier a été enregistré avec le statut Brouillon. Vous pourrez le compléter et le soumettre ensuite.', confirmButtonColor: '#901c67' });
      } catch (error: any) {
        const backendResponse = error instanceof PecmuApiError
          ? `Réponse du backend (HTTP ${error.statusCode}, code ${error.code}) :\n${error.responseBody !== undefined ? JSON.stringify(error.responseBody, null, 2) : error.responseText || error.message}`
          : 'Aucune réponse structurée du backend n’a été reçue.';
        await Swal.fire({ icon: 'error', title: 'Brouillon non enregistré', text: `${error?.message || 'Le brouillon n’a pas pu être enregistré.'}\n\n${backendResponse}`, confirmButtonColor: '#901c67' });
      } finally {
        setSubmittingAlert(false);
      }
      return;
    }
    if (otherViolation && !customViolation.trim()) {
      await Swal.fire({ icon: 'warning', title: 'Type de violation manquant', text: 'Précisez le type de violation pour l’option Autre.' });
      return;
    }
    const patientName = alertMasterVictim ? masterVictimName(alertMasterVictim) : alertValues.nomVictime;

    if (!alertMasterVictim && !patientName.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Victime non renseignée',
        text: 'Renseignez au minimum le nom de la victime ou sélectionnez une victime PECMU.',
        confirmButtonColor: '#901c67',
      });
      return;
    }

    const age = alertMasterVictim ? '' : alertValues.age.trim();
    if (age && (!Number.isFinite(Number(age)) || Number(age) < 0 || Number(age) > 120)) {
      await Swal.fire({
        icon: 'warning',
        title: 'Âge invalide',
        text: 'Saisissez un âge compris entre 0 et 120 ans. Les âges de moins d’un an peuvent être saisis en décimal (ex. 0,5).',
        confirmButtonColor: '#901c67',
      });
      return;
    }
    if (incidentDateMode === 'date' && !incidentDate) {
      await Swal.fire({ icon: 'warning', title: 'Date des faits manquante', text: 'Sélectionnez la date des faits.' });
      return;
    }
    if (incidentDateMode === 'period' && (!incidentStartDate || !incidentEndDate)) {
      await Swal.fire({ icon: 'warning', title: 'Période incomplète', text: 'Sélectionnez les deux dates de la période des faits.' });
      return;
    }
    if (incidentDateMode === 'period' && incidentEndDate < incidentStartDate) {
      await Swal.fire({ icon: 'warning', title: 'Période invalide', text: 'La fin de période doit être égale ou postérieure au début.' });
      return;
    }

    setSubmittingAlert(true);
    try {
      const violationType = [...selectedViolations, ...(otherViolation && customViolation.trim() ? [customViolation.trim()] : [])].join(' ; ');
      const incidentPeriod = incidentDateMode === 'date' ? incidentDate : `${incidentStartDate} au ${incidentEndDate}`;
      const created = await withDuplicateConfirmation(confirmed => createFichePecmu(
        fetcher, { ...alertValues, periodeIncident: incidentPeriod, typeViolation: violationType },
        alertMasterVictim?.id, { sources: alertSources, confirmDuplicate: confirmed }
      ));
      if (created === null) return;
      if (localDraftKey) { try { await deletePecmuDraft(localDraftKey); } catch { setLocalDraftStatus('error'); } }
      setShowAlertModal(false);
      if (created.id) setOpenDossierId(created.id);
      await loadVictims();
      await Swal.fire({
        icon: 'success',
        title: 'Alerte signalée',
        text: 'La fiche F2 PECMU a été enregistrée.',
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error: any) {
      const backendResponse = error instanceof PecmuApiError
        ? `Réponse du backend (HTTP ${error.statusCode}, code ${error.code}) :\n${error.responseBody !== undefined ? JSON.stringify(error.responseBody, null, 2) : error.responseText || error.message}`
        : 'Aucune réponse structurée du backend n’a été reçue.';
      await Swal.fire({
        icon: 'error',
        title: 'Alerte non enregistrée',
        text: `${error?.message || "L'API PECMU n'a pas confirmé l'enregistrement."}\n\n${backendResponse}`,
        confirmButtonColor: '#901c67',
      });
    } finally {
      setSubmittingAlert(false);
    }
  };

  const renderF2Field = (field: FormField) => {
    const options = field.key === 'typeViolation' ? violationOptions : field.options;
    const value = alertValues[field.key] || '';
    const update = (nextValue: string) => setAlertValues((prev) => ({ ...prev, [field.key]: nextValue }));

    if (field.key === 'periodeIncident') {
      return <div key={field.key} className="space-y-2">
        <span className="block text-xs font-bold uppercase tracking-wide text-slate-600">Date ou période des faits</span>
        <div className="mt-2 inline-flex rounded-md border border-slate-300 bg-slate-50 p-1" role="group" aria-label="Type de date des faits">
          <button type="button" aria-pressed={incidentDateMode === 'date'} onClick={() => setIncidentDateMode('date')} className={`rounded px-3 py-1.5 text-sm font-medium ${incidentDateMode === 'date' ? 'bg-white text-primary shadow-sm' : 'text-slate-600'}`}>Une date</button>
          <button type="button" aria-pressed={incidentDateMode === 'period'} onClick={() => setIncidentDateMode('period')} className={`rounded px-3 py-1.5 text-sm font-medium ${incidentDateMode === 'period' ? 'bg-white text-primary shadow-sm' : 'text-slate-600'}`}>Une période</button>
        </div>
        {incidentDateMode === 'date' ? <label className="block text-sm text-slate-700"><span className="sr-only">Date des faits</span><input required type="date" value={incidentDate} onChange={event => setIncidentDate(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary-500" /></label> : <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm text-slate-700"><span className="mb-1 block">Du</span><input required type="date" value={incidentStartDate} max={incidentEndDate || undefined} onChange={event => setIncidentStartDate(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary-500" /></label>
          <label className="block text-sm text-slate-700"><span className="mb-1 block">Au</span><input required type="date" value={incidentEndDate} min={incidentStartDate || undefined} onChange={event => setIncidentEndDate(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary-500" /></label>
        </div>}
      </div>;
    }

    if (field.key === 'structureNom') {
      return <label key={field.key} className="block"><span className="text-xs font-bold uppercase tracking-wide text-slate-600">{field.label} *</span><input required type="text" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary-500" value={value} onChange={event => update(event.target.value)} /></label>;
    }

    if (field.key === 'zoneSante') {
      const province = rdcProvinces.find(item => normalizePartnerText(item) === normalizePartnerText(alertValues.province));
      const officialZones = province ? healthZonesByProvince[province] || [] : [];
      const partnerZones = carePartners.filter(partner => normalizePartnerText(partner.province) === normalizePartnerText(alertValues.province)).map(partner => partner.zoneSante || partner.healthZone || '').filter(Boolean);
      const zones = [...new Set([...officialZones, ...partnerZones])].sort((a, b) => a.localeCompare(b, 'fr'));
      return <label key={field.key} className="block"><span className="text-xs font-bold uppercase tracking-wide text-slate-600">{field.label}</span><select disabled={!alertValues.province} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary-500 disabled:bg-slate-50" value={value} onChange={event => { setAlertValues(previous => ({ ...previous, zoneSante: event.target.value })); }}><option value="">{alertValues.province ? 'Sélectionner une zone de santé' : 'Sélectionner d’abord une province'}</option>{value && !zones.includes(value) && <option value={value}>{value}</option>}{zones.map(zone => <option key={zone} value={zone}>{zone}</option>)}</select></label>;
    }

    if (field.key === 'province' && field.type === 'select') {
      return <label key={field.key} className="block"><span className="text-xs font-bold uppercase tracking-wide text-slate-600">{field.label}</span><select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary-500" value={value} onChange={event => setAlertValues(previous => ({ ...previous, province: event.target.value, zoneSante: '' }))}><option value="">Sélectionner</option>{field.options?.map(option => <option key={option} value={option}>{option}</option>)}</select></label>;
    }

    if (field.key === 'partiesCorps') {
      const selectedParts = value.split(/\s*;\s*/).map(part => part.trim()).filter(Boolean);
      const togglePart = (part: string) => update(selectedParts.includes(part)
        ? selectedParts.filter(item => item !== part).join(' ; ')
        : [...selectedParts, part].join(' ; '));
      return <div key={field.key} className="space-y-3 md:col-span-2">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-600">{field.label}</span>
        {selectedParts.length > 0 ? <div className="flex flex-wrap gap-2" aria-label="Parties sélectionnées">{selectedParts.map(part => <span key={part} className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 py-1 pl-3 pr-1 text-xs font-medium text-slate-700"><span>{part}</span><button type="button" onClick={() => togglePart(part)} aria-label={`Retirer ${part}`} className="rounded-full p-1 text-slate-500 hover:bg-red-50 hover:text-red-600"><X size={14} /></button></span>)}</div> : <p className="text-sm text-slate-500">Choisissez une ou plusieurs parties du corps.</p>}
        <details className="group relative">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 [&::-webkit-details-marker]:hidden"><span>{selectedParts.length ? `${selectedParts.length} partie(s) sélectionnée(s)` : 'Choisir les parties du corps'}</span><ChevronDown size={17} className="text-slate-500 transition-transform group-open:rotate-180" /></summary>
          <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-slate-200 bg-white p-2 shadow-lg" role="group" aria-label="Choisir les parties du corps atteintes">{alphabeticBodyParts.map(part => <label key={part} className={`flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-sm ${selectedParts.includes(part) ? 'bg-primary/5 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}><input type="checkbox" checked={selectedParts.includes(part)} onChange={() => togglePart(part)} className="mt-0.5 accent-primary" /><span>{part}</span></label>)}</div>
        </details>
        {selectedParts.some(part => !allBodyParts.includes(part)) && <p className="text-xs text-slate-500">Une valeur déjà enregistrée n’appartenant pas à la liste est conservée ; vous pouvez la retirer ci-dessus.</p>}
      </div>;
    }

    if (field.key === 'alertSources') {
      return <PecmuAlertSources sources={alertSources} onChange={setAlertSources} />;
    }

    if (field.key === 'typeViolation') {
      const toggleViolation = (violation: string) => setSelectedViolations(current => current.includes(violation) ? current.filter(item => item !== violation) : [...current, violation]);
      return (
        <div key={field.key} className="space-y-3 md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-bold uppercase tracking-wide text-slate-600">{field.label}</span><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{selectedViolations.length + (otherViolation && customViolation.trim() ? 1 : 0)} sélectionnée(s)</span></div>
          {selectedViolations.length > 0 || (otherViolation && customViolation.trim()) ? <div className="flex flex-wrap gap-2 rounded-lg border border-primary/15 bg-primary/[0.035] p-3">{selectedViolations.map(item => <span key={item} className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary/20 bg-white py-1 pl-3 pr-1 text-xs font-medium text-slate-700"><span className="max-w-[22rem] truncate">{item}</span><button type="button" onClick={() => toggleViolation(item)} aria-label={`Retirer ${item}`} title="Retirer" className="rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"><X size={14} /></button></span>)}{otherViolation && customViolation.trim() && <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-amber-200 bg-amber-50 py-1 pl-3 pr-1 text-xs font-medium text-amber-900"><span className="max-w-[22rem] truncate">Autre : {customViolation.trim()}</span><button type="button" onClick={() => { setOtherViolation(false); setCustomViolation(''); }} aria-label="Retirer la violation personnalisée" title="Retirer" className="rounded-full p-1 text-amber-600 hover:bg-white"><X size={14} /></button></span>}</div> : <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">Aucune violation sélectionnée. Choisissez une ou plusieurs options ci-dessous.</p>}
          <div className="max-h-80 space-y-4 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm">{violationGroups.map(group => <fieldset key={group.label}><legend className="mb-2 text-sm font-bold text-slate-800">{group.label}</legend><div className="grid gap-2 sm:grid-cols-2">{group.violations.map(violation => { const checked = selectedViolations.includes(violation); return <label key={violation} className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 text-sm transition-colors ${checked ? 'border-primary/40 bg-primary/5 text-primary' : 'border-slate-100 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'}`}><input type="checkbox" checked={checked} onChange={() => toggleViolation(violation)} className="mt-0.5 accent-primary" /><span>{violation}</span></label>; })}</div></fieldset>)}</div>
          <div className="rounded-lg border border-slate-200 p-3"><label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-800"><input type="checkbox" checked={otherViolation} onChange={event => { setOtherViolation(event.target.checked); if (!event.target.checked) setCustomViolation(''); }} className="accent-primary" />Autre type de violation</label>{otherViolation && <input required className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" value={customViolation} onChange={event => setCustomViolation(event.target.value)} placeholder="Préciser la violation" />}</div>
        </div>
      );
    }

    if (field.type === 'select' && options?.length === 2 && options.includes('Oui') && options.includes('Non')) {
      return <YesNoToggle key={field.key} label={field.label} checked={value === 'Oui'} onChange={(checked) => update(checked ? 'Oui' : 'Non')} />;
    }

    return (
      <label key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
        <span className="text-xs font-bold uppercase tracking-wide text-slate-600">{field.label}</span>
        {field.type === 'textarea' ? (
          <textarea required={field.required} className="mt-1 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary-500" value={value} onChange={(event) => update(event.target.value)} />
        ) : field.type === 'select' ? (
          <select required={field.required} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary-500" value={value} onChange={(event) => update(event.target.value)}>
            <option value="">Sélectionner</option>
            {value && !options?.includes(value) ? <option value={value}>{value}</option> : null}
            {options?.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        ) : (
        <input
            required={field.required}
            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
            min={field.key === 'age' ? 0 : undefined}
            max={field.key === 'age' ? 120 : undefined}
            step={field.key === 'age' ? 'any' : undefined}
            inputMode={field.key === 'age' ? 'decimal' : field.type === 'number' ? 'numeric' : undefined}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
            value={value}
            onChange={(event) => update(event.target.value)}
          />
        )}
      </label>
    );
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 px-4 py-6 md:px-6">
      {listError && <div role="alert" className="mb-4 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{listError}<button type="button" className="ml-3 underline" onClick={loadVictims}>Réessayer</button></div>}
      <section className="mb-6 border border-primary-100 bg-white p-5 shadow-[0_18px_50px_-38px_rgba(0,127,186,0.55)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-red-600">Module PECMU</div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">Prise en charge médicale urgente</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Liste PECMU issue du registre victimes, signalement F2, actes médicaux et formulaires F4/F5/F6.
            </p>
          </div>
          <button
            type="button"
            onClick={() => requestAlertModal()}
            className={`${activeView === 'victimes' ? 'inline-flex' : 'hidden'} items-center justify-center gap-2 bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-700`}
          >
            <Plus size={16} />
            Nouvelle alerte
          </button>
        </div>
      </section>

      <div className="mb-4 flex border-b border-gray-200 bg-white px-4">
        <button
          type="button"
          onClick={() => setActiveView('victimes')}
          className={`border-b-2 px-4 py-3 text-sm font-bold transition-colors ${activeView === 'victimes' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          Victimes PECMU
        </button>
        <button
          type="button"
          onClick={() => setActiveView('partenaires')}
          className={`border-b-2 px-4 py-3 text-sm font-bold transition-colors ${activeView === 'partenaires' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          Partenaires de prise en charge
        </button>
      </div>

      {activeView === 'partenaires' ? <PecmuPartnersSettings /> : (
      <section className="min-w-0 border border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">Liste des victimes PECMU</h2>
         
              </div>
              {loadingVictims ? <span className="text-xs font-bold text-primary-600">Chargement...</span> : null}
            </div>
            <div className="mt-4 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher par nom, dossier, ou référence..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full border border-gray-300 py-3 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilterBuilder((current) => !current)}
                className={`flex items-center gap-2 border px-6 py-3 font-medium transition-colors ${showFilterBuilder
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Filter size={20} />
                Filtres avancés
                {filterRules.length > 0 ? (
                  <span className="bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                    {filterRules.length}
                  </span>
                ) : null}
              </button>
            </div>

            {showFilterBuilder ? (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-gray-900">Constructeur de filtres</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={addFilterRule}
                      className="flex items-center gap-1 bg-blue-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      <Plus size={16} />
                      Ajouter un filtre
                    </button>
                    {filterRules.length > 0 ? (
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                      >
                        Effacer tout
                      </button>
                    ) : null}
                  </div>
                </div>

                {filterRules.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    <Filter size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>Aucun filtre configuré</p>
                    <p className="text-sm">Cliquez sur "Ajouter un filtre" pour commencer</p>
                  </div>
                ) : null}

                <div className="space-y-3">
                  {filterRules.map((rule, index) => {
                    const field = pecmuFilterFields.find((item) => item.key === rule.field);
                    const availableOperators = filterOperators.filter((operator) => operator.types.includes(field?.type || 'text'));

                    return (
                      <div key={rule.id} className="flex flex-col gap-3 border border-gray-200 bg-gray-50 p-3 lg:flex-row lg:items-center">
                        {index > 0 ? <span className="px-2 text-sm font-medium text-gray-500">ET</span> : null}

                        <select
                          value={rule.field}
                          onChange={(event) => {
                            const nextField = pecmuFilterFields.find((item) => item.key === event.target.value);
                            const nextOperator = filterOperators.find((operator) => operator.types.includes(nextField?.type || 'text'))?.key || 'equals';
                            updateFilterRule(rule.id, { field: event.target.value, operator: nextOperator, value: '' });
                          }}
                          className="border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none"
                        >
                          {pecmuFilterFields.map((item) => (
                            <option key={item.key} value={item.key}>{item.label}</option>
                          ))}
                        </select>

                        <select
                          value={rule.operator}
                          onChange={(event) => updateFilterRule(rule.id, { operator: event.target.value })}
                          className="border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none"
                        >
                          {availableOperators.map((operator) => (
                            <option key={operator.key} value={operator.key}>{operator.label}</option>
                          ))}
                        </select>

                        {field?.type === 'select' ? (
                          <select
                            value={rule.value}
                            onChange={(event) => updateFilterRule(rule.id, { value: event.target.value })}
                            className="min-w-48 border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none"
                          >
                            <option value="">Sélectionner...</option>
                            {field.options?.map((option) => (
                              <option key={option} value={option}>{field.key === 'workflowStatus' ? statusLabels[option as keyof typeof statusLabels] : option}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field?.type === 'number' ? 'number' : 'text'}
                            value={rule.value}
                            onChange={(event) => updateFilterRule(rule.id, { value: event.target.value })}
                            placeholder="Valeur..."
                            className="min-w-48 border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none"
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => removeFilterRule(rule.id)}
                          className="p-2 text-red-500 transition-colors hover:bg-red-50"
                          title="Supprimer ce filtre"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {(filterRules.length > 0 || query) ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-4">
                <span className="text-sm font-medium text-gray-700">Filtres actifs:</span>
                <span className="text-sm text-gray-600">({meta.total} résultat{meta.total > 1 ? 's' : ''})</span>
                {query ? (
                  <span className="border border-blue-200 bg-blue-100 px-2 py-1 text-xs text-blue-800">
                    Recherche: "{query}"
                  </span>
                ) : null}
                {filterRules.map((rule) => {
                  const field = pecmuFilterFields.find((item) => item.key === rule.field);
                  const operator = filterOperators.find((item) => item.key === rule.operator);
                  return (
                    <span key={rule.id} className="border border-gray-200 bg-gray-100 px-2 py-1 text-xs text-gray-800">
                      {field?.label} {operator?.label.toLowerCase()} "{rule.value}"
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>

          {victims.length > 0 && (filterRules.length > 0 || query) ? (
            <div className="border-b border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <Users className="text-blue-600" size={20} />
                <span className="font-medium text-gray-900">
                  {meta.total} victime{meta.total > 1 ? 's' : ''} trouvée{meta.total > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="w-16 px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">N°</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Victime</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Province</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Statut</th>
                  <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">Suivi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {victims.map((victim, index) => {
                  const active = selectedVictim?.id === victim.id;
                  const draftFiche = victim.rawPecmuFiche as FichePecmu | undefined;
                  const isDraft = draftFiche?.status?.toUpperCase() === 'BROUILLON';
                  const actCount = victim.pecmuFicheIds?.length || victim.pecmuFicheId
                    ? (medicalActCounts[victim.id] ?? 0)
                    : medicalActs.filter((act) => act.victimId === victim.id).length;

                  return (
                    <tr
                      key={victim.id}
                      onClick={() => {
                        setSelectedVictim(victim);
                        void openVictimAlertHistory(victim);
                      }}
                      className={`cursor-pointer transition-colors ${active ? 'bg-primary-50' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-4 py-3 text-sm font-semibold tabular-nums text-slate-500">{(meta.page - 1) * meta.limit + index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-950">{getVictimName(victim)}</div>
                        <div className="text-xs text-slate-500">{victim.reference || victim.codeUnique || `ID ${victim.id}`}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{victim.province || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{victim.status || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {isDraft && draftFiche ? <>
                            <button type="button" onClick={event => { event.stopPropagation(); setOpenDossierId(draftFiche.id); }} className="inline-flex items-center whitespace-nowrap border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">Voir</button>
                            {draftFiche.access?.canEdit !== false && <button type="button" onClick={event => { event.stopPropagation(); openDraftEditor(draftFiche, victim); }} className="inline-flex items-center whitespace-nowrap border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10">Éditer</button>}
                          </> : <button type="button" onClick={event => { event.stopPropagation(); requestAlertModal(victim); }} className="inline-flex items-center whitespace-nowrap border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100">Nouvelle alerte</button>}
                          <span className="inline-flex items-center whitespace-nowrap border border-secondary/20 bg-secondary/5 px-2.5 py-1 text-xs font-medium text-secondary">{actCount} {actCount > 1 ? 'actes médicaux' : 'acte médical'}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loadingVictims && victims.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">Aucune victime PECMU trouvée.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
            <span className="text-slate-500">Page {meta.page} / {meta.totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!meta.hasPreviousPage}
                onClick={() => setMeta((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                className="inline-flex items-center gap-1 border border-slate-200 px-3 py-1.5 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                Précédent
              </button>
              <button
                type="button"
                disabled={!meta.hasNextPage}
                onClick={() => setMeta((prev) => ({ ...prev, page: prev.page + 1 }))}
                className="inline-flex items-center gap-1 border border-slate-200 px-3 py-1.5 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Suivant
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
      </section>
      )}

      <Modal show={showVictimAlerts} onClose={() => setShowVictimAlerts(false)} size="4xl" className="!z-[100] !h-dvh !bg-slate-950/60" aria-label="Alertes PECMU de la victime">
        <ModalBody className="!p-0">
          <section className="space-y-5 !bg-white p-6 !text-gray-900">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div><p className="text-xs font-bold uppercase tracking-widest text-primary">Historique PECMU</p><h2 className="mt-1 text-2xl font-bold">{alertMasterVictim ? masterVictimName(alertMasterVictim) : 'Alertes de la victime'}</h2><p className="mt-1 text-sm text-slate-500">{existingVictimAlerts.length} alerte{existingVictimAlerts.length === 1 ? '' : 's'} enregistrée{existingVictimAlerts.length === 1 ? '' : 's'}</p></div>
              <button type="button" onClick={() => setShowVictimAlerts(false)} className="rounded p-2 text-slate-500 hover:bg-slate-100" aria-label="Fermer"><X size={22} /></button>
            </div>
            {loadingVictimAlerts ? <p role="status" className="py-8 text-center text-sm text-slate-500">Chargement des alertes…</p> : existingVictimAlerts.length ? <ol className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">{existingVictimAlerts.map(alert => {
              const isDraft = alert.status?.toUpperCase() === 'BROUILLON';
              return <li key={alert.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-semibold">Fiche PECMU #{alert.id} · {alertSourceLabel(alert) || alert.careStructureName || 'Structure non renseignée'}</p><p className="text-sm text-slate-500">{alert.incidentPeriod || 'Période non renseignée'} · {isDraft ? 'Brouillon' : alert.workflowStatus ? statusLabels[alert.workflowStatus] : alert.medicalStatus || 'Statut non renseigné'} · {alert.createdAt ? new Date(alert.createdAt).toLocaleDateString('fr-FR') : 'Date non renseignée'}</p></div><div className="flex items-center gap-2">{isDraft ? <><button type="button" className="border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => { setShowVictimAlerts(false); setOpenDossierId(alert.id); }}>Voir</button>{alert.access?.canEdit !== false && <button type="button" className="bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary/90" onClick={() => openDraftEditor(alert)}>Éditer</button>}</> : <button type="button" className="text-sm font-semibold text-primary underline" onClick={() => { setShowVictimAlerts(false); setOpenDossierId(alert.id); }}>Ouvrir le dossier</button>}</div></li>;
            })}</ol> : <p className="py-8 text-center text-sm text-slate-500">Aucune alerte enregistrée pour cette victime.</p>}
            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4"><button type="button" onClick={() => setShowVictimAlerts(false)} className="border border-slate-300 px-4 py-2 text-sm font-semibold">Fermer</button>{selectedVictim && <button type="button" onClick={() => { setShowVictimAlerts(false); requestAlertModal(selectedVictim); }} className="bg-primary px-4 py-2 text-sm font-semibold text-white">Nouvelle alerte</button>}</div>
          </section>
        </ModalBody>
      </Modal>

      <Modal show={showAlertModal} onClose={() => { setShowAlertModal(false); setEditingDraft(null); }} size="7xl" className="!z-[100] !h-dvh !bg-slate-950/60" aria-label={editingDraft ? 'Modifier un brouillon PECMU' : 'Nouvelle alerte PECMU'}>
        <ModalBody className="!p-0">
          <form onSubmit={handleAlertSubmit} className="relative !bg-white !text-gray-900">
            <button
              type="button"
              onClick={() => setShowAlertModal(false)}
              className="absolute right-3 top-3 z-10 p-2 !text-gray-400 transition-colors hover:!bg-gray-100 hover:!text-red-600"
              title="Fermer"
              aria-label="Fermer"
            >
              <X size={28} />
            </button>

            <div className="border-b !border-gray-200 px-4 pb-5 pt-8 md:px-7 md:pt-6">
              <div className="text-[11px] font-black uppercase tracking-[0.35em] !text-red-600">{editingDraft ? 'Brouillon PECMU' : 'Nouvelle alerte'}</div>
              <h2 className="mt-2 text-2xl font-black !text-gray-950 md:text-3xl">{editingDraft ? `Modifier la fiche #${editingDraft.id}` : 'Fiche identification cas'}</h2>
              <p className="mt-1 text-sm !text-gray-500 md:text-base">{editingDraft ? 'Modifiez les informations dans le parcours F2, puis mettez à jour le brouillon ou soumettez la fiche.' : 'Cherchez d’abord la victime existante. Une nouvelle alerte créera un dossier distinct.'}</p>
            </div>

            <div className="max-h-[calc(100vh-230px)] overflow-y-auto px-4 py-5 md:px-7">
              <fieldset disabled={submittingAlert} className="space-y-5">
                <PecmuVictimSearch fetcher={fetcher} selected={alertMasterVictim} onSelect={victim => { void selectAlertVictim(victim); }} disabled={submittingAlert || Boolean(editingDraft)} />
                {alertMasterVictim && !editingDraft && <section className="space-y-3 rounded border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Alertes PECMU déjà enregistrées</h3><span className="rounded bg-primary/5 px-2 py-1 text-xs font-semibold text-primary">{existingVictimAlerts.length} alerte{existingVictimAlerts.length > 1 ? 's' : ''}</span></div>
                  {loadingVictimAlerts ? <p role="status" className="text-sm text-slate-500">Chargement des alertes…</p> : existingVictimAlerts.length ? <ol className="space-y-2">{existingVictimAlerts.map(alert => {
                    const isDraft = alert.status?.toUpperCase() === 'BROUILLON';
                    return <li key={alert.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3"><div><p className="text-sm font-semibold">Fiche PECMU #{alert.id} · {alertSourceLabel(alert) || alert.careStructureName || 'Structure non renseignée'}</p><p className="text-xs text-slate-500">{alert.incidentPeriod || 'Période non renseignée'} · {isDraft ? 'Brouillon' : alert.workflowStatus ? statusLabels[alert.workflowStatus] : alert.medicalStatus || 'Statut non renseigné'} · {alert.createdAt ? new Date(alert.createdAt).toLocaleDateString('fr-FR') : 'Date non renseignée'}</p></div><div className="flex items-center gap-2">{isDraft ? <><button type="button" className="border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700" onClick={() => { setShowAlertModal(false); setOpenDossierId(alert.id); }}>Voir</button>{alert.access?.canEdit !== false && <button type="button" className="border border-primary px-3 py-1 text-sm font-semibold text-primary" onClick={() => openDraftEditor(alert)}>Éditer</button>}</> : <button type="button" className="text-sm font-semibold text-primary underline" onClick={() => { setShowAlertModal(false); setOpenDossierId(alert.id); }}>Ouvrir le dossier</button>}</div></li>;
                  })}</ol> : <p className="text-sm text-slate-500">Aucune alerte précédente trouvée pour cette victime.</p>}
                </section>}
                {f2Sections.filter((_, index) => !(alertMasterVictim && !editingDraft && index === 0)).map((section) => (
                  <section key={section.title} className="border !border-gray-200 !bg-white p-4 md:p-5">
                    <h3 className="mb-4 text-sm font-black uppercase tracking-wide !text-gray-800">{section.title}</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {section.fields.map((field) => (
                        <React.Fragment key={field.key}>
                          {renderF2Field(field)}
                          {field.key === 'statutMedical' ? (
                            <section className="md:col-span-2">
                              <h3 className="mb-4 text-sm font-black uppercase tracking-wide !text-gray-800">Plaintes détaillées</h3>
                              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {complaintFields.map((field) => {
                                  const key = `plainte_${field}`;
                                  const checked = alertValues[key] === 'Oui';
                                  return (
                                    <YesNoToggle
                                      key={field}
                                      label={field}
                                      checked={checked}
                                      onChange={(nextChecked) => setAlertValues((prev) => ({ ...prev, [key]: nextChecked ? 'Oui' : 'Non' }))}
                                    />
                                  );
                                })}
                              </div>
                            </section>
                          ) : null}
                        </React.Fragment>
                      ))}
                    </div>
                  </section>
                ))}
              </fieldset>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t !border-gray-200 bg-white px-4 py-4 md:px-7">
              <p role="status" className="text-xs text-slate-500">{(localDraftStatus === 'saving' ? 'Enregistrement local…' : localDraftStatus === 'saved' ? 'Brouillon sauvegardé sur cet appareil' : localDraftStatus === 'error' ? 'Sauvegarde locale indisponible' : '')}</p>
              <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowAlertModal(false)} className="border !border-gray-300 px-4 py-2 text-sm font-bold !text-gray-700 hover:!bg-gray-50">Annuler</button>
              <button type="submit" data-save-draft formNoValidate disabled={submittingAlert} className="inline-flex items-center gap-2 border border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60">
                <Save size={16} />{submittingAlert ? (editingDraft ? 'Mise à jour…' : 'Enregistrement…') : (editingDraft ? 'Mettre à jour' : 'Enregistrer le brouillon')}
              </button>
              <button type="submit" formNoValidate={Boolean(editingDraft)} disabled={submittingAlert} className="inline-flex items-center gap-2 !bg-red-600 px-4 py-2 text-sm font-bold text-white hover:!bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                <Save size={16} />
                {submittingAlert ? (editingDraft ? 'Soumission…' : 'Enregistrement...') : (editingDraft ? 'Soumettre' : 'Enregistrer l’alerte F2')}
              </button>
              </div>
            </div>
          </form>
        </ModalBody>
      </Modal>

      {openDossierId ? (
        <PecmuDossierModal
          key={openDossierId}
          ficheId={openDossierId}
          initialTab={returnedDossier?.id === openDossierId ? returnedDossier.tab : undefined}
          initialCareMode={returnedDossier?.id === openDossierId ? returnedDossier.mode : undefined}
          fetcher={fetcher}
          onClose={() => { setOpenDossierId(null); setReturnedDossier(null); }}
          onChanged={loadVictims}
        />
      ) : null}
    </div>
  );
};

export default PecmuModulePage;
