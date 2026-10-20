'use client';

import React, { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { listSuivisByFiche, type PecmuFetcher, type SuiviAccompagnement } from '../services/pecmuApi';
import { WorkflowForm, fieldClass } from './WorkflowForm';

const fields = [{ key: 'avis', label: 'Avis / commentaire', type: 'textarea' as const, required: true }, { key: 'dateProchainRdv', label: 'Prochain rendez-vous', type: 'date' as const }];
const formatDate = (value?: string) => value ? new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString('fr-FR') : 'Non programmé';

export default function PecmuFollowUps({ ficheId, fetcher, version, busy, canCreate, canRead, canUpdate, canDelete, save, remove }: {
  ficheId: number; fetcher: PecmuFetcher; version: number; busy: boolean;
  canCreate: boolean; canRead: boolean; canUpdate: boolean; canDelete: boolean;
  save: (path: string, values: unknown, method?: string) => Promise<boolean>;
  remove: (path: string) => Promise<void>;
}) {
  const [items, setItems] = useState<SuiviAccompagnement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [editing, setEditing] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setItems([]);
    if (!canRead) { setLoading(false); return; }
    listSuivisByFiche(fetcher, ficheId).then(rows => {
      if (active) setItems(rows.filter(row => row.isActive !== false).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '') || b.id - a.id));
    }).catch(e => { if (active) setError(e.message || 'Impossible de charger les suivis.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetcher, ficheId, version, retry, canRead]);
  const invalidPeriod = Boolean(from && to && from > to);
  const filtered = items.filter(item => {
    const day = item.dateProchainRdv?.slice(0, 10);
    return item.avis.toLocaleLowerCase('fr').includes(query.trim().toLocaleLowerCase('fr')) &&
      (!from || Boolean(day && day >= from)) && (!to || Boolean(day && day <= to));
  });
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pages);
  return <div className="space-y-5">
    {canCreate && <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="mb-4 text-lg font-semibold">Ajouter un suivi ou un rendez-vous</h3>
      <WorkflowForm key={version} fields={fields} busy={busy} submitLabel="Enregistrer le suivi" onSubmit={values => save('/suivi-accompagnement', { ...values, fichePecmuId: ficheId })} />
    </section>}
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-semibold">Historique des suivis</h3>
      {!canRead ? <p className="text-sm text-slate-500">Votre profil ne permet pas de consulter les suivis.</p> : <>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">Rechercher dans les avis<input type="search" className={fieldClass} value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} /></label>
          <label className="text-sm">Rendez-vous à partir du<input type="date" className={fieldClass} value={from} max={to || undefined} onChange={e => { setFrom(e.target.value); setPage(1); }} /></label>
          <label className="text-sm">Jusqu’au<input type="date" className={fieldClass} value={to} min={from || undefined} onChange={e => { setTo(e.target.value); setPage(1); }} /></label>
        </div>
        {invalidPeriod && <p role="alert" className="text-sm text-red-600">La fin de période doit suivre le début.</p>}
        {loading ? <p role="status">Chargement des suivis…</p> : error ? <div role="alert" className="text-sm text-red-600">{error}<button type="button" className="ml-3 underline" onClick={() => setRetry(value => value + 1)}>Réessayer</button></div> : !invalidPeriod && <>
          <p className="text-sm text-slate-500">{filtered.length} suivi(s) · Du plus récent au plus ancien</p>
          {!filtered.length && <p className="text-sm text-slate-500">{items.length ? 'Aucun suivi ne correspond aux filtres.' : 'Aucun suivi enregistré.'}</p>}
          {filtered.slice((currentPage - 1) * 10, currentPage * 10).map(item => <article key={item.id} className="space-y-3 rounded-md border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-primary">Prochain rendez-vous : {formatDate(item.dateProchainRdv)}</p>
              <div className="flex gap-1">
                {canUpdate && <button type="button" disabled={busy} title="Modifier" aria-label="Modifier le suivi" className="rounded p-2 text-primary hover:bg-primary/10" onClick={() => setEditing(editing === item.id ? null : item.id)}><Pencil size={18} /></button>}
                {canDelete && <button type="button" disabled={busy} title="Supprimer" aria-label="Supprimer le suivi" className="rounded p-2 text-red-600 hover:bg-red-50" onClick={() => remove(`/suivi-accompagnement/${item.id}`)}><Trash2 size={18} /></button>}
              </div>
            </div>
            <p className="whitespace-pre-wrap text-sm">{item.avis}</p>
            {item.createdAt && <p className="text-xs text-slate-500">Suivi enregistré le {formatDate(item.createdAt)}</p>}
            {editing === item.id && canUpdate && <WorkflowForm key={`${item.id}-${version}`} fields={fields} initial={item} busy={busy} submitLabel="Enregistrer la correction" onSubmit={async values => {
              const success = await save(`/suivi-accompagnement/${item.id}`, { ...values, dateProchainRdv: values.dateProchainRdv || null }, 'PUT');
              if (success) setEditing(null);
              return success;
            }} />}
          </article>)}
          {pages > 1 && <div className="flex items-center justify-between text-sm"><button type="button" disabled={currentPage === 1} className="p-2 text-primary disabled:opacity-40" onClick={() => setPage(currentPage - 1)}>Précédent</button><span>Page {currentPage} sur {pages}</span><button type="button" disabled={currentPage === pages} className="p-2 text-primary disabled:opacity-40" onClick={() => setPage(currentPage + 1)}>Suivant</button></div>}
        </>}
      </>}
    </section>
  </div>;
}
