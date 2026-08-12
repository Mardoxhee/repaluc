"use client";

import { authenticatedFetch } from '@/app/utils/authFetch';
import { saveProgress, saveVictimsToCache } from '@/app/utils/victimsCache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006';
const VICTIMS_CACHE_KEY = 'all-victims-cache';
const VICTIMS_PROGRESS_KEY = 'victims-load-progress';
const DEFAULT_PAGE_SIZE = 100;

export type VictimsCacheSyncProgress = {
  currentPage: number;
  totalPages: number;
  records: number;
  status: 'running' | 'saved' | 'done' | 'error';
  message?: string;
};

type RefreshOptions = {
  pageSize?: number;
  onProgress?: (progress: VictimsCacheSyncProgress) => void;
};

type PageResult = {
  data: any[];
  meta: any;
};

const normalizeListPayload = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const toPositiveNumber = (value: any): number | null => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
};

const dedupeById = (rows: any[]): any[] => {
  const rowsWithoutId: any[] = [];
  const rowsById = new Map<string, any>();

  for (const row of rows) {
    const id = row?.id ?? row?.victimeId ?? row?.victimId;
    if (id === undefined || id === null || String(id).trim() === '') {
      rowsWithoutId.push(row);
      continue;
    }
    rowsById.set(String(id), row);
  }

  return [...rowsById.values(), ...rowsWithoutId];
};

const fetchVictimsPage = async (page: number, limit: number): Promise<PageResult> => {
  const url = new URL(`${API_BASE_URL}/victime/paginate/filtered`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));

  const response = await authenticatedFetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Serveur indisponible (${response.status})`);
  }

  const payload = await response.json().catch(() => null);
  return {
    data: normalizeListPayload(payload),
    meta: payload?.meta ?? {},
  };
};

export const refreshVictimsCacheInBackground = async ({
  pageSize = DEFAULT_PAGE_SIZE,
  onProgress,
}: RefreshOptions = {}) => {
  if (typeof window !== 'undefined' && navigator && !navigator.onLine) {
    throw new Error('Connexion absente');
  }

  const safePageSize = Math.min(Math.max(Math.floor(pageSize), 1), 500);
  onProgress?.({
    currentPage: 0,
    totalPages: 1,
    records: 0,
    status: 'running',
    message: 'Initialisation du cache',
  });

  const firstPage = await fetchVictimsPage(1, safePageSize);
  const metaTotal = toPositiveNumber(firstPage.meta?.total);
  const metaTotalPages = toPositiveNumber(firstPage.meta?.totalPages);
  const inferredTotalPages = firstPage.data.length < safePageSize
    ? 1
    : Math.max(1, Math.ceil((metaTotal ?? firstPage.data.length) / safePageSize));
  const totalPages = metaTotalPages ?? inferredTotalPages;

  let allVictims = [...firstPage.data];

  await saveVictimsToCache(VICTIMS_CACHE_KEY, allVictims, {
    ...firstPage.meta,
    timestamp: Date.now(),
    total: metaTotal ?? allVictims.length,
    page: 1,
    limit: safePageSize,
    totalPages,
  });
  await saveProgress(VICTIMS_PROGRESS_KEY, 1, totalPages, totalPages === 1);

  onProgress?.({
    currentPage: 1,
    totalPages,
    records: allVictims.length,
    status: 'saved',
    message: `${allVictims.length} victime(s) en cache`,
  });

  for (let page = 2; page <= totalPages; page++) {
    const nextPage = await fetchVictimsPage(page, safePageSize);
    allVictims = dedupeById([...allVictims, ...nextPage.data]);

    if (page % 5 === 0 || page === totalPages) {
      await saveVictimsToCache(VICTIMS_CACHE_KEY, allVictims, {
        ...firstPage.meta,
        timestamp: Date.now(),
        total: metaTotal ?? allVictims.length,
        page: 1,
        limit: safePageSize,
        totalPages,
      });
      await saveProgress(VICTIMS_PROGRESS_KEY, page, totalPages, page === totalPages);
    }

    onProgress?.({
      currentPage: page,
      totalPages,
      records: allVictims.length,
      status: page === totalPages ? 'done' : 'running',
      message: `${allVictims.length} victime(s) en cache`,
    });
  }

  const finalVictims = dedupeById(allVictims);
  await saveVictimsToCache(VICTIMS_CACHE_KEY, finalVictims, {
    ...firstPage.meta,
    timestamp: Date.now(),
    total: metaTotal ?? finalVictims.length,
    page: 1,
    limit: safePageSize,
    totalPages,
  });
  await saveProgress(VICTIMS_PROGRESS_KEY, totalPages, totalPages, true);

  onProgress?.({
    currentPage: totalPages,
    totalPages,
    records: finalVictims.length,
    status: 'done',
    message: `${finalVictims.length} victime(s) disponibles hors ligne`,
  });

  return {
    totalRecords: finalVictims.length,
    totalPages,
  };
};
