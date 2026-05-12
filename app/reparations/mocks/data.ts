/**
 * Mock data service pour le module réparations.
 * Ces données sont temporaires — elles seront remplacées par des appels API réels.
 * Chaque fonction retourne des données typées, prêtes à être swappées avec un fetcher.
 */

import type {
  DashboardCentralKpis,
  VictimeEnrichie,
  BaremeIndemnisation,
  CliniqueMobile,
  MusoAvec,
  ProgressionLuc,
  ProgressionMpu,
  ProgressionPecmu,
  TimelineStep,
} from '../types/programmes';

// ─── Dashboard Central KPIs ───
export const getMockDashboardKpis = (): DashboardCentralKpis => ({
  totalVictimesLuc: 4283,
  totalVictimesMpu: 1847,
  totalVictimesPecmu: 312,
  totalVictimesReparees: 189,
  contratsSignesLuc: 3102,
  consentsSignesMpu: 1540,
  progressionMedicaleLuc: { evaluees: 2801, enCours: 1204, terminees: 890 },
  progressionPsyLuc: { enCours: 1580, terminees: 720 },
  progressionEcoLuc: { enCours: 980, terminees: 450 },
  indemnisationLuc: { p0: 1200, p25: 1050, p50: 890, p75: 654, p100: 489 },
  progressionMpu: { formes: 920, consultations: 3412 },
});

// ─── Barème d'indemnisation LUC ───
export const getMockBareme = (): BaremeIndemnisation[] => [
  { prejudice: 'Meurtre', montantMin: 5000, montantMax: 15000, devise: 'USD' },
  { prejudice: 'Violence sexuelle', montantMin: 3000, montantMax: 12000, devise: 'USD' },
  { prejudice: 'Amputation', montantMin: 4000, montantMax: 14000, devise: 'USD' },
  { prejudice: 'Blessure grave', montantMin: 2000, montantMax: 8000, devise: 'USD' },
  { prejudice: 'Préjudice moral', montantMin: 1000, montantMax: 5000, devise: 'USD' },
  { prejudice: 'Préjudice matériel', montantMin: 500, montantMax: 3000, devise: 'USD' },
  { prejudice: 'Torture', montantMin: 3000, montantMax: 10000, devise: 'USD' },
  { prejudice: 'Esclavage sexuel', montantMin: 4000, montantMax: 13000, devise: 'USD' },
  { prejudice: 'Recrutement enfants', montantMin: 2000, montantMax: 8000, devise: 'USD' },
  { prejudice: 'Déplacement forcé', montantMin: 1000, montantMax: 5000, devise: 'USD' },
];

// ─── Indemnisation LUC par tranche ───
export const getMockIndemnisationByPourcentage = () => [
  { label: '0%', count: 1200, color: '#ef4444' },
  { label: '25%', count: 1050, color: '#f97316' },
  { label: '50%', count: 890, color: '#eab308' },
  { label: '75%', count: 654, color: '#22c55e' },
  { label: '100%', count: 489, color: '#10b981' },
];

// ─── Progression par type LUC ───
export const getMockProgressionLucStats = () => ({
  medicale: [
    { label: 'Évaluées', count: 2801, color: '#6366f1' },
    { label: 'En cours', count: 1204, color: '#f59e0b' },
    { label: 'Terminées', count: 890, color: '#10b981' },
  ],
  psychologique: [
    { label: 'En cours', count: 1580, color: '#f59e0b' },
    { label: 'Terminées', count: 720, color: '#10b981' },
  ],
  economique: [
    { label: 'Formation métier', count: 420, color: '#6366f1' },
    { label: 'Éducation formelle', count: 210, color: '#8b5cf6' },
    { label: 'Alphabétisation', count: 180, color: '#a78bfa' },
    { label: 'Activités génératrices de revenu', count: 170, color: '#10b981' },
  ],
});

// ─── MPU — Cliniques mobiles par camp ───
export const getMockCliniquesParCamp = () => [
  { camp: 'Camp Bulengo', clinique1: true, clinique2: true, clinique3: true, clinique4: false, total: 342 },
  { camp: 'Camp Lushebere', clinique1: true, clinique2: true, clinique3: false, clinique4: false, total: 287 },
  { camp: 'Camp Rusayo', clinique1: true, clinique2: false, clinique3: false, clinique4: false, total: 198 },
  { camp: 'Camp Mugunga', clinique1: true, clinique2: true, clinique3: true, clinique4: true, total: 410 },
  { camp: 'Camp Kanyaruchinya', clinique1: true, clinique2: true, clinique3: false, clinique4: false, total: 310 },
  { camp: 'Camp Nzulo', clinique1: true, clinique2: false, clinique3: false, clinique4: false, total: 150 },
];

// ─── MPU — MUSO/AVEC ───
export const getMockMusoAvecStats = () => ({
  totalMutuelles: 14,
  membresInscrits: 834,
  paiementsEffectues: 612,
  montantTotalUSD: 18340,
  mutuelles: [
    { nom: 'MUSO Bulengo A', membres: 120, paiements: 98, montant: 2940 },
    { nom: 'AVEC Lushebere', membres: 85, paiements: 72, montant: 2160 },
    { nom: 'MUSO Rusayo', membres: 95, paiements: 80, montant: 2400 },
    { nom: 'AVEC Mugunga Nord', membres: 110, paiements: 95, montant: 2850 },
    { nom: 'MUSO Kanyaruchinya', membres: 78, paiements: 65, montant: 1950 },
    { nom: 'AVEC Nzulo Centre', membres: 68, paiements: 52, montant: 1560 },
  ],
});

// ─── PECMU — KPIs ───
export const getMockPecmuKpis = () => ({
  totalVictimes: 312,
  chirurgies: { enCours: 45, terminees: 89 },
  soinsDomicile: { enCours: 102, terminees: 67 },
  suivis: { enCours: 78, terminees: 55 },
  psychologique: { enCours: 120, terminees: 42 },
  partenaires: [
    { nom: 'Panzi Foundation', domaine: 'Chirurgie', victimesPrises: 84 },
    { nom: 'Médecins du Monde', domaine: 'Soins généraux', victimesPrises: 67 },
    { nom: 'HEAL Africa', domaine: 'Chirurgie + Suivi', victimesPrises: 52 },
    { nom: 'IMC', domaine: 'Santé mentale', victimesPrises: 45 },
    { nom: 'MSF', domaine: 'Urgences', victimesPrises: 38 },
    { nom: 'Malteser International', domaine: 'Soins à domicile', victimesPrises: 26 },
  ],
  parEtatVictimisation: [
    { etat: 'Certifiée', count: 189 },
    { etat: 'Identifiée', count: 98 },
    { etat: 'Autre', count: 25 },
  ],
});

// ─── PECMU — Timeline médicale type ───
export const getMockPecmuTimeline = (): TimelineStep[] => [
  { key: 'identification', label: 'Identification', statut: 'terminee', date: '2024-01-15', description: 'Victime identifiée et enregistrée' },
  { key: 'evaluation', label: 'Évaluation médicale', statut: 'terminee', date: '2024-02-01', description: 'Évaluation initiale réalisée' },
  { key: 'chirurgie', label: 'Chirurgie', statut: 'en_cours', date: '2024-03-10', description: 'Intervention chirurgicale programmée' },
  { key: 'soins', label: 'Soins à domicile', statut: 'non_commence' },
  { key: 'suivi', label: 'Suivi médical', statut: 'non_commence' },
  { key: 'psychologique', label: 'Accompagnement psychologique', statut: 'non_commence' },
  { key: 'cloture', label: 'Clôture', statut: 'non_commence' },
];

// ─── Victimes totalement réparées — stats ───
export const getMockVictimesReparees = () => ({
  total: 189,
  parProgramme: [
    { programme: 'LUC', count: 142 },
    { programme: 'MPU', count: 35 },
    { programme: 'PECMU', count: 12 },
  ],
  parProvince: [
    { province: 'Nord-Kivu', count: 78 },
    { province: 'Sud-Kivu', count: 52 },
    { province: 'Ituri', count: 34 },
    { province: 'Tanganyika', count: 15 },
    { province: 'Haut-Katanga', count: 10 },
  ],
  parMois: [
    { mois: 'Jan', count: 12 },
    { mois: 'Fév', count: 18 },
    { mois: 'Mar', count: 22 },
    { mois: 'Avr', count: 15 },
    { mois: 'Mai', count: 28 },
    { mois: 'Jun', count: 31 },
    { mois: 'Jul', count: 19 },
    { mois: 'Aoû', count: 24 },
    { mois: 'Sep', count: 20 },
  ],
});

// ─── Progression par zones ───
export const getMockProgressionParZone = () => [
  { zone: 'Nord-Kivu', luc: 1820, mpu: 780, pecmu: 134, reparees: 78 },
  { zone: 'Sud-Kivu', luc: 1340, mpu: 520, pecmu: 98, reparees: 52 },
  { zone: 'Ituri', luc: 680, mpu: 340, pecmu: 52, reparees: 34 },
  { zone: 'Tanganyika', luc: 280, mpu: 120, pecmu: 18, reparees: 15 },
  { zone: 'Haut-Katanga', luc: 163, mpu: 87, pecmu: 10, reparees: 10 },
];

// ─── Stats onglet rapports ───
export const getMockRapportStats = () => ({
  tendanceMensuelle: [
    { mois: 'Jan', nouvelles: 120, contrats: 85, indemnisees: 42 },
    { mois: 'Fév', nouvelles: 145, contrats: 102, indemnisees: 56 },
    { mois: 'Mar', nouvelles: 98, contrats: 120, indemnisees: 68 },
    { mois: 'Avr', nouvelles: 167, contrats: 95, indemnisees: 74 },
    { mois: 'Mai', nouvelles: 134, contrats: 140, indemnisees: 89 },
    { mois: 'Jun', nouvelles: 156, contrats: 130, indemnisees: 95 },
    { mois: 'Jul', nouvelles: 112, contrats: 108, indemnisees: 82 },
    { mois: 'Aoû', nouvelles: 189, contrats: 155, indemnisees: 101 },
    { mois: 'Sep', nouvelles: 143, contrats: 138, indemnisees: 92 },
  ],
  couvertureGeographique: {
    provinces: 5,
    territoires: 23,
    villages: 142,
  },
});
