"use client";

import React, { useMemo } from 'react';
import ListVictims from '../components/ListVictims';
import {
  mockCategories,
  mockMesures,
  mockPrejudices,
  mockProgrammes,
} from '../components/reparationsConfig';

type InitialFilters = {
  mention?: string;
  agent?: string;
  photo?: boolean;
  signedContracts?: boolean;
};

interface VictimesModulePageProps {
  initialFilters?: InitialFilters;
}

const normalizeMention = (value?: string) => String(value ?? '').trim().toUpperCase();

const VictimesModulePage: React.FC<VictimesModulePageProps> = ({ initialFilters }) => {
  const activeConfig = useMemo(() => {
    const mention = normalizeMention(initialFilters?.mention);

    return {
      mention: ['LUC', 'MPU', 'PECMU'].includes(mention) ? mention : '',
      photoNotNull: Boolean(initialFilters?.photo),
      agentReparation: initialFilters?.agent || '',
      signedContractsOnly: Boolean(initialFilters?.signedContracts),
    };
  }, [initialFilters?.agent, initialFilters?.mention, initialFilters?.photo, initialFilters?.signedContracts]);

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 px-4 py-6 md:px-6">
      <section className="mb-5 rounded-lg border border-primary-100 bg-white p-5 shadow-[0_18px_50px_-38px_rgba(0,127,186,0.55)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-primary-600">
              Module victimes
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
              Registre des victimes
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              La liste garde toute sa logique existante, avec ses filtres intégrés.
            </p>
          </div>
        </div>
      </section>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.7)]">
        <ListVictims
          key={`${activeConfig.mention}-${activeConfig.agentReparation}-${activeConfig.photoNotNull ? 'photo' : 'all'}-${activeConfig.signedContractsOnly ? 'contrats-signes' : 'toutes'}`}
          mockPrejudices={mockPrejudices}
          mockMesures={mockMesures}
          mockProgrammes={mockProgrammes}
          mockCategories={mockCategories}
          agentReparation={activeConfig.agentReparation}
          photoNotNull={activeConfig.photoNotNull}
          mention={activeConfig.mention}
          signedContractsOnly={activeConfig.signedContractsOnly}
        />
      </div>
    </div>
  );
};

export default VictimesModulePage;
