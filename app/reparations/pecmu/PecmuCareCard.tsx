'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { outcomeLabels, type MedicalCare } from '../services/pecmuWorkflowApi';

type Field = [keyof MedicalCare, string, ('date' | 'list' | 'cost')?];
const present = (value: unknown) => value != null && String(value).trim() !== '';
const date = (value: string) => new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString('fr-FR');

export default function PecmuCareCard({ care, children }: { care: MedicalCare; children?: React.ReactNode }) {
  const section = (title: string, fields: Field[]) => {
    const visible = fields.filter(([key]) => present(care[key]));
    if (!visible.length) return null;
    return <section className="space-y-3">
      <h4 className="text-sm font-semibold text-primary">{title}</h4>
      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">{visible.map(([key, label, format]) => {
        const value = String(care[key]);
        return <div key={key} className={key === 'observation' || key === 'transferNotes' ? 'sm:col-span-2 lg:col-span-3' : ''}>
          <dt className="text-xs font-medium text-slate-500">{label}</dt>
          <dd className="mt-1 break-words text-sm text-slate-900">
            {format === 'list' ? <ul className="list-disc space-y-1 pl-4">{value.split(/\r?\n/).filter(line => line.trim()).map((line, index) => <li key={index}>{line}</li>)}</ul>
              : format === 'date' ? date(value)
                : format === 'cost' ? `${Number(value).toLocaleString('fr-FR')} USD`
                  : <span className="whitespace-pre-wrap">{value}</span>}
          </dd>
        </div>;
      })}</dl>
    </section>;
  };
  const mode = care.careMode === 'HOSPITALIZATION' ? 'Hospitalisation' : care.careMode === 'OUTPATIENT' ? 'Ambulatoire' : null;
  return <details className="group w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm open:border-primary/30">
    <summary className="flex cursor-pointer list-none items-center gap-4 p-4 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary md:p-5 [&::-webkit-details-marker]:hidden">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">{care.sequenceNumber}</span>
      <div className="min-w-0 flex-1">
        <h3 className="break-words font-semibold text-slate-900">{care.careStructureName || `Prise en charge ${care.sequenceNumber}`}</h3>
        <p className="mt-1 text-sm text-slate-500">{[mode, care.careProvince].filter(Boolean).join(' · ')}</p>
        <span className="mt-2 inline-block rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{care.outcome ? outcomeLabels[care.outcome] : 'En cours'}</span>
      </div>
      <ChevronDown size={20} aria-hidden="true" className="shrink-0 text-primary transition-transform group-open:rotate-180 motion-reduce:transition-none" />
    </summary>
    <div className="space-y-6 border-t border-slate-200 p-4 md:p-6">
      {section('Équipe et séjour', [
        ['supervisorName', 'Superviseur médical'], ['treatingDoctorName', 'Médecin traitant'], ['treatingDoctorPhone', 'Téléphone du médecin'],
        ...(care.careMode === 'HOSPITALIZATION' ? [['hospitalizationStartDate', 'Début d’hospitalisation', 'date'], ['hospitalizationEndDate', 'Fin d’hospitalisation', 'date']] as Field[]
          : care.careMode === 'OUTPATIENT' ? [['careDate', 'Date des soins', 'date']] as Field[] : []),
      ])}
      {section('Situation médicale', [['complaints', 'Plaintes', 'list'], ['diagnosis', 'Diagnostics', 'list'], ['treatmentReceived', 'Traitements reçus', 'list']])}
      {section('Rendez-vous', [['appointmentDate1', 'Premier rendez-vous', 'date'], ['appointmentDate2', 'Deuxième rendez-vous', 'date'], ['appointmentDate3', 'Troisième rendez-vous', 'date']])}
      {section('Prise en charge et observations', [['cout', 'Coût', 'cost'], ['partenaireNom', 'Partenaire médical'], ['partenaireTitre', 'Titre / convention'], ['observation', 'Observation']])}
      {care.outcome === 'TRANSFERRED' && section('Transfert vers la structure receveuse', [['transferStructureName', 'Structure receveuse'], ['transferProvince', 'Province'], ['transferNotes', 'Informations de suivi']])}
      {children}
    </div>
  </details>;
}
