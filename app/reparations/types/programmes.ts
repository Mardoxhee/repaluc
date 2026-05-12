// ─── Types partagés pour tous les programmes de réparation ───

export type ProgrammeKey = 'luc' | 'mpu' | 'pecmu' | 'reparees';

// ─── Statuts de progression génériques ───
export type ProgressionStatut =
  | 'non_commence'
  | 'evaluee'
  | 'en_cours'
  | 'terminee';

export type IndemnisationPourcentage = 0 | 25 | 50 | 75 | 100;

export type EtatVictimisation = 'certifiee' | 'identifiee' | 'autre';

// ─── Étape de timeline générique ───
export interface TimelineStep {
  key: string;
  label: string;
  statut: ProgressionStatut;
  date?: string;
  description?: string;
}

// ─── Progression LUC ───
export interface ProgressionMedicale {
  statut: ProgressionStatut; // evaluee, en_cours, terminee
  dateDebut?: string;
  dateFin?: string;
}

export interface ProgressionPsychologique {
  statut: ProgressionStatut; // en_cours, terminee
  dateDebut?: string;
  dateFin?: string;
}

export interface ProgressionEconomique {
  type: 'formation_metier' | 'education_formelle' | 'alphabetisation' | 'autre_formation' | 'activite_generatrice_revenu';
  precision?: string;
  statut: ProgressionStatut;
}

export interface ProgressionIndemnisation {
  pourcentage: IndemnisationPourcentage;
  mecanismePaiement: 'banque' | 'telephone' | 'autre';
  precisionMecanisme?: string;
  tranches: TrancheIndemnisation[];
}

export interface TrancheIndemnisation {
  numero: number;
  montantUSD: number;
  statut: 'payee' | 'en_cours' | 'a_venir';
  datePaiement?: string;
}

export interface ProgressionLuc {
  medicale: ProgressionMedicale;
  psychologique: ProgressionPsychologique;
  economique: ProgressionEconomique;
  indemnisation: ProgressionIndemnisation;
}

// ─── Progression MPU ───
export interface CliniqueMobile {
  numero: number; // 1-4
  date?: string;
  lieu?: string;
  effectuee: boolean;
}

export interface MusoAvec {
  nomMutuelle: string;
  paiementEffectue: boolean;
  montant?: number;
  date?: string;
}

export interface ProgressionMpu {
  cliniques: CliniqueMobile[];
  psychologique: ProgressionPsychologique;
  economique: ProgressionEconomique;
  musoAvec?: MusoAvec;
}

// ─── Progression PECMU ───
export interface AspectMedical {
  chirurgie: { statut: ProgressionStatut; details?: string };
  soinsDomicile: { statut: ProgressionStatut; details?: string };
  suivi: { statut: ProgressionStatut; details?: string };
}

export interface ProgressionPecmu {
  etatVictimisation: EtatVictimisation;
  prejudiceTotal?: string;
  prejudicePriseEnCharge?: string;
  partenaire?: string;
  aspectsMedicaux: AspectMedical;
  psychologique: ProgressionPsychologique;
  autresAspects?: string;
}

// ─── Victime enrichie avec progression par programme ───
export interface VictimeEnrichie {
  id: number;
  nom?: string;
  prenom?: string;
  sexe?: string;
  age?: number;
  dateNaissance?: string;
  province?: string;
  territoire?: string;
  commune?: string;
  village?: string;
  categorie?: string;
  programme?: ProgrammeKey;
  dossier?: string;
  photo?: string | null;
  avatar?: string;
  status?: string;
  typeViolation?: string;
  prejudicesSubis?: string;
  prejudiceFinal?: string;

  // Progressions par programme
  progressionLuc?: ProgressionLuc;
  progressionMpu?: ProgressionMpu;
  progressionPecmu?: ProgressionPecmu;

  // Champs transversaux
  contratSigne?: boolean;
  consentementSigne?: boolean;
  dateContrat?: string;
  indemnisation?: number;

  // Flag "totalement réparée"
  totalementReparee?: boolean;
}

// ─── KPIs Dashboard Central ───
export interface DashboardCentralKpis {
  totalVictimesLuc: number;
  totalVictimesMpu: number;
  totalVictimesPecmu: number;
  totalVictimesReparees: number;
  contratsSignesLuc: number;
  consentsSignesMpu: number;
  progressionMedicaleLuc: { evaluees: number; enCours: number; terminees: number };
  progressionPsyLuc: { enCours: number; terminees: number };
  progressionEcoLuc: { enCours: number; terminees: number };
  indemnisationLuc: { p0: number; p25: number; p50: number; p75: number; p100: number };
  progressionMpu: { formes: number; consultations: number };
}

// ─── Bareme d'indemnisation ───
export interface BaremeIndemnisation {
  prejudice: string;
  montantMin: number;
  montantMax: number;
  devise: string;
}
