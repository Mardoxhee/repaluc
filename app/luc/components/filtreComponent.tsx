"use client"
import React, { useState, useEffect } from "react";
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
}

const VictimsWithFilters: React.FC<VictimsWithFiltersProps> = ({ 
    mockPrejudices, 
    mockCategories, 
    mockMesures, 
    mockProgrammes, 
    onFiltersChange, 
    currentFilters 
}) => {
    const { fetcher } = useFetch();

    // États filtres
    const [showFilters, setShowFilters] = React.useState(false);
    // Modal progression
    const [isProgressionOpen, setIsProgressionOpen] = useState(false);
    const [isConfirming, setIsConfirming] = React.useState(false);
    
    // State pour les victimes filtrées (pour la confirmation groupée)
    const [filteredVictims, setFilteredVictims] = React.useState<any[]>([]);

    // Fonction pour mettre à jour les filtres
    const updateFilter = (key: string, value: string) => {
        const newFilters = { ...currentFilters, [key]: value };
        onFiltersChange(newFilters);
    };

    // Fetch des victimes filtrées SEULEMENT pour la confirmation groupée
    React.useEffect(() => {
        const fetchFilteredVictims = async () => {
            // Ne fetch que si au moins un filtre est appliqué
            const hasFilters = Object.values(currentFilters).some(value => value !== "");
            if (!hasFilters) {
                setFilteredVictims([]);
                return;
            }
            
            try {
                const params = new URLSearchParams();
                if (currentFilters.categorie) params.append('categorie', currentFilters.categorie);
                if (currentFilters.province) params.append('province', currentFilters.province);
                if (currentFilters.territoire) params.append('territoire', currentFilters.territoire);
                if (currentFilters.secteur) params.append('secteur', currentFilters.secteur);
                if (currentFilters.prejudice) params.append('prejudice', currentFilters.prejudice);
                if (currentFilters.statut) params.append('statut', currentFilters.statut);
                
                const queryString = params.toString();
                const url = queryString ? `/victime?${queryString}` : "/victime";
                
                const data = await fetcher(url);
                setFilteredVictims(data || []);
            } catch (err: any) {
                console.error("Erreur lors du fetch des victimes filtrées:", err);
                setFilteredVictims([]);
            }
        };
        
        // Debounce pour éviter trop de requêtes
        const timeoutId = setTimeout(fetchFilteredVictims, 300);
        return () => clearTimeout(timeoutId);
    }, [currentFilters, fetcher]);

    const handleGroupConfirmation = async () => {
        console.log("Bouton confirmation groupée cliqué");
        
        // Vérifier qu'au moins un filtre est appliqué
        const hasFilters = Object.values(currentFilters).some(value => value !== "");
        if (!hasFilters) {
            alert("Veuillez sélectionner au moins un filtre pour la confirmation groupée");
            return;
        }

        if (filteredVictims.length === 0) {
            alert("Aucune victime trouvée avec les filtres sélectionnés");
            return;
        }

        setIsConfirming(true);

        try {
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
    };

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
                    {Object.values(currentFilters).some(value => value !== "") && filteredVictims.length > 0 && (
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

        </div>
    );
}

export default VictimsWithFilters;