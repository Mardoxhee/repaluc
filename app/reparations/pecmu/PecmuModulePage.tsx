"use client";

import React, { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Save,
  Search,
  Users,
  X,
} from 'lucide-react';
import { Modal, ModalBody } from 'flowbite-react';
import Swal from 'sweetalert2';
import { useFetch } from '../../context/FetchContext';
import { getVictimsFromCache, isOnline } from '../../utils/victimsCache';
import { normalizeApiList, normalizeText } from '../utils/mentionStats';
import {
  createFichePecmu,
  listActesMedicauxByFiche,
  listFichesPecmu,
} from '../services/pecmuApi';
import PecmuDossierModal from './PecmuDossierModal';

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
  variablesSpecifiques?: Record<string, string | null | undefined>;
  [key: string]: any;
};

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

const rdcProvinces = [
  'Bas-Uele',
  'Equateur',
  'Haut-Katanga',
  'Haut-Lomami',
  'Haut-Uele',
  'Ituri',
  'Kasai',
  'Kasai-Central',
  'Kasai-Oriental',
  'Kinshasa',
  'Kongo-Central',
  'Kwango',
  'Kwilu',
  'Lomami',
  'Lualaba',
  'Mai-Ndombe',
  'Maniema',
  'Mongala',
  'Nord-Kivu',
  'Nord-Ubangi',
  'Sankuru',
  'Sud-Kivu',
  'Sud-Ubangi',
  'Tanganyika',
  'Tshopo',
  'Tshuapa',
];

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
      { key: 'age', label: 'Age', type: 'number' },
      { key: 'sexe', label: 'Sexe', type: 'select', options: ['Féminin', 'Masculin', 'Autre'] },
      { key: 'province', label: 'Province', type: 'select', options: rdcProvinces },
      { key: 'localite', label: 'Localité' },
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
      { key: 'structureNom', label: 'Nom de la structure qui prend en charge' },
      { key: 'zoneSante', label: 'Zone de santé' },
      { key: 'aireSante', label: 'Aire de santé' },
      { key: 'adresseStructure', label: 'Adresse de la structure où elle est suivie', type: 'textarea' },
      { key: 'contactMedecin', label: 'Contact du médecin ou infirmier' },
    ],
  },
  {
    title: 'Source de l’alerte',
    fields: [
      { key: 'sourceNom', label: 'Nom complet' },
      { key: 'sourceContact', label: 'Contact téléphone' },
      { key: 'sourceRapport', label: 'Rapports avec la victime ou le cas' },
      { key: 'sourceAdresse', label: 'Adresse', type: 'textarea' },
    ],
  },
  {
    title: 'Situation médicale de la victime',
    fields: [
      { key: 'typeViolation', label: 'Type de violation subie', type: 'textarea' },
      { key: 'detailsIncident', label: 'Détails de l’incident', type: 'textarea' },
      { key: 'periodeIncident', label: 'Période / dates' },
      { key: 'partiesCorps', label: 'Parties du corps atteintes', type: 'textarea' },
      { key: 'statutMedical', label: 'Statut médical', type: 'select', options: ['Était déjà traité', 'Rien n’est fait', 'Traitement en cours'] },
      { key: 'plaintes', label: 'Plaintes', type: 'textarea' },
      { key: 'autresPlaintes', label: 'Autres plaintes', type: 'textarea' },
      { key: 'pronosticVital', label: 'Pronostic vital', type: 'select', options: ['Bon (normal)', 'Réservé (moyen)', 'Engagé (grave)'] },
    ],
  },
  {
    title: 'Orientations DEEE et pool médical',
    fields: [
      { key: 'certificationIncident', label: 'Certification de l’incident', type: 'select', options: ['Oui', 'Non'] },
      { key: 'identificationVictime', label: 'Identification de la victime', type: 'select', options: ['Oui', 'Non'] },
      { key: 'validationNom', label: 'Validation - nom' },
      { key: 'validationFonction', label: 'Validation - fonction' },
      { key: 'decisionPecmu', label: 'Décision de PECMU', type: 'select', options: ['Cas éligible', 'Cas non-éligible'] },
      { key: 'decision', label: 'Décision', type: 'textarea' },
      { key: 'partenaireDecision', label: 'Nom et adresse du partenaire', type: 'textarea' },
      { key: 'timingReferencement', label: 'Timing nécessaire', type: 'select', options: ['Immédiatement', 'Endéans 24 à 72h', 'Plus tard'] },
      { key: 'refererCliniqueMobile', label: 'Victime à référer à la clinique mobile', type: 'select', options: ['Immédiatement', 'Endéans 24 à 72h', 'Plus tard', 'Non'] },
      { key: 'priseEnChargePlanifier', label: 'Prise en charge médicale à planifier', type: 'select', options: ['Oui', 'Non'] },
      { key: 'referencementUrgent', label: 'Référer absolument pour PECMU', type: 'select', options: ['Oui', 'Non'] },
      { key: 'commentaires', label: 'Commentaires', type: 'textarea' },
      { key: 'responsable', label: 'Nom du responsable' },
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

const buildF2Values = (victim?: Victim | null): Record<string, string> => {
  const values: Record<string, string> = {};
  f2Sections.forEach((section) => {
    section.fields.forEach((field) => {
      values[field.key] = '';
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
  const { fetcher } = useFetch();
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
  const [alerts, setAlerts] = useState<PecmuAlert[]>([]);
  const [medicalActs, setMedicalActs] = useState<MedicalAct[]>([]);
  const [medicalActCounts, setMedicalActCounts] = useState<Record<number, number>>({});
  const [alertVictimId, setAlertVictimId] = useState<string>('');
  const [alertValues, setAlertValues] = useState<Record<string, string>>(() => buildF2Values(null));
  const [submittingAlert, setSubmittingAlert] = useState(false);

  useEffect(() => {
    setAlerts(readStorage<PecmuAlert[]>(ALERTS_STORAGE_KEY, []));
    setMedicalActs(readStorage<MedicalAct[]>(ACTS_STORAGE_KEY, []));
  }, []);

  const loadVictims = useCallback(async () => {
    setLoadingVictims(true);
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
      if (isOnline()) {
        const pecmuResult = await listFichesPecmu(fetcher, {
          page: meta.page,
          limit: meta.limit,
          search,
          filters: filterRules,
        });

        if (pecmuResult) {
          const rows = pecmuResult.rows as Victim[];
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

      const cached = await getVictimsFromCache(cacheKey);
      const cachedRows = (Array.isArray(cached?.data) ? cached!.data : []).filter(isPecmuVictim);
      const filtered = search
        ? cachedRows.filter((victim: Victim) => (
          [
            getVictimName(victim),
            victim.reference,
            victim.codeUnique,
            victim.province,
            victim.territoire,
            victim.status,
          ].map(normalizeText).join(' ').includes(normalizeText(search))
        ))
        : cachedRows;
      const filteredWithRules = applyFilterRules(filtered);
      const totalPages = Math.max(1, Math.ceil(filteredWithRules.length / meta.limit));
      const currentPage = Math.min(meta.page, totalPages);
      const start = (currentPage - 1) * meta.limit;
      const pageRows = filteredWithRules.slice(start, start + meta.limit);

      setVictims(pageRows);
      setMeta((prev) => ({
        ...prev,
        page: currentPage,
        total: filteredWithRules.length,
        totalPages,
        hasNextPage: start + meta.limit < filteredWithRules.length,
        hasPreviousPage: currentPage > 1,
      }));
      setUsingCache(true);
      setSelectedVictim((current) => {
        if (current && pageRows.some((victim: Victim) => victim.id === current.id)) return current;
        return pageRows[0] || null;
      });
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
      .map((victim) => victim.pecmuFicheId)
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

      if (mounted) setMedicalActCounts(Object.fromEntries(entries));
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

  const openAlertModal = (victim?: Victim | null) => {
    const selected = victim || selectedVictim;
    setAlertVictimId(selected?.id ? String(selected.id) : '');
    setAlertValues(buildF2Values(selected));
    setShowAlertModal(true);
  };

  const handleAlertSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const victim = victims.find((item) => String(item.id) === alertVictimId) || selectedVictim;
    const patientName = alertValues.nomVictime || getVictimName(victim);

    if (!patientName.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Victime non renseignée',
        text: 'Renseignez au minimum le nom de la victime ou sélectionnez une victime PECMU.',
        confirmButtonColor: '#901c67',
      });
      return;
    }

    const age = alertValues.age.trim();
    if (age && (!/^\d+$/.test(age) || Number(age) > 120)) {
      await Swal.fire({
        icon: 'warning',
        title: 'Age invalide',
        text: "Saisissez un age entier compris entre 0 et 120 ans.",
        confirmButtonColor: '#901c67',
      });
      return;
    }

    setSubmittingAlert(true);
    try {
      await createFichePecmu(fetcher, alertValues);
      setShowAlertModal(false);
      await loadVictims();
      await Swal.fire({
        icon: 'success',
        title: 'Alerte signalée',
        text: 'La fiche F2 PECMU a été enregistrée.',
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Alerte non enregistrée',
        text: error?.message || "L'API PECMU n'a pas confirmé l'enregistrement.",
        confirmButtonColor: '#901c67',
      });
    } finally {
      setSubmittingAlert(false);
    }
  };

  const renderF2Field = (field: FormField) => {
    const value = alertValues[field.key] || '';
    const update = (nextValue: string) => setAlertValues((prev) => ({ ...prev, [field.key]: nextValue }));

    return (
      <label key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
        <span className="text-xs font-bold uppercase tracking-wide text-slate-600">{field.label}</span>
        {field.type === 'textarea' ? (
          <textarea className="mt-1 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary-500" value={value} onChange={(event) => update(event.target.value)} />
        ) : field.type === 'select' ? (
          <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary-500" value={value} onChange={(event) => update(event.target.value)}>
            <option value="">Sélectionner</option>
            {value && !field.options?.includes(value) ? <option value={value}>{value}</option> : null}
            {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        ) : (
          <input
            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
            min={field.key === 'age' ? 0 : undefined}
            max={field.key === 'age' ? 120 : undefined}
            step={field.key === 'age' ? 1 : undefined}
            inputMode={field.type === 'number' ? 'numeric' : undefined}
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
            onClick={() => openAlertModal()}
            className="inline-flex items-center justify-center gap-2 bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-700"
          >
            <Plus size={16} />
            Nouvelle alerte
          </button>
        </div>
      </section>

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
                              <option key={option} value={option}>{option}</option>
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
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Victime</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Province</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Statut</th>
                  <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">Suivi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {victims.map((victim) => {
                  const active = selectedVictim?.id === victim.id;
                  const alertCount = (victim.pecmuFicheId ? 1 : 0) + alerts.filter((alert) => alert.victimId === victim.id).length;
                  const actCount = victim.pecmuFicheId
                    ? (medicalActCounts[victim.pecmuFicheId] ?? 0)
                    : medicalActs.filter((act) => act.victimId === victim.id).length;

                  return (
                    <tr
                      key={victim.id}
                      onClick={() => {
                        setSelectedVictim(victim);
                        if (victim.pecmuFicheId) setOpenDossierId(victim.pecmuFicheId);
                      }}
                      className={`cursor-pointer transition-colors ${active ? 'bg-primary-50' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-950">{getVictimName(victim)}</div>
                        <div className="text-xs text-slate-500">{victim.reference || victim.codeUnique || `ID ${victim.id}`}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{victim.province || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{victim.status || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">{alertCount} F2</div>
                        <div className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">{actCount} actes</div>
                      </td>
                    </tr>
                  );
                })}
                {!loadingVictims && victims.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">Aucune victime PECMU trouvée.</td>
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

      <Modal show={showAlertModal} onClose={() => setShowAlertModal(false)} size="7xl">
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
              <div className="text-[11px] font-black uppercase tracking-[0.35em] !text-red-600">Nouvelle alerte</div>
              <h2 className="mt-2 text-2xl font-black !text-gray-950 md:text-3xl">Fiche identification cas</h2>
              <p className="mt-1 text-sm !text-gray-500 md:text-base">Signalement d’une victime en situation d’urgence médicale.</p>
            </div>

            <div className="max-h-[calc(100vh-230px)] overflow-y-auto px-4 py-5 md:px-7">
              <div className="space-y-5">
                {f2Sections.map((section) => (
                  <section key={section.title} className="border !border-gray-200 !bg-white p-4 md:p-5">
                    <h3 className="mb-4 text-sm font-black uppercase tracking-wide !text-gray-800">{section.title}</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {section.fields.map(renderF2Field)}
                    </div>
                  </section>
                ))}

                <section className="border !border-gray-200 !bg-white p-4 md:p-5">
                  <h3 className="mb-4 text-sm font-black uppercase tracking-wide !text-gray-800">Plaintes détaillées</h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {complaintFields.map((field) => {
                      const key = `plainte_${field}`;
                      return (
                        <label key={field} className="flex items-center justify-between gap-3 border !border-gray-200 px-3 py-2 text-sm">
                          <span className="font-medium !text-gray-700">{field}</span>
                          <select className="border !border-gray-300 px-2 py-1 text-sm" value={alertValues[key] || 'Non'} onChange={(event) => setAlertValues((prev) => ({ ...prev, [key]: event.target.value }))}>
                            <option>Oui</option>
                            <option>Non</option>
                          </select>
                        </label>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t !border-gray-200 bg-white px-4 py-4 md:px-7">
              <button type="button" onClick={() => setShowAlertModal(false)} className="border !border-gray-300 px-4 py-2 text-sm font-bold !text-gray-700 hover:!bg-gray-50">Annuler</button>
              <button type="submit" disabled={submittingAlert} className="inline-flex items-center gap-2 !bg-red-600 px-4 py-2 text-sm font-bold text-white hover:!bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                <Save size={16} />
                {submittingAlert ? 'Enregistrement...' : 'Enregistrer l’alerte F2'}
              </button>
            </div>
          </form>
        </ModalBody>
      </Modal>

      {openDossierId ? (
        <PecmuDossierModal
          ficheId={openDossierId}
          fetcher={fetcher}
          onClose={() => setOpenDossierId(null)}
          onChanged={loadVictims}
        />
      ) : null}
    </div>
  );
};

export default PecmuModulePage;
