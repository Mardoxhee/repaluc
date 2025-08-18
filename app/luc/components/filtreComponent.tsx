"use client"
import React, { useState, useEffect } from "react";
import { FiFilter } from "react-icons/fi";
import ProgressionModal from "./ProgressionModal";
import Select from "react-select";
import { useFetch } from "../../context/FetchContext";

const VictimsWithFilters = ({ mockPrejudices, mockCategories }: any) => {
    const { fetcher } = useFetch();
    // Mocks de victimes (à remplacer par API plus tard)
    const [victims] = React.useState([
        {
            id: 1,
            fullname: "Alice Moke",
            age: 24,
            sexe: "F",
            programme: 1,
            prejudices: [1, 2],
            categorie: 2,
            letter: "A",
            statut: 'confirme',
            province: 'Kinshasa',
            secteur: 'Katoka',
        },
        {
            id: 2,
            fullname: "Benoît Kamba",
            age: 42,
            sexe: "M",
            programme: 2,
            prejudices: [3],
            categorie: 1,
            letter: "B",
            statut: 'nonconfirme',
            province: 'Kongo-Central',
            secteur: 'Lubunga',
        },
        {
            id: 3,
            fullname: "Clara Moke",
            age: 17,
            sexe: "F",
            programme: 1,
            prejudices: [2, 5],
            categorie: 1,
            letter: "C",
            statut: 'confirme',
            province: 'Sud-Kivu',
            secteur: 'Kipushi',
        },
    ]);
    // États filtres
    const [showFilters, setShowFilters] = React.useState(false);
    // Modal progression
    const [isProgressionOpen, setIsProgressionOpen] = useState(false);
    const [programme, setProgramme] = React.useState<string>("");
    const [prejudices, setPrejudices] = React.useState<string[]>([]);
    const [categorie, setCategorie] = React.useState<string>("");
    const [letter, setLetter] = React.useState<string>("");
    const [ageRange, setAgeRange] = React.useState<string>("");
    // Nouveaux filtres
    const [statut, setStatut] = React.useState<string>(""); // '', 'confirme', 'nonconfirme'
    const [province, setProvince] = React.useState<string>("");
    const [secteur, setSecteur] = React.useState<string>("");
    // Territoire
    const [territoire, setTerritoire] = React.useState<string>("");
    const [isConfirming, setIsConfirming] = React.useState(false);

    const handleGroupConfirmation = async () => {
        console.log("cliqued")
        if (!province && !territoire && !secteur) {
            alert("Veuillez sélectionner au moins un filtre (province, territoire ou secteur) pour la confirmation groupée");
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
                programmeCategorie: victim.categoryNom || mockCategories.find(c => c.id === victim.categorie)?.nom || "",
                prejudiceType: victim.prejudiceNom || mockPrejudices.find(p => p.id === victim.prejudices?.[0])?.nom || "",
                violation: victim.typeViolation || "Violation non spécifiée",
                victimeId: victim.id
            }));

            console.log("Données de confirmation groupée:", confirmationData);

            // Envoyer la requête POST
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
            const response = await fetcher(`${baseUrl}/programme-prejudice-mesure/classify`, {
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

    // Barre de recherche (simple, à améliorer selon besoins)
    const [search, setSearch] = React.useState("");

    // Recherche + filtres combinés
    const filteredVictims = victims.filter(v => {
        let ok = true;
        if (programme && String(v.programme) !== programme) ok = false;
        if (prejudices.length > 0 && !prejudices.every(p => v.prejudices.includes(Number(p)))) ok = false;
        if (categorie && String(v.categorie) !== categorie) ok = false;
        if (letter && !v.fullname.toUpperCase().startsWith(letter)) ok = false;
        if (ageRange) {
            if (ageRange === "1" && v.age >= 18) ok = false;
            if (ageRange === "2" && (v.age < 18 || v.age > 30)) ok = false;
            if (ageRange === "3" && (v.age < 31 || v.age > 50)) ok = false;
            if (ageRange === "4" && v.age <= 50) ok = false;
        }
        if (statut) {
            // Pour la démo, on suppose que la propriété v.statut existe ('confirme' ou 'nonconfirme')
            if (v.statut !== statut) ok = false;
        }
        if (province && v.province !== province) ok = false;
        if (secteur && v.secteur !== secteur) ok = false;
        if (search && !v.fullname.toLowerCase().includes(search.toLowerCase())) ok = false;
        return ok;
    });


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
                    {/* Statut */}
                    {/* <div className="flex flex-col min-w-[170px]">
                        <label className="block text-xs text-gray-400 mb-2 font-semibold tracking-wide">Statut</label>
                        <Select
                            isClearable
                            options={statuts}
                            value={statuts.find(s => s.value === statut) || statuts[0]}
                            onChange={(opt: any) => setStatut(opt ? opt.value : '')}
                            placeholder="Sélectionner un statut"
                            classNamePrefix="react-select"
                            styles={{
                                control: (base) => ({ ...base, minHeight: 46, borderColor: '#f9a8d4', boxShadow: 'none', '&:hover': { borderColor: '#f472b6' } }),
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
                                if (!categorie) return { value: '', label: 'Sélectionner un item' };
                                const found = mockCategories.find((c: any) => String(c.id) === categorie);
                                return found ? { value: String(found.id), label: found.nom } : null;
                            })()}
                            onChange={(opt: any) => setCategorie(opt ? opt.value : '')}
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
                            value={provinces.find(p => p.value === province) || provinces[0]}
                            onChange={(opt: any) => setProvince(opt ? opt.value : '')}
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
                            value={territoires.find(t => t.value === territoire) || territoires[0]}
                            onChange={(opt: any) => setTerritoire(opt ? opt.value : '')}
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
                            value={secteurs.find(s => s.value === secteur) || secteurs[0]}
                            onChange={(opt: any) => setSecteur(opt ? opt.value : '')}
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
                                .filter((opt: any) => prejudices.includes(opt.value))}
                            onChange={(opts: any) => setPrejudices(opts ? opts.map((o: any) => o.value) : [])}
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

                    {/* Tranche d'âge */}
                    <div className="flex flex-col min-w-[170px]">
                        <label className="block text-xs text-gray-400 mb-2 font-semibold tracking-wide">Tranche d'âge</label>
                        <Select
                            isClearable
                            options={[{ value: '', label: 'Sélectionner un item' }, ...ageRanges.filter(r => r.value !== '').map(r => ({ value: r.value, label: r.label }))]}
                            value={(() => {
                                if (!ageRange) return { value: '', label: 'Sélectionner un item' };
                                const found = ageRanges.find((r: any) => r.value === ageRange);
                                return found ? { value: found.value, label: found.label } : null;
                            })()}
                            onChange={(opt: any) => setAgeRange(opt ? opt.value : '')}
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
                                    className={`px-2 py-1 rounded-full text-xs font-mono border transition focus:outline-none focus:ring-2 focus:ring-pink-300 ${letter === l ? "bg-pink-600 text-white border-pink-600 shadow" : "bg-white text-gray-500 border-gray-200 hover:bg-pink-50"}`}
                                    onClick={() => setLetter(l === letter ? "" : l)}
                                    type="button"
                                >{l}</button>
                            ))}
                        </div>
                    </div>
                    {(categorie || province || territoire || secteur) && (
                        <div className="w-full flex justify-end mt-4 gap-4">
                            <button
                                className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all transform hover:-translate-y-0.5 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                            >
                                Confirmer les victimes
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

                    {/* Bouton de confirmation groupée */}
                    {(province || territoire || secteur) && filteredVictims.length > 0 && (
                        <div className="w-full flex justify-center mt-6">
                            <button
                                className="px-8 py-3 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleGroupConfirmation}
                                disabled={isConfirming}
                            >
                                {isConfirming ? (
                                    <>
                                        <span className="inline-block animate-spin mr-2">⏳</span>
                                        Confirmation en cours...
                                    </>
                                ) : (
                                    `Confirmation groupée (${filteredVictims.length} victimes)`
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}


        </div>
    );
}

export default VictimsWithFilters;