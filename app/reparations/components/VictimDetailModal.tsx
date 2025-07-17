import React, { useState } from 'react';
import {
  Info,
  Folder,
  BarChart2,
  Settings,
  FileText,
  Eye,
  Edit,
  Trash,
  Plus,
  Check,
  X,
  UserCheck,
  Loader2
} from 'lucide-react';
import Modal from './Modal';
import Victim from '../types/Victim';

interface VictimDetailModalProps {
  victim: Victim;
  onClose: () => void;
  onVictimUpdate?: (updatedVictim: Victim) => void;
}

const VictimDetailModal: React.FC<VictimDetailModalProps> = ({ victim, onClose, onVictimUpdate }) => {
  const [tab, setTab] = useState<'infos' | 'dossier' | 'progression' | 'reglages'>('infos');
  const [currentVictim, setCurrentVictim] = useState<Victim>(victim);
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [isLoadingProgram, setIsLoadingProgram] = useState(false);

  const defaultFiles = [
    { id: 1, name: "rapport-medical.pdf", label: "Rapport médical" },
    { id: 2, name: "plainte.pdf", label: "Plainte officielle" },
    { id: 3, name: "photo-blessure.jpg", label: "Photo de la blessure" },
    { id: 4, name: "certificat-psy.pdf", label: "Certificat psychologique" },
  ];

  const [files, setFiles] = useState<any[]>(defaultFiles);
  const [editFileIdx, setEditFileIdx] = useState<number | null>(null);
  const [editFileLabel, setEditFileLabel] = useState('');
  const [editFileName, setEditFileName] = useState('');
  const [addFileMode, setAddFileMode] = useState(false);
  const [newFileLabel, setNewFileLabel] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [programData, setProgramData] = useState<any>(null);

  const confirmVictim = async () => {
    if (!currentVictim.id) {
      alert('ID de la victime manquant');
      return;
    }

    setIsConfirming(true);
    try {
      const response = await fetch(`http://10.140.0.106:8006/victime/${currentVictim.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'confirmé'
        })
      });

      if (response.ok) {
        const updatedVictim = { ...currentVictim, status: 'confirmé' };
        setCurrentVictim(updatedVictim);
        onVictimUpdate?.(updatedVictim);
        alert('Victime confirmée avec succès');
      } else {
        throw new Error('Erreur lors de la confirmation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la confirmation de la victime');
    } finally {
      setIsConfirming(false);
    }
  };

  const viewProgram = async () => {
    if (!currentVictim.categorie || !currentVictim.prejudicesSubis || !currentVictim.typeViolation) {
      alert('Informations manquantes pour classifier le programme');
      return;
    }

    setIsLoadingProgram(true);
    try {
      const response = await fetch('http://10.140.0.106:8006/programme-prejudice-mesure/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          programmeCategorie: currentVictim.categorie,
          prejudiceType: currentVictim.prejudicesSubis,
          violation: currentVictim.typeViolation
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404 && data.message === "Aucune mesure trouvée pour cette combinaison") {
          alert('Aucun programme disponible pour cette combinaison de critères');
          setProgramData(null); // Réinitialiser les données
          return;
        }
        throw new Error(data.message || 'Erreur lors de la classification');
      }

      console.log('Programme trouvé:', data);
      setProgramData(data); // Stocker les données du programme

    } catch (error: any) {
      console.error('Erreur:', error);
      alert(`Erreur: ${error.message}`);
      setProgramData(null);
    } finally {
      setIsLoadingProgram(false);
    }
  };

  const {
    nom,
    dateNaissance,
    age,
    sexe,
    categorie,
    nationalite,
    etatMatrimonial,
    adresse,
    commune,
    province,
    territoire,
    village,
    provinceOrigine,
    communeOrigine,
    territoireOrigine,
    villageOrigine,
    groupement,
    nomPere,
    nomMere,
    provinceIncident,
    communeIncident,
    territoireIncident,
    lieuIncident,
    dateIncident,
    typeViolation,
    prejudicesSubis,
    status,
    dossier,
    avatar = "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    comment,
    commentaire,
  } = currentVictim;

  const defaultPrejudices = [
    {
      id: 1,
      label: 'Violences physiques',
      isMain: true,
      mesures: [
        { id: 1, label: 'Prise en charge médicale' },
        { id: 2, label: 'Soutien psychologique' },
      ],
      programme: { id: 1, label: 'Programme Femmes & Enfants' }
    },
    {
      id: 2,
      label: 'Déplacement forcé',
      isMain: false,
      mesures: [
        { id: 3, label: 'Aide au relogement' },
        { id: 4, label: 'Assistance alimentaire' },
      ],
      programme: { id: 2, label: 'Programme Réintégration Sociale' }
    },
    {
      id: 3,
      label: 'Pertes matérielles',
      isMain: false,
      mesures: [
        { id: 5, label: 'Indemnisation financière' }
      ],
      programme: { id: 3, label: 'Programme Réparation Matérielle' }
    }
  ];

  const prejudices = currentVictim.prejudices && currentVictim.prejudices.length > 0 ? currentVictim.prejudices : defaultPrejudices;

  const tabs = [
    { key: 'infos', label: 'Infos', icon: Info },
    { key: 'dossier', label: 'Dossier', icon: Folder },
    { key: 'progression', label: 'Progression', icon: BarChart2 },
    { key: 'reglages', label: 'Réglages', icon: Settings },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pris en charge':
      case 'confirmé':
        return 'bg-green-100 text-green-700';
      case 'En attente':
      case 'non confirmé':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-red-100 text-red-700';
    }
  };

  console.log("programmData", programData)
  return (
    <>
      <Modal title={`Détails de la victime : ${nom || "Détail victime"}`} onClose={onClose}>
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <img
            src={avatar}
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover border-2 border-pink-200 mx-auto md:mx-0"
          />
          <div className="flex-1">
            <div className="flex gap-4 items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-900">{nom}</h3>
              <span className={`px-3 py-1 rounded text-sm font-semibold ${sexe === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                }`}>
                {sexe}
              </span>
              <span className="ml-auto text-base text-gray-400">{age} ans</span>
            </div>
            <div className="text-base text-gray-600 mb-2">{province}, {territoire}</div>
            <div className="text-sm text-gray-400 mb-4">{commune} / {groupement} / {village}</div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
              <span><b>Adresse:</b> {adresse}</span>
              <span><b>Nationalité:</b> {nationalite}</span>
            </div>
            <div className="flex gap-2 text-sm mb-6">
              <span className={`px-3 py-1 rounded-full font-semibold ${getStatusColor(status || '')}`}>
                {status || 'non confirmé'}
              </span>
              {categorie && (
                <span className="px-3 py-1 rounded-full font-semibold bg-purple-100 text-purple-700">
                  {categorie}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex border-b border-gray-200 mb-6">
            {tabs.map((tabItem) => {
              const Icon = tabItem.icon;
              return (
                <button
                  key={tabItem.key}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${tab === tabItem.key
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  onClick={() => setTab(tabItem.key as any)}
                >
                  <Icon size={16} />
                  {tabItem.label}
                </button>
              );
            })}
          </div>

          {tab === 'infos' && (
            <div className="space-y-6">
              {/* Informations personnelles */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Informations personnelles</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-semibold text-gray-700">Nom :</span> {nom || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Date de naissance :</span> {dateNaissance || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Âge :</span> {age || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Sexe :</span> {sexe || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Catégorie :</span> {categorie || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Nationalité :</span> {nationalite || "-"}</div>
                  <div><span className="font-semibold text-gray-700">État matrimonial :</span> {etatMatrimonial || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Nom du père :</span> {nomPere || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Nom de la mère :</span> {nomMere || "-"}</div>
                </div>
              </div>

              {/* Localisation actuelle */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Localisation actuelle</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-semibold text-gray-700">Province :</span> {province || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Territoire :</span> {territoire || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Commune :</span> {commune || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Village :</span> {village || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Groupement :</span> {groupement || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Adresse :</span> {adresse || "-"}</div>
                </div>
              </div>

              {/* Origine */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Origine</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-semibold text-gray-700">Province d'origine :</span> {provinceOrigine || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Territoire d'origine :</span> {territoireOrigine || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Commune d'origine :</span> {communeOrigine || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Village d'origine :</span> {villageOrigine || "-"}</div>
                </div>
              </div>

              {/* Informations sur l'incident */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Informations sur l'incident</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-semibold text-gray-700">Date de l'incident :</span> {dateIncident || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Type de violation :</span> {typeViolation || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Province de l'incident :</span> {provinceIncident || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Territoire de l'incident :</span> {territoireIncident || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Commune de l'incident :</span> {communeIncident || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Lieu de l'incident :</span> {lieuIncident || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Préjudices subis :</span> {prejudicesSubis || "-"}</div>
                </div>
              </div>

              {/* Préjudices subis  */}
              <div>
                <h4 className="text-base font-bold text-pink-700 mb-4 flex items-center">
                  <Info className="mr-2" size={16} /> Préjudices subis détaillés
                </h4>
                <div className="space-y-4">
                  {prejudicesSubis ? (
                    <div className="p-4 rounded-lg border bg-gray-50 flex flex-col md:flex-row md:items-center md:gap-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-2 md:mb-0">
                        <span className="font-semibold text-gray-800 text-base">
                          {prejudicesSubis}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      Aucun préjudice renseigné pour cette victime.
                    </div>
                  )}
                </div>

                {/* Section classification de programme */}
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 mt-4">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <BarChart2 className="text-purple-600" size={18} />
                    Classification de programme
                  </h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Classifier le programme adapté selon les critères de la victime
                      </div>
                      <div className="text-xs text-gray-500">
                        Basé sur : catégorie ({categorie || 'N/A'}), préjudices ({prejudicesSubis || 'N/A'}), violation ({typeViolation || 'N/A'})
                      </div>
                    </div>
                    <button
                      onClick={viewProgram}
                      disabled={isLoadingProgram || !categorie || !prejudicesSubis || !typeViolation}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingProgram ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Classification...
                        </>
                      ) : (
                        <>
                          <Eye size={16} />
                          Voir le programme
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Résultat du programme (à afficher après la classification) */}
                {programData && programData[0]?.programme && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                      <Check className="text-green-600" size={18} />
                      Programme recommandé
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-700">Programme:</div>
                        <div className="text-base text-green-600 font-semibold">
                          {programData[0].programme?.programme}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700">Mesures:</div>
                        <ul className="list-disc list-inside text-green-800">
                          {programData[0].mesure.mesure}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}


                {/* Commentaire */}
                <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200 flex items-start gap-2">
                  <FileText className="mt-1 text-gray-400" size={16} />
                  <div>
                    <div className="text-xs text-gray-500 mb-1 font-semibold">Commentaire :</div>
                    <div className="text-sm text-gray-700 italic">
                      {comment || commentaire || "Aucun commentaire pour cette victime."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'dossier' && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-4">Fichiers du dossier</h4>
              <div className="space-y-2">
                {files.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileText className="text-gray-400" size={16} />
                      <div>
                        <div className="text-sm font-medium text-gray-700">{file.label}</div>
                        <div className="text-xs text-gray-500">{file.name}</div>
                      </div>
                    </div>
                    <button
                      className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded hover:bg-blue-100 transition-colors"
                      onClick={() => setSelectedFile(file)}
                    >
                      <Eye size={14} />
                      Voir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'progression' && (
            <div className="text-center py-8">
              <BarChart2 className="mx-auto text-gray-400 mb-4" size={48} />
              <div className="text-gray-500">Progression du dossier (à implémenter)</div>
            </div>
          )}

          {tab === 'reglages' && (
            <div className="space-y-6">
              {/* Section confirmation de victime */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <UserCheck className="text-blue-600" size={18} />
                  Statut de la victime
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Statut actuel :
                      <span className={`ml-2 px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(status || '')}`}>
                        {status || 'non confirmé'}
                      </span>
                    </div>
                    {(!status || status === 'non confirmé') && (
                      <div className="text-xs text-gray-500">
                        Confirmez cette victime pour valider son dossier
                      </div>
                    )}
                  </div>
                  {(!status || status === 'non confirmé') && (
                    <button
                      onClick={confirmVictim}
                      disabled={isConfirming}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isConfirming ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Confirmation...
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          Confirmer la victime
                        </>
                      )}
                    </button>
                  )}
                  {status === 'confirmé' && (
                    <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                      <Check size={16} />
                      Victime confirmée
                    </div>
                  )}
                </div>
              </div>



              {/* Section gestion des fichiers */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-4">Gestion des fichiers</h4>
                <div className="space-y-2 mb-4">
                  {files.map((file, idx) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      {editFileIdx === idx ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            className="border px-2 py-1 rounded text-sm flex-1"
                            value={editFileLabel}
                            onChange={e => setEditFileLabel(e.target.value)}
                            placeholder="Label"
                          />
                          <input
                            className="border px-2 py-1 rounded text-sm flex-1"
                            value={editFileName}
                            onChange={e => setEditFileName(e.target.value)}
                            placeholder="Nom du fichier"
                          />
                          <button
                            className="px-2 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 flex items-center gap-1"
                            onClick={() => {
                              const updated = [...files];
                              updated[idx] = { ...file, label: editFileLabel, name: editFileName };
                              setFiles(updated);
                              setEditFileIdx(null);
                            }}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            className="px-2 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 flex items-center gap-1"
                            onClick={() => setEditFileIdx(null)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <FileText className="text-gray-400" size={16} />
                            <div>
                              <div className="text-sm font-medium text-gray-700">{file.label}</div>
                              <div className="text-xs text-gray-500">{file.name}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className="px-2 py-1 bg-blue-50 text-blue-600 text-sm rounded hover:bg-blue-100 flex items-center gap-1"
                              onClick={() => {
                                setEditFileIdx(idx);
                                setEditFileLabel(file.label);
                                setEditFileName(file.name);
                              }}
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              className="px-2 py-1 bg-red-50 text-red-600 text-sm rounded hover:bg-red-100 flex items-center gap-1"
                              onClick={() => {
                                if (window.confirm('Supprimer ce fichier ?')) {
                                  setFiles(files.filter((_, i) => i !== idx));
                                }
                              }}
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {addFileMode ? (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                    <input
                      className="border px-2 py-1 rounded text-sm flex-1"
                      value={newFileLabel}
                      onChange={e => setNewFileLabel(e.target.value)}
                      placeholder="Label du fichier"
                    />
                    <input
                      className="border px-2 py-1 rounded text-sm flex-1"
                      value={newFileName}
                      onChange={e => setNewFileName(e.target.value)}
                      placeholder="Nom du fichier"
                    />
                    <button
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 flex items-center gap-1"
                      onClick={() => {
                        if (newFileLabel && newFileName) {
                          setFiles([
                            ...files,
                            { id: Math.random(), label: newFileLabel, name: newFileName }
                          ]);
                          setNewFileLabel('');
                          setNewFileName('');
                          setAddFileMode(false);
                        }
                      }}
                    >
                      <Check size={14} />
                      Ajouter
                    </button>
                    <button
                      className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 flex items-center gap-1"
                      onClick={() => setAddFileMode(false)}
                    >
                      <X size={14} />
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded hover:bg-pink-700 transition-colors"
                    onClick={() => setAddFileMode(true)}
                  >
                    <Plus size={16} />
                    Ajouter un fichier
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Aperçu fichier */}
      {selectedFile && (
        <Modal title={selectedFile.label} onClose={() => setSelectedFile(null)}>
          <div className="text-center py-8">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <div className="text-gray-700">
              Aperçu du fichier : <span className="font-semibold">{selectedFile.name}</span>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Fonctionnalité d'aperçu à implémenter
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default VictimDetailModal;