'use client';
import React from 'react';
import { X, Eraser } from 'lucide-react';
import { Contrat } from './types';

interface SignatureModalProps {
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    existingContrat: Contrat | null;
    isSaving: boolean;
    startDrawing: (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => void;
    draw: (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => void;
    stopDrawing: () => void;
    clearSignature: () => void;
    saveContract: () => Promise<void>;
    onClose: () => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
    canvasRef,
    existingContrat,
    isSaving,
    startDrawing,
    draw,
    stopDrawing,
    clearSignature,
    saveContract,
    onClose,
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white w-full max-w-3xl mx-4 rounded-lg shadow-xl relative">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-800">Signature du contrat</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded hover:bg-gray-100 text-gray-500"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="p-4">
                    <p className="text-sm text-gray-600 mb-3">
                        Merci de dessiner la signature ou l'empreinte de la victime dans l'espace ci-dessous.
                    </p>
                    <div className="signature-box relative inline-block w-full">
                        <canvas
                            ref={canvasRef}
                            width={800}
                            height={300}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            className="cursor-crosshair bg-white w-full"
                            style={{ display: 'block', touchAction: 'none' }}
                        />
                        <button
                            onClick={clearSignature}
                            className="absolute top-2 right-2 p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors no-print"
                            title="Effacer la signature"
                            type="button"
                        >
                            <Eraser size={16} />
                        </button>
                    </div>
                    <div className="mt-4 flex justify-end gap-2 no-print">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            Fermer
                        </button>
                        {!existingContrat && (
                            <button
                                type="button"
                                onClick={async () => {
                                    await saveContract();
                                    onClose();
                                }}
                                disabled={isSaving}
                                className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Sauvegarde...' : 'Sauvegarder le contrat'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
