import React, { useState } from 'react';
import {
  Info,
  FileText,
  Edit,
  Trash,
  Plus,
  Check,
  X,
  Eye,
  Folder,
  BarChart2,
  Settings,
  UserCheck,
  Loader2
} from 'lucide-react';
import { Modal } from 'flowbite-react';

interface Victim {
  id: number;
  nom?: string;
  dateNaissance?: string;
  age?: number;
  sexe?: string;
  categorie?: string;
  nationalite?: string;
  etatMatrimonial?: string;
  adresse?: string;
  commune?: string;
  province?: string;
  territoire?: string;
  village?: string;
  provinceOrigine?: string;
  communeOrigine?: string;
  territoireOrigine?: string;
  villageOrigine?: string;
  groupement?: string;
  nomPere?: string;
  nomMere?: string;
  provinceIncident?: string;
  communeIncident?: string;
  territoireIncident?: string;
  lieuIncident?: string;
  dateIncident?: string;
  typeViolation?: string;
  prejudicesSubis?: string;
  status?: string;
  dossier?: string;
  avatar?: string;
  comment?: string;
  commentaire?: string;
  prejudices?: Array<{
    id: number;
    label: string;
    isMain: boolean;
    mesures: Array<{ id: number; label: string }>;
    programme: { id: number; label: string };
  }>;
}

interface VictimDetailModalProps {
  victim: Victim;
  onClose: () => void;
  onVictimUpdate?: (updatedVictim: Victim) => void;
}

const VictimDetailModal: React.FC<VictimDetailModalProps> = ({ victim, onClose, onVictimUpdate }) => {
  const [tab, setTab] = useState<'info' | 'dossier' | 'progression' | 'reglages'>('info');
  const [currentVictim, setCurrentVictim] = useState<Victim>(victim);
  const [isConfirming, setIsConfirming] = useState(false);
  const [files, setFiles] = useState([
    { id: 1, label: 'Rapport médical', name: 'rapport_medical.pdf' },
    { id: 2, label: 'Témoignage', name: 'temoignage.docx' },
    { id: 3, label: 'Photos', name: 'photos.zip' }
  ]);
  const [selectedFile, setSelectedFile] = useState<{ id: number; label: string; name: string } | null>(null);
  const [editFileIdx, setEditFileIdx] = useState<number | null>(null);
  const [editFileLabel, setEditFileLabel] = useState('');
  const [editFileName, setEditFileName] = useState('');
  const [addFileMode, setAddFileMode] = useState(false);
  const [newFileLabel, setNewFileLabel] = useState('');
  const [newFileName, setNewFileName] = useState('');

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
  } = currentVictim;

  const tabs = [
    { id: 'info', label: 'Informations', icon: Info },
    { id: 'dossier', label: 'Dossier', icon: Folder },
    { id: 'progression', label: 'Progression', icon: BarChart2 },
    { id: 'reglages', label: 'Réglages', icon: Settings }
  ];

  return (
    <>
      <Modal show={true} onClose={onClose} size="7xl">
        <Modal.Header>
          Détails de la victime : {nom || "-"}
        </Modal.Header>
        <Modal.Body>
          <div className="mb-6">
            <div className="flex border-b border-gray-200">
              {tabs.map((tabItem) => {
                const Icon = tabItem.icon;
                return (
                  <button
                    key={tabItem.id}
                    onClick={() => setTab(tabItem.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${tab === tabItem.id
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <Icon size={16} />
                    {tabItem.label}
                  </button>
                );
              })}
            </div>
          </div>

          {tab === 'info' && (
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex flex-col items-center md:items-start gap-4 md:w-1/3">
                <img
                  src={avatar}
                  alt="avatar"
                  className="w-28 h-28 rounded-full object-cover border-2 border-pink-200"
                />
                <div>
                  <span className="block text-xs text-gray-400">Catégorie</span>
                  <span className="inline-block mt-1 px-3 py-1 text-sm font-semibold rounded-full bg-pink-100 text-pink-700 shadow">
                    {categorie || "-"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-gray-400">Violation</span>
                  <span className="inline-block mt-1 px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-700 shadow">
                    {typeViolation || "-"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-gray-400">Préjudice</span>
                  <span className="inline-block mt-1 px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800 shadow">
                    {prejudicesSubis || "-"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-gray-400">Statut</span>
                  <span className={`inline-block mt-1 px-3 py-1 text-sm font-semibold rounded-full shadow ${!status || status === 'non confirmé'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-green-100 text-green-700'
                    }`}>
                    {status && status !== '' ? status : 'non confirmé'}
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-6">
                  <div><span className="font-semibold text-gray-700">Nom :</span> {nom || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Date de naissance :</span> {dateNaissance || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Âge :</span> {age || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Sexe :</span> {sexe || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Nationalité :</span> {nationalite || "-"}</div>
                  <div><span className="font-semibold text-gray-700">État matrimonial :</span> {etatMatrimonial || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Adresse :</span> {adresse || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Commune :</span> {commune || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Province :</span> {province || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Territoire :</span> {territoire || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Village :</span> {village || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Province d'origine :</span> {provinceOrigine || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Commune d'origine :</span> {communeOrigine || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Territoire d'origine :</span> {territoireOrigine || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Village d'origine :</span> {villageOrigine || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Groupement :</span> {groupement || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Nom du père :</span> {nomPere || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Nom de la mère :</span> {nomMere || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Province de l'incident :</span> {provinceIncident || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Commune de l'incident :</span> {communeIncident || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Territoire de l'incident :</span> {territoireIncident || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Lieu de l'incident :</span> {lieuIncident || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Date de l'incident :</span> {dateIncident || "-"}</div>
                  <div><span className="font-semibold text-gray-700">Dossier :</span> {dossier || "-"}</div>
                </div>

                {/* Préjudices subis */}
                <div className="mb-6">
                  <h4 className="text-base font-bold text-pink-700 mb-2 flex items-center">
                    <Info className="mr-2" size={16} /> Préjudices subis
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

                  {/* Commentaire */}
                  <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200 flex items-start gap-2">
                    <FileText className="mt-1 text-gray-400" size={16} />
                    <div>
                      <div className="text-xs text-gray-500 mb-1 font-semibold">Commentaire :</div>
                      <div className="text-sm text-gray-700 italic">
                        {currentVictim.comment || currentVictim.commentaire || "Aucun commentaire pour cette victime."}
                      </div>
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
            <div>
              {/* Section confirmation de victime */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <UserCheck className="text-blue-600" size={18} />
                  Statut de la victime
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Statut actuel :
                      <span className={`ml-2 px-3 py-1 text-sm font-semibold rounded-full ${!status || status === 'non confirmé'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-green-100 text-green-700'
                        }`}>
                        {status && status !== '' ? status : 'non confirmé'}
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
          )}
        </Modal.Body>
      </Modal>

      {/* Aperçu fichier */}
      {selectedFile && (
        <Modal show={true} onClose={() => setSelectedFile(null)}>
          <Modal.Header>
            {selectedFile.label}
          </Modal.Header>
          <Modal.Body>
            <div className="text-center py-8">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <div className="text-gray-700">
                Aperçu du fichier : <span className="font-semibold">{selectedFile.name}</span>
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Fonctionnalité d'aperçu à implémenter
              </div>
            </div>
          </Modal.Body>
        </Modal>
      )}
    </>
  );
};

export default VictimDetailModal;