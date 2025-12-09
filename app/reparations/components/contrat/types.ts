export interface Victim {
    id: number;
    nom?: string;
    prenom?: string;
    dateNaissance?: string;
    nationalite?: string;
    nomPere?: string;
    nomMere?: string;
    village?: string;
    groupement?: string;
    territoire?: string;
    secteur?: string;
    province?: string;
    typeViolation?: string;
    prejudicesSubis?: string;
    indemnisation?: number;
    prejudiceFinal?: string;
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
}

export interface Representant {
    nom: string;
    qualite: string;
    organisation: string;
    pieceIdentite: string;
}

export interface ContratVictimProps {
    victim: Victim;
}

export interface SaveMessage {
    type: 'success' | 'error';
    text: string;
}
