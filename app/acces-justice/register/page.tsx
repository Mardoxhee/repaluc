"use client"
import React, { useState } from "react";
import MainLayout from "@/components/layouts/MainLayout";

// Mock clients et offres (reprendre ceux de la liste)
const fakeClients = [
    { id: 1, type: "entreprise", denomination: "Mazaya S.A." },
    { id: 2, type: "individu", fullname: "Awa Diabaté" },
    { id: 3, type: "entreprise", denomination: "Tech Innov SARL" },
    { id: 4, type: "individu", fullname: "Moussa Koné" },
];
const OFFRES = [
    { id: 1, nom: "Basique", prix: 10000, duree: 30, description: "Fonctionnalités essentielles pour démarrer." },
    { id: 2, nom: "Standard", prix: 20000, duree: 90, description: "Plus de fonctionnalités et support prioritaire." },
    { id: 3, nom: "Premium", prix: 35000, duree: 365, description: "Toutes les fonctionnalités, support 24/7, SLA garanti." },
];

const steps = [
    { label: "Choisir le client" },
    { label: "Choisir l'offre" },
    { label: "Validation OTP" }
];

const Register = () => {
    const [step, setStep] = useState(0);
    const [selectedClient, setSelectedClient] = useState<number | null>(null);
    const [selectedOffer, setSelectedOffer] = useState<number | null>(null);
    const [otp, setOtp] = useState("");

    // Modale de confirmation d'annulation (réutilise la logique et le style du EditClientModal)
    const [showCancelModal, setShowCancelModal] = useState(false);
    const CancelModal = ({ onClose, onConfirm }: { onClose: () => void, onConfirm: () => void }) => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative border border-gray-100 flex flex-col items-center animate-fadein">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-pink-500 text-xl font-bold"
                    aria-label="Fermer"
                >×</button>
                <svg className="w-12 h-12 text-pink-400 mb-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                <h2 className="text-2xl font-bold mb-2 text-gray-900 text-center">Annuler la souscription ?</h2>
                <div className="text-gray-600 text-center mb-6">Toutes les informations saisies seront perdues.</div>
                <div className="flex gap-3 mt-2 w-full justify-center">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg border bg-gray-50 text-gray-600 hover:bg-pink-50 font-semibold"
                    >Revenir</button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 rounded-lg bg-pink-500 text-white font-semibold shadow-md hover:bg-pink-600 transition-all"
                    >Oui, annuler</button>
                </div>
            </div>
        </div>
    );

    // Stepper visuel façon Flowbite
    const Stepper = () => (
        <ol className="flex items-center w-full mb-8">
            {steps.map((s, i) => (
                <li key={i} className="flex-1 flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 ${step === i ? 'bg-pink-500 border-pink-500 text-white scale-110 shadow-lg' : step > i ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>{i + 1}</div>
                    <div className="ml-3 text-sm font-semibold text-gray-700 whitespace-nowrap">{s.label}</div>
                    {i < steps.length - 1 && <div className="flex-1 h-0.5 bg-gray-200 mx-3" />}
                </li>
            ))}
        </ol>
    );

    // Étape 1 : Choix du client (liste stylée avec recherche)
    const [clientSearch, setClientSearch] = useState("");
    const filteredClients = fakeClients.filter(c => {
        const name = c.type === "entreprise" ? c.denomination : c.fullname;
        return name?.toLowerCase().includes(clientSearch.toLowerCase());
    });
    const StepClient = () => (
        <div className="flex flex-col gap-6 items-center">
            <div className="w-full max-w-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner un client</label>
                <input
                    type="text"
                    className="mb-4 w-full px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
                    placeholder="Rechercher un client..."
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                />
                <div className="rounded-2xl border border-gray-100 bg-white max-h-72 overflow-y-auto shadow-inner divide-y divide-gray-100">
                    {filteredClients.length === 0 && (
                        <div className="p-6 text-center text-gray-400">Aucun client trouvé</div>
                    )}
                    {filteredClients.map(client => (
                        <button
                            key={client.id}
                            type="button"
                            onClick={() => setSelectedClient(client.id)}
                            className={`w-full flex items-center justify-between px-5 py-4 transition-all text-left group focus:outline-none ${selectedClient === client.id ? 'bg-pink-50 border-l-4 border-pink-500' : 'hover:bg-pink-50'} `}
                        >
                            <div>
                                <div className="font-semibold text-gray-900 text-base">
                                    {client.type === "entreprise" ? client.denomination : client.fullname}
                                </div>
                                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${client.type === "entreprise" ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>{client.type === "entreprise" ? 'Entreprise' : 'Individu'}</span>
                            </div>
                            {selectedClient === client.id && (
                                <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            )}
                        </button>
                    ))}
                </div>
            </div>
            <button
                className="mt-6 px-6 py-2 rounded-lg bg-pink-500 text-white font-semibold shadow-md hover:bg-pink-600 transition disabled:opacity-50"
                disabled={selectedClient === null}
                onClick={() => setStep(1)}
            >Suivant</button>
        </div>
    );

    // Étape 2 : Choix de l'offre
    const StepOffer = () => (
        <div className="flex flex-col gap-6 items-center">
            <div className="w-full max-w-2xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">Choisir une offre</label>
                <div className="flex flex-col sm:flex-row gap-4">
                    {OFFRES.map(offer => (
                        <button
                            key={offer.id}
                            type="button"
                            onClick={() => setSelectedOffer(offer.id)}
                            className={`flex-1 p-4 rounded-2xl border-2 transition-all shadow-sm flex flex-col items-start gap-1 text-left ${selectedOffer === offer.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-blue-50'} focus:outline-none`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`inline-block w-2 h-2 rounded-full ${selectedOffer === offer.id ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
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
            </div>
            <div className="flex gap-2 mt-6">
                <button
                    className="px-6 py-2 rounded-lg border bg-gray-50 text-gray-600 hover:bg-pink-50 font-semibold"
                    onClick={() => setStep(0)}
                >Précédent</button>
                <button
                    className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition disabled:opacity-50"
                    disabled={selectedOffer === null}
                    onClick={() => setStep(2)}
                >Suivant</button>
            </div>
        </div>
    );

    // Composant OTPInput réutilisable (logique inspirée de ListSouscriptions, focus fluide, paste, id unique)
    const OTPInput = ({ value, onChange, disabled = false, autoFocus = false }: { value: string, onChange: (v: string) => void, disabled?: boolean, autoFocus?: boolean }) => {
        return (
            <div className="flex gap-2 justify-center mb-2">
                {[...Array(6)].map((_, i) => (
                    <input
                        key={i}
                        id={`otp-input-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className="w-10 h-12 text-center border-2 border-gray-200 rounded-lg text-xl font-bold focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all"
                        value={value[i] || ""}
                        onChange={e => {
                            const val = e.target.value.replace(/\D/g, "");
                            if (!val) return;
                            let next = value.split("");
                            next[i] = val;
                            onChange(next.join("").slice(0, 6));
                            // focus next
                            const nextInput = document.getElementById(`otp-input-${i + 1}`);
                            if (nextInput) (nextInput as HTMLInputElement).focus();
                        }}
                        onKeyDown={e => {
                            if (e.key === "Backspace" && !value[i] && i > 0) {
                                let next = value.split("");
                                next[i - 1] = "";
                                onChange(next.join("").slice(0, 6));
                                const prevInput = document.getElementById(`otp-input-${i - 1}`);
                                if (prevInput) (prevInput as HTMLInputElement).focus();
                            }
                        }}
                        onPaste={e => {
                            const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                            if (paste) {
                                onChange(paste);
                                // focus last
                                const lastInput = document.getElementById(`otp-input-${paste.length - 1}`);
                                if (lastInput) (lastInput as HTMLInputElement).focus();
                            }
                            e.preventDefault();
                        }}
                        autoFocus={autoFocus && i === 0}
                        disabled={disabled}
                    />
                ))}
            </div>
        );
    };

    // Popup alerte moderne
    const [alert, setAlert] = useState<{ type: "success" | "error" | "info", message: string } | null>(null);
    const AlertPopup = ({ type, message, onClose }: { type: "success" | "error" | "info", message: string, onClose: () => void }) => {
        React.useEffect(() => {
            const timer = setTimeout(onClose, 2000);
            return () => clearTimeout(timer);
        }, [onClose]);
        const icons = {
            success: (
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            ),
            error: (
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            ),
            info: (
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01" /></svg>
            )
        };
        const color = type === "success" ? "green" : type === "error" ? "red" : "blue";
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                <div className={`bg-white rounded-3xl shadow-2xl border-t-4 border-${color}-500 px-8 py-8 flex flex-col items-center animate-fadein`}>
                    {icons[type]}
                    <div className={`mt-4 text-lg font-semibold text-${color}-600 text-center`}>{message}</div>
                    <button onClick={onClose} className="mt-6 px-6 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-pink-50 font-semibold">OK</button>
                </div>
            </div>
        );
    };

    // Étape 3 : OTP
    const StepOTP = () => (
        <div className="flex flex-col gap-6 items-center">
            <div className="w-full max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-2">Code OTP envoyé par mail</label>
                <OTPInput value={otp} onChange={setOtp} autoFocus />
            </div>
            <div className="flex gap-2 mt-4">
                <button
                    className="px-6 py-2 rounded-lg border bg-gray-50 text-gray-600 hover:bg-pink-50 font-semibold"
                    onClick={() => setStep(1)}
                >Précédent</button>
                <button
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-blue-500 text-white font-semibold shadow-md hover:scale-[1.02] hover:shadow-lg transition-all duration-200 disabled:opacity-60"
                    disabled={otp.length !== 6}
                    onClick={() => setAlert({ type: 'success', message: 'Souscription créée avec succès !' })}
                >Créer la souscription</button>
            </div>
        </div>
    );

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto py-12 px-4 min-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Nouvelle souscription</h1>
                    <button
                        className="px-5 py-2 rounded-lg border bg-gray-50 text-gray-600 hover:bg-pink-50 font-semibold shadow-sm"
                        onClick={() => setShowCancelModal(true)}
                    >Annuler</button>
                </div>
                <Stepper />
                <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 animate-fadein flex-1">
  {step === 0 && <StepClient />}
  {step === 1 && (
    <div className="flex flex-col justify-center items-center h-full min-h-[350px]">
      <StepOffer />
    </div>
  )}
  {step === 2 && (
    <div className="flex flex-col justify-center items-center h-full min-h-[350px]">
      <StepOTP />
    </div>
  )}
</div>
                {/* CTA bas de page */}
                <div className="mt-10 flex justify-center">
  <a
    href="/souscriptions"
    className="text-sm font-medium text-gray-500 hover:text-pink-500 transition-colors inline-flex items-center gap-1 px-2 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
    Retour à la liste des souscriptions
  </a>
</div>
            </div>
            {showCancelModal && (
                <CancelModal onClose={() => setShowCancelModal(false)} onConfirm={() => { setShowCancelModal(false); setStep(0); setSelectedClient(null); setSelectedOffer(null); setOtp(""); }} />
            )}
            {alert && (
                <AlertPopup type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
            )}
        </MainLayout>
    );
};

export default Register