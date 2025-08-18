"use client";
import React, { useState } from "react";
import { FiEye, FiGrid, FiUsers, FiTrendingUp, FiSettings, FiInfo, FiMapPin, FiHome, FiPhone, FiFolder, FiFileText, FiBarChart2, FiSearch, FiUser } from "react-icons/fi";
import ListVictims from './components/ListVictims'
import DashboardVictims from './components/dashboardVictims'



const mockProgrammes = [
  { id: 1, nom: "Programme A", categoryId: 1, categoryNom: "Victimes des ménages ordinaires" },
  { id: 2, nom: "Programme B", categoryId: 2, categoryNom: "Victimes des ménages collectifs" },
];
const mockCategories = [
  { id: 1, nom: "Victimes des ménages ordinaires" },
  { id: 2, nom: "Victimes des ménages collectifs" },
  { id: 3, nom: "Victimes en urgence médicale" },
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

const typeBadge = (type: string) =>
  type === "entreprise" ? (
    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">Entreprise</span>
  ) : (
    <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-semibold">Individu</span>
  );

const companyTypes = [
  { value: "sa", label: "Société Anonyme (SA)" },
  { value: "sarl", label: "SARL" },
  { value: "sas", label: "SAS" },
  { value: "association", label: "Association" },
  { value: "autre", label: "Autre" },
];

const VictimDetailModal = ({ victim, onClose }: { victim: any, onClose: () => void }) => {
  // Champs fictifs pour la démo
  const {
    fullname,
    province,
    territoire,
    secteur = "Secteur Demo",
    groupement = "Groupement Demo",
    village = "Village Demo",
    adresse = "123 Rue Principale, Ville",
    contact = "+243 999 000 111",
    status,
    avatar = "https://randomuser.me/api/portraits/men/32.jpg",
    age = 28, // valeur par défaut fictive
    sexe = 'M', // valeur par défaut fictive
  } = victim;
  const [tab, setTab] = React.useState<'infos' | 'dossier' | 'progression' | 'reglages'>('infos');
  const [selectedFile, setSelectedFile] = React.useState<any | null>(null);
  // Fichiers fictifs pour la démo
  const files = [
    { id: 1, name: "rapport-medical.pdf", label: "Rapport médical" },
    { id: 2, name: "plainte.pdf", label: "Plainte officielle" },
    { id: 3, name: "photo-blessure.jpg", label: "Photo de la blessure" },
    { id: 4, name: "certificat-psy.pdf", label: "Certificat psychologique" },
  ];
  const tabs = [
    { key: 'infos', label: 'Infos', icon: <FiInfo className="mr-2" /> },
    { key: 'dossier', label: 'Dossier', icon: <FiFolder className="mr-2" /> },
    { key: 'progression', label: 'Progression', icon: <FiBarChart2 className="mr-2" /> },
    { key: 'reglages', label: 'Réglages', icon: <FiSettings className="mr-2" /> },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen py-8 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl min-h-[800px] md:min-h-[900px] relative border border-gray-100 flex flex-col md:flex-row overflow-hidden">
        {/* Colonne gauche : Infos victime */}
        <div className="md:w-1/4 w-full bg-white flex flex-col items-center pt-10 pb-8 px-6 border-r border-gray-100">
          {/* Photo carré avec dégradé doux autour */}
          <div className="w-44 h-44 mb-6 bg-gradient-to-tr from-purple-200 via-pink-100 to-blue-100 p-1 rounded-3xl flex items-center justify-center shadow-xl">
            <img src={avatar} alt={fullname} className="w-full h-full object-cover rounded-2xl border-4 border-white shadow" />
          </div>
          {/* Nom et statut */}
          <div className="text-center mb-3">
            <div className="text-lg font-bold text-gray-800 flex items-center justify-center gap-2"><FiUser className="inline-block text-purple-700" />{fullname}</div>
            {/* Age et sexe */}
            <div className="flex items-center justify-center gap-2 mt-1 mb-1">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium shadow-sm">
                {sexe === 'F' ? <FiUsers className="text-pink-400" /> : <FiUser className="text-blue-400" />} {age} ans
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 text-gray-500 text-xs font-medium">
                {sexe === 'F' ? 'Femme' : 'Homme'}
              </span>
            </div>

          </div>
          {/* Infos groupées */}
          <div className="bg-gray-50 rounded-xl shadow p-4 mb-2 text-sm w-full space-y-2">
            <div className="flex items-center gap-2 text-gray-700"><FiMapPin className="text-purple-400" /> <span className="font-medium">Province:</span> {province}</div>
            <div className="flex items-center gap-2 text-gray-700"><FiMapPin className="text-purple-400" /> <span className="font-medium">Territoire:</span> {territoire}</div>
            <div className="flex items-center gap-2 text-gray-700"><FiMapPin className="text-purple-400" /> <span className="font-medium">Secteur:</span> {secteur}</div>
            <div className="flex items-center gap-2 text-gray-700"><FiMapPin className="text-purple-400" /> <span className="font-medium">Groupement:</span> {groupement}</div>
            <div className="flex items-center gap-2 text-gray-700"><FiHome className="text-purple-400" /> <span className="font-medium">Village:</span> {village}</div>
            <div className="flex items-center gap-2 text-gray-700"><FiHome className="text-purple-400" /> <span className="font-medium">Adresse:</span> {adresse}</div>
            <div className="flex items-center gap-2 text-gray-700"><FiPhone className="text-purple-400" /> <span className="font-medium">Contact:</span> {contact}</div>

            {/* --- Infos enrichies --- */}
            {/* Catégorie de victime */}
            {(() => {
              const categories = typeof mockCategories !== 'undefined' ? mockCategories : [
                { id: 1, nom: "Victimes des ménages ordinaires" },
                { id: 2, nom: "Victimes des ménages collectifs" },
                { id: 3, nom: "Victimes en urgence médicale" },
              ];
              let catLabel = victim.categoryNom;
              if (!catLabel && victim.categoryId) {
                const found = categories.find(c => c.id === Number(victim.categoryId));
                catLabel = found ? found.nom : victim.categoryId;
              }
              return catLabel ? (
                <div className="flex items-center gap-2 text-blue-700">
                  <FiUsers className="text-blue-400" /> <span className="font-medium">Catégorie de victime:</span> <span className="text-gray-900">{catLabel}</span>
                </div>
              ) : null;
            })()}
            {/* Préjudice subi */}
            {(() => {
              const prejudices = typeof mockPrejudices !== 'undefined' ? mockPrejudices : [
                { id: 1, nom: "Meurtre" },
                { id: 2, nom: "Préjuviol" },
                { id: 3, nom: "Imputation" },
                { id: 4, nom: "Préjudice moral" },
                { id: 5, nom: "Préjudice matériel" },
              ];
              let prejudiceLabel = victim.prejudiceNom;
              if (!prejudiceLabel && victim.prejudiceId) {
                const found = prejudices.find(p => p.id === Number(victim.prejudiceId));
                prejudiceLabel = found ? found.nom : victim.prejudiceId;
              }
              return prejudiceLabel ? (
                <div className="flex items-center gap-2 text-pink-700">
                  <FiFileText className="text-pink-400" /> <span className="font-medium">Préjudice subi:</span> <span className="text-gray-900">{prejudiceLabel}</span>
                </div>
              ) : null;
            })()}
            {/* Programme éligible */}
            {(() => {
              const programmes = typeof mockProgrammes !== 'undefined' ? mockProgrammes : [
                { id: 1, nom: "Programme A", categoryId: 1, categoryNom: "Victimes des ménages ordinaires" },
                { id: 2, nom: "Programme B", categoryId: 2, categoryNom: "Victimes des ménages collectifs" },
              ];
              let programmeLabel = victim.programmeNom;
              if (!programmeLabel) {
                if (victim.programmeId) {
                  const found = programmes.find(p => p.id === Number(victim.programmeId));
                  programmeLabel = found ? found.nom : victim.programmeId;
                } else if (programmes.length > 0) {
                  programmeLabel = programmes[0].nom;
                }
              }
              return programmeLabel ? (
                <div className="flex items-center gap-2 text-purple-700">
                  <FiFolder className="text-purple-400" /> <span className="font-medium">Programme éligible:</span> <span className="text-gray-900">{programmeLabel}</span>
                </div>
              ) : null;
            })()}
            {/* Récit audio */}
            {victim.storyAudio && (
              <div className="flex items-center gap-2 text-gray-700">
                <FiFileText className="text-purple-400" /> <span className="font-medium">Récit audio:</span>
                <audio controls className="ml-2">
                  <source src={typeof victim.storyAudio === 'string' ? victim.storyAudio : URL.createObjectURL(victim.storyAudio)} />
                  Votre navigateur ne supporte pas la lecture audio.
                </audio>
              </div>
            )}
            {/* Récit texte */}
            {victim.story && (
              <div className="flex items-start gap-2 text-gray-700">
                <FiFileText className="text-pink-400 mt-1" /> <span className="font-medium">Récit du survivant:</span>
                <span className="text-gray-900 bg-white/60 rounded-lg border border-gray-100 p-2 shadow-inner text-sm whitespace-pre-line">{victim.story}</span>
              </div>
            )}
            {/* Classe ou statut */}
            {victim.status && (
              <div className="flex items-center gap-2 text-green-700">
                <FiInfo className="text-green-400" /> <span className="font-medium">Statut:</span> <span className="text-gray-900">{victim.status}</span>
              </div>
            )}
          </div>
        </div>
        {/* Colonne droite : Tabs horizontaux et contenu */}
        <div className="md:w-3/4 w-full bg-white flex flex-col relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-pink-500 text-2xl font-bold z-20"
            title="Fermer"
          >×</button>
          <div className="flex gap-2 border-b border-gray-100 px-8 pt-8 pb-2">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as typeof tab)}
                className={`relative px-4 py-2 font-semibold transition text-sm outline-none focus-visible:ring-2 focus-visible:ring-purple-200 flex items-center ${tab === t.key ? 'text-purple-700' : 'text-gray-500 hover:text-purple-600'}`}
              >
                {t.icon}
                {t.label}
                {tab === t.key && <span className="absolute left-0 -bottom-1 w-full h-1 rounded bg-purple-400" />}
              </button>
            ))}
          </div>
          <div className="flex-1 px-8 py-6 overflow-y-auto">
            {tab === 'infos' && (() => {
              // Mocks locaux pour mapping
              const prejudices = typeof mockPrejudices !== 'undefined' ? mockPrejudices : [
                { id: 1, nom: "Meurtre" },
                { id: 2, nom: "Préjuviol" },
                { id: 3, nom: "Imputation" },
                { id: 4, nom: "Préjudice moral" },
                { id: 5, nom: "Préjudice matériel" },
              ];
              const programmes = typeof mockProgrammes !== 'undefined' ? mockProgrammes : [
                { id: 1, nom: "Programme A", categoryId: 1, categoryNom: "Victimes des ménages ordinaires" },
                { id: 2, nom: "Programme B", categoryId: 2, categoryNom: "Victimes des ménages collectifs" },
              ];
              // Trouver le nom du préjudice
              let prejudiceLabel = victim.prejudiceNom;
              if (!prejudiceLabel && victim.prejudiceId) {
                const found = prejudices.find(p => p.id === Number(victim.prejudiceId));
                prejudiceLabel = found ? found.nom : victim.prejudiceId;
              }
              // Trouver le nom du programme éligible
              let programmeLabel = victim.programmeNom;
              if (!programmeLabel) {
                if (victim.programmeId) {
                  const found = programmes.find(p => p.id === Number(victim.programmeId));
                  programmeLabel = found ? found.nom : victim.programmeId;
                } else if (programmes.length > 0) {
                  programmeLabel = programmes[0].nom;
                }
              }
              return (
                <div className="flex flex-col items-center w-full px-4 md:px-16 py-8">
                  <div className="w-full max-w-xl bg-gradient-to-tr from-purple-50 via-pink-50 to-blue-50 rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <FiInfo className="text-purple-500" /> Informations complémentaires
                    </div>
                    {/* Type de victime */}
                    {victim.categoryNom && (
                      <div className="flex items-center gap-3 mb-3">
                        <span className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-100"><FiUsers className="text-blue-500" /></span>
                        <span className="font-medium text-gray-700">Type de victime :</span>
                        <span className="text-gray-900">{victim.categoryNom}</span>
                      </div>
                    )}
                    {/* Préjudice subi */}
                    {prejudiceLabel && (
                      <div className="flex items-center gap-3 mb-3">
                        <span className="w-8 h-8 flex items-center justify-center rounded-xl bg-pink-100"><FiFileText className="text-pink-500" /></span>
                        <span className="font-medium text-gray-700">Préjudice subi :</span>
                        <span className="text-gray-900">{prejudiceLabel}</span>
                      </div>
                    )}
                    {/* Programme éligible */}
                    {programmeLabel && (
                      <div className="flex items-center gap-3 mb-3">
                        <span className="w-8 h-8 flex items-center justify-center rounded-xl bg-purple-100"><FiFolder className="text-purple-500" /></span>
                        <span className="font-medium text-gray-700">Programme éligible proposé :</span>
                        <span className="text-gray-900">{programmeLabel}</span>
                      </div>
                    )}
                    {/* Récit texte */}
                    {victim.story && (
                      <div className="flex items-start gap-3 mb-3">
                        <span className="w-8 h-8 flex items-center justify-center rounded-xl bg-gradient-to-tr from-pink-100 to-purple-100 mt-1"><FiFileText className="text-purple-400" /></span>
                        <div>
                          <div className="font-medium text-gray-700 mb-1">Récit du survivant :</div>
                          <div className="text-gray-700 whitespace-pre-line bg-white/60 rounded-lg border border-gray-100 p-3 shadow-inner text-sm">{victim.story}</div>
                        </div>
                      </div>
                    )}
                    {/* Récit audio */}
                    {victim.storyAudio && (
                      <div className="flex items-center gap-3 mb-3">
                        <span className="w-8 h-8 flex items-center justify-center rounded-xl bg-gradient-to-tr from-pink-100 to-purple-100"><FiFileText className="text-purple-400" /></span>
                        <div className="flex flex-col">
                          <div className="font-medium text-gray-700 mb-1">Récit audio du survivant :</div>
                          <audio controls className="w-full">
                            <source src={typeof victim.storyAudio === 'string' ? victim.storyAudio : URL.createObjectURL(victim.storyAudio)} />
                            Votre navigateur ne supporte pas la lecture audio.
                          </audio>
                        </div>
                      </div>
                    )}
                    {!victim.categoryNom && !prejudiceLabel && !programmeLabel && !victim.story && !victim.storyAudio && (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <FiInfo size={48} className="mb-2" />
                        <div className="font-bold">Aucune information complémentaire</div>
                        <div className="text-xs mt-2">Les informations complémentaires n'ont pas encore été ajoutées.</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {tab === 'dossier' && (
              <div className="flex flex-col md:flex-row h-full gap-6">
                {/* Liste des fichiers */}
                <div className="md:w-1/3 w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-4 flex flex-col gap-2 overflow-y-auto max-h-[350px] min-w-[220px]">
                  <div className="text-xs font-bold text-gray-500 mb-2 pl-1">Fichiers du dossier</div>
                  {files.length === 0 ? (
                    <div className="text-gray-400 text-center py-10">Aucun fichier</div>
                  ) : (
                    files.map((file, idx) => (
                      <button
                        key={file.id}
                        className={`flex items-center w-full gap-3 px-3 py-2 rounded-xl transition shadow-sm border border-transparent hover:border-purple-300 hover:bg-purple-50/40 focus:outline-none ${selectedFile && selectedFile.id === file.id ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-200' : 'bg-white'}`}
                        onClick={() => setSelectedFile(file)}
                      >
                        <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-tr from-purple-200 via-pink-100 to-blue-100 shadow-inner">
                          <FiFolder className="text-purple-500" size={22} />
                        </span>
                        <div className="flex flex-col items-start flex-1 text-left">
                          <span className="font-semibold text-gray-800 text-sm truncate">{file.name}</span>
                          <span className="text-xs text-gray-500 italic">{file.label}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                {/* Espace de lecture */}
                <div className="md:w-3/4 w-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl shadow-inner flex flex-col items-center justify-center p-10 min-h-[250px] border border-gray-100">
                  {!selectedFile ? (
                    <div className="flex flex-col items-center text-gray-400">
                      <FiEye size={40} className="mb-2" />
                      <div className="font-semibold">Sélectionne un fichier à droite pour l'aperçu</div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center w-full max-w-md">
                      <span className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-200 via-pink-100 to-blue-100 mb-3">
                        <FiFileText className="text-purple-500" size={36} />
                      </span>
                      <div className="font-bold text-lg text-gray-700 mb-1">{selectedFile.name}</div>
                      <div className="text-xs text-gray-500 mb-4">{selectedFile.label}</div>
                      <div className="w-full bg-white/80 rounded-xl border border-gray-100 p-4 text-gray-600 text-center shadow">
                        Aperçu non disponible
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {tab === 'progression' && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FiBarChart2 size={48} className="mb-2" />
                <div className="font-bold">Aucune progression disponible</div>
                <div className="text-xs mt-2">La progression de cette victime n'a pas encore été ajoutée.</div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};



const TAB_LIST = [
  { label: "Dashboard", key: "dashboard", icon: <FiGrid size={18} className="mr-2" /> },
  { label: "Victimes", key: "victimes", icon: <FiUsers size={18} className="mr-2" /> },
  // { label: "Statistiques & rapports", key: "stats", icon: <FiTrendingUp size={18} className="mr-2" /> },
  // { label: "Reglages", key: "reglage", icon: <FiSettings size={18} className="mr-2" /> },
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
      <div className="bg-white shadow-lg rounded-b-xl w-full min-h-[calc(100vh-200px)]">
        {activeTab === "dashboard" && <DashboardVictims /> }
        {activeTab === "victimes" && (
          <ListVictims
            mockPrejudices={mockPrejudices}
            mockMesures={mockMesures}
            mockProgrammes={mockProgrammes}
            mockCategories={mockCategories}
          />
        )}
        {activeTab === "programme" && <div>Contenu programme de réparations</div>}
        {activeTab === "indemnisation" && <div>Contenu demandes d’indemnisation</div>}
        {activeTab === "stats" && <div>Contenu statistiques & rapports</div>}
      </div>
    </div>
  );
};

export default ReparationsTabs; 