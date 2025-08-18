import Image from "next/image";
import MainLayout from "@/components/layouts/MainLayout";
import DashboardStats from "@/components/DashboardStats";

export default function Home() {
  return (
    <MainLayout>
      <div className="h-screen flex items-center justify-center p-4 overflow-hidden">
        {/* Conteneur principal parfaitement centré */}
        <div className="w-full max-w-4xl mx-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-6 md:p-8 lg:p-12">
            
            {/* Hero Section */}
            <div className="text-center mb-8 md:mb-12">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-4 md:mb-6">
                La plateforme de suivi des victimes
              </h1>
              <p className="text-base md:text-lg lg:text-xl text-gray-700 max-w-2xl mx-auto">
                Application développée en interne pour le suivi et la gestion centralisée des victimes et de leurs dossiers.
              </p>
            </div>

            {/* Actions Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-3xl mx-auto">
              {/* Suivi de la LUC */}
              <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 flex flex-col items-center text-center border-t-4 border-blue-400 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-blue-100 rounded-2xl mb-4 md:mb-6 shadow-md">
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500 md:w-9 md:h-9">
                    <circle cx="16" cy="16" r="12" />
                    <path d="M16 10v6l4 2" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg md:text-xl mb-2 md:mb-3 text-blue-700">Suivi de la LUC</h3>
                <p className="text-gray-600 mb-4 md:mb-6 leading-relaxed text-sm md:text-base">
                  Visualiser et gérer l'évolution de la LUC en temps réel
                </p>
                <a 
                  href="/luc" 
                  className="inline-block px-6 md:px-8 py-2 md:py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200 text-sm md:text-base"
                >
                  Accéder
                </a>
              </div>

              {/* Suivi des réparations */}
              <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 flex flex-col items-center text-center border-t-4 border-green-400 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-green-100 rounded-2xl mb-4 md:mb-6 shadow-md">
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500 md:w-9 md:h-9">
                    <rect x="7" y="13" width="18" height="10" rx="3" />
                    <path d="M16 17v-5" />
                    <path d="M12 22h8" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg md:text-xl mb-2 md:mb-3 text-green-700">Suivi des réparations</h3>
                <p className="text-gray-600 mb-4 md:mb-6 leading-relaxed text-sm md:text-base">
                  Suivre le processus des réparations
                </p>
                <a 
                  href="/reparations" 
                  className="inline-block px-6 md:px-8 py-2 md:py-3 bg-green-600 text-white rounded-xl font-semibold shadow-lg hover:bg-green-700 hover:shadow-xl transition-all duration-200 text-sm md:text-base"
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