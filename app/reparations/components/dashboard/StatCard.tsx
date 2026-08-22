"use client";

import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  trend?: string;
  loading?: boolean;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle, trend, loading, onClick }) => (
  <div
    className={`relative min-w-0 overflow-hidden bg-white/95 rounded-lg shadow-[0_14px_40px_-28px_rgba(15,23,42,0.55)] border border-slate-200/70 p-5 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-26px_rgba(15,23,42,0.62)] transition-all duration-300 group ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={(e) => {
      if (!onClick) return;
      if (e.key === 'Enter' || e.key === ' ') onClick();
    }}
  >
    <div className={`absolute inset-x-0 top-0 h-1 ${color}`} />
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2.5 rounded-md ${color} shadow-sm ring-1 ring-white/40 group-hover:scale-105 transition-transform duration-300`}>
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.16em]">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-1 leading-snug">{subtitle}</p>}
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap items-end gap-2">
          {loading ? (
            <div className="h-8 w-20 bg-slate-100 animate-pulse rounded-lg"></div>
          ) : (
            <span className="min-w-0 break-words text-3xl font-black tracking-tight text-slate-950">{value}</span>
          )}
          {trend && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full mb-1">{trend}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default StatCard;
