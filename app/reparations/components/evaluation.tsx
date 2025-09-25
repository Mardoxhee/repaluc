import React, { useState, useEffect } from 'react';
import { 
  User, 
  Calendar, 
  MapPin, 
  Stethoscope, 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  FileText,
  AlertTriangle,
  Heart,
  Brain,
  Activity,
  Target,
  Clock,
  Award,
  Save
} from 'lucide-react';

interface EvaluationProps {
  victim?: {
    id?: number;
    nom?: string;
    sexe?: string;
    age?: number;
    dateNaissance?: string;
    dossier?: string;
    province?: string;
    territoire?: string;
    commune?: string;
  };
}

const Evaluation: React.FC<EvaluationProps> = ({ victim }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Étape 1 - Informations générales
    victime_CodeUnique: victim?.id?.toString() || '',
    victime_NomComplet: victim?.nom || '',
    victime_Sexe: victim?.sexe === 'Homme' ? 'M' : victim?.sexe === 'Femme' ? 'F' : '',
    victime_Age: victim?.age || '',
    victime_DateNaissance: victim?.dateNaissance || '',
    lieu_Evaluation: `${victim?.commune || ''} ${victim?.territoire || ''} ${victim?.province || ''}`.trim(),
    date_Evaluation: new Date().toISOString().split('T')[0],

    // Étape 2 - Informations sur l'évaluateur partenaire
    structure_Partenaire: '',
    medecin_Evaluateur_Nom: '',
    medecin_Evaluateur_Specialite: '',

    // Étape 3 - Préjudice et violation
    violation_Atteinte: '',
    physique_TypeAtteinte: '',
    physique_Description: '',
    physique_DegreAtteinte: '',
    fonctionnelle_Type: '',
    fonctionnelle_Description: '',
    fonctionnelle_DegreAtteinte: '',
    psy_Type: '',
    psy_Description: '',
    incapacite_Global: '',
    incapacite_Methodologie: '',

    // Étape 4 - Validation par le pool médical
    validation_Appreciation: '',
    validation_Categorisation: '',
    poolMedecin_Nom: '',
    poolMedecin_SignatureDate: '',
    poolMedecin_VisaQualite: '',

    // Étape 5 - Orientations et recommandations
    orientation_SoinsMedicaux: '',
    orientation_Reeducation_Appareillage: '',
    orientation_PriseChargePsychiatrique: '',
    orientation_AutresMesures: '',
    orientation_Priorisation: ''
  });

  const steps = [
    {
      id: 1,
      title: "Informations Générales",
      icon: <User className="w-5 h-5" />,
      description: "Données de base de la victime"
    },
    {
      id: 2,
      title: "Évaluateur Partenaire",
      icon: <Stethoscope className="w-5 h-5" />,
      description: "Informations sur le médecin évaluateur"
    },
    {
      id: 3,
      title: "Préjudice et Violation",
      icon: <AlertTriangle className="w-5 h-5" />,
      description: "Évaluation des atteintes subies"
    },
    {
      id: 4,
      title: "Validation Pool Médical",
      icon: <Shield className="w-5 h-5" />,
      description: "Validation par l'équipe médicale FONAREV"
    },
    {
      id: 5,
      title: "Orientations & Recommandations",
      icon: <Target className="w-5 h-5" />,
      description: "Mesures de prise en charge recommandées"
    }
  ];

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    console.log('Données d\'évaluation:', formData);
    // Ici vous pouvez ajouter la logique de sauvegarde
    alert('Évaluation médicale enregistrée avec succès !');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <User className="text-blue-600" size={20} />
                <div>
                  <h3 className="font-semibold text-blue-900">Informations Générales</h3>
                  <p className="text-sm text-blue-700">Données de base pré-remplies depuis le dossier de la victime</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Code Unique Victime
                </label>
                <input
                  type="text"
                  value={formData.victime_CodeUnique}
                  onChange={(e) => handleInputChange('victime_CodeUnique', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  placeholder="VICT-001"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom Complet
                </label>
                <input
                  type="text"
                  value={formData.victime_NomComplet}
                  onChange={(e) => handleInputChange('victime_NomComplet', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sexe
                </label>
                <select
                  value={formData.victime_Sexe}
                  onChange={(e) => handleInputChange('victime_Sexe', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  disabled
                >
                  <option value="">Sélectionner</option>
                  <option value="M">Masculin (M)</option>
                  <option value="F">Féminin (F)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Âge
                </label>
                <input
                  type="number"
                  value={formData.victime_Age}
                  onChange={(e) => handleInputChange('victime_Age', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date de Naissance
                </label>
                <input
                  type="date"
                  value={formData.victime_DateNaissance}
                  onChange={(e) => handleInputChange('victime_DateNaissance', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Lieu d'Évaluation
                </label>
                <input
                  type="text"
                  value={formData.lieu_Evaluation}
                  onChange={(e) => handleInputChange('lieu_Evaluation', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ville/Province de l'évaluation"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Date d'Évaluation
                </label>
                <input
                  type="date"
                  value={formData.date_Evaluation}
                  onChange={(e) => handleInputChange('date_Evaluation', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <Stethoscope className="text-green-600" size={20} />
                <div>
                  <h3 className="font-semibold text-green-900">Informations sur l'Évaluateur Partenaire</h3>
                  <p className="text-sm text-green-700">Détails du médecin ou de la structure partenaire effectuant l'évaluation</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Structure Partenaire
                </label>
                <input
                  type="text"
                  value={formData.structure_Partenaire}
                  onChange={(e) => handleInputChange('structure_Partenaire', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Hôpital ou ONG partenaire"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom du Médecin Évaluateur
                </label>
                <input
                  type="text"
                  value={formData.medecin_Evaluateur_Nom}
                  onChange={(e) => handleInputChange('medecin_Evaluateur_Nom', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Nom complet du médecin évaluateur"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Spécialité du Médecin
                </label>
                <input
                  type="text"
                  value={formData.medecin_Evaluateur_Specialite}
                  onChange={(e) => handleInputChange('medecin_Evaluateur_Specialite', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Spécialité médicale"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-orange-600" size={20} />
                <div>
                  <h3 className="font-semibold text-orange-900">Préjudice et Violation</h3>
                  <p className="text-sm text-orange-700">Évaluation détaillée des atteintes physiques, fonctionnelles et psychologiques</p>
                </div>
              </div>
            </div>

            {/* Nature des violations */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500" />
                Nature des Violations Subies
              </h4>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Violation/Atteinte
                </label>
                <select
                  value={formData.violation_Atteinte}
                  onChange={(e) => handleInputChange('violation_Atteinte', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner le niveau d'atteinte</option>
                  <option value="0">0 = Aucune atteinte</option>
                  <option value="1">1 = Atteinte moyenne</option>
                  <option value="2">2 = Atteinte grave</option>
                </select>
              </div>
            </div>

            {/* Préjudices physiques */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Préjudices Physiques
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type d'Atteinte Physique
                  </label>
                  <input
                    type="text"
                    value={formData.physique_TypeAtteinte}
                    onChange={(e) => handleInputChange('physique_TypeAtteinte', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Ex: fracture, mutilation, cicatrice..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Degré d'Atteinte (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.physique_DegreAtteinte}
                    onChange={(e) => handleInputChange('physique_DegreAtteinte', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="% de perte fonctionnelle"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description Physique
                  </label>
                  <textarea
                    value={formData.physique_Description}
                    onChange={(e) => handleInputChange('physique_Description', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={3}
                    placeholder="Localisation ou détails de l'atteinte physique"
                  />
                </div>
              </div>
            </div>

            {/* Préjudices fonctionnels */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Préjudices Fonctionnels
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type Fonctionnel
                  </label>
                  <input
                    type="text"
                    value={formData.fonctionnelle_Type}
                    onChange={(e) => handleInputChange('fonctionnelle_Type', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Ex: mobilité, continence, auto-soins..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Degré d'Atteinte (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.fonctionnelle_DegreAtteinte}
                    onChange={(e) => handleInputChange('fonctionnelle_DegreAtteinte', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="% de perte fonctionnelle"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description Fonctionnelle
                  </label>
                  <textarea
                    value={formData.fonctionnelle_Description}
                    onChange={(e) => handleInputChange('fonctionnelle_Description', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={3}
                    placeholder="Explication détaillée de l'atteinte fonctionnelle"
                  />
                </div>
              </div>
            </div>

            {/* Préjudices psychologiques */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                Préjudices Psychologiques
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type Psychologique
                  </label>
                  <input
                    type="text"
                    value={formData.psy_Type}
                    onChange={(e) => handleInputChange('psy_Type', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Ex: PTSD, anxiété, dépression..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description Psychologique
                  </label>
                  <textarea
                    value={formData.psy_Description}
                    onChange={(e) => handleInputChange('psy_Description', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={3}
                    placeholder="Détails du trouble psychologique"
                  />
                </div>
              </div>
            </div>

            {/* Évaluation médicale partenaire */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Évaluation Médicale Partenaire
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Incapacité Globale (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.incapacite_Global}
                    onChange={(e) => handleInputChange('incapacite_Global', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="% global d'incapacité estimé"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Méthodologie d'Incapacité
                  </label>
                  <input
                    type="text"
                    value={formData.incapacite_Methodologie}
                    onChange={(e) => handleInputChange('incapacite_Methodologie', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Référentiel ou méthode utilisée"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <Shield className="text-purple-600" size={20} />
                <div>
                  <h3 className="font-semibold text-purple-900">Validation par le Pool Médical</h3>
                  <p className="text-sm text-purple-700">Validation et contrôle qualité par l'équipe médicale FONAREV</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Appréciation de Validation
                </label>
                <select
                  value={formData.validation_Appreciation}
                  onChange={(e) => handleInputChange('validation_Appreciation', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner l'appréciation</option>
                  <option value="0">0 = Conforme</option>
                  <option value="1">1 = Non conforme</option>
                  <option value="2">2 = À refaire</option>
                  <option value="3">3 = Examens complémentaires requis</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catégorisation de Validation
                </label>
                <select
                  value={formData.validation_Categorisation}
                  onChange={(e) => handleInputChange('validation_Categorisation', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner la catégorisation</option>
                  <option value="1">1 = Moyenne</option>
                  <option value="2">2 = Grave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom du Médecin du Pool
                </label>
                <input
                  type="text"
                  value={formData.poolMedecin_Nom}
                  onChange={(e) => handleInputChange('poolMedecin_Nom', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Nom du médecin validateur FONAREV"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date et Signature
                </label>
                <input
                  type="date"
                  value={formData.poolMedecin_SignatureDate}
                  onChange={(e) => handleInputChange('poolMedecin_SignatureDate', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Visa de Contrôle Qualité
                </label>
                <input
                  type="text"
                  value={formData.poolMedecin_VisaQualite}
                  onChange={(e) => handleInputChange('poolMedecin_VisaQualite', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Visa de contrôle qualité"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <Target className="text-green-600" size={20} />
                <div>
                  <h3 className="font-semibold text-green-900">Orientations et Recommandations</h3>
                  <p className="text-sm text-green-700">Mesures de prise en charge et orientations thérapeutiques recommandées</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Heart className="inline w-4 h-4 mr-1 text-red-500" />
                  Orientation Soins Médicaux
                </label>
                <select
                  value={formData.orientation_SoinsMedicaux}
                  onChange={(e) => handleInputChange('orientation_SoinsMedicaux', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner</option>
                  <option value="0">0 = Non</option>
                  <option value="1">1 = Oui</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Activity className="inline w-4 h-4 mr-1 text-blue-500" />
                  Rééducation/Appareillage
                </label>
                <select
                  value={formData.orientation_Reeducation_Appareillage}
                  onChange={(e) => handleInputChange('orientation_Reeducation_Appareillage', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner</option>
                  <option value="0">0 = Non</option>
                  <option value="1">1 = Oui</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Brain className="inline w-4 h-4 mr-1 text-purple-500" />
                  Prise en Charge Psychiatrique
                </label>
                <select
                  value={formData.orientation_PriseChargePsychiatrique}
                  onChange={(e) => handleInputChange('orientation_PriseChargePsychiatrique', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner</option>
                  <option value="0">0 = Non</option>
                  <option value="1">1 = Oui</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Clock className="inline w-4 h-4 mr-1 text-orange-500" />
                  Niveau de Priorisation
                </label>
                <select
                  value={formData.orientation_Priorisation}
                  onChange={(e) => handleInputChange('orientation_Priorisation', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner la priorité</option>
                  <option value="1">1 = Très urgent</option>
                  <option value="2">2 = Urgent</option>
                  <option value="3">3 = À planifier</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Autres Mesures Recommandées
                </label>
                <textarea
                  value={formData.orientation_AutresMesures}
                  onChange={(e) => handleInputChange('orientation_AutresMesures', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={4}
                  placeholder="Décrire brièvement les autres mesures recommandées si nécessaire..."
                />
              </div>
            </div>

            {/* Résumé de l'évaluation */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6 mt-8">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Résumé de l'Évaluation
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="font-semibold text-gray-700">Incapacité Globale</div>
                  <div className="text-2xl font-bold text-blue-600">{formData.incapacite_Global || '0'}%</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="font-semibold text-gray-700">Catégorisation</div>
                  <div className="text-lg font-bold text-purple-600">
                    {formData.validation_Categorisation === '1' ? 'Moyenne' : 
                     formData.validation_Categorisation === '2' ? 'Grave' : 'Non définie'}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="font-semibold text-gray-700">Priorité</div>
                  <div className="text-lg font-bold text-orange-600">
                    {formData.orientation_Priorisation === '1' ? 'Très urgent' : 
                     formData.orientation_Priorisation === '2' ? 'Urgent' : 
                     formData.orientation_Priorisation === '3' ? 'À planifier' : 'Non définie'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      {/* En-tête */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Évaluation Médicale</h1>
        <p className="text-gray-600">Outil d'évaluation du niveau d'incapacité - FONAREV</p>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
                ${currentStep >= step.id 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                  : 'bg-white border-gray-300 text-gray-400'
                }
              `}>
                {currentStep > step.id ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  step.icon
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  w-16 h-1 mx-2 transition-all duration-300
                  ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'}
                `} />
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {steps[currentStep - 1]?.title}
          </h2>
          <p className="text-gray-600 text-sm">
            {steps[currentStep - 1]?.description}
          </p>
        </div>
      </div>

      {/* Contenu de l'étape */}
      <div className="bg-gray-50 rounded-xl p-6 mb-8 min-h-[500px]">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200
            ${currentStep === 1 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
            }
          `}
        >
          <ArrowLeft className="w-5 h-5" />
          Précédent
        </button>

        <div className="text-sm text-gray-500">
          Étape {currentStep} sur {steps.length}
        </div>

        {currentStep < steps.length ? (
          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 hover:shadow-lg transition-all duration-200"
          >
            Suivant
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 hover:shadow-lg transition-all duration-200"
          >
            <Save className="w-5 h-5" />
            Enregistrer l'Évaluation
          </button>
        )}
      </div>

      {/* Indicateur de progression */}
      <div className="mt-6">
        <div className="bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
        <div className="text-center mt-2 text-sm text-gray-600">
          Progression: {Math.round((currentStep / steps.length) * 100)}%
        </div>
      </div>
    </div>
  );
};

export default Evaluation;