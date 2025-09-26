"use client"
import React, { useState, useEffect, useContext, useCallback } from "react";
import { FetchContext } from "../../context/FetchContext";
import Swal from 'sweetalert2';
import VictimDetailModal from "./VictimDetailModal"
import { Search, Filter, Eye, Users, ChevronLeft, ChevronRight, X, Plus, Check, Stethoscope } from 'lucide-react';
import EvaluationModal from "./EvaluationModal";

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
    "Confirmé", "Non confirmé", "En traitement", "Décédé", "En attente", "A evaluer"
];

const sexeOptions = ["Homme", "Femme"];

interface FilterRule {
    id: string;
    field: string;
    operator: string;
    value: string;
    label: string;
}

const filterFields = [
    { key: 'nom', label: 'Nom', type: 'text' },
    { key: 'categorie', label: 'Catégorie', type: 'select', options: [] },
    { key: 'province', label: 'Province', type: 'select', options: provincesRDC },
    { key: 'territoire', label: 'Territoire', type: 'text' },
    { key: 'commune', label: 'Commune', type: 'text' },
    { key: 'sexe', label: 'Sexe', type: 'select', options: sexeOptions },
    { key: 'status', label: 'Statut', type: 'select', options: statusOptions },
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
    const [search, setSearch] = useState<string>("");
    const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
    const [showFilterBuilder, setShowFilterBuilder] = useState(false);
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
    const [showEvaluationModal, setShowEvaluationModal] = useState(false);
    const [selectedVictimForEvaluation, setSelectedVictimForEvaluation] = useState<any | null>(null);

    const fetchCtx = useContext(FetchContext);

    // Update filter fields with categories
    const updatedFilterFields = filterFields.map(field =>
        field.key === 'categorie'
            ? { ...field, options: mockCategories.map(cat => cat.nom) }
            : field
    );

    const buildQueryParams = useCallback(() => {
        const params: Record<string, string> = {
            page: meta.page.toString(),
            limit: meta.limit.toString(),
        };

        if (search) params.nom = search;

        // Build filters from rules
        filterRules.forEach((rule) => {
            if (rule.value) params[rule.field] = rule.value;
        });

        return new URLSearchParams(params).toString();
    }, [meta.page, meta.limit, search, filterRules]);

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

    const addFilterRule = () => {
        const newRule: FilterRule = {
            id: Date.now().toString(),
            field: 'nom',
            operator: 'contains',
            value: '',
            label: ''
        };
        setFilterRules([...filterRules, newRule]);
    };

    const updateFilterRule = (id: string, updates: Partial<FilterRule>) => {
        setFilterRules(rules => rules.map(rule =>
            rule.id === id ? { ...rule, ...updates } : rule
        ));
        setMeta(prev => ({ ...prev, page: 1 }));
    };

    const removeFilterRule = (id: string) => {
        setFilterRules(rules => rules.filter(rule => rule.id !== id));
        setMeta(prev => ({ ...prev, page: 1 }));
    };

    const clearAllFilters = () => {
        setFilterRules([]);
        setSearch("");
        setMeta(prev => ({ ...prev, page: 1 }));
    };

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



    const getStatusBadgeStyle = (status: string) => {
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
            default:
                return 'bg-red-50 text-red-700 border-red-200';
        }
    };

    return (
        <>
            <div className="min-h-screen bg-gray-50">
                <div className="w-full mx-auto p-6">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Liste des Victimes</h1>
                        <p className="text-gray-600">Gérez et consultez les informations des victimes enregistrées</p>
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
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
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
                                                        {updatedFilterFields.map(field => (
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
                            {(filterRules.length > 0 || search) && (
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                                    <span className="text-sm font-medium text-gray-700">Filtres actifs:</span>
                                    {search && (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs border border-blue-200">
                                            Recherche: "{search}"
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
                    {victims.length > 0 && (filterRules.length > 0 || search) && (
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
                                                    {victim.status == 'A Evaluer' && (
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
        </>
    );
};

export default ListVictims;