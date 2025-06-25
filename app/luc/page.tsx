"use client"
"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { FiPlus, FiChevronLeft, FiChevronRight, FiEdit2 } from 'react-icons/fi';
import { Modal, Button } from 'flowbite-react';
import 'flowbite';


// Données fictives pour la démo
const fakeApps = Array.from({ length: 18 }, (_, i) => ({
  id: i + 1,
  name: `App ${i + 1}`,
  logo: '/mazaya-logo.svg',
  version: `1.${i}.0`,
  status: i % 3 === 0 ? 'deployed' : i % 3 === 1 ? 'developpement' : 'test',
  date: `2024-0${(i % 9) + 1}-15`,
  type: i % 2 === 0 ? 'saas' : 'web',
  description: `Description de l'application ${i + 1}`,
}));

const appTypes = [
  { value: 'saas', label: 'SaaS' },
  { value: 'web', label: 'Application Web' },
  { value: 'mobile', label: 'Application Mobile' },
  { value: 'desktop', label: 'Application Desktop' },
  { value: 'autre', label: 'Autre' },
];

const appStatus = [
  { value: 'developpement', label: 'En développement' },
  { value: 'test', label: 'En test' },
  { value: 'deployed', label: 'Déployée' },
  { value: 'archived', label: 'Archivée' },
];

const statusColors: Record<string, string> = {
  deployed: 'bg-green-100 text-green-600',
  developpement: 'bg-yellow-100 text-yellow-700',
  test: 'bg-blue-100 text-blue-600',
  archived: 'bg-gray-200 text-gray-500',
};

const sortOptions = [
  { value: 'name', label: 'Nom' },
  { value: 'date', label: 'Date prod' },
  { value: 'status', label: 'Statut' },
];

const pageSize = 6;

const Apps = () => {
  const [sortBy, setSortBy] = useState('name');
  const [page, setPage] = useState(1);
  const [editingApp, setEditingApp] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Ouvre le modal avec l'app sélectionnée
  const handleEdit = (app: any) => {
    setEditingApp(app);
    setForm(app);
    setLogoPreview(app.logo);
    setShowModal(true);
  };

  // Gère les changements dans le formulaire
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, files } = e.target as any;
    if (type === 'file' && files && files[0]) {
      setForm((prev: any) => ({ ...prev, logo: files[0] }));
      setLogoPreview(URL.createObjectURL(files[0]));
    } else {
      setForm((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  // Simule la sauvegarde (ferme juste le modal)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(false);
    setEditingApp(null);
    setLogoPreview(null);
    // Ici tu pourrais faire un appel API ou mettre à jour le state global
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingApp(null);
    setLogoPreview(null);
  };


  const sortedApps = [...fakeApps].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'date') return a.date.localeCompare(b.date);
    if (sortBy === 'status') return a.status.localeCompare(b.status);
    return 0;
  });
  const totalPages = Math.ceil(sortedApps.length / pageSize);
  const paginatedApps = sortedApps.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 py-4 md:py-8 lg:py-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-1">Applications</h1>
          <p className="text-gray-500 text-base md:text-lg font-normal">Gérez toutes vos applications en un clin d'œil.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm text-gray-500 mr-2">Trier par</label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-white text-gray-700 shadow-sm"
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Link href="/apps/register" className="ml-4 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg hover:scale-[1.04] hover:shadow-xl transition-all">
            <FiPlus /> Nouvelle application
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {paginatedApps.map(app => (
          <div
            key={app.id}
            className="bg-white rounded-3xl shadow-md p-7 flex flex-col gap-4 border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 group relative overflow-visible"
          >
            {/* Bouton Modifier en overlay au hover */}
            <button
              className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition bg-white/90 border border-pink-200 shadow p-2 rounded-full hover:bg-pink-50 hover:text-pink-600 text-gray-400"
              onClick={() => handleEdit(app)}
              title="Modifier"
            >
              <FiEdit2 size={18} />
            </button>
            <div className="flex items-center gap-4 mb-2">
              <img src={app.logo} alt={app.name} className="w-14 h-14 rounded-2xl bg-gray-50 object-cover border border-gray-100 shadow-sm" />
              <div>
                <div className="font-bold text-xl text-gray-800 group-hover:text-pink-600 transition">{app.name}</div>
                <div className="text-xs text-gray-400 font-medium">v{app.version}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[app.status]} border border-opacity-30 border-current`}>{app.status}</span>
              <span className="text-xs text-gray-400 ml-auto bg-gray-50 rounded px-2 py-0.5">{app.type}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">Mise en prod&nbsp;: <span className="font-medium text-gray-700">{app.date}</span></div>
          </div>
        ))}
      </div>

      {/* Modal édition application */}
      <Modal show={showModal} onClose={handleClose} size="xl" popup>
        <div className="p-6">
          <form onSubmit={handleSave} className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Modifier l'application</h3>
            {/* Logo */}
            <div className="flex flex-col items-center">
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo de l'application</label>
              <div
                className="w-24 h-24 rounded-xl border-2 border-dashed border-pink-300 flex items-center justify-center bg-gray-50 hover:bg-pink-50 transition cursor-pointer relative mb-2"
                onClick={() => fileInputRef.current?.click()}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <svg className="w-10 h-10 text-pink-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  name="logo"
                  onChange={handleFormChange}
                />
              </div>
              <span className="text-xs text-gray-400">PNG, JPG, SVG (max 2Mo)</span>
            </div>
            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'application</label>
              <input
                type="text"
                name="name"
                value={form.name || ''}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                placeholder="Ex: Mazaya CRM"
                required
              />
            </div>
            {/* Date & version */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de mise en production</label>
                <input
                  type="date"
                  name="date"
                  value={form.date || ''}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Version actuelle</label>
                <input
                  type="text"
                  name="version"
                  value={form.version || ''}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="Ex: 1.0.0"
                  required
                />
              </div>
            </div>
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={form.description || ''}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent min-h-[90px] resize-none"
                placeholder="Décris brièvement l'application, ses fonctionnalités principales, sa cible..."
                required
              />
            </div>
            {/* Type & Statut */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Type d'application</label>
                <select
                  name="type"
                  value={form.type || ''}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  required
                >
                  <option value="" disabled>Sélectionne un type</option>
                  {appTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut de l'application</label>
                <select
                  name="status"
                  value={form.status || ''}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  required
                >
                  <option value="" disabled>Sélectionne un statut</option>
                  {appStatus.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button color="gray" onClick={handleClose} type="button">Annuler</Button>
              <Button color="pink" type="submit">Enregistrer</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-3 mt-16 mb-2">
        <button
          className="p-2.5 rounded-full hover:bg-pink-100 disabled:opacity-30 border border-gray-200 bg-white shadow-sm"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          aria-label="Page précédente"
        >
          <FiChevronLeft size={22} />
        </button>
        <span className="text-sm text-gray-600 font-medium">Page {page} / {totalPages}</span>
        <button
          className="p-2.5 rounded-full hover:bg-pink-100 disabled:opacity-30 border border-gray-200 bg-white shadow-sm"
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          aria-label="Page suivante"
        >
          <FiChevronRight size={22} />
        </button>
      </div>
    </section>
  );
};

export default Apps;