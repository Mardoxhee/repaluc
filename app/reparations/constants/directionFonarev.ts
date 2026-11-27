export const DIRECTEUR_GENERAL_FONAREV = {
    nomAgentFonarev: 'Patrick FATA MAKUNGA',
    fonctionAgentFonarev: 'Directeur Général',
} as const;

export function signataireFonarevMpu(acte?: { nomAgentFonarev?: unknown; fonctionAgentFonarev?: unknown } | null) {
    const nom = typeof acte?.nomAgentFonarev === 'string' ? acte.nomAgentFonarev.trim() : '';
    const fonction = typeof acte?.fonctionAgentFonarev === 'string' ? acte.fonctionAgentFonarev.trim() : '';
    // Un ancien acte peut désigner explicitement un signataire exerçant une autre fonction.
    if (nom && fonction && fonction.localeCompare(DIRECTEUR_GENERAL_FONAREV.fonctionAgentFonarev, 'fr', { sensitivity: 'base' }) !== 0) {
        return { nomAgentFonarev: nom, fonctionAgentFonarev: fonction };
    }
    return DIRECTEUR_GENERAL_FONAREV;
}
