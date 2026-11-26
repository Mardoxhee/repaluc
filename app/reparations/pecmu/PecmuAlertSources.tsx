'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { alertStructureTypes, type AlertSource } from '../services/pecmuAlertSources';
import { fieldClass } from './WorkflowForm';

type Props = { sources: AlertSource[]; onChange: (rows: AlertSource[]) => void; required?: boolean };
const contacts: [keyof AlertSource, string][] = [
  ['structureName', 'Structure'], ['contactName', 'Personne de contact'],
  ['phone', 'Téléphone'], ['relationship', 'Lien avec la victime'], ['address', 'Adresse'],
];

export default function PecmuAlertSources({ sources, onChange, required = true }: Props) {
  const rows: AlertSource[] = sources.length ? sources : [{}];
  function update(index: number, key: keyof AlertSource, value: string) {
    onChange(rows.map((row, i) => {
      if (i !== index) return row;
      const next = { ...row, [key]: value };
      if (key === 'structureType' && value !== 'AUTRE') delete next.otherStructureType;
      return next;
    }));
  }
  return <div className="space-y-4 md:col-span-2">
    {rows.map((row, index) => <fieldset className="space-y-2" key={index}>
      <legend className="text-sm font-semibold text-slate-800">Source {index + 1}</legend>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">Type de source{required && ' *'}
          <select required={required} className={fieldClass} value={row.structureType || ''} onChange={e => update(index, 'structureType', e.target.value)}>
            <option value="">Sélectionner</option>
            {row.structureType && !alertStructureTypes[row.structureType] && <option>{row.structureType}</option>}
            {Object.entries(alertStructureTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {row.structureType === 'AUTRE' && <label className="text-sm font-medium">Précisez le type de source{required && ' *'}
          <input className={fieldClass} required={required} value={row.otherStructureType || ''} onChange={e => update(index, 'otherStructureType', e.target.value)} />
        </label>}
        {contacts.map(([key, label]) => <label key={key} className="text-sm font-medium">{label}
          <input className={fieldClass} type={key === 'phone' ? 'tel' : 'text'} value={row[key] || ''} onChange={e => update(index, key, e.target.value)} />
        </label>)}
      </div>
      {rows.length > 1 && <button type="button" className="inline-flex items-center gap-2 text-sm text-red-600" onClick={() => onChange(rows.filter((_, i) => i !== index))}>
        <Trash2 size={15} /> Retirer la source {index + 1}
      </button>}
    </fieldset>)}
    <button type="button" className="inline-flex items-center gap-2 rounded-md border border-primary/30 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/5" onClick={() => onChange([...rows, {}])}>
      <Plus size={16} /> Ajouter une source
    </button>
  </div>;
}
