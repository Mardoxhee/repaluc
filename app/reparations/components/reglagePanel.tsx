import { useState, useEffect } from 'react'
import Swal from 'sweetalert2';
import { useFetch } from '../../context/FetchContext';
import { mockPartenaires } from '../mockPartenaires';
import { FiEdit, FiTrash, FiPlus, FiEye, FiGrid, FiUsers, FiTrendingUp, FiSettings, FiInfo, FiMapPin, FiHome, FiPhone, FiFolder, FiFileText, FiBarChart2, FiSearch, FiUser } from "react-icons/fi";
import { Modal } from 'flowbite-react';
import ProgrammeConfigPanel from './ProgrammeConfigPanel';
import Programme from "./programme"
import Violation from "./violation"


interface ReglagesProps {
    mockPrejudices: { id: number; nom: string }[];
    mockMesures: { id: number; nom: string }[];
    mockProgrammes: { id: number; nom: string }[];
    mockCategories: { id: number; nom: string }[];
}

const PECMU_PARTENAIRES_STORAGE_KEY = 'pecmu-partenaires-prise-en-charge-v1';

const rdcProvinces = [
    'Bas-Uele',
    'Equateur',
    'Haut-Katanga',
    'Haut-Lomami',
    'Haut-Uele',
    'Ituri',
    'Kasai',
    'Kasai-Central',
    'Kasai-Oriental',
    'Kinshasa',
    'Kongo-Central',
    'Kwango',
    'Kwilu',
    'Lomami',
    'Lualaba',
    'Mai-Ndombe',
    'Maniema',
    'Mongala',
    'Nord-Kivu',
    'Nord-Ubangi',
    'Sankuru',
    'Sud-Kivu',
    'Sud-Ubangi',
    'Tanganyika',
    'Tshopo',
    'Tshuapa',
];

const ReglagesPanel: React.FC<ReglagesProps> = ({ mockPrejudices, mockMesures, mockProgrammes, mockCategories }) => {
    const { fetcher, loading: fetchLoading, error: fetchError } = useFetch();
    // Partenaires
    const [partenaires, setPartenaires] = useState(mockPartenaires);
    const [searchPartenaire, setSearchPartenaire] = useState("");
    const [showPartenaireModal, setShowPartenaireModal] = useState(false);
    const [editPartenaire, setEditPartenaire] = useState<any | null>(null);
    const filteredPartenaires = partenaires.filter((p: any) =>
        p.nom.toLowerCase().includes(searchPartenaire.toLowerCase()) ||
        (p.province && p.province.toLowerCase().includes(searchPartenaire.toLowerCase())) ||
        (p.domaine && p.domaine.toLowerCase().includes(searchPartenaire.toLowerCase())) ||
        (p.contact && p.contact.toLowerCase().includes(searchPartenaire.toLowerCase())) ||
        (p.email && p.email.toLowerCase().includes(searchPartenaire.toLowerCase()))
    );
    const persistPartenaires = (nextPartenaires: any[]) => {
        setPartenaires(nextPartenaires);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(PECMU_PARTENAIRES_STORAGE_KEY, JSON.stringify(nextPartenaires));
        }
    };
    const handleAddPartenaire = () => { setEditPartenaire({ id: null, nom: "", contact: "", domaine: "Santé", email: "", province: "", adresse: "" }); setShowPartenaireModal(true); };
    const handleEditPartenaire = (p: any) => { setEditPartenaire(p); setShowPartenaireModal(true); };
    const handleSavePartenaire = (p: any) => {
        const nextPartenaires = p.id
            ? partenaires.map((x: any) => x.id === p.id ? p : x)
            : [...partenaires, { ...p, id: Date.now() }];
        persistPartenaires(nextPartenaires);
        setShowPartenaireModal(false); setEditPartenaire(null);
    };
    const handleDeletePartenaire = (id: number) => persistPartenaires(partenaires.filter((x: any) => x.id !== id));
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const stored = window.localStorage.getItem(PECMU_PARTENAIRES_STORAGE_KEY);
            if (stored) setPartenaires(JSON.parse(stored));
        } catch {
            setPartenaires(mockPartenaires);
        }
    }, []);
    // States pour chaque entité
    const [programmes, setProgrammes] = useState<any[]>([]);

    const [categories] = useState(mockCategories);
    const [prejudices, setPrejudices] = useState<any[]>([]);
    const [mesures, setMesures] = useState<any[]>([]);
    // Violations
    const [violations, setViolations] = useState<any[]>([]);
    const [searchViolation, setSearchViolation] = useState("");

    // Recherche et pagination programmes

    const [searchCategorie, setSearchCategorie] = useState("");
    const [searchPrejudice, setSearchPrejudice] = useState("");
    const [searchMesure, setSearchMesure] = useState("");


    // Recherche pour les autres listes
    const filteredCategories = categories.filter(cat => cat.nom.toLowerCase().includes(searchCategorie.toLowerCase()));
    const filteredPrejudices = prejudices.filter(prej => typeof prej.nom === 'string' && prej.nom.toLowerCase().includes(searchPrejudice.toLowerCase()));
    const filteredMesures = mesures.filter(mesure => mesure.nom.toLowerCase().includes(searchMesure.toLowerCase()));
    const filteredViolations = violations.filter(v => v.nom.toLowerCase().includes(searchViolation.toLowerCase()));

    // Modales


    const [showPrejModal, setShowPrejModal] = useState(false);
    const [editPrej, setEditPrej] = useState<any | null>(null);
    const [showMesureModal, setShowMesureModal] = useState(false);
    const [editMesure, setEditMesure] = useState<any | null>(null);
    const [showViolationModal, setShowViolationModal] = useState(false);
    const [editViolation, setEditViolation] = useState<any | null>(null);

    // CRUD Violations
    const fetchViolations = async () => {
        try {
            const data = await fetcher('/violations');
            const mapped = Array.isArray(data)
                ? data.map((item: any) => ({ id: item.id, nom: item.violation }))
                : [];
            setViolations(mapped);
        } catch (err) {
            setViolations([]);
        }
    };
    useEffect(() => { fetchViolations(); /* eslint-disable-next-line */ }, []);
    const handleAddViolation = () => { setEditViolation({ id: null, nom: "" }); setShowViolationModal(true); };
    const handleEditViolation = (v: any) => { setEditViolation({ id: v.id, nom: v.nom }); setShowViolationModal(true); };
    const handleSaveViolation = async (v: any) => {
        if (!v.nom) return;
        if (v.id) {
            // UPDATE
            try {
                await fetcher(`/violations/${v.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ violation: v.nom })
                });
                setShowViolationModal(false); setEditViolation(null);
                await fetchViolations();
                await Swal.fire({
                    icon: 'success',
                    title: 'Violation mise à jour',
                    showConfirmButton: false,
                    timer: 1200
                });
            } catch (err: any) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Erreur lors de la mise à jour',
                    text: err?.message || 'Erreur inconnue'
                });
            }
        } else {
            // CREATE
            try {
                await fetcher('/violations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ violation: v.nom })
                });
                setShowViolationModal(false); setEditViolation(null);
                await fetchViolations();
                await Swal.fire({
                    icon: 'success',
                    title: 'Violation créée',
                    showConfirmButton: false,
                    timer: 1200
                });
            } catch (err: any) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Erreur lors de la création',
                    text: err?.message || 'Erreur inconnue'
                });
            }
        }
    };
    const handleDeleteViolation = async (id: number) => {
        const confirm = await Swal.fire({
            title: 'Supprimer cette violation ?',
            text: 'Cette action est irréversible.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Oui, supprimer',
            cancelButtonText: 'Annuler'
        });
        if (confirm.isConfirmed) {
            try {
                await fetcher(`/violations/${id}`, { method: 'DELETE' });
                await fetchViolations();
                await Swal.fire({
                    icon: 'success',
                    title: 'Violation supprimée',
                    showConfirmButton: false,
                    timer: 1200
                });
            } catch (err: any) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Erreur lors de la suppression',
                    text: err?.message || 'Erreur inconnue'
                });
            }
        }
    };
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


    // Idem pour Prejudices et Mesures (CRUD minimal)
    const handleAddPrej = () => { setEditPrej({ id: null, nom: "" }); setShowPrejModal(true); };
    const handleEditPrej = (p: any) => { setEditPrej({ id: p.id, nom: p.nom }); setShowPrejModal(true); };

    // Fetch prejudices from API
    const fetchPrejudices = async () => {
        try {
            const data = await fetcher('/prejudices');
            // Map API format to expected front format { id, nom }
            const mapped = Array.isArray(data)
                ? data.map((item: any) => ({ id: item.id, nom: item.prejudice }))
                : [];
            setPrejudices(mapped);
        } catch (err) {
            setPrejudices([]);
        }
    };

    useEffect(() => {
        fetchPrejudices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSavePrej = async (p: any) => {
        if (p.id) {
            // UPDATE
            try {
                await fetcher(`/prejudices/${p.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prejudice: p.nom })
                });
                setShowPrejModal(false); setEditPrej(null);
                await fetchPrejudices();
                await Swal.fire({
                    icon: 'success',
                    title: 'Préjudice mis à jour',
                    showConfirmButton: false,
                    timer: 1200
                });
            } catch (err: any) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Erreur lors de la mise à jour',
                    text: err?.message || 'Erreur inconnue'
                });
            }
        } else {
            // CREATE
            try {
                await fetcher('/prejudices', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prejudice: p.nom })
                });
                setShowPrejModal(false); setEditPrej(null);
                await fetchPrejudices();
                await Swal.fire({
                    icon: 'success',
                    title: 'Préjudice créé',
                    showConfirmButton: false,
                    timer: 1200
                });
            } catch (err: any) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Erreur lors de la création',
                    text: err?.message || 'Erreur inconnue'
                });
            }
        }
    };


    const handleDeletePrej = async (id: number) => {
        const confirm = await Swal.fire({
            title: 'Supprimer ce préjudice ?',
            text: 'Cette action est irréversible.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Oui, supprimer',
            cancelButtonText: 'Annuler'
        });
        if (confirm.isConfirmed) {
            try {
                await fetcher(`/prejudices/${id}`, {
                    method: 'DELETE'
                });
                await fetchPrejudices();
                await Swal.fire({
                    icon: 'success',
                    title: 'Préjudice supprimé',
                    showConfirmButton: false,
                    timer: 1200
                });
            } catch (err: any) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Erreur lors de la suppression',
                    text: err?.message || 'Erreur inconnue'
                });
            }
        }
    };

    // CRUD for Mesures
    const fetchMesures = async () => {
        try {
            const data = await fetcher('/mesures-reparation');
            // Map API format to { id, nom }
            const mapped = Array.isArray(data)
                ? data.map((item: any) => ({ id: item.id, nom: item.mesure }))
                : [];
            setMesures(mapped);
        } catch {
            setMesures([]);
        }
    };
    useEffect(() => { fetchMesures(); /* eslint-disable-next-line */ }, []);
    const handleAddMesure = () => { setEditMesure({ id: null, nom: '' }); setShowMesureModal(true); };
    const handleEditMesure = (m: any) => { setEditMesure({ id: m.id, nom: m.nom }); setShowMesureModal(true); };
    const handleSaveMesure = async (m: any) => {
        if (m.id) {
            // UPDATE
            try {
                await fetcher(`/mesures-reparation/${m.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mesure: m.nom })
                });
                setShowMesureModal(false); setEditMesure(null);
                await fetchMesures();
                await Swal.fire({
                    icon: 'success',
                    title: 'Mesure mise à jour',
                    showConfirmButton: false,
                    timer: 1200
                });
            } catch (err: any) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Erreur lors de la mise à jour',
                    text: err?.message || 'Erreur inconnue'
                });
            }
        } else {
            // CREATE
            try {
                await fetcher('/mesures-reparation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mesure: m.nom })
                });
                setShowMesureModal(false); setEditMesure(null);
                await fetchMesures();
                await Swal.fire({
                    icon: 'success',
                    title: 'Mesure créée',
                    showConfirmButton: false,
                    timer: 1200
                });
            } catch (err: any) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Erreur lors de la création',
                    text: err?.message || 'Erreur inconnue'
                });
            }
        }
    };
    const handleDeleteMesure = async (id: number) => {
        const confirm = await Swal.fire({
            title: 'Supprimer cette mesure ?',
            text: 'Cette action est irréversible.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Oui, supprimer',
            cancelButtonText: 'Annuler'
        });
        if (confirm.isConfirmed) {
            try {
                await fetcher(`/mesures-reparation/${id}`, { method: 'DELETE' });
                await fetchMesures();
                await Swal.fire({
                    icon: 'success',
                    title: 'Mesure supprimée',
                    showConfirmButton: false,
                    timer: 1200
                });
            } catch (err: any) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Erreur lors de la suppression',
                    text: err?.message || 'Erreur inconnue'
                });
            }
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow p-6 border border-gray-100 md:col-span-2">
                <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Paramètres PECMU</h2>
                        <p className="text-sm text-gray-500">Configuration des partenaires de prise en charge médicale urgente.</p>
                    </div>
                    <button
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow hover:scale-110 transition-transform"
                        title="Ajouter un partenaire PECMU"
                        onClick={handleAddPartenaire}
                    >
                        <FiPlus size={22} />
                    </button>
                </div>

                <div className="mb-4 w-full">
                    <div className="relative w-full">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
                            <FiSearch size={18} />
                        </span>
                        <input
                            type="text"
                            placeholder="Rechercher un partenaire PECMU..."
                            className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent w-full"
                            value={searchPartenaire}
                            onChange={e => setSearchPartenaire(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-4 py-3 text-left">Partenaire</th>
                                <th className="px-4 py-3 text-left">Domaine</th>
                                <th className="px-4 py-3 text-left">Province</th>
                                <th className="px-4 py-3 text-left">Contact</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPartenaires.map((partenaire: any) => (
                                <tr key={partenaire.id} className="border-b last:border-0">
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-gray-900">{partenaire.nom}</div>
                                        {partenaire.adresse ? <div className="text-xs text-gray-500">{partenaire.adresse}</div> : null}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">{partenaire.domaine || '-'}</td>
                                    <td className="px-4 py-3 text-gray-700">{partenaire.province || '-'}</td>
                                    <td className="px-4 py-3 text-gray-700">
                                        <div>{partenaire.contact || '-'}</div>
                                        {partenaire.email ? <div className="text-xs text-gray-500">{partenaire.email}</div> : null}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="ml-auto flex justify-end gap-2">
                                            <button
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 shadow-sm"
                                                title="Éditer"
                                                onClick={() => handleEditPartenaire(partenaire)}
                                            >
                                                <FiEdit size={18} />
                                            </button>
                                            <button
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-500 shadow-sm"
                                                title="Supprimer"
                                                onClick={() => handleDeletePartenaire(partenaire.id)}
                                            >
                                                <FiTrash size={18} />
                                            </button>
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {filteredPartenaires.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        Aucun partenaire PECMU configuré.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Modal show={showPartenaireModal} onClose={() => setShowPartenaireModal(false)}>
                    {editPartenaire && (
                        <div className="p-6 bg-white text-gray-900 rounded-xl">
                            <div className="mb-4">
                                <h3 className="text-lg font-bold">
                                    {editPartenaire.id ? "Modifier le partenaire PECMU" : "Ajouter un partenaire PECMU"}
                                </h3>
                            </div>
                            <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSavePartenaire(editPartenaire); }}>
                                <input
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Nom du partenaire"
                                    value={editPartenaire.nom}
                                    onChange={e => setEditPartenaire({ ...editPartenaire, nom: e.target.value })}
                                    required
                                />
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <input
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Domaine"
                                        value={editPartenaire.domaine}
                                        onChange={e => setEditPartenaire({ ...editPartenaire, domaine: e.target.value })}
                                    />
                                    <select
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={editPartenaire.province || ''}
                                        onChange={e => setEditPartenaire({ ...editPartenaire, province: e.target.value })}
                                    >
                                        <option value="">Province</option>
                                        {rdcProvinces.map((province) => (
                                            <option key={province} value={province}>{province}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <input
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Téléphone"
                                        value={editPartenaire.contact}
                                        onChange={e => setEditPartenaire({ ...editPartenaire, contact: e.target.value })}
                                    />
                                    <input
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Email"
                                        value={editPartenaire.email}
                                        onChange={e => setEditPartenaire({ ...editPartenaire, email: e.target.value })}
                                    />
                                </div>
                                <textarea
                                    className="min-h-24 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Adresse / notes de référencement"
                                    value={editPartenaire.adresse || ''}
                                    onChange={e => setEditPartenaire({ ...editPartenaire, adresse: e.target.value })}
                                />
                                <div className="flex gap-2 justify-end mt-6">
                                    <button type="button" className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200" onClick={() => setShowPartenaireModal(false)}>Annuler</button>
                                    <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Enregistrer</button>
                                </div>
                            </form>
                        </div>
                    )}
                </Modal>
            </div>

            {/* Programmes */}
            <Programme categories={categories} onProgrammesChange={setProgrammes} />

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
            <Violation />

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
                {/* Modal Préjudice (Flowbite) */}
                <Modal show={showPrejModal} onClose={() => setShowPrejModal(false)}>
                    {editPrej && (
                        <div className="p-6 bg-white text-gray-900 rounded-xl">
                            <div className="mb-4">
                                <h3 className="text-lg font-bold">
                                    {editPrej.id ? "Modifier le préjudice" : "Ajouter un préjudice"}
                                </h3>
                            </div>
                            <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSavePrej(editPrej); }}>
                                <input
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Nom"
                                    value={editPrej.nom}
                                    onChange={e => setEditPrej({ ...editPrej, nom: e.target.value })}
                                    required
                                />
                                {fetchLoading && <div className="text-blue-600 text-sm">Enregistrement en cours...</div>}
                                {fetchError && <div className="text-red-600 text-sm">Erreur : {fetchError}</div>}
                                <div className="flex gap-2 justify-end mt-6">
                                    <button type="button" className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200" onClick={() => setShowPrejModal(false)}>Annuler</button>
                                    <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" disabled={fetchLoading}>Enregistrer</button>
                                </div>
                            </form>
                        </div>
                    )}
                </Modal>
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
                {/* Modal Mesure (Flowbite) */}
                <Modal show={showMesureModal} onClose={() => setShowMesureModal(false)}>
                    {editMesure && (
                        <div className="p-6 bg-white text-gray-900 rounded-xl">
                            <div className="mb-4">
                                <h3 className="text-lg font-bold">
                                    {editMesure.id ? "Modifier la mesure" : "Ajouter une mesure"}
                                </h3>
                            </div>
                            <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSaveMesure(editMesure); }}>
                                <input
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Nom"
                                    value={editMesure.nom}
                                    onChange={e => setEditMesure({ ...editMesure, nom: e.target.value })}
                                    required
                                />
                                <div className="flex gap-2 justify-end mt-6">
                                    <button type="button" className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200" onClick={() => setShowMesureModal(false)}>Annuler</button>
                                    <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Enregistrer</button>
                                </div>
                            </form>
                        </div>
                    )}
                </Modal>
            </div>

            <ProgrammeConfigPanel programmes={programmes} prejudices={prejudices} mesures={mesures} violations={violations} />
        </div>
    )
}

export default ReglagesPanel;
