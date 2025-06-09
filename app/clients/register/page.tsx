"use client";
import React, { useState, useRef } from "react";

const companyTypes = [
  { value: "sa", label: "Société Anonyme (SA)" },
  { value: "sarl", label: "SARL" },
  { value: "sas", label: "SAS" },
  { value: "association", label: "Association" },
  { value: "autre", label: "Autre" },
];

const Register = () => {
  const [type, setType] = useState("individu");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<any>({});

  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setType(e.target.value);
    setForm({});
    setLogoPreview(null);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((prev: any) => ({ ...prev, logo: file }));
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: envoyer les données
    alert("Client créé (simulation)");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="w-full max-w-2xl bg-white/95 rounded-3xl shadow-2xl p-10 md:p-14 backdrop-blur-md border border-gray-100">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Créer un client</h1>
          <p className="text-gray-500 text-base md:text-lg">Complète le formulaire selon le type de client à enregistrer.</p>
        </div>
        <form className="space-y-7" onSubmit={handleSubmit}>
          {/* Type de client */}
          <div className="flex gap-6 mb-2 items-center justify-center">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                name="type"
                value="individu"
                checked={type === "individu"}
                onChange={handleTypeChange}
                className="accent-pink-500"
              />
              <span className="ml-2 text-gray-700 font-medium">Individu</span>
            </label>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                name="type"
                value="entreprise"
                checked={type === "entreprise"}
                onChange={handleTypeChange}
                className="accent-blue-500"
              />
              <span className="ml-2 text-gray-700 font-medium">Organisation / Entreprise</span>
            </label>
          </div>

          {/* Si entreprise */}
          {type === "entreprise" && (
            <>
              {/* Logo */}
              <div className="flex flex-col items-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo de l'entreprise</label>
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
                    onChange={handleLogoChange}
                  />
                </div>
                <span className="text-xs text-gray-400">PNG, JPG, SVG (max 2Mo)</span>
              </div>
              {/* Dénomination sociale */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dénomination sociale</label>
                <input
                  type="text"
                  name="denomination"
                  value={form.denomination || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                  placeholder="Ex: Mazaya S.A."
                  required
                />
              </div>
              {/* Siège social */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Siège social</label>
                <input
                  type="text"
                  name="siege"
                  value={form.siege || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  placeholder="Adresse du siège social"
                  required
                />
              </div>
              {/* RCCM */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RCCM</label>
                <input
                  type="text"
                  name="rccm"
                  value={form.rccm || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                  placeholder="Numéro RCCM"
                  required
                />
              </div>
              {/* Numéro d'impôt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro d'impôt</label>
                <input
                  type="text"
                  name="num_impot"
                  value={form.num_impot || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  placeholder="Numéro d'identification fiscale"
                  required
                />
              </div>
              {/* Type d'entreprise */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type d'entreprise</label>
                <select
                  name="type_entreprise"
                  value={form.type_entreprise || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  required
                >
                  <option value="" disabled>Sélectionne un type</option>
                  {companyTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              {/* Représentant légal */}
              <div className="pt-4">
                <div className="font-semibold text-gray-700 mb-2">Personne représentant l'entreprise</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                    <input
                      type="text"
                      name="rep_nom"
                      value={form.rep_nom || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                      placeholder="Nom du représentant"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      name="rep_tel"
                      value={form.rep_tel || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                      placeholder="Numéro de téléphone"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="rep_email"
                      value={form.rep_email || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                      placeholder="Email du représentant"
                      required
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Si particulier */}
          {type === "individu" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  name="fullname"
                  value={form.fullname || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                  placeholder="Nom complet du client"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    name="tel"
                    value={form.tel || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                    placeholder="Numéro de téléphone"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                    placeholder="Email du client"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input
                  type="text"
                  name="adresse"
                  value={form.adresse || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  placeholder="Adresse du client"
                  required
                />
              </div>
            </>
          )}

          {/* CTA */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-lg font-semibold rounded-lg shadow-md hover:scale-[1.02] hover:shadow-lg transition-all duration-200"
            >
              Créer le client
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