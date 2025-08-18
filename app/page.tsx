import Image from "next/image";
import MainLayout from "@/components/layouts/MainLayout";
import DashboardStats from "@/components/DashboardStats";

export default function Home() {
  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center p-4">
        {/* Background avec image fixe */}
        <div className="fixed inset-0 w-full h-full z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-pink-900/40 to-white/70 z-10" />
          <div
            className="absolute inset-0 w-full h-full bg-center bg-cover bg-no-repeat"
            style={{
              backgroundImage: 'url(/childs.jpg)',
              filter: 'blur(1.5px) brightness(0.85)',
            }}
          />
        </div>

        {/* Conteneur principal centré */}
        <div className="relative z-20 w-full max-w-4xl mx-auto">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-8 md:p-12">
            
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                La plateforme de suivi des victimes
              </h1>
              <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto">
                Application développée en interne pour le suivi et la gestion centralisée des victimes et de leurs dossiers.
              </p>
            </div>

            {/* Actions Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {/* Suivi de la LUC */}
              <div className="bg-white/80 rounded-2xl shadow-lg p-8 flex flex-col items-center text-center border-t-4 border-blue-400 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 flex items-center justify-center bg-blue-100 rounded-2xl mb-6 shadow-md">
                  <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                    <circle cx="18" cy="18" r="14" />
                    <path d="M18 12v8l5 3" />
                  </svg>
                </div>
                <h3 className="font-bold text-xl mb-3 text-blue-700">Suivi de la LUC</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Visualiser et gérer l'évolution de la LUC en temps réel
                </p>
                <a 
                  href="/luc" 
                  className="inline-block px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200"
                >
                  Accéder
                </a>
              </div>

              {/* Suivi des réparations */}
              <div className="bg-white/80 rounded-2xl shadow-lg p-8 flex flex-col items-center text-center border-t-4 border-green-400 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 flex items-center justify-center bg-green-100 rounded-2xl mb-6 shadow-md">
                  <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                    <rect x="9" y="15" width="20" height="12" rx="4" />
                    <path d="M18 19v-6" />
                    <path d="M14 25h8" />
                  </svg>
                </div>
                <h3 className="font-bold text-xl mb-3 text-green-700">Suivi des réparations</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Suivre le processus des réparations
                </p>
                <a 
                  href="/reparations" 
                  className="inline-block px-8 py-3 bg-green-600 text-white rounded-xl font-semibold shadow-lg hover:bg-green-700 hover:shadow-xl transition-all duration-200"
                >
                  Accéder
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}