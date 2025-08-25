"use client"
import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { FetchContext } from "../../context/FetchContext";
import Swal from 'sweetalert2';
import VictimDetailModal from "./VictimDetailModal"
import { FiEdit, FiTrash, FiPlus, FiEye, FiGrid, FiUsers, FiTrendingUp, FiSettings, FiInfo, FiMapPin, FiHome, FiPhone, FiFolder, FiFileText, FiBarChart2, FiSearch, FiUser } from "react-icons/fi";
import { GrCertificate } from "react-icons/gr";


interface ReglagesProps {
    mockPrejudices: { id: number; nom: string }[];
    mockMesures: { id: number; nom: string }[];
    mockProgrammes: { id: number; nom: string }[];
    mockCategories: { id: number; nom: string }[];
}
const provincesRDC = [
    "Bas-Uele",
    "Haut-Uele",
    "Ituri",
    "Tshopo",
    "Mongala",
    "Nord-Ubangi",
    "Sud-Ubangi",
    "Équateur",
    "Tshuapa",
    "Mai-Ndombe",
    "Kwilu",
    "Kwango",
    "Kinshasa",
    "Kongo-Central",
    "Kasai",
    "Kasai-Central",
    "Kasai-Oriental",
    "Lomami",
    "Sankuru",
    "Maniema",
    "Sud-Kivu",
    "Nord-Kivu",
    "Tanganyika",
    "Haut-Lomami",
    "Lualaba",
    "Haut-Katanga",
];

const ListVictims: React.FC<ReglagesProps> = ({ mockCategories }) => {
    const [search, setSearch] = useState<string>("");
    const [filters, setFilters] = useState({
        categorie: "",
        province: "",
        territory: "",
        sector: "",
    });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [victims, setVictims] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [meta, setMeta] = useState({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
    });
    const [showVictimModal, setShowVictimModal] = useState(false);
    const [selectedVictim, setSelectedVictim] = useState<any | null>(null);

    const fetchCtx = useContext(FetchContext);

    // Fonction pour construire l'URL uniquement avec les filtres actifs
    const buildQueryParams = useCallback(() => {
        const params: Record<string, string> = {
            page: meta.page.toString(),
            limit: meta.limit.toString(),
        };

        if (search) params.search = search;
        if (filters.categorie) params.categorie = filters.categorie;
        if (filters.province) params.province = filters.province;
        if (filters.territory) params.territory = filters.territory;
        if (filters.sector) params.sector = filters.sector;

        return new URLSearchParams(params).toString();
    }, [meta.page, meta.limit, search, filters]);

    // Fonction pour fetch les victimes
    const fetchVictims = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const queryParams = buildQueryParams();
            const url = queryParams ? `/victime/paginate/filtered?${queryParams}` : `/victime/paginate/filtered`;
            const response = await fetchCtx?.fetcher(url);
            if (response?.data) {
                setVictims(response.data);
                setMeta(response.meta);
            } else {
                setVictims([]);
                setMeta({
                    total: 0,
                    page: 1,
                    limit: 20,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage: false,
                });
            }
        } catch (err: any) {
            setError(err.message || "Erreur lors du chargement des victimes");
            setVictims([]);
        } finally {
            setLoading(false);
        }
    }, [buildQueryParams]);

    // Utilisation de debounce pour limiter les appels API
    useEffect(() => {
        const debounceTimeout = setTimeout(() => {
            fetchVictims();
        }, 300); // 300ms de délai pour éviter les appels multiples

        return () => clearTimeout(debounceTimeout);
    }, [fetchVictims]);

    const handleNextPage = () => {
        if (meta.hasNextPage) {
            setMeta((prev) => ({ ...prev, page: prev.page + 1 }));
        }
    };

    const handlePreviousPage = () => {
        if (meta.hasPreviousPage) {
            setMeta((prev) => ({ ...prev, page: prev.page - 1 }));
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setMeta((prev) => ({ ...prev, page: 1 })); // Reset to first page when filters change
    };

    // Détection filtre actif (hors recherche textuelle)
    const isAnyFilterActive = Object.values(filters).some(val => val);

    // Fonction pour construire le payload à partir des victimes filtrées
    const buildClassificationPayload = () => {
        return victims.map(v => ({
            programmeCategorie: v.categorie || filters.categorie || '',
            prejudiceType: v.prejudicesSubis || '',
            violation: v.typeViolation || '',
            victimeId: v.id
        }));
    };

    // Confirmation groupée
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmResult, setConfirmResult] = useState<string | null>(null);

    const handleClassify = async () => {
        setIsConfirming(true);
        setConfirmResult(null);
        try {
            const payload = buildClassificationPayload();
            console.log("payload", payload)
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
            const response: any = await fetch(`${baseUrl}/programme-prejudice-mesure/classify/multiple`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            console.log("response from out", response)
            if (response) {
                console.log("response", response)
                Swal.fire({
                    icon: 'info',
                    title: 'Victimes confirmées',
                    text: 'Victimes confirmées mais aucun programme de réparations ne peut les prendre en charge pour le moment',
                });
                setConfirmResult('Victime confirmée mais aucun programme de réparations ne peut la prendre en charge');
            } else if (response && response?.ok) {
                setConfirmResult(`Confirmation groupée réussie pour ${victims.length} victimes.`);
            } else {
                console.log("response from else", response)
                setConfirmResult("Erreur lors de la confirmation groupée.");
            }
        } catch (err: any) {
            setConfirmResult("Erreur lors de la confirmation groupée.");
        } finally {
            setIsConfirming(false);
        }
    };

    return (
        <>
            <div className="w-full p-6">
                <div className="w-full">
                    {/* Filtres */}
                    <div className="flex flex-wrap gap-4 mb-6">
                        <input
                            type="text"
                            placeholder="Recherche par nom"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                        <select
                            value={filters.categorie}
                            onChange={(e) => handleFilterChange("categorie", e.target.value)}
                            className="px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                            <option value="">Catégorie</option>
                            {mockCategories.map((category) => (
                                <option key={category.id} value={category.nom}>
                                    {category.nom}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filters.province}
                            onChange={(e) => handleFilterChange("province", e.target.value)}
                            className="px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                            <option value="">Province</option>
                            {provincesRDC.map((province) => (
                                <option key={province} value={province}>
                                    {province}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filters.territory}
                            onChange={(e) => handleFilterChange("territory", e.target.value)}
                            className="px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                            <option value="">Territoire</option>
                            {/* Ajouter les options de territoire ici */}
                        </select>
                        <select
                            value={filters.sector}
                            onChange={(e) => handleFilterChange("sector", e.target.value)}
                            className="px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                            <option value="">Secteur</option>
                            {/* Ajouter les options de secteur ici */}
                        </select>
                    </div>

                    {/* Bouton de confirmation groupée si filtre actif & victimes */}
                    {isAnyFilterActive && victims.length > 0 && (
                        <div className="mb-6 flex items-center gap-4">
                            <button
                                onClick={handleClassify}
                                disabled={isConfirming}
                                className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 disabled:opacity-60 transition"
                            >
                                {isConfirming ? 'Confirmation en cours...' : 'Confirmer les victimes filtrées'}
                            </button>
                            {confirmResult && <span className="text-sm font-medium text-green-600">{confirmResult}</span>}
                        </div>
                    )}

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
                                {loading && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-gray-400">Chargement...</td>
                                    </tr>
                                )}
                                {error && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-red-400">Erreur : {error}</td>
                                    </tr>
                                )}
                                {!loading && !error && victims.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-gray-400">Aucune victime trouvée</td>
                                    </tr>
                                )}
                                {!loading && !error && victims.map((victim, idx) => (
                                    <tr key={victim.id} className="border-b hover:bg-blue-50/30 transition">
                                        <td className="px-4 py-3">{(meta.page - 1) * meta.limit + idx + 1}</td>
                                        <td className="px-4 py-3 font-semibold text-gray-900">{victim.nom}</td>
                                        <td className="px-4 py-3">{victim.province}</td>
                                        <td className="px-4 py-3">{victim.territoire}</td>
                                        <td className="px-4 py-3">{victim.sexe === "Homme" ? "M" : "F"}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold capitalize
    ${victim.status.toLowerCase() === "confirmé"
                                                        ? "bg-blue-100 text-blue-800" // Bleu pour confirmé
                                                        : victim.status === "Non confirmé"
                                                            ? "bg-orange-100 text-orange-800" // Orange pour non confirmé
                                                            : victim.status === "Décédé"
                                                                ? "bg-gray-200 text-gray-800"
                                                                : victim.status === "En traitement"
                                                                    ? "bg-purple-100 text-purple-800"
                                                                    : "bg-red-100 text-red-800"
                                                    }`}
                                            >
                                                {victim.status ? (
                                                    <>
                                                        <span>{victim.status}</span>
                                                        <GrCertificate />
                                                    </>
                                                ) : (
                                                    "Non vérifié"
                                                )}
                                            </span>


                                        </td>
                                        <td className="px-4 py-3 flex gap-2 justify-center">
                                            <button
                                                className="group flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-500 hover:bg-blue-700 text-white border border-blue-600 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                title="Voir les détails"
                                                onClick={() => {
                                                    setSelectedVictim(victim);
                                                    setShowVictimModal(true);
                                                }}
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
                            onClick={handlePreviousPage}
                            className="px-4 py-2 rounded-lg border bg-white text-gray-600 hover:bg-pink-50 disabled:opacity-50"
                            disabled={!meta.hasPreviousPage}
                        >
                            Précédent
                        </button>
                        <span className="px-2 py-2 text-gray-700 font-medium">
                            Page {meta.page} / {meta.totalPages}
                        </span>
                        <button
                            onClick={handleNextPage}
                            className="px-4 py-2 rounded-lg border bg-white text-gray-600 hover:bg-pink-50 disabled:opacity-50"
                            disabled={!meta.hasNextPage}
                        >
                            Suivant
                        </button>
                    </div>
                </div>
            </div>
            {/* Modal détail victime */}
            {showVictimModal && selectedVictim && (
                <VictimDetailModal
                    victim={selectedVictim}
                    onClose={() => setShowVictimModal(false)}
                    onVictimUpdate={(updatedVictim) => {
                        setVictims((prevVictims) => prevVictims.map(v => v.id === updatedVictim.id ? updatedVictim : v));
                    }}
                />
            )}
        </>
    );
};

export default ListVictims;