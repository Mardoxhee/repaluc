import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, DollarSign, FileText, RefreshCw, User, MapPin, Calendar, Shield, Check, UserCircle, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { isOnline } from '@/app/utils/victimsCache';
import { savePendingVictimPhoto, getLatestVictimPhoto } from '@/app/utils/victimPhotosCache';
import { syncPendingVictimPhotos } from '@/app/utils/victimPhotosSyncService';

interface InfosVictimProps {
    victim: {
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
        prejudiceFinal?: string;
        indemnisation?: number;
        reparations?: string;
        comment?: string;
        commentaire?: string;
        avatar?: string;
        photo?: string | null;
        isDirect?: boolean;
        programme?: string;
        variablesSpecifiques?: {
            AGE?: string;
            CAMP?: string;
            LOCALITE?: string;
            "VICTIME OU PAS"?: string;
            "NUMÉRO DU MÉNAGE"?: string;
            "NUMÉRO BLOC DU MÉNAGE"?: string;
            [key: string]: string | undefined;
        };
    };
}

const InfosVictim: React.FC<InfosVictimProps> = ({ victim }) => {
    const {
        id,
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
        programme,
        status,
        dossier,
        prejudiceFinal,
        indemnisation,
        reparations,
        comment,
        commentaire,
        avatar,
        photo,
    } = victim;
    const { isDirect } = victim;

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const [localPhotoPreview, setLocalPhotoPreview] = useState<string | null>(null);
    const [savingPhoto, setSavingPhoto] = useState(false);

    const [showCamera, setShowCamera] = useState(false);
    const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('environment');
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

    const displayedPhoto = photo || avatar || localPhotoPreview;

    useEffect(() => {
        let cancelled = false;

        const loadLocalPhoto = async () => {
            try {
                const latest = await getLatestVictimPhoto(id);
                if (!cancelled && latest?.photoDataUrl) {
                    setLocalPhotoPreview(latest.photoDataUrl);
                }
            } catch {
                // ignore
            }
        };

        loadLocalPhoto();
        return () => {
            cancelled = true;
        };
    }, [id]);

    const stopCamera = useCallback(() => {
        if (cameraStream) {
            for (const track of cameraStream.getTracks()) {
                track.stop();
            }
        }
        setCameraStream(null);
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, [cameraStream]);

    const startCamera = useCallback(async (facingMode: 'user' | 'environment') => {
        if (!navigator?.mediaDevices?.getUserMedia) {
            throw new Error('Caméra non supportée sur cet appareil');
        }

        stopCamera();

        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: facingMode },
                width: { ideal: 1280 },
                height: { ideal: 720 },
            },
            audio: false,
        });

        setCameraStream(stream);
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            // iOS/Safari: play() trop tôt => écran noir. On attend loadedmetadata.
            await new Promise<void>((resolve) => {
                const video = videoRef.current;
                if (!video) {
                    resolve();
                    return;
                }

                const onLoaded = () => {
                    video.removeEventListener('loadedmetadata', onLoaded);
                    resolve();
                };
                video.addEventListener('loadedmetadata', onLoaded);

                // Fallback si l'événement n'arrive pas
                setTimeout(() => {
                    video.removeEventListener('loadedmetadata', onLoaded);
                    resolve();
                }, 1200);
            });

            try {
                await videoRef.current.play();
            } catch {
                // ignore
            }
        }
    }, [stopCamera]);

    useEffect(() => {
        if (!showCamera) return;

        let cancelled = false;

        const run = async () => {
            try {
                await startCamera(cameraFacingMode);
            } catch (e: any) {
                if (cancelled) return;
                setShowCamera(false);
                await Swal.fire({
                    icon: 'error',
                    title: 'Caméra indisponible',
                    text: e?.message || 'Impossible d\'accéder à la caméra',
                    confirmButtonColor: '#901c67'
                });
            }
        };

        run();

        return () => {
            cancelled = true;
            stopCamera();
            setCapturedPhoto(null);
        };
    }, [showCamera, cameraFacingMode, startCamera, stopCamera]);

    const handlePickPhoto = async () => {
        // Essayer la vraie caméra (preview + switch). Sinon fallback sur input file.
        if (navigator?.mediaDevices?.getUserMedia) {
            setCapturedPhoto(null);
            setShowCamera(true);
            return;
        }

        fileInputRef.current?.click();
    };

    const handleSwitchCamera = async () => {
        const next = cameraFacingMode === 'environment' ? 'user' : 'environment';
        setCameraFacingMode(next);
        setCapturedPhoto(null);
    };

    const handleCapture = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const width = video.videoWidth || 720;
        const height = video.videoHeight || 1280;

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedPhoto(dataUrl);
    };

    const handleRetake = () => {
        setCapturedPhoto(null);
    };

    const persistPhoto = useCallback(async (dataUrl: string) => {
        setSavingPhoto(true);
        try {
            setLocalPhotoPreview(dataUrl);
            await savePendingVictimPhoto(id, dataUrl);

            if (isOnline()) {
                await syncPendingVictimPhotos();
            }

            await Swal.fire({
                icon: 'success',
                title: 'Photo enregistrée',
                text: isOnline()
                    ? 'Photo enregistrée. Synchronisation en cours si nécessaire.'
                    : 'Photo enregistrée hors ligne. Elle sera envoyée à la reconnexion.',
                timer: 1800,
                showConfirmButton: false
            });
        } finally {
            setSavingPhoto(false);
        }
    }, [id]);

    const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onerror = () => reject(new Error('Impossible de lire le fichier'));
                reader.onload = () => resolve(String(reader.result));
                reader.readAsDataURL(file);
            });

            await persistPhoto(dataUrl);
        } catch (err: any) {
            await Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: err?.message || 'Impossible d\'enregistrer la photo',
                confirmButtonColor: '#901c67'
            });
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="bg-white text-gray-900 max-w-5xl mx-auto print:max-w-none relative">
            {/* Export PDF Button */}
            {/* <button
                onClick={handleExportPDF}
                className="absolute right-0 top-0 mt-4 mr-4 px-4 py-2 bg-pink-700 hover:bg-pink-800 text-white font-bold rounded shadow print:hidden z-20"
                type="button"
            >
                Exporter en PDF
            </button> */}
            {/* Header */}
            <div className="border-b-2 border-gray-800 pb-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-800 text-center tracking-wide">
                    FICHE INDIVIDUELLE DE VICTIME
                </h1>
                <p className="text-center text-gray-600 text-sm mt-1">
                    Document officiel - Confidentiel
                </p>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-12 gap-6">
                {/* Left Column - Photo & Key Info */}
                <div className="col-span-12 md:col-span-4">
                    <div className="border border-gray-300 p-4 mb-4">
                        {displayedPhoto ? (
                            <img
                                src={displayedPhoto}
                                alt="Photo d'identité"
                                className="w-32 h-32 object-cover border border-gray-400 mx-auto block rounded-lg"
                            />
                        ) : (
                            <div className="w-32 h-32 mx-auto flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-400 rounded-lg">
                                <UserCircle className="w-20 h-20 text-gray-400" />
                            </div>
                        )}
                        <p className="text-xs text-gray-500 text-center mt-2">Photo d'identité</p>

                        <div className="mt-3 flex justify-center">
                            <button
                                type="button"
                                onClick={handlePickPhoto}
                                disabled={savingPhoto}
                                className="flex items-center gap-2 px-3 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Camera size={16} />
                                {savingPhoto ? 'Enregistrement...' : 'Remplir la photo'}
                            </button>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handlePhotoSelected}
                            className="hidden"
                        />
                    </div>

                    {showCamera && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                            <div className="bg-white w-full max-w-md rounded-lg overflow-hidden shadow-xl">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-800">Photo de la victime</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowCamera(false)}
                                        className="p-2 rounded hover:bg-gray-100 text-gray-600"
                                        title="Fermer"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="p-4">
                                    <div className="w-full aspect-[3/4] bg-black rounded overflow-hidden relative">
                                        {capturedPhoto ? (
                                            <img src={capturedPhoto} alt="Capture" className="w-full h-full object-cover" />
                                        ) : (
                                            <video
                                                ref={videoRef}
                                                className="w-full h-full object-cover"
                                                playsInline
                                                muted
                                                autoPlay
                                                onLoadedMetadata={() => {
                                                    const v = videoRef.current;
                                                    if (!v) return;
                                                    v.play().catch(() => undefined);
                                                }}
                                            />
                                        )}
                                    </div>

                                    <canvas ref={canvasRef} className="hidden" />

                                    <div className="mt-4 flex items-center justify-between gap-2">
                                        <button
                                            type="button"
                                            onClick={handleSwitchCamera}
                                            disabled={savingPhoto}
                                            className="flex items-center gap-2 px-3 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                            title="Basculer caméra"
                                        >
                                            <RefreshCw size={16} />
                                            Switch
                                        </button>

                                        {!capturedPhoto ? (
                                            <button
                                                type="button"
                                                onClick={handleCapture}
                                                disabled={savingPhoto}
                                                className="flex-1 px-4 py-2 text-sm rounded text-white disabled:opacity-50"
                                                style={{ backgroundColor: '#901c67' }}
                                            >
                                                Capturer
                                            </button>
                                        ) : (
                                            <div className="flex-1 flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleRetake}
                                                    disabled={savingPhoto}
                                                    className="px-3 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                                >
                                                    Refaire
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        if (!capturedPhoto) return;
                                                        await persistPhoto(capturedPhoto);
                                                        setShowCamera(false);
                                                    }}
                                                    disabled={savingPhoto}
                                                    className="flex-1 px-4 py-2 text-sm rounded text-white disabled:opacity-50"
                                                    style={{ backgroundColor: '#901c67' }}
                                                >
                                                    Utiliser
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Status Badges */}
                    <div className="space-y-3 mb-6">
                        {/* Flag Victime Directe/Indirecte (badge discret) */}
                        <div className="border border-gray-300 p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="text-gray-600" size={14} />
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Type de victime</span>
                            </div>
                            <div className="bg-gray-100 border border-gray-300 px-3 py-2">
                                <span className="text-sm font-medium text-gray-800">{isDirect || "Non spécifié"}</span>
                            </div>
                        </div>
                        {/* {isDirect ?
                            <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-700 border border-green-300 mb-2">
                                {isDirect}
                            </span>
                            : null} */}
                        <div className="border border-gray-300 p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <User className="text-gray-600" size={14} />
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Catégorie</span>
                            </div>
                            <div className="bg-gray-100 border border-gray-300 px-3 py-2">
                                <span className="text-sm font-medium text-gray-800">{categorie || "Non spécifiée"}</span>
                            </div>
                        </div>

                        <div className="border border-gray-300 p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="text-gray-600" size={14} />
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Type de Violation</span>
                            </div>
                            <div className="bg-gray-100 border border-gray-300 px-3 py-2">
                                <span className="text-sm font-medium text-gray-800">{typeViolation || "Non spécifié"}</span>
                            </div>
                        </div>

                        <div className="border border-gray-300 p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="text-gray-600" size={14} />
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Programme</span>
                            </div>
                            <div className="bg-gray-100 border border-gray-300 px-3 py-2">
                                <span className="text-sm font-medium text-gray-800">{programme || "Non spécifiés"}</span>
                            </div>
                        </div>

                        <div className="border border-gray-300 p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="text-gray-600" size={14} />
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Statut</span>
                            </div>
                            <div className={`border px-3 py-2 ${!status || status === 'non confirmé'
                                ? 'bg-gray-200 border-gray-400 text-gray-700'
                                : 'bg-blue-600 border-blue-600 text-white'
                                }`}>
                                <span className="text-sm font-medium">{status && status !== '' ? status : 'Non confirmé'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Detailed Information */}
                <div className="col-span-12 md:col-span-8">
                    {/* Personal Information */}
                    <div className="mb-6">
                        <div className="bg-blue-600 text-white px-4 py-2 border-b">
                            <h2 className="font-bold text-sm uppercase tracking-wide">1. Informations Personnelles</h2>
                        </div>
                        <div className="border border-gray-300 border-t-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                                <div className="p-4 space-y-3">
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase flex-shrink-0">Nom :</span>
                                        <span className="text-sm text-gray-800 font-medium ml-2">{nom || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase flex-shrink-0">Âge :</span>
                                        <span className="text-sm text-gray-800 ml-2">{age || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase  flex-shrink-0">Sexe :</span>
                                        <span className="text-sm text-gray-800 ml-2">{sexe || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase  flex-shrink-0">Nationalité :</span>
                                        <span className="text-sm text-gray-800 ml-2">{nationalite || "-"}</span>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-32 flex-shrink-0">Date naissance :</span>
                                        <span className="text-sm text-gray-800 ml-2">{dateNaissance || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-32 flex-shrink-0">État civil :</span>
                                        <span className="text-sm text-gray-800">{etatMatrimonial || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-32 flex-shrink-0">Nom père :</span>
                                        <span className="text-sm text-gray-800">{nomPere || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-32 flex-shrink-0">Nom mère :</span>
                                        <span className="text-sm text-gray-800">{nomMere || "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Address Information */}
                    <div className="mb-6">
                        <div className="bg-blue-600 text-white px-4 py-2 border-b">
                            <h2 className="font-bold text-sm uppercase tracking-wide">2. Adresse de Résidence</h2>
                        </div>
                        <div className="border border-gray-300 border-t-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                                <div className="p-4 space-y-3">
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-24 flex-shrink-0">Adresse :</span>
                                        <span className="text-sm text-gray-800 ml-2">{adresse || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-24 flex-shrink-0">Commune :</span>
                                        <span className="text-sm text-gray-800 ml-2">{commune || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-24 flex-shrink-0">Province :</span>
                                        <span className="text-sm text-gray-800">{province || "-"}</span>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-28 flex-shrink-0">Territoire :</span>
                                        <span className="text-sm text-gray-800 ">{territoire || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-24 flex-shrink-0">Village :</span>
                                        <span className="text-sm text-gray-800 ml-2">{village || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase  flex-shrink-0">Groupement :</span>
                                        <span className="text-sm text-gray-800 ml-2">{groupement || "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Origin Information */}
                    <div className="mb-6">
                        <div className="bg-blue-600 text-white px-4 py-2 border-b">
                            <h2 className="font-bold text-sm uppercase tracking-wide">3. Lieu d'Origine</h2>
                        </div>
                        <div className="border border-gray-300 border-t-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                                <div className="p-4 space-y-2">
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-20 flex-shrink-0">Province :</span>
                                        <span className="text-sm text-gray-800 ml-2">{provinceOrigine || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-20 flex-shrink-0">Commune :</span>
                                        <span className="text-sm text-gray-800 ml-2">{communeOrigine || "-"}</span>
                                    </div>
                                </div>
                                <div className="p-4 space-y-2">
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase  flex-shrink-0">Territoire :</span>
                                        <span className="text-sm text-gray-800 ml-2">{territoireOrigine || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-20 flex-shrink-0">Village :</span>
                                        <span className="text-sm text-gray-800 ml-2">{villageOrigine || "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Camp Information */}
                    {victim.variablesSpecifiques && (
                        <div className="mb-6">
                            <div className="bg-blue-600 text-white px-4 py-2 border-b flex items-center">
                                <MapPin className="mr-2 h-4 w-4" />
                                <h2 className="font-bold text-sm uppercase tracking-wide">4. Informations du Camp</h2>
                            </div>
                            <div className="border border-gray-300 border-t-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                                    <div className="p-4 space-y-3">
                                        {victim.variablesSpecifiques.CAMP && (
                                            <div className="flex">
                                                <span className="text-sm font-semibold text-gray-600 uppercase w-32 flex-shrink-0">Camp :</span>
                                                <span className="text-sm text-gray-800">{victim.variablesSpecifiques.CAMP}</span>
                                            </div>
                                        )}
                                        {victim.variablesSpecifiques.LOCALITE && (
                                            <div className="flex">
                                                <span className="text-sm font-semibold text-gray-600 uppercase w-32 flex-shrink-0">Localité :</span>
                                                <span className="text-sm text-gray-800">{victim.variablesSpecifiques.LOCALITE}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 space-y-3">
                                        {victim.variablesSpecifiques["NUMÉRO DU MÉNAGE"] && (
                                            <div className="flex">
                                                <span className="text-sm font-semibold text-gray-600 uppercase w-32 flex-shrink-0">N° Ménage :</span>
                                                <span className="text-sm text-gray-800">{victim.variablesSpecifiques["NUMÉRO DU MÉNAGE"]}</span>
                                            </div>
                                        )}
                                        {victim.variablesSpecifiques["NUMÉRO BLOC DU MÉNAGE"] && (
                                            <div className="flex">
                                                <span className="text-sm font-semibold text-gray-600 uppercase w-32 flex-shrink-0">N° Bloc :</span>
                                                <span className="text-sm text-gray-800">{victim.variablesSpecifiques["NUMÉRO BLOC DU MÉNAGE"]}</span>
                                            </div>
                                        )}
                                        {victim.variablesSpecifiques.AGE && (
                                            <div className="flex">
                                                <span className="text-sm font-semibold text-gray-600 uppercase w-32 flex-shrink-0">Âge déclaré :</span>
                                                <span className="text-sm text-gray-800">{victim.variablesSpecifiques.AGE} ans</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Incident Information */}
                    <div className="mb-6">
                        <div className="bg-blue-600 text-white px-4 py-2 border-b">
                            <h2 className="font-bold text-sm uppercase tracking-wide">5. Détails de l'Incident</h2>
                        </div>
                        <div className="border border-gray-300 border-t-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                                <div className="p-4 space-y-3">
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-24 flex-shrink-0">Province :</span>
                                        <span className="text-sm text-gray-800 ml-2">{provinceIncident || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-24 flex-shrink-0">Commune :</span>
                                        <span className="text-sm text-gray-800 ml-2">{communeIncident || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-24 flex-shrink-0">Territoire :</span>
                                        <span className="text-sm text-gray-800 ml-2">{territoireIncident || "-"}</span>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-20 flex-shrink-0">Lieu :</span>
                                        <span className="text-sm text-gray-800 ml-2">{lieuIncident || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-20 flex-shrink-0">Date :</span>
                                        <span className="text-sm text-gray-800 ml-2">{dateIncident || "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Compensation & Final Damage */}
                    <div className="mb-6">
                        <div className="bg-blue-600 text-white px-4 py-2 border-b">
                            <h2 className="font-bold text-sm uppercase tracking-wide">5. Préjudice et Mésure de réparation</h2>
                        </div>
                        <div className="border border-gray-300 border-t-0 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="text-gray-600" size={14} />
                                        <span className="text-xs font-semibold text-gray-600 uppercase">Préjudice Final</span>
                                    </div>
                                    <div className="bg-gray-50 border border-gray-200 p-3">
                                        <span className="text-sm text-gray-800">{prejudiceFinal || "Aucun préjudice documenté"}</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <DollarSign className="text-gray-600" size={14} />
                                        <span className="text-xs font-semibold text-gray-600 uppercase">Indemnisation</span>
                                    </div>
                                    <div className="bg-gray-50 border border-gray-200 p-3">
                                        <span className="text-sm text-gray-800 font-mono">
                                            {indemnisation ? `${indemnisation} USD` : "Aucune indemnisation"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {reparations && (
                                <div className="mt-6">
                                    <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">Formes de réparations</h4>
                                    <ul className="divide-y divide-gray-100 bg-gray-50 border border-gray-200 rounded-lg">
                                        {reparations.split(',').map((item, idx) => (
                                            <li key={idx} className="flex items-center justify-between px-4 py-2">
                                                <span className="text-sm text-gray-800">{item.trim()}</span>
                                                {/* <Check size={18} className="text-green-600" /> */}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Comments */}
                    <div className="mb-6">
                        <div className="bg-blue-600 text-white px-4 py-2 border-b">
                            <h2 className="font-bold text-sm uppercase tracking-wide">6. Observations</h2>
                        </div>
                        <div className="border border-gray-300 border-t-0 p-4">
                            <div className="bg-gray-50 border border-gray-200 p-4 min-h-20">
                                <span className="text-sm text-gray-700 leading-relaxed">
                                    {comment || commentaire || "Aucune observation particulière pour ce dossier."}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-blue-600 pt-4 mt-8 text-center">
                <p className="text-xs text-gray-600">
                    Document généré le {new Date().toLocaleDateString('fr-FR')} - Référence: {dossier || 'N/A'}
                </p>
            </div>
        </div>
    );
};

export default InfosVictim;