'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { canEditPecmuWorkflow, createPecmuCareEpisode, loadPecmuWorkflow, outcomeLabels, pecmuRequest, uploadCareInvoices, uploadPecmuFile, validatePecmuFile, workflowJson, type WorkflowSnapshot } from '../services/pecmuWorkflowApi';
import PecmuEvolutionForm from './PecmuEvolutionForm';
import { useMedicalCareFields } from './useMedicalCareFields';

type Mode = 'nouveau' | 'transfert' | 'readmission';
const titles = {
  nouveau: 'Nouvelle prise en charge',
  transfert: 'Prise en charge après transfert',
  readmission: 'Réadmission après rechute',
};
const admissionTypes = { nouveau: 'STANDARD', transfert: 'TRANSFER', readmission: 'READMISSION' } as const;
const evolutionKeys = ['outcome', 'outcomeDate', 'transferStructureName', 'transferProvince', 'transferHealthZone', 'transferNotes'];

export default function PecmuNewCarePage({ ficheId, mode }: { ficheId: number; mode: Mode }) {
  const router = useRouter();
  const dossierUrl = `/reparations/pecmu?dossier=${ficheId}&etape=${mode === 'readmission' ? 'readmission' : 'care'}`;
  const [state, setState] = useState<WorkflowSnapshot | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [missingId, setMissingId] = useState(false);
  const lock = useRef(false);
  const requestId = useRef('');
  const careId = useRef<number | null>(null);
  const uploaded = useRef(new WeakSet<File>());
  useEffect(() => {
    let active = true;
    setError('');
    loadPecmuWorkflow(pecmuRequest, ficheId)
      .then(data => { if (active) setState(data); })
      .catch(e => { if (active) setError(e.message || 'Impossible de charger le dossier.'); });
    return () => { active = false; };
  }, [ficheId, retry]);
  const canEdit = canEditPecmuWorkflow(state);
  const { careFormFields, carePartners, loadingSupervisors, normalizeSupervisorValues, supervisorInitial } = useMedicalCareFields(pecmuRequest, canEdit);
  const previous = state?.medicalCare.at(-1);
  const unavailable = mode === 'readmission' && !previous ? 'Enregistrez une première prise en charge avant une réadmission.'
    : mode === 'transfert' && (!previous || previous.outcome !== 'TRANSFERRED' && state?.currentStatus !== 'TRANSFERRED') ? 'Le dernier épisode ne comporte pas de transfert.' : '';

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
        const response = await createPecmuCareEpisode(pecmuRequest, {
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
        await workflowJson(pecmuRequest, `/acte-medical-pecmu/${careId.current}`, careValues, 'PUT');
      }
      const id = careId.current!;
      if (values.outcome) await workflowJson(pecmuRequest, `/acte-medical-pecmu/${id}`, evolution, 'PUT');
      for (const [type, file] of Object.entries(documents)) {
        if (uploaded.current.has(file)) continue;
        const path = type === 'CLOSURE_FORM' ? `/fiche-pecmu/${ficheId}/documents/CLOSURE_FORM` : `/acte-medical-pecmu/${id}/documents/${type}`;
        await uploadPecmuFile(pecmuRequest, path, file);
        uploaded.current.add(file);
      }
      await uploadCareInvoices(pecmuRequest, id, invoices, uploaded.current);
      if (closeCase) {
        const today = new Date();
        const closureDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        await workflowJson(pecmuRequest, `/fiche-pecmu/${ficheId}/close`, { reason: outcomeLabels[values.outcome as keyof typeof outcomeLabels], closureDate });
      }
      router.replace(dossierUrl);
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Enregistrement impossible.';
      setError(careId.current ? `La prise en charge #${careId.current} existe. ${message} Vous pouvez reprendre sur cet épisode.` : message);
      setBusy(false);
      lock.current = false;
      return false;
    }
  }

  return <main className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
    <Link href={dossierUrl} className="text-sm font-semibold text-primary underline">← Retour au dossier #{ficheId}</Link>
    <header className="border-b border-slate-200 pb-4">
      <h1 className="text-2xl font-bold text-slate-900">{titles[mode]}</h1>
      {state && <p className="mt-1 text-sm text-slate-600">{state.fiche.victimName || `Dossier #${ficheId}`}</p>}
      {previous && mode !== 'nouveau' && <p className="text-sm text-slate-600">Prise en charge précédente #{previous.sequenceNumber}{previous.careStructureName && ` · ${previous.careStructureName}`}</p>}
    </header>
    {error && <div role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}
      {!state && <button className="ml-3 underline" onClick={() => setRetry(n => n + 1)}>Réessayer</button>}
    </div>}
    {!state ? !error && <p role="status">Chargement du dossier…</p> : !canEdit ? <p>Ce dossier est en lecture seule.</p> : unavailable ? <p>{unavailable}</p> : loadingSupervisors ? <p role="status">Chargement du formulaire…</p> :
      <section className="border border-slate-200 bg-white p-5">
        <PecmuEvolutionForm care={{ id: 0, fichePecmuId: ficheId, sequenceNumber: (previous?.sequenceNumber || 0) + 1 }}
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
          submitLabel="Enregistrer la prise en charge" onSave={save} />
      </section>}
  </main>;
}
