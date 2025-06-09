import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const ForgotPassword = () => {
    return (
        <div className="relative min-h-screen flex items-center justify-center">
            {/* Full background image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/forgot.jpg"
                    alt="Réinitialisation de mot de passe"
                    layout="fill"
                    objectFit="cover"
                    quality={100}
                    className="opacity-80"
                    priority
                />
                {/* Overlay dégradé */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-purple-900/50 to-pink-900/30"></div>
            </div>

            {/* Formulaire centré */}
            <div className="relative z-10 w-full max-w-md mx-auto rounded-2xl shadow-xl p-8 md:p-10 backdrop-blur-md bg-white/90">
                {/* Logo/Titre */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Réinitialiser votre mot de passe</h1>
                    <p className="text-gray-500">Entrez votre email pour recevoir un lien de réinitialisation</p>
                </div>

                {/* Formulaire */}
                <form className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Adresse email</label>
                        <div className="relative">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 pl-12"
                                placeholder="votre@email.com"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-500 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <span>Envoyer le lien</span>
                    </button>
                </form>

                {/* Lien de retour */}
                <div className="mt-6 text-center">
                    <Link href="/auth/login" className="text-sm font-medium text-gray-500 hover:text-pink-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Retour à la connexion
                    </Link>
                </div>

                {/* Effet décoratif */}
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-300 rounded-full filter blur-3xl opacity-20"></div>
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-pink-300 rounded-full filter blur-3xl opacity-20"></div>
            </div>
        </div>
    );
};

export default ForgotPassword;