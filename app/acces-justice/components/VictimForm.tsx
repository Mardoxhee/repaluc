import React from "react";

interface VictimFormProps {
  form: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isEdit?: boolean;
  prejudices: { id: number; nom: string }[];
  categories: { id: number; nom: string }[];
  programmes: { id: number; nom: string }[];
} 

const VictimForm: React.FC<VictimFormProps> = ({ form, onChange, onSubmit, onClose, isEdit, prejudices, categories, programmes }) => {
  // Trouver le programme éligible (proposition naïve: premier programme ou selon type de victime)
  const eligibleProgrammeId = form.programmeId || (programmes && programmes.length > 0 ? programmes[0].id : "");
  return (
    <form className="space-y-6" onSubmit={onSubmit}> 
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
        <input
          type="text"
          name="fullname"
          value={form.fullname || ""}
          onChange={onChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
          placeholder="Nom et prénom"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
        <input
          type="tel"
          name="tel"
          value={form.tel || ""}
          onChange={onChange}
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
          onChange={onChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
          placeholder="Email"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
        <input
          type="text"
          name="adresse"
          value={form.adresse || ""}
          onChange={onChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
          placeholder="Adresse complète"
          required
        />
      </div>
      {/* Section infos victime */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Préjudice subi</label>
          <select
            name="prejudiceId"
            value={form.prejudiceId || ""}
            onChange={onChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
            required
          >
            <option value="">Sélectionner…</option>
            {prejudices.map(prej => (
              <option key={prej.id} value={prej.id}>{prej.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type de victime</label>
          <select
            name="categoryId"
            value={form.categoryId || ""}
            onChange={onChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
            required
          >
            <option value="">Sélectionner…</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nom}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Programme éligible (proposé)</label>
          <select
            name="programmeId"
            value={eligibleProgrammeId}
            disabled
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
          >
            {programmes.map(prog => (
              <option key={prog.id} value={prog.id}>{prog.nom}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Récit du survivant</label>
          <textarea
            name="story"
            value={form.story || ""}
            onChange={onChange}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
            placeholder="Décrivez ici le récit du survivant…"
          />
        </div>
      </div>
      <div className="pt-2 flex gap-2 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 rounded-lg border bg-gray-50 text-gray-600 hover:bg-pink-50"
        >Annuler</button>
        <button
          type="submit"
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold shadow-md hover:scale-[1.02] hover:shadow-lg transition-all duration-200"
        >{isEdit ? "Enregistrer" : "Ajouter"}</button>
      </div>
    </form>
  );
};

export default VictimForm;
