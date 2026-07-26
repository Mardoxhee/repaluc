'use client';
import React from 'react';
import { REPARATION_MESURES } from './contractTemplates';
import type { Consentements, MesureReparationKey } from './types';

interface ReparationMeasuresSectionProps {
    consentements: Consentements;
    setConsentements: React.Dispatch<React.SetStateAction<Consentements>>;
}

const checkboxClass = 'mt-1 mr-3 h-4 w-4';
const textInputClass = 'border-b border-dotted border-gray-400 outline-none text-sm bg-transparent px-1 py-0.5';

export const ReparationMeasuresSection: React.FC<ReparationMeasuresSectionProps> = ({
    consentements,
    setConsentements,
}) => {
    const updateAcceptedMeasure = (key: MesureReparationKey, checked: boolean) => {
        setConsentements((prev) => {
            const mesuresAcceptees = {
                ...prev.mesuresAcceptees,
                [key]: checked,
            };
            const mesuresRenoncees = {
                ...prev.mesuresRenoncees,
                [key]: checked ? false : prev.mesuresRenoncees[key],
            };

            return {
                ...prev,
                accepteReparation: REPARATION_MESURES.some((item) => mesuresAcceptees[item.key]),
                refuseReparation: REPARATION_MESURES.some((item) => mesuresRenoncees[item.key]),
                mesuresAcceptees,
                mesuresRenoncees,
            };
        });
    };

    const updateRenouncedMeasure = (key: MesureReparationKey, checked: boolean) => {
        setConsentements((prev) => {
            const mesuresAcceptees = {
                ...prev.mesuresAcceptees,
                [key]: checked ? false : prev.mesuresAcceptees[key],
            };
            const mesuresRenoncees = {
                ...prev.mesuresRenoncees,
                [key]: checked,
            };

            return {
                ...prev,
                accepteReparation: REPARATION_MESURES.some((item) => mesuresAcceptees[item.key]),
                refuseReparation: REPARATION_MESURES.some((item) => mesuresRenoncees[item.key]),
                mesuresAcceptees,
                mesuresRenoncees,
            };
        });
    };

    const updateField = (field: keyof Consentements, value: boolean | string) => {
        setConsentements((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <div className="mb-6 text-sm leading-relaxed page-break-avoid">
            <p className="mb-3">
                La victime déclare avoir été informée de ses droits et des modalités de mise en œuvre
                de la mesure.
            </p>
            <p className="mb-3">
                Elle a pu poser toutes les questions souhaitées et a reçu des réponses complètes et
                compréhensibles, et en connaissance de cause :
            </p>

            <div className="mb-5">
                <p className="font-semibold mb-2">
                    Consent à recevoir les mesures de réparations administratives ci-après correspondant aux préjudices subis :
                </p>
                <p className="mb-3">La victime est invitée à cocher la ou les mesures de réparation acceptées :</p>

                <div className="space-y-3">
                    {REPARATION_MESURES.map((mesure) => (
                        <label key={mesure.key} className="flex items-start">
                            <input
                                type="checkbox"
                                checked={consentements.mesuresAcceptees[mesure.key]}
                                onChange={(e) => updateAcceptedMeasure(mesure.key, e.target.checked)}
                                className={checkboxClass}
                            />
                            <span>{mesure.label}</span>
                        </label>
                    ))}
                </div>

                <div className="ml-7 mt-3 space-y-3">
                    <label className="flex items-start">
                        <input
                            type="checkbox"
                            checked={consentements.recuTelephone}
                            onChange={(e) => updateField('recuTelephone', e.target.checked)}
                            className={checkboxClass}
                        />
                        <span>
                            Reconnait avoir reçu du FONAREV un téléphone portable neuf en bon état de fonctionnement
                            de marque{' '}
                            <input
                                type="text"
                                value={consentements.telephoneMarque}
                                onChange={(e) => updateField('telephoneMarque', e.target.value)}
                                className={`${textInputClass} w-32`}
                            />
                            , modèle{' '}
                            <input
                                type="text"
                                value={consentements.telephoneModele}
                                onChange={(e) => updateField('telephoneModele', e.target.value)}
                                className={`${textInputClass} w-32`}
                            />
                            , numéro IMEI{' '}
                            <input
                                type="text"
                                value={consentements.telephoneImei}
                                onChange={(e) => updateField('telephoneImei', e.target.value)}
                                className={`${textInputClass} w-44`}
                            />
                            {' '}destiné à la réception de son indemnisation par Mobile Money.
                        </span>
                    </label>

                    <label className="flex items-start">
                        <input
                            type="checkbox"
                            checked={consentements.paiementInstitutionFinanciere}
                            onChange={(e) => updateField('paiementInstitutionFinanciere', e.target.checked)}
                            className={checkboxClass}
                        />
                        <span>Accepte de recevoir l’indemnisation auprès d’une institution financière locale.</span>
                    </label>
                </div>
            </div>

            <div className="mb-5">
                <p className="font-semibold mb-2">
                    Ne consent pas à recevoir les mesures de réparations administratives ci-après :
                </p>
                <p className="mb-3">
                    La victime est invitée à cocher la ou les mesures de réparation qu’elle ne consent pas recevoir :
                </p>

                <div className="space-y-3">
                    {REPARATION_MESURES.map((mesure) => (
                        <label key={mesure.key} className="flex items-start">
                            <input
                                type="checkbox"
                                checked={consentements.mesuresRenoncees[mesure.key]}
                                onChange={(e) => updateRenouncedMeasure(mesure.key, e.target.checked)}
                                className={checkboxClass}
                            />
                            <span>{mesure.label}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};
