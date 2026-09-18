"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { CalendarDays, ClipboardList, FileCheck2, FileText, Pencil, Plus, Save, Stethoscope, Trash2, X } from 'lucide-react';
import Swal from 'sweetalert2';
import type { PecmuFetcher, FichePecmu, ActeConsentementPecmu, ActeMedicalPecmu, SuiviAccompagnement } from '../services/pecmuApi';
import {
  createActeMedicalPecmu, createConsentementPecmu, createSuiviAccompagnement,
  deleteActeMedicalPecmu, deleteConsentementPecmu, deleteFichePecmu, deleteSuiviAccompagnement,
  getFichePecmu, listActesMedicauxByFiche, listConsentementsByFiche, listSuivisByFiche,
  updateActeMedicalPecmu, updateConsentementPecmu, updateFichePecmu, updateSuiviAccompagnement,
} from '../services/pecmuApi';

type Tab = 'fiche' | 'consentements' | 'actes' | 'suivis';
type Props = { ficheId: number; fetcher: PecmuFetcher; onClose: () => void; onChanged: () => void };

const tabs: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
  { id: 'fiche', label: 'Fiche F2', icon: ClipboardList },
  { id: 'consentements', label: 'Consentements', icon: FileCheck2 },
  { id: 'actes', label: 'Actes médicaux', icon: Stethoscope },
  { id: 'suivis', label: 'Suivis', icon: CalendarDays },
];

const fieldClass = 'mt-1 w-full border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#901c67] focus:ring-1 focus:ring-[#901c67]';
const readFile = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

const dateLabel = (value?: string) => value ? new Date(value).toLocaleDateString('fr-FR') : '-';

export default function PecmuDossierModal({ ficheId, fetcher, onClose, onChanged }: Props) {
  const [tab, setTab] = useState<Tab>('fiche');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fiche, setFiche] = useState<FichePecmu | null>(null);
  const [consentements, setConsentements] = useState<ActeConsentementPecmu[]>([]);
  const [actes, setActes] = useState<ActeMedicalPecmu[]>([]);
  const [suivis, setSuivis] = useState<SuiviAccompagnement[]>([]);
  const [consentForm, setConsentForm] = useState<Partial<ActeConsentementPecmu> | null>(null);
  const [acteForm, setActeForm] = useState<Partial<ActeMedicalPecmu> | null>(null);
  const [suiviForm, setSuiviForm] = useState<Partial<SuiviAccompagnement> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ficheData, consentData, acteData, suiviData] = await Promise.all([
        getFichePecmu(fetcher, ficheId), listConsentementsByFiche(fetcher, ficheId),
        listActesMedicauxByFiche(fetcher, ficheId), listSuivisByFiche(fetcher, ficheId),
      ]);
      setFiche(ficheData); setConsentements(consentData); setActes(acteData); setSuivis(suiviData);
    } catch (error: any) {
      await Swal.fire({ icon: 'error', title: 'Dossier indisponible', text: error?.message || 'Impossible de charger le dossier PECMU.' });
    } finally { setLoading(false); }
  }, [fetcher, ficheId]);

  useEffect(() => { load(); }, [load]);

  const confirmDelete = async (title: string) => (await Swal.fire({
    icon: 'warning', title, text: 'La suppression sera enregistrée dans le système.', showCancelButton: true,
    confirmButtonText: 'Supprimer', cancelButtonText: 'Annuler', confirmButtonColor: '#dc2626',
  })).isConfirmed;

  const saveFiche = async () => {
    if (!fiche) return; setSaving(true);
    try { setFiche(await updateFichePecmu(fetcher, ficheId, fiche)); onChanged(); await Swal.fire({ icon: 'success', title: 'Fiche mise à jour', timer: 1100, showConfirmButton: false }); }
    catch (e: any) { await Swal.fire({ icon: 'error', title: 'Modification impossible', text: e?.message }); }
    finally { setSaving(false); }
  };

  const removeFiche = async () => {
    if (!await confirmDelete('Supprimer cette fiche PECMU ?')) return;
    await deleteFichePecmu(fetcher, ficheId); onChanged(); onClose();
  };

  const saveConsent = async (event: React.FormEvent) => {
    event.preventDefault(); if (!consentForm?.filename || !consentForm.file || !consentForm.agent) return; setSaving(true);
    try {
      const payload = { ...consentForm, fichePecmuId: ficheId } as ActeConsentementPecmu;
      if (consentForm.id) await updateConsentementPecmu(fetcher, consentForm.id, payload);
      else await createConsentementPecmu(fetcher, payload);
      setConsentForm(null); await load(); onChanged();
    } finally { setSaving(false); }
  };

  const saveActe = async (event: React.FormEvent) => {
    event.preventDefault(); if (!acteForm?.rapportMedical) return; setSaving(true);
    try {
      const payload = { ...acteForm, cout: Number(acteForm.cout || 0), fichePecmuId: ficheId } as ActeMedicalPecmu;
      if (acteForm.id) await updateActeMedicalPecmu(fetcher, acteForm.id, payload);
      else await createActeMedicalPecmu(fetcher, payload);
      setActeForm(null); await load(); onChanged();
    } finally { setSaving(false); }
  };

  const saveSuivi = async (event: React.FormEvent) => {
    event.preventDefault(); if (!suiviForm?.avis) return; setSaving(true);
    try {
      const payload = { ...suiviForm, fichePecmuId: ficheId } as SuiviAccompagnement;
      if (suiviForm.id) await updateSuiviAccompagnement(fetcher, suiviForm.id, payload);
      else await createSuiviAccompagnement(fetcher, payload);
      setSuiviForm(null); await load(); onChanged();
    } finally { setSaving(false); }
  };

  const removeItem = async (kind: Tab, id: number) => {
    if (!await confirmDelete('Supprimer cet élément ?')) return;
    if (kind === 'consentements') await deleteConsentementPecmu(fetcher, id);
    if (kind === 'actes') await deleteActeMedicalPecmu(fetcher, id);
    if (kind === 'suivis') await deleteSuiviAccompagnement(fetcher, id);
    await load(); onChanged();
  };

  const updateFiche = (key: keyof FichePecmu, value: any) => setFiche((current) => current ? { ...current, [key]: value } : current);

  return (
    <div className="fixed inset-0 z-[100] bg-gray-950/65 p-0 md:p-5" role="dialog" aria-modal="true">
      <div className="mx-auto flex h-full max-w-7xl flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-gray-200 px-5 py-4 md:px-7">
          <div><div className="text-xs font-black uppercase text-red-600">Dossier PECMU #{ficheId}</div><h2 className="mt-1 text-2xl font-black text-gray-950">{fiche?.victimName || 'Chargement du dossier...'}</h2><p className="text-sm text-gray-500">Alerte, consentements, soins et accompagnement</p></div>
          <button type="button" onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100" aria-label="Fermer"><X size={24} /></button>
        </header>
        <nav className="flex overflow-x-auto border-b border-gray-200 px-5 md:px-7">
          {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setTab(id)} className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold ${tab === id ? 'border-[#901c67] text-[#901c67]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}><Icon size={17} />{label}</button>)}
        </nav>
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-7">
          {loading ? <div className="py-20 text-center font-semibold text-gray-500">Chargement du dossier PECMU...</div> : null}

          {!loading && tab === 'fiche' && fiche && <div className="space-y-5">
            <section className="border border-gray-200 bg-white p-5"><h3 className="mb-4 font-black text-gray-900">Identité et localisation</h3><div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="md:col-span-2"><span className="text-sm font-semibold">Nom de la victime</span><input className={fieldClass} value={fiche.victimName || ''} onChange={(e) => updateFiche('victimName', e.target.value)} /></label>
              <label><span className="text-sm font-semibold">Âge</span><input type="number" min="0" max="150" className={fieldClass} value={fiche.age ?? ''} onChange={(e) => updateFiche('age', e.target.value ? Number(e.target.value) : undefined)} /></label>
              <label><span className="text-sm font-semibold">Sexe</span><select className={fieldClass} value={fiche.sex || ''} onChange={(e) => updateFiche('sex', e.target.value)}><option value="">Sélectionner</option><option>Féminin</option><option>Masculin</option><option>Autre</option></select></label>
              <label><span className="text-sm font-semibold">Province</span><input className={fieldClass} value={fiche.province || ''} onChange={(e) => updateFiche('province', e.target.value)} /></label>
              <label><span className="text-sm font-semibold">Localité</span><input className={fieldClass} value={fiche.locality || ''} onChange={(e) => updateFiche('locality', e.target.value)} /></label>
              <label className="md:col-span-2"><span className="text-sm font-semibold">Adresse</span><input className={fieldClass} value={fiche.victimAddress || ''} onChange={(e) => updateFiche('victimAddress', e.target.value)} /></label>
              <label><span className="text-sm font-semibold">Téléphone</span><input className={fieldClass} value={fiche.victimPhone || ''} onChange={(e) => updateFiche('victimPhone', e.target.value)} /></label>
            </div></section>
            <section className="border border-gray-200 bg-white p-5"><h3 className="mb-4 font-black text-gray-900">Situation médicale et orientation</h3><div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label><span className="text-sm font-semibold">Structure de prise en charge</span><input className={fieldClass} value={fiche.careStructureName || ''} onChange={(e) => updateFiche('careStructureName', e.target.value)} /></label>
              <label><span className="text-sm font-semibold">Zone de santé</span><input className={fieldClass} value={fiche.healthZone || ''} onChange={(e) => updateFiche('healthZone', e.target.value)} /></label>
              <label><span className="text-sm font-semibold">Statut médical</span><input className={fieldClass} value={fiche.medicalStatus || ''} onChange={(e) => updateFiche('medicalStatus', e.target.value)} /></label>
              <label><span className="text-sm font-semibold">Pronostic vital</span><input className={fieldClass} value={fiche.vitalPrognosis || ''} onChange={(e) => updateFiche('vitalPrognosis', e.target.value)} /></label>
              <label className="md:col-span-2"><span className="text-sm font-semibold">Détails de l’incident</span><textarea className={`${fieldClass} min-h-24`} value={fiche.incidentDetails || ''} onChange={(e) => updateFiche('incidentDetails', e.target.value)} /></label>
              <label className="md:col-span-2"><span className="text-sm font-semibold">Décision PECMU</span><textarea className={`${fieldClass} min-h-20`} value={fiche.pecmuDecision || ''} onChange={(e) => updateFiche('pecmuDecision', e.target.value)} /></label>
              <label className="md:col-span-2"><span className="text-sm font-semibold">Partenaire affecté</span><input className={fieldClass} value={fiche.partnerNameAndAddress || ''} onChange={(e) => updateFiche('partnerNameAndAddress', e.target.value)} /></label>
            </div></section>
            <div className="flex justify-between"><button type="button" onClick={removeFiche} className="inline-flex items-center gap-2 border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"><Trash2 size={16} />Supprimer la fiche</button><button type="button" disabled={saving} onClick={saveFiche} className="inline-flex items-center gap-2 bg-[#901c67] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Save size={17} />Enregistrer les modifications</button></div>
          </div>}

          {!loading && tab === 'consentements' && <ResourceSection title="Actes de consentement F4, F5 et F6" action="Ajouter un consentement" onAdd={() => setConsentForm({ agent: '', filename: '', file: '', fichePecmuId: ficheId })}>
            {consentements.map((item) => <ResourceRow key={item.id} title={item.filename} meta={`${item.agent} · ${dateLabel(item.createdAt)}`} onEdit={() => setConsentForm(item)} onDelete={() => removeItem('consentements', item.id)} />)}
            {!consentements.length && <Empty text="Aucun acte de consentement enregistré pour cette victime." />}
          </ResourceSection>}

          {!loading && tab === 'actes' && <ResourceSection title="Actes médicaux" action="Ajouter un acte médical" onAdd={() => setActeForm({ rapportMedical: '', cout: 0, observation: '', partenaireNom: '', partenaireTitre: '', examens: [], fichePecmuId: ficheId })}>
            {actes.map((item) => <ResourceRow key={item.id} title={item.rapportMedical || `Acte #${item.id}`} meta={`${item.partenaireNom || 'Partenaire non renseigné'} · ${Number(item.cout || 0).toLocaleString('fr-FR')} USD · ${dateLabel(item.createdAt)}`} onEdit={() => setActeForm(item)} onDelete={() => removeItem('actes', item.id)} />)}
            {!actes.length && <Empty text="Aucun acte médical enregistré pour cette victime." />}
          </ResourceSection>}

          {!loading && tab === 'suivis' && <ResourceSection title="Suivis et accompagnements" action="Ajouter un suivi" onAdd={() => setSuiviForm({ avis: '', dateProchainRdv: '', fichePecmuId: ficheId })}>
            {suivis.map((item) => <ResourceRow key={item.id} title={item.avis} meta={`Prochain rendez-vous : ${dateLabel(item.dateProchainRdv)}`} onEdit={() => setSuiviForm(item)} onDelete={() => removeItem('suivis', item.id)} />)}
            {!suivis.length && <Empty text="Aucun suivi enregistré pour cette victime." />}
          </ResourceSection>}
        </main>
      </div>

      {consentForm && <Editor title={consentForm.id ? 'Modifier le consentement' : 'Ajouter un consentement'} onClose={() => setConsentForm(null)} onSubmit={saveConsent} saving={saving}>
        <label><span className="text-sm font-semibold">Agent responsable *</span><input required className={fieldClass} value={consentForm.agent || ''} onChange={(e) => setConsentForm({ ...consentForm, agent: e.target.value })} /></label>
        <label><span className="text-sm font-semibold">Document signé *</span><input required={!consentForm.file} type="file" accept=".pdf,.doc,.docx,image/*" className={fieldClass} onChange={async (e) => { const file = e.target.files?.[0]; if (file) setConsentForm({ ...consentForm, filename: file.name, file: await readFile(file) }); }} /><small className="text-gray-500">{consentForm.filename}</small></label>
      </Editor>}

      {acteForm && <Editor title={acteForm.id ? 'Modifier l’acte médical' : 'Ajouter un acte médical'} onClose={() => setActeForm(null)} onSubmit={saveActe} saving={saving}>
        <label className="md:col-span-2"><span className="text-sm font-semibold">Rapport médical *</span><textarea required className={`${fieldClass} min-h-28`} value={acteForm.rapportMedical || ''} onChange={(e) => setActeForm({ ...acteForm, rapportMedical: e.target.value })} /></label>
        <label><span className="text-sm font-semibold">Coût (USD)</span><input type="number" min="0" step="0.01" className={fieldClass} value={acteForm.cout ?? ''} onChange={(e) => setActeForm({ ...acteForm, cout: e.target.value })} /></label>
        <label><span className="text-sm font-semibold">Nom du partenaire</span><input className={fieldClass} value={acteForm.partenaireNom || ''} onChange={(e) => setActeForm({ ...acteForm, partenaireNom: e.target.value })} /></label>
        <label><span className="text-sm font-semibold">Titre / médecin</span><input className={fieldClass} value={acteForm.partenaireTitre || ''} onChange={(e) => setActeForm({ ...acteForm, partenaireTitre: e.target.value })} /></label>
        <label><span className="text-sm font-semibold">Examens</span><input type="file" multiple className={fieldClass} onChange={async (e) => { const files = Array.from(e.target.files || []); const examens = await Promise.all(files.map(async (file) => ({ filename: file.name, file: await readFile(file) }))); setActeForm({ ...acteForm, examens }); }} /></label>
        <label className="md:col-span-2"><span className="text-sm font-semibold">Observation</span><textarea className={`${fieldClass} min-h-20`} value={acteForm.observation || ''} onChange={(e) => setActeForm({ ...acteForm, observation: e.target.value })} /></label>
      </Editor>}

      {suiviForm && <Editor title={suiviForm.id ? 'Modifier le suivi' : 'Ajouter un suivi'} onClose={() => setSuiviForm(null)} onSubmit={saveSuivi} saving={saving}>
        <label className="md:col-span-2"><span className="text-sm font-semibold">Avis ou commentaire *</span><textarea required className={`${fieldClass} min-h-28`} value={suiviForm.avis || ''} onChange={(e) => setSuiviForm({ ...suiviForm, avis: e.target.value })} /></label>
        <label><span className="text-sm font-semibold">Date du prochain rendez-vous</span><input type="date" className={fieldClass} value={suiviForm.dateProchainRdv?.slice(0, 10) || ''} onChange={(e) => setSuiviForm({ ...suiviForm, dateProchainRdv: e.target.value })} /></label>
      </Editor>}
    </div>
  );
}

function ResourceSection({ title, action, onAdd, children }: { title: string; action: string; onAdd: () => void; children: React.ReactNode }) {
  return <section className="border border-gray-200 bg-white"><div className="flex items-center justify-between border-b border-gray-200 p-5"><h3 className="text-lg font-black text-gray-900">{title}</h3><button type="button" onClick={onAdd} className="inline-flex items-center gap-2 bg-[#901c67] px-4 py-2 text-sm font-bold text-white"><Plus size={16} />{action}</button></div><div className="divide-y divide-gray-200">{children}</div></section>;
}
function ResourceRow({ title, meta, onEdit, onDelete }: { title: string; meta: string; onEdit: () => void; onDelete: () => void }) {
  return <div className="flex items-start justify-between gap-4 p-5"><div className="flex min-w-0 gap-3"><FileText className="mt-0.5 shrink-0 text-[#901c67]" size={20} /><div><div className="font-semibold text-gray-900">{title}</div><div className="mt-1 text-xs text-gray-500">{meta}</div></div></div><div className="flex gap-2"><button type="button" onClick={onEdit} className="border border-gray-300 p-2 text-gray-600" title="Modifier"><Pencil size={15} /></button><button type="button" onClick={onDelete} className="border border-red-200 p-2 text-red-600" title="Supprimer"><Trash2 size={15} /></button></div></div>;
}
function Empty({ text }: { text: string }) { return <div className="p-12 text-center text-sm text-gray-500">{text}</div>; }
function Editor({ title, onClose, onSubmit, saving, children }: { title: string; onClose: () => void; onSubmit: (e: React.FormEvent) => void; saving: boolean; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-950/70 p-4"><form onSubmit={onSubmit} className="w-full max-w-3xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b p-5"><h3 className="text-xl font-black text-gray-900">{title}</h3><button type="button" onClick={onClose} className="p-2"><X size={20} /></button></div><div className="grid max-h-[65vh] grid-cols-1 gap-4 overflow-y-auto p-6 md:grid-cols-2">{children}</div><div className="flex justify-end gap-3 border-t p-4"><button type="button" onClick={onClose} className="border border-gray-300 px-4 py-2 font-semibold text-gray-700">Annuler</button><button disabled={saving} type="submit" className="inline-flex items-center gap-2 bg-[#901c67] px-4 py-2 font-semibold text-white disabled:opacity-50"><Save size={16} />{saving ? 'Enregistrement...' : 'Enregistrer'}</button></div></form></div>;
}
