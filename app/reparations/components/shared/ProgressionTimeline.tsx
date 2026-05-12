"use client";

import React from 'react';
import { FiCheck, FiClock, FiCircle } from 'react-icons/fi';
import type { TimelineStep, ProgressionStatut } from '../../types/programmes';

interface ProgressionTimelineProps {
  steps: TimelineStep[];
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

const ICON_MAP: Record<ProgressionStatut, { icon: React.ReactNode; ring: string; bg: string }> = {
  terminee: {
    icon: <FiCheck size={14} className="text-white" />,
    ring: 'ring-emerald-200',
    bg: 'bg-emerald-500',
  },
  en_cours: {
    icon: <FiClock size={14} className="text-white" />,
    ring: 'ring-amber-200',
    bg: 'bg-amber-500',
  },
  evaluee: {
    icon: <FiClock size={14} className="text-white" />,
    ring: 'ring-blue-200',
    bg: 'bg-blue-500',
  },
  non_commence: {
    icon: <FiCircle size={14} className="text-gray-400" />,
    ring: 'ring-gray-200',
    bg: 'bg-gray-100',
  },
};

const LINE_COLORS: Record<ProgressionStatut, string> = {
  terminee: 'bg-emerald-400',
  en_cours: 'bg-amber-300',
  evaluee: 'bg-blue-300',
  non_commence: 'bg-gray-200',
};

const ProgressionTimeline: React.FC<ProgressionTimelineProps> = ({
  steps,
  orientation = 'vertical',
  className = '',
}) => {
  if (orientation === 'horizontal') {
    return (
      <div className={`flex items-start gap-0 overflow-x-auto pb-2 ${className}`}>
        {steps.map((step, idx) => {
          const cfg = ICON_MAP[step.statut];
          const isLast = idx === steps.length - 1;
          return (
            <div key={step.key} className="flex items-start flex-shrink-0" style={{ minWidth: 120 }}>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-2 ${cfg.ring} ${cfg.bg} shadow-sm`}>
                  {cfg.icon}
                </div>
                <div className="mt-2 text-center px-1">
                  <div className="text-xs font-semibold text-gray-800 leading-tight">{step.label}</div>
                  {step.date && <div className="text-[10px] text-gray-500 mt-0.5">{step.date}</div>}
                </div>
              </div>
              {!isLast && (
                <div className={`h-0.5 flex-1 mt-4 min-w-[24px] ${LINE_COLORS[step.statut]}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Vertical
  return (
    <div className={`space-y-0 ${className}`}>
      {steps.map((step, idx) => {
        const cfg = ICON_MAP[step.statut];
        const isLast = idx === steps.length - 1;
        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-2 ${cfg.ring} ${cfg.bg} shadow-sm flex-shrink-0`}>
                {cfg.icon}
              </div>
              {!isLast && (
                <div className={`w-0.5 flex-1 min-h-[32px] ${LINE_COLORS[step.statut]}`} />
              )}
            </div>
            <div className={`pb-6 ${isLast ? '' : ''}`}>
              <div className="text-sm font-semibold text-gray-800">{step.label}</div>
              {step.date && <div className="text-xs text-gray-500 mt-0.5">{step.date}</div>}
              {step.description && <div className="text-xs text-gray-600 mt-1">{step.description}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProgressionTimeline;
