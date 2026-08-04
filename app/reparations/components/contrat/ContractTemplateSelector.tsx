'use client';
import React, { useEffect, useState } from 'react';
import { ChevronDown, FileText } from 'lucide-react';
import { CONTRACT_TEMPLATES, getContractTemplateBareme, normalizeText } from './contractTemplates';
import type { ContractTemplateId } from './types';

interface ContractTemplateSelectorProps {
    selectedTemplateId: ContractTemplateId;
    selectedPrejudiceLabel: string;
    onSelectTemplate: (templateId: ContractTemplateId, prejudiceLabel?: string) => void;
}

export const ContractTemplateSelector: React.FC<ContractTemplateSelectorProps> = ({
    selectedTemplateId,
    selectedPrejudiceLabel,
    onSelectTemplate,
}) => {
    const groupedTemplate = CONTRACT_TEMPLATES.find((template) => template.id === 'luc-decision-justice');
    const standaloneTemplates = CONTRACT_TEMPLATES.filter((template) => !template.baremes);
    const [isDjGroupOpen, setIsDjGroupOpen] = useState(selectedTemplateId === 'luc-decision-justice');
    const selectedBareme = getContractTemplateBareme(selectedTemplateId, selectedPrejudiceLabel);

    useEffect(() => {
        if (selectedTemplateId === 'luc-decision-justice') {
            setIsDjGroupOpen(true);
        }
    }, [selectedTemplateId]);

    return (
        <div className="no-print mb-6 border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center gap-2 text-blue-900 mb-3">
                <FileText size={18} />
                <h3 className="text-sm font-semibold">Modèle de contrat à faire signer</h3>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
                {standaloneTemplates.map((template) => {
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

                {groupedTemplate && (
                    <div className="md:col-span-2 border border-gray-200 bg-white">
                        <button
                            type="button"
                            onClick={() => setIsDjGroupOpen((open) => !open)}
                            className={`flex w-full items-center justify-between gap-3 p-3 text-left text-sm transition-colors ${
                                selectedTemplateId === groupedTemplate.id
                                    ? 'text-blue-950'
                                    : 'text-gray-700 hover:text-blue-900'
                            }`}
                            aria-expanded={isDjGroupOpen}
                        >
                            <span className="flex min-w-0 items-start gap-3">
                                <FileText size={18} className="mt-0.5 shrink-0 text-blue-700" />
                                <span className="min-w-0">
                                    <span className="block font-semibold">{groupedTemplate.label}</span>
                                    <span className="block text-xs text-gray-600">
                                        {groupedTemplate.baremes?.length || 0} modèles DJ disponibles
                                    </span>
                                </span>
                            </span>
                            <ChevronDown
                                size={18}
                                className={`shrink-0 text-gray-500 transition-transform ${isDjGroupOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {isDjGroupOpen && (
                            <div className="grid gap-2 border-t border-gray-200 bg-gray-50 p-3 md:grid-cols-2">
                                {groupedTemplate.baremes?.map((bareme) => {
                                    const isSelected = selectedTemplateId === groupedTemplate.id
                                        && normalizeText(selectedBareme.prejudiceLabel) === normalizeText(bareme.prejudiceLabel);

                                    return (
                                        <label
                                            key={bareme.prejudiceLabel}
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
                                                onChange={() => onSelectTemplate(groupedTemplate.id, bareme.prejudiceLabel)}
                                                className="mt-1"
                                            />
                                            <span className="min-w-0">
                                                <span className="block font-semibold">{bareme.prejudiceLabel}</span>
                                                <span className="block text-xs text-gray-600">
                                                    {bareme.amountUSD.toLocaleString('fr-FR')} USD · {bareme.tranchesUSD.length} tranches
                                                </span>
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
