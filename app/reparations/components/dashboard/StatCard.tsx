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
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle, trend, loading }) => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group">
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
        <div className="flex items-end gap-2">
          {loading ? (
            <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
          ) : (
            <span className="text-3xl font-bold text-gray-900">{value}</span>
          )}
          {trend && (
            <span className="text-sm font-medium text-green-600 mb-1">{trend}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default StatCard;
