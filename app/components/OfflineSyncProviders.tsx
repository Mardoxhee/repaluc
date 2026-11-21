'use client';

import { ContractsSyncProvider } from './ContractsSyncProvider';
import { VictimDocsSyncProvider } from './VictimDocsSyncProvider';
import { VictimPhotosSyncProvider } from './VictimPhotosSyncProvider';
import { VictimUpdatesSyncProvider } from './VictimUpdatesSyncProvider';
import { PlanVieSyncProvider } from './PlanVieSyncProvider';

export function OfflineSyncProviders({ children }: { children: React.ReactNode }) {
  return (
    <ContractsSyncProvider>
      <VictimPhotosSyncProvider>
        <VictimDocsSyncProvider>
          <VictimUpdatesSyncProvider>
            <PlanVieSyncProvider>{children}</PlanVieSyncProvider>
          </VictimUpdatesSyncProvider>
        </VictimDocsSyncProvider>
      </VictimPhotosSyncProvider>
    </ContractsSyncProvider>
  );
}
