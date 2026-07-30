'use client';
import React from 'react';

export const ContratHeader: React.FC = () => {
    return (
        <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
                <img
                    src="/logo-fonarev.png"
                    alt="Logo FONAREV"
                    className="h-24 w-auto object-contain"
                />
            </div>
            <h1 className="text-base font-bold text-gray-900 mb-1">
                Fonds national des réparations des victimes de violences sexuelles liées aux conflits
            </h1>
            <h2 className="text-sm font-bold text-gray-800 mb-3">
                et des victimes des crimes contre la paix et la sécurité de l'humanité
            </h2>
            <div className="mx-auto mb-3 h-px w-40 bg-blue-700" />
            <h3 className="text-sm font-extrabold tracking-wide text-blue-900">
                FICHE DE CONSENTEMENT À RECEVOIR LES MESURES ADMINISTRATIVES
            </h3>
            <h3 className="text-sm font-extrabold tracking-wide text-blue-900">
                INDIVIDUELLES DE RÉPARATION
            </h3>
        </div>
    );
};
