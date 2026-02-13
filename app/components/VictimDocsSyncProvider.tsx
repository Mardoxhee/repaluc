'use client';

import { useEffect } from 'react';
import { startVictimDocsSyncService } from '../utils/victimDocsSyncService';

export function VictimDocsSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const cleanup = startVictimDocsSyncService();
    return cleanup;
  }, []);

  return <>{children}</>;
}
