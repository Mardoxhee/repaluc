import React, { useState, useEffect } from 'react';
import { Modal } from 'flowbite-react';
import { X, Download, FileText, User, Stethoscope, AlertTriangle, Target, Shield, Award } from 'lucide-react';
import { useFetch } from '@/app/context/FetchContext';
import jsPDF from 'jspdf';

interface ViewEvaluationModalProps {
  victim: any;
  onClose: () => void;
}

const ViewEvaluationModal: React.FC<ViewEvaluationModalProps> = ({ victim, onClose }) => {
  const { fetcher } = useFetch();
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [partenaire, setPartenaire] = useState<any>(null);

  useEffect(() => {
    const fetchEvaluationData = async () => {
      if (!victim?.id) return;

      try {
        setLoading(true);
        const evalData = await fetcher(`/evaluations-medicales?victimeId=${victim.id}`);

        if (evalData && evalData.length > 0) {
          const evalDetail = evalData[0];
          setEvaluation(evalDetail);

          // Fetch partenaire details if partenaireId exists
          if (evalDetail.partenaireId) {
            const partData = await fetcher(`/partenaires/${evalDetail.partenaireId}`);
            setPartenaire(partData);
          }
        }
      } catch (error) {
        console.log('Erreur lors du chargement de l\'évaluation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluationData();
  }, [victim?.id, fetcher]);

  const exportToPDF = () => {
    if (!evaluation) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FICHE D\'ÉVALUATION MÉDICALE', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Victim Info
    doc.setFontSize(14);
    doc.text('Informations de la Victime', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nom complet: ${victim.nom || 'N/A'}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Sexe: ${victim.sexe || 'N/A'}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Âge: ${victim.age || 'N/A'}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Lieu: ${evaluation.lieuEvaluation || 'N/A'}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Date d'évaluation: ${evaluation.dateEvaluation || 'N/A'}`, 20, yPosition);
    yPosition += 12;

    // Partner Info
    if (partenaire) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Partenaire Évaluateur', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Structure: ${partenaire.structure || 'N/A'}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Médecin: ${evaluation.medecinEvaluateurNom || 'N/A'}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Spécialité: ${evaluation.medecinEvaluateurSpecialite || 'N/A'}`, 20, yPosition);
      yPosition += 12;
    }

    // Check if new page needed
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Violations
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Préjudices et Violations', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Violation/Atteinte: ${evaluation.violationAtteinte || 'N/A'}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Type atteinte physique: ${evaluation.physiqueTypeAtteinte || 'N/A'}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Degré atteinte physique: ${evaluation.physiqueDegreAtteinte || 'N/A'}%`, 20, yPosition);
    yPosition += 7;
    doc.text(`Type atteinte fonctionnelle: ${evaluation.fonctionnelleType || 'N/A'}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Degré atteinte fonctionnelle: ${evaluation.fonctionnelleDegreAtteinte || 'N/A'}%`, 20, yPosition);
    yPosition += 7;
    doc.text(`Type atteinte psychologique: ${evaluation.psyType || 'N/A'}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Incapacité globale: ${evaluation.incapaciteGlobal || 'N/A'}%`, 20, yPosition);
    yPosition += 12;

    // Check if new page needed
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Orientations
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Orientations et Recommandations', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Soins médicaux: ${evaluation.orientationSoinsMedicaux ? 'Oui' : 'Non'}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Rééducation/Appareillage: ${evaluation.orientationReeducationAppareillage ? 'Oui' : 'Non'}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Prise en charge psychiatrique: ${evaluation.orientationPriseChargePsychiatrique ? 'Oui' : 'Non'}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Priorisation: ${evaluation.orientationPriorisation || 'N/A'}`, 20, yPosition);
    yPosition += 12;

    // Pool Medical Validation
    if (evaluation.poolMedecinNom) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Validation Pool Médical', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Appréciation: ${evaluation.validationAppreciation || 'N/A'}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Catégorisation: ${evaluation.validationCategorisation || 'N/A'}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Validé par: ${evaluation.poolMedecinNom || 'N/A'}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Date: ${evaluation.poolMedecinSignatureDate || 'N/A'}`, 20, yPosition);
    }

    // Save PDF
    doc.save(`Evaluation_${victim.nom}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <Modal show={true} onClose={onClose} size="4xl">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de l'évaluation...</p>
        </div>
      </Modal>
    );
  }

  if (!evaluation) {
    return (
      <Modal show={true} onClose={onClose} size="4xl">
        <div className="p-8 text-center">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">Aucune évaluation trouvée pour cette victime.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          >
            Fermer
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal show={true} onClose={onClose} size="7xl">
      <div className="p-6 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Fiche d'Évaluation Médicale</h2>
            <p className="text-sm text-gray-600 mt-1">Victime: {victim.nom}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToPDF}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
              title="Exporter en PDF"
            >
              <Download size={18} />
              Exporter PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Fermer"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Section 1: Informations Générales */}
          <div className="bg-gray-50 p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <User className="text-blue-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Informations Générales</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Nom complet</label>
                <p className="text-gray-900">{victim.nom || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Sexe</label>
                <p className="text-gray-900">{victim.sexe || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Âge</label>
                <p className="text-gray-900">{victim.age || 'N/A'} ans</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Date de naissance</label>
                <p className="text-gray-900">{victim.dateNaissance || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Lieu d'évaluation</label>
                <p className="text-gray-900">{evaluation.lieuEvaluation || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Date d'évaluation</label>
                <p className="text-gray-900">{evaluation.dateEvaluation || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Section 2: Évaluateur Partenaire */}
          {(partenaire || evaluation.medecinEvaluateurNom) && (
            <div className="bg-gray-50 p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Stethoscope className="text-green-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Évaluateur Partenaire</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {partenaire && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Structure partenaire</label>
                    <p className="text-gray-900">{partenaire.structure || 'N/A'}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Médecin évaluateur</label>
                  <p className="text-gray-900">{evaluation.medecinEvaluateurNom || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Spécialité</label>
                  <p className="text-gray-900">{evaluation.medecinEvaluateurSpecialite || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Préjudices et Violations */}
          <div className="bg-gray-50 p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-orange-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Préjudices et Violations</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Type de violation/atteinte</label>
                <p className="text-gray-900">{evaluation.violationAtteinte || 'N/A'}</p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-800 mb-2">Atteinte Physique</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <p className="text-gray-900">{evaluation.physiqueTypeAtteinte || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Degré d'atteinte</label>
                    <p className="text-gray-900">{evaluation.physiqueDegreAtteinte || 'N/A'}%</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-gray-900">{evaluation.physiqueDescription || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-800 mb-2">Atteinte Fonctionnelle</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <p className="text-gray-900">{evaluation.fonctionnelleType || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Degré d'atteinte</label>
                    <p className="text-gray-900">{evaluation.fonctionnelleDegreAtteinte || 'N/A'}%</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-gray-900">{evaluation.fonctionnelleDescription || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-800 mb-2">Atteinte Psychologique</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <p className="text-gray-900">{evaluation.psyType || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-gray-900">{evaluation.psyDescription || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-800 mb-2">Incapacité Globale</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Taux global</label>
                    <p className=" text-xl font-bold text-blue-600">{evaluation.incapaciteGlobal || 'N/A'}%</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Méthodologie</label>
                    <p className="text-gray-900">{evaluation.incapaciteMethodologie || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Orientations et Recommandations */}
          <div className="bg-gray-50 p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Target className="text-purple-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Orientations et Recommandations</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={evaluation.orientationSoinsMedicaux}
                  readOnly
                  className="w-4 h-4"
                />
                <label className="text-gray-900">Soins médicaux</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={evaluation.orientationReeducationAppareillage}
                  readOnly
                  className="w-4 h-4"
                />
                <label className="text-gray-900">Rééducation/Appareillage</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={evaluation.orientationPriseChargePsychiatrique}
                  readOnly
                  className="w-4 h-4"
                />
                <label className="text-gray-900">Prise en charge psychiatrique</label>
              </div>
              {evaluation.orientationAutresMesures && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Autres mesures</label>
                  <p className="text-gray-900">{evaluation.orientationAutresMesures}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-600">Niveau de priorisation</label>
                <p className="text-gray-900 font-semibold">{evaluation.orientationPriorisation || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Section 5: Validation Pool Médical */}
          {evaluation.poolMedecinNom && (
            <div className="bg-gray-50 p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="text-indigo-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Validation Pool Médical FONAREV</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">Appréciation</label>
                  <p className="text-gray-900">{evaluation.validationAppreciation || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Catégorisation</label>
                  <p className="text-gray-900 font-semibold">{evaluation.validationCategorisation || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Validé par</label>
                  <p className="text-gray-900">{evaluation.poolMedecinNom || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Date de signature</label>
                  <p className="text-gray-900">{evaluation.poolMedecinSignatureDate || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Visa/Qualité</label>
                  <p className="text-gray-900">{evaluation.poolMedecinVisaQualite || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Section 6: Statut */}
          <div className="bg-blue-50 p-6 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Award className="text-blue-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Statut de l'Évaluation</h3>
            </div>
            <p className="text-sm text-gray-600">Scoop actuel: <span className="font-semibold text-blue-700">{evaluation.scoop || 'Non défini'}</span></p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ViewEvaluationModal;
