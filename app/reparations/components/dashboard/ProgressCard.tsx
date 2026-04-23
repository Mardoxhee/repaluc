"use client";

import React from 'react';

export interface ProgressCardProps {
  title: string;
  current: number;
  total: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  loading?: boolean;
  onClick?: () => void;
}

const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  current,
  total,
  icon,
  color,
  subtitle,
  loading,
  onClick,
}) => {
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 0;
  const safeCurrent = Number.isFinite(current) && current > 0 ? Math.min(current, safeTotal || current) : 0;
  const percent = safeTotal > 0 ? Math.round((safeCurrent / safeTotal) * 100) : 0;

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-3 rounded-xl ${color} shadow-md group-hover:scale-110 transition-transform duration-300`}>
              {icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</h3>
              {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                {loading ? (
                  <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{safeCurrent.toLocaleString()}</span>
                    <span className="text-sm text-gray-500 font-medium">/ {safeTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-600">
                  {loading ? (
                    <div className="h-3 w-28 bg-gray-200 animate-pulse rounded" />
                  ) : percent > 0 ? (
                    <>
                      <span className="font-semibold text-gray-900">{percent}%</span>
                      <span className="text-gray-500"> de couverture</span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-semibold text-gray-500">Progression</div>
              </div>
            </div>

            <div className="mt-4 h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-700"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressCard;
