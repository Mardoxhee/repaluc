'use client';
import React from 'react';

export const ContratHeader: React.FC = () => {
    return (
        <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
                <img
                    src="/logo-fonarev.png"
                    alt="Logo FONAREV"
                    className="h-40 w-auto object-contain"
                />
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">
                Fonds national des réparations des victimes de violences sexuelles liées aux conflits
            </h1>
            <h2 className="text-lg font-bold text-gray-800 mb-1">
                et des victimes des crimes contre la paix et la sécurité de l'humanité
            </h2>
            <h3 className="text-base font-semibold text-gray-700 mt-4">
                FICHE DE CONSENTEMENT À RECEVOIR LES MESURES ADMINISTRATIVES
            </h3>
            <h3 className="text-base font-semibold text-gray-700">
                INDIVIDUELLES DE RÉPARATION
            </h3>
        </div>
    );
};
