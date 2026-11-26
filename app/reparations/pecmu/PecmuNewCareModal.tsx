'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Save, X } from 'lucide-react';
import type { PecmuFetcher } from '../services/pecmuApi';
import { canEditPecmuWorkflow, createPecmuCareEpisode, outcomeLabels, uploadCareInvoices, uploadPecmuFile, validatePecmuFile, workflowJson, type WorkflowSnapshot } from '../services/pecmuWorkflowApi';
import PecmuEvolutionForm from './PecmuEvolutionForm';
import type { useMedicalCareFields } from './useMedicalCareFields';

export type CareMode = 'nouveau' | 'transfert' | 'readmission';
const titles = {
  nouveau: 'Nouvelle prise en charge',
  transfert: 'Prise en charge après transfert',
  readmission: 'Réadmission après rechute',
};
const admissionTypes = { nouveau: 'STANDARD', transfert: 'TRANSFER', readmission: 'READMISSION' } as const;
const evolutionKeys = ['outcome', 'outcomeDate', 'transferStructureName', 'transferProvince', 'transferHealthZone', 'transferNotes'];

type Props = {
  state: WorkflowSnapshot;
  mode: CareMode;
  fetcher: PecmuFetcher;
  fields: ReturnType<typeof useMedicalCareFields>;
  onFinish: (changed: boolean) => void;
};

export default function PecmuNewCareModal({ state, mode, fetcher, fields, onFinish }: Props) {
  const ficheId = state.fiche.id;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formId = useId();
  const titleId = useId();
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [missingId, setMissingId] = useState(false);
  const lock = useRef(false);
  const requestId = useRef('');
  const careId = useRef<number | null>(null);
  const uploaded = useRef(new WeakSet<File>());
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const canEdit = canEditPecmuWorkflow(state);
  const { careFormFields, carePartners, loadingSupervisors, normalizeSupervisorValues, supervisorInitial } = fields;
  const previous = state.medicalCare.at(-1);
  const unavailable = mode === 'readmission' && !previous ? 'Enregistrez une première prise en charge avant une réadmission.'
    : mode === 'transfert' && (!previous || previous.outcome !== 'TRANSFERRED' && state.currentStatus !== 'TRANSFERRED') ? 'Le dernier épisode ne comporte pas de transfert.' : '';

  async function save(values: Record<string, any>, documents: Record<string, File>, closeCase: boolean, invoices: File[]) {
    if (lock.current || !canEdit || missingId) return false;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      [...Object.values(documents), ...invoices].forEach(validatePecmuFile);
      const fields = Object.entries(values);
      const careValues = normalizeSupervisorValues(Object.fromEntries(fields.filter(([key]) => !evolutionKeys.includes(key))));
      const evolution = Object.fromEntries(fields.filter(([key]) => evolutionKeys.includes(key)));
      if (!careId.current) {
        requestId.current ||= crypto.randomUUID();
        const response = await createPecmuCareEpisode(fetcher, {
          ...careValues, fichePecmuId: ficheId, admissionType: admissionTypes[mode],
          ...(mode !== 'nouveau' && previous ? { previousCareId: previous.id } : {}),
        }, requestId.current);
        const id = response?.data?.id ?? response?.id;
        if (!Number.isSafeInteger(id) || id < 1) {
          setMissingId(true);
          throw new Error('Le serveur a accepté la création sans retourner le numéro de la prise en charge. Revenez au dossier pour retrouver cet épisode.');
        }
        careId.current = id;
      } else {
        await workflowJson(fetcher, `/acte-medical-pecmu/${careId.current}`, careValues, 'PUT');
      }
      const id = careId.current!;
      if (values.outcome) await workflowJson(fetcher, `/acte-medical-pecmu/${id}`, evolution, 'PUT');
      for (const [type, file] of Object.entries(documents)) {
        if (uploaded.current.has(file)) continue;
        const path = type === 'CLOSURE_FORM' ? `/fiche-pecmu/${ficheId}/documents/CLOSURE_FORM` : `/acte-medical-pecmu/${id}/documents/${type}`;
        await uploadPecmuFile(fetcher, path, file);
        uploaded.current.add(file);
      }
      await uploadCareInvoices(fetcher, id, invoices, uploaded.current);
      if (closeCase) {
        const today = new Date();
        const closureDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        await workflowJson(fetcher, `/fiche-pecmu/${ficheId}/close`, { reason: outcomeLabels[values.outcome as keyof typeof outcomeLabels], closureDate });
      }
      onFinish(true);
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Enregistrement impossible.';
      setError(careId.current ? `La prise en charge #${careId.current} existe. ${message} Vous pouvez reprendre sur cet épisode.` : message);
      setBusy(false);
      lock.current = false;
      return false;
    }
  }

  const close = () => {
    if (!lock.current) onFinish(Boolean(careId.current) || missingId);
  };

  function keepFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:enabled, input:enabled, select:enabled, textarea:enabled');
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return <dialog ref={dialogRef} aria-labelledby={titleId} onKeyDown={keepFocus} onCancel={event => { event.preventDefault(); close(); }}
    className="fixed inset-0 m-auto max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-4xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl open:flex backdrop:bg-slate-950/45 sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100%-3rem)]">
    <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 border-l-4 border-l-primary px-4 py-3 sm:px-6 sm:py-4">
      <div className="min-w-0">
        <h2 id={titleId} className="text-xl font-bold text-slate-950">{titles[mode]}</h2>
        <p className="mt-1 break-words text-sm text-slate-600">Dossier PECMU #{ficheId}{state.fiche.victimName && ` · ${state.fiche.victimName}`}</p>
      </div>
      <button type="button" disabled={busy} onClick={close} aria-label="Fermer la prise en charge"
        className="shrink-0 rounded-md p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-primary disabled:opacity-50"><X size={20} /></button>
    </header>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
      {previous && mode !== 'nouveau' && <p className="mb-4 text-sm text-slate-600">Prise en charge précédente #{previous.sequenceNumber}{previous.careStructureName && ` · ${previous.careStructureName}`}</p>}
      {error && <p role="alert" tabIndex={-1} ref={errorRef} className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {unavailable ? <p>{unavailable}</p> : loadingSupervisors ? <p role="status">Chargement du formulaire…</p> :
        <PecmuEvolutionForm modalFormId={formId} care={{ id: 0, fichePecmuId: ficheId, sequenceNumber: (previous?.sequenceNumber || 0) + 1 }}
          initial={{
            ...supervisorInitial(previous?.supervisorName),
            careStructureName: state.fiche.careStructureName, careProvince: state.fiche.province,
            careHealthZone: state.fiche.healthZone,
            ...(mode === 'transfert' && previous ? {
              careStructureName: previous.transferStructureName, careProvince: previous.transferProvince,
              careHealthZone: previous.transferHealthZone, careMode: previous.careMode,
              complaints: previous.complaints, diagnosis: previous.diagnosis, treatmentReceived: previous.treatmentReceived,
            } : {}),
          }}
          hasClosureForm={false} busy={busy || missingId} careFields={careFormFields} carePartners={carePartners}
          onSave={save} />}
    </div>
    <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
      <button type="button" disabled={busy} onClick={close}
        className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50">{careId.current || missingId || unavailable ? 'Fermer' : 'Annuler'}</button>
      {!unavailable && <button type="submit" form={formId} disabled={busy || missingId || loadingSupervisors}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
        <Save size={16} aria-hidden="true" />{busy ? 'Enregistrement…' : 'Enregistrer la prise en charge'}
      </button>}
    </footer>
  </dialog>;
}
