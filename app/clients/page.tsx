"use client";
import React from "react";
import Link from "next/link";

const fakeClients = [
    {
        id: 1,
        type: "entreprise",
        denomination: "Mazaya S.A.",
        siege: "Abidjan Plateau",
        rccm: "CI-ABJ-2023-B-12345",
        num_impot: "123456789A",
        type_entreprise: "sa",
        rep_nom: "Jean Kouassi",
        rep_tel: "+2250700000001",
        rep_email: "jk@mazaya.com",
        email: "contact@mazaya.com",
        tel: "+2250700000000",
    },
    {
        id: 2,
        type: "individu",
        fullname: "Awa Diabaté",
        adresse: "Yopougon, Abidjan",
        tel: "+2250700000012",
        email: "awa.dia@gmail.com",
    },
    {
        id: 3,
        type: "entreprise",
        denomination: "Tech Innov SARL",
        siege: "Cocody Riviera",
        rccm: "CI-ABJ-2022-B-54321",
        num_impot: "987654321B",
        type_entreprise: "sarl",
        rep_nom: "Fatou Traoré",
        rep_tel: "+2250700000022",
        rep_email: "ft@techinnov.com",
        email: "contact@techinnov.com",
        tel: "+2250700000020",
    },
    {
        id: 4,
        type: "individu",
        fullname: "Moussa Koné",
        adresse: "Marcory, Abidjan",
        tel: "+2250700000033",
        email: "moussa.kone@gmail.com",
    },
];

const typeBadge = (type: string) =>
    type === "entreprise" ? (
        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">Entreprise</span>
    ) : (
        <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-semibold">Individu</span>
    );

const companyTypes = [
    { value: "sa", label: "Société Anonyme (SA)" },
    { value: "sarl", label: "SARL" },
    { value: "sas", label: "SAS" },
    { value: "association", label: "Association" },
    { value: "autre", label: "Autre" },
];

const ListClients = () => {
    const [filterType, setFilterType] = React.useState<string>("");
    const [filterCompanyType, setFilterCompanyType] = React.useState<string>("");
    const [search, setSearch] = React.useState<string>("");
    const [page, setPage] = React.useState<number>(1);
    const perPage = 10;

    // État local pour la liste, l'édition et le modal
    const [clients, setClients] = React.useState(fakeClients);
    const [editClient, setEditClient] = React.useState<any | null>(null);
    const [showModal, setShowModal] = React.useState(false);

    // Filtrage
    const filtered = clients.filter((c) => {
        if (filterType && c.type !== filterType) return false;
        if (filterCompanyType && c.type === "entreprise" && c.type_entreprise !== filterCompanyType) return false;
        if (search) {
            const s = search.toLowerCase();
            if (c.type === "entreprise") {
                if (!c.denomination?.toLowerCase().includes(s) && !c.email.toLowerCase().includes(s)) return false;
            } else {
                if (!c.fullname?.toLowerCase().includes(s) && !c.email.toLowerCase().includes(s)) return false;
            }
        }
        return true;
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const paginated = filtered.slice((page - 1) * perPage, page * perPage);

    React.useEffect(() => { setPage(1); }, [filterType, filterCompanyType, search]);
    const EditClientModal = ({ client, onClose, onSave }: { client: any, onClose: () => void, onSave: (c: any) => void }) => {
        const [form, setForm] = React.useState<any>(client);
        const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
        const fileInputRef = React.useRef<HTMLInputElement>(null);

        React.useEffect(() => {
            setForm(client);
            setLogoPreview(client.logo ? (typeof client.logo === 'string' ? client.logo : URL.createObjectURL(client.logo)) : null);
            // eslint-disable-next-line
        }, [client]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            const { name, value } = e.target;
            setForm((prev: any) => ({ ...prev, [name]: value }));
        };
        const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                setForm((prev: any) => ({ ...prev, logo: file }));
                setLogoPreview(URL.createObjectURL(file));
            }
        };
        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            onSave(form);
        };
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl relative border border-gray-100">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-pink-500 text-xl font-bold"
                    >×</button>
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Modifier le client</h2>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {client.type === "entreprise" ? (
                            <>
                                {/* Logo */}
                                <div className="flex flex-col items-center">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo de l'entreprise</label>
                                    <div
                                        className="w-20 h-20 rounded-xl border-2 border-dashed border-pink-300 flex items-center justify-center bg-gray-50 hover:bg-pink-50 transition cursor-pointer relative mb-2"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover rounded-xl" />
                                        ) : (
                                            <svg className="w-8 h-8 text-pink-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                            </svg>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            name="logo"
                                            onChange={handleLogoChange}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-400">PNG, JPG, SVG (max 2Mo)</span>
                                </div>
                                {/* Dénomination sociale */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dénomination sociale</label>
                                    <input
                                        type="text"
                                        name="denomination"
                                        value={form.denomination || ""}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                                        placeholder="Ex: Mazaya S.A."
                                        required
                                    />
                                </div>
                                {/* Siège social */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Siège social</label>
                                    <input
                                        type="text"
                                        name="siege"
                                        value={form.siege || ""}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                                        placeholder="Adresse du siège social"
                                        required
                                    />
                                </div>
                                {/* RCCM */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">RCCM</label>
                                    <input
                                        type="text"
                                        name="rccm"
                                        value={form.rccm || ""}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                                        placeholder="Numéro RCCM"
                                        required
                                    />
                                </div>
                                {/* Numéro d'impôt */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro d'impôt</label>
                                    <input
                                        type="text"
                                        name="num_impot"
                                        value={form.num_impot || ""}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                                        placeholder="Numéro d'identification fiscale"
                                        required
                                    />
                                </div>
                                {/* Type d'entreprise */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type d'entreprise</label>
                                    <select
                                        name="type_entreprise"
                                        value={form.type_entreprise || ""}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                                        required
                                    >
                                        <option value="" disabled>Sélectionne un type</option>
                                        {companyTypes.map((t) => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                {/* Représentant légal */}
                                <div className="pt-4">
                                    <div className="font-semibold text-gray-700 mb-2">Personne représentant l'entreprise</div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                                            <input
                                                type="text"
                                                name="rep_nom"
                                                value={form.rep_nom || ""}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                                                placeholder="Nom du représentant"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                            <input
                                                type="tel"
                                                name="rep_tel"
                                                value={form.rep_tel || ""}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                                                placeholder="Numéro de téléphone"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                            <input
                                                type="email"
                                                name="rep_email"
                                                value={form.rep_email || ""}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                                                placeholder="Email du représentant"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Formulaire individu */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                                    <input
                                        type="text"
                                        name="fullname"
                                        value={form.fullname || ""}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                                        placeholder="Nom et prénom"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                    <input
                                        type="tel"
                                        name="tel"
                                        value={form.tel || ""}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                                        placeholder="Numéro de téléphone"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email || ""}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                                        placeholder="Email"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                                    <input
                                        type="text"
                                        name="adresse"
                                        value={form.adresse || ""}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                                        placeholder="Adresse complète"
                                        required
                                    />
                                </div>
                            </>
                        )}
                        <div className="pt-2 flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2 rounded-lg border bg-gray-50 text-gray-600 hover:bg-pink-50"
                            >Annuler</button>
                            <button
                                type="submit"
                                className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold shadow-md hover:scale-[1.02] hover:shadow-lg transition-all duration-200"
                            >Enregistrer</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };
    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-14 px-4">
                <div className="max-w-7xl mx-auto w-full px-2">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
                        <Link
                            href="/clients/register"
                            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold rounded-lg shadow-md hover:scale-[1.03] hover:shadow-lg transition-all duration-200"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            Nouveau client
                        </Link>
                    </div>
                    {/* Filtres */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
                        <input
                            type="text"
                            placeholder="Rechercher nom ou email..."
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent w-full md:w-64"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <select
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent w-full md:w-48"
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                        >
                            <option value="">Tous types</option>
                            <option value="entreprise">Entreprise</option>
                            <option value="individu">Individu</option>
                        </select>
                        {filterType === "entreprise" && (
                            <select
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent w-full md:w-56"
                                value={filterCompanyType}
                                onChange={e => setFilterCompanyType(e.target.value)}
                            >
                                <option value="">Tous types d'entreprise</option>
                                {companyTypes.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div className="overflow-x-auto rounded-2xl shadow-lg bg-white/90 border border-gray-100">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nom / Raison sociale</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">RCCM</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Représentant</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {paginated.length === 0 && (
                                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">Aucun client trouvé</td></tr>
                                )}
                                {paginated.map((client) => (
                                    <tr key={client.id} className="hover:bg-pink-50/30 transition">
                                        {/* Type */}
                                        <td className="px-6 py-4 align-middle whitespace-nowrap">
                                            <span className={client.type === 'entreprise' ? 'bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold' : 'bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-semibold'}>
                                                {client.type === 'entreprise' ? 'Entreprise' : 'Individu'}
                                            </span>
                                        </td>
                                        {/* Nom ou dénomination */}
                                        <td className="px-6 py-4 align-middle whitespace-nowrap">
                                            {client.type === 'entreprise' ? client.denomination : client.fullname}
                                        </td>
                                        {/* Contact */}
                                        <td className="px-6 py-4 align-middle whitespace-nowrap">{client.tel || client.rep_tel || '-'}</td>
                                        {/* Email */}
                                        <td className="px-6 py-4 align-middle whitespace-nowrap">{client.email || client.rep_email || '-'}</td>
                                        {/* RCCM */}
                                        <td className="px-6 py-4 align-middle whitespace-nowrap">{client.rccm || '-'}</td>
                                        {/* Représentant */}
                                        <td className="px-6 py-4 align-middle whitespace-nowrap">{client.rep_nom || '-'}</td>
                                        {/* Actions */}
                                        <td className="px-6 py-4 align-middle whitespace-nowrap flex gap-2 justify-center">
                                            <button
                                                className="group p-2 rounded-full hover:bg-blue-100 text-blue-600 hover:text-blue-800 transition"
                                                title="Modifier"
                                                onClick={() => {
                                                    setEditClient(client);
                                                    setShowModal(true);
                                                }}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.071-6.071a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3.414a2 2 0 01.586-1.414z" />
                                                </svg>
                                            </button>
                                            <button
                                                className="group p-2 rounded-full hover:bg-pink-100 text-pink-600 hover:text-pink-800 transition"
                                                title="Supprimer"
                                                onClick={() => {
                                                    if (window.confirm('Voulez-vous vraiment supprimer ce client ?')) {
                                                        setClients(prev => prev.filter(c => c.id !== client.id));
                                                    }
                                                }}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
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
                        <span className="px-2 py-2 text-gray-700 font-medium">Page {page} / {totalPages}</span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className="px-4 py-2 rounded-lg border bg-white text-gray-600 hover:bg-pink-50 disabled:opacity-50"
                            disabled={page === totalPages}
                        >
                            Suivant
                        </button>
                    </div>
                </div>
            </div>
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
        </>
    )




}

export default ListClients