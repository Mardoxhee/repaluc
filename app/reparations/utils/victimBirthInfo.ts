type SpecificVariables = Record<string, string | null | undefined> | undefined;

type VictimBirthSource = {
    dateNaissance?: string | null;
    lieuNaissance?: string | null;
    variablesSpecifiques?: SpecificVariables;
};

const BIRTH_LOCATION_KEYS = [
    'LIEU DE NAISSANCE',
    'LIEU NAISSANCE',
    'DATE ET LIEU DE NAISSANCE',
    'LIEU ET DATE DE NAISSANCE',
    'LIEU/DATE DE NAISSANCE',
];

const normalizeSpecificKey = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, ' ')
        .trim();

const cleanText = (value?: string | null) => {
    const cleaned = String(value ?? '').trim();
    return cleaned.length > 0 ? cleaned : undefined;
};

export const getSpecificVariableValue = (variables: SpecificVariables, keys: string[]) => {
    if (!variables) return undefined;

    const normalizedKeys = new Set(keys.map(normalizeSpecificKey));
    for (const [key, value] of Object.entries(variables)) {
        if (!normalizedKeys.has(normalizeSpecificKey(key))) continue;

        const cleaned = cleanText(value);
        if (cleaned) return cleaned;
    }

    return undefined;
};

const extractDateFromBirthLocation = (value?: string) => {
    if (!value) return undefined;

    const monthNames = 'janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre';
    const datePatterns = [
        /\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b/,
        /\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b/,
        new RegExp(`\\b\\d{1,2}\\s+(?:${monthNames})\\s+\\d{2,4}\\b`, 'i'),
    ];

    for (const pattern of datePatterns) {
        const match = value.match(pattern);
        if (match?.[0]) return match[0].trim();
    }

    return undefined;
};

const extractPlaceFromBirthLocation = (value?: string, date?: string) => {
    if (!value || !date) return undefined;

    return cleanText(
        value
            .replace(date, ' ')
            .replace(/\b(n[eé]e?|naissance|le|a|à)\b/gi, ' ')
            .replace(/\s+/g, ' ')
            .replace(/^[,;:\-/. ]+|[,;:\-/. ]+$/g, '')
    );
};

export const getVictimBirthInfo = (victim?: VictimBirthSource | null) => {
    const directDate = cleanText(victim?.dateNaissance);
    const directPlace = cleanText(victim?.lieuNaissance);
    const specificBirthLocation = getSpecificVariableValue(victim?.variablesSpecifiques, BIRTH_LOCATION_KEYS);
    const specificDate = extractDateFromBirthLocation(specificBirthLocation);
    const specificPlace = extractPlaceFromBirthLocation(specificBirthLocation, specificDate);

    const dateNaissance = directDate || specificDate || specificBirthLocation;
    const lieuNaissance = directPlace || specificPlace;
    const dateLieuNaissance = directDate && directPlace
        ? `${directDate} à ${directPlace}`
        : specificBirthLocation || [dateNaissance, lieuNaissance].filter(Boolean).join(' à ');

    return {
        dateNaissance,
        lieuNaissance,
        dateLieuNaissance,
        specificBirthLocation,
    };
};
