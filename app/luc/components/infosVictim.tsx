import React from 'react';
import { DollarSign, FileText, User, MapPin, Calendar, Shield, Check, UserCircle } from 'lucide-react';

interface InfosVictimProps {
    victim: {
        nom?: string;
        dateNaissance?: string;
        age?: number;
        sexe?: string;
        categorie?: string;
        nationalite?: string;
        etatMatrimonial?: string;
        adresse?: string;
        commune?: string;
        province?: string;
        territoire?: string;
        village?: string;
        provinceOrigine?: string;
        communeOrigine?: string;
        territoireOrigine?: string;
        villageOrigine?: string;
        groupement?: string;
        nomPere?: string;
        nomMere?: string;
        provinceIncident?: string;
        communeIncident?: string;
        territoireIncident?: string;
        lieuIncident?: string;
        dateIncident?: string;
        typeViolation?: string;
        prejudicesSubis?: string;
        status?: string;
        dossier?: string;
        prejudiceFinal?: string;
        indemnisation?: number;
        reparations?: string;
        comment?: string;
        commentaire?: string;
        avatar?: string;
        isDirect?: boolean;
        programme?: string;
    }
}

const InfosVictim: React.FC<InfosVictimProps> = ({ victim }) => {
    const {
        nom,
        dateNaissance,
        age,
        sexe,
        categorie,
        nationalite,
        etatMatrimonial,
        adresse,
        commune,
        province,
        territoire,
        village,
        provinceOrigine,
        communeOrigine,
        territoireOrigine,
        villageOrigine,
        groupement,
        nomPere,
        nomMere,
        provinceIncident,
        communeIncident,
        territoireIncident,
        lieuIncident,
        dateIncident,
        typeViolation,
        programme,
        status,
        dossier,
        prejudiceFinal,
        indemnisation,
        reparations,
        comment,
        commentaire,
        avatar,
    } = victim;
    const { isDirect } = victim;


    return (
        <div className="bg-white text-gray-900 max-w-5xl mx-auto print:max-w-none relative">
            {/* Export PDF Button */}
            {/* <button
                onClick={handleExportPDF}
                className="absolute right-0 top-0 mt-4 mr-4 px-4 py-2 bg-pink-700 hover:bg-pink-800 text-white font-bold rounded shadow print:hidden z-20"
                type="button"
            >
                Exporter en PDF
            </button> */}
            {/* Header */}
            <div className="border-b-2 border-gray-800 pb-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-800 text-center tracking-wide">
                    FICHE INDIVIDUELLE DE VICTIME
                </h1>
                <p className="text-center text-gray-600 text-sm mt-1">
                    Document officiel - Confidentiel
                </p>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-12 gap-6">
                {/* Left Column - Photo & Key Info */}
                <div className="col-span-12 md:col-span-4">
                    <div className="border border-gray-300 p-4 mb-4">
                        {avatar ? (
                            <img
                                src={avatar}
                                alt="Photo d'identité"
                                className="w-32 h-32 object-cover border border-gray-400 mx-auto block rounded-lg"
                            />
                        ) : (
                            <div className="w-32 h-32 mx-auto flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-400 rounded-lg">
                                <UserCircle className="w-20 h-20 text-gray-400" />
                            </div>
                        )}
                        <p className="text-xs text-gray-500 text-center mt-2">Photo d'identité</p>
                    </div>

                    {/* Status Badges */}
                    <div className="space-y-3 mb-6">
                        {/* Flag Victime Directe/Indirecte (badge discret) */}
                        <div className="border border-gray-300 p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="text-gray-600" size={14} />
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Type de victime</span>
                            </div>
                            <div className="bg-gray-100 border border-gray-300 px-3 py-2">
                                <span className="text-sm font-medium text-gray-800">{isDirect || "Non spécifié"}</span>
                            </div>
                        </div>
                        {/* {isDirect ?
                            <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-700 border border-green-300 mb-2">
                                {isDirect}
                            </span>
                            : null} */}
                        <div className="border border-gray-300 p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <User className="text-gray-600" size={14} />
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Catégorie</span>
                            </div>
                            <div className="bg-gray-100 border border-gray-300 px-3 py-2">
                                <span className="text-sm font-medium text-gray-800">{categorie || "Non spécifiée"}</span>
                            </div>
                        </div>

                        <div className="border border-gray-300 p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="text-gray-600" size={14} />
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Type de Violation</span>
                            </div>
                            <div className="bg-gray-100 border border-gray-300 px-3 py-2">
                                <span className="text-sm font-medium text-gray-800">{typeViolation || "Non spécifié"}</span>
                            </div>
                        </div>

                        <div className="border border-gray-300 p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="text-gray-600" size={14} />
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Programme</span>
                            </div>
                            <div className="bg-gray-100 border border-gray-300 px-3 py-2">
                                <span className="text-sm font-medium text-gray-800">{programme || "Non spécifiés"}</span>
                            </div>
                        </div>

                        <div className="border border-gray-300 p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="text-gray-600" size={14} />
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Statut</span>
                            </div>
                            <div className={`border px-3 py-2 ${!status || status === 'non confirmé'
                                ? 'bg-gray-200 border-gray-400 text-gray-700'
                                : 'bg-gray-800 border-gray-800 text-white'
                                }`}>
                                <span className="text-sm font-medium">{status && status !== '' ? status : 'Non confirmé'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Detailed Information */}
                <div className="col-span-12 md:col-span-8">
                    {/* Personal Information */}
                    <div className="mb-6">
                        <div className="bg-gray-800 text-white px-4 py-2 border-b">
                            <h2 className="font-bold text-sm uppercase tracking-wide">1. Informations Personnelles</h2>
                        </div>
                        <div className="border border-gray-300 border-t-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                                <div className="p-4 space-y-3">
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase flex-shrink-0">Nom :</span>
                                        <span className="text-sm text-gray-800 font-medium ml-2">{nom || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase flex-shrink-0">Âge :</span>
                                        <span className="text-sm text-gray-800 ml-2">{age || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase  flex-shrink-0">Sexe :</span>
                                        <span className="text-sm text-gray-800 ml-2">{sexe || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase  flex-shrink-0">Nationalité :</span>
                                        <span className="text-sm text-gray-800 ml-2">{nationalite || "-"}</span>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-32 flex-shrink-0">Date naissance :</span>
                                        <span className="text-sm text-gray-800 ml-2">{dateNaissance || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-32 flex-shrink-0">État civil :</span>
                                        <span className="text-sm text-gray-800">{etatMatrimonial || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-32 flex-shrink-0">Nom père :</span>
                                        <span className="text-sm text-gray-800">{nomPere || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-32 flex-shrink-0">Nom mère :</span>
                                        <span className="text-sm text-gray-800">{nomMere || "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Address Information */}
                    <div className="mb-6">
                        <div className="bg-gray-800 text-white px-4 py-2 border-b">
                            <h2 className="font-bold text-sm uppercase tracking-wide">2. Adresse de Résidence</h2>
                        </div>
                        <div className="border border-gray-300 border-t-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                                <div className="p-4 space-y-3">
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-24 flex-shrink-0">Adresse :</span>
                                        <span className="text-sm text-gray-800 ml-2">{adresse || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-24 flex-shrink-0">Commune :</span>
                                        <span className="text-sm text-gray-800 ml-2">{commune || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-24 flex-shrink-0">Province :</span>
                                        <span className="text-sm text-gray-800">{province || "-"}</span>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-28 flex-shrink-0">Territoire :</span>
                                        <span className="text-sm text-gray-800 ">{territoire || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-24 flex-shrink-0">Village :</span>
                                        <span className="text-sm text-gray-800 ml-2">{village || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase  flex-shrink-0">Groupement :</span>
                                        <span className="text-sm text-gray-800 ml-2">{groupement || "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Origin Information */}
                    <div className="mb-6">
                        <div className="bg-gray-800 text-white px-4 py-2 border-b">
                            <h2 className="font-bold text-sm uppercase tracking-wide">3. Lieu d'Origine</h2>
                        </div>
                        <div className="border border-gray-300 border-t-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                                <div className="p-4 space-y-2">
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-20 flex-shrink-0">Province :</span>
                                        <span className="text-sm text-gray-800 ml-2">{provinceOrigine || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-20 flex-shrink-0">Commune :</span>
                                        <span className="text-sm text-gray-800 ml-2">{communeOrigine || "-"}</span>
                                    </div>
                                </div>
                                <div className="p-4 space-y-2">
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase  flex-shrink-0">Territoire :</span>
                                        <span className="text-sm text-gray-800 ml-2">{territoireOrigine || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-20 flex-shrink-0">Village :</span>
                                        <span className="text-sm text-gray-800 ml-2">{villageOrigine || "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Incident Information */}
                    <div className="mb-6">
                        <div className="bg-gray-800 text-white px-4 py-2 border-b">
                            <h2 className="font-bold text-sm uppercase tracking-wide">4. Détails de l'Incident</h2>
                        </div>
                        <div className="border border-gray-300 border-t-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                                <div className="p-4 space-y-3">
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-24 flex-shrink-0">Province :</span>
                                        <span className="text-sm text-gray-800 ml-2">{provinceIncident || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-24 flex-shrink-0">Commune :</span>
                                        <span className="text-sm text-gray-800 ml-2">{communeIncident || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-24 flex-shrink-0">Territoire :</span>
                                        <span className="text-sm text-gray-800 ml-2">{territoireIncident || "-"}</span>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-20 flex-shrink-0">Lieu :</span>
                                        <span className="text-sm text-gray-800 ml-2">{lieuIncident || "-"}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-sm font-semibold text-gray-600 uppercase w-20 flex-shrink-0">Date :</span>
                                        <span className="text-sm text-gray-800 ml-2">{dateIncident || "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Compensation & Final Damage */}
                    <div className="mb-6">
                        <div className="bg-gray-800 text-white px-4 py-2 border-b">
                            <h2 className="font-bold text-sm uppercase tracking-wide">5. Préjudice et Mésure de réparation</h2>
                        </div>
                        <div className="border border-gray-300 border-t-0 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="text-gray-600" size={14} />
                                        <span className="text-xs font-semibold text-gray-600 uppercase">Préjudice Final</span>
                                    </div>
                                    <div className="bg-gray-50 border border-gray-200 p-3">
                                        <span className="text-sm text-gray-800">{prejudiceFinal || "Aucun préjudice documenté"}</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <DollarSign className="text-gray-600" size={14} />
                                        <span className="text-xs font-semibold text-gray-600 uppercase">Indemnisation</span>
                                    </div>
                                    <div className="bg-gray-50 border border-gray-200 p-3">
                                        <span className="text-sm text-gray-800 font-mono">
                                            {indemnisation ? `${indemnisation} USD` : "Aucune indemnisation"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {reparations && (
                                <div className="mt-6">
                                    <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">Formes de réparations</h4>
                                    <ul className="divide-y divide-gray-100 bg-gray-50 border border-gray-200 rounded-lg">
                                        {reparations.split(',').map((item, idx) => (
                                            <li key={idx} className="flex items-center justify-between px-4 py-2">
                                                <span className="text-sm text-gray-800">{item.trim()}</span>
                                                {/* <Check size={18} className="text-green-600" /> */}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Comments */}
                    <div className="mb-6">
                        <div className="bg-gray-800 text-white px-4 py-2 border-b">
                            <h2 className="font-bold text-sm uppercase tracking-wide">6. Observations</h2>
                        </div>
                        <div className="border border-gray-300 border-t-0 p-4">
                            <div className="bg-gray-50 border border-gray-200 p-4 min-h-20">
                                <span className="text-sm text-gray-700 leading-relaxed">
                                    {comment || commentaire || "Aucune observation particulière pour ce dossier."}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-gray-800 pt-4 mt-8 text-center">
                <p className="text-xs text-gray-600">
                    Document généré le {new Date().toLocaleDateString('fr-FR')} - Référence: {dossier || 'N/A'}
                </p>
            </div>
        </div>
    );
};

export default InfosVictim;