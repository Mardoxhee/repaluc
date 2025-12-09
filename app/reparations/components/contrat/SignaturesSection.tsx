'use client';
import React from 'react';
import { Clock, Wifi } from 'lucide-react';
import { Victim, Contrat, SaveMessage } from './types';
import { PendingContract } from '../../../utils/contractsCache';

interface SignaturesSectionProps {
    victim: Victim;
    existingContrat: Contrat | null;
    signatureUrl: string;
    formattedSignatureDate: string;
    saveMessage: SaveMessage | null;
    pendingOfflineContrat: PendingContract | null;
    setShowSignatureModal: (show: boolean) => void;
}

export const SignaturesSection: React.FC<SignaturesSectionProps> = ({
    victim,
    existingContrat,
    signatureUrl,
    formattedSignatureDate,
    saveMessage,
    pendingOfflineContrat,
    setShowSignatureModal,
}) => {
    return (
        <>
            {/* Section signatures */}
            <div className="mt-8 grid grid-cols-2 gap-8">
                <div>
                    <p className="text-sm mb-2">
                        Fait à <span className="border-b border-dotted border-gray-400 inline-block w-32">{victim.territoire || ''}</span>, le <span className="border-b border-dotted border-gray-400 inline-block w-32">{formattedSignatureDate}</span>
                    </p>
                    <div className="mt-6">
                        <p className="font-bold text-sm mb-2">Pour le FONAREV</p>
                        <p className="text-sm">Nom : FATA MAKUNGA Patrick</p>
                        <p className="text-sm">Fonction : Directeur Général</p>
                        <p className="text-sm mt-4">Signature :</p>
                        <div className="border-b border-gray-400 w-48 mt-8"></div>
                    </div>
                </div>

                <div>
                    <div className="mt-12">
                        <p className="font-bold text-sm mb-2">Le/la bénéficiaire</p>
                        <p className="text-sm mb-4">
                            Nom : <span className="border-b border-dotted border-gray-400 inline-block ">{victim.nom || ''}</span>
                        </p>
                        <div className="mb-2">
                            <p className="text-sm mb-2">Signature ou empreinte :</p>
                            <p className="text-xs italic text-gray-600 mb-2">(précédée de la mention LU ET APPROUVÉ)</p>

                            {existingContrat && signatureUrl ? (
                                <div className="signature-box inline-block">
                                    <img
                                        src={signatureUrl}
                                        alt="Signature"
                                        className="max-w-full h-auto"
                                        style={{ maxWidth: '500px', maxHeight: '300px' }}
                                    />
                                </div>
                            ) : pendingOfflineContrat ? (
                                <div className="no-print p-4 bg-amber-50 border border-amber-200 rounded-lg">
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
                                    className="no-print inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                                >
                                    Signer le contrat
                                </button>
                            )}
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
