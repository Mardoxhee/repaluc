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
import { ContractTemplateSelector } from './ContractTemplateSelector';
import { ReparationMeasuresSection } from './ReparationMeasuresSection';
import { MpuConsentementForm } from './MpuConsentementForm';

const ContratVictim: React.FC<ContratVictimProps> = ({ victim }) => {
    const {
        tranches,
        consentements,
        representant,
        contractForm,
        selectedTemplateId,
        selectedTemplateBareme,
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
        prejudiceOptions,
        setConsentements,
        setRepresentant,
        setContractForm,
        setShowContratDetail,
        setShowSignatureModal,
        startDrawing,
        draw,
        stopDrawing,
        clearSignature,
        addTranche,
        removeTranche,
        updateTranche,
        selectFinalPrejudice,
        saveContract,
        exportToPDF,
        isMpuConsentement,
    } = useContrat(victim);
    const usesLegacyContractText = selectedTemplateId === 'luc-decision-justice';
    const documentLabel = isMpuConsentement ? 'Acte de consentement MPU' : 'Contrat de réparation';
    const documentActionLabel = isMpuConsentement ? "l’acte de consentement MPU" : 'le contrat';

    return (
        <>
            <style jsx global>{`
                #contrat-content {
                    width: 100%;
                    max-width: none;
                    margin: 0;
                    background: #ffffff;
                    color: #111827;
                    font-family: Arial, Helvetica, sans-serif;
                    font-size: 12px;
                    font-weight: 600;
                    line-height: 1.45;
                    padding: 18px 24px 28px;
                    box-shadow: none;
                }
                #contrat-content .font-semibold {
                    font-weight: 600 !important;
                }
                #contrat-content .font-bold {
                    font-weight: 700 !important;
                }
                #contrat-content .font-extrabold,
                #contrat-content .font-black {
                    font-weight: 700 !important;
                }
                #contrat-content .contract-section {
                    margin-bottom: 18px;
                }
                #contrat-content .contract-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                    column-gap: 22px;
                    row-gap: 9px;
                }
                #contrat-content .contract-field {
                    display: grid;
                    grid-template-columns: max-content minmax(0, 1fr);
                    align-items: end;
                    gap: 7px;
                    min-width: 0;
                }
                #contrat-content .contract-field.contract-field-stacked {
                    display: block;
                }
                #contrat-content .contract-label {
                    font-weight: 700;
                    color: #111827;
                    white-space: nowrap;
                }
                #contrat-content .contract-field-value,
                #contrat-content input[type='text'],
                #contrat-content input[type='number'],
                #contrat-content input[type='date'] {
                    min-width: 0;
                    width: 100%;
                    border: 0;
                    border-bottom: 1px dotted #9ca3af;
                    background: transparent;
                    color: #374151;
                    font-family: 'Courier New', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    font-size: 15px;
                    font-weight: 400;
                    letter-spacing: 0;
                    line-height: 1.35;
                    min-height: 20px;
                    padding: 0 3px 2px;
                    outline: none;
                    overflow: visible;
                    text-overflow: ellipsis;
                }
                #contrat-content input[type='date'].contract-field-value {
                    min-width: 120px;
                }
                #contrat-content input[type='checkbox'] {
                    width: 12px;
                    height: 12px;
                    accent-color: #1d4ed8;
                    flex: 0 0 auto;
                }
                #contrat-content .contract-soft-title {
                    margin: 20px 0 10px;
                    padding: 7px 10px;
                    border-left: 4px solid #1d4ed8;
                    background: #eff6ff;
                    color: #172554;
                    font-weight: 800;
                    letter-spacing: 0.01em;
                }
                #contrat-content .signature-box {
                    width: 100%;
                    min-height: 92px;
                    max-height: 118px;
                    border: 1.5px solid #9ca3af;
                    padding: 8px;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
                #contrat-content .signature-box img {
                    max-width: 100% !important;
                    max-height: 98px !important;
                    object-fit: contain;
                }
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    #contrat-content {
                        width: 210mm;
                        max-width: 210mm;
                        margin: 0 auto;
                        padding: 12mm 14mm;
                        box-shadow: none;
                    }
                }
                #contrat-content.pdf-export-mode {
                    width: 210mm !important;
                    max-width: 210mm !important;
                    margin: 0 auto !important;
                    background-color: #ffffff !important;
                    color: #111827 !important;
                    box-shadow: none !important;
                    padding: 12mm 14mm !important;
                }
                #contrat-content.pdf-export-mode * {
                    border-color: #d1d5db !important;
                    box-shadow: none !important;
                    text-shadow: none !important;
                }
                #contrat-content.pdf-export-mode,
                #contrat-content.pdf-export-mode .text-gray-600,
                #contrat-content.pdf-export-mode .text-gray-700,
                #contrat-content.pdf-export-mode .text-gray-800,
                #contrat-content.pdf-export-mode .text-gray-900,
                #contrat-content.pdf-export-mode .text-gray-950 {
                    color: #111827 !important;
                }
                #contrat-content.pdf-export-mode .text-blue-600,
                #contrat-content.pdf-export-mode .text-blue-700,
                #contrat-content.pdf-export-mode .text-blue-800,
                #contrat-content.pdf-export-mode .text-blue-900,
                #contrat-content.pdf-export-mode .text-blue-950 {
                    color: #1e3a8a !important;
                }
                #contrat-content.pdf-export-mode .bg-white {
                    background-color: #ffffff !important;
                }
                #contrat-content.pdf-export-mode .bg-blue-50,
                #contrat-content.pdf-export-mode .bg-gray-50,
                #contrat-content.pdf-export-mode .bg-gray-100 {
                    background-color: #f8fafc !important;
                }
                .page-break-avoid {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
            `}</style>

            <div className="bg-white text-gray-900 w-full">
                {/* Indicateur de chargement */}
                {loadingContrat && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="ml-4 text-gray-600">Chargement de {documentActionLabel}...</p>
                    </div>
                )}

                {/* Liste des contrats si un contrat existe et qu'on n'affiche pas le détail */}
                {!loadingContrat && existingContrat && !showContratDetail && (
                    <div className="w-full px-4 py-4">
                        <h2 className="text-lg font-semibold text-blue-600 mb-4">
                            {isMpuConsentement ? 'Acte de consentement' : 'Liste des contrats'}
                        </h2>
                        <div
                            onClick={() => setShowContratDetail(true)}
                            className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 cursor-pointer transition-colors flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <FileText className="text-blue-600" size={24} />
                                <div>
                                    <p className="font-semibold text-gray-800">{documentLabel}</p>
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
                    <div className="w-full p-3 sm:p-4">
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
                            {existingContrat && (
                                <button
                                    onClick={saveContract}
                                    disabled={isSaving}
                                    className="ml-2 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                                </button>
                            )}
                        </div>

                        <div id="contrat-content">
                            <ContratHeader />

                            {isMpuConsentement ? (
                                <MpuConsentementForm
                                    contractForm={contractForm}
                                    setContractForm={setContractForm}
                                    consentements={consentements}
                                    setConsentements={setConsentements}
                                    representant={representant}
                                    setRepresentant={setRepresentant}
                                />
                            ) : (
                                <>
                                    <ContractTemplateSelector
                                        selectedTemplateId={selectedTemplateId}
                                        selectedPrejudiceLabel={contractForm.prejudiceFinal}
                                    />

                                    <VictimInfo
                                        victim={victim}
                                        selectedTemplateBareme={selectedTemplateBareme}
                                        useLegacyContractText={usesLegacyContractText}
                                        contractForm={contractForm}
                                        setContractForm={setContractForm}
                                        consentements={consentements}
                                        setConsentements={setConsentements}
                                        representant={representant}
                                        setRepresentant={setRepresentant}
                                        selectFinalPrejudice={selectFinalPrejudice}
                                        prejudiceOptions={prejudiceOptions}
                                        totalMontant={totalMontant}
                                    />

                                    <TranchesSection
                                        tranches={tranches}
                                        totalMontant={totalMontant}
                                        addTranche={addTranche}
                                        removeTranche={removeTranche}
                                        updateTranche={updateTranche}
                                        useLegacyLayout={usesLegacyContractText}
                                    />

                                    {!usesLegacyContractText && (
                                        <ReparationMeasuresSection
                                            consentements={consentements}
                                            setConsentements={setConsentements}
                                        />
                                    )}

                                    <ConsentementsSection
                                        consentements={consentements}
                                        setConsentements={setConsentements}
                                        useLegacyContractText={usesLegacyContractText}
                                    />
                                </>
                            )}

                            <SignaturesSection
                                victim={victim}
                                contractForm={contractForm}
                                setContractForm={setContractForm}
                                existingContrat={existingContrat}
                                signatureUrl={signatureUrl}
                                formattedSignatureDate={formattedSignatureDate}
                                saveMessage={saveMessage}
                                pendingOfflineContrat={pendingOfflineContrat}
                                setShowSignatureModal={setShowSignatureModal}
                                useLegacyContractText={usesLegacyContractText}
                                documentLabel={documentLabel}
                                documentActionLabel={documentActionLabel}
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
                    documentLabel={documentLabel}
                    documentActionLabel={documentActionLabel}
                    onClose={() => setShowSignatureModal(false)}
                />
            )}
        </>
    );
};

export default ContratVictim;
