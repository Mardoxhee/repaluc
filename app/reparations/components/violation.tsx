import React, { useState, useEffect } from 'react';
import { useFetch } from '../../context/FetchContext';
import { Modal } from 'flowbite-react';
import Swal from 'sweetalert2';
import { FiEdit, FiTrash, FiPlus, FiSearch } from 'react-icons/fi';

const Violation = () => {
    const { fetcher } = useFetch();
    const [violations, setViolations] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editViolation, setEditViolation] = useState<any | null>(null);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    const fetchViolations = async () => {
        try {
            const data = await fetcher('/violations');
            const mapped = Array.isArray(data)
                ? data.map((item: any) => ({ id: item.id, nom: item.violation }))
                : [];
            setViolations(mapped);
        } catch {
            setViolations([]);
        }
    };

    useEffect(() => { 
        fetchViolations(); 
    }, []);

    const handleAdd = () => { 
        setEditViolation({ id: null, nom: '' }); 
        setShowModal(true); 
    };

    const handleEdit = (v: any) => { 
        setEditViolation({ id: v.id, nom: v.nom }); 
        setShowModal(true); 
    };

    const handleSave = async (v: any) => {
        if (!v.nom) return;
        
        try {
            if (v.id) {
                // UPDATE
                await fetcher(`/violations/${v.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ violation: v.nom })
                });
                await Swal.fire({ 
                    icon: 'success', 
                    title: 'Violation mise à jour', 
                    showConfirmButton: false, 
                    timer: 1200 
                });
            } else {
                // CREATE
                await fetcher('/violations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ violation: v.nom })
                });
                await Swal.fire({ 
                    icon: 'success', 
                    title: 'Violation créée', 
                    showConfirmButton: false, 
                    timer: 1200 
                });
            }
            
            setShowModal(false); 
            setEditViolation(null);
            await fetchViolations();
        } catch (err: any) {
            await Swal.fire({ 
                icon: 'error', 
                title: v.id ? 'Erreur lors de la mise à jour' : 'Erreur lors de la création',
                text: err?.message || 'Erreur inconnue' 
            });
        }
    };

    const handleDelete = async (id: number) => {
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

    const filtered = violations.filter(v => v.nom.toLowerCase().includes(search.toLowerCase()));
    const totalPages = Math.ceil(filtered.length / perPage);

    return (
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Violations</h2>
                <button
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow hover:scale-110 transition-transform"
                    title="Ajouter une violation"
                    onClick={handleAdd}
                >
                    <FiPlus size={22} />
                </button>
            </div>
            
            {/* Barre de recherche */}
            <div className="mb-4 w-full">
                <div className="relative w-full">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher une violation..."
                        className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent w-full"
                        value={search}
                        onChange={e => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
            </div>
            
            {/* Liste des violations */}
            <div className="overflow-hidden rounded-lg border border-gray-200">
                <ul className="divide-y divide-gray-200">
                    {filtered.length > 0 ? (
                        filtered
                            .slice((currentPage - 1) * perPage, currentPage * perPage)
                            .map((violation, idx) => (
                                <li key={violation.id} className="hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between px-4 py-3">
                                        <div className="flex items-center">
                                            <span className="font-semibold text-gray-500 w-6 text-right mr-2">
                                                {(currentPage - 1) * perPage + idx + 1}.
                                            </span>
                                            <span>{violation.nom}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 shadow-sm"
                                                title="Éditer"
                                                onClick={() => handleEdit(violation)}
                                            >
                                                <FiEdit size={18} />
                                            </button>
                                            <button
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-500 shadow-sm"
                                                title="Supprimer"
                                                onClick={() => handleDelete(violation.id)}
                                            >
                                                <FiTrash size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))
                    ) : (
                        <li className="px-4 py-6 text-center text-gray-500">
                            Aucune violation trouvée
                        </li>
                    )}
                </ul>
            </div>
            
            {/* Pagination améliorée */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-500">
                        Page {currentPage} sur {totalPages} • {filtered.length} éléments
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
            
            {/* Modal Flowbite pour Violation */}
            <Modal show={showModal} onClose={() => setShowModal(false)}>
                <div className="p-6 bg-white text-gray-900">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold">
                            {editViolation?.id ? "Modifier la violation" : "Ajouter une violation"}
                        </h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="violationName" className="block mb-2 text-sm font-medium text-gray-700">
                                Nom de la violation
                            </label>
                            <input
                                id="violationName"
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Nom de la violation"
                                value={editViolation?.nom || ''}
                                onChange={e => setEditViolation({ ...editViolation, nom: e.target.value })}
                                required
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 w-full mt-6">
                        <button
                            type="button"
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            onClick={() => setShowModal(false)}
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            onClick={() => handleSave(editViolation)}
                        >
                            Enregistrer
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Violation;