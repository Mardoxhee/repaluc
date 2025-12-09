'use client';
import React from 'react';
import { FileText, Download } from 'lucide-react';
import { ContratVictimProps } from './types';
import { useContrat } from './useContrat';
import { ContratHeader } from './ContratHeader';
import { VictimInfo } from './VictimInfo';
import { TranchesSection } from './TranchesSection';
import { ConsentementsSection } from './ConsentementsSection';
import { SignaturesSection } from './SignaturesSection';
import { SignatureModal } from './SignatureModal';

const ContratVictim: React.FC<ContratVictimProps> = ({ victim }) => {
    const {
        tranches,
        consentements,
        representant,
        canvasRef,
        isSaving,
        saveMessage,
        existingContrat,
        loadingContrat,
        signatureUrl,
        showContratDetail,
        showSignatureModal,
        formattedSignatureDate,
        totalMontant,
        pendingOfflineContrat,
        setConsentements,
        setRepresentant,
        setShowContratDetail,
        setShowSignatureModal,
        startDrawing,
        draw,
        stopDrawing,
        clearSignature,
        addTranche,
        removeTranche,
        updateTranche,
        saveContract,
        exportToPDF,
    } = useContrat(victim);

    return (
        <>
            <style jsx global>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    #contrat-content {
                        max-width: 100%;
                        padding: 20px;
                    }
                }
                .page-break-avoid {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
                .signature-box {
                    border: 2px solid #9ca3af;
                    padding: 8px;
                    background: white;
                    display: inline-block;
                }
            `}</style>

            <div className="bg-white text-gray-900 w-full">
                {/* Indicateur de chargement */}
                {loadingContrat && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="ml-4 text-gray-600">Chargement du contrat...</p>
                    </div>
                )}

                {/* Liste des contrats si un contrat existe et qu'on n'affiche pas le détail */}
                {!loadingContrat && existingContrat && !showContratDetail && (
                    <div className="w-full px-4 py-4">
                        <h2 className="text-lg font-semibold text-blue-600 mb-4">Liste des contrats</h2>
                        <div
                            onClick={() => setShowContratDetail(true)}
                            className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 cursor-pointer transition-colors flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <FileText className="text-blue-600" size={24} />
                                <div>
                                    <p className="font-semibold text-gray-800">Contrat de réparation</p>
                                    <p className="text-sm text-gray-600">
                                        Signé le {new Date(existingContrat.dateSignature).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                )}

                {/* Affichage du détail du contrat ou formulaire de création */}
                {!loadingContrat && (!existingContrat || showContratDetail) && (
                    <div className="max-w-5xl mx-auto p-8">
                        {/* Boutons d'action */}
                        <div className="flex justify-between items-center mb-4 no-print">
                            {existingContrat && (
                                <button
                                    onClick={() => setShowContratDetail(false)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300 transition-colors"
                                >
                                    ← Retour à la liste
                                </button>
                            )}
                            <button
                                onClick={exportToPDF}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors ml-auto"
                            >
                                <Download size={18} />
                                Exporter en PDF
                            </button>
                        </div>

                        <div id="contrat-content">
                            <ContratHeader />

                            <VictimInfo
                                victim={victim}
                                representant={representant}
                                setRepresentant={setRepresentant}
                            />

                            <TranchesSection
                                tranches={tranches}
                                totalMontant={totalMontant}
                                addTranche={addTranche}
                                removeTranche={removeTranche}
                                updateTranche={updateTranche}
                            />

                            <ConsentementsSection
                                consentements={consentements}
                                setConsentements={setConsentements}
                            />

                            <SignaturesSection
                                victim={victim}
                                existingContrat={existingContrat}
                                signatureUrl={signatureUrl}
                                formattedSignatureDate={formattedSignatureDate}
                                saveMessage={saveMessage}
                                pendingOfflineContrat={pendingOfflineContrat}
                                setShowSignatureModal={setShowSignatureModal}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de signature */}
            {showSignatureModal && (
                <SignatureModal
                    canvasRef={canvasRef}
                    existingContrat={existingContrat}
                    isSaving={isSaving}
                    startDrawing={startDrawing}
                    draw={draw}
                    stopDrawing={stopDrawing}
                    clearSignature={clearSignature}
                    saveContract={saveContract}
                    onClose={() => setShowSignatureModal(false)}
                />
            )}
        </>
    );
};

export default ContratVictim;
