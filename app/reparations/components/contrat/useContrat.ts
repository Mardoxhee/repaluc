'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { isOnline } from '../../../utils/victimsCache';
import { savePendingContract, getAllPendingContracts, deletePendingContract, PendingContract } from '../../../utils/contractsCache';
import { Victim, Tranche, Contrat, Consentements, Representant, SaveMessage } from './types';

// Tranches par type de préjudice
const TRANCHES_PERTE_VIE: Tranche[] = [
    { id: '1', periode: 'Nov 2025', montant: '450' },
    { id: '2', periode: 'Janv 2026', montant: '450' },
    { id: '3', periode: 'Mars 2026', montant: '450' },
    { id: '4', periode: 'Mai 2026', montant: '450' },
    { id: '5', periode: 'Juil 2026', montant: '450' },
    { id: '6', periode: 'Sept 2026', montant: '450' },
    { id: '7', periode: 'Nov 2026', montant: '450' },
    { id: '8', periode: 'Déc 2026', montant: '390' }
]; // Total: 4320 USD

const TRANCHES_PREJUDICE_CORPOREL: Tranche[] = [
    { id: '1', periode: 'Nov 2025', montant: '400' },
    { id: '2', periode: 'Janv 2026', montant: '400' },
    { id: '3', periode: 'Mars 2026', montant: '400' },
    { id: '4', periode: 'Mai 2026', montant: '400' },
    { id: '5', periode: 'Juil 2026', montant: '400' },
    { id: '6', periode: 'Sept 2026', montant: '400' },
    { id: '7', periode: 'Nov 2026', montant: '400' },
    { id: '8', periode: 'Déc 2026', montant: '400' },
    { id: '9', periode: 'Fév 2027', montant: '400' }
]; // Total: 3600 USD

const TRANCHES_PERTE_ECONOMIQUE: Tranche[] = [
    { id: '1', periode: 'Nov 2025', montant: '250' },
    { id: '2', periode: 'Janv 2026', montant: '250' },
    { id: '3', periode: 'Mars 2026', montant: '250' },
    { id: '4', periode: 'Mai 2026', montant: '250' }
]; // Total: 1000 USD

// Fonction pour obtenir les tranches par défaut selon le préjudice
function getDefaultTranches(prejudiceFinal?: string): Tranche[] {
    if (!prejudiceFinal) return TRANCHES_PERTE_VIE;

    const prejudiceLower = prejudiceFinal.toLowerCase();

    if (prejudiceLower.includes('perte de vie') || prejudiceLower.includes('décès')) {
        return TRANCHES_PERTE_VIE;
    }

    if (prejudiceLower.includes('corporel') || prejudiceLower.includes('physique')) {
        return TRANCHES_PREJUDICE_CORPOREL;
    }

    if (prejudiceLower.includes('économique') || prejudiceLower.includes('economique') || prejudiceLower.includes('perte économique')) {
        return TRANCHES_PERTE_ECONOMIQUE;
    }

    // Par défaut: Perte de vie
    return TRANCHES_PERTE_VIE;
}

const DEFAULT_CONSENTEMENTS: Consentements = {
    faireMediateur: false,
    avocat: false,
    exerceDroit: false,
    comprisDroit: false,
    accepteReparation: false,
    refuseReparation: false,
    evaluationJointe: false,
    signataire: false
};

const DEFAULT_REPRESENTANT: Representant = {
    nom: '',
    qualite: '',
    organisation: '',
    pieceIdentite: ''
};

export function useContrat(victim: Victim) {
    const [tranches, setTranches] = useState<Tranche[]>(() => getDefaultTranches(victim.prejudiceFinal));
    const [consentements, setConsentements] = useState<Consentements>(DEFAULT_CONSENTEMENTS);
    const [representant, setRepresentant] = useState<Representant>(DEFAULT_REPRESENTANT);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<SaveMessage | null>(null);
    const [existingContrat, setExistingContrat] = useState<Contrat | null>(null);
    const [loadingContrat, setLoadingContrat] = useState(true);
    const [signatureUrl, setSignatureUrl] = useState<string>('');
    const [showContratDetail, setShowContratDetail] = useState(false);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [pendingOfflineContrat, setPendingOfflineContrat] = useState<PendingContract | null>(null);

    const formattedSignatureDate = existingContrat
        ? new Date(existingContrat.dateSignature).toLocaleDateString('fr-FR')
        : '';

    const totalMontant = tranches.reduce((sum, t) => sum + (parseFloat(t.montant) || 0), 0);

    // Initialiser le canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = '#1e40af';
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.globalAlpha = 0.85;
            }
        }
    }, [showSignatureModal]);

    // Charger le contrat existant
    useEffect(() => {
        const fetchContrat = async () => {
            try {
                setLoadingContrat(true);
                const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006';
                const response = await fetch(`${baseUrl}/contrat/${victim.id}`);

                if (response.ok) {
                    const data = await response.json();
                    setExistingContrat(data);

                    if (data.planIndemnisation && data.planIndemnisation.length > 0) {
                        setTranches(data.planIndemnisation.map((p: any, index: number) => ({
                            id: String(index + 1),
                            periode: p.periode,
                            montant: String(p.montantUSD)
                        })));
                    }

                    setConsentements({
                        faireMediateur: data.droitAccompagnement || false,
                        avocat: data.avocatAccompagnement || false,
                        exerceDroit: false,
                        comprisDroit: false,
                        accepteReparation: data.accepteReparation || false,
                        refuseReparation: false,
                        evaluationJointe: false,
                        signataire: false
                    });

                    setRepresentant({
                        nom: '',
                        qualite: data.qualiteRepresentant || '',
                        organisation: data.organisationAccompagnement || '',
                        pieceIdentite: data.pieceIdentiteRepresentant || ''
                    });

                    if (data.signature && data.signature !== 'SIG_ELEC') {
                        const signUrl = `${baseUrl}/minio/files/${data.signature}`;
                        const signResp = await fetch(signUrl);
                        if (signResp.ok) {
                            const signData = await signResp.json();
                            if (signData?.data?.src) {
                                setSignatureUrl(signData.data.src);
                            }
                        }
                    }
                }
            } catch (error) {
                console.log('Erreur lors du chargement du contrat:', error);
            } finally {
                setLoadingContrat(false);
            }
        };

        fetchContrat();
    }, [victim.id]);

    // Vérifier s'il y a un contrat en attente offline pour cette victime
    useEffect(() => {
        const checkPendingOffline = async () => {
            try {
                const pending = await getAllPendingContracts();
                const victimPending = pending.find(p => p.victimId === victim.id);
                setPendingOfflineContrat(victimPending || null);
            } catch (error) {
                console.log('Erreur lors de la vérification des contrats offline:', error);
            }
        };

        checkPendingOffline();

        // Revérifier périodiquement (au cas où la synchro a eu lieu)
        const interval = setInterval(checkPendingOffline, 5000);
        return () => clearInterval(interval);
    }, [victim.id]);

    const uploadSignature = async (dataUrl: string): Promise<string> => {
        const uploadEndpoint = process.env.NEXT_PUBLIC_UPLOAD_ENDPOINT || 'https://360.fonasite.app:5521/minio/files/upload';

        const res = await fetch(dataUrl);
        const blob = await res.blob();

        const file = new File([blob], `signature_${victim.id}_${Date.now()}.png`, { type: 'image/png' });
        const formData = new FormData();
        formData.append('file', file);

        const resp = await fetch(uploadEndpoint, {
            method: 'POST',
            body: formData,
        });

        if (!resp.ok) {
            throw new Error(`Failed to upload signature: ${resp.statusText}`);
        }

        const data = await resp.json();
        console.log('Signature uploaded:', data);
        return data.url || data.link || '';
    };

    const syncPendingContracts = useCallback(async () => {
        if (!isOnline()) return;

        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006';
            const pending: PendingContract[] = await getAllPendingContracts();

            for (const item of pending) {
                try {
                    let finalSignature = item.contractData.signature || 'SIG_ELEC';

                    if (item.signatureDataUrl) {
                        finalSignature = await uploadSignature(item.signatureDataUrl);
                    }

                    const payload = {
                        ...item.contractData,
                        signature: finalSignature,
                    };

                    const resp = await fetch(`${baseUrl}/contrat`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload),
                    });

                    if (!resp.ok) {
                        console.log('[ContractsSync] Erreur API, on garde le contrat en attente');
                        continue;
                    }

                    await deletePendingContract(item.id as number);
                    console.log('[ContractsSync] Contrat synchronisé pour victime', item.victimId);
                } catch (err) {
                    console.log('[ContractsSync] Erreur lors de la synchro d\'un contrat:', err);
                }
            }
        } catch (err) {
            console.log('[ContractsSync] Erreur globale de synchro:', err);
        }
    }, []);

    // Synchroniser les contrats en attente quand on revient en ligne
    useEffect(() => {
        const handleOnline = () => {
            console.log('[ContractsSync] Retour en ligne détecté, tentative de synchronisation des contrats');
            syncPendingContracts();
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [syncPendingContracts]);

    // Fonctions de dessin
    const getCoordinates = (
        e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
        canvas: HTMLCanvasElement
    ) => {
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e) {
            const touch = e.touches[0];
            return {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
        }
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;

        const coords = getCoordinates(e, canvas);
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(coords.x, coords.y);
            setIsDrawing(true);
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const coords = getCoordinates(e, canvas);
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.lineTo(coords.x, coords.y);
            ctx.stroke();
        }
    };

    const stopDrawing = () => setIsDrawing(false);

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    // Gestion des tranches
    const addTranche = () => {
        const newId = (Math.max(...tranches.map(t => parseInt(t.id)), 0) + 1).toString();
        setTranches([...tranches, { id: newId, periode: '', montant: '' }]);
    };

    const removeTranche = (id: string) => {
        setTranches(tranches.filter(t => t.id !== id));
    };

    const updateTranche = (id: string, field: 'periode' | 'montant', value: string) => {
        setTranches(tranches.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    // Sauvegarde du contrat
    const saveContract = async () => {
        setIsSaving(true);
        setSaveMessage(null);

        try {
            const canvas = canvasRef.current;
            let signatureDataUrl: string | null = null;

            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const hasSignature = imageData.data.some((pixel, i) => i % 4 === 3 && pixel > 0);

                    if (hasSignature) {
                        signatureDataUrl = canvas.toDataURL('image/png');
                    }
                }
            }

            const contractData = {
                typeContrat: 'Réparation Administrative',
                reparationAdministrative: victim.typeViolation || 'Indemnisation financière',
                reparationJudiciaire: 'En attente de décision',
                typePrejudiceReconnu: victim.prejudicesSubis || 'Perte de vie',
                montantTotalUSD: totalMontant,
                droitAccompagnement: consentements.faireMediateur,
                avocatAccompagnement: consentements.avocat,
                organisationAccompagnement: representant.organisation || 'AVRECOP',
                incapableConsentir: representant.nom ? true : false,
                qualiteRepresentant: representant.qualite || null,
                pieceIdentiteRepresentant: representant.pieceIdentite || null,
                accepteReparation: consentements.accepteReparation,
                dateSignature: new Date().toISOString(),
                signature: 'SIG_ELEC',
                lieuSignature: `${victim.territoire || ''}, ${victim.province || ''}`.trim() || 'Goma',
                victimeId: victim.id,
                planIndemnisation: tranches.map(t => ({
                    periode: t.periode,
                    montantUSD: parseFloat(t.montant) || 0,
                    statut: 'Planifier'
                }))
            };

            await savePendingContract({
                victimId: victim.id,
                contractData,
                signatureDataUrl,
            });

            await syncPendingContracts();

            setSaveMessage({ type: 'success', text: 'Contrat enregistré (hors ligne si nécessaire). La synchronisation se fera automatiquement.' });
            setTimeout(() => setSaveMessage(null), 3000);
        } catch (error) {
            console.log('Erreur:', error);
            setSaveMessage({ type: 'error', text: 'Erreur lors de la sauvegarde du contrat' });
        } finally {
            setIsSaving(false);
        }
    };

    // Export PDF
    const exportToPDF = async () => {
        const element = document.getElementById('contrat-content');
        if (!element) return;

        const { jsPDF } = await import('jspdf');
        const html2canvas = (await import('html2canvas')).default;

        const buttons = element.querySelectorAll('.no-print');
        buttons.forEach(btn => (btn as HTMLElement).style.display = 'none');

        try {
            const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                logging: false,
                allowTaint: true,
                backgroundColor: '#ffffff',
                windowWidth: 1200,
                imageTimeout: 0
            });

            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            const marginLeft = 15;
            const marginTop = 20;
            const marginRight = 15;
            const marginBottom = 20;

            const pdfWidth = 210;
            const pdfHeight = 297;

            const contentWidth = pdfWidth - marginLeft - marginRight;
            const contentHeight = pdfHeight - marginTop - marginBottom;

            const imgWidth = contentWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let yOffset = 0;
            let pageNumber = 0;

            while (yOffset < imgHeight) {
                if (pageNumber > 0) {
                    pdf.addPage();
                }

                const sourceY = (yOffset * canvas.width) / imgWidth;
                const sourceHeight = Math.min((contentHeight * canvas.width) / imgWidth, canvas.height - sourceY);

                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = canvas.width;
                pageCanvas.height = sourceHeight;

                const ctx = pageCanvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
                    ctx.drawImage(
                        canvas,
                        0, sourceY,
                        canvas.width, sourceHeight,
                        0, 0,
                        canvas.width, sourceHeight
                    );

                    const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
                    const pageImgHeight = (sourceHeight * imgWidth) / canvas.width;

                    pdf.addImage(pageImgData, 'PNG', marginLeft, marginTop, imgWidth, pageImgHeight, undefined, 'FAST');
                }

                yOffset += contentHeight;
                pageNumber++;
            }

            pdf.save(`Contrat_${victim.nom || 'Victime'}_${new Date().toISOString().split('T')[0]}.pdf`);
        } finally {
            buttons.forEach(btn => (btn as HTMLElement).style.display = '');
        }
    };

    return {
        // State
        tranches,
        consentements,
        representant,
        canvasRef,
        isSaving,
        saveMessage,
        existingContrat,
        loadingContrat,
        signatureUrl,
        showContratDetail,
        showSignatureModal,
        formattedSignatureDate,
        totalMontant,
        pendingOfflineContrat,

        // Setters
        setConsentements,
        setRepresentant,
        setShowContratDetail,
        setShowSignatureModal,

        // Actions
        startDrawing,
        draw,
        stopDrawing,
        clearSignature,
        addTranche,
        removeTranche,
        updateTranche,
        saveContract,
        exportToPDF,
    };
}
