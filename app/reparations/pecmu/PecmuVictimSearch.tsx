'use client';

import React, { useEffect, useState } from 'react';
import { Search, UserRound, X } from 'lucide-react';
import { searchMasterVictims, type PecmuFetcher } from '../services/pecmuApi';

export type MasterVictim = {
  id: number;
  nom?: string;
  prenom?: string;
  postnom?: string;
  age?: number | string;
  dateNaissance?: string;
  sexe?: string;
  province?: string;
  village?: string;
  commune?: string;
  territoire?: string;
  adresse?: string;
  [key: string]: any;
};

export const masterVictimName = (victim: MasterVictim) => [victim.prenom, victim.nom, victim.postnom].filter(Boolean).join(' ') || victim.nom || `Victime #${victim.id}`;
export const masterVictimLocality = (victim: MasterVictim) => [victim.village, victim.commune, victim.territoire].filter(Boolean).join(', ') || 'Localité non renseignée';
export const masterVictimAge = (victim: MasterVictim) => {
  if (victim.age !== undefined && victim.age !== null && victim.age !== '') return `${victim.age} ans`;
  if (!victim.dateNaissance) return 'Âge non renseigné';
  const birthDate = new Date(victim.dateNaissance);
  if (Number.isNaN(birthDate.getTime())) return 'Âge non renseigné';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age--;
  return `${age} ans`;
};

export default function PecmuVictimSearch({ fetcher, selected, onSelect, disabled = false }: {
  fetcher: PecmuFetcher;
  selected: MasterVictim | null;
  onSelect: (victim: MasterVictim | null) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MasterVictim[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2 || selected) { setResults([]); setLoading(false); setError(''); return; }
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const rows = await searchMasterVictims(fetcher, term);
        if (active) setResults(rows.filter((row: any) => Number.isFinite(Number(row?.id))).map((row: any) => ({ ...row, id: Number(row.id) })));
      } catch (e: any) {
        if (active) { setResults([]); setError(e?.message || 'Recherche de victime impossible.'); }
      } finally { if (active) setLoading(false); }
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [fetcher, query, selected]);

  return <section className="space-y-3 rounded-md border border-primary/20 bg-primary/5 p-4">
    <div><h3 className="font-semibold text-slate-900">Rechercher une victime existante</h3><p className="text-sm text-slate-600">Associez l’alerte à la victime pour reprendre son identité et consulter ses autres alertes.</p></div>
    {selected ? <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-primary/20 bg-white p-3">
      <div className="flex items-center gap-3"><UserRound className="text-primary" /><div><p className="font-semibold">{masterVictimName(selected)}</p><p className="text-xs text-slate-500">{selected.sexe || 'Sexe non renseigné'} · {masterVictimAge(selected)} · {selected.province || 'Province non renseignée'} · {masterVictimLocality(selected)}</p></div></div>
      {!disabled && <button type="button" onClick={() => { onSelect(null); setQuery(''); }} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-red-600"><X size={16} />Retirer</button>}
    </div> : <>
      <label className="relative block"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input disabled={disabled} value={query} onChange={event => setQuery(event.target.value)} placeholder="Nom, prénom ou numéro d’identification" className="w-full rounded border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm" /></label>
      {loading && <p role="status" className="text-sm text-slate-500">Recherche…</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {results.length > 0 && <ul className="max-h-52 divide-y divide-slate-100 overflow-y-auto rounded border border-slate-200 bg-white">{results.map(victim => <li key={victim.id}><button type="button" disabled={disabled} onClick={() => onSelect(victim)} className="w-full px-3 py-2 text-left hover:bg-primary/5 disabled:opacity-50"><span className="block text-sm font-semibold">{masterVictimName(victim)}</span><span className="block text-xs text-slate-500">{victim.sexe || 'Sexe non renseigné'} · {masterVictimAge(victim)} · {victim.province || 'Province non renseignée'} · {masterVictimLocality(victim)}</span></button></li>)}</ul>}
      {query.trim().length >= 2 && !loading && !error && results.length === 0 && <p className="text-sm text-slate-500">Aucune victime trouvée. Vous pouvez continuer avec une nouvelle victime.</p>}
    </>}
  </section>;
}
