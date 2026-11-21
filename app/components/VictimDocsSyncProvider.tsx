'use client';

import { useEffect } from 'react';
import { startVictimDocsSyncService } from '@/app/utils/victimDocsSyncService';

export function VictimDocsSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    return startVictimDocsSyncService();
  }, []);

  return <>{children}</>;
}
