"use client"
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface FetchContextType {
    fetcher: (url: string, options?: RequestInit) => Promise<any>;
    loading: boolean;
    error: string | null;
}

const FetchContext = createContext<FetchContextType | undefined>(undefined);
export { FetchContext };

export const FetchProvider = ({ children }: { children: ReactNode }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

    const fetcher = useCallback(async (url: string, options?: RequestInit) => {
        setLoading(true);
        setError(null);
        try {
            const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
            const response = await fetch(fullUrl, options);
            if (!response.ok) {
                console.log('Aucune donnée retournée ou erreur pour', fullUrl, 'Status:', response.status);
                console.log('throw new Error sur status', response.status, 'pour', fullUrl);
                throw new Error(`Erreur ${response.status}`);
            }
            let data = null;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // Try to parse only if not empty
                const text = await response.text();
                data = text ? JSON.parse(text) : null;
            }
            setLoading(false);
            return data;
        } catch (err: any) {
            setError(err.message || 'Erreur réseau');
            console.log('Erreur réseau ou aucune donnée:', err);
            setLoading(false);
            throw err;
        }
    }, [baseUrl]);

    return (
        <FetchContext.Provider value={{ fetcher, loading, error }}>
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
