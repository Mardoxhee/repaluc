"use client";

import React, { useMemo, useState } from 'react';
import { FiAlertCircle, FiAlertTriangle, FiGrid } from 'react-icons/fi';
import { FaHospitalSymbol } from 'react-icons/fa';
import DashboardVictimsLuc from './DashboardVictimsLuc';
import DashboardVictimsMpu from './DashboardVictimsMpu';
import DashboardVictimsMedicalUrgent from './DashboardVictimsMedicalUrgent';

export type ReparationsDashboardKey = 'luc' | 'mpu' | 'medical_urgent';

interface DashboardReparationsProps {
  defaultDashboard?: ReparationsDashboardKey;
  onSelectAgentReparation?: (fullName: string) => void;
  onShowRecontactedVictims?: () => void;
}

type DashboardOption = {
  key: ReparationsDashboardKey;
  label: string;
  description: string;
  icon: React.ReactNode;
};

const DashboardReparations: React.FC<DashboardReparationsProps> = ({
  defaultDashboard = 'luc',
  onSelectAgentReparation,
  onShowRecontactedVictims,
}) => {
  const options: DashboardOption[] = useMemo(
    () => [
      {
        key: 'luc',
        label: 'Victimes de la LUC',
        description: 'Dashboard par défaut (actuel).',
        icon: <FiGrid size={18} className="text-blue-600" />,
      },
      {
        key: 'mpu',
        label: 'Victimes MPU',
        description: 'Mesure Provisoire Urgente.',
        icon: <FiAlertCircle size={18} className="text-orange-600" />,
      },
      {
        key: 'medical_urgent',
        label: 'Prise en charge médicale urgente',
        description: 'Victimes en urgence médicale.',
        icon: <FaHospitalSymbol size={18} className="text-red-600" />,
      },
    ],
    []
  );

  const [selected, setSelected] = useState<ReparationsDashboardKey>(defaultDashboard);

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Dashboard Réparations</h2>
            <p className="text-sm text-gray-600">Choisis le type de dashboard à consulter.</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          {options.map((o) => {
            const active = o.key === selected;
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => setSelected(o.key)}
                className={`text-left p-4 rounded-xl border transition-all ${active
                  ? 'bg-white border-primary-300 shadow-sm'
                  : 'bg-gray-50 border-gray-200 hover:bg-white hover:border-gray-300'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{o.icon}</div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{o.label}</div>
                    <div className="text-xs text-gray-600">{o.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* {selected !== 'luc' && (
          <div className="mt-4 flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <FiAlertTriangle className="text-yellow-700 mt-0.5" size={18} />
            <div className="text-sm text-yellow-900">
              Ce dashboard est séparé pour être maintenable. Il faut encore brancher la logique métier (APIs / filtres) spécifique.
            </div>
          </div>
        )} */}
      </div>

      {selected === 'luc' && (
        <DashboardVictimsLuc
          onSelectAgentReparation={onSelectAgentReparation}
          onShowRecontactedVictims={onShowRecontactedVictims}
        />
      )}

      {selected === 'mpu' && (
        <DashboardVictimsMpu
          onSelectAgentReparation={onSelectAgentReparation}
          onShowRecontactedVictims={onShowRecontactedVictims}
        />
      )}

      {selected === 'medical_urgent' && (
        <DashboardVictimsMedicalUrgent
          onSelectAgentReparation={onSelectAgentReparation}
          onShowRecontactedVictims={onShowRecontactedVictims}
        />
      )}
    </div>
  );
};

export default DashboardReparations;
