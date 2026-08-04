import type {
    ContractTemplate,
    ContractTemplateBareme,
    ContractTemplateId,
    MesureReparationKey,
    MesuresReparation,
} from './types';

export const TRANCHE_LABELS = ['Juil 2026', 'Août 2026', 'Sept 2026', 'Oct 2026', 'Nov 2026'];

const LUC_DJ_LONG_TRANCHE_LABELS = [
    'Nov 2025',
    'Janv 2026',
    'Mars 2026',
    'Mai 2026',
    'Juil 2026',
    'Sept 2026',
    'Nov 2026',
    'Déc 2026',
    'Fév 2027',
];

const LUC_DJ_SHORT_TRANCHE_LABELS = [
    'Nov 2025',
    'Janv 2026',
    'Mars 2026',
    'Mai 2026',
];

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

const LUC_DJ_BAREMES: ContractTemplateBareme[] = [
    {
        prejudiceLabel: 'Perte de vie',
        amountUSD: 4320,
        amountWords: 'Quatre mille trois cent vingt dollars américains',
        tranchesUSD: Array.from({ length: 9 }, () => 480),
        trancheLabels: LUC_DJ_LONG_TRANCHE_LABELS,
        keywords: ['perte de vie', 'deces', 'décès', 'mort'],
    },
    {
        prejudiceLabel: 'Violences sexuelles liées aux conflits',
        amountUSD: 3600,
        amountWords: 'Trois mille six cents dollars américains',
        tranchesUSD: Array.from({ length: 9 }, () => 400),
        trancheLabels: LUC_DJ_LONG_TRANCHE_LABELS,
        keywords: ['vslc', 'violence sexuelle', 'violences sexuelles liées aux conflits'],
    },
    {
        prejudiceLabel: "Atteinte à l'intégrité physique ayant entrainé une incapacité sévère",
        amountUSD: 3600,
        amountWords: 'Trois mille six cents dollars américains',
        tranchesUSD: Array.from({ length: 9 }, () => 400),
        trancheLabels: LUC_DJ_LONG_TRANCHE_LABELS,
        keywords: ['atteinte grave', 'incapacité sévère', 'incapacite severe'],
    },
    {
        prejudiceLabel: "Atteinte à l'intégrité physique et morale",
        amountUSD: 1150,
        amountWords: 'Mil cent cinquante dollars américains',
        tranchesUSD: [288, 288, 288, 286],
        trancheLabels: LUC_DJ_SHORT_TRANCHE_LABELS,
        keywords: [
            'atteinte à l’intégrité physique',
            "atteinte à l'intégrité physique",
            'atteinte a l integrite physique',
            'physique ou morale',
            'physique et morale',
            'corporel',
            'autres prejudices',
            'autres préjudices',
        ],
    },
    {
        prejudiceLabel: 'Perte économique',
        amountUSD: 1000,
        amountWords: 'Mille dollars américains',
        tranchesUSD: [250, 250, 250, 250],
        trancheLabels: LUC_DJ_SHORT_TRANCHE_LABELS,
        keywords: ['perte economique', 'perte économique', 'economique', 'économique'],
    },
];

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
    {
        id: 'luc-decision-justice',
        label: 'Contrat victimes détenant les décisions de justice',
        prejudiceLabel: 'Barème LUC/DJ selon décision de justice',
        amountUSD: LUC_DJ_BAREMES[0].amountUSD,
        amountWords: LUC_DJ_BAREMES[0].amountWords,
        trancheAmountUSD: LUC_DJ_BAREMES[0].tranchesUSD[0],
        keywords: ['decision de justice', 'décision de justice', 'luc/dj', 'luc dj'],
        baremes: LUC_DJ_BAREMES,
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

export const isContractTemplateId = (value: unknown): value is ContractTemplateId => (
    typeof value === 'string' && CONTRACT_TEMPLATES.some((template) => template.id === value)
);

export const normalizeText = (value?: string): string => (
    (value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[’']/g, ' ')
        .trim()
        .toLowerCase()
);

export const getContractTemplateBareme = (
    templateId: ContractTemplateId,
    prejudiceFinal?: string
): ContractTemplateBareme => {
    const template = getContractTemplateById(templateId);
    if (!template.baremes || template.baremes.length === 0) {
        return {
            prejudiceLabel: template.prejudiceLabel,
            amountUSD: template.amountUSD,
            amountWords: template.amountWords,
            tranchesUSD: TRANCHE_LABELS.map(() => template.trancheAmountUSD),
            trancheLabels: TRANCHE_LABELS,
            keywords: template.keywords,
        };
    }

    const normalized = normalizeText(prejudiceFinal);
    return template.baremes.find((bareme) =>
        normalizeText(bareme.prejudiceLabel) === normalized ||
        bareme.keywords.some((keyword) => normalized.includes(normalizeText(keyword)))
    ) || template.baremes[0];
};

export const getDefaultTemplateTranches = (
    templateId: ContractTemplateId,
    prejudiceFinal?: string
): Array<{ periode: string; montantUSD: number }> => {
    const bareme = getContractTemplateBareme(templateId, prejudiceFinal);
    return bareme.tranchesUSD.map((montantUSD, index) => ({
        periode: bareme.trancheLabels?.[index] || `${index + 1}ème tranche`,
        montantUSD,
    }));
};

export const getContractPrejudiceOptions = (): string[] => {
    const options = CONTRACT_TEMPLATES.flatMap((template) => (
        template.baremes?.map((bareme) => bareme.prejudiceLabel) || [template.prejudiceLabel]
    ));
    return Array.from(new Set(options));
};

export const getContractTemplateForPrejudice = (prejudiceFinal?: string): ContractTemplate => {
    const normalized = normalizeText(prejudiceFinal);

    return CONTRACT_TEMPLATES.filter((template) => !template.baremes).find((template) =>
        template.keywords.some((keyword) => normalized.includes(normalizeText(keyword)))
    ) || CONTRACT_TEMPLATES[0];
};
