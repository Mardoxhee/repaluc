import React, { useState, useContext, useEffect } from 'react';
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
  Loader2,
  Stethoscope,
  ClipboardList,
  ChevronRight
} from 'lucide-react';
import { getQuestions } from '../../utils/planVieQuestionsCache';
import { FetchContext } from '../../context/FetchContext';
import { GiReceiveMoney } from "react-icons/gi";
import { Modal } from 'flowbite-react';
import InfosVictim from './infosVictim';
import Formulaireplandevie from './formulaireplandevie';
import ContratVictim from './contrat';
import SuiviPaiement from './SuiviPaiement';
import Swal from 'sweetalert2';

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
    console.log('Erreur getFileLink:', error);
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
  photo?: string | null;
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
  onViewEvaluation?: (victim: Victim) => void;
}

const VictimDetailModal: React.FC<VictimDetailModalProps> = ({ victim, onClose, onVictimUpdate, onViewEvaluation }) => {
  const fetchCtx = useContext(FetchContext);
  const [tab, setTab] = useState<'info' | 'dossier' | 'progression' | 'reglages' | 'formulaires' | 'contrat' | 'paiement'>('info');
  const [hasContrat, setHasContrat] = useState(false);
  const [currentVictim, setCurrentVictim] = useState<Victim>(victim);
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
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
  const [questions, setQuestions] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Charger les questions depuis le cache
  useEffect(() => {
    const loadQuestions = async () => {
      if (tab === 'formulaires') {
        setLoadingQuestions(true);
        try {
          const cachedQuestions = await getQuestions();
          if (cachedQuestions) {
            setQuestions(cachedQuestions);
          } else {
            console.log('Aucune question trouvée dans le cache');
          }
        } catch (error) {
          console.error('Erreur lors du chargement des questions:', error);
        } finally {
          setLoadingQuestions(false);
        }
      }
    };

    loadQuestions();
  }, [tab]);

  // Désactiver le scroll du body quand le modal est ouvert
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Vérifier si la victime a un contrat signé
  React.useEffect(() => {
    const checkContrat = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006';
        const response = await fetch(`${baseUrl}/contrat/${currentVictim.id}`);
        if (response.ok) {
          const data = await response.json();
          // Vérifier si le contrat a un plan d'indemnisation
          setHasContrat(data && data.planIndemnisation && data.planIndemnisation.length > 0);
        } else {
          setHasContrat(false);
        }
      } catch (error) {
        setHasContrat(false);
      }
    };

    checkContrat();
  }, [currentVictim.id]);

  // Charger la liste des documents réels
  React.useEffect(() => {
    if (!currentVictim?.id) return;

    const fetchDocs = async () => {
      setLoadingFiles(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006';
        const res = await fetch(`${baseUrl}/victime/document/${currentVictim.id}`);
        if (!res.ok) console.log('Erreur récupération des documents');
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
        console.log('Erreur lors du chargement des documents:', e);
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
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006';
      const response = await fetch(`${baseUrl}/victime/${currentVictim.id}`, {
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
      console.log('Erreur:', error);
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
    { id: 'formulaires', label: 'Formulaires', icon: ClipboardList },
    { id: 'contrat', label: 'Contrat', icon: FileText },
    // Afficher l'onglet Suivi Paiement uniquement si la victime a un contrat
    ...(hasContrat ? [{ id: 'paiement', label: 'Suivi Paiement', icon: GiReceiveMoney }] : []),
    { id: 'reglages', label: 'Réglages', icon: Settings }
  ];

  const formulaires = [
    { id: 'plan-de-vie', label: 'Plan de vie', description: 'Formulaire de plan de vie pour la victime' }
  ];

  // Fonction pour obtenir l'icône de l'onglet actif
  const getActiveTabIcon = () => {
    const activeTab = tabs.find(t => t.id === tab);
    return activeTab ? React.createElement(activeTab.icon, { size: 16 }) : null;
  };

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

          {/* Menu déroulant pour les petits écrans */}
          <div className="md:hidden mb-4 mt-8">
            <div className="relative">
              <select
                value={tab}
                onChange={(e) => setTab(e.target.value as any)}
                className="block w-full p-2 pl-3 pr-10 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 rounded-md appearance-none"
              >
                {tabs.map((tabItem) => (
                  <option key={tabItem.id} value={tabItem.id}>
                    {tabItem.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Onglets pour les écrans moyens et grands */}
          <div className="hidden md:block mb-6">
            <div className="flex border-b !border-gray-200 overflow-x-auto">
              {tabs.map((tabItem) => {
                const Icon = tabItem.icon;
                return (
                  <button
                    key={tabItem.id}
                    onClick={() => setTab(tabItem.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${tab === tabItem.id
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
            <div>
              <InfosVictim victim={currentVictim} />

              {/* Bouton pour voir l'évaluation médicale */}
              {(currentVictim.status?.toLowerCase() === 'evalué' || currentVictim.status?.toLowerCase() === 'évalué' || currentVictim.status?.toLowerCase() === 'contrôlé' || currentVictim.status?.toLowerCase() === 'controle') && (
                <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Stethoscope className="text-purple-600" size={18} />
                    Évaluation Médicale
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Cette victime a une évaluation médicale enregistrée.
                  </p>
                  <button
                    onClick={() => onViewEvaluation?.(currentVictim)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 transition-colors"
                  >
                    <FileText size={16} />
                    Voir le rapport d'évaluation
                  </button>
                </div>
              )}
            </div>
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
                        console.log('Erreur lors du rechargement des documents:', e);
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

          {tab === 'formulaires' && (
            <div className="!bg-white !text-gray-900">
              {!selectedForm ? (
                <div>
                  <h3 className="text-lg font-semibold !text-blue-600 mb-4">Liste des formulaires</h3>
                  <div className="space-y-3">
                    {formulaires.map((form) => (
                      <div
                        key={form.id}
                        onClick={() => setSelectedForm(form.id)}
                        className="flex items-center justify-between p-4 !bg-gray-50 rounded-lg !border !border-gray-200 hover:!bg-blue-50 hover:!border-blue-300 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 !bg-blue-100 rounded-lg">
                            <FileText className="!text-blue-600" size={20} />
                          </div>
                          <div>
                            <div className="font-medium !text-gray-800">{form.label}</div>
                            <div className="text-sm !text-gray-500">{form.description}</div>
                          </div>
                        </div>
                        <ChevronRight className="!text-gray-400" size={20} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => setSelectedForm(null)}
                    className="mb-4 flex items-center gap-2 px-3 py-2 !text-gray-600 hover:!text-blue-600 transition-colors"
                  >
                    <X size={16} />
                    Retour à la liste
                  </button>
                  {loadingQuestions ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                  ) : questions ? (
                    <Formulaireplandevie
                      victim={victim}
                      userId={1}
                      initialQuestions={questions}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Impossible de charger les questions du formulaire. Veuillez vérifier votre connexion.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'contrat' && (
            <div className="!bg-white !text-gray-900">
              <ContratVictim victim={currentVictim} />
            </div>
          )}

          {tab === 'paiement' && hasContrat && (
            <div className="!bg-white !text-gray-900">
              <SuiviPaiement victim={currentVictim} />
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