'use client';

import { useEffect } from 'react';
import { startVictimUpdatesSyncService } from '@/app/utils/victimUpdatesSyncService';

export function VictimUpdatesSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const cleanup = startVictimUpdatesSyncService();
    return cleanup;
  }, []);

  return <>{children}</>;
}
