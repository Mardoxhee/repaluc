'use client';

import { useEffect, useState } from 'react';
import { normalizeApiList } from '../utils/mentionStats';
import type { PecmuFetcher } from '../services/pecmuApi';
import { getMedicalSupervisorOptions, type SupervisorOption } from '../services/pecmuWorkflowApi';
import type { WorkflowField } from './WorkflowForm';
import { careLocationFields, type CarePartnerLocation } from './careLocationFields';
import { spreadsheetPartners } from '../constants/spreadsheetPartners';

const careFields = (partners: CarePartnerLocation[]): WorkflowField[] => [
  { key: 'careMode', label: 'Mode de prise en charge', type: 'select', required: true, options: { OUTPATIENT: 'Ambulatoire', HOSPITALIZATION: 'Hospitalisation' } },
  { key: 'careDate', label: 'Date des soins', type: 'date', required: true, when: values => values.careMode === 'OUTPATIENT' },
  { key: 'hospitalizationStartDate', label: 'Début d’hospitalisation', type: 'date', required: true, when: values => values.careMode === 'HOSPITALIZATION' },
  { key: 'hospitalizationEndDate', label: 'Fin d’hospitalisation', type: 'date', when: values => values.careMode === 'HOSPITALIZATION' },
  ...careLocationFields('care', partners),
  { key: 'treatingDoctorName', label: 'Médecin traitant' }, { key: 'treatingDoctorPhone', label: 'Téléphone du médecin' },
  { key: 'complaints', label: 'Plaintes', type: 'list', itemLabel: 'Plainte', addLabel: 'Ajouter une plainte' }, { key: 'diagnosis', label: 'Diagnostics', type: 'list', itemLabel: 'Diagnostic', addLabel: 'Ajouter un diagnostic' },
  { key: 'treatmentReceived', label: 'Traitements reçus', type: 'list', itemLabel: 'Traitement', addLabel: 'Ajouter un traitement' },
  { key: 'appointmentDate1', label: 'Premier rendez-vous', type: 'date' }, { key: 'appointmentComment1', label: 'Commentaires du premier rendez-vous', type: 'textarea' },
  { key: 'appointmentDate2', label: 'Deuxième rendez-vous', type: 'date' }, { key: 'appointmentComment2', label: 'Commentaires du deuxième rendez-vous', type: 'textarea' },
  { key: 'appointmentDate3', label: 'Troisième rendez-vous', type: 'date' }, { key: 'appointmentComment3', label: 'Commentaires du troisième rendez-vous', type: 'textarea' },
  { key: 'bilanParaclinique', label: 'Bilan paraclinique', type: 'textarea' },
  { key: 'cout', label: 'Coût (USD)', type: 'number' }, { key: 'observation', label: 'Observation', type: 'textarea' },
];

export function useMedicalCareFields(fetcher: PecmuFetcher, canEdit: boolean) {
  const [loadingSupervisors, setLoadingSupervisors] = useState(true);
  const [supervisors, setSupervisors] = useState<SupervisorOption[]>([]);
  const [otherSupervisor, setOtherSupervisor] = useState<SupervisorOption & { requiresSpecification?: boolean }>({ value: 'OTHER', label: 'Autre à préciser', requiresSpecification: true });
  const [supervisorLookupFailed, setSupervisorLookupFailed] = useState(false);
  const [carePartners, setCarePartners] = useState<Array<{ id?: number; nom?: string; structure?: string; province?: string; zoneSante?: string; healthZone?: string }>>([...spreadsheetPartners]);
  useEffect(() => {
    if (!canEdit) return;
    let active = true;
    void getMedicalSupervisorOptions(fetcher).then(result => {
      if (!active) return;
      setSupervisors(result.data); setOtherSupervisor(result.other); setSupervisorLookupFailed(false);
    }).catch(() => { if (active) { setSupervisors([]); setSupervisorLookupFailed(true); } }).finally(() => { if (active) setLoadingSupervisors(false); });
    return () => { active = false; };
  }, [fetcher, canEdit]);
  useEffect(() => {
    if (!canEdit) return;
    let active = true;
    void fetcher('/partenaires').then(result => {
      if (active) setCarePartners([...spreadsheetPartners, ...normalizeApiList(result)]);
    }).catch(() => { if (active) setCarePartners([...spreadsheetPartners]); });
    return () => { active = false; };
  }, [fetcher, canEdit]);
  const supervisorField: WorkflowField = {
    key: 'supervisorName', label: 'Superviseur médical', required: true,
    type: supervisorLookupFailed ? 'text' : 'select',
    options: Object.fromEntries([...supervisors, otherSupervisor].map(option => [option.value, option.label])),
  };
  const careFormFields: WorkflowField[] = [
    supervisorField,
    { key: 'supervisorOtherName', label: 'Nom du superviseur', required: true, when: values => !supervisorLookupFailed && values.supervisorName === otherSupervisor.value },
    ...careFields(carePartners),
  ];
  const normalizeSupervisorValues = (values: Record<string, any>) => {
    const result = { ...values };
    result.supervisorName = supervisorLookupFailed || values.supervisorName !== otherSupervisor.value ? values.supervisorName : values.supervisorOtherName;
    delete result.supervisorOtherName;
    if (!result.supervisorName?.trim()) throw new Error('Choisissez ou saisissez le nom du superviseur.');
    return result;
  };

  function supervisorInitial(name?: string) {
    if (!name || supervisorLookupFailed || supervisors.some(option => option.value === name)) return { supervisorName: name || '' };
    return { supervisorName: otherSupervisor.value, supervisorOtherName: name };
  }
  return { careFormFields, carePartners, normalizeSupervisorValues, supervisorInitial, loadingSupervisors };
}
