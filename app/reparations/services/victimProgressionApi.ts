import { authenticatedFetch } from '../../utils/authFetch';

export type Programme = 'LUC' | 'MPU';
export type FollowStatus = 'NOT_STARTED' | 'STARTED' | 'COMPLETED';
export type Training = 'TRADE' | 'FORMAL_EDUCATION' | 'LITERACY' | 'OTHER';
export type ProgressionPatch = {
  medicalStatus?: 'NOT_EVALUATED' | 'EVALUATED' | 'STARTED' | 'COMPLETED' | null;
  psychologicalStatus?: FollowStatus | null; economicStatus?: FollowStatus | null;
  trainingType?: Training | null; trainingDetails?: string | null;
  incomeGeneratingActivities?: string[]; medicalNotes?: string | null;
  psychologicalNotes?: string | null; economicNotes?: string | null;
};
export type Clinic = { id: number; numero: number; libelle: string; date: string | null; camp: string | null; statut: string; mesures: string[]; observations: string | null; partenaire: { id: number; structure: string } | null };
export type Payment = { id: number; montant: number; date: string; mode: string | null; reference: string | null; notes: string | null };
export type Membership = { id: number; type: string; nom: string; statutAdhesion: string; dateAdhesion: string | null; montantAttendu: number; montantPaye: number; montantRestant: number; pourcentagePaiement: number; statutPaiement: string; notes: string | null; paiements: Payment[] };
export type VictimProgression = {
  victime: { id: number; nom: string; mention: Programme; camps?: string[] };
  documents: { photoDisponible: boolean; pieceIdentiteDisponible: boolean; contratDisponible?: boolean; consentementEnregistre?: boolean; acteConsentementDisponible?: boolean; nombreDocuments: number };
  prejudices?: { typeViolation: string | null; prejudicesSubis: string | null; prejudiceFinal: string | null; reparations: string | null; programme: string | null };
  contrat?: { id: number; dateSignature: string; typeContrat: string; montantTotalUSD: number; mesuresReparationAcceptees: string[]; mesuresReparationRenoncees: string[] } | null;
  consentement?: { decision: string; accepte: boolean; date: string; lieu: string; signe: boolean; mesuresProposees: string[]; autresMesures: string | null; vulnerabilites: string[] } | null;
  progression: {
    medicale: { statut: string; notes?: string | null; nombreEvaluations?: number; derniereEvaluation?: string | null; nombreCliniques?: number; nombreCliniquesTerminees?: number; cliniques?: Clinic[] };
    psychologique: { statut: FollowStatus; notes: string | null };
    economique: { statut: FollowStatus; formation: { type: Training | null; precision: string | null }; activitesGeneratricesRevenus: string[]; notes: string | null };
    indemnisation?: { statut: string; mecanismesPaiement: string[]; montantTotal: number; montantPaye: number; montantRestant: number; pourcentage: number; palier: number; tranchesPayees: number; nombreTranches: number; sourcePaiements: string; tranches: Array<{ id: number; periode: string; montantUSD: number; statut: string; datePaiementEffectif: string | null; modePaiement: string | null; payee: boolean }> };
    musoAvec?: Membership | null;
  };
  suivi: { renseigne: boolean; misAJourLe: string | null; misAJourPar: string | null };
};
export class ProgressionError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function progressionRequest(path: string, method = 'GET', payload?: unknown, signal?: AbortSignal): Promise<VictimProgression> {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  const response = await authenticatedFetch(`${base}${path}`, {
    method, cache: 'no-store', signal,
    ...(payload === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new ProgressionError(response.status, response.status === 403 ? 'Vous ne disposez pas des habilitations nécessaires pour cette opération.' : (Array.isArray(body?.message) ? body.message.join(' · ') : body?.message) || `Impossible de charger ou enregistrer la progression (${response.status}).`);
  if (!body?.victime || !body?.progression) throw new Error('Réponse de progression incomplète. Actualisez pour vérifier les données enregistrées.');
  return body;
}
export const progressionPath = (id: number | string, programme: Programme) => `/victime/${encodeURIComponent(id)}/${programme === 'MPU' ? 'progression-mpu' : 'progression-reparation'}`;
export function progressionFields(data: VictimProgression): ProgressionPatch {
  const p = data.progression;
  return {
    ...(data.victime.mention === 'LUC' ? { medicalStatus: p.medicale.statut as ProgressionPatch['medicalStatus'], medicalNotes: p.medicale.notes ?? null } : {}),
    psychologicalStatus: p.psychologique.statut, psychologicalNotes: p.psychologique.notes ?? null,
    economicStatus: p.economique.statut, economicNotes: p.economique.notes ?? null,
    trainingType: p.economique.formation?.type ?? null, trainingDetails: p.economique.formation?.precision ?? null,
    incomeGeneratingActivities: p.economique.activitesGeneratricesRevenus ?? [],
  };
}
export function progressionChanges(before: ProgressionPatch, after: ProgressionPatch): ProgressionPatch {
  const activities = after.incomeGeneratingActivities ?? [];
  if (activities.length > 50 || activities.some(v => v.length > 255) || new Set(activities).size !== activities.length) throw new Error('Saisissez au maximum 50 activités uniques de 255 caractères chacune.');
  if ((after.trainingDetails?.length ?? 0) > 2000 || [after.medicalNotes, after.psychologicalNotes, after.economicNotes].some(v => (v?.length ?? 0) > 5000)) throw new Error('Les précisions sont limitées à 2 000 caractères et les notes à 5 000 caractères.');
  return Object.fromEntries(Object.entries(after).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(before[key as keyof ProgressionPatch]))) as ProgressionPatch;
}
