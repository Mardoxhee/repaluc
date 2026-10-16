import type { FichePecmu, PecmuFetcher } from './pecmuApi';
import { getFichePecmu, updateFichePecmu } from './pecmuPrototype';

export const consentLabels = {
  care: 'Consentement à la prise en charge médicale',
  transfer: 'Consentement au transfert médical',
  procedure: 'Consentement à l’acte médical',
  refusal: 'Formulaire de refus',
} as const;
export type ConsentKind = keyof typeof consentLabels;
export type Outcome = 'Stabilisé/guéri' | 'Décédé' | 'Transféré à un niveau supérieur' | 'Perdu de vue';
export type CareEpisode = {
  number: 1 | 2; structure: string; summary: string; openedAt: string;
  outcome?: Outcome; endedAt?: string; transferConsentId?: number;
};
export type PecmuWorkflow = {
  version: 1;
  certification?: { consentId: number; uploadedAt: string };
  pool?: { eligible: boolean; reason: string; decidedAt: string };
  consents: Array<{ id: number; kind: ConsentKind; signedAt: string }>;
  acts: Array<{ id: number; consentId: number; episode: number }>;
  episodes: CareEpisode[];
  closedAt?: string;
};
export function readWorkflow(fiche: FichePecmu): PecmuWorkflow {
  const state = fiche.pecmuWorkflow as PecmuWorkflow | undefined;
  return state || { version: 1, consents: [], acts: [], episodes: [] };
}
export function workflowAccess(workflow: PecmuWorkflow, availableConsentIds: number[]) {
  const exists = (id: number) => availableConsentIds.includes(id);
  const certified = Boolean(workflow.certification && exists(workflow.certification.consentId));
  const eligible = certified && workflow.pool?.eligible === true;
  const care = eligible && workflow.consents.some(c => c.kind === 'care' && exists(c.id));
  return { certification: true, pool: certified, consents: eligible, care };
}
export function assertMedicalActAllowed(workflow: PecmuWorkflow, availableConsentIds: number[], consentId: number) {
  if (workflow.closedAt) throw new Error('Ce dossier est déjà clôturé.');
  if (!workflowAccess(workflow, availableConsentIds).care || !workflow.episodes.length) throw new Error('La prise en charge n’est pas encore ouverte.');
  if (!availableConsentIds.includes(consentId) || !workflow.consents.some(c => c.id === consentId && c.kind === 'procedure')) throw new Error('Sélectionnez un consentement à l’acte médical signé.');
  if (workflow.acts.some(act => act.consentId === consentId)) throw new Error('Ce consentement est déjà associé à un acte médical.');
}
export function finishEpisode(workflow: PecmuWorkflow, outcome: Outcome, summary: string, destination?: string, transferConsentId?: number): PecmuWorkflow {
  if (workflow.closedAt) throw new Error('Ce dossier est déjà clôturé.');
  const current = workflow.episodes.at(-1);
  if (!current) throw new Error('Ouvrez une fiche de prise en charge.');
  if (!summary.trim()) throw new Error('Renseignez la synthèse médicale.');
  if (current.number === 2 && outcome !== 'Stabilisé/guéri' && outcome !== 'Décédé') throw new Error('La deuxième prise en charge se termine par stabilisation/guérison ou décès.');
  if (outcome === 'Transféré à un niveau supérieur' && (!destination?.trim() || !transferConsentId || !workflow.consents.some(c => c.id === transferConsentId && c.kind === 'transfer'))) throw new Error('Renseignez la structure receveuse et le consentement au transfert signé.');
  const now = new Date().toISOString();
  const episodes = workflow.episodes.map((episode, index) => index === workflow.episodes.length - 1 ? { ...episode, summary: summary.trim(), outcome, endedAt: now, ...(outcome === 'Transféré à un niveau supérieur' ? { transferConsentId } : {}) } : episode);
  if (outcome === 'Transféré à un niveau supérieur') episodes.push({ number: 2, structure: destination!.trim(), summary: summary.trim(), openedAt: now });
  return { ...workflow, episodes, ...(['Stabilisé/guéri', 'Décédé'].includes(outcome) ? { closedAt: now } : {}) };
}
/** Backend integration point: save the complete transition atomically and enforce access server-side. */
export async function saveWorkflow(fetcher: PecmuFetcher, ficheId: number, workflow: PecmuWorkflow, extra: Partial<FichePecmu> = {}) {
  await updateFichePecmu(fetcher, ficheId, { ...extra, pecmuWorkflow: workflow });
  return getFichePecmu(fetcher, ficheId);
}
export async function readSignedFile(file: File) {
  if (file.size > 10 * 1024 * 1024) throw new Error('Le document doit faire au maximum 10 Mo.');
  if (!/\.(pdf|png|jpe?g|webp)$/i.test(file.name)) throw new Error('Chargez un document PDF ou une image PNG, JPEG ou WebP.');
  const content = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('Lecture du document impossible.'));
    reader.readAsDataURL(file);
  });
  if (!content) throw new Error('Le document est vide.');
  return { filename: file.name, file: content };
}
