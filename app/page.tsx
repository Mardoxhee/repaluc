import Image from "next/image";
import MainLayout from "@/components/layouts/MainLayout";
import { FiShield, FiUsers, FiFileText, FiTrendingUp, FiCheck, FiArrowRight } from 'react-icons/fi';

export default function Home() {
  return (
    <MainLayout noZoom>
      <div className="relative h-full min-h-screen p-4 bg-gradient-to-br from-gray-50 via-white to-blue-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-20 left-20 w-32 h-32 bg-primary-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-40 right-20 w-40 h-40 bg-secondary-500 rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-6 py-8">
            {/* En-tête institutionnel */}
            <div className="text-center mb-2 mt-16">
              <div className="flex justify-center mb-2">
                <div className="relative">
                  <div className="w-15 h-15 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-2xl">
                    <FiShield className="text-white text-2xl" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>

              <h1 className="text-4xl lg:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                Système de Suivi
                <span className="block text-primary-600">des Victimes</span>
              </h1>

              <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-full px-6 py-2 mb-4">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-primary-700 font-semibold text-sm">FONAREV OPÉRATIONNEL</span>
              </div>
            </div>


            {/* Modules principaux */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {/* Module LUC */}
              <div className="group relative bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 min-h-[140px]">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>

                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                      <FiFileText className="text-white text-2xl" />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-gray-900">Liste Unique Consolidée</h3>
                      <p className="text-blue-600 font-medium text-xs">Module LUC</p>
                    </div>
                  </div>

                  <p className="text-[12px] text-gray-600 mb-2 leading-snug">
                    Gestion centralisée et suivi des victimes.
                  </p>

                  <a
                    href="/luc"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg font-semibold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-200 group-hover:scale-105 text-xs"
                  >
                    Accéder au module
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>

              {/* Module Réparations */}
              <div className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-500 min-h-[140px]">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-600"></div>

                <div className="p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                      <FiShield className="text-white text-2xl" />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-gray-900">Programmes de Réparations</h3>
                      <p className="text-green-600 font-medium text-xs">Module Réparations</p>
                    </div>
                  </div>

                  <p className="text-[12px] text-gray-600 mb-2 leading-snug">
                    Suivi et gestion des réparations.
                  </p>

                  <a
                    href="/reparations"
                    className="inline-flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg font-semibold shadow-md hover:bg-green-700 hover:shadow-lg transition-all duration-200 group-hover:scale-105 text-xs"
                  >
                    Accéder au module
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
              {/* Module Justice */}
              <div className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-500 min-h-[140px]">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-600"></div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                      <FiTrendingUp className="text-white text-2xl" />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-gray-900">Accès à la Justice</h3>
                      <p className="text-purple-600 font-medium text-xs">Module Justice</p>
                    </div>
                  </div>
                  <p className="text-[12px] text-gray-600 mb-2 leading-snug">
                    Accompagnement juridique des victimes.
                  </p>
                  <a
                    href="/justice"
                    className="inline-flex items-center gap-2 bg-purple-600 text-white px-3 py-2 rounded-lg font-semibold shadow-md hover:bg-purple-700 hover:shadow-lg transition-all duration-200 group-hover:scale-105 text-xs"
                  >
                    Accéder au module
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section institutionnelle */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white py-2">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <div className="flex flex-wrap justify-center gap-6">
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <FiCheck className="text-green-300" />
                <span className="text-primary-100 text-[12px] ">Système sécurisé</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <FiShield className="text-blue-300" />
                <span className="text-primary-100 text-[12px] ">Données protégées</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <FiUsers className="text-purple-300" />
                <span className="text-primary-100 text-[12px] ">Accès contrôlé</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}