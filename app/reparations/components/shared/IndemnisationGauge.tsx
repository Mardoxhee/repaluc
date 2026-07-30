"use client";

import React from 'react';

interface IndemnisationGaugeProps {
  /** Données par palier { label, count, color } */
  data: { label: string; count: number; color: string }[];
  /** Titre optionnel au-dessus du composant */
  title?: string;
  className?: string;
}

const IndemnisationGauge: React.FC<IndemnisationGaugeProps> = ({
  data,
  title = 'Progression des indemnisations',
  className = '',
}) => {
  const maxCount = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className={`rounded-lg border border-primary-100 bg-white p-5 shadow-[0_18px_50px_-40px_rgba(0,127,186,0.45)] ${className}`}>
      {title && (
        <h3 className="mb-5 text-lg font-black tracking-tight text-slate-950">{title}</h3>
      )}

      <div className="space-y-3">
        {data.map((d) => {
          const barPct = (d.count / maxCount) * 100;

          return (
            <div key={d.label} className="grid grid-cols-[56px_minmax(0,1fr)_120px] items-center gap-4 border border-slate-200 bg-slate-50/60 px-4 py-3">
              <div className="text-sm font-black text-slate-950">{d.label}</div>

              <div className="min-w-0">
                <div className="h-3 overflow-hidden bg-white shadow-inner">
                  <div
                    className="h-full transition-all duration-700"
                    style={{ width: `${barPct}%`, backgroundColor: d.color }}
                  />
                </div>
              </div>

              <div className="text-right text-sm font-black text-slate-950">
                {d.count.toLocaleString()}
                <span className="ml-1 text-xs font-semibold text-slate-500">victimes</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IndemnisationGauge;
