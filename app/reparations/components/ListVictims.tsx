import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash, FiPlus, FiEye, FiGrid, FiUsers, FiTrendingUp, FiSettings, FiInfo, FiMapPin, FiHome, FiPhone, FiFolder, FiFileText, FiBarChart2, FiSearch, FiUser } from "react-icons/fi";
import VictimForm from "./VictimForm";
import VictimDetailModal from "./VictimDetailModal";
import VictimsWithFilters from './filtreComponent';

interface ListVictimsProps {
    mockPrejudices: any[];
    mockMesures: any[];
    mockProgrammes: any[];
    mockCategories: any[];
}

const ListVictims: React.FC<ListVictimsProps> = ({
    mockPrejudices,
    mockMesures,
    mockProgrammes,
    mockCategories
}) => {
    // État local pour la liste, l'édition et le modal
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    const [search, setSearch] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [perPage] = useState<number>(10);
    const [editClient, setEditClient] = useState<any | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [victimDetail, setVictimDetail] = useState<any | null>(null);
    const [showVictimModal, setShowVictimModal] = useState(false);

    // Fetch dynamique
    useEffect(() => {
        setLoading(true);
        setError("");
        // Utiliser le nouvel endpoint avec les paramètres par défaut
        const params = new URLSearchParams();
        params.append('status', 'confirmé'); // Filtrer par défaut les victimes confirmées
        
        fetch(`http://10.140.0.106:8006/victime/paginate/filtered?${params.toString()}`)
            .then(res => {
                if (!res.ok) throw new Error("Erreur lors du chargement des victimes");
                return res.json();
            })
            .then(data => {
                setClients(Array.isArray(data.data) ? data.data : []);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message || "Erreur inconnue");
                setLoading(false);
            });
    }, []);

    // Filtrage
    const filtered = clients.filter((c: any) => {
        if (!c) return false;
        if (search) {
            const s = search.toLowerCase();
            return (
                (typeof c.nom === 'string' && c.nom.toLowerCase().includes(s)) ||
                (typeof c.province === 'string' && c.province.toLowerCase().includes(s)) ||
                (typeof c.territoire === 'string' && c.territoire.toLowerCase().includes(s))
            );
        }
        return true;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const paginated = filtered.slice((page - 1) * perPage, page * perPage);

    useEffect(() => {
        setPage(1);
    }, [search]);

    const EditClientModal = ({ client, onClose, onSave }: { client: any, onClose: () => void, onSave: (c: any) => void }) => {
        const [form, setForm] = useState<any>(client);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            const { name, value } = e.target;
            setForm((prev: any) => ({ ...prev, [name]: value }));
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            onSave(form);
        };

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl relative border border-gray-100">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-pink-500 text-xl font-bold"
                    >×</button>
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Modifier le client</h2>
                    <VictimForm
                        form={form}
                        onChange={handleChange}
                        onSubmit={handleSubmit}
                        onClose={onClose}
                        isEdit={true}
                        prejudices={mockPrejudices}
                        categories={mockCategories}
                        programmes={mockProgrammes}
                    />
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="w-full p-6">
                <div className="w-full">
                    <div className="flex items-center justify-between w-full mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Victimes</h1>
                    </div>

                    {/* Filtres */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
                        <div className="relative w-full max-w-md">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Rechercher par nom..."
                                className="pl-10 pr-4 py-2 w-full rounded-xl bg-white border border-gray-300 shadow-sm text-sm focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <VictimsWithFilters
                        mockPrejudices={mockPrejudices}
                        mockMesures={mockMesures}
                        mockProgrammes={mockProgrammes}
                        mockCategories={mockCategories}
                    />

                    <div className="overflow-x-auto rounded-2xl shadow-lg bg-white/90 border border-gray-100">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">N*</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nom complet</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Province</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Territoire</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sexe</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-gray-400">
                                            {loading ? "Chargement..." : "Aucun client trouvé"}
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((client: any, index: number) => (
                                        <tr key={client.id || index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {(page - 1) * perPage + index + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {client.nom || 'Non spécifié'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {client.province || 'Non spécifié'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {client.territoire || 'Non spécifié'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {client.sexe || 'Non spécifié'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {client.status || 'Non spécifié'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                                <button
                                                    onClick={() => {
                                                        setVictimDetail(client);
                                                        setShowVictimModal(true);
                                                    }}
                                                    className="text-pink-600 hover:text-pink-900 mr-3 flex items-center justify-center gap-1"
                                                >
                                                    <FiEye className="w-5 h-5" />
                                                    <span className="hidden sm:inline">Détails</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="px-4 py-2 rounded-lg border bg-white text-gray-600 hover:bg-pink-50 disabled:opacity-50"
                            disabled={page === 1}
                        >
                            Précédent
                        </button>
                        <span className="px-2 py-2 text-gray-700 font-medium">
                            Page {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className="px-4 py-2 rounded-lg border bg-white text-gray-600 hover:bg-pink-50 disabled:opacity-50"
                            disabled={page === totalPages}
                        >
                            Suivant
                        </button>
                    </div>
                </div>

                {showModal && editClient && (
                    <EditClientModal
                        client={editClient}
                        onClose={() => { setShowModal(false); setEditClient(null); }}
                        onSave={(updated: any) => {
                            setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
                            setShowModal(false);
                            setEditClient(null);
                        }}
                    />
                )}

                {showVictimModal && victimDetail && (
                    <VictimDetailModal
                        victim={victimDetail}
                        onClose={() => setShowVictimModal(false)}
                    />
                )}
            </div>
        </>
    );
};

export default ListVictims;