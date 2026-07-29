"use client";

import React from 'react';
import { FiShield } from 'react-icons/fi';
import DashboardVictims from './dashboardVictims';
import ProgressionMesuresLuc from './ProgressionMesuresLuc';
import ProgressionDetailLuc from './ProgressionDetailLuc';

interface DashboardVictimsLucProps {
  onSelectAgentReparation?: (fullName: string) => void;
  onShowRecontactedVictims?: () => void;
  dashboardScope?: 'all' | 'luc';
  title?: string;
  description?: string;
  beforeProgression?: React.ReactNode;
}

const DashboardVictimsLuc: React.FC<DashboardVictimsLucProps> = ({
  onSelectAgentReparation,
  onShowRecontactedVictims,
  dashboardScope = 'luc',
  title = 'Tableau de bord — Victimes LUC',
  description = 'vue d’ensemble et indicateurs clés.',
  beforeProgression,
}) => {
  return (
    <DashboardVictims
      onSelectAgentReparation={onSelectAgentReparation}
      onShowRecontactedVictims={onShowRecontactedVictims}
      dashboardScope={dashboardScope}
      extraSection={
        <>
          <div className="mb-6 flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50">
              <FiShield className="text-blue-600" size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-600">
                {description}
              </p>
            </div>
          </div>
          {beforeProgression}
          <ProgressionMesuresLuc />
          <div className="mt-8">
            <ProgressionDetailLuc />
          </div>
        </>
      }
    />
  );
};

export default DashboardVictimsLuc;
