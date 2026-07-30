"use client";

export type MentionCode = 'LUC' | 'MPU' | 'PECMU';

export type GlobalProgressStats = {
  total: number;
  photo: {
    withPhoto: number;
    withoutPhoto: number;
  };
  piece: {
    withPiece: number;
    withoutPiece: number;
  };
  contrat: {
    withContrat: number;
    withoutContrat: number;
  };
  indemnisation: {
    commencee: number;
    nonCommencee: number;
    montantTotalIndemnise: number;
  };
};

export type CountRow = {
  name: string;
  value: number;
  fullName?: string;
};

export const MENTIONS: MentionCode[] = ['LUC', 'MPU', 'PECMU'];

export const toNumber = (value: unknown): number => {
  const raw = typeof value === 'string' ? value.replace(',', '.') : value;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const normalizeText = (value: unknown): string => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase();

export const endpointForMention = (endpoint: string, mention?: MentionCode | null): string => {
  if (!mention) return endpoint;
  return `${endpoint.replace(/\/$/, '')}/${mention}`;
};

export const normalizeApiList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.repartitions)) return payload.data.repartitions;
  if (Array.isArray(payload?.repartitions)) return payload.repartitions;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

export const normalizeGlobalProgress = (payload: any): GlobalProgressStats => {
  const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
  const total = toNumber(data?.total);
  const withPhoto = toNumber(data?.photo?.withPhoto);
  const withPiece = toNumber(data?.piece?.withPiece);
  const withContrat = toNumber(data?.contrat?.withContrat);
  const commencee = toNumber(data?.indemnisation?.commencee);

  return {
    total,
    photo: {
      withPhoto,
      withoutPhoto: toNumber(data?.photo?.withoutPhoto) || Math.max(0, total - withPhoto),
    },
    piece: {
      withPiece,
      withoutPiece: toNumber(data?.piece?.withoutPiece) || Math.max(0, total - withPiece),
    },
    contrat: {
      withContrat,
      withoutContrat: toNumber(data?.contrat?.withoutContrat) || Math.max(0, total - withContrat),
    },
    indemnisation: {
      commencee,
      nonCommencee: toNumber(data?.indemnisation?.nonCommencee),
      montantTotalIndemnise: toNumber(data?.indemnisation?.montantTotalIndemnise),
    },
  };
};

export const normalizeSexeLabel = (value: unknown): 'Femme' | 'Homme' | 'Inconnu' => {
  const normalized = normalizeText(value);
  if (!normalized || normalized === '0' || normalized === 'null' || normalized === 'undefined') return 'Inconnu';
  if (['f', 'femme', 'femmes', 'feminin', 'feminins', 'female', 'women', 'woman'].includes(normalized)) return 'Femme';
  if (['h', 'homme', 'hommes', 'm', 'masculin', 'masculins', 'male', 'men', 'man'].includes(normalized)) return 'Homme';
  return 'Inconnu';
};

export const normalizeRowsByField = (payload: any, field: string, fallback = 'Non renseigné'): CountRow[] => {
  return normalizeApiList(payload)
    .map((item: any) => {
      const label = String(item?.[field] ?? item?.label ?? item?.name ?? fallback).trim() || fallback;
      const value = toNumber(item?.total ?? item?.count ?? item?.nombre ?? item?.value);
      return {
        name: label,
        fullName: label,
        value,
      };
    })
    .filter((item) => item.value > 0 || item.name !== fallback);
};

export const normalizeSexeRows = (payload: any): CountRow[] => {
  const grouped = new Map<string, number>();
  normalizeApiList(payload).forEach((item: any) => {
    const label = normalizeSexeLabel(item?.sexe ?? item?.label ?? item?.name);
    grouped.set(label, (grouped.get(label) || 0) + toNumber(item?.total ?? item?.count ?? item?.nombre ?? item?.value));
  });

  return ['Femme', 'Homme', 'Inconnu']
    .map((name) => ({ name, fullName: name, value: grouped.get(name) || 0 }))
    .filter((item) => item.value > 0 || item.name !== 'Inconnu');
};

export const normalizeTrancheAgeRows = (payload: any): CountRow[] => {
  return normalizeApiList(payload).map((item: any) => {
    const label = String(item?.tranche ?? item?.label ?? item?.name ?? 'INCONNU').trim() || 'INCONNU';
    return {
      name: label,
      fullName: label,
      value: toNumber(item?.total ?? item?.count ?? item?.nombre ?? item?.value),
    };
  });
};

export const totalIndemnisationFromPayload = (payload: any): number => {
  return toNumber(payload?.totalIndemnisation ?? payload?.data?.totalIndemnisation);
};
