/**
 * Temporary in-memory adapter for validating the PECMU screens before backend integration.
 * Reads existing records through the current API; writes NEVER reach that API.
 * All prototype data disappears on a full page reload. Replace this adapter with
 * transactional backend endpoints that enforce the workflow and user permissions.
 */
import * as api from './pecmuApi';
import type { ActeConsentementPecmu, ActeMedicalPecmu, FichePecmu, PecmuFetcher, SuiviAccompagnement } from './pecmuApi';

const fiches = new Map<number, FichePecmu>();
const newFicheIds = new Set<number>();
const documents = new Map<number, ActeConsentementPecmu[]>();
const acts = new Map<number, ActeMedicalPecmu[]>();
const followups = new Map<number, SuiviAccompagnement[]>();
let nextId = -1;
export const isPrototypeId = (id: number) => id < 0;
export const listPrototypeFiches = () => [...newFicheIds].map(id => fiches.get(id)!).reverse();
export async function createFichePecmu(_fetcher: PecmuFetcher, values: Record<string, string>) {
  const record: FichePecmu = { ...api.mapF2ValuesToFichePecmuPayload(values), id: nextId--, createdAt: new Date().toISOString() };
  fiches.set(record.id, record); newFicheIds.add(record.id);
  return structuredClone(record);
}
export async function getFichePecmu(fetcher: PecmuFetcher, id: number): Promise<FichePecmu> {
  if (!fiches.has(id)) fiches.set(id, await api.getFichePecmu(fetcher, id));
  return structuredClone(fiches.get(id)!);
}
export async function updateFichePecmu(fetcher: PecmuFetcher, id: number, payload: Partial<FichePecmu>) {
  const record = { ...await getFichePecmu(fetcher, id), ...payload, id, updatedAt: new Date().toISOString() };
  fiches.set(id, record);
  return structuredClone(record);
}
export async function listConsentementsByFiche(fetcher: PecmuFetcher, id: number) {
  if (!documents.has(id)) documents.set(id, isPrototypeId(id) ? [] : await api.listConsentementsByFiche(fetcher, id));
  return structuredClone(documents.get(id)!);
}
export async function createConsentementPecmu(fetcher: PecmuFetcher, payload: Omit<ActeConsentementPecmu, 'id'>) {
  await listConsentementsByFiche(fetcher, payload.fichePecmuId);
  const record = { ...payload, id: nextId--, createdAt: new Date().toISOString() };
  documents.get(payload.fichePecmuId)!.push(record);
  return structuredClone(record);
}
export async function listActesMedicauxByFiche(fetcher: PecmuFetcher, id: number) {
  if (!acts.has(id)) acts.set(id, isPrototypeId(id) ? [] : await api.listActesMedicauxByFiche(fetcher, id));
  return structuredClone(acts.get(id)!);
}
export async function createActeMedicalPecmu(fetcher: PecmuFetcher, payload: Omit<ActeMedicalPecmu, 'id'>) {
  if (!payload.fichePecmuId) throw new Error('Dossier manquant.');
  await listActesMedicauxByFiche(fetcher, payload.fichePecmuId);
  const record = { ...payload, id: nextId--, createdAt: new Date().toISOString() };
  acts.get(payload.fichePecmuId)!.push(record);
  return structuredClone(record);
}
export async function listSuivisByFiche(fetcher: PecmuFetcher, id: number) {
  if (!followups.has(id)) followups.set(id, isPrototypeId(id) ? [] : await api.listSuivisByFiche(fetcher, id));
  return structuredClone(followups.get(id)!);
}
export async function createSuiviAccompagnement(fetcher: PecmuFetcher, payload: Omit<SuiviAccompagnement, 'id'>) {
  await listSuivisByFiche(fetcher, payload.fichePecmuId);
  const record = { ...payload, id: nextId--, createdAt: new Date().toISOString() };
  followups.get(payload.fichePecmuId)!.push(record);
  return structuredClone(record);
}
