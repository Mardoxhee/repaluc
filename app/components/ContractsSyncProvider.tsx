'use client';
import { useEffect } from 'react';
import { startContractsSyncService } from '../utils/contractsSyncService';

export function ContractsSyncProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Démarrer le service de synchronisation
        const cleanup = startContractsSyncService();

        // Cleanup au démontage
        return cleanup;
    }, []);

    return <>{children}</>;
}
