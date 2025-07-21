import Image from "next/image";

import MainLayout from "@/components/layouts/MainLayout";
import DashboardStats from "@/components/DashboardStats";

export default function Home() {
  return (
    <MainLayout>
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background parallax image + gradient overlay */}
        <div className="absolute inset-0 w-full h-full z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-pink-900/40 to-white/70 z-10" />
          <div
            className="absolute inset-0 w-full h-full bg-center bg-cover bg-no-repeat scale-110 will-change-transform"
            style={{
              backgroundImage: 'url(/childs.jpg)',
              backgroundAttachment: 'fixed',
              filter: 'blur(1.5px) brightness(0.85)',
            }}
          />
        </div>
        {/* Main content */}
        <div className="relative z-20 w-full max-w-2xl mx-auto flex flex-col items-center justify-center px-4 py-12 rounded-3xl bg-white/70 backdrop-blur-xl shadow-2xl border border-white/40">



        {/* Hero Section */}
        <section className="flex flex-col-reverse md:flex-row items-center justify-center">
          <div className="flex flex-col gap-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-2 text-center w-full">
              La plateforme de suivi des victimes
            </h1>
            <p className="text-base sm:text-lg text-gray-700 max-w-xl mb-3 text-center w-full">
              Application développée en interne pour le suivi et la gestion centralisée des victimes et de leurs dossiers.
            </p>
   -
          </div>

        </section>



        {/* Actions Section */}
        <section className="w-full max-w-4xl mx-auto px-6 pb-8 flex flex-col md:flex-row gap-8 mt-auto">
          {/* Suivi de la luc */}
          <div className="flex-1 bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center border-t-4 border-blue-400 hover:shadow-xl transition">
            <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-xl mb-3">
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><circle cx="16" cy="16" r="12" /><path d="M16 10v6l4 2" /></svg>
            </div>
            <h3 className="font-bold text-lg mb-1 text-blue-700">Suivi de la luc</h3>
            <p className="text-gray-600 mb-4">Visualiser et gérer l évolution de la luc en temps réel</p>
            <a href="/luc" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-medium shadow hover:bg-blue-700 transition">Accéder</a>
          </div>
          {/* Suivi des réparations */}
          <div className="flex-1 bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center border-t-4 border-green-400 hover:shadow-xl transition">
            <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-xl mb-3">
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500"><rect x="7" y="13" width="18" height="10" rx="3" /><path d="M16 17v-4" /><path d="M12 21h8" /></svg>
            </div>
            <h3 className="font-bold text-lg mb-1 text-green-700">Suivi des réparations</h3>
            <p className="text-gray-600 mb-4">Suivre le processus des réparations </p>
            <a href="/reparations" className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg font-medium shadow hover:bg-green-700 transition">Accéder</a>
          </div>
        </section>


        </div>
      </div>
    </MainLayout>
  );
}

