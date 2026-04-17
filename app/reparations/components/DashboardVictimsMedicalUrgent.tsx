"use client";

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface DashboardVictimsMedicalUrgentProps {
  onSelectAgentReparation?: (fullName: string) => void;
  onShowRecontactedVictims?: () => void;
}

const DashboardVictimsMedicalUrgent: React.FC<DashboardVictimsMedicalUrgentProps> = () => {
  return (
    <div className="w-full px-6 py-8 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-50">
            <AlertCircle className="text-red-600" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard Prise en charge médicale urgente</h1>
            <p className="text-sm text-gray-600">Victimes en urgence médicale</p>
            <div className="mt-3 text-sm text-gray-700">
              Ce dashboard est prêt côté structure. Il reste à brancher les statistiques/filtrages spécifiques aux urgences médicales.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardVictimsMedicalUrgent;
