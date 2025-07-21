import React, { useState, useEffect } from 'react'
import { useFetch } from '../../context/FetchContext';
import Swal from 'sweetalert2';
import { FiEdit, FiTrash, FiPlus, FiSearch } from "react-icons/fi";
import { Modal } from 'flowbite-react';

interface ProgrammeProps {
    categories: any[];
    onProgrammesChange?: (progs: any[]) => void;
}

const Programme: React.FC<ProgrammeProps> = ({ categories, onProgrammesChange }) => {
    const { fetcher, loading: fetchLoading, error: fetchError } = useFetch();
    const [showProgModal, setShowProgModal] = useState(false);
    const [editProg, setEditProg] = useState<any | null>(null);
    const [programmes, setProgrammes] = useState<any[]>([]);
    const [searchProgramme, setSearchProgramme] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    // Helper pour notifier le parent
    const notifyParent = (progs: any[]) => {
        if (onProgrammesChange) onProgrammesChange(progs);
    }

    const handleAddProg = () => {
        setEditProg({ id: null, nom: '', categorie: '' });
        setShowProgModal(true);
    };

    const filteredProgrammes = programmes.filter((p: any) =>
        p.nom.toLowerCase().includes(searchProgramme.toLowerCase()) ||
        (p.categoryNom && p.categoryNom.toLowerCase().includes(searchProgramme.toLowerCase()))
    );
    const totalPages = Math.ceil(filteredProgrammes.length / perPage);

    // CRUD for Programmes
    const fetchProgrammes = async () => {
        try {
            const data = await fetcher('/programmes');
            // Map API format to { id, nom, categorie }
            const mapped = Array.isArray(data)
                ? data.map((item: any) => ({
                    id: item.id,
                    nom: item.programme,
                    categorie: item.categorie,
                    categoryNom: categories.find(c => c.nom === item.categorie)?.nom || item.categorie
                }))
                : [];
            setProgrammes(mapped);
            notifyParent(mapped);
        } catch {
            setProgrammes([]);
            notifyParent([]);
        }
    };

    useEffect(() => {
        fetchProgrammes();
        /* eslint-disable-next-line */
    }, []);

    const handleEditProg = (p: any) => {
        setEditProg({
            id: p.id,
            nom: p.nom,
            categorie: p.categorie
        });
        setShowProgModal(true);
    };

    const handleSaveProg = async (p: any) => {
        // Always use both nom and categorie for update and create
        if (p.id) {
            // UPDATE
            try {
                await fetcher(`/programmes/${p.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ programme: p.nom, categorie: p.categorie })
                });
                setShowProgModal(false);
                setEditProg(null);
                await fetchProgrammes();
                await Swal.fire({
                    icon: 'success',
                    title: 'Programme mis à jour',
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
                await fetcher('/programmes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ programme: p.nom, categorie: p.categorie })
                });
                setShowProgModal(false);
                setEditProg(null);
                await fetchProgrammes();
                await Swal.fire({
                    icon: 'success',
                    title: 'Programme créé',
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

    const handleDeleteProg = async (id: number) => {
        const confirm = await Swal.fire({
            title: 'Supprimer ce programme ?',
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
                await fetcher(`/programmes/${id}`, { method: 'DELETE' });
                await fetchProgrammes();
                await Swal.fire({
                    icon: 'success',
                    title: 'Programme supprimé',
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

            {/* Tableau des programmes */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="py-3 px-4 text-left w-10">#</th>
                            <th className="py-3 px-4 text-left">Nom</th>
                            <th className="py-3 px-4 text-left">Catégorie</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredProgrammes.length > 0 ? (
                            filteredProgrammes
                                .slice((currentPage - 1) * perPage, currentPage * perPage)
                                .map((prog: any, idx: number) => (
                                    <tr key={prog.id} className="hover:bg-gray-50">
                                        <td className="py-3 px-4 font-semibold text-gray-500">
                                            {(currentPage - 1) * perPage + idx + 1}
                                        </td>
                                        <td className="py-3 px-4 font-medium">{prog.nom}</td>
                                        <td className="py-3 px-4">{prog.categoryNom}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex gap-2 justify-end">
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
                                            </div>
                                        </td>
                                    </tr>
                                ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="py-4 text-center text-gray-500">
                                    Aucun programme trouvé
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-500">
                        Page {currentPage} sur {totalPages} • {filteredProgrammes.length} éléments
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Précédent
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                            // Calcul pour une pagination intelligente (ne montre pas toutes les pages si trop nombreuses)
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = idx + 1;
                            } else if (currentPage <= 3) {
                                pageNum = idx + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + idx;
                            } else {
                                pageNum = currentPage - 2 + idx;
                            }

                            return (
                                <button
                                    key={idx}
                                    className={`px-3 py-1 rounded ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                                    onClick={() => setCurrentPage(pageNum)}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button
                            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Suivant
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Flowbite pour Programme */}
            <Modal show={showProgModal} onClose={() => setShowProgModal(false)}>
                <div className="p-6  text-gray-900 !bg-white ">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold">
                            {editProg?.id ? "Modifier le programme" : "Ajouter un programme"}
                        </h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="programmeName" className="block mb-2 text-sm font-medium text-gray-700">
                                Nom du programme
                            </label>
                            <input
                                id="programmeName"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Nom du programme"
                                value={editProg?.nom || ''}
                                onChange={e => setEditProg({ ...editProg, nom: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="programmeCategory" className="block mb-2 text-sm font-medium text-gray-700">
                                Catégorie
                            </label>
                            <select
                                id="programmeCategory"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={editProg?.categorie || ''}
                                onChange={e => setEditProg({ ...editProg, categorie: e.target.value })}
                                required
                            >
                                <option value="" disabled>Choisir la catégorie de victime</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.nom}>{cat.nom}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 w-full mt-6">
                        <button
                            type="button"
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            onClick={() => setShowProgModal(false)}
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            onClick={() => handleSaveProg(editProg)}
                        >
                            Enregistrer
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default Programme;