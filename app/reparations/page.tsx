"use client";
import React, { useState } from "react";
import { FiEye, FiGrid, FiUsers, FiTrendingUp, FiSettings, FiInfo, FiMapPin, FiHome, FiPhone, FiFolder, FiFileText, FiBarChart2, FiSearch, FiUser } from "react-icons/fi";
import ReglagesPanel from "./components/reglagePanel";
import ListVictims from './components/ListVictims'
import FiltreComponent from './components/filtreComponent'
import DashboardVictims from './components/dashboardVictims'



const mockProgrammes = [
  { id: 1, nom: "Programme A", categoryId: 1, categoryNom: "Victimes des ménages ordinaires" },
  { id: 2, nom: "Programme B", categoryId: 2, categoryNom: "Victimes des ménages collectifs" },
];
const mockCategories = [
  { id: 1, nom: "Victimes vivant dans les ménages ordinaires" },
  { id: 2, nom: "Victimes vivant dans les ménages collectifs" },
  { id: 3, nom: "Victime en cas d'urgence médicale" },
  { id: 4, nom: "Victimes detenant les décisions de justice" },

];
const mockPrejudices = [
  { id: 1, nom: "Meurtre" },
  { id: 2, nom: "Préjuviol" },
  { id: 3, nom: "Imputation" },
  { id: 4, nom: "Préjudice moral" },
  { id: 5, nom: "Préjudice matériel" },
];
const mockMesures = [
  { id: 1, nom: "Prise en charge médicale" },
  { id: 2, nom: "Clinique mobile" },
  { id: 3, nom: "Accompagnement psychologique" },
  { id: 4, nom: "Réinsertion sociale" },
  { id: 5, nom: "Indemnisation financière" },
  { id: 6, nom: "Appui économique" },
  { id: 7, nom: "Médiation familiale" },
  { id: 8, nom: "Assistance juridique" },
  { id: 9, nom: "Formation professionnelle" },

];



const TAB_LIST = [
  { label: "Dashboard", key: "dashboard", icon: <FiGrid size={18} className="mr-2" /> },
  { label: "Victimes", key: "victimes", icon: <FiUsers size={18} className="mr-2" /> },
  { label: "Statistiques & rapports", key: "stats", icon: <FiTrendingUp size={18} className="mr-2" /> },
  { label: "Reglages", key: "reglage", icon: <FiSettings size={18} className="mr-2" /> },
];


const ReparationsTabs = () => {
  const [activeTab, setActiveTab] = React.useState(TAB_LIST[0].key);

  return (
    <div className="w-full pt-5">
      {/* Onglets */}
      <div className="bg-white border-b-4 border-primary-500 shadow-sm">
        <div className="flex">
        {TAB_LIST.map((tab, idx) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              relative px-8 py-4 font-semibold text-sm uppercase tracking-wide transition-all duration-300 border-r border-gray-200 last:border-r-0
              ${activeTab === tab.key
                ? "bg-primary-500 text-white shadow-lg"
                : "bg-gray-50 text-gray-600 hover:bg-primary-50 hover:text-primary-700"
              }
            `}
          >
            <span className="flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary-500"></div>
            )}
          </button>
        ))}
        </div>
      </div>

      {/* Contenu de l’onglet actif */}
      <div className="bg-gray-50 w-full min-h-[calc(100vh-200px)]">
        <div className="bg-white shadow-sm border-l-4 border-primary-500 mx-4 mt-4">
          <div className="p-6">
        {activeTab === "dashboard" && <DashboardVictims />}
        {activeTab === "victimes" && (
          <>

            <ListVictims
              mockPrejudices={mockPrejudices}
              mockMesures={mockMesures}
              mockProgrammes={mockProgrammes}
              mockCategories={mockCategories}
            />
          </>
        )}
        {activeTab === "programme" && <div>Contenu programme de réparations</div>}
        {activeTab === "indemnisation" && <div>Contenu demandes d’indemnisation</div>}
        {activeTab === "stats" && <div>Contenu statistiques & rapports</div>}
        {activeTab === "reglage" && <ReglagesPanel mockPrejudices={mockPrejudices} mockMesures={mockMesures} mockProgrammes={mockProgrammes} mockCategories={mockCategories} />}
      </div>
    </div>
      </div>
    </div>
  );
};

export default ReparationsTabs; 