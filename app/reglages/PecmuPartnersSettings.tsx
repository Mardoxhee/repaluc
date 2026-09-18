"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Edit3, Mail, MapPin, Phone, Plus, Search, Trash2, X } from 'lucide-react';
import Swal from 'sweetalert2';

const STORAGE_KEY = 'pecmu-partenaires-prise-en-charge-v1';

const provinces = [
  'Bas-Uele', 'Equateur', 'Haut-Katanga', 'Haut-Lomami', 'Haut-Uele', 'Ituri',
  'Kasai', 'Kasai-Central', 'Kasai-Oriental', 'Kinshasa', 'Kongo-Central', 'Kwango',
  'Kwilu', 'Lomami', 'Lualaba', 'Mai-Ndombe', 'Maniema', 'Mongala', 'Nord-Kivu',
  'Nord-Ubangi', 'Sankuru', 'Sud-Kivu', 'Sud-Ubangi', 'Tanganyika', 'Tshopo', 'Tshuapa',
];

type Partner = {
  id: number;
  nom: string;
  domaine: string;
  province: string;
  contact: string;
  email: string;
  adresse: string;
};

const emptyPartner = (): Partner => ({
  id: 0,
  nom: '',
  domaine: 'Santé',
  province: '',
  contact: '',
  email: '',
  adresse: '',
});

export default function PecmuPartnersSettings() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Partner | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      setPartners(stored ? JSON.parse(stored) : []);
    } catch {
      setPartners([]);
    }
  }, []);

  useEffect(() => {
    if (!editing) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [editing]);

  const visiblePartners = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('fr');
    if (!term) return partners;
    return partners.filter((partner) =>
      [partner.nom, partner.domaine, partner.province, partner.contact, partner.email, partner.adresse]
        .some((value) => value.toLocaleLowerCase('fr').includes(term))
    );
  }, [partners, search]);

  const persist = (next: Partner[]) => {
    setPartners(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const savePartner = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing?.nom.trim() || !editing.province) return;
    const partner = { ...editing, nom: editing.nom.trim(), id: editing.id || Date.now() };
    persist(editing.id ? partners.map((item) => item.id === editing.id ? partner : item) : [...partners, partner]);
    setEditing(null);
  };

  const deletePartner = async (partner: Partner) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Supprimer ce partenaire ?',
      text: partner.nom,
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc2626',
    });
    if (result.isConfirmed) persist(partners.filter((item) => item.id !== partner.id));
  };

  const updateEditing = (field: keyof Partner, value: string) => {
    setEditing((current) => current ? { ...current, [field]: value } : current);
  };

  return (
    <section className="border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-gray-200 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 size={20} className="text-[#901c67]" />
            <h2 className="text-lg font-bold text-gray-900">Partenaires de prise en charge PECMU</h2>
          </div>
          <p className="mt-1 text-sm text-gray-600">Configurez les structures médicales auxquelles les victimes peuvent être affectées.</p>
        </div>
        <button type="button" onClick={() => setEditing(emptyPartner())} className="inline-flex items-center justify-center gap-2 bg-[#901c67] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#771654]">
          <Plus size={17} /> Ajouter un partenaire
        </button>
      </div>

      <div className="p-5">
        <label className="relative block max-w-xl">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher par nom, province, domaine..." className="w-full border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#901c67] focus:ring-1 focus:ring-[#901c67]" />
        </label>
      </div>

      <div className="overflow-x-auto border-t border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-600">
            <tr>
              <th className="px-5 py-3">Partenaire</th><th className="px-5 py-3">Domaine</th><th className="px-5 py-3">Province</th><th className="px-5 py-3">Contact</th><th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {visiblePartners.map((partner) => (
              <tr key={partner.id} className="hover:bg-gray-50">
                <td className="px-5 py-4"><div className="font-semibold text-gray-900">{partner.nom}</div><div className="mt-1 text-xs text-gray-500">{partner.adresse || 'Adresse non renseignée'}</div></td>
                <td className="px-5 py-4 text-gray-700">{partner.domaine || '-'}</td>
                <td className="px-5 py-4"><span className="inline-flex items-center gap-1 text-gray-700"><MapPin size={14} />{partner.province}</span></td>
                <td className="px-5 py-4 text-gray-700"><div>{partner.contact || '-'}</div><div className="text-xs text-gray-500">{partner.email}</div></td>
                <td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing({ ...partner })} className="border border-gray-300 p-2 text-gray-700 hover:bg-gray-100" title="Modifier"><Edit3 size={16} /></button><button type="button" onClick={() => deletePartner(partner)} className="border border-red-200 p-2 text-red-600 hover:bg-red-50" title="Supprimer"><Trash2 size={16} /></button></div></td>
              </tr>
            ))}
            {visiblePartners.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-500">Aucun partenaire PECMU configuré. Utilisez « Ajouter un partenaire » pour commencer.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm md:p-8" role="dialog" aria-modal="true" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(null); }}>
          <form onSubmit={savePartner} className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-white/60 bg-white shadow-[0_28px_90px_-24px_rgba(15,23,42,0.55)] md:max-h-[calc(100vh-4rem)]">
            <div className="relative border-b border-gray-200 px-5 py-5 md:px-7">
              <div className="absolute inset-y-0 left-0 w-1.5 bg-[#901c67]" />
              <div className="flex items-start gap-3 pr-10">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#f8edf5] text-[#901c67]">
                  <Building2 size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#901c67]">Configuration PECMU</div>
                  <h3 className="mt-0.5 text-xl font-black text-gray-950">{editing.id ? 'Modifier le partenaire' : 'Nouveau partenaire'}</h3>
                  <p className="mt-1 text-sm text-gray-500">Enregistrez une structure disponible pour la prise en charge.</p>
                </div>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="absolute right-4 top-4 p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900" aria-label="Fermer"><X size={20} /></button>
            </div>

            <div className="overflow-y-auto px-5 py-5 md:px-7">
              <div className="space-y-6">
                <section>
                  <h4 className="mb-3 text-xs font-black uppercase tracking-wide text-gray-500">Identification de la structure</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="md:col-span-2">
                      <span className="text-sm font-semibold text-gray-800">Nom du partenaire <span className="text-red-600">*</span></span>
                      <div className="relative mt-1.5"><Building2 size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input required autoFocus placeholder="Ex. Hôpital général de Goma" value={editing.nom} onChange={(e) => updateEditing('nom', e.target.value)} className="w-full rounded-md border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#901c67] focus:ring-2 focus:ring-[#901c67]/10" /></div>
                    </label>
                    <label>
                      <span className="text-sm font-semibold text-gray-800">Domaine</span>
                      <input placeholder="Ex. Santé, psychologie" value={editing.domaine} onChange={(e) => updateEditing('domaine', e.target.value)} className="mt-1.5 w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#901c67] focus:ring-2 focus:ring-[#901c67]/10" />
                    </label>
                    <label>
                      <span className="text-sm font-semibold text-gray-800">Province <span className="text-red-600">*</span></span>
                      <div className="relative mt-1.5"><MapPin size={17} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400" /><select required value={editing.province} onChange={(e) => updateEditing('province', e.target.value)} className="w-full appearance-none rounded-md border border-gray-300 py-2.5 pl-10 pr-9 text-sm outline-none focus:border-[#901c67] focus:ring-2 focus:ring-[#901c67]/10"><option value="">Sélectionner une province</option>{provinces.map((province) => <option key={province}>{province}</option>)}</select></div>
                    </label>
                  </div>
                </section>

                <section className="border-t border-gray-200 pt-5">
                  <h4 className="mb-3 text-xs font-black uppercase tracking-wide text-gray-500">Contact et localisation</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label><span className="text-sm font-semibold text-gray-800">Téléphone</span><div className="relative mt-1.5"><Phone size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="tel" placeholder="+243 ..." value={editing.contact} onChange={(e) => updateEditing('contact', e.target.value)} className="w-full rounded-md border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#901c67] focus:ring-2 focus:ring-[#901c67]/10" /></div></label>
                    <label><span className="text-sm font-semibold text-gray-800">E-mail</span><div className="relative mt-1.5"><Mail size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="email" placeholder="contact@structure.cd" value={editing.email} onChange={(e) => updateEditing('email', e.target.value)} className="w-full rounded-md border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#901c67] focus:ring-2 focus:ring-[#901c67]/10" /></div></label>
                    <label className="md:col-span-2"><span className="text-sm font-semibold text-gray-800">Adresse complète</span><textarea placeholder="Commune, avenue, numéro et repère" value={editing.adresse} onChange={(e) => updateEditing('adresse', e.target.value)} className="mt-1.5 min-h-20 w-full resize-y rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#901c67] focus:ring-2 focus:ring-[#901c67]/10" /></label>
                  </div>
                </section>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 md:px-7">
              <button type="button" onClick={() => setEditing(null)} className="rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100">Annuler</button>
              <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-[#901c67] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#771654]"><Plus size={17} />{editing.id ? 'Enregistrer les modifications' : 'Ajouter le partenaire'}</button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </section>
  );
}
