"use client";

export type IndemnisationGaugeDatum = {
  label: string;
  count: number;
  color: string;
};

export type IndemnisationDashboardStats = {
  totalContrats: number;
  totalPlanifieUSD: number;
  totalVerseUSD: number;
  totalRestantUSD: number;
  contratsAvecPaiement: number;
  plansPayes: number;
  plansEnCours: number;
  plansPlanifies: number;
  gaugeData: IndemnisationGaugeDatum[];
};

type AnyRecord = Record<string, any>;

const GAUGE_COLORS: Record<string, string> = {
  '0%': '#ef4444',
  '25%': '#f97316',
  '50%': '#eab308',
  '75%': '#22c55e',
  '100%': '#10b981',
};

export const normalizeApiList = (payload: any): AnyRecord[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const toNumber = (value: any): number => {
  const numeric = typeof value === 'string' ? Number(value.replace(',', '.')) : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeText = (value: any): string => {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
};

const isPaidPlan = (plan: AnyRecord): boolean => {
  const statut = normalizeText(plan?.statut);
  return statut.includes('effectue') || statut.includes('paye') || statut === 'paid';
};

const isStartedPlan = (plan: AnyRecord): boolean => {
  const statut = normalizeText(plan?.statut);
  return (
    isPaidPlan(plan) ||
    statut.includes('cours') ||
    Boolean(plan?.datePaiementEffectif || plan?.datePaiement || plan?.preuve)
  );
};

const getPlanId = (item: AnyRecord): number | null => {
  const id = toNumber(item?.id);
  return id > 0 ? id : null;
};

const getContratId = (item: AnyRecord): number | null => {
  const id = toNumber(item?.contratId ?? item?.contrat?.id);
  return id > 0 ? id : null;
};

const getVictimeId = (item: AnyRecord): number | null => {
  const id = toNumber(item?.victimeId ?? item?.victime?.id);
  return id > 0 ? id : null;
};

const getIndemnisationPlanId = (item: AnyRecord): number | null => {
  const id = toNumber(item?.planindemnisationId ?? item?.planIndemnisationId ?? item?.planIndemnisation?.id);
  return id > 0 ? id : null;
};

const getPlanAmount = (plan: AnyRecord): number => {
  return toNumber(plan?.montantUSD ?? plan?.montant);
};

const getContratAmount = (contrat: AnyRecord, plans: AnyRecord[]): number => {
  const amount = toNumber(contrat?.montantTotalUSD ?? contrat?.montantTotal);
  if (amount > 0) return amount;

  const contratId = getPlanId(contrat);
  return plans
    .filter((plan) => contratId !== null && getContratId(plan) === contratId)
    .reduce((sum, plan) => sum + getPlanAmount(plan), 0);
};

const bucketForPercent = (percent: number): '0%' | '25%' | '50%' | '75%' | '100%' => {
  if (percent >= 100) return '100%';
  if (percent >= 75) return '75%';
  if (percent >= 50) return '50%';
  if (percent >= 25) return '25%';
  return '0%';
};

const uniquePlans = (plans: AnyRecord[]): AnyRecord[] => {
  const seen = new Set<number>();
  const noId: AnyRecord[] = [];
  const withId: AnyRecord[] = [];

  plans.forEach((plan) => {
    const id = getPlanId(plan);
    if (id === null) {
      noId.push(plan);
      return;
    }
    if (!seen.has(id)) {
      seen.add(id);
      withId.push(plan);
    }
  });

  return [...withId, ...noId];
};

export const buildIndemnisationDashboardStats = ({
  contrats,
  plans,
  indemnisations,
}: {
  contrats: AnyRecord[];
  plans: AnyRecord[];
  indemnisations: AnyRecord[];
}): IndemnisationDashboardStats => {
  const nestedPlans = contrats.flatMap((contrat) => normalizeApiList(contrat?.planIndemnisation));
  const allPlans = uniquePlans([...plans, ...nestedPlans]);

  const paidByPlanId = new Map<number, number>();
  let totalVerseDirectSansPlan = 0;
  const paidWithoutPlanByVictimeId = new Map<number, number>();

  indemnisations.forEach((indemnisation) => {
    const amount = toNumber(indemnisation?.montantPaye ?? indemnisation?.montantUSD ?? indemnisation?.montant);
    if (amount <= 0) return;

    const planId = getIndemnisationPlanId(indemnisation);
    if (planId !== null) {
      paidByPlanId.set(planId, (paidByPlanId.get(planId) || 0) + amount);
      return;
    }

    totalVerseDirectSansPlan += amount;
    const victimeId = getVictimeId(indemnisation);
    if (victimeId !== null) {
      paidWithoutPlanByVictimeId.set(victimeId, (paidWithoutPlanByVictimeId.get(victimeId) || 0) + amount);
    }
  });

  const getPaidForPlan = (plan: AnyRecord): number => {
    const planId = getPlanId(plan);
    const paidFromIndemnisation = planId !== null ? paidByPlanId.get(planId) || 0 : 0;
    if (paidFromIndemnisation > 0) return paidFromIndemnisation;
    return isPaidPlan(plan) ? getPlanAmount(plan) : 0;
  };

  const totalVerseFromPlans = allPlans.reduce((sum, plan) => sum + getPaidForPlan(plan), 0);
  const totalVerseUSD = totalVerseFromPlans + totalVerseDirectSansPlan;

  const totalPlanifieUSD = contrats.length > 0
    ? contrats.reduce((sum, contrat) => sum + getContratAmount(contrat, allPlans), 0)
    : allPlans.reduce((sum, plan) => sum + getPlanAmount(plan), 0);

  const bucketCounts: Record<'0%' | '25%' | '50%' | '75%' | '100%', number> = {
    '0%': 0,
    '25%': 0,
    '50%': 0,
    '75%': 0,
    '100%': 0,
  };

  let contratsAvecPaiement = 0;

  if (contrats.length > 0) {
    contrats.forEach((contrat) => {
      const contratId = getPlanId(contrat);
      const victimeId = getVictimeId(contrat);
      const contratPlans = allPlans.filter((plan) => contratId !== null && getContratId(plan) === contratId);
      const total = getContratAmount(contrat, allPlans);
      const paidFromPlans = contratPlans.reduce((sum, plan) => sum + getPaidForPlan(plan), 0);
      const paidWithoutPlan = victimeId !== null ? paidWithoutPlanByVictimeId.get(victimeId) || 0 : 0;
      const paid = paidFromPlans + paidWithoutPlan;
      if (paid > 0) contratsAvecPaiement += 1;
      const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : (paid > 0 ? 100 : 0);
      bucketCounts[bucketForPercent(percent)] += 1;
    });
  } else if (allPlans.length > 0) {
    const plansByContrat = new Map<string, AnyRecord[]>();
    allPlans.forEach((plan, index) => {
      const contratId = getContratId(plan);
      const key = contratId !== null ? `contrat-${contratId}` : `plan-${getPlanId(plan) ?? index}`;
      plansByContrat.set(key, [...(plansByContrat.get(key) || []), plan]);
    });

    plansByContrat.forEach((group) => {
      const total = group.reduce((sum, plan) => sum + getPlanAmount(plan), 0);
      const paid = group.reduce((sum, plan) => sum + getPaidForPlan(plan), 0);
      if (paid > 0) contratsAvecPaiement += 1;
      const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
      bucketCounts[bucketForPercent(percent)] += 1;
    });
  } else {
    const victimesPayees = new Set<number>();
    indemnisations.forEach((indemnisation) => {
      const victimeId = getVictimeId(indemnisation);
      if (victimeId !== null) victimesPayees.add(victimeId);
    });
    const count = victimesPayees.size || indemnisations.length;
    bucketCounts['100%'] = count;
    contratsAvecPaiement = count;
  }

  return {
    totalContrats: contrats.length,
    totalPlanifieUSD,
    totalVerseUSD,
    totalRestantUSD: Math.max(0, totalPlanifieUSD - totalVerseUSD),
    contratsAvecPaiement,
    plansPayes: allPlans.filter(isPaidPlan).length,
    plansEnCours: allPlans.filter((plan) => isStartedPlan(plan) && !isPaidPlan(plan)).length,
    plansPlanifies: allPlans.filter((plan) => !isStartedPlan(plan)).length,
    gaugeData: (['0%', '25%', '50%', '75%', '100%'] as const).map((label) => ({
      label,
      count: bucketCounts[label],
      color: GAUGE_COLORS[label],
    })),
  };
};
