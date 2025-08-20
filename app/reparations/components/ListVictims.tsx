import React, { useState, useEffect, useMemo, useCallback } from "react";
import { FiEdit, FiTrash, FiPlus, FiEye, FiGrid, FiUsers, FiTrendingUp, FiSettings, FiInfo, FiMapPin, FiHome, FiPhone, FiFolder, FiFileText, FiBarChart2, FiSearch, FiUser } from "react-icons/fi";
import VictimForm from "./VictimForm";
import VictimDetailModal from "./VictimDetailModal";
import VictimsWithFilters from './filtreComponent';

interface ListVictimsProps {
    mockPrejudices: any[];
    mockMesures: any[];
    mockProgrammes: any[];
    mockCategories: any[];
}

const ListVictims: React.FC<ListVictimsProps> = ({
    mockPrejudices,
    mockMesures,
    mockProgrammes,
    mockCategories
}) => {
    // État local pour la liste, l'édition et le modal
    const [allVictims, setAllVictims] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    const [search, setSearch] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [perPage] = useState<number>(10);
    const [editClient, setEditClient] = useState<any | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [victimDetail, setVictimDetail] = useState<any | null>(null);
    const [showVictimModal, setShowVictimModal] = useState(false);
    const [filters, setFilters] = useState({
        programme: "",
        prejudices: [] as string[],
        categorie: "",
        province: "",
        territoire: "",
        secteur: "",
        letter: "",
        ageRange: "",
        statut: ""
    });

    // Fetch initial unique
    useEffect(() => {
        const fetchAllVictims = async () => {
            setLoading(true);
            setError("");
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
                const data = await fetch(`${baseUrl}/victime/paginate/filtered?status=confirmé`).then(res => res.json());
                setAllVictims(Array.isArray(data?.data) ? data.data : []);
            } catch (err: any) {
                setError(err.message || "Erreur lors du chargement des victimes");
                setAllVictims([]);
            } finally {
                setLoading(false);
            }
        };
        fetchAllVictims();
    }, []);

    // Filtrage côté client
    const filteredVictims = useMemo(() => {
        return allVictims.filter(victim => {
            // Filtre par programme
            if (filters.programme && filters.programme !== "") {
                const programme = mockProgrammes.find(p => String(p.id) === filters.programme);
                if (programme && victim.programme !== programme.nom) {
                    return false;
                }
            }

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

            // Filtre par préjudices (multi-sélection)
            if (filters.prejudices && filters.prejudices.length > 0) {
                const hasMatchingPrejudice = filters.prejudices.some(prejId => {
                    const prejudice = mockPrejudices.find(p => String(p.id) === prejId);
                    return prejudice && victim.prejudicesSubis === prejudice.nom;
                });
                if (!hasMatchingPrejudice) {
                    return false;
                }
            }

            // Filtre par statut
            if (filters.statut && filters.statut !== "") {
                if (filters.statut === 'confirmé' && victim.status !== 'confirmé') {
                    return false;
                }
                if (filters.statut === 'non confirmé' && victim.status === 'confirmé') {
                    return false;
                }
            }

            return true;
        });
    }, [allVictims, filters, mockProgrammes, mockCategories, mockPrejudices]);

    // Filtrage par recherche textuelle
    const searchFilteredVictims = useMemo(() => {
        if (!search) return filteredVictims;
        const searchTerm = search.toLowerCase();
        return filteredVictims.filter(victim =>
            (victim.nom?.toLowerCase().includes(searchTerm)) ||
            (victim.province?.toLowerCase().includes(searchTerm)) ||
            (victim.territoire?.toLowerCase().includes(searchTerm))
        );
    }, [filteredVictims, search]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(searchFilteredVictims.length / perPage));
    const paginatedVictims = searchFilteredVictims.slice((page - 1) * perPage, page * perPage);

    // Reset page when search changes
    useEffect(() => {
        setPage(1);
    }, [search, filters]);

    // Callback pour les filtres
    const handleFiltersChange = useCallback((newFilters: typeof filters) => {
        setFilters(newFilters);
        setPage(1);
    }, []);

    // Fonction pour construire l'URL avec filtres (utilisée seulement pour les actions spécifiques)
    const buildFilterUrl = useCallback(() => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== "" && (!Array.isArray(value) || value.length > 0)) {
                if (key === 'categorie') {
                    const category = mockCategories.find(c => String(c.id) === value);
                    if (category) {
                        params.append(key, category.nom);
                    }
                } else if (key === 'prejudices' && Array.isArray(value)) {
                    value.forEach(v => {
                        const prejudice = mockPrejudices.find(p => String(p.id) === v);
                        if (prejudice) {
                            params.append('prejudice', prejudice.nom);
                        }
                    });
                } else if (!Array.isArray(value)) {
                    params.append(key, value);
                }
            }
        });
        return `/victime/paginate/filtered${params.toString() ? `?${params.toString()}` : ''}`;
    }, [filters, mockCategories, mockPrejudices]);

    // Fonction pour appliquer les filtres via API (optionnelle)

    const EditClientModal = ({ client, onClose, onSave }: { client: any, onClose: () => void, onSave: (c: any) => void }) => {
        const [form, setForm] = useState<any>(client);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            const { name, value } = e.target;
            setForm((prev: any) => ({ ...prev, [name]: value }));
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            onSave(form);
        };

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl relative border border-gray-100">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-pink-500 text-xl font-bold"
                    >×</button>
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Modifier le client</h2>
                    <VictimForm
                        form={form}
                        onChange={handleChange}
                        onSubmit={handleSubmit}
                        onClose={onClose}
                        isEdit={true}
                        prejudices={mockPrejudices}
                        categories={mockCategories}
                        programmes={mockProgrammes}
                    />
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="w-full p-6">
                <div className="w-full">
                    <div className="flex items-center justify-between w-full mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Victimes</h1>
                    </div>


                    <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
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

                    {searchFilteredVictims.length > 0 && (
                        <div className="overflow-x-auto rounded-2xl shadow-lg bg-white/90 border border-gray-100 mt-6">
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
                                    {error && (
                                        <tr><td colSpan={7} className="text-center py-8 text-red-400">Erreur : {error}</td></tr>
                                    )}
                                    {!loading && !error && paginatedVictims.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-8 text-gray-400">
                                                Aucune victime trouvée
                                            </td>
                                        </tr>
                                    ) : (
                                        !loading && !error && paginatedVictims.map((victim: any, index: number) => (
                                            <tr key={victim.id || index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {(page - 1) * perPage + index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {victim.nom || 'Non spécifié'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {victim.province || 'Non spécifié'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {victim.territoire || 'Non spécifié'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {victim.sexe || 'Non spécifié'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {victim.status || 'Non confirmé'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                                    <button
                                                        onClick={() => {
                                                            setVictimDetail(victim);
                                                            setShowVictimModal(true);
                                                        }}
                                                        className="text-pink-600 hover:text-pink-900 mr-3 flex items-center justify-center gap-1"
                                                    >
                                                        <FiEye className="w-5 h-5" />
                                                        <span className="hidden sm:inline">Détails</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
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

            {showModal && editClient && (
                <EditClientModal
                    client={editClient}
                    onClose={() => { setShowModal(false); setEditClient(null); }}
                    onSave={(updated: any) => {
                        setAllVictims(prev => prev.map(c => c.id === updated.id ? updated : c));
                        setShowModal(false);
                        setEditClient(null);
                    }}
                />
            )}

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