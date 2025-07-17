import React from 'react'

import { useState, useEffect } from 'react';
import { useFetch } from '../../context/FetchContext';
import Modal from './Modal';
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
    useEffect(() => { fetchViolations(); }, []);

    const handleAdd = () => { setEditViolation({ id: null, nom: '' }); setShowModal(true); };
    const handleEdit = (v: any) => { setEditViolation({ id: v.id, nom: v.nom }); setShowModal(true); };
    const handleSave = async (v: any) => {
        if (!v.nom) return;
        if (v.id) {
            // UPDATE
            try {
                await fetcher(`/violations/${v.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ violation: v.nom })
                });
                setShowModal(false); setEditViolation(null);
                await fetchViolations();
                await Swal.fire({ icon: 'success', title: 'Violation mise à jour', showConfirmButton: false, timer: 1200 });
            } catch (err: any) {
                await Swal.fire({ icon: 'error', title: 'Erreur lors de la mise à jour', text: err?.message || 'Erreur inconnue' });
            }
        } else {
            // CREATE
            try {
                await fetcher('/violations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ violation: v.nom })
                });
                setShowModal(false); setEditViolation(null);
                await fetchViolations();
                await Swal.fire({ icon: 'success', title: 'Violation créée', showConfirmButton: false, timer: 1200 });
            } catch (err: any) {
                await Swal.fire({ icon: 'error', title: 'Erreur lors de la création', text: err?.message || 'Erreur inconnue' });
            }
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
                await Swal.fire({ icon: 'success', title: 'Violation supprimée', showConfirmButton: false, timer: 1200 });
            } catch (err: any) {
                await Swal.fire({ icon: 'error', title: 'Erreur lors de la suppression', text: err?.message || 'Erreur inconnue' });
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
            {/* Barre de recherche Violations */}
            <div className="mb-4 w-full">
                <div className="relative w-full">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
                        <FiSearch size={18} />
                    </span>
                    <input
                        type="text"
                        placeholder="Rechercher une violation..."
                        className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent w-full"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>
            <ul className="text-sm">
                {filtered.slice((currentPage - 1) * perPage, currentPage * perPage).map((violation, idx) => (
                    <li key={violation.id} className="py-2 border-b last:border-0 flex items-center justify-between">
                        <span><span className="font-semibold text-gray-500 mr-2">{(currentPage - 1) * perPage + idx + 1}.</span>{violation.nom}</span>
                        <span className="flex gap-2 ml-auto min-w-[90px]">
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
                        </span>
                    </li>
                ))}
            </ul>
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
            {/* Modal Violation */}
            {showModal && (
                <Modal title={editViolation?.id ? "Modifier la violation" : "Ajouter une violation"} onClose={() => setShowModal(false)}>
                    <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSave(editViolation); }}>
                        <input className="w-full border rounded px-3 py-2" placeholder="Nom" value={editViolation.nom} onChange={e => setEditViolation({ ...editViolation, nom: e.target.value })} required />
                        <div className="flex gap-2 justify-end">
                            <button type="button" className="px-4 py-2 rounded bg-gray-100" onClick={() => setShowModal(false)}>Annuler</button>
                            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Enregistrer</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Violation;