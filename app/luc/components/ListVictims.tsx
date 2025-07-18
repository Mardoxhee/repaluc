import React, { useState, useEffect, useContext } from "react";
import { FetchContext } from "../../context/FetchContext";
import { FiEdit, FiTrash, FiPlus, FiEye, FiSearch } from "react-icons/fi";
import VictimDetailModal from "./VictimDetailModal";
import VictimsWithFilters from './filtreComponent';
import CreateVictimModal from './CreateVictimModal';

interface ReglagesProps {
    mockPrejudices: { id: number; nom: string }[];
    mockMesures: { id: number; nom: string }[];
    mockProgrammes: { id: number; nom: string }[];
    mockCategories: { id: number; nom: string }[];
}

const ListVictims: React.FC<ReglagesProps> = ({ mockPrejudices, mockMesures, mockProgrammes, mockCategories }) => {
    const [filterType, setFilterType] = useState<string>("");
    const [search, setSearch] = useState<string>("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [victims, setVictims] = useState<any[]>([]);
    const [page, setPage] = useState<number>(1);
    const [perPage] = useState<number>(10);
    const [editClient, setEditClient] = useState<any | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [victimDetail, setVictimDetail] = useState<any | null>(null);
    const [showVictimModal, setShowVictimModal] = useState(false);

    const fetchCtx = useContext(FetchContext);

    useEffect(() => {
        const fetchVictims = async () => {
            try {
                const data = await fetchCtx?.fetcher("/victime");
                setVictims((data || []).map((v: any) => ({
                    ...v,
                    status: v.status ?? null,
                })));
            } catch (e) {
                // Erreur déjà gérée par FetchContext
            }
        };
        fetchVictims();
    }, []);

    // Calcul de la pagination
    const filteredVictims = victims.filter(victim => {
        if (!search) return true;
        const searchTerm = search.toLowerCase();
        return (
            (victim.nom?.toLowerCase().includes(searchTerm)) ||
            (victim.province?.toLowerCase().includes(searchTerm)) ||
            (victim.territoire?.toLowerCase().includes(searchTerm))
        );
    });

    const totalPages = Math.max(1, Math.ceil(filteredVictims.length / perPage));
    const paginatedVictims = filteredVictims.slice((page - 1) * perPage, page * perPage);

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-14 px-4">
                <div className="max-w-7xl mx-auto w-full px-8">
                    <div className="flex items-center justify-between w-full mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Victimes</h1>
                    </div>

                    {/* Filtres et bouton de création */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                        <div className="relative w-full max-w-md">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Rechercher par nom..."
                                className="pl-10 pr-4 py-2 w-full rounded-xl bg-white border border-gray-300 shadow-sm text-sm focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 text-white font-bold shadow hover:scale-105 transition focus:outline-none focus:ring-2 focus:ring-pink-300"
                        >
                            <FiPlus className="w-5 h-5" /> Créer une victime
                        </button>
                    </div>

                    <VictimsWithFilters
                        mockPrejudices={mockPrejudices}
                        mockMesures={mockMesures}
                        mockProgrammes={mockProgrammes}
                        mockCategories={mockCategories}
                    />

                    {/* Tableau des victimes */}
                    <div className="overflow-x-auto rounded-2xl shadow-lg bg-white/90 border border-gray-100">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">N*</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nom complet</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Province</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Territoire</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sexe</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {fetchCtx?.loading && (
                                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">Chargement...</td></tr>
                                )}
                                {fetchCtx?.error && (
                                    <tr><td colSpan={7} className="text-center py-8 text-red-400">Erreur : {fetchCtx.error}</td></tr>
                                )}
                                {!fetchCtx?.loading && !fetchCtx?.error && paginatedVictims.length === 0 && (
                                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">Aucune victime trouvée</td></tr>
                                )}
                                {!fetchCtx?.loading && !fetchCtx?.error && paginatedVictims.map((victim, idx) => (
                                    <tr key={victim.id} className="border-b hover:bg-blue-50/30 transition">
                                        <td className="px-4 py-3">{(page - 1) * perPage + idx + 1}</td>
                                        <td className="px-4 py-3 font-semibold text-gray-900">{victim.nom}</td>
                                        <td className="px-4 py-3">{victim.province}</td>
                                        <td className="px-4 py-3">{victim.territoire}</td>
                                        <td className="px-4 py-3">{victim.sexe === "Homme" ? "M" : "F"}</td>
                                        <td className="px-4 py-3">
                                            {(!victim.status || victim.status === "") ? (
                                                <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">
                                                    non confirmé
                                                </span>
                                            ) : (
                                                <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                                                    {victim.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 flex gap-2 justify-center">
                                            <button
                                                className="group flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-500 hover:bg-blue-700 text-white border border-blue-600 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                title="Voir les détails"
                                                onClick={() => { setVictimDetail(victim); setShowVictimModal(true); }}
                                            >
                                                <FiEye className="w-5 h-5" />
                                                <span className="hidden sm:inline">Détails</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="px-4 py-2 rounded-lg border bg-white text-gray-600 hover:bg-pink-50 disabled:opacity-50"
                            disabled={page === 1}
                        >
                            Précédent
                        </button>
                        <span className="px-2 py-2 text-gray-700 font-medium">
                            Page {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className="px-4 py-2 rounded-lg border bg-white text-gray-600 hover:bg-pink-50 disabled:opacity-50"
                            disabled={page === totalPages}
                        >
                            Suivant
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal création victime */}
            <CreateVictimModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={data => {
                    setVictims(prev => [
                        {
                            id: prev.length ? Math.max(...prev.map(v => v.id)) + 1 : 1,
                            nom: data.nom,
                            province: data.province,
                            territoire: data.localite,
                            sexe: data.sexe,
                            status: "En attente",
                            ...data
                        },
                        ...prev
                    ]);
                    setShowCreateModal(false);
                }}
            />

            {/* Modal détail victime */}
            {showVictimModal && victimDetail && (
                <VictimDetailModal
                    victim={victimDetail}
                    onClose={() => setShowVictimModal(false)}
                />
            )}
        </>
    );
};

export default ListVictims;