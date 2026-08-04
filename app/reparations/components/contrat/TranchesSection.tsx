'use client';
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Tranche } from './types';

interface TranchesSectionProps {
    tranches: Tranche[];
    totalMontant: number;
    addTranche: () => void;
    removeTranche: (id: string) => void;
    updateTranche: (id: string, field: 'periode' | 'montant', value: string) => void;
    useLegacyLayout?: boolean;
}

export const TranchesSection: React.FC<TranchesSectionProps> = ({
    tranches,
    totalMontant,
    addTranche,
    removeTranche,
    updateTranche,
    useLegacyLayout = false,
}) => {
    if (useLegacyLayout) {
        return (
            <div className="mb-6 page-break-avoid">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm">Tranches</h3>
                    <button
                        onClick={addTranche}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors no-print"
                    >
                        <Plus size={16} />
                        Ajouter une tranche
                    </button>
                </div>

                <p className="text-sm mb-2">Nombre : {tranches.length}</p>

                <div className="border border-gray-300 overflow-x-auto page-break-avoid">
                    <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                        <thead>
                            <tr className="bg-gray-100 border-b border-gray-300">
                                <th className="border-r border-gray-300 px-3 py-2 text-left font-semibold">Période</th>
                                {tranches.map((tranche) => (
                                    <th key={tranche.id} className="border-r border-gray-300 px-2 py-2 text-center font-semibold" style={{ width: '90px' }}>
                                        <input
                                            type="text"
                                            value={tranche.periode}
                                            onChange={(e) => updateTranche(tranche.id, 'periode', e.target.value)}
                                            className="w-full text-center bg-transparent outline-none font-semibold text-xs"
                                            placeholder="Période"
                                        />
                                    </th>
                                ))}
                                <th className="px-3 py-2 text-center font-semibold no-print">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-gray-300">
                                <td className="border-r border-gray-300 px-3 py-2 font-semibold">Somme (en USD)</td>
                                {tranches.map((tranche) => (
                                    <td key={tranche.id} className="border-r border-gray-300 px-2 py-2 text-center">
                                        <input
                                            type="number"
                                            value={tranche.montant}
                                            onChange={(e) => updateTranche(tranche.id, 'montant', e.target.value)}
                                            className="w-full text-center bg-transparent outline-none text-xs"
                                            placeholder="0"
                                        />
                                    </td>
                                ))}
                                <td className="px-3 py-2 no-print"></td>
                            </tr>
                            <tr>
                                <td className="px-3 py-2"></td>
                                {tranches.map((tranche) => (
                                    <td key={tranche.id} className="px-2 py-2 text-center">
                                        <button
                                            onClick={() => removeTranche(tranche.id)}
                                            className="text-red-600 hover:text-red-800 p-1 no-print"
                                            title="Supprimer"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-center font-semibold">Total: {totalMontant} USD</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-6 page-break-avoid">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="font-bold text-sm text-gray-950">Modalités de versement</h3>
                    <p className="text-xs text-gray-600">Nombre de tranches : {tranches.length}</p>
                </div>
                <button
                    onClick={addTranche}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors no-print"
                >
                    <Plus size={16} />
                    Ajouter une tranche
                </button>
            </div>

            <div className="overflow-hidden border border-gray-300 page-break-avoid">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-blue-50 border-b border-gray-300">
                            <th className="w-16 border-r border-gray-300 px-3 py-2 text-left font-bold text-blue-950">N°</th>
                            <th className="border-r border-gray-300 px-3 py-2 text-left font-bold text-blue-950">Période</th>
                            <th className="w-44 border-r border-gray-300 px-3 py-2 text-right font-bold text-blue-950">Somme (USD)</th>
                            <th className="w-20 px-3 py-2 text-center font-bold text-blue-950 no-print">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tranches.map((tranche, index) => (
                            <tr key={tranche.id} className="border-b border-gray-200 last:border-b-0">
                                <td className="border-r border-gray-200 px-3 py-2 font-semibold text-gray-700">
                                    {index + 1}
                                </td>
                                <td className="border-r border-gray-200 px-3 py-2">
                                    <input
                                        type="text"
                                        value={tranche.periode}
                                        onChange={(e) => updateTranche(tranche.id, 'periode', e.target.value)}
                                        className="w-full bg-transparent outline-none text-sm"
                                        placeholder="Période de paiement"
                                    />
                                </td>
                                <td className="border-r border-gray-200 px-3 py-2">
                                    <input
                                        type="number"
                                        value={tranche.montant}
                                        onChange={(e) => updateTranche(tranche.id, 'montant', e.target.value)}
                                        className="w-full bg-transparent text-right outline-none text-sm font-semibold"
                                        placeholder="0"
                                    />
                                </td>
                                <td className="px-3 py-2 text-center no-print">
                                    <button
                                        onClick={() => removeTranche(tranche.id)}
                                        className="text-red-600 hover:text-red-800 p-1 no-print"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        <tr className="bg-gray-50">
                            <td colSpan={2} className="border-r border-gray-300 px-3 py-2 text-right font-bold">
                                Total
                            </td>
                            <td className="border-r border-gray-300 px-3 py-2 text-right font-black text-gray-950">
                                {totalMontant.toLocaleString('fr-FR')} USD
                            </td>
                            <td className="px-3 py-2 no-print" />
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};
