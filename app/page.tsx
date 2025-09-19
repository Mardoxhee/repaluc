import Image from "next/image";
import MainLayout from "@/components/layouts/MainLayout";
import { FiShield, FiUsers, FiFileText, FiTrendingUp, FiCheck, FiArrowRight } from 'react-icons/fi';

export default function Home() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-20 left-20 w-32 h-32 bg-primary-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-40 right-20 w-40 h-40 bg-secondary-500 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-6 py-16">
            {/* En-tête institutionnel */}
            <div className="text-center mb-16">
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-2xl">
                    <FiShield className="text-white text-4xl" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Système de Suivi
                <span className="block text-primary-600">des Victimes</span>
              </h1>
              
              <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-full px-6 py-2 mb-8">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-primary-700 font-semibold text-sm">FONAREV OPÉRATIONNEL</span>
              </div>
              
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Plateforme officielle de la République Démocratique du Congo pour le suivi, 
                la gestion et l'accompagnement des victimes dans leur parcours vers la justice et la réparation.
              </p>
            </div>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-gray-100 shadow-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FiUsers className="text-blue-600 text-xl" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">2,847</div>
                <div className="text-sm text-gray-600">Victimes enregistrées</div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-gray-100 shadow-lg">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FiCheck className="text-green-600 text-xl" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">1,523</div>
                <div className="text-sm text-gray-600">Dossiers traités</div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-gray-100 shadow-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FiFileText className="text-purple-600 text-xl" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">892</div>
                <div className="text-sm text-gray-600">Réparations accordées</div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-gray-100 shadow-lg">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FiTrendingUp className="text-orange-600 text-xl" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">94%</div>
                <div className="text-sm text-gray-600">Taux de satisfaction</div>
              </div>
            </div>

            {/* Modules principaux */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Module LUC */}
              <div className="group relative bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <FiFileText className="text-white text-2xl" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Liste Unique Consolidée</h3>
                      <p className="text-blue-600 font-medium">Module LUC</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Gestion centralisée de la liste unique consolidée des victimes. 
                    Enregistrement, validation et suivi des dossiers selon les standards officiels.
                  </p>
                  
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">Enregistrement des victimes</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">Validation des dossiers</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">Suivi en temps réel</span>
                    </li>
                  </ul>
                  
                  <a 
                    href="/luc" 
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200 group-hover:scale-105"
                  >
                    Accéder au module
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>

              {/* Module Réparations */}
              <div className="group relative bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-600"></div>
                
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <FiShield className="text-white text-2xl" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Programmes de Réparations</h3>
                      <p className="text-green-600 font-medium">Module Réparations</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Suivi et gestion des programmes de réparations pour les victimes. 
                    Attribution des mesures, suivi des bénéficiaires et évaluation des impacts.
                  </p>
                  
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700">Gestion des programmes</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700">Attribution des mesures</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700">Suivi des bénéficiaires</span>
                    </li>
                  </ul>
                  
                  <a 
                    href="/reparations" 
                    className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-green-700 hover:shadow-xl transition-all duration-200 group-hover:scale-105"
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
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-6">Engagement de l'État</h2>
            <p className="text-xl text-primary-100 max-w-4xl mx-auto mb-8 leading-relaxed">
              Dans le cadre de sa politique de justice transitionnelle, la République Démocratique du Congo 
              s'engage à garantir les droits des victimes et à assurer leur accès effectif à la justice et aux réparations.
            </p>
            
            <div className="flex flex-wrap justify-center gap-8">
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <FiCheck className="text-green-300" />
                <span className="text-primary-100">Système sécurisé</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <FiShield className="text-blue-300" />
                <span className="text-primary-100">Données protégées</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <FiUsers className="text-purple-300" />
                <span className="text-primary-100">Accès contrôlé</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}