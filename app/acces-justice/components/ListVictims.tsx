import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash, FiPlus, FiEye, FiGrid, FiUsers, FiTrendingUp, FiSettings, FiInfo, FiMapPin, FiHome, FiPhone, FiFolder, FiFileText, FiBarChart2, FiSearch, FiUser } from "react-icons/fi";
import VictimForm from "./VictimForm";
import VictimDetailModal from "./VictimDetailModal";
import VictimsWithFilters from './filtreComponent'

const fakeClients = [
    {
        id: 1,
        fullname: "Awa Diabaté",
        province: "Nord-Kivu",
        territoire: "Goma",
        sexe: "F",
        status: "Pris en charge",
    },
    {
        id: 2,
        fullname: "Moussa Koné",
        province: "Sud-Kivu",
        territoire: "Bukavu",
        sexe: "M",
        status: "En attente",
    },
    {
        id: 3,
        fullname: "Fatou Traoré",
        province: "Ituri",
        territoire: "Bunia",
        sexe: "F",
        status: "Rejeté",
    },
    {
        id: 4,
        fullname: "Jean Kouassi",
        province: "Haut-Uele",
        territoire: "Isiro",
        sexe: "M",
        status: "Pris en charge",
    },
    {
        id: 5,
        fullname: "Chantal Mbayo",
        province: "Maniema",
        territoire: "Kindu",
        sexe: "F",
        status: "En attente",
    },
    {
        id: 6,
        fullname: "Eric Ilunga",
        province: "Tshopo",
        territoire: "Kisangani",
        sexe: "M",
        status: "Pris en charge",
    },
    {
        id: 7,
        fullname: "Gloria Tshisekedi",
        province: "Kasai",
        territoire: "Tshikapa",
        sexe: "F",
        status: "Pris en charge",
    },
    {
        id: 8,
        fullname: "Patrick Lumumba",
        province: "Bas-Uele",
        territoire: "Buta",
        sexe: "M",
        status: "Rejeté",
    },
    {
        id: 9,
        fullname: "Marie Kabila",
        province: "Kwilu",
        territoire: "Kikwit",
        sexe: "F",
        status: "En attente",
    },
    {
        id: 10,
        fullname: "Serge Bemba",
        province: "Mongala",
        territoire: "Lisala",
        sexe: "M",
        status: "Pris en charge",
    },
];

interface ReglagesProps {
    mockPrejudices: { id: number; nom: string }[];
    mockMesures: { id: number; nom: string }[];
    mockProgrammes: { id: number; nom: string }[];
    mockCategories: { id: number; nom: string }[];
}


const ListVictims: React.FC<ReglagesProps> = ({ mockPrejudices, mockMesures, mockProgrammes, mockCategories }) => {
    const [filterType, setFilterType] = React.useState<string>("");
    const [search, setSearch] = React.useState<string>("");
    const [page, setPage] = React.useState<number>(1);
    const perPage = 10;

    // État local pour la liste, l'édition et le modal
    const [clients, setClients] = React.useState(fakeClients);
    const [editClient, setEditClient] = React.useState<any | null>(null);
    const [showModal, setShowModal] = React.useState(false);
    const [victimDetail, setVictimDetail] = React.useState<any | null>(null);
    const [showVictimModal, setShowVictimModal] = React.useState(false);

    // Filtrage
    const filtered = clients.filter((c: any) => {
        if (!c) return false;
        if (search) {
            const s = search.toLowerCase();
            return (
                (typeof c.fullname === 'string' && c.fullname.toLowerCase().includes(s)) ||
                (typeof c.province === 'string' && c.province.toLowerCase().includes(s)) ||
                (typeof c.territoire === 'string' && c.territoire.toLowerCase().includes(s))
            );
        }
        return true;
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const paginated = filtered.slice((page - 1) * perPage, page * perPage);

    React.useEffect(() => { setPage(1); }, [filterType, search]);
    const EditClientModal = ({ client, onClose, onSave }: { client: any, onClose: () => void, onSave: (c: any) => void }) => {
        const [form, setForm] = React.useState<any>(client);


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
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-14 px-4">
                <div className="max-w-7xl mx-auto w-full px-8">
                    <div className="flex items-center justify-between w-full mb-8 ">
                        <h1 className="text-3xl font-bold text-gray-900">Victimes</h1>
                    </div>
                    {/* Filtres */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6 items-center ">
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
                    <VictimsWithFilters mockPrejudices={mockPrejudices}
                        mockMesures={mockMesures}
                        mockProgrammes={mockProgrammes}
                        mockCategories={mockCategories} />


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
                                {paginated.length === 0 && (
                                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">Aucun client trouvé</td></tr>
                                )}
                            </tbody>

                            <tbody>
                                {paginated.map((client, idx) => (
                                    <tr key={client.id} className="border-b hover:bg-blue-50/30 transition">
                                        <td className="px-4 py-3">{(page - 1) * perPage + idx + 1}</td>
                                        <td className="px-4 py-3 font-semibold text-gray-900">{client.fullname}</td>
                                        <td className="px-4 py-3">{client.province}</td>
                                        <td className="px-4 py-3">{client.territoire}</td>
                                        <td className="px-4 py-3">{client.sexe}</td>
                                        <td className="px-4 py-3">
                                            {client.status === "Pris en charge" && (
                                                <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">Pris en charge</span>
                                            )}
                                            {client.status === "En attente" && (
                                                <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">En attente</span>
                                            )}
                                            {client.status === "Rejeté" && (
                                                <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Rejeté</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 flex gap-2 justify-center">
                                            <button
                                                className="group flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-500 hover:bg-blue-700 text-white border border-blue-600 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                title="Voir les détails"
                                                onClick={() => { setVictimDetail(client); setShowVictimModal(true); }}
                                            >
                                                <FiEye className="w-5 h-5" />
                                                <span className="hidden sm:inline">Détails</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="px-4 py-2 rounded-lg border bg-white text-gray-600 hover:bg-pink-50 disabled:opacity-50"
                        disabled={page === 1}
                    >
                        Précédent
                    </button>
                    <span className="px-2 py-2 text-gray-700 font-medium">Page {page} / {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        className="px-4 py-2 rounded-lg border bg-white text-gray-600 hover:bg-pink-50 disabled:opacity-50"
                        disabled={page === totalPages}
                    >
                        Suivant
                    </button>
                </div>
            </div >

            {
                showModal && editClient && (
                    <EditClientModal
                        client={editClient}
                        onClose={() => { setShowModal(false); setEditClient(null) }}
                        onSave={(updated: any) => {
                            setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
                            setShowModal(false);
                            setEditClient(null);
                        }}
                    />
                )
            }
            {
                showVictimModal && victimDetail && (
                    <VictimDetailModal
                        victim={victimDetail}
                        onClose={() => setShowVictimModal(false)}
                    />
                )
            }

        </>
    )
}

export default ListVictims;