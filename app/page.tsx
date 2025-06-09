import Image from "next/image";

import MainLayout from "@/components/layouts/MainLayout";
import DashboardStats from "@/components/DashboardStats";

export default function Home() {
  return (
    <MainLayout>
      <div className="flex flex-col gap-10 w-full max-w-[1440px] mx-auto pt-6 pb-12 px-2 sm:px-8">
        {/* Filtres période */}
        <div className="flex justify-end mb-2">
          <div className="inline-flex rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 focus:bg-blue-100 transition">Année</button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 focus:bg-blue-100 transition border-l border-gray-200">Mois</button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 focus:bg-blue-100 transition border-l border-gray-200">Semaine</button>
          </div>
        </div>

        {/* Statistiques principales */}
        <DashboardStats />

        {/* Graphiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-50 flex flex-col">
            <span className="text-lg font-bold text-gray-800 mb-2">Revenus mensuels</span>
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full h-40 flex items-center justify-center text-gray-400">[Graphique placeholder]</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-50 flex flex-col">
            <span className="text-lg font-bold text-gray-800 mb-2">Souscriptions par mois</span>
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full h-40 flex items-center justify-center text-gray-400">[Graphique placeholder]</div>
            </div>
          </div>
        </div>

        {/* Top users & apps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-50">
            <span className="text-lg font-bold text-gray-800 mb-4 block">Top utilisateurs</span>
            <ul className="space-y-3">
              <li className="flex items-center gap-3"><span className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">AD</span> <span className="font-semibold text-gray-700">Awa Diabaté</span> <span className="ml-auto text-xs text-gray-500">132 souscriptions</span></li>
              <li className="flex items-center gap-3"><span className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center font-bold text-pink-700">MK</span> <span className="font-semibold text-gray-700">Moussa Koné</span> <span className="ml-auto text-xs text-gray-500">97 souscriptions</span></li>
              <li className="flex items-center gap-3"><span className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-700">JD</span> <span className="font-semibold text-gray-700">Jean Dupont</span> <span className="ml-auto text-xs text-gray-500">81 souscriptions</span></li>
            </ul>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-50">
            <span className="text-lg font-bold text-gray-800 mb-4 block">Top applications</span>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-xl bg-purple-200 flex items-center justify-center font-bold text-purple-700 text-lg">MZ</span>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800 leading-tight">Mazaya</span>
                  <span className="text-xs text-gray-500">Mazaya S.A.</span>
                </div>
                <span className="ml-auto text-sm text-gray-700 font-medium">520 utilisateurs</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-xl bg-blue-200 flex items-center justify-center font-bold text-blue-700 text-lg">TI</span>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800 leading-tight">TechI</span>
                  <span className="text-xs text-gray-500">Tech Innov SARL</span>
                </div>
                <span className="ml-auto text-sm text-gray-700 font-medium">310 utilisateurs</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-xl bg-pink-200 flex items-center justify-center font-bold text-pink-700 text-lg">AX</span>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800 leading-tight">AppX</span>
                  <span className="text-xs text-gray-500">AppX Corp</span>
                </div>
                <span className="ml-auto text-sm text-gray-700 font-medium">150 utilisateurs</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Suggestions */}
        <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border border-gray-100 rounded-2xl shadow p-8 flex flex-col items-center">
          <span className="text-xl font-bold text-gray-800 mb-2">Suggestions d'amélioration</span>
          <ul className="text-gray-600 text-base list-disc pl-6 space-y-1">
            <li>Automatiser les relances d’abonnement bientôt expirés</li>
            <li>Ajouter un tableau de bord exportable (PDF/Excel)</li>
            <li>Mettre en avant les offres populaires</li>
            <li>Intégrer des notifications temps réel</li>
          </ul>
        </div>

        {/* Roadmap / Fonctionnalités à venir */}
        <div className="mt-6 w-full max-w-3xl mx-auto bg-white border border-gray-100 rounded-2xl shadow flex flex-col p-8 gap-4">
          <span className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pink-500 mr-1"><path d="M12 8v4l3 3"/></svg>
            Fonctionnalités à venir
          </span>
          <ul className="space-y-4">
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><path d="M3 8v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><path d="M16 8V6a4 4 0 0 0-8 0v2"/><rect width="16" height="4" x="2" y="8" rx="2"/></svg>
              </span>
              <div>
                <span className="font-semibold text-gray-800">Automatiser les relances d’abonnement</span>
                <div className="text-gray-500 text-sm">Envoi automatique de rappels avant expiration pour maximiser la rétention.</div>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500"><path d="M4 4h14v14H4z"/><path d="M8 4v14M16 8H4"/></svg>
              </span>
              <div>
                <span className="font-semibold text-gray-800">Tableau de bord exportable</span>
                <div className="text-gray-500 text-sm">Exportez vos stats au format PDF ou Excel en un clic.</div>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" className="text-pink-500"><path d="M12 17l-5-5 1.41-1.41L12 14.17l6.59-6.59L20 9l-8 8z"/></svg>
              </span>
              <div>
                <span className="font-semibold text-gray-800">Offres populaires en avant</span>
                <div className="text-gray-500 text-sm">Mettez en lumière les abonnements les plus attractifs pour booster les ventes.</div>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-500"><circle cx="11" cy="11" r="9"/><path d="M11 7v4l2.5 2.5"/></svg>
              </span>
              <div>
                <span className="font-semibold text-gray-800">Notifications temps réel</span>
                <div className="text-gray-500 text-sm">Recevez des alertes instantanées sur les événements importants.</div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}
