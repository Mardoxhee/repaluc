"use client";

import React from 'react';

type Props = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
};

export default function YesNoToggle({ label, checked, onChange, className = '' }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`flex min-h-14 w-full items-center justify-between gap-3 border px-3 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'border-primary/40 bg-primary/5' : 'border-slate-200 bg-white hover:bg-slate-50'} ${className}`}
    >
      <span className="font-medium text-slate-700">{label}</span>
      <span aria-hidden="true" className="flex shrink-0 items-center gap-2">
        <span className={`w-7 text-xs font-semibold ${checked ? 'text-primary' : 'text-slate-500'}`}>{checked ? 'Oui' : 'Non'}</span>
        <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-slate-300'}`}>
          <span className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </span>
      </span>
    </button>
  );
}
