"use client"
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { initDB, saveToStore, getAllFromStore, STORES } from '../utils/indexedDB';

interface FetchContextType {
    fetcher: (url: string, options?: RequestInit) => Promise<any>;
    loading: boolean;
    error: string | null;
    isOffline: boolean;
}

const FetchContext = createContext<FetchContextType | undefined>(undefined);
export { FetchContext };

export const FetchProvider = ({ children }: { children: ReactNode }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOffline, setIsOffline] = useState(false);

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

    // Initialiser IndexedDB au montage
    useEffect(() => {
        initDB().then(() => {
            console.log('[FetchContext] IndexedDB initialisée');
        }).catch(err => {
            console.error('[FetchContext] Erreur init IndexedDB:', err);
        });

        // Écouter les changements de connexion
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        setIsOffline(!navigator.onLine);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Déterminer le store en fonction de l'URL
    const getStoreForUrl = (url: string): string | null => {
        if (url.includes('/victime/stats')) return STORES.STATS;
        if (url.includes('/victime')) return STORES.VICTIMS;
        if (url.includes('/evaluation')) return STORES.EVALUATIONS;
        if (url.includes('/plan-vie-enquette')) return STORES.PLAN_VIE;
        if (url.includes('/question')) return STORES.QUESTIONS;
        return null;
    };

    const fetcher = useCallback(async (url: string, options?: RequestInit) => {
        setLoading(true);
        setError(null);
        
        const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
        const storeName = getStoreForUrl(fullUrl);
        const isGetRequest = !options || options.method === 'GET' || !options.method;

        try {
            // Essayer le réseau d'abord
            const response = await fetch(fullUrl, options);
            
            if (!response.ok) {
                console.log('Réponse non-OK pour', fullUrl, 'Status:', response.status);
                
                // Si GET et erreur réseau, essayer le cache
                if (isGetRequest && storeName) {
                    console.log('[FetchContext] Tentative de récupération depuis IndexedDB');
                    const cachedData = await getAllFromStore(storeName);
                    if (cachedData && cachedData.length > 0) {
                        setLoading(false);
                        return cachedData;
                    }
                }
            }

            let data = null;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                data = text ? JSON.parse(text) : null;
            }

            // Sauvegarder dans IndexedDB si GET et store identifié
            if (isGetRequest && storeName && data) {
                try {
                    await saveToStore(storeName, data);
                    console.log(`[FetchContext] Données sauvegardées dans ${storeName}`);
                } catch (dbErr) {
                    console.warn('[FetchContext] Erreur sauvegarde IndexedDB:', dbErr);
                }
            }

            setLoading(false);
            return data;
        } catch (err: any) {
            console.error('[FetchContext] Erreur réseau:', err);
            
            // En cas d'erreur réseau sur GET, essayer IndexedDB
            if (isGetRequest && storeName) {
                try {
                    console.log('[FetchContext] Mode offline, récupération depuis IndexedDB');
                    const cachedData = await getAllFromStore(storeName);
                    
                    if (cachedData && cachedData.length > 0) {
                        setError('Données du cache (mode offline)');
                        setLoading(false);
                        return cachedData;
                    }
                } catch (dbErr) {
                    console.error('[FetchContext] Erreur IndexedDB:', dbErr);
                }
            }

            setError(err.message || 'Erreur réseau');
            setLoading(false);
            throw err;
        }
    }, [baseUrl]);

    return (
        <FetchContext.Provider value={{ fetcher, loading, error, isOffline }}>
            {children}
        </FetchContext.Provider>
    );
};

export const useFetch = () => {
    const context = useContext(FetchContext);
    if (!context) {
        throw new Error('useFetch doit être utilisé dans un FetchProvider');
    }
    return context;
};
