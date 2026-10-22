import type { VictimProgression } from '../services/victimProgressionApi';

const statusScore = (status?: string) => ({ NOT_EVALUATED: 0, NOT_STARTED: 0, PLANNED: 25, EVALUATED: 25, STARTED: 50, IN_PROGRESS: 50, COMPLETED: 100 }[status || ''] ?? 0);
const percentage = (value?: number) => Number.isFinite(value) ? Math.min(100, Math.max(0, value!)) : 0;

// Equal weighting of the programme's milestones. Optional notes, training details
// and the number of documents are not additional requirements for completion.
export function victimProgressionSummary(data: VictimProgression) {
  const { documents: d, progression: p } = data;
  const items = [
    { label: 'Photo', score: d.photoDisponible ? 100 : 0 },
    { label: 'Pièce d’identité', score: d.pieceIdentiteDisponible ? 100 : 0 },
    ...(data.victime.mention === 'LUC'
      ? [{ label: 'Contrat', score: d.contratDisponible ? 100 : 0 }]
      : [{ label: 'Consentement enregistré', score: d.consentementEnregistre ? 100 : 0 }, { label: 'Acte de consentement', score: d.acteConsentementDisponible ? 100 : 0 }]),
    { label: 'Réadaptation médicale', score: statusScore(p.medicale.statut) },
    { label: 'Réadaptation psychologique', score: statusScore(p.psychologique.statut) },
    { label: 'Accompagnement économique', score: statusScore(p.economique.statut) },
    ...(data.victime.mention === 'LUC'
      ? [{ label: 'Indemnisation', score: percentage(p.indemnisation?.pourcentage) }]
      : [{ label: 'Adhésion MUSO / AVEC', score: statusScore(p.musoAvec?.statutAdhesion) }, { label: 'Paiements MUSO / AVEC', score: percentage(p.musoAvec?.pourcentagePaiement) }]),
  ];
  const average = items.reduce((total, item) => total + item.score, 0) / items.length;
  // Never display 100% while any milestone remains incomplete.
  const percent = average === 100 ? 100 : Math.min(99, Math.round(average));
  return { percent, items, description: `Moyenne des ${items.length} étapes, à poids égal. Évaluée / planifiée : 25 % ; commencée : 50 % ; terminée : 100 %. Paiements : pourcentage réel.\n${items.map(item => `${item.label} : ${item.score.toLocaleString('fr-FR')} %`).join('\n')}` };
}
