import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
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
    const [search, setSearch] = useState<string>("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [allVictims, setAllVictims] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState<number>(1);
    const [perPage] = useState<number>(10);
    const [editClient, setEditClient] = useState<any | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [victimDetail, setVictimDetail] = useState<any | null>(null);
    const [showVictimModal, setShowVictimModal] = useState(false);

    // États pour les filtres - initialement vides
    const [filters, setFilters] = useState<{
        categorie: string;
        province: string;
        territoire: string;
        secteur: string;
        prejudice: string;
        statut: string;
    }>({
        categorie: "",
        province: "",
        territoire: "",
        secteur: "",
        prejudice: "",
        statut: ""
    });

    const fetchCtx = useContext(FetchContext);

    // Fetch initial unique de toutes les victimes
    useEffect(() => {
        const fetchAllVictims = async () => {
            setLoading(true);
            try {
                const data = await fetchCtx?.fetcher('/victime');
                const victimsData = Array.isArray(data) ? data : [];
                setAllVictims(victimsData.map((v: any) => ({ ...v, status: v.status ?? null })));
            } catch (e) {
                console.error("Erreur lors du fetch des victimes:", e);
                setAllVictims([]);
            } finally {
                setLoading(false);
            }
        };
        fetchAllVictims();
    }, [fetchCtx]);

    // Vérifier s'il y a des filtres actifs - memoized
    const hasActiveFilters = useMemo(() => {
        return Object.values(filters).some(value => value !== "");
    }, [filters]);

    // Filtrage côté client des victimes
    const filteredVictims = useMemo(() => {
        if (!hasActiveFilters) return allVictims;
        
        return allVictims.filter(victim => {
            // Filtre par catégorie
            if (filters.categorie && filters.categorie !== "") {
                const category = mockCategories.find(c => String(c.id) === filters.categorie);
                if (category && victim.categorie !== category.nom) {
                    return false;
                }
            }

            // Filtre par province
            if (filters.province && filters.province !== "" && victim.province !== filters.province) {
                return false;
            }

            // Filtre par territoire
            if (filters.territoire && filters.territoire !== "" && victim.territoire !== filters.territoire) {
                return false;
            }

            // Filtre par secteur
            if (filters.secteur && filters.secteur !== "" && victim.secteur !== filters.secteur) {
                return false;
            }

            // Filtre par préjudice
            if (filters.prejudice && filters.prejudice !== "") {
                const prejudice = mockPrejudices.find(p => String(p.id) === filters.prejudice);
                if (prejudice && victim.prejudicesSubis !== prejudice.nom) {
                    return false;
                }
            }

            // Filtre par statut
            if (filters.statut && filters.statut !== "") {
                if (filters.statut === 'confirme' && victim.status !== 'confirmé') {
                    return false;
                }
                if (filters.statut === 'nonconfirme' && victim.status === 'confirmé') {
                    return false;
                }
            }

            return true;
        });
    }, [allVictims, filters, hasActiveFilters, mockCategories, mockPrejudices]);

    // Calcul de la pagination - memoized
    const searchFilteredVictims = useMemo(() => filteredVictims.filter(victim => {
        if (!search) return true;
        const searchTerm = search.toLowerCase();
        return (
            (victim.nom?.toLowerCase().includes(searchTerm)) ||
            (victim.province?.toLowerCase().includes(searchTerm)) ||
            (victim.territoire?.toLowerCase().includes(searchTerm))
        );
    }), [filteredVictims, search]);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(searchFilteredVictims.length / perPage)), [searchFilteredVictims.length, perPage]);
    const paginatedVictims = useMemo(() => searchFilteredVictims.slice((page - 1) * perPage, page * perPage), [searchFilteredVictims, page, perPage]);

    // Callback pour éviter les re-rendus du composant de filtres
    const handleFiltersChange = useCallback((newFilters: typeof filters) => {
        setFilters(newFilters);
        setPage(1); // Reset page quand les filtres changent
    }, []);

    const handleCreateModalClose = useCallback(() => setShowCreateModal(false), []);
    const handleVictimModalClose = useCallback(() => setShowVictimModal(false), []);

    return (
        <>
            <div className="w-full p-6">
                <div className="w-full">
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
                        onFiltersChange={handleFiltersChange}
                        currentFilters={filters}
                        allVictims={allVictims}
                    />

                    {/* Message informatif si aucun filtre n'est appliqué ET aucune victime */}
                    {!hasActiveFilters && allVictims.length === 0 && !loading && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center mb-6">
                            <div className="text-blue-600 font-medium mb-2">Aucune victime à afficher</div>
                            <div className="text-blue-500 text-sm">
                                Il n'y a aucune victime enregistrée pour le moment.
                            </div>
                        </div>
                    )}

                    {/* Tableau des victimes */}
                    {(hasActiveFilters ? searchFilteredVictims.length > 0 : allVictims.length > 0) && (
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
                                    {loading && (
                                        <tr><td colSpan={7} className="text-center py-8 text-gray-400">Chargement...</td></tr>
                                    )}
                                    {fetchCtx?.error && (
                                        <tr><td colSpan={7} className="text-center py-8 text-red-400">Erreur : {fetchCtx.error}</td></tr>
                                    )}
                                    {!loading && !fetchCtx?.error && paginatedVictims.length === 0 && (
                                        <tr><td colSpan={7} className="text-center py-8 text-gray-400">Aucune victime trouvée avec ces filtres</td></tr>
                                    )}
                                    {!loading && !fetchCtx?.error && paginatedVictims.map((victim, idx) => (
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
                    )}

                    {/* Pagination */}
                    {(hasActiveFilters ? searchFilteredVictims.length > 0 : allVictims.length > 0) && totalPages > 1 && (
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
                    )}
                </div>
            </div>

            {/* Modal création victime */}
            <CreateVictimModal
                isOpen={showCreateModal}
                onClose={handleCreateModalClose}
                onSubmit={data => {
                    setAllVictims(prev => [
                        {
                            id: prev.length ? Math.max(...prev.map(v => Number(v.id) || 0)) + 1 : 1,
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
                    onClose={handleVictimModalClose}
                />
            )}
        </>
    );

    // Calculer hasActiveFilters
    const hasActiveFilters = useMemo(() => {
        return Object.values(filters).some(value => value !== "");
    }, [filters]);
};

export default ListVictims;