/**
 * Mock data service pour le module réparations.
 * Ces données sont temporaires — elles seront remplacées par des appels API réels.
 * Chaque fonction retourne des données typées, prêtes à être swappées avec un fetcher.
 */

import type {
  DashboardCentralKpis,
  BaremeIndemnisation,
  TimelineStep,
} from '../types/programmes';

type CountStat = { label: string; count: number; color: string };
type ProgressionLucStats = {
  medicale: CountStat[];
  psychologique: CountStat[];
  economique: CountStat[];
};
type CliniqueParCamp = {
  camp: string;
  clinique1: boolean;
  clinique2: boolean;
  clinique3: boolean;
  clinique4: boolean;
  total: number;
};
type MusoAvecStats = {
  totalMutuelles: number;
  membresInscrits: number;
  paiementsEffectues: number;
  montantTotalUSD: number;
  mutuelles: Array<{ nom: string; membres: number; paiements: number; montant: number }>;
};
type PecmuKpis = {
  totalVictimes: number;
  chirurgies: { enCours: number; terminees: number };
  soinsDomicile: { enCours: number; terminees: number };
  suivis: { enCours: number; terminees: number };
  psychologique: { enCours: number; terminees: number };
  partenaires: Array<{ nom: string; domaine: string; victimesPrises: number }>;
  parEtatVictimisation: Array<{ etat: string; count: number }>;
};
type VictimesRepareesStats = {
  total: number;
  parProgramme: Array<{ programme: string; count: number }>;
  parProvince: Array<{ province: string; count: number }>;
  parMois: Array<{ mois: string; count: number }>;
};
type ProgressionParZone = { zone: string; luc: number; mpu: number; pecmu: number; reparees: number };
type RapportStats = {
  tendanceMensuelle: Array<{ mois: string; nouvelles: number; contrats: number; indemnisees: number }>;
  couvertureGeographique: { provinces: number; territoires: number; villages: number };
};

// ─── Dashboard Central KPIs ───
export const getMockDashboardKpis = (): DashboardCentralKpis => ({
  totalVictimesLuc: 0,
  totalVictimesMpu: 0,
  totalVictimesPecmu: 0,
  totalVictimesReparees: 0,
  contratsSignesLuc: 0,
  consentsSignesMpu: 0,
  progressionMedicaleLuc: { evaluees: 0, enCours: 0, terminees: 0 },
  progressionPsyLuc: { enCours: 0, terminees: 0 },
  progressionEcoLuc: { enCours: 0, terminees: 0 },
  indemnisationLuc: { p0: 0, p25: 0, p50: 0, p75: 0, p100: 0 },
  progressionMpu: { formes: 0, consultations: 0 },
});

// ─── Barème d'indemnisation LUC ───
export const getMockBareme = (): BaremeIndemnisation[] => [
  { prejudice: 'Meurtre', montantMin: 0, montantMax: 0, devise: 'USD' },
  { prejudice: 'Violence sexuelle', montantMin: 0, montantMax: 0, devise: 'USD' },
  { prejudice: 'Amputation', montantMin: 0, montantMax: 0, devise: 'USD' },
  { prejudice: 'Blessure grave', montantMin: 0, montantMax: 0, devise: 'USD' },
  { prejudice: 'Préjudice moral', montantMin: 0, montantMax: 0, devise: 'USD' },
  { prejudice: 'Préjudice matériel', montantMin: 0, montantMax: 0, devise: 'USD' },
  { prejudice: 'Torture', montantMin: 0, montantMax: 0, devise: 'USD' },
  { prejudice: 'Esclavage sexuel', montantMin: 0, montantMax: 0, devise: 'USD' },
  { prejudice: 'Recrutement enfants', montantMin: 0, montantMax: 0, devise: 'USD' },
  { prejudice: 'Déplacement forcé', montantMin: 0, montantMax: 0, devise: 'USD' },
];

// ─── Indemnisation LUC par tranche ───
export const getMockIndemnisationByPourcentage = (): CountStat[] => [
  { label: '0%', count: 0, color: '#ef4444' },
  { label: '25%', count: 0, color: '#f97316' },
  { label: '50%', count: 0, color: '#eab308' },
  { label: '75%', count: 0, color: '#22c55e' },
  { label: '100%', count: 0, color: '#10b981' },
];

// ─── Progression par type LUC ───
export const getMockProgressionLucStats = (): ProgressionLucStats => ({
  medicale: [
    { label: 'Évaluées', count: 0, color: '#6366f1' },
    { label: 'En cours', count: 0, color: '#f59e0b' },
    { label: 'Terminées', count: 0, color: '#10b981' },
  ],
  psychologique: [
    { label: 'En cours', count: 0, color: '#f59e0b' },
    { label: 'Terminées', count: 0, color: '#10b981' },
  ],
  economique: [
    { label: 'Formation métier', count: 0, color: '#6366f1' },
    { label: 'Éducation formelle', count: 0, color: '#8b5cf6' },
    { label: 'Alphabétisation', count: 0, color: '#a78bfa' },
    { label: 'Activités génératrices de revenu', count: 0, color: '#10b981' },
  ],
});

// ─── MPU — Cliniques mobiles par camp ───
export const getMockCliniquesParCamp = (): CliniqueParCamp[] => [];

// ─── MPU — MUSO/AVEC ───
export const getMockMusoAvecStats = (): MusoAvecStats => ({
  totalMutuelles: 0,
  membresInscrits: 0,
  paiementsEffectues: 0,
  montantTotalUSD: 0,
  mutuelles: [],
});

// ─── PECMU — KPIs ───
export const getMockPecmuKpis = (): PecmuKpis => ({
  totalVictimes: 0,
  chirurgies: { enCours: 0, terminees: 0 },
  soinsDomicile: { enCours: 0, terminees: 0 },
  suivis: { enCours: 0, terminees: 0 },
  psychologique: { enCours: 0, terminees: 0 },
  partenaires: [],
  parEtatVictimisation: [],
});

// ─── PECMU — Timeline médicale type ───
export const getMockPecmuTimeline = (): TimelineStep[] => [
  { key: 'identification', label: 'Identification', statut: 'non_commence' },
  { key: 'evaluation', label: 'Évaluation médicale', statut: 'non_commence' },
  { key: 'chirurgie', label: 'Chirurgie', statut: 'non_commence' },
  { key: 'soins', label: 'Soins à domicile', statut: 'non_commence' },
  { key: 'suivi', label: 'Suivi médical', statut: 'non_commence' },
  { key: 'psychologique', label: 'Accompagnement psychologique', statut: 'non_commence' },
  { key: 'cloture', label: 'Clôture', statut: 'non_commence' },
];

// ─── Victimes totalement réparées — stats ───
export const getMockVictimesReparees = (): VictimesRepareesStats => ({
  total: 0,
  parProgramme: [],
  parProvince: [],
  parMois: [],
});

// ─── Progression par zones ───
export const getMockProgressionParZone = (): ProgressionParZone[] => [];

// ─── Stats onglet rapports ───
export const getMockRapportStats = (): RapportStats => ({
  tendanceMensuelle: [],
  couvertureGeographique: {
    provinces: 0,
    territoires: 0,
    villages: 0,
  },
});
