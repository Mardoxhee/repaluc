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
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 ${className}`}>
      {title && (
        <h3 className="text-lg font-bold text-gray-900 mb-6">{title}</h3>
      )}

      {/* Barre segmentée */}
      <div className="h-5 w-full rounded-full overflow-hidden flex bg-gray-100 mb-6">
        {data.map((d) => {
          const pct = total > 0 ? (d.count / total) * 100 : 0;
          if (pct <= 0) return null;
          return (
            <div
              key={d.label}
              className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
              style={{ width: `${pct}%`, backgroundColor: d.color }}
              title={`${d.label}: ${d.count} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Légende / paliers */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {data.map((d) => {
          const pct = total > 0 ? ((d.count / total) * 100).toFixed(1) : '0';
          return (
            <div key={d.label} className="flex flex-col items-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div
                className="w-3 h-3 rounded-full mb-2"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-lg font-bold text-gray-900">{d.count.toLocaleString()}</span>
              <span className="text-xs text-gray-500 font-medium">{d.label}</span>
              <span className="text-[10px] text-gray-400 mt-0.5">{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-gray-100 text-center">
        <span className="text-sm text-gray-500">Total: </span>
        <span className="text-sm font-bold text-gray-900">{total.toLocaleString()} victimes</span>
      </div>
    </div>
  );
};

export default IndemnisationGauge;
