"use client"
import React from "react";
import Link from "next/link";
import MainLayout from "@/components/layouts/MainLayout";

// Mock data
const fakeSouscriptions = [
    {
        id: 1,
        client: "Mazaya S.A.",
        application: "CRM Pro",
        echeance: "2025-06-25",
        status: "active",
    },
    {
        id: 2,
        client: "Awa Diabaté",
        application: "Facturation Cloud",
        echeance: "2025-06-12",
        status: "active",
    },
    {
        id: 3,
        client: "Tech Innov SARL",
        application: "RH Manager",
        echeance: "2025-06-10",
        status: "expiring",
    },
    {
        id: 4,
        client: "Moussa Koné",
        application: "Compta+",
        echeance: "2025-06-05",
        status: "expired",
    },
];

function getStatusColor(status: string) {
    switch (status) {
        case "active":
            return "bg-green-100 text-green-700";
        case "expiring":
            return "bg-orange-100 text-orange-700";
        case "expired":
            return "bg-red-100 text-red-700";
        default:
            return "bg-gray-100 text-gray-700";
    }
}

function getDaysLeft(echeance: string) {
    const now = new Date();
    const end = new Date(echeance);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
}

function getProgressColor(daysLeft: number) {
    if (daysLeft > 10) return "bg-green-400";
    if (daysLeft > 3) return "bg-orange-400";
    if (daysLeft >= 0) return "bg-red-500";
    return "bg-gray-400";
}

// Mock offres
const OFFRES = [
  { id: 1, nom: "Basique", prix: 10000, duree: 30, description: "Fonctionnalités essentielles pour démarrer." },
  { id: 2, nom: "Standard", prix: 20000, duree: 90, description: "Plus de fonctionnalités et support prioritaire." },
  { id: 3, nom: "Premium", prix: 35000, duree: 365, description: "Toutes les fonctionnalités, support 24/7, SLA garanti." },
];

const ListSouscriptions = () => {
    const [souscriptions, setSouscriptions] = React.useState(fakeSouscriptions);

    // Désactivation
    const [deactivateModal, setDeactivateModal] = React.useState<{ open: boolean, sous?: any } | null>(null);
    const [otp, setOtp] = React.useState("");

    // Renouvellement
    const [renewModal, setRenewModal] = React.useState<{ open: boolean, sous?: any } | null>(null);
    const [renewOffer, setRenewOffer] = React.useState<number|null>(null);
    const [renewOtp, setRenewOtp] = React.useState("");

    const handleRenew = (sous: any) => {
        setRenewModal({ open: true, sous });
        setRenewOffer(null);
        setRenewOtp("");
    };
    const closeRenewModal = () => {
        setRenewModal(null);
        setRenewOffer(null);
        setRenewOtp("");
    };
    const confirmRenew = () => {
        // Simulation : renouvellement fictif
        closeRenewModal();
    };

    const handleDeactivate = (sous: any) => {
        setDeactivateModal({ open: true, sous });
        setOtp("");
    };
    const closeDeactivateModal = () => {
        setDeactivateModal(null);
        setOtp("");
    };
    const confirmDeactivate = () => {
        // Simulation: désactive la souscription (ici on retire juste du tableau)
        setSouscriptions(prev => prev.filter(s => s.id !== deactivateModal?.sous?.id));
        closeDeactivateModal();
    };


    // Filtres
    const [filterApp, setFilterApp] = React.useState<string>("");
    const [filterClient, setFilterClient] = React.useState<string>("");
    const [filterDaysMin, setFilterDaysMin] = React.useState<string>("");
    const [filterDaysMax, setFilterDaysMax] = React.useState<string>("");

    // Générer les options uniques
    const appOptions = Array.from(new Set(fakeSouscriptions.map(s => s.application)));
    const clientOptions = Array.from(new Set(fakeSouscriptions.map(s => s.client)));

    // Filtrage dynamique
    const filteredSouscriptions = souscriptions.filter(sous => {
        const daysLeft = getDaysLeft(sous.echeance);
        const appMatch = !filterApp || sous.application === filterApp;
        const clientMatch = !filterClient || sous.client === filterClient;
        const minOk = !filterDaysMin || daysLeft >= parseInt(filterDaysMin, 10);
        const maxOk = !filterDaysMax || daysLeft <= parseInt(filterDaysMax, 10);
        return appMatch && clientMatch && minOk && maxOk;
    });

    // Pagination
    const ITEMS_PER_PAGE = 5;
    const [currentPage, setCurrentPage] = React.useState(1);
    const totalPages = Math.ceil(filteredSouscriptions.length / ITEMS_PER_PAGE) || 1;
    React.useEffect(() => { setCurrentPage(1); }, [filterApp, filterClient, filterDaysMin, filterDaysMax]); // Reset page on filter change
    const paginatedSouscriptions = filteredSouscriptions.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const resetFilters = () => {
        setFilterApp("");
        setFilterClient("");
        setFilterDaysMin("");
        setFilterDaysMax("");
    };

    return (
        <MainLayout>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-14 px-4">
                <div className="max-w-7xl mx-auto w-full px-2">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Souscriptions</h1>
                        <Link
                            href="/souscriptions/register"
                            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold rounded-lg shadow-md hover:scale-[1.03] hover:shadow-lg transition-all duration-200"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            Nouvelle souscription
                        </Link>
                    </div>
                    {/* Filtres */}
                    <div className="flex flex-wrap gap-4 items-end mb-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Application</label>
                            <select
                                className="px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
                                value={filterApp}
                                onChange={e => setFilterApp(e.target.value)}
                            >
                                <option value="">Toutes</option>
                                {appOptions.map(app => (
                                    <option key={app} value={app}>{app}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Client</label>
                            <select
                                className="px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
                                value={filterClient}
                                onChange={e => setFilterClient(e.target.value)}
                            >
                                <option value="">Tous</option>
                                {clientOptions.map(client => (
                                    <option key={client} value={client}>{client}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Jours restants</label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="number"
                                    min="0"
                                    className="w-20 px-2 py-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
                                    placeholder="Min"
                                    value={filterDaysMin}
                                    onChange={e => setFilterDaysMin(e.target.value)}
                                />
                                <span className="text-gray-500">-</span>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-20 px-2 py-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
                                    placeholder="Max"
                                    value={filterDaysMax}
                                    onChange={e => setFilterDaysMax(e.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            className="ml-2 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition text-xs"
                            onClick={resetFilters}
                            type="button"
                        >
                            Réinitialiser
                        </button>
                    </div>
                    <div className="overflow-x-auto rounded-2xl shadow-lg bg-white/90 border border-gray-100">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Client</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Application</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Échéance</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">jours restants</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {paginatedSouscriptions.length === 0 && (
                                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">Aucune souscription trouvée</td></tr>
                                )}
                                {paginatedSouscriptions.map((sous) => {
                                    const daysLeft = getDaysLeft(sous.echeance);
                                    const totalPeriod = 30; // Pour la démo, on suppose 30j de période
                                    const percent = Math.max(0, Math.min(100, Math.floor((daysLeft / totalPeriod) * 100)));
                                    return (
                                        <tr key={sous.id} className="hover:bg-pink-50/30 transition">
                                            <td className="px-6 py-4 align-middle whitespace-nowrap font-semibold text-gray-800">{sous.client}</td>
                                            <td className="px-6 py-4 align-middle whitespace-nowrap">{sous.application}</td>
                                            <td className="px-6 py-4 align-middle whitespace-nowrap">{new Date(sous.echeance).toLocaleDateString('fr-FR')}</td>
                                            <td className="px-6 py-4 align-middle whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(sous.status)}`}>
                                                    {sous.status === "active" && "Active"}
                                                    {sous.status === "expiring" && "Bientôt expirée"}
                                                    {sous.status === "expired" && "Expirée"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 align-middle whitespace-nowrap min-w-[200px]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-full bg-gray-100 rounded-full h-3">
                                                        <div
                                                            className={`h-3 rounded-full ${getProgressColor(daysLeft)}`}
                                                            style={{ width: `${percent}%`, transition: "width 0.5s" }}
                                                        ></div>
                                                    </div>
                                                    <span
                                                        className={`flex items-center justify-center aspect-square w-8 h-8 text-base font-bold rounded-full border-2 shadow-sm select-none
                                                            ${daysLeft > 10
                                                                ? 'border-green-400 text-green-700 bg-green-50'
                                                                : daysLeft > 3
                                                                    ? 'border-orange-400 text-orange-700 bg-orange-50'
                                                                    : daysLeft >= 0
                                                                        ? 'border-red-400 text-red-700 bg-red-50'
                                                                        : 'border-gray-300 text-gray-400 bg-gray-50'
                                                            }`
                                                        }
                                                    >
                                                        {daysLeft > 0 ? daysLeft : daysLeft === 0 ? '0' : '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle whitespace-nowrap flex gap-3 justify-center">
                                                <button
                                                    className="px-5 py-2 rounded-xl bg-red-500 text-white font-semibold shadow-md hover:bg-red-600 active:bg-red-700 transition text-base focus:outline-none focus:ring-2 focus:ring-red-300 flex items-center gap-2"
                                                    onClick={() => handleDeactivate(sous)}
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                                        <line x1="8" y1="8" x2="16" y2="16" stroke="currentColor" strokeWidth="2" />
                                                    </svg>
                                                    Désactiver
                                                </button>
                                                <button
                                                    className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 active:bg-blue-800 transition text-base focus:outline-none focus:ring-2 focus:ring-blue-300 flex items-center gap-2"
                                                    onClick={() => handleRenew(sous)}
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5 19A9 9 0 0019 5M19 19A9 9 0 005 5" />
                                                    </svg>
                                                    Renouveler
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    {filteredSouscriptions.length > 0 && (
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                className="px-4 py-2 rounded-lg border bg-white text-gray-600 hover:bg-pink-50 disabled:opacity-50"
                                disabled={currentPage === 1}
                            >
                                Précédent
                            </button>
                            <span className="px-2 py-2 text-gray-700 font-medium">
                                Page {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                className="px-4 py-2 rounded-lg border bg-white text-gray-600 hover:bg-pink-50 disabled:opacity-50"
                                disabled={currentPage === totalPages}
                            >
                                Suivant
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {/* Modal Renouvellement */}
            {renewModal?.open && renewModal.sous && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-3xl relative border border-gray-100 animate-fadein">
                        <button
                            onClick={closeRenewModal}
                            className="absolute top-4 right-4 text-gray-400 hover:text-blue-500 text-xl font-bold"
                            title="Fermer"
                        >×</button>
                        <div className="flex flex-col items-center gap-4">
                            <svg className="w-12 h-12 text-blue-500 mb-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5 19A9 9 0 0019 5M19 19A9 9 0 005 5" />
                            </svg>
                            <h2 className="text-xl font-bold text-gray-900 text-center">Renouvellement de la souscription</h2>
                            <p className="text-gray-700 text-center mb-2">
                                Veuillez choisir une nouvelle offre pour <span className="font-semibold text-pink-600">{renewModal.sous.client}</span> sur <span className="font-semibold text-blue-600">{renewModal.sous.application}</span>.
                            </p>
                            {/* Offres */}
                            <div className="flex flex-col sm:flex-row gap-4 w-full mb-2">
                                {OFFRES.map(offer => (
                                    <button
                                        key={offer.id}
                                        type="button"
                                        onClick={() => setRenewOffer(offer.id)}
                                        className={`flex-1 p-4 rounded-2xl border-2 transition-all shadow-sm flex flex-col items-start gap-1 text-left ${renewOffer === offer.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-blue-50'} focus:outline-none`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`inline-block w-2 h-2 rounded-full ${renewOffer === offer.id ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                                            <span className="font-bold text-base text-gray-900">{offer.nom}</span>
                                        </div>
                                        <div className="text-gray-700 text-sm mb-1">{offer.description}</div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>{offer.duree} jours</span>
                                            <span>•</span>
                                            <span className="font-semibold text-blue-600">${(offer.prix / 600).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            {/* OTP */}
                            <p className="text-gray-700 text-center mt-2">Un code OTP vous a été envoyé par mail. Veuillez le saisir pour confirmer le renouvellement.</p>
                            <div className="flex gap-2 justify-center mb-4 mt-1">
                                {[...Array(6)].map((_, i) => (
                                    <input
                                        key={i}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        className="w-10 h-12 text-center border-2 border-gray-200 rounded-lg text-xl font-bold focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                                        value={renewOtp[i] || ""}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, "");
                                            if (!val) return;
                                            let next = renewOtp.split("");
                                            next[i] = val;
                                            setRenewOtp(next.join("").slice(0, 6));
                                            // focus next
                                            const nextInput = document.getElementById(`renew-otp-input-${i+1}`);
                                            if (nextInput) (nextInput as HTMLInputElement).focus();
                                        }}
                                        onKeyDown={e => {
                                            if (e.key === "Backspace" && !renewOtp[i] && i > 0) {
                                                let next = renewOtp.split("");
                                                next[i-1] = "";
                                                setRenewOtp(next.join("").slice(0, 6));
                                                const prevInput = document.getElementById(`renew-otp-input-${i-1}`);
                                                if (prevInput) (prevInput as HTMLInputElement).focus();
                                            }
                                        }}
                                        id={`renew-otp-input-${i}`}
                                        autoFocus={i === 0}
                                    />
                                ))}
                            </div>
                            <div className="flex gap-2 w-full mt-2">
                                <button
                                    onClick={closeRenewModal}
                                    className="flex-1 px-4 py-2 rounded-lg border bg-gray-50 text-gray-600 hover:bg-blue-50 font-semibold"
                                >Annuler</button>
                                <button
                                    onClick={confirmRenew}
                                    className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold shadow-md hover:scale-[1.02] hover:shadow-lg transition-all duration-200 disabled:opacity-60"
                                    disabled={!renewOffer || renewOtp.length !== 6}
                                >Confirmer le renouvellement</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Désactivation */}
            {deactivateModal?.open && deactivateModal.sous && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative border border-gray-100 animate-fadein">
                        <button
                            onClick={closeDeactivateModal}
                            className="absolute top-4 right-4 text-gray-400 hover:text-pink-500 text-xl font-bold"
                            title="Fermer"
                        >×</button>
                        <div className="flex flex-col items-center gap-4">
                            <svg className="w-12 h-12 text-red-500 mb-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                <line x1="8" y1="8" x2="16" y2="16" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <h2 className="text-xl font-bold text-gray-900 text-center">Désactivation de la souscription</h2>
                            <p className="text-gray-700 text-center mb-2">
                                Vous êtes sur le point de désactiver <span className="font-semibold text-pink-600">{deactivateModal.sous.client}</span> de l’application <span className="font-semibold text-blue-600">{deactivateModal.sous.application}</span>.<br />
                                Veuillez saisir le code OTP envoyé par mail pour confirmer.
                            </p>
                            {/* OTP Input */}
                            <div className="flex gap-2 justify-center mb-4">
                                {[...Array(6)].map((_, i) => (
                                    <input
                                        key={i}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        className="w-10 h-12 text-center border-2 border-gray-200 rounded-lg text-xl font-bold focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all"
                                        value={otp[i] || ""}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, "");
                                            if (!val) return;
                                            let next = otp.split("");
                                            next[i] = val;
                                            setOtp(next.join("").slice(0, 6));
                                            // focus next
                                            const nextInput = document.getElementById(`otp-input-${i + 1}`);
                                            if (nextInput) (nextInput as HTMLInputElement).focus();
                                        }}
                                        onKeyDown={e => {
                                            if (e.key === "Backspace" && !otp[i] && i > 0) {
                                                let next = otp.split("");
                                                next[i - 1] = "";
                                                setOtp(next.join("").slice(0, 6));
                                                const prevInput = document.getElementById(`otp-input-${i - 1}`);
                                                if (prevInput) (prevInput as HTMLInputElement).focus();
                                            }
                                        }}
                                        id={`otp-input-${i}`}
                                        autoFocus={i === 0}
                                    />
                                ))}
                            </div>
                            <div className="flex gap-2 w-full mt-2">
                                <button
                                    onClick={closeDeactivateModal}
                                    className="flex-1 px-4 py-2 rounded-lg border bg-gray-50 text-gray-600 hover:bg-pink-50 font-semibold"
                                >Annuler</button>
                                <button
                                    onClick={confirmDeactivate}
                                    className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold shadow-md hover:scale-[1.02] hover:shadow-lg transition-all duration-200 disabled:opacity-60"
                                    disabled={otp.length !== 6}
                                >Désactiver</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default ListSouscriptions;