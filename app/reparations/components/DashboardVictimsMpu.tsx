"use client";

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface DashboardVictimsMpuProps {
  onSelectAgentReparation?: (fullName: string) => void;
  onShowRecontactedVictims?: () => void;
}

const DashboardVictimsMpu: React.FC<DashboardVictimsMpuProps> = () => {
  return (
    <div className="w-full px-6 py-8 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-orange-50">
            <AlertCircle className="text-orange-600" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard MPU</h1>
            <p className="text-sm text-gray-600">Mesure Provisoire Urgente</p>
            <div className="mt-3 text-sm text-gray-700">
              Ce dashboard est prêt côté structure. Il reste à brancher les statistiques/filtrages spécifiques MPU.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardVictimsMpu;
