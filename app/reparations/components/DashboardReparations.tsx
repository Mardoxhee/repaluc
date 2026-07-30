"use client";

import React, { useMemo, useState } from 'react';
import { FiAlertCircle, FiAward, FiGrid, FiHeart, FiUsers } from 'react-icons/fi';
import DashboardVictimsLuc from './DashboardVictimsLuc';
import DashboardVictimsMpu from './DashboardVictimsMpu';
import DashboardVictimesPecmu from './DashboardVictimesPecmu';
import DashboardVictimesReparees from './DashboardVictimesReparees';
import DashboardToutesVictimes from './DashboardToutesVictimes';

export type ReparationsDashboardKey = 'toutes' | 'luc' | 'mpu' | 'pecmu' | 'reparees';

interface DashboardReparationsProps {
  defaultDashboard?: ReparationsDashboardKey;
  onSelectAgentReparation?: (fullName: string) => void;
  onShowRecontactedVictims?: () => void;
  onSelectMention?: (mention: string) => void;
  showIntro?: boolean;
}

type DashboardOption = {
  key: ReparationsDashboardKey;
  label: string;
  description: string;
  icon: React.ReactNode;
};

const DashboardReparations: React.FC<DashboardReparationsProps> = ({
  defaultDashboard = 'toutes',
  onSelectAgentReparation,
  onShowRecontactedVictims,
  onSelectMention,
  showIntro = true,
}) => {
  const options: DashboardOption[] = useMemo(
    () => [
      {
        key: 'toutes',
        label: 'Toutes les victimes',
        description: 'Vue consolidée multi-mentions.',
        icon: <FiUsers size={18} className="text-indigo-600" />,
      },
      {
        key: 'luc',
        label: 'Victimes de la LUC',
        description: 'Réparations administratives intégrales.',
        icon: <FiGrid size={18} className="text-blue-600" />,
      },
      {
        key: 'mpu',
        label: 'Victimes MPU',
        description: 'Mesures Provisoires Urgentes.',
        icon: <FiAlertCircle size={18} className="text-orange-600" />,
      },
      {
        key: 'pecmu',
        label: 'PECMU',
        description: 'Prise en charge médicale urgente.',
        icon: <FiHeart size={18} className="text-red-600" />,
      },
      {
        key: 'reparees',
        label: 'Totalement réparées',
        description: 'Victimes ayant complété le circuit.',
        icon: <FiAward size={18} className="text-emerald-600" />,
      },
    ],
    []
  );

  const [selected, setSelected] = useState<ReparationsDashboardKey>(defaultDashboard);

  return (
    <div className="w-full">
      <div className="mb-7 rounded-lg border border-primary-100 bg-gradient-to-br from-white via-slate-50 to-primary-50/40 p-5 shadow-[0_20px_55px_-42px_rgba(0,127,186,0.55)]">
        {showIntro && (
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-primary-700">Centre de suivi</div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">Dashboard Réparations</h2>
              <p className="text-sm text-slate-600">Chaque mention garde maintenant ses propres chiffres et son propre rythme.</p>
            </div>
          </div>
        )}

        <div className={`${showIntro ? 'mt-5' : ''} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3`}>
          {options.map((o) => {
            const active = o.key === selected;
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => setSelected(o.key)}
                className={`group text-left p-4 rounded-lg border transition-all ${active
                  ? 'bg-primary-600 border-primary-600 shadow-[0_18px_35px_-26px_rgba(0,127,186,0.9)] text-white'
                  : 'bg-white/75 border-slate-200 hover:bg-white hover:border-primary-200 hover:-translate-y-0.5'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-md p-2 ${active ? 'bg-white/15 [&_svg]:text-white' : 'bg-slate-50 group-hover:bg-primary-50'}`}>{o.icon}</div>
                  <div className="min-w-0">
                    <div className={`text-sm font-bold truncate ${active ? 'text-white' : 'text-slate-950'}`}>{o.label}</div>
                    <div className={`text-xs leading-snug ${active ? 'text-white/70' : 'text-slate-500'}`}>{o.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* {selected !== 'luc' && (
          <div className="mt-4 flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <FiAlertTriangle className="text-yellow-700 mt-0.5" size={18} />
            <div className="text-sm text-yellow-900">
              Ce dashboard est séparé pour être maintenable. Il faut encore brancher la logique métier (APIs / filtres) spécifique.
            </div>
          </div>
        )} */}
      </div>

      {selected === 'toutes' && (
        <DashboardToutesVictimes
          onSelectAgentReparation={onSelectAgentReparation}
          onShowRecontactedVictims={onShowRecontactedVictims}
          onSelectMention={onSelectMention}
        />
      )}

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

      {selected === 'pecmu' && (
        <DashboardVictimesPecmu
          onSelectAgentReparation={onSelectAgentReparation}
          onShowRecontactedVictims={onShowRecontactedVictims}
        />
      )}

      {selected === 'reparees' && (
        <DashboardVictimesReparees
          onSelectAgentReparation={onSelectAgentReparation}
          onShowRecontactedVictims={onShowRecontactedVictims}
        />
      )}
    </div>
  );
};

export default DashboardReparations;
