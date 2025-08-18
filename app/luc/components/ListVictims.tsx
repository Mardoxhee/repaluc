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
    const [victims, setVictims] = useState<any[]>([]);
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
    const [hasActiveFilters, setHasActiveFilters] = useState(false);

    const fetchCtx = useContext(FetchContext);

    // Fonction pour construire l'URL avec la nouvelle logique - memoized
    const buildFilterUrl = useCallback(() => {
        const activeFilters = Object.entries(filters).filter(([key, value]) => value !== "");
        
        if (activeFilters.length === 0) {
            return "/victime"; // Toutes les victimes
        }
        
        // Construire l'URL avec le format /victime/categorie/:param/:value
        const [firstFilter] = activeFilters;
        const [param, value] = firstFilter;
        
        // Pour la catégorie, utiliser le nom au lieu de l'ID
        let finalValue = value;
        if (param === 'categorie') {
            const category = mockCategories.find(c => String(c.id) === value);
            finalValue = category ? category.nom : value;
        }
        
        return `/victime/categorie/${param}/${encodeURIComponent(finalValue)}`;
    }, [filters, mockCategories]);

    // Vérifier s'il y a des filtres actifs - memoized
    const checkActiveFilters = useMemo(() => {
        return Object.values(filters).some(value => value !== "");
    }, [filters]);

    // Fetch des victimes seulement si des filtres sont appliqués
    useEffect(() => {
        setHasActiveFilters(checkActiveFilters);
        

        const fetchVictims = async () => {
            try {
                const url = buildFilterUrl();
                console.log("URL de requête construite:", url);
                
                const data = await fetchCtx?.fetcher(url);
                console.log("Données reçues:", data);
                
                // Gérer la structure de réponse différente selon l'endpoint
                let victimsData = [];
                if (checkActiveFilters) {
                    // Pour les filtres, la réponse peut être dans data.data
                    victimsData = data?.data || data || [];
                } else {
                    // Pour /victime, la réponse directe
                    victimsData = data || [];
                }
                
                setVictims(victimsData.map((v: any) => ({
                    ...v,
                    status: v.status ?? null,
                })));
            } catch (e) {
                console.error("Erreur lors du fetch des victimes:", e);
                setVictims([]);
            }
        };
        
        fetchVictims();
    }, [filters, fetchCtx, buildFilterUrl, checkActiveFilters]);

    // Calcul de la pagination - memoized
    const searchFilteredVictims = useMemo(() => victims.filter(victim => {
        if (!search) return true;
        const searchTerm = search.toLowerCase();
        return (
            (victim.nom?.toLowerCase().includes(searchTerm)) ||
            (victim.province?.toLowerCase().includes(searchTerm)) ||
            (victim.territoire?.toLowerCase().includes(searchTerm))
        );
    }), [victims, search]);

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
                    />

                    {/* Message informatif si aucun filtre n'est appliqué */}
                    {!hasActiveFilters && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center mb-6">
                            <div className="text-blue-600 font-medium mb-2">Aucun filtre appliqué</div>
                            <div className="text-blue-500 text-sm">
                                Utilisez les filtres ci-dessus pour afficher les victimes selon vos critères
                            </div>
                        </div>
                    )}

                    {/* Tableau des victimes */}
                    {hasActiveFilters && (
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
                                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">Aucune victime trouvée avec ces filtres</td></tr>
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
                    )}

                    {/* Pagination */}
                    {hasActiveFilters && (
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
                    onClose={handleVictimModalClose}
                />
            )}
        </>
    );
};

export default ListVictims;