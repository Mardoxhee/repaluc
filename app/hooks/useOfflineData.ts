import { useState, useEffect, useCallback } from 'react';
import {
  initDB,
  saveToStore,
  getAllFromStore,
  getFromStore,
  saveMetadata,
  isDataFresh,
  STORES,
} from '../utils/indexedDB';

interface UseOfflineDataOptions {
  storeName: string;
  apiUrl: string;
  cacheKey: string;
  maxAgeMinutes?: number;
  autoFetch?: boolean;
}

interface UseOfflineDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  refetch: () => Promise<void>;
  saveLocal: (data: T) => Promise<void>;
}

export function useOfflineData<T>({
  storeName,
  apiUrl,
  cacheKey,
  maxAgeMinutes = 5,
  autoFetch = true,
}: UseOfflineDataOptions): UseOfflineDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  // Écouter les changements de connexion
  useEffect(() => {
    const handleOnline = () => {
      console.log('[useOfflineData] Connexion rétablie');
      setIsOffline(false);
      // Refetch automatiquement au retour en ligne
      if (autoFetch) {
        fetchData();
      }
    };

    const handleOffline = () => {
      console.log('[useOfflineData] Connexion perdue');
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fonction pour sauvegarder localement
  const saveLocal = useCallback(async (newData: T) => {
    try {
      await saveToStore(storeName, newData);
      await saveMetadata(cacheKey, { timestamp: Date.now() });
      setData(newData);
      console.log(`[useOfflineData] Données sauvegardées localement: ${cacheKey}`);
    } catch (err) {
      console.error('[useOfflineData] Erreur de sauvegarde locale:', err);
    }
  }, [storeName, cacheKey]);

  // Fonction pour récupérer les données
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Initialiser IndexedDB
      await initDB();

      // Vérifier si on a des données fraîches en cache
      const isFresh = await isDataFresh(cacheKey, maxAgeMinutes);
      
      if (isFresh && !navigator.onLine) {
        console.log(`[useOfflineData] Utilisation du cache (offline): ${cacheKey}`);
        const cachedData = await getAllFromStore<T>(storeName);
        setData(cachedData as any);
        setLoading(false);
        return;
      }

      // Essayer de récupérer depuis l'API
      if (navigator.onLine) {
        try {
          console.log(`[useOfflineData] Fetch depuis API: ${apiUrl}`);
          const response = await fetch(apiUrl);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const apiData = await response.json();
          
          // Sauvegarder dans IndexedDB
          await saveToStore(storeName, apiData);
          await saveMetadata(cacheKey, { timestamp: Date.now() });
          
          setData(apiData);
          console.log(`[useOfflineData] Données récupérées et sauvegardées: ${cacheKey}`);
        } catch (fetchError) {
          console.warn('[useOfflineData] Erreur API, utilisation du cache:', fetchError);
          
          // Fallback vers le cache
          const cachedData = await getAllFromStore<T>(storeName);
          if (cachedData && (cachedData as any).length > 0) {
            setData(cachedData as any);
            setError('Données du cache (API inaccessible)');
          } else {
            throw new Error('Aucune donnée disponible');
          }
        }
      } else {
        // Mode offline, utiliser le cache
        console.log(`[useOfflineData] Mode offline, utilisation du cache: ${cacheKey}`);
        const cachedData = await getAllFromStore<T>(storeName);
        
        if (cachedData && (cachedData as any).length > 0) {
          setData(cachedData as any);
        } else {
          setError('Aucune donnée en cache');
        }
      }
    } catch (err: any) {
      console.error('[useOfflineData] Erreur:', err);
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [storeName, apiUrl, cacheKey, maxAgeMinutes]);

  // Fetch automatique au montage
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch]);

  return {
    data,
    loading,
    error,
    isOffline,
    refetch: fetchData,
    saveLocal,
  };
}

// Hook spécifique pour les victimes
export function useVictims() {
  return useOfflineData<any[]>({
    storeName: STORES.VICTIMS,
    apiUrl: 'http://10.140.0.104:8007/victime',
    cacheKey: 'victims_list',
    maxAgeMinutes: 10,
  });
}

// Hook spécifique pour une victime
export function useVictim(id: number) {
  const [victim, setVictim] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVictim = async () => {
      try {
        await initDB();
        
        // Essayer depuis IndexedDB d'abord
        const cached = await getFromStore(STORES.VICTIMS, id);
        
        if (cached) {
          setVictim(cached);
          setLoading(false);
          return;
        }

        // Sinon, fetch depuis l'API
        if (navigator.onLine) {
          const response = await fetch(`http://10.140.0.104:8007/victime/${id}`);
          const data = await response.json();
          
          // Sauvegarder
          await saveToStore(STORES.VICTIMS, data);
          setVictim(data);
        }
      } catch (err) {
        console.error('Erreur chargement victime:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVictim();
    }
  }, [id]);

  return { victim, loading };
}

// Hook pour les statistiques
export function useStats() {
  return useOfflineData<any>({
    storeName: STORES.STATS,
    apiUrl: 'http://10.140.0.104:8007/victime/stats',
    cacheKey: 'stats_data',
    maxAgeMinutes: 15,
  });
}

// Hook pour les questions
export function useQuestions(type: string) {
  return useOfflineData<any>({
    storeName: STORES.QUESTIONS,
    apiUrl: `http://10.140.0.104:8007/question/type/${type}`,
    cacheKey: `questions_${type}`,
    maxAgeMinutes: 60, // Les questions changent rarement
  });
}
