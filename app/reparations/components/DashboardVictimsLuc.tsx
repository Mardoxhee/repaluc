"use client";

import React from 'react';
import DashboardVictims from './dashboardVictims';

interface DashboardVictimsLucProps {
  onSelectAgentReparation?: (fullName: string) => void;
  onShowRecontactedVictims?: () => void;
}

const DashboardVictimsLuc: React.FC<DashboardVictimsLucProps> = ({
  onSelectAgentReparation,
  onShowRecontactedVictims,
}) => {
  return (
    <DashboardVictims
      onSelectAgentReparation={onSelectAgentReparation}
      onShowRecontactedVictims={onShowRecontactedVictims}
    />
  );
};

export default DashboardVictimsLuc;
