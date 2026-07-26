'use client';
import React from 'react';
import { FileText } from 'lucide-react';
import { CONTRACT_TEMPLATES } from './contractTemplates';
import type { ContractTemplateId } from './types';

interface ContractTemplateSelectorProps {
    selectedTemplateId: ContractTemplateId;
    onSelectTemplate: (templateId: ContractTemplateId) => void;
}

export const ContractTemplateSelector: React.FC<ContractTemplateSelectorProps> = ({
    selectedTemplateId,
    onSelectTemplate,
}) => (
    <div className="no-print mb-6 border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-center gap-2 text-blue-900 mb-3">
            <FileText size={18} />
            <h3 className="text-sm font-semibold">Modèle de contrat à faire signer</h3>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
            {CONTRACT_TEMPLATES.map((template) => {
                const isSelected = template.id === selectedTemplateId;

                return (
                    <label
                        key={template.id}
                        className={`flex cursor-pointer items-start gap-3 border p-3 text-sm transition-colors ${
                            isSelected
                                ? 'border-blue-500 bg-white text-blue-950'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200'
                        }`}
                    >
                        <input
                            type="radio"
                            name="contract-template"
                            checked={isSelected}
                            onChange={() => onSelectTemplate(template.id)}
                            className="mt-1"
                        />
                        <span>
                            <span className="block font-semibold">{template.label}</span>
                            <span className="block text-xs text-gray-600">{template.prejudiceLabel}</span>
                        </span>
                    </label>
                );
            })}
        </div>
    </div>
);
