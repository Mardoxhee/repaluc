import React from "react";

interface VictimFormProps {
  form: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isEdit?: boolean;
}

const VictimForm: React.FC<VictimFormProps> = ({ form, onChange, onSubmit, onClose, isEdit }) => {
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
