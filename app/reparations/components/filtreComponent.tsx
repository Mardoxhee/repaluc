import React, { useState, useEffect } from "react";
// --- FILTRES AVANCÉS POUR LA LISTE DES VICTIMES ---
import { FiFilter } from "react-icons/fi";
import Select from "react-select";
import { useFetch } from "../../context/FetchContext";

interface VictimsWithFiltersProps {
    mockPrejudices: any[];
    mockCategories: any[];
    mockMesures: any[];
    mockProgrammes: any[];
    onFiltersChange?: (filters: any) => void;
    currentFilters?: any;
}

const VictimsWithFilters: React.FC<VictimsWithFiltersProps> = ({ 
    mockPrejudices, 
    mockMesures, 
    mockProgrammes, 
    mockCategories,
    onFiltersChange,
    currentFilters = {}
}) => {
    const { fetcher } = useFetch();
    const [victims, setVictims] = React.useState<any[]>([]);
    
    // États filtres
    const [showFilters, setShowFilters] = React.useState(false);
    const [filters, setFilters] = React.useState({
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

    // Fonction pour mettre à jour les filtres
    const updateFilter = React.useCallback((key: string, value: string | string[]) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        if (onFiltersChange) {
            onFiltersChange(newFilters);
        }
    }, [filters, onFiltersChange]);

    // Fetch des victimes avec le nouvel endpoint
    React.useEffect(() => {
        let cancelled = false;
        
        const fetchVictims = async () => {
            try {
                // Construire les paramètres de requête
                const params = new URLSearchParams();
                
                // Ajouter les filtres actifs comme paramètres de requête
                Object.entries(filters).forEach(([key, value]) => {
                    if (value && value !== "" && (!Array.isArray(value) || value.length > 0)) {
                        if (key === 'categorie') {
                            const category = mockCategories.find(c => String(c.id) === value);
                            if (category) {
                                params.append(key, category.nom);
                            }
                        } else if (key === 'prejudices' && Array.isArray(value)) {
                            // Pour les préjudices multiples, ajouter chaque valeur
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
                
                // Construire l'URL finale
                const url = `/victime/paginate/filtered${params.toString() ? `?${params.toString()}` : ''}`;
                console.log("Fetching from URL:", url);
                
                const data = await fetcher(url);
                if (!cancelled) {
                    const victimsData = data?.data || data || [];
                    setVictims(victimsData);
                }
            } catch (err: any) {
                console.error("Erreur lors du fetch des victimes:", err);
                if (!cancelled) {
                    setVictims([]);
                }
            }
        };
        
        // Debounce pour éviter trop de requêtes
        const timeoutId = setTimeout(fetchVictims, 300);
        
        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [filters, mockCategories, mockPrejudices, fetcher]);

    // Options tranches d'âge
    const ageRanges = [
        { value: "", label: "Toutes tranches" },
        { value: "1", label: "< 18 ans" },
        { value: "2", label: "18-30 ans" },
        { value: "3", label: "31-50 ans" },
        { value: "4", label: "> 50 ans" },
    ];

    // Options pour Province, Territoire, Secteur
    const provinces = [
        { value: '', label: 'Toutes les provinces' },
        { value: 'Kinshasa', label: 'Kinshasa' },
        { value: 'Kongo-Central', label: 'Kongo-Central' },
        { value: 'Sud-Kivu', label: 'Sud-Kivu' },
    ];
    
    const territoires = [
        { value: '', label: 'Tous les territoires' },
        { value: 'Funa', label: 'Funa' },
        { value: 'Tshangu', label: 'Tshangu' },
        { value: 'Mont-Amba', label: 'Mont-Amba' },
        { value: 'Lukunga', label: 'Lukunga' },
    ];
    
    const secteurs = [
        { value: '', label: 'Tous les secteurs' },
        { value: 'Katoka', label: 'Katoka' },
        { value: 'Lubunga', label: 'Lubunga' },
        { value: 'Kipushi', label: 'Kipushi' },
        { value: 'Kasenga', label: 'Kasenga' },
    ];
    
    const statuts = [
        { value: '', label: 'Tous' },
        { value: 'confirmé', label: 'Confirmés' },
        { value: 'non confirmé', label: 'Non confirmés' },
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
                    {/* Programme */}
                    <div className="flex flex-col min-w-[170px]">
                        <label className="block text-xs text-gray-400 mb-2 font-semibold tracking-wide">Programme</label>
                        <Select
                            isClearable
                            options={[{ value: '', label: 'Sélectionner un item' }, ...mockProgrammes.map((p: any) => ({ value: String(p.id), label: p.nom }))]}
                            value={(() => {
                                if (!filters.programme) return { value: '', label: 'Sélectionner un item' };
                                const found = mockProgrammes.find((p: any) => String(p.id) === filters.programme);
                                return found ? { value: String(found.id), label: found.nom } : null;
                            })()}
                            onChange={(opt: any) => updateFilter('programme', opt ? opt.value : '')}
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
                            value={provinces.find(p => p.value === filters.province) || provinces[0]}
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
                            value={territoires.find(t => t.value === filters.territoire) || territoires[0]}
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
                            value={secteurs.find(s => s.value === filters.secteur) || secteurs[0]}
                            onChange={(opt: any) => updateFilter('secteur', opt ? opt.value : '')}
                            placeholder="Sélectionner un secteur"
                            classNamePrefix="react-select"
                            styles={{
                                control: (base) => ({ ...base, minHeight: 46, borderColor: '#f9a8d4', boxShadow: 'none', '&:hover': { borderColor: '#f472b6' } }),
                                option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? '#f472b6' : state.isFocused ? '#fce7f3' : 'white', color: '#831843' }),
                            }}
                        />
                    </div>
                    {/* Préjudices multi */}
                    <div className="flex flex-col min-w-[320px]">
                        <label className="block text-xs text-gray-400 mb-2 font-semibold tracking-wide">Préjudices</label>
                        <Select
                            isMulti
                            options={mockPrejudices.map((p: any) => ({ value: String(p.id), label: p.nom }))}
                            value={mockPrejudices
                                .map((p: any) => ({ value: String(p.id), label: p.nom }))
                                .filter((opt: any) => filters.prejudices.includes(opt.value))}
                            onChange={(opts: any) => updateFilter('prejudices', opts ? opts.map((o: any) => o.value) : [])}
                            placeholder="Sélectionner..."
                            classNamePrefix="react-select"
                            styles={{
                                control: (base) => ({ ...base, minHeight: 46, borderColor: '#f9a8d4', boxShadow: 'none', '&:hover': { borderColor: '#f472b6' } }),
                                multiValue: (base) => ({ ...base, backgroundColor: '#fce7f3', color: '#db2777' }),
                                multiValueLabel: (base) => ({ ...base, color: '#db2777', fontWeight: 500 }),
                                multiValueRemove: (base) => ({ ...base, color: '#db2777', ':hover': { backgroundColor: '#f472b6', color: 'white' } }),
                                option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? '#f472b6' : state.isFocused ? '#fce7f3' : 'white', color: '#831843' }),
                            }}
                        />
                    </div>
                    {/* Catégorie */}
                    <div className="flex flex-col min-w-[170px]">
                        <label className="block text-xs text-gray-400 mb-2 font-semibold tracking-wide">Catégorie</label>
                        <Select
                            isClearable
                            options={[{ value: '', label: 'Sélectionner un item' }, ...mockCategories.map((c: any) => ({ value: String(c.id), label: c.nom }))]}
                            value={(() => {
                                if (!filters.categorie) return { value: '', label: 'Sélectionner un item' };
                                const found = mockCategories.find((c: any) => String(c.id) === filters.categorie);
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
                    {/* Statut */}
                    <div className="flex flex-col min-w-[170px]">
                        <label className="block text-xs text-gray-400 mb-2 font-semibold tracking-wide">Statut</label>
                        <Select
                            isClearable
                            options={statuts}
                            value={statuts.find(s => s.value === filters.statut) || statuts[0]}
                            onChange={(opt: any) => updateFilter('statut', opt ? opt.value : '')}
                            placeholder="Sélectionner un statut"
                            classNamePrefix="react-select"
                            styles={{
                                control: (base) => ({ ...base, minHeight: 46, borderColor: '#f9a8d4', boxShadow: 'none', '&:hover': { borderColor: '#f472b6' } }),
                                option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? '#f472b6' : state.isFocused ? '#fce7f3' : 'white', color: '#831843' }),
                            }}
                        />
                    </div>
                    {/* Tranche d'âge */}
                    <div className="flex flex-col min-w-[170px]">
                        <label className="block text-xs text-gray-400 mb-2 font-semibold tracking-wide">Tranche d'âge</label>
                        <Select
                            isClearable
                            options={[{ value: '', label: 'Sélectionner un item' }, ...ageRanges.filter(r => r.value !== '').map(r => ({ value: r.value, label: r.label }))]}
                            value={(() => {
                                if (!filters.ageRange) return { value: '', label: 'Sélectionner un item' };
                                const found = ageRanges.find((r: any) => r.value === filters.ageRange);
                                return found ? { value: found.value, label: found.label } : null;
                            })()}
                            onChange={(opt: any) => updateFilter('ageRange', opt ? opt.value : '')}
                            placeholder="Sélectionner un item"
                            classNamePrefix="react-select"
                            styles={{
                                control: (base) => ({ ...base, minHeight: 46, borderColor: '#f9a8d4', boxShadow: 'none', '&:hover': { borderColor: '#f472b6' } }),
                                option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? '#f472b6' : state.isFocused ? '#fce7f3' : 'white', color: '#831843' }),
                            }}
                        />
                    </div>
                    {/* Lettre alphabétique */}
                    <div className="flex flex-col min-w-[170px]">
                        <label className="block text-xs text-gray-400 mb-2 font-semibold tracking-wide">Lettre</label>
                        <div className="flex flex-wrap gap-1">
                            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l => (
                                <button
                                    key={l}
                                    className={`px-2 py-1 rounded-full text-xs font-mono border transition focus:outline-none focus:ring-2 focus:ring-pink-300 ${filters.letter === l ? "bg-pink-600 text-white border-pink-600 shadow" : "bg-white text-gray-500 border-gray-200 hover:bg-pink-50"}`}
                                    onClick={() => updateFilter('letter', l === filters.letter ? "" : l)}
                                    type="button"
                                >{l}</button>
                            ))}
                        </div>
                    </div>

                    {/* Affichage du nombre de victimes trouvées */}
                    {victims.length > 0 && (
                        <div className="w-full flex justify-center mt-4">
                            <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-medium">
                                {victims.length} victime{victims.length > 1 ? 's' : ''} trouvée{victims.length > 1 ? 's' : ''}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Affichage simple de la liste des victimes */}
            {victims.length > 0 && (
                <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
                    <h3 className="font-semibold text-gray-700 mb-4">Victimes filtrées</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {victims.map((victim: any) => (
                            <div key={victim.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                                <div className="font-medium text-gray-900">{victim.nom}</div>
                                <div className="text-sm text-gray-600">{victim.province}, {victim.territoire}</div>
                                <div className="text-xs text-gray-500 mt-1">{victim.sexe} • {victim.status || 'Non confirmé'}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VictimsWithFilters;