import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { FiFilter } from "react-icons/fi";
import Select from "react-select";
import Swal from 'sweetalert2';
import VictimDetailModal from "../../luc/components/VictimDetailModal";
import { FetchContext } from "../../context/FetchContext";

interface VictimsWithFiltersProps {
    mockPrejudices: any[];
    mockCategories: any[];
    mockMesures: any[];
    mockProgrammes: any[];
    onFiltersChange?: (filters: any) => void;
    currentFilters?: any;
    allVictims: any[];
}

const provincesRDC = [
    "Bas-Uele", "Haut-Uele", "Ituri", "Tshopo", "Mongala", "Nord-Ubangi", "Sud-Ubangi", "Équateur", "Tshuapa", "Mai-Ndombe", "Kwilu", "Kwango", "Kinshasa", "Kongo-Central", "Kasai", "Kasai-Central", "Kasai-Oriental", "Lomami", "Sankuru", "Maniema", "Sud-Kivu", "Nord-Kivu", "Tanganyika", "Haut-Lomami", "Lualaba", "Haut-Katanga"
];

const VictimsWithFilters: React.FC<VictimsWithFiltersProps> = ({
    mockPrejudices,
    mockMesures,
    mockProgrammes,
    mockCategories,
    onFiltersChange,
    currentFilters = {},
    allVictims
}) => {
    const fetchCtx = useContext(FetchContext);
    // Les filtres sont contrôlés par le parent via currentFilters
    const [search, setSearch] = useState<string>(currentFilters?.search || "");
    const [filters, setFilters] = useState(currentFilters || {
        categorie: "",
        province: "",
        territory: "",
        sector: "",
    });
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

    useEffect(() => {
        const debounceTimeout = setTimeout(() => {
            fetchVictims();
        }, 300);
        return () => clearTimeout(debounceTimeout);
    }, [fetchVictims]);




    return (
        <div>
            <div className="filters-bar">
                <input
                    type="text"
                    placeholder="Recherche par nom ou prénom"
                    value={search}
                    onChange={e => {
                        setSearch(e.target.value);
                        if (onFiltersChange) {
                            onFiltersChange({ ...filters, search: e.target.value });
                        }
                    }}
                    className="search-input"
                />
                <Select
                    options={mockCategories.map(c => ({ value: c.id, label: c.nom }))}
                    value={mockCategories.find(c => String(c.id) === filters.categorie) ? { value: filters.categorie, label: mockCategories.find(c => String(c.id) === filters.categorie)?.nom } : null}
                    onChange={option => handleFilterChange('categorie', option ? option.value : "")}
                    placeholder="Catégorie"
                    isClearable
                    className="filter-select"
                />
                <Select
                    options={provincesRDC.map(p => ({ value: p, label: p }))}
                    value={filters.province ? { value: filters.province, label: filters.province } : null}
                    onChange={option => handleFilterChange('province', option ? option.value : "")}
                    placeholder="Province"
                    isClearable
                    className="filter-select"
                />
                <input
                    type="text"
                    placeholder="Territoire"
                    value={filters.territory}
                    onChange={e => handleFilterChange('territory', e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Secteur"
                    value={filters.sector}
                    onChange={e => handleFilterChange('sector', e.target.value)}
                />
            </div>
        </div>
    );
}

export default VictimsWithFilters;