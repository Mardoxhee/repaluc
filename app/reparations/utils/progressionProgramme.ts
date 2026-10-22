import type { Programme } from '../services/victimProgressionApi';

// The admission status is only a routing hint when the programme is missing.
// The progression endpoint still validates the victim's actual mention.
export function progressionProgramme(victim: { mention?: string; status?: string }, fallback = ''): Programme | null {
  const mention = String(victim.mention || '').trim().toUpperCase();
  if (mention === 'LUC' || mention === 'MPU') return mention;
  if (mention && !['NON DEFINI', 'NON DÉFINI', 'NON RENSEIGNÉ', 'NON RENSEIGNE', 'NULL', '-'].includes(mention)) return null;
  const status = String(victim.status || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
  if (/^ADMIS(?:E)?\s+(?:A\s+LA\s+|A\s+L['’]|AU\s+)(LUC|MPU)$/.test(status)) return status.endsWith('LUC') ? 'LUC' : 'MPU';
  const scope = fallback.trim().toUpperCase();
  return scope === 'LUC' || scope === 'MPU' ? scope : null;
}
