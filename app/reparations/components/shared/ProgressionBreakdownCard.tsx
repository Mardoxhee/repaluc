"use client";

import React from 'react';

interface BreakdownItem {
  label: string;
  count: number;
  color: string;
}

interface ProgressionBreakdownCardProps {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  items: BreakdownItem[];
  className?: string;
}

const ProgressionBreakdownCard: React.FC<ProgressionBreakdownCardProps> = ({
  title,
  icon,
  iconBg,
  items,
  className = '',
}) => {
  const total = items.reduce((s, i) => s + i.count, 0);

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-5">
        <div className={`p-2.5 rounded-xl ${iconBg} shadow-sm`}>{icon}</div>
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">{total.toLocaleString()} victimes au total</p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const pct = total > 0 ? (item.count / total) * 100 : 0;
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{item.count.toLocaleString()}</span>
                  <span className="text-xs text-gray-400">({pct.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressionBreakdownCard;
