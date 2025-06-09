import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const Login = () => {
    return (
        <div className="min-h-screen flex">


            <div className="hidden md:block md:w-1/2 relative bg-gray-900">
                {/* Image de fond avec dégradé overlay */}
                <div className="absolute inset-0 overflow-hidden">
                    <Image
                        src="/login-bg.jpg"
                        alt="Fond tech futuriste"
                        layout="fill"
                        objectFit="cover"
                        quality={100}
                        className="opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-purple-900/50 to-pink-900/30"></div>
                </div>

                {/* Contenu texte avec animations */}
                <div className="relative z-10 p-12 flex flex-col h-full justify-center text-white">
                    <h1 className="text-7xl font-extrabold mb-8 leading-tight w-4.5/5">
                        <span className="block animate-fadeInUp delay-100">Bien plus que du code !</span>
                        <span className="bg-gradient-to-r from-blue-400 to-pink-500 bg-clip-text text-transparent animate-gradientShift">
                            On digitalise votre vision...
                        </span>
                    </h1>
                    <p className="text-2xl font-medium opacity-90 animate-fadeIn delay-300">Mazaya-Brain</p>
                </div>
            </div>

            {/* Partie droite avec formulaire */}
            <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-8">
                <div className="max-w-md w-full">
                    <h2 className="text-3xl text-center font-bold mb-8 text-gray-800">Connexion</h2>

                    <button className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-md py-3 px-4 text-gray-700 font-medium mb-6 hover:bg-gray-50 transition-colors">
                        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Se connecter avec Google
                    </button>

                    <div className="flex items-center mb-6">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <span className="mx-4 text-gray-500">ou</span>
                        <div className="flex-grow border-t border-gray-300"></div>
                    </div>

                    <form className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                placeholder="votre@email.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                            <input
                                type="password"
                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-pink-500 focus:ring-pink-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                    Se souvenir de moi
                                </label>
                            </div>

                            <div className="text-sm">
                                <Link href="/auth/forgot-password" className="font-medium text-pink-500 hover:text-pink-600">
                                    Mot de passe oublié ?
                                </Link>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-pink-500 text-white py-3 px-4 rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-colors"
                        >
                            Se connecter
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-500">
                        Pas encore de compte ?{' '}
                        <Link href="/auth/signup" className="font-medium text-pink-500 hover:text-pink-600">
                            S'inscrire
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;