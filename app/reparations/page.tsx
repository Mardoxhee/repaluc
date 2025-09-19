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
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const sliderRef = React.useRef<HTMLSpanElement | null>(null);
  const [sliderStyle, setSliderStyle] = React.useState({ left: 0, width: 0 });

  React.useEffect(() => {
    const idx = TAB_LIST.findIndex(tab => tab.key === activeTab);
    const el = tabRefs.current[idx];
    if (el && el.offsetParent) {
      setSliderStyle({
        left: el.offsetLeft,
        width: el.offsetWidth
      });
    }
  }, [activeTab]);

  return (
    <div className="w-full px-4 pt-24">
      {/* Onglets */}
      <div className="relative flex gap-2 border-b mb-8 bg-white rounded-t-xl px-6 py-4 shadow-sm">
        {TAB_LIST.map((tab, idx) => (
          <button
            key={tab.key}
            ref={el => { tabRefs.current[idx] = el; }}
            onClick={() => setActiveTab(tab.key)}
            className={
              `relative px-6 py-3 font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-pink-300 ` +
              (activeTab === tab.key
                ? "text-blue-600 font-bold"
                : "text-gray-500 hover:text-blue-600")
            }
            style={{ background: "none", border: "none" }}
          >
            <span className="relative z-10 flex items-center">{tab.icon}{tab.label}</span>
          </button>
        ))}
        {/* Barre slider dégradée animée */}
        <span
          ref={sliderRef}
          className="absolute bottom-0 h-1.5 rounded-t bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 pointer-events-none transition-all duration-300"
          style={{ left: sliderStyle.left, width: sliderStyle.width }}
        />
      </div>

      {/* Contenu de l’onglet actif */}
      <div className="bg-white shadow-lg rounded-b-xl w-full min-h-[calc(100vh-200px)] p-4">
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
  );
};

export default ReparationsTabs; 