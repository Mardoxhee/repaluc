export interface Victim {
    id: number;
    nom?: string;
    postnom?: string;
    prenom?: string;
    dateNaissance?: string;
    lieuNaissance?: string;
    nationalite?: string;
    nomPere?: string;
    nomMere?: string;
    pieceIdentite?: string;
    codeUnique?: string;
    codeBeneficiaire?: string;
    village?: string;
    groupement?: string;
    territoire?: string;
    secteur?: string;
    province?: string;
    typeViolation?: string;
    prejudicesSubis?: string;
    indemnisation?: number;
    prejudiceFinal?: string;
    variablesSpecifiques?: Record<string, string | null | undefined>;
}

export interface Tranche {
    id: string;
    periode: string;
    montant: string;
}

export interface PlanIndemnisation {
    id: number;
    periode: string;
    montantUSD: number;
    statut: string;
}

export interface Contrat {
    id: number;
    typeContrat: string;
    reparationAdministrative: string;
    reparationJudiciaire: string;
    typePrejudiceReconnu: string;
    montantTotalUSD: number;
    droitAccompagnement: boolean;
    avocatAccompagnement: boolean;
    organisationAccompagnement: string;
    incapableConsentir: boolean;
    qualiteRepresentant: string | null;
    pieceIdentiteRepresentant: string | null;
    accepteReparation: boolean;
    dateSignature: string;
    signature: string;
    lieuSignature: string;
    victimeId: number;
    planIndemnisation: PlanIndemnisation[];
    mesuresReparationAcceptees?: MesureReparationKey[];
    mesuresReparationRenoncees?: MesureReparationKey[];
    paiementMobileMoney?: boolean;
    paiementInstitutionFinanciere?: boolean;
    telephoneMarque?: string | null;
    telephoneModele?: string | null;
    telephoneImei?: string | null;
    evaluationJointe?: boolean;
    signataire?: boolean;
    consentementRepresentant?: boolean;
    metadataContrat?: ContractMetadata;
}

export type ContractTemplateId =
    | 'perte-vie'
    | 'vslc'
    | 'atteinte-grave'
    | 'atteinte-integrite-physique'
    | 'perte-economique'
    | 'luc-decision-justice';

export type MesureReparationKey =
    | 'indemnisation'
    | 'reinsertionEconomique'
    | 'priseEnChargeMedicale'
    | 'accompagnementPsychosocial';

export type MesuresReparation = Record<MesureReparationKey, boolean>;

export interface ContractTemplate {
    id: ContractTemplateId;
    label: string;
    prejudiceLabel: string;
    amountUSD: number;
    amountWords: string;
    trancheAmountUSD: number;
    keywords: string[];
    baremes?: ContractTemplateBareme[];
}

export interface ContractTemplateBareme {
    prejudiceLabel: string;
    amountUSD: number;
    amountWords: string;
    tranchesUSD: number[];
    trancheLabels?: string[];
    keywords: string[];
}

export interface ContractMetadata {
    contractTemplateId?: ContractTemplateId;
    mesuresReparationAcceptees: MesureReparationKey[];
    mesuresReparationRenoncees: MesureReparationKey[];
    paiementMobileMoney: boolean;
    paiementInstitutionFinanciere: boolean;
    telephone: {
        recu: boolean;
        marque: string;
        modele: string;
        imei: string;
    };
    evaluationJointe: boolean;
    signataire: boolean;
    incapaciteConsentir: boolean;
    consentementRepresentant: boolean;
}

export interface Consentements {
    faireMediateur: boolean;
    avocat: boolean;
    exerceDroit: boolean;
    comprisDroit: boolean;
    accepteReparation: boolean;
    refuseReparation: boolean;
    evaluationJointe: boolean;
    signataire: boolean;
    recuTelephone: boolean;
    paiementMobileMoney: boolean;
    paiementInstitutionFinanciere: boolean;
    telephoneMarque: string;
    telephoneModele: string;
    telephoneImei: string;
    incapaciteConsentir: boolean;
    consentementRepresentant: boolean;
    mesuresAcceptees: MesuresReparation;
    mesuresRenoncees: MesuresReparation;
}

export interface Representant {
    nom: string;
    qualite: string;
    organisation: string;
    pieceIdentite: string;
}

export interface ContractForm {
    nom: string;
    nomPostnom: string;
    prenom: string;
    dateLieuNaissance: string;
    pieceIdentite: string;
    adresseResidence: string;
    nationalite: string;
    nomPere: string;
    nomMere: string;
    village: string;
    groupement: string;
    territoire: string;
    secteur: string;
    province: string;
    typeViolation: string;
    typePrejudices: string;
    reparationAdministrative: string;
    reparationJudiciaire: string;
    codeBeneficiaire: string;
    decisionJustice: string;
    prejudiceFinal: string;
    typeContrat: string;
    lieuSignature: string;
    dateSignature: string;
    fonarevNom: string;
    fonarevFonction: string;
}

export interface ContratVictimProps {
    victim: Victim;
}

export interface SaveMessage {
    type: 'success' | 'error';
    text: string;
}
