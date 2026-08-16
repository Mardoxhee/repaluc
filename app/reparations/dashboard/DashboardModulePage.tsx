"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import DashboardReparations from '../components/DashboardReparations';

const DashboardModulePage: React.FC = () => {
  const router = useRouter();

  const goToVictims = (params: Record<string, string>) => {
    const search = new URLSearchParams(params);
    router.push(`/reparations/victimes?${search.toString()}`);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 px-4 py-6 md:px-6">
      <section className="mb-6 rounded-lg border border-primary-100 bg-white p-5 shadow-[0_18px_50px_-38px_rgba(0,127,186,0.55)]">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-primary-600">
              Module dashboard
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
              Tableaux de bord des réparations
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Une vue claire par mention, avec les chiffres LUC, MPU et PECMU séparés.
            </p>
          </div>
        </div>
      </section>

      <DashboardReparations
        showIntro={false}
        onSelectAgentReparation={(fullName) => goToVictims({ agent: fullName })}
        onShowRecontactedVictims={(mention) => goToVictims({
          ...(mention ? { mention } : {}),
          photo: '1',
        })}
        onShowSignedContractVictims={(mention) => goToVictims({
          ...(mention ? { mention } : {}),
          contrats: 'signes',
        })}
        onSelectMention={(mention) => goToVictims({ mention })}
      />
    </div>
  );
};

export default DashboardModulePage;
