'use client';
import React from 'react';
import { Clock, Wifi } from 'lucide-react';
import type { Victim, Contrat, SaveMessage, ContractForm } from './types';
import type { PendingContract } from '../../../utils/contractsCache';

interface SignaturesSectionProps {
    victim: Victim;
    contractForm: ContractForm;
    setContractForm: React.Dispatch<React.SetStateAction<ContractForm>>;
    existingContrat: Contrat | null;
    signatureUrl: string;
    formattedSignatureDate: string;
    saveMessage: SaveMessage | null;
    pendingOfflineContrat: PendingContract | null;
    setShowSignatureModal: (show: boolean) => void;
    useLegacyContractText?: boolean;
}

export const SignaturesSection: React.FC<SignaturesSectionProps> = ({
    victim,
    contractForm,
    setContractForm,
    existingContrat,
    signatureUrl,
    formattedSignatureDate,
    saveMessage,
    pendingOfflineContrat,
    setShowSignatureModal,
    useLegacyContractText = false,
}) => {
    const updateField = (field: keyof ContractForm, value: string) => {
        setContractForm((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <>
            {/* Section signatures */}
            <div className="mt-8 page-break-avoid">
                <div className="mb-5">
                    <div className="grid grid-cols-2 gap-8 text-sm">
                        <label className="flex min-w-0 items-end gap-2">
                            <span className="shrink-0">Fait à</span>
                            <input
                                type="text"
                                value={contractForm.lieuSignature}
                                onChange={(e) => updateField('lieuSignature', e.target.value)}
                                className="min-w-0 flex-1 border-b border-dotted border-gray-400 bg-transparent px-1 py-0.5 text-sm outline-none"
                            />
                        </label>
                        <label className="flex min-w-0 items-end gap-3">
                            <span>, le</span>
                            <input
                                type="date"
                                value={contractForm.dateSignature}
                                onChange={(e) => updateField('dateSignature', e.target.value)}
                                className="min-w-0 flex-1 border-b border-dotted border-gray-400 bg-transparent px-1 py-0.5 text-sm outline-none"
                            />
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-12">
                    <div>
                        <div className="border-t-2 border-blue-700 pt-3">
                            <p className="font-bold text-sm mb-3 text-blue-950">Pour le FONAREV</p>
                            <label className="mb-2 flex items-end gap-2 text-sm">
                                <span>Nom :</span>
                                <input
                                    type="text"
                                    value={contractForm.fonarevNom}
                                    onChange={(e) => updateField('fonarevNom', e.target.value)}
                                    className="min-w-0 flex-1 border-b border-dotted border-gray-400 bg-transparent px-1 outline-none"
                                />
                            </label>
                            <label className="mb-5 flex items-end gap-2 text-sm">
                                <span>Fonction :</span>
                                <input
                                    type="text"
                                    value={contractForm.fonarevFonction}
                                    onChange={(e) => updateField('fonarevFonction', e.target.value)}
                                    className="min-w-0 flex-1 border-b border-dotted border-gray-400 bg-transparent px-1 outline-none"
                                />
                            </label>
                            <p className="text-sm mt-4">Signature :</p>
                            <div className="mt-10 w-56 border-b border-gray-400"></div>
                        </div>
                    </div>

                    <div>
                        <div className="border-t-2 border-blue-700 pt-3">
                            <p className="font-bold text-sm mb-3 text-blue-950">Le/la bénéficiaire</p>
                            <label className="mb-4 flex items-end gap-2 text-sm">
                                <span>Nom :</span>
                                <input
                                    type="text"
                                    value={contractForm.nom || victim.nom || ''}
                                    onChange={(e) => updateField('nom', e.target.value)}
                                    className="min-w-0 flex-1 border-b border-dotted border-gray-400 bg-transparent px-1 outline-none"
                                />
                            </label>
                            <div className="mb-2">
                                <p className="text-sm font-semibold">
                                    Signature ou empreinte{useLegacyContractText ? ' :' : ''}
                                </p>
                                <p className="text-xs italic text-gray-600 mb-2">
                                    {useLegacyContractText
                                        ? '(précédée de la mention LU ET APPROUVÉ)'
                                        : 'Précédée de la mention « LU ET APPROUVÉ »'}
                                </p>

                                {existingContrat && signatureUrl ? (
                                    <div className="signature-box">
                                        <img
                                            src={signatureUrl}
                                            alt="Signature"
                                            className="h-auto max-w-full"
                                        />
                                    </div>
                                ) : pendingOfflineContrat ? (
                                    <div className="no-print p-4 bg-amber-50 border border-amber-200">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="flex items-center justify-center w-10 h-10 bg-amber-100 rounded-full">
                                                <Clock className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-amber-800">Contrat signé hors ligne</p>
                                                <p className="text-sm text-amber-700">
                                                    Signé le {new Date(pendingOfflineContrat.createdAt).toLocaleDateString('fr-FR')} à {new Date(pendingOfflineContrat.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-amber-700 mt-3 pl-1">
                                            <Wifi className="w-4 h-4" />
                                            <span>En attente de synchronisation avec le serveur...</span>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setShowSignatureModal(true)}
                                        className="no-print inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        Signer le contrat
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Message de sauvegarde */}
            {saveMessage && (
                <div className={`mb-4 p-4 rounded no-print ${saveMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {saveMessage.text}
                </div>
            )}

            {existingContrat && (
                <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded no-print">
                    <p className="text-green-800 text-sm">
                        ✓ Contrat signé le {formattedSignatureDate}
                    </p>
                </div>
            )}
        </>
    );
};
