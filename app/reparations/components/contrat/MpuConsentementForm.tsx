'use client';
import React from 'react';
import { MPU_MESURES, MPU_VULNERABILITES } from './contractTemplates';
import type { Consentements, ContractForm, MpuEtatVictimisation, MpuMesureKey, MpuVulnerabiliteKey, Representant } from './types';

interface MpuConsentementFormProps {
    contractForm: ContractForm;
    setContractForm: React.Dispatch<React.SetStateAction<ContractForm>>;
    consentements: Consentements;
    setConsentements: React.Dispatch<React.SetStateAction<Consentements>>;
    representant: Representant;
    setRepresentant: React.Dispatch<React.SetStateAction<Representant>>;
}

const inputClass = 'border-b border-dotted border-gray-400 outline-none text-sm bg-transparent px-1 py-0.5 min-w-0';
const checkboxClass = 'mt-1 mr-2 h-4 w-4';

const etats: Array<{ value: MpuEtatVictimisation; label: string }> = [
    { value: 'directe', label: 'Est une victime directe.' },
    { value: 'indirecte', label: 'Est une victime indirecte.' },
    { value: 'communaute_victime', label: 'Appartient à une communauté victime.' },
    { value: 'communaute_affectee', label: 'Appartient à une communauté affectée.' },
];

export const MpuConsentementForm: React.FC<MpuConsentementFormProps> = ({
    contractForm,
    setContractForm,
    consentements,
    setConsentements,
    representant,
    setRepresentant,
}) => {
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

    const updateMesure = (key: MpuMesureKey, checked: boolean) => {
        setConsentements((prev) => ({
            ...prev,
            mesuresProposees: { ...prev.mesuresProposees, [key]: checked },
        }));
    };

    const updateVulnerabilite = (key: MpuVulnerabiliteKey, checked: boolean) => {
        setConsentements((prev) => ({
            ...prev,
            vulnerabilites: { ...prev.vulnerabilites, [key]: checked },
        }));
    };

    const groupedMesures = MPU_MESURES.reduce<Record<string, typeof MPU_MESURES>>((acc, mesure) => {
        acc[mesure.group] = [...(acc[mesure.group] || []), mesure];
        return acc;
    }, {});

    return (
        <div className="text-sm leading-relaxed text-gray-800">
            <div className="mb-6 text-center">
                <p className="font-bold uppercase">
                    Formulaire de consentement à recevoir les Mesures Provisoires Urgentes (MPU)
                </p>
            </div>

            <p className="mb-5">
                En vertu de la Loi n°22/065 du 26 décembre 2022 fixant les principes fondamentaux
                relatifs à la protection et à la réparation des victimes de violences sexuelles liées aux
                conflits et des victimes des crimes contre la paix et la sécurité de l’humanité, de ses
                mesures d'application, ainsi que de la stratégie opérationnelle du FONAREV, le présent
                acte constate le consentement libre et éclairé du bénéficiaire à recevoir les Mesures
                Provisoires Urgentes (MPU).
            </p>

            <div className="contract-section">
                <p className="contract-soft-title">Informations personnelles</p>
                <div className="contract-grid">
                    <label className="contract-field">
                        <span className="contract-label">Nom et postnom :</span>
                        <input className="contract-field-value" value={contractForm.nomPostnom} onChange={(e) => updateField('nomPostnom', e.target.value)} />
                    </label>
                    <label className="contract-field">
                        <span className="contract-label">Prénom :</span>
                        <input className="contract-field-value" value={contractForm.prenom} onChange={(e) => updateField('prenom', e.target.value)} />
                    </label>
                    <label className="contract-field">
                        <span className="contract-label">Date et lieu de naissance :</span>
                        <input className="contract-field-value" value={contractForm.dateLieuNaissance} onChange={(e) => updateField('dateLieuNaissance', e.target.value)} />
                    </label>
                    <label className="contract-field">
                        <span className="contract-label">Pièce d'identité :</span>
                        <input className="contract-field-value" value={contractForm.pieceIdentite} onChange={(e) => updateField('pieceIdentite', e.target.value)} />
                    </label>
                    <label className="contract-field">
                        <span className="contract-label">Adresse / résidence :</span>
                        <input className="contract-field-value" value={contractForm.adresseResidence} onChange={(e) => updateField('adresseResidence', e.target.value)} />
                    </label>
                    <label className="contract-field">
                        <span className="contract-label">Village / site :</span>
                        <input className="contract-field-value" value={contractForm.village} onChange={(e) => updateField('village', e.target.value)} />
                    </label>
                    <label className="contract-field">
                        <span className="contract-label">Groupement :</span>
                        <input className="contract-field-value" value={contractForm.groupement} onChange={(e) => updateField('groupement', e.target.value)} />
                    </label>
                    <label className="contract-field">
                        <span className="contract-label">Territoire :</span>
                        <input className="contract-field-value" value={contractForm.territoire} onChange={(e) => updateField('territoire', e.target.value)} />
                    </label>
                    <label className="contract-field">
                        <span className="contract-label">Province :</span>
                        <input className="contract-field-value" value={contractForm.province} onChange={(e) => updateField('province', e.target.value)} />
                    </label>
                    <label className="contract-field">
                        <span className="contract-label">Code bénéficiaire :</span>
                        <input className="contract-field-value" value={contractForm.codeBeneficiaire} onChange={(e) => updateField('codeBeneficiaire', e.target.value)} />
                    </label>
                </div>
            </div>

            <div className="contract-section">
                <p className="contract-soft-title">État de victimisation (prima facie)</p>
                <div className="space-y-2">
                    {etats.map((etat) => (
                        <label key={etat.value} className="flex items-start">
                            <input
                                type="checkbox"
                                checked={consentements.etatVictimisation === etat.value}
                                onChange={(e) => setConsentements({ ...consentements, etatVictimisation: e.target.checked ? etat.value : '' })}
                                className={checkboxClass}
                            />
                            <span>{etat.label}</span>
                        </label>
                    ))}
                    <label className="flex items-start">
                        <input
                            type="checkbox"
                            checked={consentements.situationVulnerabiliteUrgente}
                            onChange={(e) => setConsentements({ ...consentements, situationVulnerabiliteUrgente: e.target.checked })}
                            className={checkboxClass}
                        />
                        <span>Elle se trouve dans une situation de vulnérabilité nécessitant une réponse urgente.</span>
                    </label>
                </div>
            </div>

            <div className="contract-section">
                <p className="contract-soft-title">Mesures provisoires urgentes proposées</p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {Object.entries(groupedMesures).map(([group, mesures]) => (
                        <div key={group} className="page-break-avoid">
                            <p className="mb-2 font-bold text-gray-900">{group}</p>
                            <div className="space-y-2">
                                {mesures.map((mesure) => (
                                    <label key={mesure.key} className="flex items-start">
                                        <input
                                            type="checkbox"
                                            checked={consentements.mesuresProposees[mesure.key]}
                                            onChange={(e) => updateMesure(mesure.key, e.target.checked)}
                                            className={checkboxClass}
                                        />
                                        <span>{mesure.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <label className="mt-3 flex items-end gap-2">
                    <span>Autres mesures :</span>
                    <input
                        className={`${inputClass} flex-1`}
                        value={consentements.autresMesures}
                        onChange={(e) => setConsentements({ ...consentements, autresMesures: e.target.value })}
                    />
                </label>
            </div>

            <div className="contract-section">
                <p className="contract-soft-title">Vulnérabilités</p>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {MPU_VULNERABILITES.map((vulnerabilite) => (
                        <label key={vulnerabilite.key} className="flex items-start">
                            <input
                                type="checkbox"
                                checked={consentements.vulnerabilites[vulnerabilite.key]}
                                onChange={(e) => updateVulnerabilite(vulnerabilite.key, e.target.checked)}
                                className={checkboxClass}
                            />
                            <span>{vulnerabilite.label}</span>
                        </label>
                    ))}
                </div>
                <label className="mt-3 flex items-end gap-2">
                    <span>Autres vulnérabilités :</span>
                    <input
                        className={`${inputClass} flex-1`}
                        value={consentements.autresVulnerabilites}
                        onChange={(e) => setConsentements({ ...consentements, autresVulnerabilites: e.target.value })}
                    />
                </label>
            </div>

            <div className="contract-section">
                <p className="contract-soft-title">Informations complémentaires et consentement</p>
                <div className="space-y-2">
                    <label className="flex items-start">
                        <input type="checkbox" checked={consentements.informeMpu} onChange={(e) => setConsentements({ ...consentements, informeMpu: e.target.checked })} className={checkboxClass} />
                        <span>Le bénéficiaire a reçu les informations sur les MPU.</span>
                    </label>
                    <label className="flex items-start">
                        <input type="checkbox" checked={consentements.droitsExpliques} onChange={(e) => setConsentements({ ...consentements, droitsExpliques: e.target.checked })} className={checkboxClass} />
                        <span>Ses droits, obligations, recours et mécanismes de plainte lui ont été expliqués.</span>
                    </label>
                    <label className="flex items-start">
                        <input type="checkbox" checked={consentements.exerceDroit} onChange={(e) => setConsentements({ ...consentements, exerceDroit: e.target.checked, comprisDroit: e.target.checked ? false : consentements.comprisDroit })} className={checkboxClass} />
                        <span>Avoir exercé ce droit.</span>
                    </label>
                    <label className="flex items-start">
                        <input type="checkbox" checked={consentements.comprisDroit} onChange={(e) => setConsentements({ ...consentements, comprisDroit: e.target.checked, exerceDroit: e.target.checked ? false : consentements.exerceDroit })} className={checkboxClass} />
                        <span>Avoir compris ce droit mais avoir choisi de ne pas y recourir.</span>
                    </label>
                    <label className="flex items-start">
                        <input type="checkbox" checked={consentements.engagementsAcceptes} onChange={(e) => setConsentements({ ...consentements, engagementsAcceptes: e.target.checked })} className={checkboxClass} />
                        <span>Accepte les engagements liés aux biens, activités, informations et suivi du programme.</span>
                    </label>
                </div>
            </div>

            <div className="contract-section">
                <p className="contract-soft-title">Droit à l'accompagnement</p>
                <div className="space-y-2">
                    <label className="flex items-start">
                        <input type="checkbox" checked={consentements.mediateurFonarev} onChange={(e) => setConsentements({ ...consentements, mediateurFonarev: e.target.checked, faireMediateur: e.target.checked })} className={checkboxClass} />
                        <span>Solliciter les services du Médiateur du FONAREV.</span>
                    </label>
                    <label className="flex items-start">
                        <input type="checkbox" checked={consentements.accompagnementPersonneConfiance} onChange={(e) => setConsentements({ ...consentements, accompagnementPersonneConfiance: e.target.checked, avocat: e.target.checked })} className={checkboxClass} />
                        <span>Être accompagné par une organisation ou une personne de confiance de son choix.</span>
                    </label>
                </div>
            </div>

            <div className="contract-section page-break-avoid">
                <p className="contract-soft-title">Cas des personnes ne pouvant consentir seules</p>
                <label className="flex items-start">
                    <input
                        type="checkbox"
                        checked={consentements.incapaciteConsentir}
                        onChange={(e) => {
                            const checked = e.target.checked;
                            setConsentements({ ...consentements, incapaciteConsentir: checked, consentementRepresentant: checked });
                            if (!checked) setRepresentant({ nom: '', qualite: '', organisation: '', pieceIdentite: '' });
                        }}
                        className={checkboxClass}
                    />
                    <span>Le consentement est donné par un représentant.</span>
                </label>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="contract-field">
                        <span className="contract-label">Nom du représentant :</span>
                        <input className="contract-field-value" value={representant.nom} onChange={(e) => setRepresentant({ ...representant, nom: e.target.value })} />
                    </label>
                    <label className="contract-field">
                        <span className="contract-label">Qualité :</span>
                        <input className="contract-field-value" value={representant.qualite} onChange={(e) => setRepresentant({ ...representant, qualite: e.target.value })} />
                    </label>
                    <label className="contract-field">
                        <span className="contract-label">Organisation :</span>
                        <input className="contract-field-value" value={representant.organisation} onChange={(e) => setRepresentant({ ...representant, organisation: e.target.value })} />
                    </label>
                    <label className="contract-field">
                        <span className="contract-label">Pièce d'identité :</span>
                        <input className="contract-field-value" value={representant.pieceIdentite} onChange={(e) => setRepresentant({ ...representant, pieceIdentite: e.target.value })} />
                    </label>
                </div>
            </div>

            <div className="contract-section page-break-avoid">
                <p className="contract-soft-title">Déclaration de consentement</p>
                <div className="space-y-2">
                    <label className="flex items-start">
                        <input
                            type="checkbox"
                            checked={consentements.accepteReparation}
                            onChange={(e) => setConsentements({ ...consentements, accepteReparation: e.target.checked, refuseReparation: e.target.checked ? false : consentements.refuseReparation })}
                            className={checkboxClass}
                        />
                        <span>J'accepte de bénéficier des Mesures Provisoires Urgentes proposées par le FONAREV.</span>
                    </label>
                    <label className="flex items-start">
                        <input
                            type="checkbox"
                            checked={consentements.refuseReparation}
                            onChange={(e) => setConsentements({ ...consentements, refuseReparation: e.target.checked, accepteReparation: e.target.checked ? false : consentements.accepteReparation })}
                            className={checkboxClass}
                        />
                        <span>Je refuse de bénéficier des Mesures Provisoires Urgentes proposées.</span>
                    </label>
                </div>
                <p className="mt-3">
                    Je reconnais que ce consentement est donné librement, sans contrainte, après avoir compris
                    la nature et la portée des mesures proposées.
                </p>
            </div>
        </div>
    );
};
