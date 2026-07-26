import type {
    ContractTemplate,
    ContractTemplateId,
    MesureReparationKey,
    MesuresReparation,
} from './types';

export const TRANCHE_LABELS = ['Juil 2026', 'Août 2026', 'Sept 2026', 'Oct 2026', 'Nov 2026'];

export const REPARATION_MESURES: Array<{ key: MesureReparationKey; label: string }> = [
    { key: 'indemnisation', label: 'Indemnisation' },
    { key: 'reinsertionEconomique', label: 'Réinsertion économique' },
    { key: 'priseEnChargeMedicale', label: 'Prise en charge médicale' },
    { key: 'accompagnementPsychosocial', label: 'Accompagnement psycho sociale' },
];

export const EMPTY_MESURES_REPARATION: MesuresReparation = {
    indemnisation: false,
    reinsertionEconomique: false,
    priseEnChargeMedicale: false,
    accompagnementPsychosocial: false,
};

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
    {
        id: 'perte-vie',
        label: 'Contrat Perte de vie',
        prejudiceLabel: 'Perte de vie',
        amountUSD: 2000,
        amountWords: 'Deux milles dollars américains',
        trancheAmountUSD: 400,
        keywords: ['perte de vie', 'deces', 'décès', 'mort'],
    },
    {
        id: 'vslc',
        label: 'Contrat VSLC',
        prejudiceLabel: 'Violences sexuelles liées aux conflits',
        amountUSD: 1500,
        amountWords: 'Mil cinq cents dollars américains',
        trancheAmountUSD: 300,
        keywords: ['vslc', 'violence sexuelle', 'violences sexuelles liées aux conflits'],
    },
    {
        id: 'atteinte-grave',
        label: "Contrat Atteinte grave à l'intégrité physique",
        prejudiceLabel: "Atteinte grave à l'intégrité physique ayant entrainé une incapacité sévère",
        amountUSD: 1200,
        amountWords: 'Mil deux cents dollars américains',
        trancheAmountUSD: 240,
        keywords: ['atteinte grave', 'incapacité sévère', 'incapacite severe'],
    },
    {
        id: 'atteinte-integrite-physique',
        label: "Contrat Atteinte à l'intégrité physique et morale",
        prejudiceLabel: "Atteinte à l'intégrité physique et morale",
        amountUSD: 800,
        amountWords: 'Huit cents dollars américains',
        trancheAmountUSD: 160,
        keywords: [
            'atteinte à l’intégrité physique',
            "atteinte à l'intégrité physique",
            'atteinte a l integrite physique',
            'physique et morale',
            'corporel',
            'autres prejudices',
            'autres préjudices',
        ],
    },
    {
        id: 'perte-economique',
        label: 'Contrat Perte économique',
        prejudiceLabel: 'Perte économique',
        amountUSD: 500,
        amountWords: 'Cinq cents dollars américains',
        trancheAmountUSD: 100,
        keywords: ['perte economique', 'perte économique', 'economique', 'économique'],
    },
];

export const cloneMesuresReparation = (source?: Partial<MesuresReparation>): MesuresReparation => ({
    ...EMPTY_MESURES_REPARATION,
    ...(source || {}),
});

export const getSelectedMesures = (mesures: MesuresReparation): MesureReparationKey[] => (
    REPARATION_MESURES
        .filter(({ key }) => mesures[key])
        .map(({ key }) => key)
);

export const mesuresFromKeys = (keys?: MesureReparationKey[]): MesuresReparation => {
    const mesures = cloneMesuresReparation();
    keys?.forEach((key) => {
        mesures[key] = true;
    });
    return mesures;
};

export const getContractTemplateById = (templateId?: string | null): ContractTemplate => (
    CONTRACT_TEMPLATES.find((template) => template.id === templateId) || CONTRACT_TEMPLATES[0]
);

const normalizeText = (value?: string): string => (
    (value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[’']/g, ' ')
        .trim()
        .toLowerCase()
);

export const getContractTemplateForPrejudice = (prejudiceFinal?: string): ContractTemplate => {
    const normalized = normalizeText(prejudiceFinal);

    return CONTRACT_TEMPLATES.find((template) =>
        template.keywords.some((keyword) => normalized.includes(normalizeText(keyword)))
    ) || CONTRACT_TEMPLATES[0];
};
