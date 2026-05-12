"use client";

import React from 'react';
import type { ProgressionStatut } from '../../types/programmes';

interface StatusBadgeProps {
  statut: ProgressionStatut;
  size?: 'sm' | 'md';
  className?: string;
}

const CONFIG: Record<ProgressionStatut, { label: string; bg: string; text: string; dot: string }> = {
  non_commence: { label: 'Non commencé', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  evaluee: { label: 'Évaluée', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  en_cours: { label: 'En cours', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  terminee: { label: 'Terminée', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ statut, size = 'sm', className = '' }) => {
  const c = CONFIG[statut] ?? CONFIG.non_commence;
  const sizeClasses = size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${c.bg} ${c.text} ${sizeClasses} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

export default StatusBadge;
