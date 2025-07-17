"use client";
import React, { useState } from "react";
import { useFetch } from '../../context/FetchContext';
import Swal from 'sweetalert2';
import { FiEdit, FiTrash } from 'react-icons/fi';

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

interface Violation {
    id: number;
    nom: string;
}

interface ProgrammeConfigPanelProps {
    programmes: Programme[];
    prejudices: Prejudice[];
    mesures: Mesure[];
    violations: Violation[];
}

const ProgrammeConfigPanel: React.FC<ProgrammeConfigPanelProps> = ({ programmes, prejudices, mesures, violations }) => {
    const { fetcher, loading: fetchLoading } = useFetch();
    const [selectedProg, setSelectedProg] = useState<number | null>(null);
    const [selectedViolation, setSelectedViolation] = useState<number | null>(null);
    const [selectedPrej, setSelectedPrej] = useState<number | null>(null);
    const [selectedMesure, setSelectedMesure] = useState<number | null>(null);
    const [configurations, setConfigurations] = useState<Array<{ id: number, programmeId: number, violationId: number, prejudiceId: number, mesureId: number, obs?: string }>>([]);
    const [editConfigId, setEditConfigId] = useState<number | null>(null);

    // Fetch associations from API
    React.useEffect(() => {
        fetchConfigs();
        // eslint-disable-next-line
    }, []);

    const handleAddConfig = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!selectedProg || !selectedViolation || !selectedPrej || !selectedMesure) return;
        // If editing, PATCH
        if (editConfigId) {
            try {
                await fetcher(`/programme-prejudice-mesure/${editConfigId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        programmeId: selectedProg,
                        violationId: selectedViolation,
                        prejudiceId: selectedPrej,
                        mesureId: selectedMesure
                    })
                });
                await fetchConfigs();
                setEditConfigId(null);
                setSelectedProg(null);
                setSelectedViolation(null);
                setSelectedPrej(null);
                setSelectedMesure(null);
                if (typeof Swal !== 'undefined') {
                    await Swal.fire({ icon: 'success', title: 'Configuration mise à jour', showConfirmButton: false, timer: 1200 });
                } else {
                    alert('Configuration mise à jour');
                }
            } catch (err: any) {
                if (typeof Swal !== 'undefined') {
                    await Swal.fire({ icon: 'error', title: 'Erreur', text: err?.message || 'Erreur inconnue' });
                } else {
                    alert('Erreur lors de la mise à jour');
                }
            }
            return;
        }
        // Sinon, POST (création)
        if (configurations.some(cfg => cfg.programmeId === selectedProg && cfg.violationId === selectedViolation && cfg.prejudiceId === selectedPrej && cfg.mesureId === selectedMesure)) return;
        try {
            await fetcher('/programme-prejudice-mesure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    programmeId: selectedProg,
                    violationId: selectedViolation,
                    prejudiceId: selectedPrej,
                    mesureId: selectedMesure
                })
            });
            await fetchConfigs();
            setSelectedProg(null);
            setSelectedViolation(null);
            setSelectedPrej(null);
            setSelectedMesure(null);
            if (typeof Swal !== 'undefined') {
                await Swal.fire({ icon: 'success', title: 'Configuration enregistrée', showConfirmButton: false, timer: 1200 });
            } else {
                alert('Configuration enregistrée');
            }
        } catch (err: any) {
            if (typeof Swal !== 'undefined') {
                await Swal.fire({ icon: 'error', title: 'Erreur', text: err?.message || 'Erreur inconnue' });
            } else {
                alert('Erreur lors de l\'enregistrement');
            }
        }
    };

    // Récupération des configs depuis l'API (partagée)
    async function fetchConfigs() {
        try {
            const data = await fetcher('/programme-prejudice-mesure');
            if (Array.isArray(data)) {
                setConfigurations(data.map((item: any) => ({
                    id: item.id,
                    programmeId: item.programmeId,
                    prejudiceId: item.prejudiceId,
                    mesureId: item.mesureId,
                    violationId: item.violationId,
                })));
            }
        } catch {
            setConfigurations([]);
        }
    }

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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Violation</label>
                    <select
                        className="w-full border rounded px-3 py-2"
                        value={selectedViolation ?? ''}
                        onChange={e => setSelectedViolation(Number(e.target.value) || null)}
                        required
                    >
                        <option value="" disabled>Choisir une violation</option>
                        {violations.map(v => (
                            <option key={v.id} value={v.id}>{v.nom}</option>
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
                    disabled={!selectedProg || !selectedViolation || !selectedPrej || !selectedMesure}
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
                                                    {configurations
                                                        .filter(cfg => cfg.programmeId === prog.id && prejudice && cfg.prejudiceId === prejudice.id)
                                                        .map(cfg => {
                                                            const mesure = mesures.find(m => m.id === cfg.mesureId);
                                                            return (
                                                                <li key={cfg.id} className="py-1 px-2 text-gray-500 flex items-center gap-2 border-b border-gray-100 last:border-b-0">
                                                                    <span className="font-medium text-gray-300">Mesure :</span>
                                                                    <span>{mesure ? mesure.nom : 'Mesure #' + cfg.mesureId}</span>
                                                                    {cfg.obs && <span className="italic text-xs text-gray-400 ml-2">({cfg.obs})</span>}
                                                                    <button
                                                                        type="button"
                                                                        className="ml-2 text-blue-600 hover:text-blue-800 p-1 rounded"
                                                                        title="Éditer"
                                                                        aria-label="Éditer"
                                                                        onClick={() => {
                                                                            setEditConfigId(cfg.id);
                                                                            setSelectedProg(cfg.programmeId);
                                                                            setSelectedPrej(cfg.prejudiceId);
                                                                            setSelectedMesure(cfg.mesureId);
                                                                        }}
                                                                    >
                                                                        <FiEdit size={16} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="ml-1 text-red-600 hover:text-red-800 p-1 rounded"
                                                                        title="Supprimer"
                                                                        aria-label="Supprimer"
                                                                        onClick={async () => {
                                                                            const confirm = await Swal.fire({
                                                                                title: 'Supprimer cette association ?',
                                                                                text: 'Cette action est irréversible.',
                                                                                icon: 'warning',
                                                                                showCancelButton: true,
                                                                                confirmButtonColor: '#d33',
                                                                                cancelButtonColor: '#3085d6',
                                                                                confirmButtonText: 'Oui, supprimer',
                                                                                cancelButtonText: 'Annuler'
                                                                            });
                                                                            if (confirm.isConfirmed) {
                                                                                try {
                                                                                    await fetcher(`/programme-prejudice-mesure/${cfg.id}`, { method: 'DELETE' });
                                                                                    await fetchConfigs();
                                                                                    await Swal.fire({ icon: 'success', title: 'Association supprimée', showConfirmButton: false, timer: 1200 });
                                                                                } catch (err: any) {
                                                                                    await Swal.fire({ icon: 'error', title: 'Erreur lors de la suppression', text: err?.message || 'Erreur inconnue' });
                                                                                }
                                                                            }
                                                                        }}
                                                                    >
                                                                        <FiTrash size={16} />
                                                                    </button>
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
