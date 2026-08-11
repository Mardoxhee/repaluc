'use client';
import React from 'react';
import type { ContractTemplateBareme, Victim, Representant, ContractForm, Consentements } from './types';

interface VictimInfoProps {
    victim: Victim;
    selectedTemplateBareme: ContractTemplateBareme;
    useLegacyContractText?: boolean;
    contractForm: ContractForm;
    setContractForm: React.Dispatch<React.SetStateAction<ContractForm>>;
    consentements: Consentements;
    setConsentements: React.Dispatch<React.SetStateAction<Consentements>>;
    representant: Representant;
    setRepresentant: React.Dispatch<React.SetStateAction<Representant>>;
    selectFinalPrejudice: (prejudiceFinal: string) => void;
    prejudiceOptions: string[];
    totalMontant: number;
}

const inputClass = 'border-b border-dotted border-gray-400 outline-none text-sm bg-transparent px-1 py-0.5 min-w-0';

export const VictimInfo: React.FC<VictimInfoProps> = ({
    selectedTemplateBareme,
    useLegacyContractText = false,
    contractForm,
    setContractForm,
    consentements,
    setConsentements,
    representant,
    setRepresentant,
    selectFinalPrejudice,
    prejudiceOptions,
    totalMontant,
}) => {
    const currentPrejudice = contractForm.prejudiceFinal.trim();
    const displayedPrejudiceOptions = currentPrejudice && !prejudiceOptions.includes(currentPrejudice)
        ? [currentPrejudice, ...prejudiceOptions]
        : prejudiceOptions;

    const updateField = (field: keyof ContractForm, value: string) => {
        setContractForm((prev) => {
            const next = { ...prev, [field]: value };
            if (field === 'nomPostnom' || field === 'prenom') {
                return {
                    ...next,
                    nom: [next.nomPostnom, next.prenom].filter(Boolean).join(' ').trim(),
                };
            }
            return next;
        });
    };

    return (
        <>
            {/* Introduction */}
            <div className="mb-6 text-sm text-gray-700 leading-relaxed">
                <p>
                    En vertu de la Loi n°22/065 du 26 décembre 2022 Loi fixant les principes fondamentaux
                    relatifs à la protection et à la réparation des victimes de violences sexuelles liées aux
                    conflits et des victimes des crimes contre la paix et la sécurité de l'humanité, du décret
                    portant mesures d'application de la Loi n°22/06 du 26 décembre 2022 et dans le cadre
                    de la stratégie opérationnelle de réparation, le FONAREV atteste que :
                </p>
            </div>

            {/* Informations personnelles */}
            <div className="mb-6">
                <div className="mb-3">
                    <span className="font-semibold text-sm mr-2">Type de contrat :</span>
                    {useLegacyContractText ? (
                        <input
                            type="text"
                            value={contractForm.typeContrat}
                            onChange={(e) => updateField('typeContrat', e.target.value)}
                            className={`${inputClass} w-80`}
                        />
                    ) : (
                        <span className="text-sm">{contractForm.typeContrat}</span>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                        <span className="font-semibold text-sm mr-2">Nom - Postnom :</span>
                        <input
                            type="text"
                            value={contractForm.nomPostnom}
                            onChange={(e) => updateField('nomPostnom', e.target.value)}
                            className={`${inputClass} w-64`}
                        />
                    </div>
                    <div>
                        <span className="font-semibold text-sm mr-2">Prénom :</span>
                        <input
                            type="text"
                            value={contractForm.prenom}
                            onChange={(e) => updateField('prenom', e.target.value)}
                            className={`${inputClass} w-64`}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                        <span className="font-semibold text-sm mr-2">Date et lieu de naissance :</span>
                        <input
                            type="text"
                            value={contractForm.dateLieuNaissance}
                            onChange={(e) => updateField('dateLieuNaissance', e.target.value)}
                            className={`${inputClass} w-64`}
                        />
                    </div>
                    <div>
                        <span className="font-semibold text-sm mr-2">Pièce d'identité (type et numéro) :</span>
                        <input
                            type="text"
                            value={contractForm.pieceIdentite}
                            onChange={(e) => updateField('pieceIdentite', e.target.value)}
                            className={`${inputClass} w-48`}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                        <span className="font-semibold text-sm mr-2">Adresse ou territoire de résidence :</span>
                        <input
                            type="text"
                            value={contractForm.adresseResidence}
                            onChange={(e) => updateField('adresseResidence', e.target.value)}
                            className={`${inputClass} w-48`}
                        />
                    </div>
                    <div>
                        <span className="font-semibold text-sm italic mr-2">Nationalité :</span>
                        <input
                            type="text"
                            value={contractForm.nationalite}
                            onChange={(e) => updateField('nationalite', e.target.value)}
                            className={`${inputClass} w-48`}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                        <span className="font-semibold text-sm italic mr-2">Nom du père :</span>
                        <input
                            type="text"
                            value={contractForm.nomPere}
                            onChange={(e) => updateField('nomPere', e.target.value)}
                            className={`${inputClass} w-64`}
                        />
                    </div>
                    <div>
                        <span className="font-semibold text-sm italic mr-2">Nom de la Mère :</span>
                        <input
                            type="text"
                            value={contractForm.nomMere}
                            onChange={(e) => updateField('nomMere', e.target.value)}
                            className={`${inputClass} w-64`}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                        <span className="font-semibold text-sm italic mr-2">Village :</span>
                        <input
                            type="text"
                            value={contractForm.village}
                            onChange={(e) => updateField('village', e.target.value)}
                            className={`${inputClass} w-32`}
                        />
                    </div>
                    <div>
                        <span className="font-semibold text-sm italic mr-2">Groupement :</span>
                        <input
                            type="text"
                            value={contractForm.groupement}
                            onChange={(e) => updateField('groupement', e.target.value)}
                            className={`${inputClass} w-32`}
                        />
                    </div>
                    <div>
                        <span className="font-semibold text-sm italic mr-2">Territoire :</span>
                        <input
                            type="text"
                            value={contractForm.territoire}
                            onChange={(e) => updateField('territoire', e.target.value)}
                            className={`${inputClass} w-32`}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                        <span className="font-semibold text-sm italic mr-2">Secteur :</span>
                        <input
                            type="text"
                            value={contractForm.secteur}
                            onChange={(e) => updateField('secteur', e.target.value)}
                            className={`${inputClass} w-64`}
                        />
                    </div>
                    <div>
                        <span className="font-semibold text-sm italic mr-2">Province :</span>
                        <input
                            type="text"
                            value={contractForm.province}
                            onChange={(e) => updateField('province', e.target.value)}
                            className={`${inputClass} w-64`}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                        <span className="font-semibold text-sm mr-2">Type de violation :</span>
                        <input
                            type="text"
                            value={contractForm.typeViolation}
                            onChange={(e) => updateField('typeViolation', e.target.value)}
                            className={`${inputClass} w-64`}
                        />
                    </div>
                    <div>
                        <span className="font-semibold text-sm mr-2">Type de préjudices :</span>
                        <input
                            type="text"
                            value={contractForm.typePrejudices}
                            onChange={(e) => updateField('typePrejudices', e.target.value)}
                            className={`${inputClass} w-64`}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                        <span className="font-semibold text-sm mr-2">Réparation administrative :</span>
                        <input
                            type="text"
                            value={contractForm.reparationAdministrative}
                            onChange={(e) => updateField('reparationAdministrative', e.target.value)}
                            className={`${inputClass} w-48`}
                        />
                    </div>
                    <div>
                        <span className="font-semibold text-sm mr-2">Réparation judiciaire :</span>
                        <input
                            type="text"
                            value={contractForm.reparationJudiciaire}
                            onChange={(e) => updateField('reparationJudiciaire', e.target.value)}
                            className={`${inputClass} w-48`}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                        <span className="font-semibold text-sm mr-2">Code bénéficiaire FONAREV :</span>
                        <input
                            type="text"
                            value={contractForm.codeBeneficiaire}
                            onChange={(e) => updateField('codeBeneficiaire', e.target.value)}
                            className={`${inputClass} w-48`}
                        />
                    </div>
                    <div>
                        <span className="font-semibold text-sm mr-2">Décision de justice (si détient une décision de justice exécutoire) :</span>
                        <input
                            type="text"
                            value={contractForm.decisionJustice}
                            onChange={(e) => updateField('decisionJustice', e.target.value)}
                            className={`${inputClass} w-32`}
                        />
                    </div>
                </div>

                <div className="mb-3">
                    <p className="text-sm">Ci-dessous « la victime »</p>
                </div>
            </div>

            {/* Section reconnaissance */}
            <div className="mb-6">
                <p className="font-bold text-sm mb-2">A été reconnue comme victime du préjudice suivant :</p>
                <div className="mb-4">
                    <select
                        value={contractForm.prejudiceFinal}
                        onChange={(e) => selectFinalPrejudice(e.target.value)}
                        className={`${inputClass} italic w-full sm:w-[28rem]`}
                    >
                        <option value="" disabled>Sélectionner le préjudice final</option>
                        {displayedPrejudiceOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>
                <p className="text-sm leading-relaxed mb-4">
                    À ce titre, une indemnisation d'un montant de l'équivalent en Francs Congolais de
                    <span className="font-semibold"> {totalMontant.toLocaleString('fr-FR')} USD </span>
                    ({selectedTemplateBareme.amountWords}) 
                    vous est proposée, en tant
                    que mesure de réparation administrative versée par le FONAREV, de manière forfaitaire
                    et à titre symbolique en vue de contribuer au soulagement des préjudices subis.
                </p>

                <p className="font-bold text-sm mb-2">Droit à l'accompagnement</p>
                <p className="text-sm mb-2">La victime a été informée de son droit :</p>
                <div className="ml-6 space-y-2 text-sm">
                    <div className="flex items-start">
                        <input
                            type="checkbox"
                            checked={consentements.faireMediateur}
                            onChange={(e) => setConsentements({ ...consentements, faireMediateur: e.target.checked })}
                            className="mt-1 mr-2"
                        />
                        <span>À faire recours aux services du Médiateur ;</span>
                    </div>
                    <div className="flex items-start">
                        <input
                            type="checkbox"
                            checked={consentements.avocat}
                            onChange={(e) => setConsentements({ ...consentements, avocat: e.target.checked })}
                            className="mt-1 mr-2"
                        />
                        <span>
                            Et/ou à être accompagnée par un avocat (à ses propres frais) ou une
                            organisation de défense des droits des victimes de son choix, y compris une
                            organisation qui l'a déjà accompagnée dans son parcours.
                        </span>
                    </div>
                </div>

                <p className="text-sm mt-4 mb-2">Elle déclare :</p>
                <div className="ml-6 space-y-2 text-sm">
                    <div className="flex items-start">
                        <input
                            type="checkbox"
                            checked={consentements.exerceDroit}
                            onChange={(e) => setConsentements({ ...consentements, exerceDroit: e.target.checked })}
                            className="mt-1 mr-2"
                        />
                        <span>Avoir exercé ce droit avant de donner son consentement</span>
                    </div>
                    <div className="flex items-start">
                        <input
                            type="checkbox"
                            checked={consentements.comprisDroit}
                            onChange={(e) => setConsentements({ ...consentements, comprisDroit: e.target.checked })}
                            className="mt-1 mr-2"
                        />
                        <span>Avoir compris ce droit, mais avoir choisi de ne pas y recourir</span>
                    </div>
                </div>
            </div>

            {/* Section représentation */}
            <div className="mb-6">
                <p className="font-bold text-sm mb-3">Cas des personnes incapables de consentir seules</p>
                <p className="text-sm mb-4 leading-relaxed">
                    Dans le cas où la victime est reconnue, sur la base d'un avis médical ou d'une évaluation
                    psychosociale, comme étant incapable de comprendre ou de consentir de manière
                    libre et éclairée à la présente mesure de réparation, le consentement peut être
                    valablement donné par l'intermédiaire d'une représentante légale ou d'une
                    représentante désignée, conformément au mécanisme ci-dessous :
                </p>

                <p className="font-bold text-sm italic mb-3 mt-6 page-break-avoid">Représentation pour consentement</p>
                <div className="ml-6 space-y-2 text-sm mb-4">
                    <div className="flex items-start">
                        <input
                            type="checkbox"
                            checked={useLegacyContractText ? representant.nom.trim().length > 0 : consentements.incapaciteConsentir}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setConsentements({ ...consentements, incapaciteConsentir: checked });
                                if (!checked) {
                                    setRepresentant({ nom: '', qualite: '', organisation: '', pieceIdentite: '' });
                                }
                            }}
                            className="mt-1 mr-2"
                        />
                        <span>La victime est en situation d'incapacité permanente ou temporaire à consentir seule.</span>
                    </div>
                    <div className="flex items-start">
                        <input
                            type="checkbox"
                            checked={useLegacyContractText ? representant.nom.trim().length > 0 : consentements.consentementRepresentant}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setConsentements({ ...consentements, consentementRepresentant: checked });
                                if (!checked) {
                                    setRepresentant({ nom: '', qualite: '', organisation: '', pieceIdentite: '' });
                                }
                            }}
                            className="mt-1 mr-2"
                        />
                        <span>Le consentement est donné en ses lieu et place par :</span>
                    </div>
                </div>

                <div className="ml-12 space-y-3">
                    <div className="flex items-start">
                        <span className="mr-2">•</span>
                        <div className="flex-1">
                            <span className="font-semibold text-sm mr-2">Nom du/de la représentante :</span>
                            <input
                                type="text"
                                value={representant.nom}
                                onChange={(e) => setRepresentant({ ...representant, nom: e.target.value })}
                                className="border-b border-dotted border-gray-400 outline-none text-sm w-96"
                            />
                        </div>
                    </div>

                    <div className="flex items-start">
                        <span className="mr-2">•</span>
                        <div className="flex-1">
                            <span className="font-semibold text-sm mr-2">
                                Qualité (parent, tuteur(rice) légale, curateur (rice), représentant(e) désigné(e) par l'organisation accompagnatrice, etc.) :
                            </span>
                            <input
                                type="text"
                                value={representant.qualite}
                                onChange={(e) => setRepresentant({ ...representant, qualite: e.target.value })}
                                className="border-b border-dotted border-gray-400 outline-none text-sm w-full mt-1"
                            />
                        </div>
                    </div>

                    <div className="flex items-start">
                        <span className="mr-2">•</span>
                        <div className="flex-1">
                            <span className="font-semibold text-sm mr-2">Organisation accompagnatrice (le cas échéant) :</span>
                            <input
                                type="text"
                                value={representant.organisation}
                                onChange={(e) => setRepresentant({ ...representant, organisation: e.target.value })}
                                className="border-b border-dotted border-gray-400 outline-none text-sm w-96"
                            />
                        </div>
                    </div>

                    <div className="flex items-start">
                        <span className="mr-2">•</span>
                        <div className="flex-1">
                            <span className="font-semibold text-sm mr-2">Pièce d'identité du/de la représentant(e) (type et numéro) :</span>
                            <input
                                type="text"
                                value={representant.pieceIdentite}
                                onChange={(e) => setRepresentant({ ...representant, pieceIdentite: e.target.value })}
                                className="border-b border-dotted border-gray-400 outline-none text-sm w-72"
                            />
                        </div>
                    </div>
                </div>

                <p className="text-sm mt-4 leading-relaxed">
                    Les modalités de versement de la somme ci-dessus s'effectuera en de de la manière suivante :
                </p>
            </div>
        </>
    );
};
