"use client"
import React, { useRef, useState } from 'react';

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

const Register = () => {
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl bg-white/90 rounded-3xl shadow-2xl p-10 md:p-14 backdrop-blur-md border border-gray-100">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Créer une nouvelle application</h1>
          <p className="text-gray-500 text-lg">Renseigne les informations pour référencer ton application sur la plateforme.</p>
        </div>
        <form className="space-y-7">
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
                onChange={handleLogoChange}
              />
            </div>
            <span className="text-xs text-gray-400">PNG, JPG, SVG (max 2Mo)</span>
          </div>

          {/* Nom de l'application */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'application</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
              placeholder="Ex: Mazaya CRM"
              required
            />
          </div>

          {/* Date de mise en prod & version */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de mise en production</label>
              <input
                type="date"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Version actuelle</label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                placeholder="Ex: 1.0.0"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all min-h-[90px] resize-none"
              placeholder="Décris brièvement l'application, ses fonctionnalités principales, sa cible..."
              required
            />
          </div>

          {/* Type d'application & Statut */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Type d'application</label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                required
                defaultValue=""
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                required
                defaultValue=""
              >
                <option value="" disabled>Sélectionne un statut</option>
                {appStatus.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bouton submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-lg font-semibold rounded-lg shadow-md hover:scale-[1.02] hover:shadow-lg transition-all duration-200"
            >
              Créer l'application
            </button>
          </div>
          {/* Lien retour */}
          <div className="pt-4 text-center">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-1 text-pink-600 hover:text-pink-800 font-medium transition-colors underline underline-offset-2 text-base"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              Retour à la page précédente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;