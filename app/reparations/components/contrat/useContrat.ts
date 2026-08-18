'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { isOnline } from '../../../utils/victimsCache';
import { savePendingContract, getAllPendingContracts, deletePendingContract } from '../../../utils/contractsCache';
import { authenticatedFetch } from '../../../utils/authFetch';
import { getConnectedAgentFullName } from '../../../utils/currentUser';
import type { PendingContract } from '../../../utils/contractsCache';
import type { Victim, Tranche, Contrat, Consentements, Representant, SaveMessage, ContractForm, ContractTemplateId, MesureReparationKey } from './types';
import { getVictimBirthInfo } from '../../utils/victimBirthInfo';
import {
    cloneMesuresReparation,
    getContractPrejudiceOptions,
    getContractTemplateBareme,
    getContractTemplateById,
    getContractTemplateForPrejudice,
    getContractTemplateForVictim,
    getVictimPrejudiceForContract,
    getDefaultTemplateTranches,
    getSelectedMesures,
    isDecisionJusticeVictim,
    isMpuVictim,
    isContractTemplateId,
    MPU_MESURES,
    MPU_VULNERABILITES,
    mesuresFromKeys,
    normalizeText,
} from './contractTemplates';

const FONAREV_DIRECTEUR_GENERAL_NOM = 'Patrick FATA MAKUNGA';
const FONAREV_DIRECTEUR_GENERAL_FONCTION = 'Directeur Général';

const createTemplateTranches = (templateId: ContractTemplateId, prejudiceFinal?: string): Tranche[] => {
    return getDefaultTemplateTranches(templateId, prejudiceFinal).map((tranche, index) => ({
        id: String(index + 1),
        periode: tranche.periode,
        montant: String(tranche.montantUSD),
    }));
};

const uniqueStringOptions = (values: string[]): string[] => (
    Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
);

const getDateLieuNaissance = (victim: Victim): string => {
    return getVictimBirthInfo(victim).dateLieuNaissance;
};

const getInitialContractForm = (victim: Victim): ContractForm => {
    const template = getContractTemplateForVictim(victim);
    const prejudice = getVictimPrejudiceForContract(victim);
    const bareme = getContractTemplateBareme(template.id, prejudice);
    const nomPostnom = [victim.nom, victim.postnom].filter(Boolean).join(' ').trim();
    const prenom = victim.prenom || '';
    const usesDecisionJusticeContract = template.id === 'luc-decision-justice';
    const usesMpuConsentement = isMpuVictim(victim);

    return {
        nom: [nomPostnom, prenom].filter(Boolean).join(' ').trim(),
        nomPostnom,
        prenom,
        dateLieuNaissance: getDateLieuNaissance(victim),
        pieceIdentite: victim.pieceIdentite || '',
        adresseResidence: victim.territoire || '',
        nationalite: victim.nationalite || '',
        nomPere: victim.nomPere || '',
        nomMere: victim.nomMere || '',
        village: victim.village || '',
        groupement: victim.groupement || '',
        territoire: victim.territoire || '',
        secteur: victim.secteur || '',
        province: victim.province || '',
        typeViolation: victim.typeViolation || '',
        typePrejudices: bareme.prejudiceLabel || victim.prejudicesSubis || '',
        reparationAdministrative: usesMpuConsentement
            ? 'Mesures Provisoires Urgentes (MPU)'
            : 'Programme des Réparations Administratives Intégrales (PRAI)',
        reparationJudiciaire: usesMpuConsentement
            ? ''
            : usesDecisionJusticeContract
                ? 'Décision de justice'
                : 'En attente de décision',
        codeBeneficiaire: victim.codeBeneficiaire || victim.codeUnique || '',
        decisionJustice: '',
        prejudiceFinal: victim.prejudiceFinal || bareme.prejudiceLabel,
        typeContrat: usesMpuConsentement
            ? 'Acte de consentement MPU'
            : usesDecisionJusticeContract
                ? template.label
                : 'Réparation Administrative',
        lieuSignature: [victim.territoire, victim.province].filter(Boolean).join(', ') || 'Goma',
        dateSignature: new Date().toISOString().split('T')[0],
        fonarevNom: FONAREV_DIRECTEUR_GENERAL_NOM,
        fonarevFonction: FONAREV_DIRECTEUR_GENERAL_FONCTION,
    };
};

const createDefaultConsentements = (): Consentements => ({
    faireMediateur: false,
    avocat: false,
    exerceDroit: false,
    comprisDroit: false,
    accepteReparation: false,
    refuseReparation: false,
    evaluationJointe: false,
    signataire: false,
    recuTelephone: false,
    paiementMobileMoney: false,
    paiementInstitutionFinanciere: false,
    telephoneMarque: '',
    telephoneModele: '',
    telephoneImei: '',
    incapaciteConsentir: false,
    consentementRepresentant: false,
    mesuresAcceptees: cloneMesuresReparation(),
    mesuresRenoncees: cloneMesuresReparation(),
    etatVictimisation: '',
    situationVulnerabiliteUrgente: true,
    mesuresProposees: Object.fromEntries(MPU_MESURES.map((mesure) => [mesure.key, false])) as Consentements['mesuresProposees'],
    autresMesures: '',
    vulnerabilites: Object.fromEntries(MPU_VULNERABILITES.map((vulnerabilite) => [vulnerabilite.key, false])) as Consentements['vulnerabilites'],
    autresVulnerabilites: '',
    informeMpu: true,
    droitsExpliques: true,
    engagementsAcceptes: true,
    mediateurFonarev: false,
    accompagnementPersonneConfiance: false,
});

const DEFAULT_REPRESENTANT: Representant = {
    nom: '',
    qualite: '',
    organisation: '',
    pieceIdentite: ''
};

const MESURE_KEYS: MesureReparationKey[] = [
    'indemnisation',
    'reinsertionEconomique',
    'priseEnChargeMedicale',
    'accompagnementPsychosocial',
];

const coerceMesureKeys = (value: unknown): MesureReparationKey[] => {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is MesureReparationKey => (
        typeof item === 'string' && MESURE_KEYS.includes(item as MesureReparationKey)
    ));
};

const selectRecordKeys = <T extends string>(record: Record<T, boolean>): T[] => (
    Object.entries(record)
        .filter(([, checked]) => checked)
        .map(([key]) => key as T)
);

const recordFromKeys = <T extends string>(
    keys: readonly T[],
    selected?: unknown
): Record<T, boolean> => {
    const selectedSet = new Set(Array.isArray(selected) ? selected.filter((item): item is T => typeof item === 'string') : []);
    return Object.fromEntries(keys.map((key) => [key, selectedSet.has(key)])) as Record<T, boolean>;
};

const getContratTemplateIdFromData = (data: any, fallbackVictim: Victim): ContractTemplateId => {
    const metadataTemplateId = data?.metadataContrat?.contractTemplateId;
    if (isContractTemplateId(metadataTemplateId)) return metadataTemplateId;

    const typeContrat = normalizeText(data?.typeContrat);
    const reparationJudiciaire = normalizeText(data?.reparationJudiciaire);
    if (
        typeContrat.includes('decision') ||
        typeContrat.includes('decisions') ||
        reparationJudiciaire.includes('decision') ||
        reparationJudiciaire.includes('decisions')
    ) {
        return 'luc-decision-justice';
    }

    if (isDecisionJusticeVictim(fallbackVictim)) {
        return 'luc-decision-justice';
    }

    return getContractTemplateForPrejudice(data?.typePrejudiceReconnu || getVictimPrejudiceForContract(fallbackVictim)).id;
};

export function useContrat(victim: Victim) {
    const isMpuConsentement = isMpuVictim(victim);
    const initialTemplate = getContractTemplateForVictim(victim);
    const [selectedTemplateId, setSelectedTemplateId] = useState<ContractTemplateId>(initialTemplate.id);
    const [tranches, setTranches] = useState<Tranche[]>(() => (
        createTemplateTranches(initialTemplate.id, getVictimPrejudiceForContract(victim))
    ));
    const [consentements, setConsentements] = useState<Consentements>(() => createDefaultConsentements());
    const [representant, setRepresentant] = useState<Representant>(DEFAULT_REPRESENTANT);
    const [contractForm, setContractForm] = useState<ContractForm>(() => getInitialContractForm(victim));
    const [prejudiceOptions, setPrejudiceOptions] = useState<string[]>(() => getContractPrejudiceOptions());

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

    const selectedTemplate = getContractTemplateById(selectedTemplateId);
    const selectedTemplateBareme = getContractTemplateBareme(selectedTemplateId, contractForm.prejudiceFinal);
    const totalMontant = tranches.reduce((sum, t) => sum + (parseFloat(t.montant) || 0), 0);

    useEffect(() => {
        let isMounted = true;

        const fetchSystemPrejudices = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006';
                const response = await authenticatedFetch(`${baseUrl}/prejudices`);
                if (!response.ok) return;

                const data = await response.json();
                const systemOptions = Array.isArray(data)
                    ? data.map((item: any) => (
                        typeof item === 'string' ? item : item?.prejudice || item?.nom || ''
                    ))
                    : [];

                if (isMounted) {
                    setPrejudiceOptions(uniqueStringOptions([
                        ...getContractPrejudiceOptions(),
                        ...systemOptions,
                    ]));
                }
            } catch (error) {
                console.log('Erreur lors du chargement des préjudices:', error);
            }
        };

        fetchSystemPrejudices();

        return () => {
            isMounted = false;
        };
    }, []);

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
                const response = await authenticatedFetch(
                    isMpuConsentement
                        ? `${baseUrl}/consentements-mpu/victime/${victim.id}`
                        : `${baseUrl}/contrat/${victim.id}`
                );

                if (response.ok) {
                    const rawData = await response.json();
                    const data = rawData?.data ?? rawData;

                    if (isMpuConsentement) {
                        const signature = data.signatureBeneficiaire || data.signatureRepresentant || '';
                        setExistingContrat({
                            ...data,
                            typeContrat: 'Acte de consentement MPU',
                            reparationAdministrative: 'Mesures Provisoires Urgentes (MPU)',
                            reparationJudiciaire: '',
                            typePrejudiceReconnu: '',
                            montantTotalUSD: 0,
                            droitAccompagnement: Boolean(data.mediateurFonarev || data.accompagnementPersonneConfiance),
                            avocatAccompagnement: false,
                            organisationAccompagnement: data.organisationRepresentant || '',
                            incapableConsentir: Boolean(data.incapableConsentir),
                            qualiteRepresentant: data.qualiteRepresentant || null,
                            pieceIdentiteRepresentant: data.pieceIdentiteRepresentant || null,
                            accepteReparation: data.decisionConsentement !== 'refuse',
                            dateSignature: data.dateConsentement || new Date().toISOString(),
                            signature,
                            lieuSignature: data.lieuConsentement || '',
                            victimeId: data.victimeId || victim.id,
                            planIndemnisation: [],
                        });

                        setContractForm((prev) => ({
                            ...prev,
                            typeContrat: 'Acte de consentement MPU',
                            reparationAdministrative: 'Mesures Provisoires Urgentes (MPU)',
                            reparationJudiciaire: '',
                            lieuSignature: data.lieuConsentement || prev.lieuSignature,
                            dateSignature: data.dateConsentement || prev.dateSignature,
                            fonarevNom: FONAREV_DIRECTEUR_GENERAL_NOM,
                            fonarevFonction: FONAREV_DIRECTEUR_GENERAL_FONCTION,
                        }));

                        setConsentements((prev) => ({
                            ...prev,
                            faireMediateur: Boolean(data.mediateurFonarev),
                            avocat: Boolean(data.accompagnementPersonneConfiance),
                            exerceDroit: data.aExerceDroit === true,
                            comprisDroit: data.aExerceDroit === false,
                            accepteReparation: data.decisionConsentement !== 'refuse',
                            refuseReparation: data.decisionConsentement === 'refuse',
                            incapaciteConsentir: Boolean(data.incapableConsentir),
                            consentementRepresentant: Boolean(data.incapableConsentir || data.nomRepresentant),
                            etatVictimisation: data.etatVictimisation || '',
                            situationVulnerabiliteUrgente: Boolean(data.situationVulnerabiliteUrgente),
                            mesuresProposees: recordFromKeys(MPU_MESURES.map((mesure) => mesure.key), data.mesuresProposees),
                            autresMesures: data.autresMesures || '',
                            vulnerabilites: recordFromKeys(MPU_VULNERABILITES.map((vulnerabilite) => vulnerabilite.key), data.vulnerabilites),
                            autresVulnerabilites: data.autresVulnerabilites || '',
                            informeMpu: Boolean(data.informeMpu),
                            droitsExpliques: Boolean(data.droitsExpliques),
                            engagementsAcceptes: Boolean(data.engagementsAcceptes),
                            mediateurFonarev: Boolean(data.mediateurFonarev),
                            accompagnementPersonneConfiance: Boolean(data.accompagnementPersonneConfiance),
                        }));

                        setRepresentant({
                            nom: data.nomRepresentant || '',
                            qualite: data.qualiteRepresentant || '',
                            organisation: data.organisationRepresentant || '',
                            pieceIdentite: data.pieceIdentiteRepresentant || '',
                        });

                        if (signature && signature !== 'SIG_ELEC') {
                            const signResp = await authenticatedFetch(`${baseUrl}/minio/files/${signature}`);
                            if (signResp.ok) {
                                const signData = await signResp.json();
                                if (signData?.data?.src) {
                                    setSignatureUrl(signData.data.src);
                                }
                            }
                        }
                        return;
                    }

                    setExistingContrat(data);
                    const templateId = getContratTemplateIdFromData(data, victim);
                    const template = getContractTemplateById(templateId);
                    const usesDecisionJusticeContract = templateId === 'luc-decision-justice';
                    const bareme = getContractTemplateBareme(
                        templateId,
                        data.typePrejudiceReconnu || getVictimPrejudiceForContract(victim)
                    );
                    setSelectedTemplateId(templateId);

                    if (data.planIndemnisation && data.planIndemnisation.length > 0) {
                        setTranches(data.planIndemnisation.map((p: any, index: number) => ({
                            id: String(index + 1),
                            periode: p.periode,
                            montant: String(p.montantUSD)
                        })));
                    } else {
                        setTranches(createTemplateTranches(templateId, bareme.prejudiceLabel));
                    }

                    setContractForm((prev) => ({
                        ...prev,
                        nom: data.nomBeneficiaire || prev.nom,
                        nomPostnom: data.nomPostnom || prev.nomPostnom,
                        prenom: data.prenom || prev.prenom,
                        typeContrat: usesDecisionJusticeContract ? template.label : data.typeContrat || prev.typeContrat,
                        reparationAdministrative: data.reparationAdministrative || prev.reparationAdministrative,
                        reparationJudiciaire: usesDecisionJusticeContract ? 'Décision de justice' : data.reparationJudiciaire || prev.reparationJudiciaire,
                        typePrejudices: data.typePrejudiceReconnu || prev.typePrejudices,
                        prejudiceFinal: data.typePrejudiceReconnu || bareme.prejudiceLabel,
                        lieuSignature: data.lieuSignature || prev.lieuSignature,
                        dateSignature: data.dateSignature ? new Date(data.dateSignature).toISOString().split('T')[0] : prev.dateSignature,
                    }));

                    const metadata = data.metadataContrat || {};
                    const mesuresAcceptees = coerceMesureKeys(data.mesuresReparationAcceptees || metadata.mesuresReparationAcceptees);
                    const mesuresRenoncees = coerceMesureKeys(data.mesuresReparationRenoncees || metadata.mesuresReparationRenoncees);
                    const telephone = metadata.telephone || {};

                    setConsentements((prev) => ({
                        ...prev,
                        faireMediateur: data.serviceMediateurUtilise || false,
                        avocat: data.avocatAccompagnement || false,
                        exerceDroit: data.droitAccompagnement || false,
                        comprisDroit: data.comprisCesdroits || false,
                        accepteReparation: data.accepteReparation || false,
                        refuseReparation: mesuresRenoncees.length > 0 || data.refuseReparation || false,
                        evaluationJointe: data.evaluationJointe || metadata.evaluationJointe || false,
                        signataire: data.signataire || metadata.signataire || false,
                        recuTelephone: data.recuTelephone || data.aRecuTelephone || telephone.recu || false,
                        paiementMobileMoney: data.paiementMobileMoney || metadata.paiementMobileMoney || false,
                        paiementInstitutionFinanciere: data.paiementInstitutionFinanciere || metadata.paiementInstitutionFinanciere || false,
                        telephoneMarque: data.telephoneMarque || telephone.marque || '',
                        telephoneModele: data.telephoneModele || telephone.modele || '',
                        telephoneImei: data.telephoneImei || telephone.imei || '',
                        incapaciteConsentir: data.incapableConsentir || metadata.incapaciteConsentir || false,
                        consentementRepresentant: data.consentementRepresentant || metadata.consentementRepresentant || false,
                        mesuresAcceptees: mesuresFromKeys(mesuresAcceptees.length > 0 ? mesuresAcceptees : data.accepteReparation ? ['indemnisation'] : []),
                        mesuresRenoncees: mesuresFromKeys(mesuresRenoncees),
                    }));

                    setRepresentant({
                        nom: data.nomRepresentant || '',
                        qualite: data.qualiteRepresentant || '',
                        organisation: data.organisationAccompagnement || '',
                        pieceIdentite: data.pieceIdentiteRepresentant || ''
                    });

                    if (data.signature && data.signature !== 'SIG_ELEC') {
                        const signUrl = `${baseUrl}/minio/files/${data.signature}`;
                        const signResp = await authenticatedFetch(signUrl);
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
    }, [victim.id, isMpuConsentement]);

    // Vérifier s'il y a un contrat en attente offline pour cette victime
    useEffect(() => {
        const checkPendingOffline = async () => {
            try {
                const pending = await getAllPendingContracts();
                const victimPending = pending.find(p => (
                    p.victimId === victim.id &&
                    (isMpuConsentement ? p.targetType === 'consentement-mpu' : p.targetType !== 'consentement-mpu')
                ));
                setPendingOfflineContrat(victimPending || null);
            } catch (error) {
                console.log('Erreur lors de la vérification des contrats offline:', error);
            }
        };

        checkPendingOffline();

        // Revérifier périodiquement (au cas où la synchro a eu lieu)
        const interval = setInterval(checkPendingOffline, 5000);
        return () => clearInterval(interval);
    }, [victim.id, isMpuConsentement]);

    const uploadSignature = async (dataUrl: string): Promise<string> => {
        const uploadEndpoint = process.env.NEXT_PUBLIC_UPLOAD_ENDPOINT || 'https://360.fonasite.app:5521/minio/files/upload';

        const res = await fetch(dataUrl);
        const blob = await res.blob();

        const file = new File([blob], `signature_${victim.id}_${Date.now()}.png`, { type: 'image/png' });
        const formData = new FormData();
        formData.append('file', file);

        const resp = await authenticatedFetch(uploadEndpoint, {
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
                    const targetType = item.targetType === 'consentement-mpu' ? 'consentement-mpu' : 'contrat';
                    let finalSignature = item.contractData.signature
                        || item.contractData.signatureBeneficiaire
                        || item.contractData.signatureRepresentant
                        || 'SIG_ELEC';

                    if (item.signatureDataUrl) {
                        finalSignature = await uploadSignature(item.signatureDataUrl);
                    }

                    const isRepresentantSignature = Boolean(
                        item.contractData?.incapableConsentir ||
                        item.contractData?.nomRepresentant ||
                        item.contractData?.signatureRepresentant
                    );
                    const payload = targetType === 'consentement-mpu'
                        ? {
                            ...item.contractData,
                            [isRepresentantSignature ? 'signatureRepresentant' : 'signatureBeneficiaire']: finalSignature,
                            nomAgentFonarev: item.contractData?.nomAgentFonarev || getConnectedAgentFullName(),
                        }
                        : (() => {
                            const {
                                nomAgentFonarev: pendingAgentName,
                                metadataContrat,
                                ...contractDataWithoutAgent
                            } = item.contractData || {};
                            const { nomAgentFonarev: _metadataAgentName, ...metadataWithoutAgent } = metadataContrat || {};
                            const agentFullName = typeof pendingAgentName === 'string' && pendingAgentName.trim()
                                ? pendingAgentName.trim()
                                : getConnectedAgentFullName() || '';

                            return {
                                ...contractDataWithoutAgent,
                                ...(metadataContrat ? { metadataContrat: metadataWithoutAgent } : {}),
                                signature: finalSignature,
                                planIndemnisation: Array.isArray(contractDataWithoutAgent.planIndemnisation)
                                    ? contractDataWithoutAgent.planIndemnisation.map((plan: any) => ({
                                        ...plan,
                                        nomAgentFonarev: typeof plan?.nomAgentFonarev === 'string' && plan.nomAgentFonarev.trim()
                                            ? plan.nomAgentFonarev.trim()
                                            : agentFullName,
                                    }))
                                    : contractDataWithoutAgent.planIndemnisation,
                            };
                        })();
                    const endpoint = targetType === 'consentement-mpu'
                        ? `${baseUrl}/consentements-mpu`
                        : `${baseUrl}/contrat`;

                    const resp = await authenticatedFetch(endpoint, {
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

    const selectContractTemplate = (templateId: ContractTemplateId, prejudiceLabel?: string) => {
        const template = getContractTemplateById(templateId);
        const currentPrejudice = prejudiceLabel || contractForm.prejudiceFinal || victim.prejudiceFinal || victim.prejudicesSubis;
        const bareme = getContractTemplateBareme(templateId, currentPrejudice);
        setSelectedTemplateId(templateId);
        setTranches(createTemplateTranches(templateId, bareme.prejudiceLabel));
        setContractForm((prev) => ({
            ...prev,
            prejudiceFinal: bareme.prejudiceLabel,
            typePrejudices: bareme.prejudiceLabel,
            typeContrat: templateId === 'luc-decision-justice' ? template.label : 'Réparation Administrative',
            reparationJudiciaire: templateId === 'luc-decision-justice' ? 'Décision de justice' : 'En attente de décision',
            reparationAdministrative: 'Programme des Réparations Administratives Intégrales (PRAI)',
        }));
    };

    const selectFinalPrejudice = (prejudiceFinal: string) => {
        const templateId = selectedTemplateId === 'luc-decision-justice'
            ? selectedTemplateId
            : getContractTemplateForPrejudice(prejudiceFinal).id;
        const template = getContractTemplateById(templateId);
        const bareme = getContractTemplateBareme(templateId, prejudiceFinal);

        setSelectedTemplateId(templateId);
        setContractForm((prev) => ({
            ...prev,
            prejudiceFinal: bareme.prejudiceLabel,
            typePrejudices: bareme.prejudiceLabel,
            typeContrat: templateId === 'luc-decision-justice' ? template.label : 'Réparation Administrative',
            reparationJudiciaire: templateId === 'luc-decision-justice' ? 'Décision de justice' : 'En attente de décision',
            reparationAdministrative: 'Programme des Réparations Administratives Intégrales (PRAI)',
        }));
        setTranches(createTemplateTranches(templateId, bareme.prejudiceLabel));
    };

    const applyBaremeToTranches = () => {
        const templateId = selectedTemplateId === 'luc-decision-justice'
            ? selectedTemplateId
            : getContractTemplateForPrejudice(contractForm.prejudiceFinal).id;
        const template = getContractTemplateById(templateId);
        const bareme = getContractTemplateBareme(templateId, contractForm.prejudiceFinal);

        setSelectedTemplateId(templateId);
        setContractForm((prev) => ({
            ...prev,
            prejudiceFinal: bareme.prejudiceLabel,
            typePrejudices: bareme.prejudiceLabel,
            typeContrat: templateId === 'luc-decision-justice' ? template.label : 'Réparation Administrative',
            reparationJudiciaire: templateId === 'luc-decision-justice' ? 'Décision de justice' : 'En attente de décision',
            reparationAdministrative: 'Programme des Réparations Administratives Intégrales (PRAI)',
        }));
        setTranches(createTemplateTranches(templateId, bareme.prejudiceLabel));
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

            const usesLegacyContractText = selectedTemplateId === 'luc-decision-justice';
            const nomAgentFonarev = getConnectedAgentFullName();

            if (isMpuConsentement) {
                const signatureField = consentements.incapaciteConsentir || consentements.consentementRepresentant
                    ? 'signatureRepresentant'
                    : 'signatureBeneficiaire';
                let finalSignature = signatureField === 'signatureRepresentant'
                    ? existingContrat?.signatureRepresentant || ''
                    : existingContrat?.signatureBeneficiaire || '';

                if (signatureDataUrl && existingContrat) {
                    finalSignature = await uploadSignature(signatureDataUrl);
                }

                const mpuPayload = {
                    victimeId: victim.id,
                    etatVictimisation: consentements.etatVictimisation || undefined,
                    situationVulnerabiliteUrgente: consentements.situationVulnerabiliteUrgente,
                    mesuresProposees: selectRecordKeys(consentements.mesuresProposees),
                    autresMesures: consentements.autresMesures || undefined,
                    vulnerabilites: selectRecordKeys(consentements.vulnerabilites),
                    autresVulnerabilites: consentements.autresVulnerabilites || undefined,
                    informeMpu: consentements.informeMpu,
                    droitsExpliques: consentements.droitsExpliques,
                    aExerceDroit: consentements.exerceDroit
                        ? true
                        : consentements.comprisDroit
                            ? false
                            : undefined,
                    engagementsAcceptes: consentements.engagementsAcceptes,
                    mediateurFonarev: consentements.mediateurFonarev || consentements.faireMediateur,
                    accompagnementPersonneConfiance: consentements.accompagnementPersonneConfiance || consentements.avocat,
                    incapableConsentir: consentements.incapaciteConsentir,
                    nomRepresentant: representant.nom || undefined,
                    qualiteRepresentant: representant.qualite || undefined,
                    organisationRepresentant: representant.organisation || undefined,
                    pieceIdentiteRepresentant: representant.pieceIdentite || undefined,
                    decisionConsentement: consentements.refuseReparation ? 'refuse' : 'accepte',
                    dateConsentement: contractForm.dateSignature || new Date().toISOString().split('T')[0],
                    lieuConsentement: contractForm.lieuSignature,
                    nomAgentFonarev,
                    fonctionAgentFonarev: contractForm.fonarevFonction || undefined,
                    [signatureField]: finalSignature || 'SIG_ELEC',
                };

                if (existingContrat) {
                    if (!isOnline()) {
                        setSaveMessage({ type: 'error', text: 'Connecte-toi pour enregistrer les modifications d’un acte de consentement MPU déjà existant.' });
                        return;
                    }

                    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006';
                    const response = await authenticatedFetch(`${baseUrl}/consentements-mpu/${existingContrat.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(mpuPayload),
                    });

                    if (!response.ok) {
                        throw new Error('Erreur lors de la mise à jour de l’acte de consentement MPU');
                    }

                    const updated = await response.json().catch(() => ({ ...existingContrat, ...mpuPayload }));
                    const updatedData = updated?.data ?? updated;
                    setExistingContrat({
                        ...existingContrat,
                        ...updatedData,
                        dateSignature: updatedData.dateConsentement || existingContrat.dateSignature,
                        signature: updatedData.signatureBeneficiaire || updatedData.signatureRepresentant || existingContrat.signature,
                    });
                    setSaveMessage({ type: 'success', text: 'Acte de consentement MPU enregistré.' });
                    setTimeout(() => setSaveMessage(null), 3000);
                    return;
                }

                await savePendingContract({
                    victimId: victim.id,
                    contractData: mpuPayload,
                    signatureDataUrl,
                    targetType: 'consentement-mpu',
                });

                await syncPendingContracts();

                setSaveMessage({ type: 'success', text: 'Acte de consentement MPU enregistré (hors ligne si nécessaire). La synchronisation se fera automatiquement.' });
                setTimeout(() => setSaveMessage(null), 3000);
                return;
            }

            const mesuresReparationAcceptees = usesLegacyContractText
                ? (consentements.accepteReparation ? ['indemnisation' as MesureReparationKey] : [])
                : getSelectedMesures(consentements.mesuresAcceptees);
            const mesuresReparationRenoncees = usesLegacyContractText
                ? (consentements.refuseReparation ? ['indemnisation' as MesureReparationKey] : [])
                : getSelectedMesures(consentements.mesuresRenoncees);
            const metadataContrat = {
                contractTemplateId: selectedTemplateId,
                mesuresReparationAcceptees,
                mesuresReparationRenoncees,
                paiementMobileMoney: consentements.recuTelephone,
                paiementInstitutionFinanciere: consentements.paiementInstitutionFinanciere,
                telephone: {
                    recu: consentements.recuTelephone,
                    marque: consentements.telephoneMarque,
                    modele: consentements.telephoneModele,
                    imei: consentements.telephoneImei,
                },
                evaluationJointe: consentements.evaluationJointe,
                signataire: consentements.signataire,
                incapaciteConsentir: consentements.incapaciteConsentir,
                consentementRepresentant: consentements.consentementRepresentant,
            };

            const contractData = {
                nomBeneficiaire: contractForm.nom,
                nomPostnom: contractForm.nomPostnom,
                prenom: contractForm.prenom,
                typeContrat: contractForm.typeContrat,
                reparationAdministrative: contractForm.reparationAdministrative,
                reparationJudiciaire: contractForm.reparationJudiciaire,
                typePrejudiceReconnu: contractForm.prejudiceFinal || contractForm.typePrejudices,
                montantTotalUSD: totalMontant,
                droitAccompagnement: consentements.faireMediateur || consentements.avocat || consentements.exerceDroit || consentements.comprisDroit,
                serviceMediateurUtilise: consentements.faireMediateur,
                avocatAccompagnement: consentements.avocat,
                comprisCesdroits: consentements.comprisDroit,
                organisationAccompagnement: representant.organisation || '',
                incapableConsentir: consentements.incapaciteConsentir,
                nomRepresentant: representant.nom || null,
                qualiteRepresentant: representant.qualite || null,
                pieceIdentiteRepresentant: representant.pieceIdentite || null,
                accepteReparation: usesLegacyContractText
                    ? consentements.accepteReparation
                    : mesuresReparationAcceptees.length > 0,
                refuseReparation: usesLegacyContractText
                    ? consentements.refuseReparation
                    : mesuresReparationRenoncees.length > 0,
                mesuresReparationAcceptees,
                mesuresReparationRenoncees,
                recuTelephone: consentements.recuTelephone,
                aRecuTelephone: consentements.recuTelephone,
                paiementMobileMoney: consentements.recuTelephone,
                paiementInstitutionFinanciere: consentements.paiementInstitutionFinanciere,
                telephoneMarque: consentements.telephoneMarque,
                telephoneModele: consentements.telephoneModele,
                telephoneImei: consentements.telephoneImei,
                evaluationJointe: consentements.evaluationJointe,
                signataire: consentements.signataire,
                consentementRepresentant: consentements.consentementRepresentant,
                metadataContrat,
                dateSignature: contractForm.dateSignature ? new Date(contractForm.dateSignature).toISOString() : new Date().toISOString(),
                signature: existingContrat?.signature || 'SIG_ELEC',
                lieuSignature: contractForm.lieuSignature,
                victimeId: victim.id,
                planIndemnisation: tranches.map(t => ({
                    periode: t.periode,
                    montantUSD: parseFloat(t.montant) || 0,
                    statut: 'Planifier',
                    nomAgentFonarev: nomAgentFonarev || '',
                }))
            };

            if (existingContrat) {
                if (!isOnline()) {
                    setSaveMessage({ type: 'error', text: 'Connecte-toi pour enregistrer les modifications d’un contrat déjà existant.' });
                    return;
                }

                const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006';
                const response = await authenticatedFetch(`${baseUrl}/contrat/${existingContrat.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(contractData),
                });

                if (!response.ok) {
                    throw new Error('Erreur lors de la mise à jour du contrat');
                }

                const updated = await response.json().catch(() => ({ ...existingContrat, ...contractData }));
                setExistingContrat(updated);
                setSaveMessage({ type: 'success', text: 'Modifications du contrat enregistrées.' });
                setTimeout(() => setSaveMessage(null), 3000);
                return;
            }

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
        element.classList.add('pdf-export-mode');

        try {
            await new Promise((resolve) => requestAnimationFrame(resolve));
            await new Promise((resolve) => requestAnimationFrame(resolve));

            const captureWidth = Math.ceil(element.scrollWidth || element.getBoundingClientRect().width);
            const captureHeight = Math.ceil(element.scrollHeight || element.getBoundingClientRect().height);

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                allowTaint: true,
                backgroundColor: '#ffffff',
                windowWidth: captureWidth,
                windowHeight: captureHeight,
                imageTimeout: 0
            });

            if (!canvas.width || !canvas.height) {
                throw new Error('Le contenu du contrat est vide ou impossible à capturer.');
            }

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            const marginLeft = 0;
            const marginTop = 0;
            const marginRight = 0;
            const marginBottom = 0;

            const pdfWidth = 210;
            const pdfHeight = 297;

            const contentWidth = pdfWidth - marginLeft - marginRight;
            const contentHeight = pdfHeight - marginTop - marginBottom;

            const imgWidth = contentWidth;
            const pageHeightPx = Math.max(1, Math.floor((contentHeight * canvas.width) / imgWidth));

            let sourceY = 0;
            let pageNumber = 0;

            while (sourceY < canvas.height) {
                if (pageNumber > 0) {
                    pdf.addPage();
                }

                const sourceHeight = Math.min(pageHeightPx, canvas.height - sourceY);

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

                sourceY += sourceHeight;
                pageNumber++;
            }

                const pdfPrefix = isMpuConsentement ? 'Acte_consentement_MPU' : 'Contrat';
                pdf.save(`${pdfPrefix}_${victim.nom || 'Victime'}_${new Date().toISOString().split('T')[0]}.pdf`);
        } finally {
            element.classList.remove('pdf-export-mode');
            buttons.forEach(btn => (btn as HTMLElement).style.display = '');
        }
    };

    return {
        // State
        tranches,
        consentements,
        representant,
        contractForm,
        selectedTemplateId,
        selectedTemplate,
        selectedTemplateBareme,
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
        isMpuConsentement,
        prejudiceOptions,

        // Setters
        setConsentements,
        setRepresentant,
        setContractForm,
        setShowContratDetail,
        setShowSignatureModal,

        // Actions
        selectContractTemplate,
        selectFinalPrejudice,
        startDrawing,
        draw,
        stopDrawing,
        clearSignature,
        addTranche,
        removeTranche,
        updateTranche,
        applyBaremeToTranches,
        saveContract,
        exportToPDF,
    };
}
