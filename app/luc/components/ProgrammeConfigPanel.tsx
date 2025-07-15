"use client";
import React, { useState } from "react";

interface Programme {
    id: number;
    nom: string;
}
interface Prejudice {
    id: number;
    nom: string;
}
interface Mesure {
    id: number;
    nom: string;
}

interface ProgrammeConfigPanelProps {
    programmes: Programme[];
    prejudices: Prejudice[];
    mesures: Mesure[];
}

const ProgrammeConfigPanel: React.FC<ProgrammeConfigPanelProps> = ({ programmes, prejudices, mesures }) => {
    const [selectedProg, setSelectedProg] = useState<number | null>(null);
    const [selectedPrej, setSelectedPrej] = useState<number | null>(null);
    const [selectedMesure, setSelectedMesure] = useState<number | null>(null);
    const [configurations, setConfigurations] = useState<Array<{ programmeId: number, prejudiceId: number, mesureId: number }>>([]);

    const handleAddConfig = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!selectedProg || !selectedPrej || !selectedMesure) return;
        if (configurations.some(cfg => cfg.programmeId === selectedProg && cfg.prejudiceId === selectedPrej && cfg.mesureId === selectedMesure)) return;
        setConfigurations(prev => [...prev, { programmeId: selectedProg, prejudiceId: selectedPrej, mesureId: selectedMesure }]);
    };

    return (
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-100 col-span-1 md:col-span-2 mt-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Configuration programme</h2>
            <form className="flex flex-col md:flex-row gap-4 items-end mb-6" onSubmit={handleAddConfig}>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Programme</label>
                    <select
                        className="w-full border rounded px-3 py-2"
                        value={selectedProg ?? ''}
                        onChange={e => setSelectedProg(Number(e.target.value) || null)}
                        required
                    >
                        <option value="" disabled>Choisir un programme</option>
                        {programmes.map(prog => (
                            <option key={prog.id} value={prog.id}>{prog.nom}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Préjudice</label>
                    <select
                        className="w-full border rounded px-3 py-2"
                        value={selectedPrej ?? ''}
                        onChange={e => setSelectedPrej(Number(e.target.value) || null)}
                        required
                    >
                        <option value="" disabled>Choisir un préjudice</option>
                        {prejudices.map(prej => (
                            <option key={prej.id} value={prej.id}>{prej.nom}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mesure de réparation</label>
                    <select
                        className="w-full border rounded px-3 py-2"
                        value={selectedMesure ?? ''}
                        onChange={e => setSelectedMesure(Number(e.target.value) || null)}
                        required
                    >
                        <option value="" disabled>Choisir une mesure</option>
                        {mesures.map(mesure => (
                            <option key={mesure.id} value={mesure.id}>{mesure.nom}</option>
                        ))}
                    </select>
                </div>
                <button
                    type="submit"
                    className="px-6 py-2 rounded bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold shadow hover:scale-105 transition-transform"
                    disabled={!selectedProg || !selectedPrej || !selectedMesure}
                >Associer</button>
            </form>
            {/* Liste des programmes avec accordéons */}
            <div className="mt-2">
                {programmes.map(prog => {
                    const prejudicesForProg = configurations
                        .filter(cfg => cfg.programmeId === prog.id)
                        .map(cfg => cfg.prejudiceId);
                    const uniquePrejudices = Array.from(new Set(prejudicesForProg));
                    if (uniquePrejudices.length === 0) return null;
                    return (
                        <div key={prog.id} className="mb-4 border rounded-lg overflow-hidden">
                            <details>
                                <summary className="cursor-pointer px-4 py-3 bg-gray-50 font-semibold text-gray-700 text-base flex items-center group border-b border-gray-200">
                                    <span className="mr-2 font-medium text-gray-500">Programme :</span>
                                    <span>{prog.nom}</span>
                                    <span className="ml-auto transition-transform duration-200 group-open:rotate-90">
                                        <svg className="w-5 h-5 text-gray-400 group-open:text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </span>
                                </summary>
                                <div className="bg-white">
                                    {uniquePrejudices.map(prejId => {
                                        const prejudice = prejudices.find(p => p.id === prejId);
                                        const mesuresForPrej = configurations.filter(cfg => cfg.programmeId === prog.id && cfg.prejudiceId === prejId).map(cfg => cfg.mesureId);
                                        const uniqueMesures = Array.from(new Set(mesuresForPrej));
                                        return (
                                            <details key={prejId} className="border-t border-gray-100">
                                                <summary className="cursor-pointer px-6 py-2 bg-white text-gray-600 text-sm font-medium flex items-center group border-b border-gray-100">
                                                    <span className="mr-2 font-medium text-gray-400">Préjudice :</span>
                                                    <span>{prejudice ? prejudice.nom : 'Préjudice #' + prejId}</span>
                                                    <span className="ml-auto transition-transform duration-200 group-open:rotate-90">
                                                        <svg className="w-4 h-4 text-gray-300 group-open:text-pink-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </span>
                                                </summary>
                                                <ul className="pl-10 py-2 text-sm border-l border-gray-100 bg-white">
                                                    {uniqueMesures.map(mesureId => {
                                                        const mesure = mesures.find(m => m.id === mesureId);
                                                        return (
                                                            <li key={mesureId} className="py-1 px-2 text-gray-500 flex items-center gap-2 border-b border-gray-100 last:border-b-0">
                                                                <span className="font-medium text-gray-300">Mesure :</span>
                                                                <span>{mesure ? mesure.nom : 'Mesure #' + mesureId}</span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </details>
                                        );
                                    })}
                                </div>
                            </details>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProgrammeConfigPanel;
