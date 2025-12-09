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
}

export const TranchesSection: React.FC<TranchesSectionProps> = ({
    tranches,
    totalMontant,
    addTranche,
    removeTranche,
    updateTranche,
}) => {
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
                            <th className="px-3 py-2 text-center font-semibold">Actions</th>
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
                            <td className="px-3 py-2"></td>
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
};
