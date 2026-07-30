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
      className={`relative overflow-hidden bg-white/95 rounded-2xl shadow-[0_14px_40px_-28px_rgba(15,23,42,0.55)] border border-slate-200/70 p-5 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-26px_rgba(15,23,42,0.62)] transition-all duration-300 group ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${color}`} />
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-start gap-3 mb-4">
            <div className={`p-2.5 rounded-xl ${color} shadow-sm ring-1 ring-white/40 group-hover:scale-105 transition-transform duration-300`}>
              {icon}
            </div>
            <div className="min-w-0">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.16em]">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500 mt-1 leading-snug">{subtitle}</p>}
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                {loading ? (
                  <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-lg" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black tracking-tight text-slate-950">{safeCurrent.toLocaleString()}</span>
                    <span className="text-sm text-slate-500 font-medium">/ {safeTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="mt-2 text-xs text-slate-600">
                  {loading ? (
                    <div className="h-3 w-28 bg-slate-100 animate-pulse rounded" />
                  ) : percent > 0 ? (
                    <>
                      <span className="font-semibold text-slate-950">{percent}%</span>
                      <span className="text-slate-500"> de couverture</span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-semibold text-slate-500">Progression</div>
              </div>
            </div>

            <div className="mt-4 h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-500 via-teal-500 to-secondary-500 transition-all duration-700"
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
