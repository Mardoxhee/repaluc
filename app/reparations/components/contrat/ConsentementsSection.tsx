'use client';
import React from 'react';
import { Consentements } from './types';

interface ConsentementsSectionProps {
    consentements: Consentements;
    setConsentements: React.Dispatch<React.SetStateAction<Consentements>>;
}

export const ConsentementsSection: React.FC<ConsentementsSectionProps> = ({
    consentements,
    setConsentements,
}) => {
    return (
        <>
            {/* Section accompagnement */}
            <div className="mb-6 text-sm leading-relaxed">
                <p className="mb-3">
                    La victime aura accès à un accompagnement psychologique et économique dans le
                    cadre du programme, en lien avec des structures partenaires.
                </p>
                <p className="mb-3">
                    Selon son cas, la victime pourra également accéder à d'autres mesures disponibles
                    prévues par le programme (réinsertion socioéconomique, appui éducatif, soutien
                    administratif, prise en charge médicale,).
                </p>
                <p className="mb-3">
                    Ce programme de réparation est une mesure de justice, distincte de l'assistance
                    humanitaire, qui vise à reconnaître et atténuer les préjudices subis, restaurer la dignité
                    et rendre effectif le droit des victimes à réparation administrative tel que garanti par la loi.
                </p>
                <p className="mb-3">
                    Afin de s'assurer que la somme reçue ait un effet réparateur, le versement se fera sur
                    l'année et en tranches convenues avec la victime lors des entretiens de mise en œuvre.
                    Aucun versement en faveur de la victime ci-haut désignée ne sera effectué en cash.
                </p>
                <p className="mb-3">
                    La victime déclare avoir été informée de ses droits et des modalités de mise en œuvre
                    de la mesure.
                </p>
                <p className="mb-3">
                    Elle a pu poser toutes les questions souhaitées et a reçu des réponses complètes et
                    compréhensibles.
                </p>
            </div>

            {/* Section consentements */}
            <div className="mb-6">
                <div className="space-y-3">
                    <div className="flex items-start">
                        <input
                            type="checkbox"
                            checked={consentements.accepteReparation}
                            onChange={(e) => setConsentements({ ...consentements, accepteReparation: e.target.checked })}
                            className="mt-1 mr-3"
                        />
                        <label className="text-sm">J'accepte de bénéficier des mesures de réparation administrative</label>
                    </div>

                    <div className="flex items-start">
                        <input
                            type="checkbox"
                            checked={consentements.refuseReparation}
                            onChange={(e) => setConsentements({ ...consentements, refuseReparation: e.target.checked })}
                            className="mt-1 mr-3"
                        />
                        <label className="text-sm">Je ne souhaite pas bénéficier de cette mesure de réparation administrative</label>
                    </div>

                    <div className="flex items-start">
                        <input
                            type="checkbox"
                            checked={consentements.evaluationJointe}
                            onChange={(e) => setConsentements({ ...consentements, evaluationJointe: e.target.checked })}
                            className="mt-1 mr-3"
                        />
                        <label className="text-sm">
                            Une copie de l'évaluation médicale/psychosociale est jointe au présent
                            formulaire ou procuration avec documents de la victime
                        </label>
                    </div>

                    <div className="flex items-start">
                        <input
                            type="checkbox"
                            checked={consentements.signataire}
                            onChange={(e) => setConsentements({ ...consentements, signataire: e.target.checked })}
                            className="mt-1 mr-3"
                        />
                        <label className="text-sm">
                            Le signataire atteste avoir été informé des droits de la victime et s'engage à
                            agir dans le seul intérêt de celle-ci et se soumettre de droit à tout contrôle légale
                            prévu quant à ce.
                        </label>
                    </div>
                </div>
            </div>
        </>
    );
};
