'use client';
import React from 'react';
import { FileText } from 'lucide-react';
import { getContractTemplateBareme, getContractTemplateById } from './contractTemplates';
import type { ContractTemplateId } from './types';

interface ContractTemplateSelectorProps {
    selectedTemplateId: ContractTemplateId;
    selectedPrejudiceLabel: string;
}

export const ContractTemplateSelector: React.FC<ContractTemplateSelectorProps> = ({
    selectedTemplateId,
    selectedPrejudiceLabel,
}) => {
    const selectedTemplate = getContractTemplateById(selectedTemplateId);
    const selectedBareme = getContractTemplateBareme(selectedTemplateId, selectedPrejudiceLabel);

    return (
        <div className="no-print mb-6 border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center gap-2 text-blue-900 mb-3">
                <FileText size={18} />
                <h3 className="text-sm font-semibold">Modèle de contrat sélectionné automatiquement</h3>
            </div>

            <div className="border border-blue-200 bg-white p-3 text-sm text-blue-950">
                <span className="block font-semibold">{selectedTemplate.label}</span>
                <span className="block text-xs text-gray-600">{selectedBareme.prejudiceLabel}</span>
                <span className="mt-1 block text-xs text-gray-600">
                    {selectedBareme.amountUSD.toLocaleString('fr-FR')} USD · {selectedBareme.tranchesUSD.length} tranches
                </span>
            </div>
        </div>
    );
};
