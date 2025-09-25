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
import { GiReceiveMoney } from "react-icons/gi";
import { Modal } from 'flowbite-react';
import InfosVictim from './infosVictim';
import Swal from 'sweetalert2';
import Evaluation from './evaluation';

// Fonction pour obtenir le lien réel du fichier
const getFileLink = async (lien: string): Promise<string> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006';
    const response = await fetch(`${baseUrl}/minio/files/${lien}`);

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du lien du fichier');
    }

    const resData = await response.json();
    // Le vrai lien est dans resData.data.src
    if (resData && resData.data && resData.data.src) {
      return resData.data.src;
    }
    throw new Error('Lien du fichier non trouvé dans la réponse');
  } catch (error) {
    console.error('Erreur getFileLink:', error);
    throw error;
  }
};

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
  prejudiceFinal?: string;
  indemnisation?: number;
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
  const [files, setFiles] = useState<Array<{ id: number; label: string; name?: string; lien?: string }>>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newFileFile, setNewFileFile] = useState<File | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ id: number; label: string; name: string; lien?: string } | null>(null);
  const [editFileIdx, setEditFileIdx] = useState<number | null>(null);
  const [editFileLabel, setEditFileLabel] = useState('');
  const [editFileName, setEditFileName] = useState('');
  const [addFileMode, setAddFileMode] = useState(false);
  const [newFileLabel, setNewFileLabel] = useState('');
  const [newFileName, setNewFileName] = useState('');

  // Charger la liste des documents réels
  React.useEffect(() => {
    if (!currentVictim?.id) return;

    const fetchDocs = async () => {
      setLoadingFiles(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006';
        const res = await fetch(`${baseUrl}/victime/document/${currentVictim.id}`);
        if (!res.ok) throw new Error('Erreur récupération des documents');
        const data = await res.json();

        // Extraire les documents de la réponse
        const documents = data?.documentVictime || [];
        const mappedFiles = documents.map((doc: any) => ({
          id: doc.id,
          label: doc.label,
          name: doc.lien, // Le nom du fichier est dans 'lien'
          lien: doc.lien
        }));

        setFiles(mappedFiles);
      } catch (e) {
        console.error('Erreur lors du chargement des documents:', e);
        setFiles([]);
      } finally {
        setLoadingFiles(false);
      }
    };

    fetchDocs();
  }, [currentVictim?.id]);

  // Fonction pour ouvrir un fichier
  const handleOpenFile = async (file: { id: number; label: string; name?: string; lien?: string }) => {
    if (!file.lien) {
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Lien du fichier non disponible'
      });
      return;
    }

    try {
      const fileUrl = await getFileLink(file.lien);
      window.open(fileUrl, '_blank');
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible d\'ouvrir le fichier'
      });
    }
  };

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
    status,
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

        <div className='p-4 relative !bg-white !text-gray-900'>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 !text-gray-400 hover:!text-pink-500 transition-colors z-10"
            title="Fermer"
            aria-label="Fermer"
            type="button"
          >
            <X size={28} />
          </button>
          <div className="mb-6">
            <div className="flex border-b !border-gray-200">
              {tabs.map((tabItem) => {
                const Icon = tabItem.icon;
                return (
                  <button
                    key={tabItem.id}
                    onClick={() => setTab(tabItem.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${tab === tabItem.id
                      ? '!border-pink-500 !text-pink-600'
                      : '!border-transparent !text-gray-500 hover:!text-gray-700 hover:!border-gray-300'
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
            <InfosVictim victim={currentVictim} />
          )}

          {tab === 'dossier' && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">

              </div>

              {/* Section gestion des fichiers */}
              <h4 className="font-semibold !text-gray-700 mb-4">Gestion des fichiers</h4>
              <div className="space-y-2 mb-4">
                {files.map((file, idx) => (
                  <div key={file.id} className="flex items-center justify-between p-3 !bg-gray-50 rounded-lg !border !border-gray-200">
                    {editFileIdx === idx ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          className="!border !border-gray-300 px-2 py-1 rounded text-sm flex-1 !bg-white !text-gray-900"
                          value={editFileLabel}
                          onChange={e => setEditFileLabel(e.target.value)}
                          placeholder="Label"
                        />
                        <input
                          className="!border !border-gray-300 px-2 py-1 rounded text-sm flex-1 !bg-white !text-gray-900"
                          value={editFileName}
                          onChange={e => setEditFileName(e.target.value)}
                          placeholder="Nom du fichier"
                        />
                        <button
                          className="px-2 py-1 !bg-green-500 !text-white text-sm rounded hover:!bg-green-600 flex items-center gap-1"
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
                          className="px-2 py-1 !bg-gray-300 !text-gray-700 text-sm rounded hover:!bg-gray-400 flex items-center gap-1"
                          onClick={() => setEditFileIdx(null)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <FileText className="!text-gray-400" size={16} />
                          <div>
                            <div className="text-sm font-medium !text-gray-700">{file.label}</div>
                            <div className="text-xs !text-gray-500">{file.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="px-2 py-1 !bg-blue-50 !text-blue-600 text-sm rounded hover:!bg-blue-100 flex items-center gap-1"
                            onClick={() => {
                              setEditFileIdx(idx);
                              setEditFileLabel(file.label);
                              setEditFileName(file.name || '');
                            }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="px-2 py-1 !bg-red-50 !text-red-600 text-sm rounded hover:!bg-red-100 flex items-center gap-1"
                            onClick={() => {
                              if (window.confirm('Supprimer ce fichier ?')) {
                                setFiles(files.filter((_, i) => i !== idx));
                              }
                            }}
                          >
                            <Trash size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenFile(file)}
                            className="px-2 py-1 !bg-blue-50 !text-blue-600 text-sm rounded hover:!bg-blue-100 flex items-center gap-1"
                            title="Voir le document"
                          >
                            <Eye size={16} className="text-blue-600" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {addFileMode ? (
                <form
                  className="flex items-center gap-2 p-3 !bg-gray-50 rounded-lg !border !border-gray-200"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newFileLabel || !newFileFile || !currentVictim.id) return;

                    setUploadingFile(true);
                    try {
                      // 1. Upload fichier sur Minio
                      const formData = new FormData();
                      formData.append('file', newFileFile);
                      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006';
                      const uploadRes = await fetch(`${baseUrl}/minio/files/upload`, {
                        method: 'POST',
                        body: formData
                      });

                      const uploadData = await uploadRes.json();
                      const lien = uploadData?.url;
                      if (!lien) throw new Error('Erreur upload fichier');

                      // 2. POST sur /document_victime
                      const docRes = await fetch(`${baseUrl}/document-victime`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          label: newFileLabel,
                          lien,
                          victimeId: currentVictim.id,
                          userId: 1
                        })
                      });

                      if (!docRes.ok) throw new Error('Erreur enregistrement document');

                      // 3. Succès et recharge la liste
                      await Swal.fire({
                        icon: 'success',
                        title: 'Document numérisé',
                        text: 'Le document a été numérisé et enregistré avec succès.',
                        timer: 1500,
                        showConfirmButton: false
                      });

                      setNewFileLabel('');
                      setNewFileFile(null);
                      setAddFileMode(false);

                      // Recharge la liste des documents
                      setLoadingFiles(true);
                      try {
                        const res = await fetch(`${baseUrl}/victime/document/${currentVictim.id}`);
                        if (res.ok) {
                          const data = await res.json();
                          const documents = data?.documentVictime || [];
                          const mappedFiles = documents.map((doc: any) => ({
                            id: doc.id,
                            label: doc.label,
                            name: doc.lien,
                            lien: doc.lien
                          }));
                          setFiles(mappedFiles);
                        }
                      } catch (e) {
                        console.error('Erreur lors du rechargement des documents:', e);
                      } finally {
                        setLoadingFiles(false);
                      }

                    } catch (err: any) {
                      await Swal.fire({
                        icon: 'error',
                        title: 'Erreur',
                        text: err.message || 'Erreur lors de l\'upload'
                      });
                    } finally {
                      setUploadingFile(false);
                    }
                  }}
                >
                  <input
                    className="!border !border-gray-300 px-2 py-1 rounded text-sm flex-1 !bg-white !text-gray-900"
                    value={newFileLabel}
                    onChange={e => setNewFileLabel(e.target.value)}
                    placeholder="Label du fichier"
                    required
                    disabled={uploadingFile}
                  />
                  <input
                    type="file"
                    className="!border !border-gray-300 px-2 py-1 rounded text-sm flex-1 !bg-white !text-gray-900"
                    onChange={e => setNewFileFile(e.target.files?.[0] || null)}
                    required
                    disabled={uploadingFile}
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 !bg-green-500 !text-white text-sm rounded hover:!bg-green-600 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={uploadingFile}
                  >
                    {uploadingFile ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        Upload...
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        Ajouter
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 !bg-gray-300 !text-gray-700 text-sm rounded hover:!bg-gray-400 flex items-center gap-1"
                    onClick={() => setAddFileMode(false)}
                    disabled={uploadingFile}
                  >
                    <X size={14} />
                    Annuler
                  </button>
                </form>
              ) : (
                <button
                  className="flex items-center gap-2 px-4 py-2 !bg-pink-600 !text-white text-sm font-medium rounded hover:!bg-pink-700 transition-colors"
                  onClick={() => setAddFileMode(true)}
                >
                  <Plus size={16} />
                  Ajouter un fichier
                </button>
              )}
            </div>
          )}

          {tab === 'progression' && (
            <div className="text-center py-8 !bg-white !text-gray-900">
              <BarChart2 className="mx-auto !text-gray-400 mb-4" size={48} />
              <div className="!text-gray-500">Progression du dossier (à implémenter)</div>
            </div>
          )}

          {tab === 'reglages' && (
            <div className="!bg-white !text-gray-900">
              {/* Section confirmation de victime */}
              <div className="mb-6 p-4 !bg-blue-50 rounded-lg !border !border-blue-200">
                <h4 className="font-semibold !text-gray-700 mb-3 flex items-center gap-2">
                  <UserCheck className="!text-blue-600" size={18} />
                  Statut de la victime
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm !text-gray-600 mb-1">
                      Statut actuel :
                      <span className={`ml-2 px-3 py-1 text-sm font-semibold rounded-full ${!status || status === 'non confirmé'
                        ? '!bg-orange-100 !text-orange-700'
                        : '!bg-green-100 !text-green-700'
                        }`}>
                        {status && status !== '' ? status : 'non confirmé'}
                      </span>
                    </div>
                    {(!status || status === 'non confirmé') && (
                      <div className="text-xs !text-gray-500">
                        Confirmez cette victime pour valider son dossier
                      </div>
                    )}
                  </div>
                  {(!status || status === 'non confirmé') && (
                    <button
                      onClick={confirmVictim}
                      disabled={isConfirming}
                      className="flex items-center gap-2 px-4 py-2 !bg-green-600 !text-white text-sm font-medium rounded hover:!bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="flex items-center gap-2 !text-green-600 text-sm font-medium">
                      <Check size={16} />
                      Victime confirmée
                    </div>
                  )}
                </div>

              </div>

              <Evaluation />
              <Evaluation victim={currentVictim} />
            </div>
          )}
        </div>
      </Modal>

      {/* Aperçu fichier */}
      {selectedFile && (
        <Modal show={true} onClose={() => setSelectedFile(null)}>
          <div className="!bg-white !text-gray-900">
            {selectedFile.label}
          </div>
          <div className="!bg-white !text-gray-900">
            <div className="text-center py-8">
              <FileText className="mx-auto !text-gray-400 mb-4" size={48} />
              <div className="!text-gray-700">
                Aperçu du fichier : <span className="font-semibold">{selectedFile.name}</span>
              </div>
              <div className="text-sm !text-gray-500 mt-2">
                Fonctionnalité d'aperçu à implémenter
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default VictimDetailModal;