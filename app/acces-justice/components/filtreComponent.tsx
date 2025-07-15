import React, { useState, useEffect } from "react";
// --- FILTRES AVANCÉS POUR LA LISTE DES VICTIMES ---
import { FiFilter } from "react-icons/fi";
import Select from "react-select";

const VictimsWithFilters = ({ mockPrejudices, mockMesures, mockProgrammes, mockCategories }: any) => {
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
            letter: "A"
        },
        {
            id: 2,
            fullname: "Benoît Kamba",
            age: 42,
            sexe: "M",
            programme: 2,
            prejudices: [3],
            categorie: 1,
            letter: "B"
        },
        {
            id: 3,
            fullname: "Clara Moke",
            age: 17,
            sexe: "F",
            programme: 1,
            prejudices: [2, 5],
            categorie: 1,
            letter: "C"
        },
    ]);
    // États filtres
    const [showFilters, setShowFilters] = React.useState(false);
    const [programme, setProgramme] = React.useState<string>("");
    const [prejudices, setPrejudices] = React.useState<string[]>([]);
    const [categorie, setCategorie] = React.useState<string>("");
    const [letter, setLetter] = React.useState<string>("");
    const [ageRange, setAgeRange] = React.useState<string>("");

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
                    {/* Programme */}
                    <div className="flex flex-col min-w-[170px]">
                        <label className="block text-xs text-gray-400 mb-2 font-semibold tracking-wide">Programme</label>
                        <Select
                            isClearable
                            options={[{ value: '', label: 'Sélectionner un item' }, ...mockProgrammes.map((p: any) => ({ value: String(p.id), label: p.nom }))]}
                            value={(() => {
                                if (!programme) return { value: '', label: 'Sélectionner un item' };
                                const found = mockProgrammes.find((p: any) => String(p.id) === programme);
                                return found ? { value: String(found.id), label: found.nom } : null;
                            })()}
                            onChange={(opt: any) => setProgramme(opt ? opt.value : '')}
                            placeholder="Sélectionner un item"
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

                </div>
            )}

        </div>
    );
};

export default VictimsWithFilters;