import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  Info,
  FileText,
  Camera,
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
  RefreshCw,
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
import { isOnline } from '@/app/utils/victimsCache';
import { deletePendingVictimDocById, getPendingDocsForVictim, getPendingVictimDocById, savePendingVictimDoc } from '@/app/utils/victimDocsCache';

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
  onDeletePhoto?: (victim: Victim) => void;
  onViewEvaluation?: (victim: Victim) => void;
}

const VictimDetailModal: React.FC<VictimDetailModalProps> = ({ victim, onClose, onVictimUpdate, onDeletePhoto, onViewEvaluation }) => {
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
  const [pendingDocs, setPendingDocs] = useState<Array<{ id: number; label: string; name: string }>>([]);
  const [selectedFile, setSelectedFile] = useState<{ id: number; label: string; name: string; lien?: string } | null>(null);
  const [editFileIdx, setEditFileIdx] = useState<number | null>(null);
  const [editFileLabel, setEditFileLabel] = useState('');
  const [editFileName, setEditFileName] = useState('');
  const [addFileMode, setAddFileMode] = useState(false);
  const [docLabelPreset, setDocLabelPreset] = useState<'piece_identite' | 'autre'>('piece_identite');
  const [newFileLabel, setNewFileLabel] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const fileDocInputRef = useRef<HTMLInputElement | null>(null);

  const docVideoRef = useRef<HTMLVideoElement | null>(null);
  const docCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showDocCamera, setShowDocCamera] = useState(false);
  const [docFacingMode, setDocFacingMode] = useState<'user' | 'environment'>('environment');
  const [docStream, setDocStream] = useState<MediaStream | null>(null);
  const [docCapturedDataUrl, setDocCapturedDataUrl] = useState<string | null>(null);
  const [questions, setQuestions] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [showDocPreview, setShowDocPreview] = useState(false);
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [docPreviewTitle, setDocPreviewTitle] = useState<string>('Document');
  const [docPreviewIsObjectUrl, setDocPreviewIsObjectUrl] = useState(false);

  useEffect(() => {
    setCurrentVictim(victim);
  }, [victim]);

  const stopDocStream = (s: MediaStream | null) => {
    if (!s) return;
    for (const track of s.getTracks()) track.stop();
  };

  const startDocCamera = async () => {
    if (typeof window === 'undefined') return;
    if (!window.isSecureContext) {
      throw new Error('La caméra nécessite HTTPS (ou localhost).');
    }
    if (!navigator?.mediaDevices?.getUserMedia) {
      throw new Error('Ce navigateur ne supporte pas l\'accès caméra.');
    }

    stopDocStream(docStream);
    setDocStream(null);

    const constraints: MediaStreamConstraints = {
      video: { facingMode: docFacingMode },
      audio: false,
    };

    const nextStream = await navigator.mediaDevices.getUserMedia(constraints);
    setDocStream(nextStream);

    const video = docVideoRef.current;
    if (video) {
      video.srcObject = nextStream;

      await new Promise<void>((resolve) => {
        const onLoaded = () => {
          video.removeEventListener('loadedmetadata', onLoaded);
          resolve();
        };
        video.addEventListener('loadedmetadata', onLoaded);
        setTimeout(() => {
          video.removeEventListener('loadedmetadata', onLoaded);
          resolve();
        }, 1200);
      });

      await video.play().catch(() => undefined);
    }
  };

  useEffect(() => {
    if (!showDocCamera) return;
    let cancelled = false;

    const run = async () => {
      try {
        await startDocCamera();
      } catch (e: any) {
        if (cancelled) return;
        setShowDocCamera(false);
        await Swal.fire({
          icon: 'error',
          title: 'Caméra indisponible',
          text: e?.message || 'Impossible d\'accéder à la caméra',
        });
      }
    };

    run();

    return () => {
      cancelled = true;
      stopDocStream(docStream);
      setDocStream(null);
      setDocCapturedDataUrl(null);
      if (docVideoRef.current) docVideoRef.current.srcObject = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDocCamera, docFacingMode]);

  const captureDoc = async () => {
    const video = docVideoRef.current;
    const canvas = docCanvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setDocCapturedDataUrl(dataUrl);
  };

  const useCapturedDoc = async () => {
    if (!docCapturedDataUrl) return;
    const res = await fetch(docCapturedDataUrl);
    const blob = await res.blob();
    const ext = blob.type === 'image/jpeg' ? 'jpg' : 'png';
    const file = new File([blob], `document_${currentVictim.id}_${Date.now()}.${ext}`, { type: blob.type || 'image/jpeg' });
    setNewFileFile(file);
    setShowDocCamera(false);
  };

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

        const hasPieceIdentite = Array.isArray(documents)
          ? documents.some((d: any) => {
            const label = typeof d?.label === 'string' ? d.label.trim().toLowerCase() : '';
            return label === "pièce d'identité" || label === "piece d'identite";
          })
          : false;

        const nextVictim: any = {
          ...currentVictim,
          progression: {
            ...(currentVictim as any)?.progression,
            hasPieceIdentite,
          },
        };

        setCurrentVictim(nextVictim);
        onVictimUpdate?.(nextVictim);
      } catch (e) {
        console.log('Erreur lors du chargement des documents:', e);
        setFiles([]);
      } finally {
        setLoadingFiles(false);
      }
    };

    fetchDocs();
  }, [currentVictim?.id]);

  const reloadServerDocs = async (victimId: number) => {
    setLoadingFiles(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006';
      const res = await fetch(`${baseUrl}/victime/document/${victimId}`);
      if (!res.ok) {
        setFiles([]);
        return;
      }
      const data = await res.json();
      const documents = data?.documentVictime || [];
      const mappedFiles = documents.map((doc: any) => ({
        id: doc.id,
        label: doc.label,
        name: doc.lien,
        lien: doc.lien,
      }));
      setFiles(mappedFiles);

      const hasPieceIdentite = Array.isArray(documents)
        ? documents.some((d: any) => {
          const label = typeof d?.label === 'string' ? d.label.trim().toLowerCase() : '';
          return label === "pièce d'identité" || label === "piece d'identite";
        })
        : false;

      if (currentVictim) {
        const nextVictim: any = {
          ...currentVictim,
          progression: {
            ...(currentVictim as any)?.progression,
            hasPieceIdentite,
          },
        };
        setCurrentVictim(nextVictim);
        onVictimUpdate?.(nextVictim);
      }
    } catch (e) {
      console.log('Erreur lors du rechargement des documents:', e);
      setFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  // Charger les documents en attente (offline) depuis IndexedDB
  React.useEffect(() => {
    if (!currentVictim?.id) return;
    let cancelled = false;

    const loadPending = async () => {
      try {
        const pending = await getPendingDocsForVictim(currentVictim.id);
        if (cancelled) return;
        setPendingDocs(
          pending
            .filter((d) => !d.synced)
            .map((d) => ({ id: d.id || 0, label: d.label, name: d.fileName }))
            .filter((d) => d.id)
        );
      } catch {
        if (!cancelled) setPendingDocs([]);
      }
    };

    loadPending();
    return () => {
      cancelled = true;
    };
  }, [currentVictim?.id, tab]);

  // Fonction pour ouvrir un fichier
  const handleOpenFile = async (file: { id: number; label: string; name?: string; lien?: string }) => {
    // Doc en attente (offline)
    if (!file.lien && typeof file.id === 'number') {
      try {
        const pending = await getPendingVictimDocById(file.id);
        if (!pending?.fileData) throw new Error('Document local introuvable');
        const url = URL.createObjectURL(pending.fileData);
        setDocPreviewTitle(file.label || 'Document');
        setDocPreviewUrl(url);
        setDocPreviewIsObjectUrl(true);
        setShowDocPreview(true);
        return;
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible d\'ouvrir le document local',
        });
        return;
      }
    }

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
      setDocPreviewTitle(file.label || 'Document');
      setDocPreviewUrl(fileUrl);
      setDocPreviewIsObjectUrl(false);
      setShowDocPreview(true);
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible d\'ouvrir le fichier'
      });
    }
  };

  useEffect(() => {
    if (!showDocPreview) return;
    return () => {
      if (docPreviewIsObjectUrl && docPreviewUrl) {
        URL.revokeObjectURL(docPreviewUrl);
      }
    };
  }, [showDocPreview, docPreviewIsObjectUrl, docPreviewUrl]);

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
              <InfosVictim
                victim={currentVictim}
                onDeletePhoto={() => {
                  if (!currentVictim) return;
                  onDeletePhoto?.(currentVictim);
                  setCurrentVictim({ ...currentVictim, photo: null });
                }}
              />

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
                {pendingDocs.map((doc) => (
                  <div
                    key={`pending-${doc.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenFile({ id: doc.id, label: doc.label, name: doc.name })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleOpenFile({ id: doc.id, label: doc.label, name: doc.name });
                    }}
                    className="w-full text-left flex items-center justify-between p-3 !bg-yellow-50 rounded-lg !border !border-yellow-200 hover:!bg-yellow-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="!text-yellow-700" size={16} />
                      <div>
                        <div className="text-sm font-medium !text-gray-700">{doc.label} <span className="text-xs !text-yellow-800">(en attente)</span></div>
                        <div className="text-xs !text-gray-600">{doc.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFile({ id: doc.id, label: doc.label, name: doc.name });
                        }}
                        className="px-2 py-1 !bg-yellow-100 !text-yellow-800 text-sm rounded hover:!bg-yellow-200 flex items-center gap-1"
                        title="Voir le document"
                      >
                        <Eye size={16} className="text-yellow-800" />
                      </button>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const confirm = await Swal.fire({
                            icon: 'warning',
                            title: 'Supprimer ce document ?',
                            text: 'Ce document est en attente de synchronisation.',
                            showCancelButton: true,
                            confirmButtonText: 'Supprimer',
                            cancelButtonText: 'Annuler',
                            confirmButtonColor: '#dc2626',
                          });
                          if (!confirm.isConfirmed) return;
                          try {
                            await deletePendingVictimDocById(doc.id);
                            setPendingDocs((prev) => prev.filter((x) => x.id !== doc.id));
                          } catch (err) {
                            await Swal.fire({
                              icon: 'error',
                              title: 'Suppression impossible',
                              text: 'Impossible de supprimer le document en attente.',
                              confirmButtonColor: '#901c67',
                            });
                          }
                        }}
                        className="px-2 py-1 !bg-red-50 !text-red-600 text-sm rounded hover:!bg-red-100 flex items-center gap-1"
                        title="Supprimer le document"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {files.map((file, idx) => (
                  <div
                    key={file.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenFile(file)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleOpenFile(file);
                    }}
                    className="flex items-center justify-between p-3 !bg-gray-50 rounded-lg !border !border-gray-200 hover:!bg-gray-100 transition-colors cursor-pointer"
                  >
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditFileIdx(idx);
                              setEditFileLabel(file.label);
                              setEditFileName(file.name || '');
                            }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="px-2 py-1 !bg-red-50 !text-red-600 text-sm rounded hover:!bg-red-100 flex items-center gap-1"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const confirm = await Swal.fire({
                                icon: 'warning',
                                title: 'Supprimer ce document ?',
                                showCancelButton: true,
                                confirmButtonText: 'Supprimer',
                                cancelButtonText: 'Annuler',
                                confirmButtonColor: '#dc2626',
                              });
                              if (!confirm.isConfirmed) return;
                              if (!isOnline()) {
                                await Swal.fire({
                                  icon: 'warning',
                                  title: 'Hors ligne',
                                  text: 'Suppression impossible hors ligne.',
                                  confirmButtonColor: '#901c67',
                                });
                                return;
                              }

                              try {
                                const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006';
                                const resp = await fetch(`${baseUrl}/document-victime/${file.id}`, {
                                  method: 'DELETE',
                                });
                                if (!resp.ok) {
                                  throw new Error(`DELETE document-victime failed: ${resp.status}`);
                                }

                                if (currentVictim?.id) {
                                  await reloadServerDocs(currentVictim.id);
                                } else {
                                  setFiles((prev) => prev.filter((_, i) => i !== idx));
                                }
                              } catch (err) {
                                console.log('Erreur suppression document:', err);
                                await Swal.fire({
                                  icon: 'error',
                                  title: 'Suppression échouée',
                                  text: 'Impossible de supprimer le document.',
                                  confirmButtonColor: '#901c67',
                                });
                              }
                            }}
                          >
                            <Trash size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenFile(file);
                            }}
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

              <Modal show={showDocPreview} onClose={() => setShowDocPreview(false)} size="3xl">
                <div className="p-4 !bg-white !text-gray-900">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="text-sm font-semibold !text-gray-800 truncate">{docPreviewTitle}</div>
                    <button
                      type="button"
                      onClick={() => setShowDocPreview(false)}
                      className="p-2 rounded hover:!bg-gray-100 !text-gray-600"
                      title="Fermer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="w-full h-[70vh] border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    {docPreviewUrl ? (
                      docPreviewUrl.includes('data:image') || docPreviewUrl.match(/\.(png|jpe?g|webp)$/i) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={docPreviewUrl} alt={docPreviewTitle} className="w-full h-full object-contain" />
                      ) : (
                        <iframe src={docPreviewUrl} className="w-full h-full" title={docPreviewTitle} />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
                        Chargement...
                      </div>
                    )}
                  </div>
                </div>
              </Modal>

              {addFileMode ? (
                <form
                  className="flex items-center gap-2 p-3 !bg-gray-50 rounded-lg !border !border-gray-200"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newFileLabel || !newFileFile || !currentVictim.id) return;

                    setUploadingFile(true);
                    try {
                      // Offline: stocker localement dans IndexedDB
                      if (!isOnline()) {
                        const idbId = await savePendingVictimDoc({
                          victimId: currentVictim.id,
                          label: newFileLabel,
                          file: newFileFile,
                        });

                        setPendingDocs((prev) => [
                          { id: idbId, label: newFileLabel, name: newFileFile.name },
                          ...prev,
                        ]);

                        await Swal.fire({
                          icon: 'success',
                          title: 'Document enregistré',
                          text: 'Document enregistré hors ligne. Il sera synchronisé à la reconnexion.',
                          timer: 1500,
                          showConfirmButton: false
                        });

                        setNewFileLabel('');
                        setNewFileFile(null);
                        setAddFileMode(false);
                        return;
                      }

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
                    type="hidden"
                    value={newFileLabel}
                    readOnly
                  />

                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-2">
                      <select
                        className="!border !border-gray-300 px-2 py-1 rounded text-sm !bg-white !text-gray-900"
                        value={docLabelPreset}
                        onChange={(e) => {
                          const v = e.target.value as any;
                          setDocLabelPreset(v);
                          if (v === 'piece_identite') {
                            setNewFileLabel("Pièce d'identité");
                          } else {
                            setNewFileLabel('');
                          }
                        }}
                        disabled={uploadingFile}
                      >
                        <option value="piece_identite">Pièce d'identité</option>
                        <option value="autre">Autre</option>
                      </select>

                      {docLabelPreset === 'autre' && (
                        <input
                          className="!border !border-gray-300 px-2 py-1 rounded text-sm flex-1 !bg-white !text-gray-900"
                          value={newFileLabel}
                          onChange={e => setNewFileLabel(e.target.value)}
                          placeholder="Label du fichier"
                          required
                          disabled={uploadingFile}
                        />
                      )}
                    </div>

                    {docLabelPreset === 'piece_identite' && (
                      <div className="text-xs !text-gray-500">Label: Pièce d'identité</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <button
                      type="button"
                      className="px-3 py-1 !bg-purple-600 !text-white text-sm rounded hover:!bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => {
                        setDocCapturedDataUrl(null);
                        setShowDocCamera(true);
                      }}
                      disabled={uploadingFile}
                      title="Capturer un document"
                    >
                      <Camera size={14} className="inline-block mr-1" />
                      Capturer
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1 !bg-gray-200 !text-gray-800 text-sm rounded hover:!bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => fileDocInputRef.current?.click()}
                      disabled={uploadingFile}
                      title="Choisir un fichier"
                    >
                      Choisir
                    </button>
                    <div className="text-xs !text-gray-500 truncate flex-1">
                      {newFileFile?.name || 'Aucun fichier'}
                    </div>
                  </div>
                  <input
                    ref={fileDocInputRef}
                    type="file"
                    className="hidden"
                    onChange={e => setNewFileFile(e.target.files?.[0] || null)}
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
                  onClick={() => {
                    setDocLabelPreset('piece_identite');
                    setNewFileLabel("Pièce d'identité");
                    setAddFileMode(true);
                  }}
                >
                  <Plus size={16} />
                  Ajouter un fichier
                </button>
              )}
            </div>
          )}

          {showDocCamera && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <div className="bg-white w-full max-w-md rounded-lg overflow-hidden shadow-xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-800">Caméra (document)</h3>
                  <button
                    type="button"
                    onClick={() => setShowDocCamera(false)}
                    className="p-2 rounded hover:bg-gray-100 text-gray-600"
                    title="Fermer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-4">
                  <div className="w-full h-[420px] bg-black rounded overflow-hidden relative">
                    {docCapturedDataUrl ? (
                      <img src={docCapturedDataUrl} alt="Capture" className="w-full h-full object-cover" />
                    ) : (
                      <video
                        ref={docVideoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                        autoPlay
                      />
                    )}
                  </div>

                  <canvas ref={docCanvasRef} className="hidden" />

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDocCapturedDataUrl(null);
                        setDocFacingMode((f) => (f === 'user' ? 'environment' : 'user'));
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      title="Basculer caméra"
                    >
                      <RefreshCw size={16} />
                      Switch
                    </button>

                    {!docCapturedDataUrl ? (
                      <button
                        type="button"
                        onClick={captureDoc}
                        disabled={!docStream}
                        className="flex-1 px-4 py-2 text-sm rounded text-white disabled:opacity-50"
                        style={{ backgroundColor: '#901c67' }}
                      >
                        Capturer
                      </button>
                    ) : (
                      <div className="flex-1 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDocCapturedDataUrl(null)}
                          className="px-3 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Refaire
                        </button>
                        <button
                          type="button"
                          onClick={useCapturedDoc}
                          className="flex-1 px-4 py-2 text-sm rounded text-white"
                          style={{ backgroundColor: '#901c67' }}
                        >
                          Utiliser
                        </button>
                      </div>
                    )}
                  </div>

                  {!docStream && !docCapturedDataUrl && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Démarrage caméra...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'progression' && (
            <div className="!bg-white !text-gray-900">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-lg font-semibold !text-gray-900">Progression du dossier</h3>
                  <div className="text-sm !text-gray-600">Suivi administratif des étapes clés</div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50">
                  <BarChart2 className="!text-gray-500" size={18} />
                  <span className="text-xs font-semibold !text-gray-600 uppercase tracking-wide">Avancement</span>
                </div>
              </div>

              {(() => {
                const step1 = typeof currentVictim?.photo === 'string'
                  ? currentVictim.photo.trim().length > 0
                  : false;
                const step2 = !!hasContrat;
                const step3 = false;
                const step4 = false;
                const step5 = false;
                const steps = [step1, step2, step3, step4, step5];
                const doneCount = steps.filter(Boolean).length;
                const totalCount = steps.length;

                return (
                  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold !text-gray-900">Synthèse</div>
                          <div className="text-xs !text-gray-600">{doneCount} / {totalCount} étapes validées</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {steps.map((ok, i) => (
                            <span
                              key={i}
                              className={`h-3 w-3 border ${ok ? 'bg-blue-600 border-blue-600' : 'bg-gray-200 border-gray-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-gray-200 bg-white">
                          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                            <div className="text-sm font-semibold !text-gray-900">Étapes</div>
                          </div>
                          <div className="divide-y divide-gray-200">
                            {[{
                              idx: 1,
                              label: 'A été recontacté',
                              ok: step1,
                              hint: 'Photo enregistrée'
                            }, {
                              idx: 2,
                              label: 'A signé le contrat',
                              ok: step2,
                              hint: 'Contrat disponible'
                            }, {
                              idx: 3,
                              label: 'A débuté l\'indemnisation',
                              ok: step3,
                              hint: 'À renseigner'
                            }, {
                              idx: 4,
                              label: 'Étape 4',
                              ok: step4,
                              hint: 'À définir'
                            }, {
                              idx: 5,
                              label: 'Étape 5',
                              ok: step5,
                              hint: 'À définir'
                            }].map((s) => (
                              <div key={s.idx} className="px-4 py-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <span className={`h-3 w-3 border ${s.ok ? 'bg-blue-600 border-blue-600' : 'bg-gray-200 border-gray-300'}`} />
                                  <div>
                                    <div className="text-sm font-medium !text-gray-900">{s.idx}. {s.label}</div>
                                    <div className="text-xs !text-gray-500">{s.hint}</div>
                                  </div>
                                </div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${s.ok ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                  {s.ok ? 'Validé' : 'En attente'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white">
                          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                            <div className="text-sm font-semibold !text-gray-900">Contrôles</div>
                          </div>
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm !text-gray-700">Photo (recontact)</div>
                              <span className={`text-xs font-semibold px-2 py-1 rounded border ${step1 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                {step1 ? 'Présente' : 'Absente'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm !text-gray-700">Contrat</div>
                              <span className={`text-xs font-semibold px-2 py-1 rounded border ${step2 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                {step2 ? 'Disponible' : 'Non disponible'}
                              </span>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                              <div className="text-xs font-semibold !text-gray-700 mb-1 uppercase tracking-wide">Note</div>
                              <div className="text-xs !text-gray-600">
                                Les étapes 3 à 5 sont réservées pour la suite (logique à intégrer).
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
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