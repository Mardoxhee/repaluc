import React, { useState } from "react";
import { FiX, FiArrowLeft, FiArrowRight } from "react-icons/fi";

interface CreateVictimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const initialForm = {
  // Étape 1 (Informations générales)
  nom: "",
  age: "",
  sexe: "",
  province: "",
  localite: "",
  adresse: "",
  telephone: "",
  contactResponsable: "",
  structure: "",
  zoneSante: "",
  aireSante: "",
  adresseStructure: "",
  contactMedecin: "",
  typeCrime: "",
  incident: "",
  periode: "",

  // Étape 2 (État médical)
  fievre: "",
  coma: "",
  convulsions: "",
  fatigue: "",
  hypertension: "",
  hyperglycemie: "",
  saignement: "",
  plaies: "",
  respiration: "",
  diarrhee: "",
  vomissement: "",
  autresPlaintes: "",
  pronostic: "",
  certificationIncident: "",
  identificationVictime: "",
  validateurNom: "",
  validateurFonction: "",
};

const CreateVictimModal: React.FC<CreateVictimModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    setForm(initialForm);
    onClose();
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 relative border border-gray-200 animate-fade-in">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-pink-500 transition"
          onClick={onClose}
        >
          <FiX size={24} />
        </button>

        {/* En-tête du stepper */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-700 uppercase tracking-wide">
            {step === 1 ? "Informations générales" : "État médical"}
          </h2>
          <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
            Étape {step}/2
          </div>
        </div>

        {/* Barre de progression */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${step * 50}%` }}
          ></div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Étape 1 : Informations générales */}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <input name="nom" value={form.nom} onChange={handleChange} placeholder="Nom de la victime" className="input-fona" required />
              <input name="age" value={form.age} onChange={handleChange} placeholder="Âge" className="input-fona" required />
              <input name="sexe" value={form.sexe} onChange={handleChange} placeholder="Sexe (M/F)" className="input-fona" required />
              <input name="province" value={form.province} onChange={handleChange} placeholder="Province" className="input-fona" required />
              <input name="localite" value={form.localite} onChange={handleChange} placeholder="Localité" className="input-fona" required />
              <input name="adresse" value={form.adresse} onChange={handleChange} placeholder="Adresse de la victime" className="input-fona" />
              <input name="telephone" value={form.telephone} onChange={handleChange} placeholder="Téléphone" className="input-fona" />
              <input name="contactResponsable" value={form.contactResponsable} onChange={handleChange} placeholder="Contact du responsable" className="input-fona" />
              <input name="structure" value={form.structure} onChange={handleChange} placeholder="Structure prise en charge" className="input-fona" />
              <input name="zoneSante" value={form.zoneSante} onChange={handleChange} placeholder="Zone de santé" className="input-fona" />
              <input name="aireSante" value={form.aireSante} onChange={handleChange} placeholder="Aire de santé" className="input-fona" />
              <input name="adresseStructure" value={form.adresseStructure} onChange={handleChange} placeholder="Adresse de la structure" className="input-fona" />
              <input name="contactMedecin" value={form.contactMedecin} onChange={handleChange} placeholder="Contact médecin/infirmier" className="input-fona" />
              <input name="typeCrime" value={form.typeCrime} onChange={handleChange} placeholder="Type de crime" className="input-fona" />
              <textarea name="incident" value={form.incident} onChange={handleChange} placeholder="Incident" className="input-fona md:col-span-2 min-h-[60px]" />
              <input name="periode" value={form.periode} onChange={handleChange} placeholder="Période" className="input-fona" />
            </div>
          )}

          {/* Étape 2 : État médical (basé sur le fichier joint) */}
          {step === 2 && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Forte fièvre</label>
                  <select name="fievre" value={form.fievre} onChange={handleChange} className="input-fona w-full">
                    <option value="">Sélectionner</option>
                    <option value="OUI">OUI</option>
                    <option value="NON">NON</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Coma</label>
                  <select name="coma" value={form.coma} onChange={handleChange} className="input-fona w-full">
                    <option value="">Sélectionner</option>
                    <option value="OUI">OUI</option>
                    <option value="NON">NON</option>
                  </select>
                </div>
                {/* Ajoutez les autres champs médicaux ici... */}
              </div>

              <div>
                <label className="block font-medium mb-1">Autres plaintes</label>
                <textarea
                  name="autresPlaintes"
                  value={form.autresPlaintes}
                  onChange={handleChange}
                  placeholder="Décrivez les autres plaintes..."
                  className="input-fona w-full min-h-[80px]"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Pronostic vital</label>
                <div className="flex flex-wrap gap-4">
                  {["BON (Normal)", "RÉSERVÉ (Moyen)", "ENGAGÉ (Grave)"].map((option) => (
                    <label key={option} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="pronostic"
                        value={option.split(" ")[0]}
                        checked={form.pronostic === option.split(" ")[0]}
                        onChange={handleChange}
                        className="h-4 w-4"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 mt-6">
                <h3 className="font-bold text-blue-700 mb-3">Validation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-1">Certification de l'incident</label>
                    <select name="certificationIncident" value={form.certificationIncident} onChange={handleChange} className="input-fona w-full">
                      <option value="">Sélectionner</option>
                      <option value="OUI">OUI</option>
                      <option value="NON">NON</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Identification de la victime</label>
                    <select name="identificationVictime" value={form.identificationVictime} onChange={handleChange} className="input-fona w-full">
                      <option value="">Sélectionner</option>
                      <option value="OUI">OUI</option>
                      <option value="NON">NON</option>
                    </select>
                  </div>
                  <input name="validateurNom" value={form.validateurNom} onChange={handleChange} placeholder="Nom du validateur" className="input-fona" />
                  <input name="validateurFonction" value={form.validateurFonction} onChange={handleChange} placeholder="Fonction" className="input-fona" />
                </div>
              </div>
            </div>
          )}

          {/* Boutons de navigation */}
          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-2 px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                <FiArrowLeft /> Précédent
              </button>
            )}
            {step < 2 ? (
              <button
                type="button"
                onClick={nextStep}
                className="ml-auto flex items-center gap-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition"
              >
                Suivant <FiArrowRight />
              </button>
            ) : (
              <button
                type="submit"
                className="ml-auto px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition"
              >
                Enregistrer
              </button>
            )}
          </div>
        </form>
      </div>

      <style jsx>{`
        .input-fona {
          border: 1px solid #e0e7ef;
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          outline: none;
          background: #f8fafc;
          transition: border 0.2s;
          font-size: 1rem;
        }
        .input-fona:focus {
          border: 1.5px solid #7c3aed;
          background: #fff;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default CreateVictimModal;