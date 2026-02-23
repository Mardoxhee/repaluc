"use client"
import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { FetchContext } from "../../context/FetchContext";
import Swal from 'sweetalert2';
import VictimDetailModal from "./VictimDetailModal"
import { Search, Filter, Eye, Users, ChevronLeft, ChevronRight, X, Plus, Check, Stethoscope, FileText, Wifi, WifiOff, AlertCircle, BadgeCheck, Download } from 'lucide-react';
import EvaluationModal from "./EvaluationModal";
import ViewEvaluationModal from "./ViewEvaluationModal";
import { saveVictimsToCache, getVictimsFromCache, isOnline, saveProgress, getProgress } from '../../utils/victimsCache';
import { saveQuestions, isCacheValid, getQuestions } from '../../utils/planVieQuestionsCache';
import { deletePendingVictimPhotosForVictim } from '@/app/utils/victimPhotosCache';
import * as XLSX from 'xlsx';

const API_PLANVIE_URL = process.env.NEXT_PUBLIC_API_PLANVIE_URL;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006';

interface ReglagesProps {
    mockPrejudices: { id: number; nom: string }[];
    mockMesures: { id: number; nom: string }[];
    mockProgrammes: { id: number; nom: string }[];
    mockCategories: { id: number; nom: string }[];
    agentReparation?: string;
    photoNotNull?: boolean;
}

const provincesRDC = [
    "Bas-Uele", "Haut-Uele", "Ituri", "Tshopo", "Mongala", "Nord-Ubangi",
    "Sud-Ubangi", "Équateur", "Tshuapa", "Mai-Ndombe", "Kwilu", "Kwango",
    "Kinshasa", "Kongo Central", "Kasai", "Kasai-Central", "Kasai-Oriental",
    "Lomami", "Sankuru", "Maniema", "Sud-Kivu", "Nord-Kivu", "Tanganyika",
    "Haut-Lomami", "Lualaba", "Haut-Katanga",
];

const ProgressionCells: React.FC<{ done?: number; total?: number }> = ({ done, total }) => {
    const safeTotal = Number.isFinite(total) && (total as number) > 0 ? (total as number) : 5;
    const safeDoneRaw = Number.isFinite(done) && (done as number) > 0 ? (done as number) : 0;
    const safeDone = Math.min(safeDoneRaw, safeTotal);

    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: safeTotal }).map((_, i) => {
                const filled = i < safeDone;
                return (
                    <span
                        key={i}
                        className={`h-2.5 w-2.5 border border-gray-300 ${filled ? 'bg-blue-600 border-blue-600' : 'bg-gray-200'} `}
                    />
                );
            })}
        </div>
    );
};

const getProgressionDone = (victim: any): number => {
    const hasPhoto = typeof victim?.photo === 'string' && victim.photo.trim().length > 0;
    const hasPieceIdentite = victim?.progression?.hasPieceIdentite === true;
    const computed = (hasPhoto ? 1 : 0) + (hasPieceIdentite ? 1 : 0);
    const existing = typeof victim?.progression?.done === 'number' ? victim.progression.done : 0;
    return Math.max(existing, computed);
};

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

const ListVictims: React.FC<ReglagesProps> = ({ mockCategories, agentReparation, photoNotNull }) => {
    // Charger les questions du formulaire plan de vie au démarrage
    useEffect(() => {
        const loadQuestions = async () => {
            try {
                const cached = await getQuestions();
                if (cached) return;

                // Vérifier si le cache est toujours valide (1 jour de cache)
                const cacheValid = await isCacheValid(24 * 60 * 60 * 1000);

                if (cacheValid) return;
                if (!isOnline()) return;
                if (!API_PLANVIE_URL) return;

                if (!cacheValid) {
                    const response = await fetch(`${API_PLANVIE_URL}/question/type/plandevie`);
                    if (!response.ok) {
                        throw new Error('Erreur lors du chargement des questions');
                    }
                    const questions = await response.json();
                    await saveQuestions(questions);
                    console.log('Questions du formulaire plan de vie mises en cache');
                }
            } catch (error) {
                console.log('Erreur lors du chargement des questions:', error);
            }
        };

        loadQuestions();
    }, []);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [filters, setFilters] = useState<FilterType>({
        status: "",
        category: "",
        startDate: "",
        endDate: ""
    });
    const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
    const [showFilterBuilder, setShowFilterBuilder] = useState(false);

    // Fonction pour appliquer les filtres localement sur les données en cache
    const applyLocalFilters = useCallback((data: any[]) => {
        return data.filter(victim => {
            // 1. Filtre par terme de recherche (nom, prénom, référence)
            const matchesSearch = !searchTerm ||
                (victim.nom && victim.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (victim.prenom && victim.prenom.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (victim.reference && victim.reference.toLowerCase().includes(searchTerm.toLowerCase()));

            // 2. Filtre par règles dynamiques (filterRules)
            const matchesRules = filterRules.length === 0 || filterRules.every(rule => {
                const value = victim[rule.field];

                if (!value && rule.value) return false;

                switch (rule.operator) {
                    case 'equals':
                        return value === rule.value;
                    case 'contains':
                        return String(value).toLowerCase().includes(String(rule.value).toLowerCase());
                    case 'greaterThan':
                        return Number(value) > Number(rule.value);
                    case 'lessThan':
                        return Number(value) < Number(rule.value);
                    case 'startsWith':
                        return String(value).toLowerCase().startsWith(String(rule.value).toLowerCase());
                    case 'endsWith':
                        return String(value).toLowerCase().endsWith(String(rule.value).toLowerCase());
                    default:
                        return true;
                }
            });

            return matchesSearch && matchesRules;
        });
    }, [searchTerm, filterRules, agentReparation]);
    const [victims, setVictims] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [isOffline, setIsOffline] = useState(false);
    const [usingCache, setUsingCache] = useState(false);
    const [showOfflineIndicator, setShowOfflineIndicator] = useState(true);
    const [initialLoading, setInitialLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 1 });
    const [backgroundLoading, setBackgroundLoading] = useState(false);
    const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
    const [incompleteLoadingMessage, setIncompleteLoadingMessage] = useState<string>("");
    const [exporting, setExporting] = useState(false);
    const [meta, setMeta] = useState({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
    });
    const [showVictimModal, setShowVictimModal] = useState(false);
    const [selectedVictim, setSelectedVictim] = useState<any>(null);

    const handleDeletePhoto = useCallback(async (victimToUpdate: any) => {
        if (!victimToUpdate?.id) return;

        const res = await Swal.fire({
            icon: 'warning',
            title: 'Supprimer la photo ? ',
            text: 'La photo sera retirée du dossier (action locale pour le moment).',
            showCancelButton: true,
            confirmButtonText: 'Supprimer',
            cancelButtonText: 'Annuler',
            confirmButtonColor: '#dc2626',
        });

        if (!res.isConfirmed) return;

        try {
            await deletePendingVictimPhotosForVictim(victimToUpdate.id);
        } catch {
        }

        const updatedVictim = { ...victimToUpdate, photo: null };

        setVictims((prev) => prev.map((v) => (v.id === victimToUpdate.id ? updatedVictim : v)));
        setSelectedVictim((prev: any) => (prev?.id === victimToUpdate.id ? updatedVictim : prev));

        if (isOnline()) {
            try {
                const doPatch = async (payload: any) => {
                    const response = await fetch(`${API_BASE_URL}/victime/${victimToUpdate.id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload),
                    });

                    const rawText = await response.text().catch(() => '');
                    let parsed: any = null;
                    try {
                        parsed = rawText ? JSON.parse(rawText) : null;
                    } catch {
                        parsed = rawText;
                    }

                    console.log('[handleDeletePhoto] PATCH /victime response', {
                        status: response.status,
                        ok: response.ok,
                        payload,
                        body: parsed,
                    });

                    return { response, parsed };
                };

                const first = await doPatch({ photo: null });

                if (!first.response.ok) {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Suppression non enregistrée',
                        text: 'La photo a été retirée localement mais la mise à jour serveur a échoué.',
                        confirmButtonColor: '#901c67'
                    });
                } else {
                    const candidate = (first.parsed && typeof first.parsed === 'object')
                        ? (first.parsed.data ?? first.parsed)
                        : null;

                    if (candidate && typeof candidate === 'object' && 'id' in candidate) {
                        setVictims((prev) => prev.map((v) => (v.id === victimToUpdate.id ? candidate : v)));
                        setSelectedVictim((prev: any) => (prev?.id === victimToUpdate.id ? candidate : prev));
                    }

                    const serverPhoto = candidate?.photo;
                    if (serverPhoto != null) {
                        await Swal.fire({
                            icon: 'warning',
                            title: 'Serveur non mis à jour',
                            text: 'La photo est supprimée localement, mais le serveur renvoie encore une valeur pour "photo" après envoi de null. Il faut corriger côté backend pour accepter photo=null (ne pas utiliser une chaîne vide, cela biaise les statistiques).',
                            confirmButtonColor: '#901c67'
                        });
                    }
                }
            } catch {
                await Swal.fire({
                    icon: 'error',
                    title: 'Suppression non enregistrée',
                    text: 'La photo a été retirée localement mais la mise à jour serveur a échoué.',
                    confirmButtonColor: '#901c67'
                });
            }
        }

        try {
            const cacheKey = 'all-victims-cache';
            const cached = await getVictimsFromCache(cacheKey);
            if (cached?.data && Array.isArray(cached.data)) {
                const nextData = cached.data.map((v: any) => (v.id === victimToUpdate.id ? { ...v, photo: null } : v));
                await saveVictimsToCache(cacheKey, nextData, cached.meta);
            }
        } catch {
        }
    }, []);

    // Fonction pour afficher les détails d'une victime
    const handleViewVictim = useCallback((victim: any) => {
        setSelectedVictim(victim);
        setShowVictimModal(true);
    }, []);
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

        const cacheKey = 'all-victims-cache';
        const progressKey = 'victims-load-progress';

        try {
            // Vérifier la progression précédente
            const progress = await getProgress(progressKey);
            const cachedData = await getVictimsFromCache(cacheKey);

            // Si on a des données en cache (complètes ou partielles), les afficher immédiatement
            const hasCachedData = cachedData && Array.isArray(cachedData.data) && cachedData.data.length > 0;

            if (hasCachedData) {
                console.log(`[LoadAllPages] ${cachedData.data.length} victimes en cache`);

                // Appliquer les filtres et la recherche sur les données en cache
                const filteredData = applyLocalFilters(cachedData.data);
                console.log(`[LoadAllPages] ${filteredData.length} victimes après filtrage local`);

                // Paginer les résultats filtrés
                const page = meta.page;
                const limit = meta.limit;
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                const paginatedData = filteredData.slice(startIndex, endIndex);

                setVictims(paginatedData);
                setMeta(prev => ({
                    ...prev,
                    page,
                    limit,
                    total: filteredData.length,
                    totalPages: Math.ceil(filteredData.length / limit),
                    hasNextPage: endIndex < filteredData.length,
                    hasPreviousPage: page > 1
                }));

                setUsingCache(true);
                setHasLoadedInitialData(true);
            }

            // Si on est hors ligne
            if (!isOnline()) {
                // Si on a tout téléchargé, on reste sur le cache
                if (progress?.completed) {
                    console.log('[LoadAllPages] Mode hors ligne - utilisation du cache complet');
                    setInitialLoading(false);
                    setIncompleteLoadingMessage("");
                    return;
                }
                // Sinon, impossible de continuer - afficher un message persistant
                console.log('[LoadAllPages] Hors ligne - impossible de charger plus de données');
                const percentage = progress?.lastPage && progress?.totalPages
                    ? Math.round((progress.lastPage / progress.totalPages) * 100)
                    : 0;
                setIncompleteLoadingMessage(
                    `Le chargement des données s'est arrêté à ${percentage}% (page ${progress?.lastPage || 0}/${progress?.totalPages || '?'}). Reconnectez-vous pour continuer.`
                );
                setInitialLoading(false);
                setBackgroundLoading(false);
                return;
            }

            // On est EN LIGNE à partir d'ici
            // Effacer le message de chargement incomplet
            setIncompleteLoadingMessage("");

            // IMPORTANT: Si le chargement est déjà complété, NE PAS relancer la synchronisation
            if (progress?.completed) {
                console.log('[LoadAllPages] Synchronisation déjà terminée - pas de rechargement');
                setInitialLoading(false);
                setBackgroundLoading(false);
                return;
            }

            // Sinon, continuer ou reprendre le chargement avec le spinner
            const startPage = progress?.lastPage ? progress.lastPage + 1 : 1;
            const existingData = cachedData?.data || [];

            console.log(`[LoadAllPages] Démarrage du chargement (page ${startPage}/${progress?.totalPages || '?'})`);

            // Si on a des données en cache, charger en arrière-plan
            if (hasCachedData) {
                console.log('[LoadAllPages] Activation du mode background loading');
                setBackgroundLoading(true);
                setInitialLoading(false);
            } else {
                setInitialLoading(true);
            }

            await loadAllPagesWithResume(cacheKey, progressKey, startPage, existingData);

            console.log('[LoadAllPages] Désactivation du mode background loading');
            setBackgroundLoading(false);

        } catch (error) {
            console.error('[LoadAllPages] Erreur:', error);
            setInitialLoading(false);
        }
    }, [fetchCtx?.fetcher, meta.page, meta.limit, applyLocalFilters]);

    // Nouvelle fonction qui gère la reprise du chargement
    const loadAllPagesWithResume = async (
        cacheKey: string,
        progressKey: string,
        startPage: number,
        existingData: any[]
    ): Promise<void> => {
        if (!fetchCtx?.fetcher) return;

        try {
            // Charger la première page pour connaître le total
            const firstEndpoint = photoNotNull ? '/victime/paginate/photo-not-null' : '/victime/paginate/filtered';
            const firstPage = await fetchCtx.fetcher(`${firstEndpoint}?page=1&limit=20`);
            if (!firstPage?.data) {
                setInitialLoading(false);
                return;
            }

            const totalPages = firstPage.meta?.totalPages || 1;
            let allVictims = [...existingData];

            // Initialiser la progression dès le début
            setLoadingProgress({ current: startPage === 1 ? 1 : startPage - 1, total: totalPages });

            // Si on reprend depuis le début, on réinitialise
            if (startPage === 1) {
                allVictims = [...firstPage.data];
                await saveProgress(progressKey, 1, totalPages, false);

                // Sauvegarder immédiatement la première page
                await saveVictimsToCache(cacheKey, allVictims, {
                    ...firstPage.meta,
                    timestamp: Date.now(),
                    total: allVictims.length,
                    page: 1,
                    limit: 20,
                    totalPages
                });

                // Afficher la première page
                setVictims(firstPage.data);
                setMeta(firstPage.meta);
                setHasLoadedInitialData(true);
                setInitialLoading(false);
            } else {
                console.log(`[Resume] Reprise à partir de la page ${startPage}/${totalPages}`);
                setInitialLoading(false);
            }

            // Charger les pages restantes en arrière-plan
            for (let page = Math.max(2, startPage); page <= totalPages; page++) {
                try {
                    const endpoint = photoNotNull ? '/victime/paginate/photo-not-null' : '/victime/paginate/filtered';
                    const response = await fetchCtx.fetcher(`${endpoint}?page=${page}&limit=20`);
                    if (response?.data) {
                        // Ajouter les nouvelles données
                        const startIndex = (page - 1) * 20;
                        allVictims = [
                            ...allVictims.slice(0, startIndex),
                            ...response.data,
                            ...allVictims.slice(startIndex + response.data.length)
                        ];

                        setLoadingProgress({ current: page, total: totalPages });

                        // Sauvegarder progressivement (toutes les 10 pages ou dernière page)
                        if (page % 10 === 0 || page === totalPages) {
                            await saveVictimsToCache(cacheKey, allVictims, {
                                ...firstPage.meta,
                                timestamp: Date.now(),
                                total: allVictims.length,
                                page: 1,
                                limit: 20,
                                totalPages
                            });
                            await saveProgress(progressKey, page, totalPages, page === totalPages);
                            console.log(`[Progress] Sauvegardé jusqu'à la page ${page}/${totalPages}`);
                        }
                    }
                } catch (pageError) {
                    console.error(`[LoadPage] Erreur page ${page}:`, pageError);
                    // En cas d'erreur, sauvegarder la progression actuelle
                    await saveVictimsToCache(cacheKey, allVictims, {
                        ...firstPage.meta,
                        timestamp: Date.now(),
                        total: allVictims.length,
                        page: 1,
                        limit: 20,
                        totalPages
                    });
                    await saveProgress(progressKey, page - 1, totalPages, false);
                    console.log(`[Progress] Sauvegarde d'urgence à la page ${page - 1}`);
                    throw pageError;
                }
            }

            // Marquer comme terminé
            await saveProgress(progressKey, totalPages, totalPages, true);
            console.log(`[LoadAllPages] Chargement terminé: ${allVictims.length} victimes`);

            // Effacer le message de chargement incomplet
            setIncompleteLoadingMessage("");

        } catch (error) {
            console.error('[LoadAllPagesWithResume] Erreur:', error);
        } finally {
            setLoadingProgress({ current: 0, total: 1 });
            setBackgroundLoading(false);
        }
    };

    const buildQueryParams = useCallback(() => {
        const params: Record<string, string> = {
            page: meta.page.toString(),
            limit: meta.limit.toString(),
        };

        if (searchTerm) params.nom = searchTerm;
        if (agentReparation && agentReparation.trim().length > 0) params.agentReparation = agentReparation.trim();

        // Build filters from rules
        filterRules.forEach((rule) => {
            if (rule.value) params[rule.field] = rule.value;
        });

        return new URLSearchParams(params).toString();
    }, [meta.page, meta.limit, searchTerm, filterRules, agentReparation, photoNotNull]);

    const buildExportQueryParams = useCallback(() => {
        const params: Record<string, string> = {
            page: '1',
            limit: '10000',
        };

        if (searchTerm) params.nom = searchTerm;
        if (agentReparation && agentReparation.trim().length > 0) params.agentReparation = agentReparation.trim();

        filterRules.forEach((rule) => {
            if (rule.value) params[rule.field] = rule.value;
        });

        return new URLSearchParams(params).toString();
    }, [searchTerm, filterRules, agentReparation, photoNotNull]);

    useEffect(() => {
        setMeta(prev => ({ ...prev, page: 1 }));
    }, [agentReparation, photoNotNull]);

    const handleExportExcel = useCallback(async () => {
        if (!fetchCtx?.fetcher) return;
        if (!isOnline()) {
            await Swal.fire({
                icon: 'warning',
                title: 'Hors ligne',
                text: 'Export impossible hors ligne.',
                confirmButtonColor: '#901c67'
            });
            return;
        }

        setExporting(true);
        try {
            const queryParams = buildExportQueryParams();
            const endpoint = photoNotNull ? '/victime/paginate/photo-not-null' : '/victime/paginate/filtered';
            const response = await fetchCtx.fetcher(`${endpoint}?${queryParams}`);
            const rows = Array.isArray(response?.data) ? response.data : [];

            if (rows.length === 0) {
                await Swal.fire({
                    icon: 'info',
                    title: 'Aucune donnée',
                    text: 'Aucune victime à exporter avec ces filtres.',
                    confirmButtonColor: '#901c67'
                });
                return;
            }

            const exportData = rows.map((v: any, idx: number) => ({
                'N°': idx + 1,
                'ID': v?.id ?? '',
                'Référence': v?.reference ?? '',
                'Nom': v?.nom ?? '',
                'Prénom': v?.prenom ?? '',
                'Sexe': v?.sexe ?? '',
                'Âge': v?.age ?? '',
                'Catégorie': v?.categorie ?? '',
                'Province': v?.province ?? '',
                'Territoire': v?.territoire ?? '',
                'Commune': v?.commune ?? '',
                'Statut': v?.status ?? '',
                'Dossier': v?.dossier ?? '',
                'Préjudice final': v?.prejudiceFinal ?? '',
                'Programme': v?.programme ?? '',
                'Type de violation': v?.typeViolation ?? '',
                'Date incident': v?.dateIncident ?? '',
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Victimes');

            const date = new Date();
            const pad = (n: number) => String(n).padStart(2, '0');
            const fileName = `victimes_export_${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}.xlsx`;
            XLSX.writeFile(wb, fileName);
        } catch (e) {
            await Swal.fire({
                icon: 'error',
                title: 'Export échoué',
                text: 'Impossible de générer le fichier Excel.',
                confirmButtonColor: '#901c67'
            });
        } finally {
            setExporting(false);
        }
    }, [buildExportQueryParams, fetchCtx?.fetcher, photoNotNull]);

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
        // 1. Si on est hors ligne, on utilise uniquement le cache SANS SAUVEGARDER
        if (isOffline) {
            try {
                const cachedResult = await getVictimsFromCache(cacheKey);

                if (cachedResult?.data?.length) {
                    console.log(`[FetchVictims] Mode offline - ${cachedResult.data.length} victimes en cache`);

                    // Appliquer les filtres localement
                    const filteredData = applyLocalFilters(cachedResult.data);
                    console.log(`[FetchVictims] ${filteredData.length} victimes après filtrage local`);

                    const totalItems = filteredData.length;
                    const totalPages = Math.max(1, Math.ceil(totalItems / meta.limit));
                    const currentPage = Math.min(meta.page, totalPages);

                    // Mettre à jour la page courante si nécessaire
                    if (currentPage !== meta.page) {
                        setMeta(prev => ({ ...prev, page: currentPage }));
                    }

                    // Calculer les données de la page courante
                    const start = (currentPage - 1) * meta.limit;
                    const end = start + meta.limit;
                    const pageData = filteredData.slice(start, end);

                    setVictims(pageData);
                    setMeta(prev => ({
                        ...prev,
                        total: totalItems,
                        totalPages: totalPages,
                        hasNextPage: end < totalItems,
                        hasPreviousPage: currentPage > 1
                    }));
                    setUsingCache(true);
                } else {
                    setError('Pas de connexion Internet et aucune donnée en cache disponible');
                }
            } catch (error) {
                console.error('Erreur lors de la lecture du cache:', error);
                setError('Erreur lors de la lecture des données en cache');
            } finally {
                setLoading(false);
            }
            return;
        }

        // 2. Si on est en ligne, on utilise l'API
        try {
            const queryParams = buildQueryParams();
            const endpoint = photoNotNull ? '/victime/paginate/photo-not-null' : '/victime/paginate/filtered';
            const response = await fetchCtx.fetcher(`${endpoint}?${queryParams}`);

            if (response?.data) {
                // En mode en ligne, on affiche directement les données de l'API
                setVictims(response.data);
                setMeta({
                    ...response.meta,
                    page: response.meta?.page || 1,
                    limit: response.meta?.limit || 20,
                    total: response.meta?.total || response.data.length,
                    totalPages: response.meta?.totalPages || 1,
                    hasNextPage: response.meta?.page < response.meta?.totalPages,
                    hasPreviousPage: response.meta?.page > 1
                });
                setUsingCache(false);
                setLoading(false);
            }
        } catch (err: any) {
            console.error('Erreur lors du chargement des données:', err);

            // En cas d'erreur, essayer d'afficher les données en cache
            try {
                const cachedResult = await getVictimsFromCache(cacheKey);
                if (cachedResult?.data?.length) {
                    const filteredData = applyLocalFilters(cachedResult.data);
                    const totalItems = filteredData.length;
                    const totalPages = Math.max(1, Math.ceil(totalItems / meta.limit));
                    const currentPage = Math.min(meta.page, totalPages);

                    const start = (currentPage - 1) * meta.limit;
                    const end = start + meta.limit;
                    const pageData = filteredData.slice(start, end);

                    setVictims(pageData);
                    setMeta(prev => ({
                        ...prev,
                        total: totalItems,
                        totalPages: totalPages,
                        hasNextPage: end < totalItems,
                        hasPreviousPage: currentPage > 1
                    }));
                    setUsingCache(true);
                    // On considère que l'affichage via le cache est un succès :
                    // ne pas laisser l'application en état d'erreur ou de chargement.
                    setError("");
                    setLoading(false);
                    return;
                }
            } catch (cacheError) {
                console.error('Erreur lors de la récupération du cache:', cacheError);
            }

            setError('Impossible de charger les données. Vérifiez votre connexion Internet.');
            setLoading(false);
        }
    }, [buildQueryParams, fetchCtx?.fetcher, meta.page, meta.limit, filters, searchTerm, applyLocalFilters]);

    useEffect(() => {
        const debounceTimeout = setTimeout(() => {
            fetchVictims();
        }, 300);

        return () => clearTimeout(debounceTimeout);
    }, [fetchVictims]);

    // Chargement initial des données - s'exécute UNE SEULE FOIS au montage
    useEffect(() => {
        let isMounted = true;

        const initializeData = async () => {
            if (isMounted) {
                await loadAllPages();
            }
        };

        initializeData();

        return () => {
            isMounted = false;
        };
    }, []);

    // Écouter les changements de connexion
    useEffect(() => {
        const handleOnline = async () => {
            setIsOffline(false);
            console.log('[Connection] Retour en ligne détecté');

            // Vérifier si la synchronisation est déjà terminée
            const progress = await getProgress('victims-load-progress');
            if (!progress?.completed) {
                console.log('[Connection] Reprise de la synchronisation...');
                // Déclencher un rechargement en rechargeant les données
                fetchVictims();
            } else {
                console.log('[Connection] Synchronisation déjà terminée - pas de rechargement');
            }
        };
        const handleOffline = () => {
            setIsOffline(true);
            console.log('[Connection] Mode hors ligne activé');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [fetchVictims]);

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
            case 'admis à la luc':
            case 'admis a la luc':
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
            {/* Barre de progression en arrière-plan */}
            {backgroundLoading && loadingProgress.total > 0 && (
                <div className="  left-0 right-0 z-50 bg-white shadow-md border-b border-gray-200">
                    <div className="px-6 py-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-500 border-t-transparent"></div>
                                <span className="text-sm font-medium text-gray-700">
                                    Synchronisation des données en cours...
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">
                                    {loadingProgress.current} / {loadingProgress.total} pages
                                </span>
                                <span className="text-xs font-medium text-primary-600">
                                    {Math.round((loadingProgress.current / loadingProgress.total) * 100)}%
                                </span>
                            </div>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300 ease-out"
                                style={{
                                    width: `${Math.round((loadingProgress.current / loadingProgress.total) * 100)}%`
                                }}
                            ></div>
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-gray-50">
                <div className="w-full mx-auto p-6" style={{ marginTop: backgroundLoading ? '0px' : '0' }}>
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

                            {/* Message de chargement incomplet */}
                            {incompleteLoadingMessage && (
                                <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="flex-shrink-0 mt-0.5" size={20} />
                                        <div className="flex-1">
                                            <p className="font-medium">Chargement incomplet</p>
                                            <p className="text-sm mt-1">{incompleteLoadingMessage}</p>
                                        </div>
                                    </div>
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

                                    <div className="flex-1" />
                                    <button
                                        type="button"
                                        onClick={handleExportExcel}
                                        disabled={exporting}
                                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                        title="Exporter en Excel"
                                    >
                                        <Download size={16} />
                                        {exporting ? 'Export...' : 'Exporter Excel'}
                                    </button>
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
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Sexe</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Statut</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Progression</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Actions</th>
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
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                                    {victim.sexe === "Homme" ? "M" : victim.sexe === "Femme" ? "F" : "-"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium border ${getStatusBadgeStyle(victim.status)}`}>
                                                    {(victim.status || '').toLowerCase() === 'admis à la luc' || (victim.status || '').toLowerCase() === 'admis a la luc' ? (
                                                        <BadgeCheck size={14} className="mr-1" />
                                                    ) : null}
                                                    {victim.status || "Non vérifié"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <ProgressionCells
                                                    done={getProgressionDone(victim)}
                                                    total={victim?.progression?.total ?? 5}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-left">
                                                <div className="flex items-center gap-2 justify-start">
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
                                                    {(victim.status == 'A Evaluer' || victim.status?.toLowerCase() === 'evalué' || victim.status?.toLowerCase() === 'évalué' || victim.status?.toLowerCase() === 'contrôlé' || victim.status?.toLowerCase() === 'controle') ? (
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
                                                    ) : (
                                                        <span className="px-3 py-1 text-sm font-medium text-gray-400 select-none">-</span>
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
                    onDeletePhoto={handleDeletePhoto}
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