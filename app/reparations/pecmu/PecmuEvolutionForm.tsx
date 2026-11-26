'use client';

import React, { useState } from 'react';
import { careLocationFields, type CarePartnerLocation } from './careLocationFields';
import { outcomeLabels, type MedicalCare } from '../services/pecmuWorkflowApi';
import { WorkflowForm, fieldClass, type WorkflowField } from './WorkflowForm';
import PecmuInvoiceInput from './PecmuInvoiceInput';
import YesNoToggle from './YesNoToggle';
import styles from './PecmuCareForm.module.css';

const careSectionStarts: Record<string, string> = {
  supervisorName: 'Organisation des soins',
  careProvince: 'Structure et équipe soignante',
  complaints: 'Situation clinique',
  appointmentDate1: 'Rendez-vous de suivi',
  bilanParaclinique: 'Bilan et observations',
};

export default function PecmuEvolutionForm({ care, hasClosureForm, busy, onSave, careFields = [], carePartners = [], initial, submitLabel = 'Enregistrer l’évolution', modalFormId }: {
  care: MedicalCare;
  hasClosureForm: boolean;
  busy: boolean;
  careFields?: WorkflowField[];
  carePartners?: CarePartnerLocation[];
  initial?: Record<string, any>;
  submitLabel?: string;
  modalFormId?: string;
  onSave: (values: Record<string, any>, files: Record<string, File>, closeCase: boolean, invoices: File[]) => Promise<boolean>;
}) {
  const [invoices, setInvoices] = useState<File[]>([]);
  const [files, setFiles] = useState<Record<string, File>>({});
  const [closeCase, setCloseCase] = useState(false);
  const [error, setError] = useState('');
  const canClose = (outcome: string) => ['STABILIZED_OR_CURED', 'DECEASED'].includes(outcome);
  const documents = (outcome: string) => !outcome ? [] : outcome === 'TRANSFERRED'
    ? [{ type: 'TRANSFER_NOTE', label: 'Note de transfert' }]
    : [
      { type: 'MEDICAL_REPORT', label: 'Rapport médical' },
      ...(outcome === 'DECEASED' ? [{ type: 'DEATH_CERTIFICATE', label: 'Acte de décès' }] : []),
      ...(canClose(outcome) && closeCase ? [{ type: 'CLOSURE_FORM', label: 'Formulaire de clôture' }] : []),
    ];
  const exists = (type: string) => type === 'CLOSURE_FORM' ? hasClosureForm : care.documents?.some(file => (file.type || file.documentType) === type);
  const fileInput = (type: string, label: string) => <label key={type} className="block text-sm font-medium md:col-span-2">
    {label}{exists(type) ? ' — déjà chargé' : ' *'}
    <input type="file" required={!exists(type)} accept=".pdf,.png,.jpg,.jpeg" className={fieldClass} onChange={event => {
      const file = event.target.files?.[0];
      setFiles(previous => { const next = { ...previous }; if (file) next[type] = file; else delete next[type]; return next; });
    }} />
  </label>;
  const groupedCareFields = modalFormId ? careFields.flatMap(field => {
    const section = careSectionStarts[field.key];
    return section ? [{ key: field.key + 'Heading', label: section, type: 'heading' as const }, field] : [field];
  }) : careFields;
  return <WorkflowForm externalFormId={modalFormId} className={modalFormId ? styles.form : undefined} busy={busy} initial={initial ?? care} submitLabel={submitLabel} fields={[
    ...groupedCareFields,
    ...(careFields.length ? [{ key: 'evolutionHeading', label: modalFormId ? 'Évolution du dossier' : 'Évolution', type: 'heading' as const }] : []),
    { key: 'outcome', label: 'Évolution', type: 'select', options: outcomeLabels, required: !careFields.length },
    ...careLocationFields('transfer', carePartners).map(field => ({ ...field, when: (values: Record<string, any>) => values.outcome === 'TRANSFERRED' })),
    { key: 'transferNotes', label: 'Motif de transfert', type: 'textarea', when: values => values.outcome === 'TRANSFERRED' },
  ]} onSubmit={async values => {
    setError('');
    const requiredDocuments = documents(values.outcome);
    if (requiredDocuments.some(({ type }) => !files[type] && !exists(type))) { setError('Chargez les documents requis pour cette évolution.'); return false; }
    const today = new Date();
    const outcomeDate = values.outcome === care.outcome && care.outcomeDate
      ? care.outcomeDate.slice(0, 10)
      : `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return onSave({ ...values, ...(values.outcome ? { outcomeDate } : {}) }, Object.fromEntries(requiredDocuments.filter(({ type }) => files[type]).map(({ type }) => [type, files[type]])), canClose(values.outcome) && closeCase, invoices);
  }}>{values => <>
    {modalFormId && <h3>Pièces jointes</h3>}
    <PecmuInvoiceInput onChange={setInvoices} />
    {documents(values.outcome).filter(doc => doc.type !== 'CLOSURE_FORM').map(doc => fileInput(doc.type, doc.label))}
    {canClose(values.outcome) && <div className="md:col-span-2"><YesNoToggle label="Dossier clôturé ?" checked={closeCase} onChange={setCloseCase} /></div>}
    {canClose(values.outcome) && closeCase && fileInput('CLOSURE_FORM', 'Formulaire de clôture')}
    {values.outcome === 'TRANSFERRED' && <p className="text-sm text-slate-500 md:col-span-2">Le dossier reste ouvert pour la prise en charge dans la structure receveuse.</p>}
    {values.outcome === 'LOST_TO_FOLLOW_UP' && <p className="text-sm text-slate-500 md:col-span-2">Le dossier reste ouvert pour poursuivre le suivi.</p>}
    {error && <p role="alert" className="text-sm text-red-600 md:col-span-2">{error}</p>}
  </>}</WorkflowForm>;
}
