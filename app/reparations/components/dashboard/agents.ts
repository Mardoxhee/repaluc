export type AgentCore = {
  id: number;
  nom?: string;
  postnom?: string;
  prenom?: string;
  username?: string;
  email?: string;
  lieu_affectation?: string;
  status?: boolean;
  isConnected?: boolean;
  direction?: { id?: number; direction?: string } | string;
  service?: string;
  departement?: string;
  department?: string;
  division?: { nom?: string };
  directionNom?: string;
  serviceNom?: string;
};

export const getAgentFullName = (a: AgentCore): string => {
  const parts = [a?.prenom, a?.postnom, a?.nom]
    .filter((x) => typeof x === 'string' && x.trim().length > 0)
    .map((x) => (x as string).trim());
  if (parts.length > 0) return parts.join(' ');
  const fallback = a?.username ?? a?.email ?? String(a?.id ?? '');
  return String(fallback);
};

export const getAgentPrenomNom = (a: AgentCore): string => {
  const parts = [a?.prenom, a?.nom]
    .filter((x) => typeof x === 'string' && x.trim().length > 0)
    .map((x) => (x as string).trim());
  if (parts.length > 0) return parts.join(' ');
  return getAgentFullName(a);
};

export const isReparationsAgent = (a: AgentCore): boolean | null => {
  const objDirection = typeof (a as any)?.direction === 'object' && (a as any)?.direction !== null
    ? (a as any)?.direction?.direction
    : undefined;

  const candidates: Array<unknown> = [
    objDirection,
    (a as any)?.direction,
    (a as any)?.directionNom,
    (a as any)?.service,
    (a as any)?.serviceNom,
    (a as any)?.departement,
    (a as any)?.department,
    (a as any)?.division?.nom,
  ];

  const normalized = candidates
    .filter((x) => typeof x === 'string')
    .map((x) => (x as string).trim().toUpperCase())
    .filter((s) => s.length > 0);

  if (normalized.length === 0) return null;

  // Filtre strict demandé: direction.direction doit être REPARATIONS.
  if (typeof objDirection === 'string' && objDirection.trim().length > 0) {
    const d = objDirection.trim().toUpperCase();
    return d === 'REPARATIONS' || d === 'ETUDES, ENQUETES ET EVALUATIONS';
  }

  return normalized.some((s) =>
    s === 'REPARATIONS' ||
    s.includes('REPARATIONS') ||
    s === 'ETUDES, ENQUETES ET EVALUATIONS' ||
    s.includes('ETUDES')
  );
};
