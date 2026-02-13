'use client';

import { useEffect } from 'react';
import { startVictimPhotosSyncService } from '../utils/victimPhotosSyncService';

export function VictimPhotosSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const cleanup = startVictimPhotosSyncService();
    return cleanup;
  }, []);

  return <>{children}</>;
}
