'use client';
import React from 'react';
import { Victim, Representant } from './types';

interface VictimInfoProps {
    victim: Victim;
    representant: Representant;
    setRepresentant: React.Dispatch<React.SetStateAction<Representant>>;
}

export const VictimInfo: React.FC<VictimInfoProps> = ({ victim, representant, setRepresentant }) => {
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
                    <span className="font-semibold text-sm mr-2">Nom :</span>
                    <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-96">{victim.nom || ''}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                        <span className="font-semibold text-sm mr-2">Date et lieu de naissance :</span>
                        <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-64">{victim.dateNaissance || ''}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-sm mr-2">Pièce d'identité (type et numéro) :</span>
                        <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-48"></span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                        <span className="font-semibold text-sm mr-2">Adresse ou territoire de résidence :</span>
                        <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-48">{victim.territoire || ''}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-sm italic mr-2">Nationalité :</span>
                        <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-48">{victim.nationalite || ''}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                        <span className="font-semibold text-sm italic mr-2">Nom du père :</span>
                        <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-64">{victim.nomPere || ''}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-sm italic mr-2">Nom de la Mère :</span>
                        <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-64">{victim.nomMere || ''}</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                        <span className="font-semibold text-sm italic mr-2">Village :</span>
                        <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-32">{victim.village || ''}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-sm italic mr-2">Groupement :</span>
                        <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-32">{victim.groupement || ''}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-sm italic mr-2">Territoire :</span>
                        <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-32">{victim.territoire || ''}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                        <span className="font-semibold text-sm italic mr-2">Secteur :</span>
                        <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-64">{victim.secteur || ''}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-sm italic mr-2">Province :</span>
                        <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-64">{victim.province || ''}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                        <span className="font-semibold text-sm mr-2">Type de violation :</span>
                        <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-64">{victim.typeViolation || ''}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-sm mr-2">Type de préjudices :</span>
                        <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-64">{victim.prejudicesSubis || ''}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                        <span className="font-semibold text-sm mr-2">Réparation administrative :</span>
                        <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-48"></span>
                    </div>
                    <div>
                        <span className="font-semibold text-sm mr-2">Réparation judiciaire :</span>
                        <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-48"></span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                        <span className="font-semibold text-sm mr-2">Code bénéficiaire FONAREV :</span>
                        <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-48"></span>
                    </div>
                    <div>
                        <span className="font-semibold text-sm mr-2">Décision de justice (si détient une décision de justice exécutoire) :</span>
                        <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-32"></span>
                    </div>
                </div>

                <div className="mb-3">
                    <p className="text-sm">Ci-dessous « la victime »</p>
                </div>
            </div>

            {/* Section reconnaissance */}
            <div className="mb-6">
                <p className="font-bold text-sm mb-2">A été reconnue comme victime du préjudice suivant :</p>
                <p className="text-sm italic mb-4">
                    {victim.prejudiceFinal || 'Pas de prejudice final ressorti'}
                </p>
                <p className="text-sm leading-relaxed mb-4">
                    À ce titre, une indemnisation d'un montant de l'équivalent en Francs Congolais de
                    4.320 USD (Quatre mille trois cent vingt dollars américains) vous est proposée, en tant
                    que mesure de réparation administrative versée par le FONAREV, de manière forfaitaire
                    et à titre symbolique en vue de contribuer au soulagement des préjudices subis.
                </p>

                <p className="font-bold text-sm mb-2">Droit à l'accompagnement</p>
                <p className="text-sm mb-2">La victime a été informée de son droit :</p>
                <div className="ml-6 space-y-2 text-sm">
                    <div className="flex items-start">
                        <span className="mr-2">☐</span>
                        <span>À faire recours aux services du Médiateur ;</span>
                    </div>
                    <div className="flex items-start">
                        <span className="mr-2">☐</span>
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
                        <span className="mr-2">☐</span>
                        <span>Avoir exercé ce droit avant de donner son consentement</span>
                    </div>
                    <div className="flex items-start">
                        <span className="mr-2">☐</span>
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
                        <span className="mr-2">☐</span>
                        <span>La victime est en situation d'incapacité permanente ou temporaire à consentir seule.</span>
                    </div>
                    <div className="flex items-start">
                        <span className="mr-2">☐</span>
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
