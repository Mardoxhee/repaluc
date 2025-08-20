"use client"
import React, { useState, useEffect, memo } from "react";
import { FiFilter } from "react-icons/fi";
import ProgressionModal from "./ProgressionModal";
import Select from "react-select";
import { useFetch } from "../../context/FetchContext";

interface VictimsWithFiltersProps {
    mockPrejudices: any[];
    mockCategories: any[];
    mockMesures: any[];
    mockProgrammes: any[];
    onFiltersChange: (filters: any) => void;
    currentFilters: any;
    allVictims: any[];
}

const VictimsWithFilters: React.FC<VictimsWithFiltersProps> = ({
    mockPrejudices,
    mockCategories,
    mockMesures,
    mockProgrammes,
    onFiltersChange,
    currentFilters,
    allVictims
}) => {
    const { fetcher } = useFetch();

    // États filtres
    const [showFilters, setShowFilters] = React.useState(false);
    // Modal progression
    const [isProgressionOpen, setIsProgressionOpen] = useState(false);
    const [isConfirming, setIsConfirming] = React.useState(false);

    // Filtrage côté client
    const filteredVictims = React.useMemo(() => {
        return allVictims.filter(victim => {
            // Filtre par catégorie
            if (currentFilters.categorie && currentFilters.categorie !== "") {
                const category = mockCategories.find(c => String(c.id) === currentFilters.categorie);
                if (category && victim.categorie !== category.nom) {
                    return false;
                }
            }

            // Filtre par province
            if (currentFilters.province && currentFilters.province !== "" && victim.province !== currentFilters.province) {
                return false;
            }

            // Filtre par territoire
            if (currentFilters.territoire && currentFilters.territoire !== "" && victim.territoire !== currentFilters.territoire) {
                return false;
            }

            // Filtre par secteur
            if (currentFilters.secteur && currentFilters.secteur !== "" && victim.secteur !== currentFilters.secteur) {
                return false;
            }

            // Filtre par préjudice
            if (currentFilters.prejudice && currentFilters.prejudice !== "") {
                const prejudice = mockPrejudices.find(p => String(p.id) === currentFilters.prejudice);
                if (prejudice && victim.prejudicesSubis !== prejudice.nom) {
                    return false;
                }
            }

            // Filtre par statut
            if (currentFilters.statut && currentFilters.statut !== "") {
                if (currentFilters.statut === 'confirme' && victim.status !== 'confirmé') {
                    return false;
                }
                if (currentFilters.statut === 'nonconfirme' && victim.status === 'confirmé') {
                    return false;
                }
            }

            return true;
        });
    }, [allVictims, currentFilters, mockCategories, mockPrejudices]);

    // Fonction pour mettre à jour les filtres - memoized
    const updateFilter = React.useCallback((key: string, value: string) => {
        const newFilters = { ...currentFilters, [key]: value };
        onFiltersChange(newFilters);
    }, [currentFilters, onFiltersChange]);

    const handleGroupConfirmation = React.useCallback(async () => {
        console.log("Bouton confirmation groupée cliqué");

        if (filteredVictims.length === 0) {
            alert("Aucune victime trouvée");
            return;
        }

        setIsConfirming(true);

        try {
            // Construire l'URL avec les filtres pour l'API
            const params: any = new URLSearchParams();
            Object.entries(currentFilters).forEach(([key, value]) => {
                if (value && value !== "") {
                    if (key === 'categorie') {
                        const category = mockCategories.find(c => String(c.id) === value);
                        if (category) {
                            params.append(key, category.nom);
                        }
                    } else {
                        params.append(key, value);
                    }
                }
            });

            const url = `/victime/paginate/filtered${params.toString() ? `?${params.toString()}` : ''}`;

            // Préparer les données selon le format demandé
            const confirmationData = filteredVictims.map(victim => ({
                programmeCategorie: victim.categorie || mockCategories.find(c => c.id === victim.categorie) || "",
                prejudiceType: victim.prejudicesSubis || mockPrejudices.find(p => p.id === victim.prejudicesSubis) || "",
                violation: victim.typeViolation || "Violation non spécifiée",
                victimeId: victim.id
            }));

            console.log("Données de confirmation groupée:", confirmationData);

            // Envoyer la requête POST
            const response = await fetcher("/programme-prejudice-mesure/classify", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(confirmationData)
            });

            console.log("Réponse de la confirmation groupée:", response);
            alert(`Confirmation groupée réussie pour ${filteredVictims.length} victimes`);

        } catch (error: any) {
            console.error("Erreur lors de la confirmation groupée:", error);
            alert(`Erreur lors de la confirmation groupée: ${error.message || 'Erreur inconnue'}`);
        } finally {
            setIsConfirming(false);
        }
    }, [filteredVictims, fetcher, mockCategories, mockPrejudices, currentFilters]);

    // Mock territoires
    const territoires = [
        { value: '', label: 'Tous les territoires' },
        { value: 'Funa', label: 'Funa' },
        { value: 'Tshangu', label: 'Tshangu' },
        { value: 'Mont-Amba', label: 'Mont-Amba' },
        { value: 'Lukunga', label: 'Lukunga' },
    ];

    // Options pour Province et Secteur (exemple, à adapter selon données réelles)
    const provinces = [
        { value: '', label: 'Toutes les provinces' },
        { value: 'Kinshasa', label: 'Kinshasa' },
        { value: 'Kongo-Central', label: 'Kongo-Central' },
        { value: 'Sud-Kivu', label: 'Sud-Kivu' },
    ];
    // Exemples de secteurs administratifs (à adapter selon la réalité du pays)
    const secteurs = [
        { value: '', label: 'Tous les secteurs' },
        { value: 'Katoka', label: 'Katoka' },
        { value: 'Lubunga', label: 'Lubunga' },
        { value: 'Kipushi', label: 'Kipushi' },
        { value: 'Kasenga', label: 'Kasenga' },
    ];
    const statuts = [
        { value: '', label: 'Tous' },
        { value: 'confirme', label: 'Confirmés' },
        { value: 'nonconfirme', label: 'Non confirmés' },
    ];

    // Options tranches d'âge
    const ageRanges = [
        { value: "", label: "Toutes tranches" },
        { value: "1", label: "< 18 ans" },
        { value: "2", label: "18-30 ans" },
        { value: "3", label: "31-50 ans" },
        { value: "4", label: "> 50 ans" },
    ];

    return (
        <div>
            {/* Barre de recherche + bouton filtre alignés */}
            <div className="flex flex-row flex-wrap items-center gap-2 mb-4 w-full justify-between">
                <div className="flex-1 min-w-[180px] max-w-xs">

                </div>
                <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm border border-pink-100 bg-pink-50 text-pink-700 hover:bg-pink-100 hover:text-pink-900 transition font-medium ml-auto ${showFilters ? 'ring-2 ring-pink-300' : ''}`}
                    onClick={() => setShowFilters(v => !v)}
                >
                    <FiFilter className="text-pink-600" />
                    Filtres
                </button>
            </div>
            {/* Panneau de filtres moderne */}
            {showFilters && (
                <div className="mb-6 p-6 w-full bg-white rounded-2xl border border-pink-100 shadow-lg flex flex-wrap gap-6 items-end animate-fadein">
                    {/* Catégorie */}
                    <div className="flex flex-col min-w-[170px]">
                        <label className="block text-xs text-gray-400 mb-2 font-semibold tracking-wide">Catégorie</label>
                        <Select
                            isClearable
                            options={[{ value: '', label: 'Sélectionner un item' }, ...mockCategories.map((c: any) => ({ value: String(c.id), label: c.nom }))]}
                            value={(() => {
                                if (!currentFilters.categorie) return { value: '', label: 'Sélectionner un item' };
                                const found = mockCategories.find((c: any) => String(c.id) === currentFilters.categorie);
                                return found ? { value: String(found.id), label: found.nom } : null;
                            })()}
                            onChange={(opt: any) => updateFilter('categorie', opt ? opt.value : '')}
                            placeholder="Sélectionner un item"
                            classNamePrefix="react-select"
                            styles={{
                                control: (base) => ({ ...base, minHeight: 46, borderColor: '#f9a8d4', boxShadow: 'none', '&:hover': { borderColor: '#f472b6' } }),
                                option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? '#f472b6' : state.isFocused ? '#fce7f3' : 'white', color: '#831843' }),
                            }}
                        />
                    </div>
                    {/* Province */}
                    <div className="flex flex-col min-w-[170px]">
                        <label className="block text-xs text-gray-400 mb-2 font-semibold tracking-wide">Province</label>
                        <Select
                            isClearable
                            options={provinces}
                            value={provinces.find(p => p.value === currentFilters.province) || provinces[0]}
                            onChange={(opt: any) => updateFilter('province', opt ? opt.value : '')}
                            placeholder="Sélectionner une province"
                            classNamePrefix="react-select"
                            styles={{
                                control: (base) => ({ ...base, minHeight: 46, borderColor: '#f9a8d4', boxShadow: 'none', '&:hover': { borderColor: '#f472b6' } }),
                                option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? '#f472b6' : state.isFocused ? '#fce7f3' : 'white', color: '#831843' }),
                            }}
                        />
                    </div>
                    {/* Territoire */}
                    <div className="flex flex-col min-w-[170px]">
                        <label className="block text-xs text-gray-400 mb-2 font-semibold tracking-wide">Territoire</label>
                        <Select
                            isClearable
                            options={territoires}
                            value={territoires.find(t => t.value === currentFilters.territoire) || territoires[0]}
                            onChange={(opt: any) => updateFilter('territoire', opt ? opt.value : '')}
                            placeholder="Sélectionner un territoire"
                            classNamePrefix="react-select"
                            styles={{
                                control: (base) => ({ ...base, minHeight: 46, borderColor: '#f9a8d4', boxShadow: 'none', '&:hover': { borderColor: '#f472b6' } }),
                                option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? '#f472b6' : state.isFocused ? '#fce7f3' : 'white', color: '#831843' }),
                            }}
                        />
                    </div>
                    {/* Secteur */}
                    <div className="flex flex-col min-w-[170px]">
                        <label className="block text-xs text-gray-400 mb-2 font-semibold tracking-wide">Secteur</label>
                        <Select
                            isClearable
                            options={secteurs}
                            value={secteurs.find(s => s.value === currentFilters.secteur) || secteurs[0]}
                            onChange={(opt: any) => updateFilter('secteur', opt ? opt.value : '')}
                            placeholder="Sélectionner un secteur"
                            classNamePrefix="react-select"
                            styles={{
                                control: (base) => ({ ...base, minHeight: 46, borderColor: '#f9a8d4', boxShadow: 'none', '&:hover': { borderColor: '#f472b6' } }),
                                option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? '#f472b6' : state.isFocused ? '#fce7f3' : 'white', color: '#831843' }),
                            }}
                        />
                    </div>

                    {/* Préjudices */}
                    <div className="flex flex-col min-w-[320px]">
                        <label className="block text-xs text-gray-400 mb-2 font-semibold tracking-wide">Préjudices</label>
                        <Select
                            isClearable
                            options={[{ value: '', label: 'Sélectionner un préjudice' }, ...mockPrejudices.map((p: any) => ({ value: String(p.id), label: p.nom }))]}
                            value={(() => {
                                if (!currentFilters.prejudice) return { value: '', label: 'Sélectionner un préjudice' };
                                const found = mockPrejudices.find((p: any) => String(p.id) === currentFilters.prejudice);
                                return found ? { value: String(found.id), label: found.nom } : null;
                            })()}
                            onChange={(opt: any) => updateFilter('prejudice', opt ? opt.value : '')}
                            placeholder="Sélectionner un préjudice"
                            classNamePrefix="react-select"
                            styles={{
                                control: (base) => ({ ...base, minHeight: 46, borderColor: '#f9a8d4', boxShadow: 'none', '&:hover': { borderColor: '#f472b6' } }),
                                option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? '#f472b6' : state.isFocused ? '#fce7f3' : 'white', color: '#831843' }),
                            }}
                        />
                    </div>

                    {/* Statut */}
                    <div className="flex flex-col min-w-[170px]">
                        <label className="block text-xs text-gray-400 mb-2 font-semibold tracking-wide">Statut</label>
                        <Select
                            isClearable
                            options={statuts}
                            value={statuts.find(s => s.value === currentFilters.statut) || statuts[0]}
                            onChange={(opt: any) => updateFilter('statut', opt ? opt.value : '')}
                            placeholder="Sélectionner un statut"
                            classNamePrefix="react-select"
                            styles={{
                                control: (base) => ({ ...base, minHeight: 46, borderColor: '#f9a8d4', boxShadow: 'none', '&:hover': { borderColor: '#f472b6' } }),
                                option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? '#f472b6' : state.isFocused ? '#fce7f3' : 'white', color: '#831843' }),
                            }}
                        />
                    </div>

                    {/* Boutons d'action */}
                    {filteredVictims.length > 0 && (
                        <div className="w-full flex justify-end mt-4 gap-4">
                            <button
                                className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all transform hover:-translate-y-0.5 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                                onClick={handleGroupConfirmation}
                                disabled={isConfirming}
                            >
                                {isConfirming ? (
                                    <>
                                        <span className="inline-block animate-spin mr-2">⏳</span>
                                        Confirmation en cours...
                                    </>
                                ) : (
                                    `Confirmer les victimes (${filteredVictims.length})`
                                )}
                            </button>
                            <button
                                className="px-6 py-2 rounded-lg bg-gradient-to-r from-fona-pink via-fona-blue to-fona-purple text-blue-600 font-bold shadow hover:scale-105 transition focus:outline-none focus:ring-2 focus:ring-fona-pink font-400"
                                onClick={() => setIsProgressionOpen(true)}
                            >
                                Progression
                            </button>
                        </div>
                    )}

                    <ProgressionModal isOpen={isProgressionOpen} onClose={() => setIsProgressionOpen(false)} />

                </div>
            )}

            {/* Affichage du nombre de victimes filtrées */}
            {filteredVictims.length > 0 && (
                <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-700">Victimes filtrées</h3>
                        <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-medium">
                            {filteredVictims.length} victime{filteredVictims.length > 1 ? 's' : ''} trouvée{filteredVictims.length > 1 ? 's' : ''}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredVictims.slice(0, 9).map((victim: any) => (
                            <div key={victim.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                                <div className="font-medium text-gray-900">{victim.nom}</div>
                                <div className="text-sm text-gray-600">{victim.province}, {victim.territoire}</div>
                                <div className="text-xs text-gray-500 mt-1">{victim.sexe} • {victim.status || 'Non confirmé'}</div>
                            </div>
                        ))}
                    </div>
                    {filteredVictims.length > 9 && (
                        <div className="text-center mt-4 text-sm text-gray-500">
                            ... et {filteredVictims.length - 9} autres victimes
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}

export default VictimsWithFilters;