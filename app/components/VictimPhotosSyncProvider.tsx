'use client';

import { useEffect } from 'react';
import { startVictimPhotosSyncService } from '@/app/utils/victimPhotosSyncService';

export function VictimPhotosSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    return startVictimPhotosSyncService();
  }, []);

  return <>{children}</>;
}
