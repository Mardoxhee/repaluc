"use client"
import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { FetchContext } from "../../context/FetchContext";
import Swal from 'sweetalert2';
import VictimDetailModal from "./VictimDetailModal"
import { Search, Filter, Eye, Users, ChevronLeft, ChevronRight, X, Plus, Check, Stethoscope, FileText, Wifi, WifiOff } from 'lucide-react';
import EvaluationModal from "./EvaluationModal";
import ViewEvaluationModal from "./ViewEvaluationModal";
import { saveVictimsToCache, getVictimsFromCache, isOnline } from '../../utils/victimsCache';

interface ReglagesProps {
    mockPrejudices: { id: number; nom: string }[];
    mockMesures: { id: number; nom: string }[];
    mockProgrammes: { id: number; nom: string }[];
    mockCategories: { id: number; nom: string }[];
}

const provincesRDC = [
    "Bas-Uele", "Haut-Uele", "Ituri", "Tshopo", "Mongala", "Nord-Ubangi",
    "Sud-Ubangi", "Équateur", "Tshuapa", "Mai-Ndombe", "Kwilu", "Kwango",
    "Kinshasa", "Kongo-Central", "Kasai", "Kasai-Central", "Kasai-Oriental",
    "Lomami", "Sankuru", "Maniema", "Sud-Kivu", "Nord-Kivu", "Tanganyika",
    "Haut-Lomami", "Lualaba", "Haut-Katanga",
];

const statusOptions = [
    "Confirmé", "Non confirmé", "En traitement", "Décédé", "En attente", "A evaluer", "Evalué", "Contrôlé"
];

const sexeOptions = ["Homme", "Femme"];

interface FilterRule {
    id: string;
    field: string;
    operator: string;
    value: string;
    label: string;
}

interface FilterType {
    status: string;
    category: string;
    startDate: string;
    endDate: string;
}

const prejudiceFinalOptions = [
    "Perte de vie",
    "Perte économique",
    "Préjudice corporel",
    "Violence Sexuelle Liée au Conflit"
];

const filterFields = [
    { key: 'nom', label: 'Nom', type: 'text' },
    { key: 'categorie', label: 'Catégorie', type: 'select', options: [] },
    { key: 'province', label: 'Province', type: 'select', options: provincesRDC },
    { key: 'territoire', label: 'Territoire', type: 'text' },
    { key: 'commune', label: 'Commune', type: 'text' },
    { key: 'sexe', label: 'Sexe', type: 'select', options: sexeOptions },
    { key: 'status', label: 'Statut', type: 'select', options: statusOptions },
    { key: 'prejudiceFinal', label: 'Préjudice Final', type: 'select', options: prejudiceFinalOptions },
    { key: 'age', label: 'Âge', type: 'number' },
    { key: 'typeViolation', label: 'Type de violation', type: 'text' },
    { key: 'dateIncident', label: 'Date incident', type: 'date' },
];

const operators = [
    { key: 'equals', label: 'Égal à', types: ['text', 'select', 'number', 'date'] },
    { key: 'contains', label: 'Contient', types: ['text'] },
    { key: 'startsWith', label: 'Commence par', types: ['text'] },
    { key: 'gt', label: 'Supérieur à', types: ['number', 'date'] },
    { key: 'lt', label: 'Inférieur à', types: ['number', 'date'] },
    { key: 'between', label: 'Entre', types: ['number', 'date'] },
];

const ListVictims: React.FC<ReglagesProps> = ({ mockCategories }) => {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [filters, setFilters] = useState<FilterType>({
        status: "",
        category: "",
        startDate: "",
        endDate: ""
    });
    const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
    const [showFilterBuilder, setShowFilterBuilder] = useState(false);
    
    // Fonction pour appliquer les filtres et la recherche sur les données
    const applyFilters = (data: any[], filters: FilterType, search: string) => {
        return data.filter(victim => {
            // Filtre par terme de recherche
            const matchesSearch = !search || 
                (victim.nom && victim.nom.toLowerCase().includes(search.toLowerCase())) ||
                (victim.prenom && victim.prenom.toLowerCase().includes(search.toLowerCase())) ||
                (victim.reference && victim.reference.toLowerCase().includes(search.toLowerCase()));
            
            // Filtre par statut
            const matchesStatus = !filters.status || victim.status === filters.status;
            
            // Filtre par catégorie
            const matchesCategory = !filters.category || victim.category === filters.category;
            
            // Filtre par date
            let matchesDate = true;
            if (filters.startDate) {
                const startDate = new Date(filters.startDate);
                const victimDate = new Date(victim.createdAt || victim.date || new Date());
                matchesDate = matchesDate && victimDate >= startDate;
            }
            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999); // Fin de la journée
                const victimDate = new Date(victim.createdAt || victim.date || new Date());
                matchesDate = matchesDate && victimDate <= endDate;
            }
            
            return matchesSearch && matchesStatus && matchesCategory && matchesDate;
        });
    };
    const [victims, setVictims] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [isOffline, setIsOffline] = useState(false);
    const [usingCache, setUsingCache] = useState(false);
    const [showOfflineIndicator, setShowOfflineIndicator] = useState(true);
    const [initialLoading, setInitialLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 1 });
    const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
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
    const [showEvaluationModal, setShowEvaluationModal] = useState(false);
    const [selectedVictimForEvaluation, setSelectedVictimForEvaluation] = useState<any | null>(null);
    const [showViewEvaluationModal, setShowViewEvaluationModal] = useState(false);
    const [selectedVictimForView, setSelectedVictimForView] = useState<any | null>(null);
    const [victimsWithEvaluations, setVictimsWithEvaluations] = useState<Set<number>>(new Set());

    const fetchCtx = useContext(FetchContext);

    // Update filter fields with categories - useMemo pour éviter recalcul
    const updatedFilterFields = useMemo(() => {
        return filterFields.map(field => {
            if (field.key === 'categorie') {
                return {
                    ...field,
                    options: mockCategories ? mockCategories.map((cat: any) => cat.nom) : []
                };
            }
            return field;
        });
    }, [mockCategories]);

    const loadAllPages = useCallback(async (): Promise<void> => {
        if (!fetchCtx?.fetcher) return;
        
        setInitialLoading(true);
        setLoadingProgress({ current: 0, total: 1 });
        
        try {
            // Vérifier d'abord le cache
            const cacheKey = 'all-victims-cache';
            const cachedData = await getVictimsFromCache(cacheKey);
            
            // Vérifier si on a des données en cache de manière plus sûre
            const hasCachedData = cachedData && 
                                Array.isArray(cachedData.data) && 
                                cachedData.data.length > 0;
            
            if (hasCachedData) {
                console.log('Chargement des données depuis le cache...');
                
                // Calculer la pagination
                const page = meta.page;
                const limit = meta.limit;
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                const paginatedData = cachedData.data.slice(startIndex, endIndex);
                
                setVictims(paginatedData);
                
                // Mettre à jour les métadonnées avec la pagination
                setMeta(prev => ({
                    ...prev,
                    page,
                    limit,
                    total: cachedData.data.length,
                    totalPages: Math.ceil(cachedData.data.length / limit),
                    hasNextPage: endIndex < cachedData.data.length,
                    hasPreviousPage: page > 1
                }));
                
                setUsingCache(true);
                setInitialLoading(false);
                setHasLoadedInitialData(true);
                
                // Si on est en ligne, on peut rafraîchir en arrière-plan
                if (isOnline()) {
                    fetchVictims();
                }
                
                return;
            }

            // Charger la première page
            const firstPage = await fetchCtx.fetcher(`/victime/paginate/filtered?page=1&limit=20`);
            if (!firstPage?.data) return;

            const allVictims = [...firstPage.data];
            const totalPages = firstPage.meta?.totalPages || 1;
            
            setLoadingProgress({ current: 1, total: totalPages });

            // Charger les pages restantes
            for (let page = 2; page <= totalPages; page++) {
                const response = await fetchCtx.fetcher(`/victime/paginate/filtered?page=${page}&limit=20`);
                if (response?.data) {
                    allVictims.push(...response.data);
                    setLoadingProgress({ current: page, total: totalPages });
                }
            }

            // Sauvegarder toutes les données dans IndexedDB
            await saveVictimsToCache(cacheKey, allVictims, {
                ...firstPage.meta,
                timestamp: Date.now(),
                total: allVictims.length,
                // On garde la pagination d'origine
                page: firstPage.meta?.page || 1,
                limit: firstPage.meta?.limit || 20,
                totalPages: firstPage.meta?.totalPages || Math.ceil(allVictims.length / 20)
            });
            
            // Mettre à jour le state avec la première page
            setVictims(firstPage.data);
            setMeta(firstPage.meta);
            setHasLoadedInitialData(true);

        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        } finally {
            setInitialLoading(false);
        }
    }, [fetchCtx?.fetcher]);

    const buildQueryParams = useCallback(() => {
        const params: Record<string, string> = {
            page: meta.page.toString(),
            limit: meta.limit.toString(),
        };

        if (searchTerm) params.nom = searchTerm;

        // Build filters from rules
        filterRules.forEach((rule) => {
            if (rule.value) params[rule.field] = rule.value;
        });

        return new URLSearchParams(params).toString();
    }, [meta.page, meta.limit, searchTerm, filterRules]);

    // Function to check if a specific victim has an evaluation and view it
    const handleViewEvaluation = async (victim: any) => {
        if (!fetchCtx?.fetcher) return;

        try {
            const evalData = await fetchCtx.fetcher(`/evaluations-medicales?victimeId=${victim.id}`);
            const hasEvaluation = Array.isArray(evalData)
                ? evalData.length > 0
                : evalData && Object.keys(evalData).length > 0;

            if (hasEvaluation) {
                setSelectedVictimForView(victim);
                setShowViewEvaluationModal(true);
            } else {
                Swal.fire({
                    icon: 'info',
                    title: 'Aucune évaluation',
                    text: 'Aucune évaluation médicale trouvée pour cette victime.',
                });
            }
        } catch (error) {
            console.log('Erreur lors de la vérification de l\'évaluation:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Impossible de vérifier l\'évaluation de cette victime.',
            });
        }
    };

    const fetchVictims = useCallback(async () => {
        if (!fetchCtx?.fetcher) return;

        setLoading(true);
        setError("");
        const isOffline = !isOnline();
        setIsOffline(isOffline);

        const cacheKey = 'all-victims-cache';
        
        // Fonction pour afficher les données avec pagination
        const displayData = (data: any[], metaData: any, fromCache: boolean = false) => {
            // Si les données viennent du cache, on applique la pagination côté client
            if (fromCache) {
                const page = meta.page;
                const limit = meta.limit;
                const totalItems = data.length;
                const totalPages = Math.ceil(totalItems / limit);
                const hasNextPage = (page * limit) < totalItems;
                const hasPreviousPage = page > 1;
                
                // Appliquer la pagination
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                const paginatedData = data.slice(startIndex, endIndex);
                
                setVictims(paginatedData);
                setMeta(prev => ({
                    ...prev,
                    page,
                    limit,
                    total: totalItems,
                    totalPages,
                    hasNextPage,
                    hasPreviousPage
                }));
            } else {
                // Si les données viennent de l'API, on utilise directement les métadonnées fournies
                setVictims(data);
                setMeta(prev => ({
                    ...prev,
                    ...metaData,
                    hasNextPage: metaData.page < metaData.totalPages,
                    hasPreviousPage: metaData.page > 1
                }));
            }
            
            setUsingCache(fromCache);
            setLoading(false);
        };

        // 1. Si on est hors ligne, on utilise uniquement le cache
        if (isOffline) {
            const cachedResult = await getVictimsFromCache(cacheKey);
            
            if (cachedResult?.data?.length) {
                // Appliquer les filtres sur les données en cache
                const filteredData = applyFilters(cachedResult.data, filters, searchTerm);
                const totalItems = filteredData.length;
                const totalPages = Math.ceil(totalItems / meta.limit);
                
                displayData(filteredData, {
                    ...cachedResult.meta,
                    total: totalItems,
                    totalPages: totalPages,
                    hasNextPage: meta.page < totalPages,
                    hasPreviousPage: meta.page > 1
                }, true);
            } else {
                setError('Pas de connexion Internet et aucune donnée en cache disponible');
                setLoading(false);
            }
            return;
        }

        // 2. Si on est en ligne, on utilise l'API
        try {
            const queryParams = buildQueryParams();
            const response = await fetchCtx.fetcher(`/victime/paginate/filtered?${queryParams}`);

            if (response?.data) {
                // Mettre à jour le cache en arrière-plan
                saveVictimsToCache(cacheKey, response.data, {
                    ...response.meta,
                    timestamp: Date.now()
                }).catch(console.error);
                
                // Afficher directement les données de l'API
                displayData(response.data, response.meta, false);
            }
        } catch (err: any) {
            console.error('Erreur lors du chargement des données:', err);
            
            // En cas d'erreur, essayer d'afficher les données en cache
            try {
                const cachedResult = await getVictimsFromCache(cacheKey);
                if (cachedResult?.data?.length) {
                    const filteredData = applyFilters(cachedResult.data, filters, searchTerm);
                    const totalItems = filteredData.length;
                    const totalPages = Math.ceil(totalItems / meta.limit);
                    
                    displayData(filteredData, {
                        ...cachedResult.meta,
                        total: totalItems,
                        totalPages: totalPages,
                        hasNextPage: meta.page < totalPages,
                        hasPreviousPage: meta.page > 1
                    }, true);
                    
                    setError('Connexion limitée : affichage des données en cache');
                    return;
                }
            } catch (cacheError) {
                console.error('Erreur lors de la récupération du cache:', cacheError);
            }
            
            // Si on arrive ici, c'est qu'on n'a pas pu récupérer les données du cache
            setError('Impossible de charger les données. Vérifiez votre connexion Internet.');
            setLoading(false);
        }
    }, [buildQueryParams, fetchCtx?.fetcher, meta.page, meta.limit, filters, searchTerm]);

    useEffect(() => {
        const debounceTimeout = setTimeout(() => {
            fetchVictims();
        }, 300);

        return () => clearTimeout(debounceTimeout);
    }, [fetchVictims]);

    // Chargement initial des données
    useEffect(() => {
        // Ne charger que si on n'a pas déjà chargé les données
        if (!hasLoadedInitialData) {
            loadAllPages();
        }
    }, [loadAllPages, hasLoadedInitialData]);

    // Écouter les changements de connexion
    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            loadAllPages(); // Recharger les données quand on revient en ligne
        };
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [loadAllPages]);

    const addFilterRule = useCallback(() => {
        const newRule: FilterRule = {
            id: Date.now().toString(),
            field: 'nom',
            operator: 'contains',
            value: '',
            label: ''
        };
        setFilterRules(prev => [...prev, newRule]);
    }, []);

    const updateFilterRule = useCallback((id: string, updates: Partial<FilterRule>) => {
        setFilterRules(rules => rules.map(rule =>
            rule.id === id ? { ...rule, ...updates } : rule
        ));
        setMeta(prev => ({ ...prev, page: 1 }));
    }, []);

    const removeFilterRule = useCallback((id: string) => {
        setFilterRules(rules => rules.filter(rule => rule.id !== id));
        setMeta(prev => ({ ...prev, page: 1 }));
    }, []);

    const clearAllFilters = useCallback(() => {
        setFilterRules([]);
        setSearchTerm("");
        setMeta(prev => ({ ...prev, page: 1 }));
    }, []);

    const handleNextPage = useCallback(() => {
        if (meta.hasNextPage) {
            setMeta((prev) => ({ ...prev, page: prev.page + 1 }));
        }
    }, [meta.hasNextPage]);

    const handlePreviousPage = useCallback(() => {
        if (meta.hasPreviousPage) {
            setMeta((prev) => ({ ...prev, page: prev.page - 1 }));
        }
    }, [meta.hasPreviousPage]);



    const getStatusBadgeStyle = useCallback((status: string) => {
        switch (status?.toLowerCase()) {
            case 'confirmé':
                return 'bg-green-50 text-green-700 border-green-200';
            case 'non confirmé':
                return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'en traitement':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'décédé':
                return 'bg-gray-50 text-gray-700 border-gray-200';
            case 'a evaluer':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'evalué':
            case 'évalué':
                return 'bg-teal-50 text-teal-700 border-teal-200';
            case 'contrôlé':
            case 'controle':
                return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            default:
                return 'bg-red-50 text-red-700 border-red-200';
        }
    }, []);

    // Afficher le loader de chargement initial
    if (initialLoading) {
        const progressPercentage = Math.round((loadingProgress.current / loadingProgress.total) * 100);
        
        return (
            <div className="fixed inset-0 bg-white/95 flex items-center justify-center z-50">
                <div className="text-center max-w-md w-full px-4">
                    {/* Logo ou icône */}
                    <div className="flex justify-center mb-8">
                        <div className="relative w-28 h-28">
                            {/* Cercle de fond */}
                            <div className="absolute inset-0 border-4 border-primary-100 rounded-full"></div>
                            
                            {/* Cercle animé */}
                            <div 
                                className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"
                                style={{
                                    borderWidth: '6px',
                                    borderColor: '#007fba',
                                    borderTopColor: 'transparent'
                                }}
                            ></div>
                            
                            {/* Pourcentage */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-primary-600 font-bold text-2xl">{progressPercentage}%</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Texte */}
                    <h2 className="text-2xl font-bold text-primary-700 mb-3">Chargement des données</h2>
                    <p className="text-primary-600 font-medium mb-6">
                        Page {loadingProgress.current} sur {loadingProgress.total}
                    </p>
                    
                    {/* Barre de progression */}
                    <div className="w-full max-w-xs h-2.5 bg-primary-100 rounded-full overflow-hidden mx-auto">
                        <div 
                            className="h-full bg-primary-500 transition-all duration-300 ease-out"
                            style={{ 
                                width: `${progressPercentage}%`,
                                boxShadow: '0 0 12px rgba(0, 127, 186, 0.4)'
                            }}
                        ></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gray-50">
                <div className="w-full mx-auto p-6">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">Liste des Victimes</h1>
                                <p className="text-gray-600">Gérez et consultez les informations des victimes enregistrées</p>
                            </div>

                            {/* Indicateur de statut */}
                            {(isOffline || usingCache) && showOfflineIndicator && (
                                <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${isOffline
                                        ? 'bg-orange-50 text-orange-800 border-orange-200'
                                        : 'bg-blue-50 text-blue-800 border-blue-200'
                                    }`}>
                                    {isOffline ? (
                                        <>
                                            <WifiOff size={18} />
                                            <span className="text-sm font-medium">Mode Hors Ligne</span>
                                        </>
                                    ) : (
                                        <>
                                            <Wifi size={18} />
                                            <span className="text-sm font-medium">Données en cache</span>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setShowOfflineIndicator(false)}
                                        className="ml-2 p-1 hover:bg-white/50 rounded transition-colors"
                                        title="Fermer"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            {/* Notification discrète si l'indicateur est fermé */}
                            {(isOffline || usingCache) && !showOfflineIndicator && (
                                <div className="fixed bottom-4 right-4 z-50">
                                    <button
                                        onClick={() => setShowOfflineIndicator(true)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg border ${isOffline
                                                ? 'bg-orange-100 text-orange-800 border-orange-300'
                                                : 'bg-blue-100 text-blue-800 border-blue-300'
                                            } hover:scale-105 transition-transform`}
                                        title={isOffline ? "Mode Hors Ligne" : "Données en cache"}
                                    >
                                        {isOffline ? <WifiOff size={16} /> : <Wifi size={16} />}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Search and Filter Controls */}
                    <div className="bg-white border border-gray-200 mb-6">
                        <div className="p-6">
                            {/* Search Bar */}
                            <div className="flex gap-4 mb-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Rechercher par nom, dossier, ou référence..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    onClick={() => setShowFilterBuilder(!showFilterBuilder)}
                                    className={`px-6 py-3 border flex items-center gap-2 font-medium transition-colors ${showFilterBuilder
                                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <Filter size={20} />
                                    Filtres avancés
                                    {filterRules.length > 0 && (
                                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 font-semibold">
                                            {filterRules.length}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Filter Builder */}
                            {showFilterBuilder && (
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-semibold text-gray-900">Constructeur de filtres</h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={addFilterRule}
                                                className="px-3 py-1 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                                            >
                                                <Plus size={16} />
                                                Ajouter un filtre
                                            </button>
                                            {filterRules.length > 0 && (
                                                <button
                                                    onClick={clearAllFilters}
                                                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
                                                >
                                                    Effacer tout
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {filterRules.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <Filter size={48} className="mx-auto mb-2 text-gray-300" />
                                            <p>Aucun filtre configuré</p>
                                            <p className="text-sm">Cliquez sur "Ajouter un filtre" pour commencer</p>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {filterRules.map((rule, index) => {
                                            const field = updatedFilterFields.find(f => f.key === rule.field);
                                            const availableOperators = operators.filter(op =>
                                                op.types.includes(field?.type || 'text')
                                            );

                                            return (
                                                <div key={rule.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200">
                                                    {index > 0 && (
                                                        <span className="text-sm font-medium text-gray-500 px-2">ET</span>
                                                    )}

                                                    <select
                                                        value={rule.field}
                                                        onChange={(e) => updateFilterRule(rule.id, {
                                                            field: e.target.value,
                                                            operator: operators.find(op => op.types.includes(
                                                                updatedFilterFields.find(f => f.key === e.target.value)?.type || 'text'
                                                            ))?.key || 'equals'
                                                        })}
                                                        className="px-3 py-2 border border-gray-300 bg-white focus:outline-none focus:border-blue-500"
                                                    >
                                                        {updatedFilterFields.map((field) => (
                                                            <option key={field.key} value={field.key}>
                                                                {field.label}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <select
                                                        value={rule.operator}
                                                        onChange={(e) => updateFilterRule(rule.id, { operator: e.target.value })}
                                                        className="px-3 py-2 border border-gray-300 bg-white focus:outline-none focus:border-blue-500"
                                                    >
                                                        {availableOperators.map(op => (
                                                            <option key={op.key} value={op.key}>
                                                                {op.label}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    {field?.type === 'select' ? (
                                                        <select
                                                            value={rule.value}
                                                            onChange={(e) => updateFilterRule(rule.id, { value: e.target.value })}
                                                            className="px-3 py-2 border border-gray-300 bg-white focus:outline-none focus:border-blue-500 min-w-48"
                                                        >
                                                            <option value="">Sélectionner...</option>
                                                            {field.options?.map(option => (
                                                                <option key={option} value={option}>
                                                                    {option}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <input
                                                            type={field?.type === 'number' ? 'number' : field?.type === 'date' ? 'date' : 'text'}
                                                            value={rule.value}
                                                            onChange={(e) => updateFilterRule(rule.id, { value: e.target.value })}
                                                            placeholder="Valeur..."
                                                            className="px-3 py-2 border border-gray-300 bg-white focus:outline-none focus:border-blue-500 min-w-48"
                                                        />
                                                    )}

                                                    <button
                                                        onClick={() => removeFilterRule(rule.id)}
                                                        className="p-2 text-red-500 hover:bg-red-50 transition-colors"
                                                        title="Supprimer ce filtre"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Active Filters Summary */}
                            {(filterRules.length > 0 || searchTerm) && (
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                                    <span className="text-sm font-medium text-gray-700">Filtres actifs:</span>
                                    {searchTerm && (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs border border-blue-200">
                                            Recherche: "{searchTerm}"
                                        </span>
                                    )}
                                    {filterRules.map(rule => {
                                        const field = updatedFilterFields.find(f => f.key === rule.field);
                                        const operator = operators.find(op => op.key === rule.operator);
                                        return (
                                            <span key={rule.id} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs border border-gray-200">
                                                {field?.label} {operator?.label.toLowerCase()} "{rule.value}"
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {victims.length > 0 && (filterRules.length > 0 || searchTerm) && (
                        <div className="bg-white border border-gray-200 p-4 mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Users className="text-blue-600" size={20} />
                                    <span className="font-medium text-gray-900">
                                        {victims.length} victime{victims.length > 1 ? 's' : ''} trouvée{victims.length > 1 ? 's' : ''}
                                    </span>
                                </div>
                                {/* <button
                                    onClick={handleClassify}
                                    disabled={isConfirming}
                                    className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    <Check size={16} />
                                    {isConfirming ? 'Confirmation...' : 'Confirmer toutes les victimes'}
                                </button> */}
                            </div>
                        </div>
                    )}

                    {/* Results Table */}
                    <div className="bg-white border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">N°</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Nom complet</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Province</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Territoire</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Sexe</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Statut</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading && (
                                        <tr>
                                            <td colSpan={7} className="text-center py-12">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                    <span className="text-gray-500">Chargement des données...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {error && (
                                        <tr>
                                            <td colSpan={7} className="text-center py-12">
                                                <div className="text-red-500">
                                                    <p className="font-medium">Erreur de chargement</p>
                                                    <p className="text-sm">{error}</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && !error && victims.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="text-center py-12">
                                                <div className="text-gray-500">
                                                    <Users size={48} className="mx-auto mb-2 text-gray-300" />
                                                    <p className="font-medium">Aucune victime trouvée</p>
                                                    <p className="text-sm">Essayez de modifier vos critères de recherche</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && !error && victims.map((victim, idx) => (
                                        <tr key={victim.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {(meta.page - 1) * meta.limit + idx + 1}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{victim.nom}</div>
                                                {victim.dossier && (
                                                    <div className="text-xs text-gray-500">Dossier: {victim.dossier}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{victim.province || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{victim.territoire || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                                    {victim.sexe === "Homme" ? "M" : victim.sexe === "Femme" ? "F" : "-"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium border ${getStatusBadgeStyle(victim.status)}`}>
                                                    {victim.status || "Non vérifié"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center gap-2 justify-center">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedVictim(victim);
                                                            setShowVictimModal(true);
                                                        }}
                                                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                                                        title="Voir les détails"
                                                    >
                                                        <Eye size={14} />
                                                        Détails
                                                    </button>
                                                    {(victim.status == 'A Evaluer' || victim.status?.toLowerCase() === 'evalué' || victim.status?.toLowerCase() === 'évalué' || victim.status?.toLowerCase() === 'contrôlé' || victim.status?.toLowerCase() === 'controle') && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedVictimForEvaluation(victim);
                                                                setShowEvaluationModal(true);
                                                            }}
                                                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                                                            title="Évaluation médicale"
                                                        >
                                                            <Stethoscope size={14} />
                                                            Évaluer
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {!loading && !error && victims.length > 0 && (
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Affichage de {(meta.page - 1) * meta.limit + 1} à {Math.min(meta.page * meta.limit, meta.total)} sur {meta.total} résultats
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handlePreviousPage}
                                            disabled={!meta.hasPreviousPage}
                                            className="px-3 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                                        >
                                            <ChevronLeft size={16} />
                                            Précédent
                                        </button>
                                        <span className="px-3 py-2 text-sm font-medium text-gray-700">
                                            Page {meta.page} sur {meta.totalPages}
                                        </span>
                                        <button
                                            onClick={handleNextPage}
                                            disabled={!meta.hasNextPage}
                                            className="px-3 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                                        >
                                            Suivant
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
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
                    onViewEvaluation={handleViewEvaluation}
                />
            )}

            {/* Modal évaluation médicale */}
            {showEvaluationModal && selectedVictimForEvaluation && (
                <EvaluationModal
                    victim={selectedVictimForEvaluation}
                    onClose={() => {
                        setShowEvaluationModal(false);
                        setSelectedVictimForEvaluation(null);
                    }}
                />
            )}

            {/* Modal visualisation évaluation */}
            {showViewEvaluationModal && selectedVictimForView && (
                <ViewEvaluationModal
                    victim={selectedVictimForView}
                    onClose={() => {
                        setShowViewEvaluationModal(false);
                        setSelectedVictimForView(null);
                    }}
                />
            )}
        </>
    );
};

export default ListVictims;