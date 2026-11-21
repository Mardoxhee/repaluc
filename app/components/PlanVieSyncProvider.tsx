'use client';

import { useEffect } from 'react';
import { startPlanVieSyncService } from '@/app/utils/planVieSyncService';

export function PlanVieSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => startPlanVieSyncService(), []);
  return <>{children}</>;
}
