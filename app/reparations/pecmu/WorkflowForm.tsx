'use client';
import React, { useState } from 'react';
import YesNoToggle from './YesNoToggle';

export const fieldClass = 'mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary';
export const buttonClass = 'rounded-md border border-primary bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40';
export type WorkflowField = { key: string; label: string; type?: 'text' | 'textarea' | 'date' | 'number' | 'select' | 'boolean'; options?: Record<string, string>; required?: boolean; when?: (values: Record<string, any>) => boolean };
export function WorkflowForm({ fields, initial = {}, submitLabel, busy, onSubmit, children }: {
  fields: WorkflowField[]; initial?: Record<string, any>; submitLabel: string; busy: boolean;
  onSubmit: (values: Record<string, any>) => Promise<boolean>; children?: React.ReactNode;
}) {
  const [values, setValues] = useState<Record<string, any>>(() => Object.fromEntries(fields.map(field => [field.key, (field.type === 'date' && typeof initial[field.key] === 'string' ? initial[field.key].slice(0, 10) : initial[field.key]) ?? (field.type === 'boolean' ? false : '')])));
  const [error, setError] = useState('');
  return <form onSubmit={async event => {
    event.preventDefault(); setError('');
    const payload: Record<string, any> = {};
    for (const field of fields) {
      if (field.when && !field.when(values)) continue;
      const raw = values[field.key];
      const value = typeof raw === 'string' ? raw.trim() : raw;
      if (field.required && (value === '' || value === undefined)) { setError(`Renseignez « ${field.label} ».`); return; }
      if (value !== '' && value !== undefined) payload[field.key] = field.type === 'number' ? Number(value) : value;
    }
    if (payload.hospitalizationStartDate && payload.hospitalizationEndDate && payload.hospitalizationEndDate < payload.hospitalizationStartDate) { setError('La fin d’hospitalisation ne peut pas précéder le début.'); return; }
    await onSubmit(payload);
  }}>
    <fieldset disabled={busy} className="grid gap-4 md:grid-cols-2">
      {fields.filter(field => !field.when || field.when(values)).map(field => field.type === 'boolean'
        ? <YesNoToggle key={field.key} label={field.label} checked={Boolean(values[field.key])} onChange={checked => setValues(previous => ({ ...previous, [field.key]: checked }))} />
        : <label key={field.key} className={`block text-sm font-medium ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>{field.label}{field.required ? ' *' : ''}
          {field.type === 'select' ? <select required={field.required} className={fieldClass} value={values[field.key]} onChange={event => setValues(previous => ({ ...previous, [field.key]: event.target.value }))}><option value="">Sélectionner</option>{Object.entries(field.options || {}).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            : field.type === 'textarea' ? <textarea required={field.required} className={`${fieldClass} min-h-24`} value={values[field.key]} onChange={event => setValues(previous => ({ ...previous, [field.key]: event.target.value }))} />
            : <input required={field.required} type={field.type || 'text'} min={field.type === 'number' ? 0 : undefined} step={field.type === 'number' ? '0.01' : undefined} className={fieldClass} value={values[field.key]} onChange={event => setValues(previous => ({ ...previous, [field.key]: event.target.value }))} />}
        </label>)}
      {children}
      {error && <p role="alert" className="text-sm text-red-600 md:col-span-2">{error}</p>}
      <div className="md:col-span-2"><button type="submit" className={buttonClass}>{busy ? 'Enregistrement…' : submitLabel}</button></div>
    </fieldset>
  </form>;
}
