'use client';
import React, { useState, useEffect } from 'react';
import {
    DollarSign,
    Calendar,
    CheckCircle2,
    Clock,
    Upload,
    X,
    Save,
    CreditCard,
    Banknote,
    Smartphone,
    AlertCircle,
    Loader2,
    Eye
} from 'lucide-react';
import Swal from 'sweetalert2';

interface PlanIndemnisation {
    id: number;
    periode: string;
    montantUSD: number;
    statut: string;
    datePaiementEffectif: string | null;
    modePaiement: string;
    preuve: string | null;
    contratId: number;
}

interface Contrat {
    id: number;
    typeContrat: string;
    montantTotalUSD: number;
    dateSignature: string;
    victimeId: number;
    planIndemnisation: PlanIndemnisation[];
}

interface Victim {
    id: number;
    nom?: string;
}

interface SuiviPaiementProps {
    victim: Victim;
}

const MODE_PAIEMENT_OPTIONS = [
    { value: 'Cash', label: 'Cash', icon: Banknote },
    { value: 'Mobile Money', label: 'Mobile Money', icon: Smartphone },
    { value: 'Virement', label: 'Virement bancaire', icon: CreditCard },
];

const SuiviPaiement: React.FC<SuiviPaiementProps> = ({ victim }) => {
    const [contrat, setContrat] = useState<Contrat | null>(null);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploadingPreuve, setUploadingPreuve] = useState(false);

    // État pour l'édition d'une tranche
    const [editForm, setEditForm] = useState({
        datePaiementEffectif: '',
        modePaiement: 'Cash',
        preuve: null as File | null,
        preuveUrl: ''
    });

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006';

    // Charger le contrat
    useEffect(() => {
        const fetchContrat = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${baseUrl}/contrat/${victim.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setContrat(data);
                }
            } catch (error) {
                console.log('Erreur lors du chargement du contrat:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchContrat();
    }, [victim.id, baseUrl]);

    // Calculer les statistiques
    const getStats = () => {
        if (!contrat?.planIndemnisation) return { total: 0, paye: 0, restant: 0, pourcentage: 0 };

        const total = contrat.montantTotalUSD;
        const paye = contrat.planIndemnisation
            .filter(p => p.statut === 'Effectué' || p.statut === 'Payé')
            .reduce((sum, p) => sum + p.montantUSD, 0);
        const restant = total - paye;
        const pourcentage = total > 0 ? Math.round((paye / total) * 100) : 0;

        return { total, paye, restant, pourcentage };
    };

    // Ouvrir le formulaire d'édition
    const handleEdit = (plan: PlanIndemnisation) => {
        setEditingId(plan.id);
        setEditForm({
            datePaiementEffectif: plan.datePaiementEffectif
                ? new Date(plan.datePaiementEffectif).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
            modePaiement: plan.modePaiement || 'Cash',
            preuve: null,
            preuveUrl: plan.preuve || ''
        });
    };

    // Annuler l'édition
    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({
            datePaiementEffectif: '',
            modePaiement: 'Cash',
            preuve: null,
            preuveUrl: ''
        });
    };

    // Upload de la preuve
    const uploadPreuve = async (file: File): Promise<string> => {
        const uploadEndpoint = process.env.NEXT_PUBLIC_UPLOAD_ENDPOINT || 'https://360.fonasite.app:5521/minio/files/upload';

        const formData = new FormData();
        formData.append('file', file);

        const resp = await fetch(uploadEndpoint, {
            method: 'POST',
            body: formData,
        });

        if (!resp.ok) {
            throw new Error('Erreur lors de l\'upload de la preuve');
        }

        const data = await resp.json();
        return data.url || data.link || '';
    };

    // Sauvegarder les modifications
    const handleSave = async (planId: number) => {
        setSaving(true);
        try {
            let preuveUrl = editForm.preuveUrl;

            // Upload de la preuve si un fichier est sélectionné
            if (editForm.preuve) {
                setUploadingPreuve(true);
                preuveUrl = await uploadPreuve(editForm.preuve);
                setUploadingPreuve(false);
            }

            // Mettre à jour le plan d'indemnisation
            const payload: any = {
                statut: 'Effectué',
                datePaiementEffectif: editForm.datePaiementEffectif,
                modePaiement: editForm.modePaiement,
            };

            if (preuveUrl) {
                payload.preuve = preuveUrl;
            }

            const response = await fetch(`${baseUrl}/plan-indemnisation/${planId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la mise à jour');
            }

            // Mettre à jour l'état local
            setContrat(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    planIndemnisation: prev.planIndemnisation.map(p =>
                        p.id === planId
                            ? {
                                ...p,
                                statut: 'Effectué',
                                datePaiementEffectif: editForm.datePaiementEffectif,
                                modePaiement: editForm.modePaiement,
                                preuve: preuveUrl || p.preuve
                            }
                            : p
                    )
                };
            });

            setEditingId(null);

            await Swal.fire({
                icon: 'success',
                title: 'Paiement enregistré',
                text: 'Le paiement a été enregistré avec succès',
                timer: 2000,
                showConfirmButton: false
            });

        } catch (error) {
            console.log('Erreur:', error);
            await Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Impossible d\'enregistrer le paiement'
            });
        } finally {
            setSaving(false);
            setUploadingPreuve(false);
        }
    };

    // Voir la preuve
    const handleViewPreuve = async (preuve: string) => {
        try {
            const response = await fetch(`${baseUrl}/minio/files/${preuve}`);
            if (response.ok) {
                const data = await response.json();
                if (data?.data?.src) {
                    window.open(data.data.src, '_blank');
                }
            }
        } catch (error) {
            console.log('Erreur:', error);
        }
    };

    // Obtenir la couleur du statut
    const getStatutColor = (statut: string) => {
        switch (statut) {
            case 'Effectué':
            case 'Payé':
                return 'bg-green-100 text-green-800';
            case 'En cours':
                return 'bg-blue-100 text-blue-800';
            case 'Planifier':
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Obtenir l'icône du statut
    const getStatutIcon = (statut: string) => {
        switch (statut) {
            case 'Effectué':
            case 'Payé':
                return <CheckCircle2 className="w-4 h-4 text-green-600" />;
            case 'En cours':
                return <Clock className="w-4 h-4 text-blue-600" />;
            default:
                return <Clock className="w-4 h-4 text-gray-400" />;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
                <span className="ml-3 text-gray-600">Chargement du suivi des paiements...</span>
            </div>
        );
    }

    if (!contrat || !contrat.planIndemnisation || contrat.planIndemnisation.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <AlertCircle className="w-12 h-12 mb-4 text-gray-400" />
                <p className="text-lg font-medium">Aucun plan d'indemnisation</p>
                <p className="text-sm">Cette victime n'a pas encore de contrat avec un plan de paiement.</p>
            </div>
        );
    }

    const stats = getStats();

    return (
        <div className="space-y-6">
            {/* En-tête avec statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-3 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-pink-100 text-xs">Montant Total</p>
                            <p className="text-lg font-bold">{stats.total.toLocaleString()} USD</p>
                        </div>
                        <DollarSign className="w-6 h-6 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-xs">Montant Payé</p>
                            <p className="text-lg font-bold">{stats.paye.toLocaleString()} USD</p>
                        </div>
                        <CheckCircle2 className="w-6 h-6 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-3 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-xs">Reste à Payer</p>
                            <p className="text-lg font-bold">{stats.restant.toLocaleString()} USD</p>
                        </div>
                        <Clock className="w-6 h-6 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-xs">Progression</p>
                            <p className="text-lg font-bold">{stats.pourcentage}%</p>
                        </div>
                        <div className="w-6 h-6 rounded-full border-2 border-white/30 flex items-center justify-center">
                            <span className="text-[8px] font-bold">{stats.pourcentage}%</span>
                        </div>
                    </div>
                    <div className="mt-1.5 bg-white/20 rounded-full h-1.5">
                        <div
                            className="bg-white rounded-full h-1.5 transition-all duration-500"
                            style={{ width: `${stats.pourcentage}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Tableau des tranches */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-pink-600" />
                        Plan d'indemnisation - {contrat.planIndemnisation.length} tranches
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Période</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Montant</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date Paiement</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mode</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Preuve</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {contrat.planIndemnisation.map((plan) => (
                                <tr key={plan.id} className="hover:bg-gray-50">
                                    {editingId === plan.id ? (
                                        // Mode édition
                                        <>
                                            <td className="px-4 py-3">
                                                <span className="font-medium text-gray-900">{plan.periode}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-semibold text-gray-900">{plan.montantUSD} USD</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Effectué
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="date"
                                                    value={editForm.datePaiementEffectif}
                                                    onChange={(e) => setEditForm({ ...editForm, datePaiementEffectif: e.target.value })}
                                                    className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={editForm.modePaiement}
                                                    onChange={(e) => setEditForm({ ...editForm, modePaiement: e.target.value })}
                                                    className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                                                >
                                                    {MODE_PAIEMENT_OPTIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <label className="cursor-pointer">
                                                        <input
                                                            type="file"
                                                            accept="image/*,.pdf"
                                                            onChange={(e) => setEditForm({ ...editForm, preuve: e.target.files?.[0] || null })}
                                                            className="hidden"
                                                        />
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-700">
                                                            <Upload className="w-3 h-3" />
                                                            {editForm.preuve ? editForm.preuve.name.substring(0, 15) + '...' : 'Choisir'}
                                                        </span>
                                                    </label>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleSave(plan.id)}
                                                        disabled={saving}
                                                        className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                                        title="Enregistrer"
                                                    >
                                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="p-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                                        title="Annuler"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        // Mode affichage
                                        <>
                                            <td className="px-4 py-3">
                                                <span className="font-medium text-gray-900">{plan.periode}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-semibold text-gray-900">{plan.montantUSD} USD</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(plan.statut)}`}>
                                                    {getStatutIcon(plan.statut)}
                                                    {plan.statut}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {plan.datePaiementEffectif
                                                    ? new Date(plan.datePaiementEffectif).toLocaleDateString('fr-FR')
                                                    : '-'
                                                }
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {plan.modePaiement || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {plan.preuve ? (
                                                    <button
                                                        onClick={() => handleViewPreuve(plan.preuve!)}
                                                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        Voir
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center">
                                                    {(plan.statut !== 'Effectué' && plan.statut !== 'Payé') && (
                                                        <button
                                                            onClick={() => handleEdit(plan)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md shadow-sm hover:bg-blue-700 hover:shadow transition-all"
                                                        >
                                                            <DollarSign className="w-3.5 h-3.5" />
                                                            Payer
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SuiviPaiement;
