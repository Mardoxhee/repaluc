import { useState, useEffect } from 'react'
import { mockPartenaires } from '../mockPartenaires';
import { FiEdit, FiTrash, FiPlus, FiEye, FiGrid, FiUsers, FiTrendingUp, FiSettings, FiInfo, FiMapPin, FiHome, FiPhone, FiFolder, FiFileText, FiBarChart2, FiSearch, FiUser } from "react-icons/fi";
import Modal from './Modal';
import ProgrammeConfigPanel from './ProgrammeConfigPanel';


interface ReglagesProps {
    mockPrejudices: { id: number; nom: string }[];
    mockMesures: { id: number; nom: string }[];
    mockProgrammes: { id: number; nom: string }[];
    mockCategories: { id: number; nom: string }[];
}

const ReglagesPanel: React.FC<ReglagesProps> = ({ mockPrejudices, mockMesures, mockProgrammes, mockCategories }) => {
    // Partenaires
    const [partenaires, setPartenaires] = useState(mockPartenaires);
    const [searchPartenaire, setSearchPartenaire] = useState("");
    const [showPartenaireModal, setShowPartenaireModal] = useState(false);
    const [editPartenaire, setEditPartenaire] = useState<any | null>(null);
    const filteredPartenaires = partenaires.filter((p: any) =>
        p.nom.toLowerCase().includes(searchPartenaire.toLowerCase()) ||
        (p.domaine && p.domaine.toLowerCase().includes(searchPartenaire.toLowerCase())) ||
        (p.contact && p.contact.toLowerCase().includes(searchPartenaire.toLowerCase())) ||
        (p.email && p.email.toLowerCase().includes(searchPartenaire.toLowerCase()))
    );
    const handleAddPartenaire = () => { setEditPartenaire({ id: null, nom: "", contact: "", domaine: "", email: "" }); setShowPartenaireModal(true); };
    const handleEditPartenaire = (p: any) => { setEditPartenaire(p); setShowPartenaireModal(true); };
    const handleSavePartenaire = (p: any) => {
        if (p.id) setPartenaires((prev: any[]) => prev.map(x => x.id === p.id ? p : x));
        else setPartenaires((prev: any[]) => [...prev, { ...p, id: Date.now() }]);
        setShowPartenaireModal(false); setEditPartenaire(null);
    };
    const handleDeletePartenaire = (id: number) => setPartenaires((prev: any[]) => prev.filter(x => x.id !== id));
    // States pour chaque entité
    const [programmes, setProgrammes] = useState(mockProgrammes);
    const [categories] = useState(mockCategories);
    const [prejudices, setPrejudices] = useState(mockPrejudices);
    const [mesures, setMesures] = useState(mockMesures);

    // Recherche et pagination programmes
    const [searchProgramme, setSearchProgramme] = useState("");
    const [searchCategorie, setSearchCategorie] = useState("");
    const [searchPrejudice, setSearchPrejudice] = useState("");
    const [searchMesure, setSearchMesure] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;
    const filteredProgrammes = programmes.filter((p: any) =>
        p.nom.toLowerCase().includes(searchProgramme.toLowerCase()) ||
        (p.categoryNom && p.categoryNom.toLowerCase().includes(searchProgramme.toLowerCase()))
    );
    const totalPages = Math.ceil(filteredProgrammes.length / perPage);
    // Recherche pour les autres listes
    const filteredCategories = categories.filter(cat => cat.nom.toLowerCase().includes(searchCategorie.toLowerCase()));
    const filteredPrejudices = prejudices.filter(prej => prej.nom.toLowerCase().includes(searchPrejudice.toLowerCase()));
    const filteredMesures = mesures.filter(mesure => mesure.nom.toLowerCase().includes(searchMesure.toLowerCase()));

    // Modales
    const [showProgModal, setShowProgModal] = useState(false);
    const [editProg, setEditProg] = useState<any | null>(null);
    const [showPrejModal, setShowPrejModal] = useState(false);
    const [editPrej, setEditPrej] = useState<any | null>(null);
    const [showMesureModal, setShowMesureModal] = useState(false);
    const [editMesure, setEditMesure] = useState<any | null>(null);

    // Configuration programme
    const [selectedProg, setSelectedProg] = useState<number | null>(null);
    const [selectedPrej, setSelectedPrej] = useState<number | null>(null);
    const [selectedMesure, setSelectedMesure] = useState<number | null>(null);
    const [configurations, setConfigurations] = useState<Array<{ programmeId: number, prejudiceId: number, mesureId: number }>>([]);
    const handleAddConfig = (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        if (!selectedProg || !selectedPrej || !selectedMesure) return;
        // Empêcher les doublons
        if (configurations.some(cfg => cfg.programmeId === selectedProg && cfg.prejudiceId === selectedPrej && cfg.mesureId === selectedMesure)) return;
        setConfigurations(prev => [...prev, { programmeId: selectedProg, prejudiceId: selectedPrej, mesureId: selectedMesure }]);
    };

    // Handlers CRUD (exemple pour Programmes)
    const handleAddProg = () => { setEditProg({ id: null, nom: "", description: "" }); setShowProgModal(true); };
    const handleEditProg = (p: any) => { setEditProg(p); setShowProgModal(true); };
    const handleSaveProg = (p: any) => {
        if (p.id) setProgrammes(prev => prev.map(x => x.id === p.id ? p : x));
        else setProgrammes(prev => [...prev, { ...p, id: Date.now() }]);
        setShowProgModal(false); setEditProg(null);
    };
    const handleDeleteProg = (id: number) => setProgrammes(prev => prev.filter(x => x.id !== id));

    // Idem pour Prejudices et Mesures (CRUD minimal)
    const handleAddPrej = () => { setEditPrej({ id: null, nom: "" }); setShowPrejModal(true); };
    const handleEditPrej = (p: any) => { setEditPrej(p); setShowPrejModal(true); };
    const handleSavePrej = (p: any) => {
        if (p.id) setPrejudices(prev => prev.map(x => x.id === p.id ? p : x));
        else setPrejudices(prev => [...prev, { ...p, id: Date.now() }]);
        setShowPrejModal(false); setEditPrej(null);
    };
    const handleDeletePrej = (id: number) => setPrejudices(prev => prev.filter(x => x.id !== id));

    const handleAddMesure = () => { setEditMesure({ id: null, nom: "" }); setShowMesureModal(true); };
    const handleEditMesure = (m: any) => { setEditMesure(m); setShowMesureModal(true); };
    const handleSaveMesure = (m: any) => {
        if (m.id) setMesures(prev => prev.map(x => x.id === m.id ? m : x));
        else setMesures(prev => [...prev, { ...m, id: Date.now() }]);
        setShowMesureModal(false); setEditMesure(null);
    };
    const handleDeleteMesure = (id: number) => setMesures(prev => prev.filter(x => x.id !== id));

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Programmes */}
            <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Programmes de réparation</h2>
                    <button
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow hover:scale-110 transition-transform"
                        title="Ajouter un programme"
                        onClick={handleAddProg}
                    >
                        <FiPlus size={22} />
                    </button>
                </div>
                {/* Barre de recherche */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2 items-center w-full max-w-md">
                        <div className="relative w-full">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Rechercher un programme ou une catégorie..."
                                className="pl-10 pr-4 py-2 w-full rounded-xl bg-white border border-gray-300 shadow-sm text-sm focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                                value={searchProgramme}
                                onChange={e => { setSearchProgramme(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                    </div>
                </div>
                <table className="w-full text-sm">
                    <thead><tr className="text-gray-500 font-semibold"><th className="py-2 text-left w-10">#</th><th className="py-2 text-left">Nom</th><th>Catégorie</th><th></th></tr></thead>
                    <tbody>
                        {filteredProgrammes.slice((currentPage - 1) * perPage, currentPage * perPage).map((prog: any, idx: number) => (
                            <tr key={prog.id} className="border-b last:border-0">
                                <td className="py-2 font-semibold text-gray-500">{(currentPage - 1) * perPage + idx + 1}</td>
                                <td className="py-2 font-medium">{prog.nom}</td>
                                <td>{prog.categoryNom}</td>
                                <td className="flex gap-2">
                                    <button
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 shadow-sm"
                                        title="Éditer"
                                        onClick={() => handleEditProg(prog)}
                                    >
                                        <FiEdit size={18} />
                                    </button>
                                    <button
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-500 shadow-sm"
                                        title="Supprimer"
                                        onClick={() => handleDeleteProg(prog.id)}
                                    >
                                        <FiTrash size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-end gap-2 mt-2">
                        <button
                            className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >Précédent</button>
                        {Array.from({ length: totalPages }).map((_, idx) => (
                            <button
                                key={idx}
                                className={`px-3 py-1 rounded ${currentPage === idx + 1 ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                                onClick={() => setCurrentPage(idx + 1)}
                            >{idx + 1}</button>
                        ))}
                        <button
                            className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >Suivant</button>
                    </div>
                )}
                {/* Modal Programme */}
                {showProgModal && (
                    <Modal title={editProg?.id ? "Modifier le programme" : "Ajouter un programme"} onClose={() => setShowProgModal(false)}>
                        <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSaveProg(editProg); }}>
                            <input className="w-full border rounded px-3 py-2" placeholder="Nom" value={editProg.nom} onChange={e => setEditProg({ ...editProg, nom: e.target.value })} required />
                            <select
                                className="w-full border rounded px-3 py-2"
                                value={editProg.categoryId || ''}
                                onChange={e => {
                                    const catId = Number(e.target.value);
                                    const cat = categories.find(c => c.id === catId);
                                    setEditProg({ ...editProg, categoryId: catId, categoryNom: cat ? cat.nom : '' });
                                }}
                                required
                            >
                                <option value="" disabled>Choisir la catégorie de victime</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.nom}</option>
                                ))}
                            </select>
                            <div className="flex gap-2 justify-end">
                                <button type="button" className="px-4 py-2 rounded bg-gray-100" onClick={() => setShowProgModal(false)}>Annuler</button>
                                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Enregistrer</button>
                            </div>
                        </form>
                    </Modal>
                )}
            </div>
            {/* Catégories de victimes */}
            <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Catégories de victimes</h2>
                </div>
                {/* Barre de recherche Catégories */}
                <div className="mb-4 w-full">
                    <div className="relative w-full">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
                            <FiSearch size={18} />
                        </span>
                        <input
                            type="text"
                            placeholder="Rechercher une catégorie..."
                            className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent w-full"
                            value={searchCategorie}
                            onChange={e => setSearchCategorie(e.target.value)}
                        />
                    </div>
                </div>
                <ul className="text-sm">
                    {filteredCategories.map((cat, idx) => (
                        <li key={cat.id} className="py-2 border-b last:border-0"><span className="font-semibold text-gray-500 mr-2">{idx + 1}.</span>{cat.nom}</li>
                    ))}
                </ul>
            </div>
            {/* Préjudices */}
            <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Préjudices</h2>
                    <button
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow hover:scale-110 transition-transform"
                        title="Ajouter un préjudice"
                        onClick={handleAddPrej}
                    >
                        <FiPlus size={22} />
                    </button>
                </div>
                {/* Barre de recherche Préjudices */}
                <div className="mb-4 w-full">
                    <div className="relative w-full">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
                            <FiSearch size={18} />
                        </span>
                        <input
                            type="text"
                            placeholder="Rechercher un préjudice..."
                            className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent w-full"
                            value={searchPrejudice}
                            onChange={e => setSearchPrejudice(e.target.value)}
                        />
                    </div>
                </div>
                <ul className="text-sm">
                    {filteredPrejudices.map((prej, idx) => (
                        <li key={prej.id} className="py-2 border-b last:border-0 flex items-center justify-between">
                            <span><span className="font-semibold text-gray-500 mr-2">{idx + 1}.</span>{prej.nom}</span>
                            <span className="flex gap-2 ml-auto min-w-[90px]">
                                <button
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 shadow-sm"
                                    title="Éditer"
                                    onClick={() => handleEditPrej(prej)}
                                >
                                    <FiEdit size={18} />
                                </button>
                                <button
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-500 shadow-sm"
                                    title="Supprimer"
                                    onClick={() => handleDeletePrej(prej.id)}
                                >
                                    <FiTrash size={18} />
                                </button>
                            </span>
                        </li>
                    ))}
                </ul>
                {/* Modal Préjudice */}
                {showPrejModal && (
                    <Modal title={editPrej?.id ? "Modifier le préjudice" : "Ajouter un préjudice"} onClose={() => setShowPrejModal(false)}>
                        <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSavePrej(editPrej); }}>
                            <input className="w-full border rounded px-3 py-2" placeholder="Nom" value={editPrej.nom} onChange={e => setEditPrej({ ...editPrej, nom: e.target.value })} required />
                            <div className="flex gap-2 justify-end">
                                <button type="button" className="px-4 py-2 rounded bg-gray-100" onClick={() => setShowPrejModal(false)}>Annuler</button>
                                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Enregistrer</button>
                            </div>
                        </form>
                    </Modal>
                )}
            </div>
            {/* Mesures de réparation */}
            <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Mesures de réparation</h2>
                    <button
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow hover:scale-110 transition-transform"
                        title="Ajouter une mesure"
                        onClick={handleAddMesure}
                    >
                        <FiPlus size={22} />
                    </button>
                </div>
                {/* Barre de recherche Mesures */}
                <div className="mb-4 w-full">
                    <div className="relative w-full">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
                            <FiSearch size={18} />
                        </span>
                        <input
                            type="text"
                            placeholder="Rechercher une mesure..."
                            className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent w-full"
                            value={searchMesure}
                            onChange={e => setSearchMesure(e.target.value)}
                        />
                    </div>
                </div>
                <ul className="text-sm">
                    {filteredMesures.map((mesure, idx) => (
                        <li key={mesure.id} className="py-2 border-b last:border-0 flex items-center justify-between">
                            <span><span className="font-semibold text-gray-500 mr-2">{idx + 1}.</span>{mesure.nom}</span>
                            <span className="flex gap-2 ml-auto min-w-[90px]">
                                <button
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 shadow-sm"
                                    title="Éditer"
                                    onClick={() => handleEditMesure(mesure)}
                                >
                                    <FiEdit size={18} />
                                </button>
                                <button
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-500 shadow-sm"
                                    title="Supprimer"
                                    onClick={() => handleDeleteMesure(mesure.id)}
                                >
                                    <FiTrash size={18} />
                                </button>
                            </span>
                        </li>
                    ))}
                </ul>
                {/* Modal Mesure */}
                {showMesureModal && (
                    <Modal title={editMesure?.id ? "Modifier la mesure" : "Ajouter une mesure"} onClose={() => setShowMesureModal(false)}>
                        <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSaveMesure(editMesure); }}>
                            <input className="w-full border rounded px-3 py-2" placeholder="Nom" value={editMesure.nom} onChange={e => setEditMesure({ ...editMesure, nom: e.target.value })} required />
                            <div className="flex gap-2 justify-end">
                                <button type="button" className="px-4 py-2 rounded bg-gray-100" onClick={() => setShowMesureModal(false)}>Annuler</button>
                                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Enregistrer</button>
                            </div>
                        </form>
                    </Modal>
                )}
            </div>
            <ProgrammeConfigPanel programmes={programmes} prejudices={prejudices} mesures={mesures} />
        </div>
    );
}
export default ReglagesPanel;