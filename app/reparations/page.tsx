"use client";
import React, { useState } from "react";
import { FiEdit, FiTrash, FiPlus, FiEye, FiGrid, FiUsers, FiTrendingUp, FiSettings, FiInfo, FiMapPin, FiHome, FiPhone, FiFolder, FiFileText, FiBarChart2, FiSearch, FiUser } from "react-icons/fi";
import Link from "next/link";
import VictimForm from "./components/VictimForm";

const fakeClients = [
  {
    id: 1,
    fullname: "Awa Diabaté",
    province: "Nord-Kivu",
    territoire: "Goma",
    sexe: "F",
    status: "Pris en charge",
  },
  {
    id: 2,
    fullname: "Moussa Koné",
    province: "Sud-Kivu",
    territoire: "Bukavu",
    sexe: "M",
    status: "En attente",
  },
  {
    id: 3,
    fullname: "Fatou Traoré",
    province: "Ituri",
    territoire: "Bunia",
    sexe: "F",
    status: "Rejeté",
  },
  {
    id: 4,
    fullname: "Jean Kouassi",
    province: "Haut-Uele",
    territoire: "Isiro",
    sexe: "M",
    status: "Pris en charge",
  },
  {
    id: 5,
    fullname: "Chantal Mbayo",
    province: "Maniema",
    territoire: "Kindu",
    sexe: "F",
    status: "En attente",
  },
  {
    id: 6,
    fullname: "Eric Ilunga",
    province: "Tshopo",
    territoire: "Kisangani",
    sexe: "M",
    status: "Pris en charge",
  },
  {
    id: 7,
    fullname: "Gloria Tshisekedi",
    province: "Kasai",
    territoire: "Tshikapa",
    sexe: "F",
    status: "Pris en charge",
  },
  {
    id: 8,
    fullname: "Patrick Lumumba",
    province: "Bas-Uele",
    territoire: "Buta",
    sexe: "M",
    status: "Rejeté",
  },
  {
    id: 9,
    fullname: "Marie Kabila",
    province: "Kwilu",
    territoire: "Kikwit",
    sexe: "F",
    status: "En attente",
  },
  {
    id: 10,
    fullname: "Serge Bemba",
    province: "Mongala",
    territoire: "Lisala",
    sexe: "M",
    status: "Pris en charge",
  },
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
            {tab === 'reglages' && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FiSettings size={48} className="mb-2" />
                <div className="font-bold">Aucun réglage disponible</div>
                <div className="text-xs mt-2">Les réglages de cette victime n'ont pas encore été ajoutés.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ListClients = () => {
  const [filterType, setFilterType] = React.useState<string>("");
  const [search, setSearch] = React.useState<string>("");
  const [page, setPage] = React.useState<number>(1);
  const perPage = 10;

  // État local pour la liste, l'édition et le modal
  const [clients, setClients] = React.useState(fakeClients);
  const [editClient, setEditClient] = React.useState<any | null>(null);
  const [showModal, setShowModal] = React.useState(false);
  const [victimDetail, setVictimDetail] = React.useState<any | null>(null);
  const [showVictimModal, setShowVictimModal] = React.useState(false);

  // Filtrage
  const filtered = clients.filter((c: any) => {
    if (!c) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        (typeof c.fullname === 'string' && c.fullname.toLowerCase().includes(s)) ||
        (typeof c.province === 'string' && c.province.toLowerCase().includes(s)) ||
        (typeof c.territoire === 'string' && c.territoire.toLowerCase().includes(s))
      );
    }
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  React.useEffect(() => { setPage(1); }, [filterType, search]);
  const EditClientModal = ({ client, onClose, onSave }: { client: any, onClose: () => void, onSave: (c: any) => void }) => {
    const [form, setForm] = React.useState<any>(client);
    const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      setForm(client);
      setLogoPreview(client.logo ? (typeof client.logo === 'string' ? client.logo : URL.createObjectURL(client.logo)) : null);
      // eslint-disable-next-line
    }, [client]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setForm((prev: any) => ({ ...prev, [name]: value }));
    };
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setForm((prev: any) => ({ ...prev, logo: file }));
        setLogoPreview(URL.createObjectURL(file));
      }
    };
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(form);
    };
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl relative border border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-pink-500 text-xl font-bold"
          >×</button>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Modifier le client</h2>
          <VictimForm
            form={form}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onClose={onClose}
            isEdit={true}
            prejudices={mockPrejudices}
            categories={mockCategories}
            programmes={mockProgrammes}
          />
        </div>
      </div>
    );
  };
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-14 px-4">
        <div className="max-w-7xl mx-auto w-full px-8">
          <div className="flex items-center justify-between w-full mb-8 ">
            <h1 className="text-3xl font-bold text-gray-900">Victimes</h1>
            <Link
              href="/reparations/register"
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold rounded-lg shadow-md hover:scale-[1.03] hover:shadow-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Nouvel victime
            </Link>
          </div>
          {/* Filtres */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-center ">
            <div className="relative w-full max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher une victime par nom ..."
                className="pl-10 pr-4 py-2 w-full rounded-xl bg-white border border-gray-300 shadow-sm text-sm focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto rounded-2xl shadow-lg bg-white/90 border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">N*</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nom complet</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Province</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Territoire</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sexe</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {paginated.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">Aucun client trouvé</td></tr>
                )}
              </tbody>

              <tbody>
                {paginated.map((client, idx) => (
                  <tr key={client.id} className="border-b hover:bg-blue-50/30 transition">
                    <td className="px-4 py-3">{(page - 1) * perPage + idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{client.fullname}</td>
                    <td className="px-4 py-3">{client.province}</td>
                    <td className="px-4 py-3">{client.territoire}</td>
                    <td className="px-4 py-3">{client.sexe}</td>
                    <td className="px-4 py-3">
                      {client.status === "Pris en charge" && (
                        <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">Pris en charge</span>
                      )}
                      {client.status === "En attente" && (
                        <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">En attente</span>
                      )}
                      {client.status === "Rejeté" && (
                        <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Rejeté</span>
                      )}
                    </td>
                    <td className="px-4 py-3 flex gap-2 justify-center">
                      <button
                        className="group flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-500 hover:bg-blue-700 text-white border border-blue-600 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-300"
                        title="Voir les détails"
                        onClick={() => { setVictimDetail(client); setShowVictimModal(true); }}
                      >
                        <FiEye className="w-5 h-5" />
                        <span className="hidden sm:inline">Détails</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-lg border bg-white text-gray-600 hover:bg-pink-50 disabled:opacity-50"
            disabled={page === 1}
          >
            Précédent
          </button>
          <span className="px-2 py-2 text-gray-700 font-medium">Page {page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded-lg border bg-white text-gray-600 hover:bg-pink-50 disabled:opacity-50"
            disabled={page === totalPages}
          >
            Suivant
          </button>
        </div>
      </div >

      {
        showModal && editClient && (
          <EditClientModal
            client={editClient}
            onClose={() => { setShowModal(false); setEditClient(null) }}
            onSave={(updated: any) => {
              setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
              setShowModal(false);
              setEditClient(null);
            }}
          />
        )
      }
      {showVictimModal && victimDetail && (
        <VictimDetailModal
          victim={victimDetail}
          onClose={() => setShowVictimModal(false)}
        />
      )}

    </>
  )




}

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
    <div className="w-full max-w-7xl mx-auto px-2">
      {/* Onglets */}
      <div className="relative flex gap-2 border-b mb-8">
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
      <div className="bg-white shadow w-full p-2">
        {activeTab === "dashboard" && <div>Dashboard à venir…</div>}
        {activeTab === "victimes" && <ListClients />}
        {activeTab === "programme" && <div>Contenu programme de réparations</div>}
        {activeTab === "indemnisation" && <div>Contenu demandes d’indemnisation</div>}
        {activeTab === "stats" && <div>Contenu statistiques & rapports</div>}
        {activeTab === "reglage" && <ReglagesPanel />}
      </div>
    </div>
  );
};

// --- ReglagesPanel ---

const mockProgrammes = [
  { id: 1, nom: "Programme A", categoryId: 1, categoryNom: "Victimes des ménages ordinaires" },
  { id: 2, nom: "Programme B", categoryId: 2, categoryNom: "Victimes des ménages collectifs" },
];
const mockCategories = [
  { id: 1, nom: "Victimes des ménages ordinaires" },
  { id: 2, nom: "Victimes des ménages collectifs" },
  { id: 3, nom: "Victimes en urgence médicale" },

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

function ReglagesPanel() {
  // States pour chaque entité
  const [programmes, setProgrammes] = useState(mockProgrammes);
  const [categories] = useState(mockCategories);
  const [prejudices, setPrejudices] = useState(mockPrejudices);
  const [mesures, setMesures] = useState(mockMesures);

  // Recherche et pagination programmes
  const [searchProgramme, setSearchProgramme] = useState("");
  const [searchCategorie, setSearchCategorie] = useState("");
  const [searchPrejudice, setSearchPrejudice] = useState("");
  const [searchMesure, setSearchMesure] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;
  const filteredProgrammes = programmes.filter((p: any) =>
    p.nom.toLowerCase().includes(searchProgramme.toLowerCase()) ||
    (p.categoryNom && p.categoryNom.toLowerCase().includes(searchProgramme.toLowerCase()))
  );
  const totalPages = Math.ceil(filteredProgrammes.length / perPage);
  // Recherche pour les autres listes
  const filteredCategories = categories.filter(cat => cat.nom.toLowerCase().includes(searchCategorie.toLowerCase()));
  const filteredPrejudices = prejudices.filter(prej => prej.nom.toLowerCase().includes(searchPrejudice.toLowerCase()));
  const filteredMesures = mesures.filter(mesure => mesure.nom.toLowerCase().includes(searchMesure.toLowerCase()));

  // Modales
  const [showProgModal, setShowProgModal] = useState(false);
  const [editProg, setEditProg] = useState<any | null>(null);
  const [showPrejModal, setShowPrejModal] = useState(false);
  const [editPrej, setEditPrej] = useState<any | null>(null);
  const [showMesureModal, setShowMesureModal] = useState(false);
  const [editMesure, setEditMesure] = useState<any | null>(null);

  // Handlers CRUD (exemple pour Programmes)
  const handleAddProg = () => { setEditProg({ id: null, nom: "", description: "" }); setShowProgModal(true); };
  const handleEditProg = (p: any) => { setEditProg(p); setShowProgModal(true); };
  const handleSaveProg = (p: any) => {
    if (p.id) setProgrammes(prev => prev.map(x => x.id === p.id ? p : x));
    else setProgrammes(prev => [...prev, { ...p, id: Date.now() }]);
    setShowProgModal(false); setEditProg(null);
  };
  const handleDeleteProg = (id: number) => setProgrammes(prev => prev.filter(x => x.id !== id));

  // Idem pour Prejudices et Mesures (CRUD minimal)
  const handleAddPrej = () => { setEditPrej({ id: null, nom: "" }); setShowPrejModal(true); };
  const handleEditPrej = (p: any) => { setEditPrej(p); setShowPrejModal(true); };
  const handleSavePrej = (p: any) => {
    if (p.id) setPrejudices(prev => prev.map(x => x.id === p.id ? p : x));
    else setPrejudices(prev => [...prev, { ...p, id: Date.now() }]);
    setShowPrejModal(false); setEditPrej(null);
  };
  const handleDeletePrej = (id: number) => setPrejudices(prev => prev.filter(x => x.id !== id));

  const handleAddMesure = () => { setEditMesure({ id: null, nom: "" }); setShowMesureModal(true); };
  const handleEditMesure = (m: any) => { setEditMesure(m); setShowMesureModal(true); };
  const handleSaveMesure = (m: any) => {
    if (m.id) setMesures(prev => prev.map(x => x.id === m.id ? m : x));
    else setMesures(prev => [...prev, { ...m, id: Date.now() }]);
    setShowMesureModal(false); setEditMesure(null);
  };
  const handleDeleteMesure = (id: number) => setMesures(prev => prev.filter(x => x.id !== id));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Programmes */}
      <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Programmes de réparation</h2>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow hover:scale-110 transition-transform"
            title="Ajouter un programme"
            onClick={handleAddProg}
          >
            <FiPlus size={22} />
          </button>
        </div>
        {/* Barre de recherche */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 items-center w-full max-w-md">
            <div className="relative w-full">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher un programme ou une catégorie..."
                className="pl-10 pr-4 py-2 w-full rounded-xl bg-white border border-gray-300 shadow-sm text-sm focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                value={searchProgramme}
                onChange={e => { setSearchProgramme(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 font-semibold"><th className="py-2 text-left w-10">#</th><th className="py-2 text-left">Nom</th><th>Catégorie</th><th></th></tr></thead>
          <tbody>
            {filteredProgrammes.slice((currentPage - 1) * perPage, currentPage * perPage).map((prog: any, idx: number) => (
              <tr key={prog.id} className="border-b last:border-0">
                <td className="py-2 font-semibold text-gray-500">{(currentPage - 1) * perPage + idx + 1}</td>
                <td className="py-2 font-medium">{prog.nom}</td>
                <td>{prog.categoryNom}</td>
                <td className="flex gap-2">
                  <button
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 shadow-sm"
                    title="Éditer"
                    onClick={() => handleEditProg(prog)}
                  >
                    <FiEdit size={18} />
                  </button>
                  <button
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-500 shadow-sm"
                    title="Supprimer"
                    onClick={() => handleDeleteProg(prog.id)}
                  >
                    <FiTrash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >Précédent</button>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                className={`px-3 py-1 rounded ${currentPage === idx + 1 ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setCurrentPage(idx + 1)}
              >{idx + 1}</button>
            ))}
            <button
              className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >Suivant</button>
          </div>
        )}
        {/* Modal Programme */}
        {showProgModal && (
          <Modal title={editProg?.id ? "Modifier le programme" : "Ajouter un programme"} onClose={() => setShowProgModal(false)}>
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSaveProg(editProg); }}>
              <input className="w-full border rounded px-3 py-2" placeholder="Nom" value={editProg.nom} onChange={e => setEditProg({ ...editProg, nom: e.target.value })} required />
              <select
                className="w-full border rounded px-3 py-2"
                value={editProg.categoryId || ''}
                onChange={e => {
                  const catId = Number(e.target.value);
                  const cat = categories.find(c => c.id === catId);
                  setEditProg({ ...editProg, categoryId: catId, categoryNom: cat ? cat.nom : '' });
                }}
                required
              >
                <option value="" disabled>Choisir la catégorie de victime</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nom}</option>
                ))}
              </select>
              <div className="flex gap-2 justify-end">
                <button type="button" className="px-4 py-2 rounded bg-gray-100" onClick={() => setShowProgModal(false)}>Annuler</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Enregistrer</button>
              </div>
            </form>
          </Modal>
        )}
      </div>
      {/* Catégories de victimes */}
      <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Catégories de victimes</h2>
        </div>
        {/* Barre de recherche Catégories */}
        <div className="mb-4 w-full">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
              <FiSearch size={18} />
            </span>
            <input
              type="text"
              placeholder="Rechercher une catégorie..."
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent w-full"
              value={searchCategorie}
              onChange={e => setSearchCategorie(e.target.value)}
            />
          </div>
        </div>
        <ul className="text-sm">
          {filteredCategories.map((cat, idx) => (
            <li key={cat.id} className="py-2 border-b last:border-0"><span className="font-semibold text-gray-500 mr-2">{idx + 1}.</span>{cat.nom}</li>
          ))}
        </ul>
      </div>
      {/* Préjudices */}
      <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Préjudices</h2>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow hover:scale-110 transition-transform"
            title="Ajouter un préjudice"
            onClick={handleAddPrej}
          >
            <FiPlus size={22} />
          </button>
        </div>
        {/* Barre de recherche Préjudices */}
        <div className="mb-4 w-full">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
              <FiSearch size={18} />
            </span>
            <input
              type="text"
              placeholder="Rechercher un préjudice..."
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent w-full"
              value={searchPrejudice}
              onChange={e => setSearchPrejudice(e.target.value)}
            />
          </div>
        </div>
        <ul className="text-sm">
          {filteredPrejudices.map((prej, idx) => (
            <li key={prej.id} className="py-2 border-b last:border-0 flex items-center justify-between">
              <span><span className="font-semibold text-gray-500 mr-2">{idx + 1}.</span>{prej.nom}</span>
              <span className="flex gap-2 ml-auto min-w-[90px]">
                <button
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 shadow-sm"
                  title="Éditer"
                  onClick={() => handleEditPrej(prej)}
                >
                  <FiEdit size={18} />
                </button>
                <button
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-500 shadow-sm"
                  title="Supprimer"
                  onClick={() => handleDeletePrej(prej.id)}
                >
                  <FiTrash size={18} />
                </button>
              </span>
            </li>
          ))}
        </ul>
        {/* Modal Préjudice */}
        {showPrejModal && (
          <Modal title={editPrej?.id ? "Modifier le préjudice" : "Ajouter un préjudice"} onClose={() => setShowPrejModal(false)}>
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSavePrej(editPrej); }}>
              <input className="w-full border rounded px-3 py-2" placeholder="Nom" value={editPrej.nom} onChange={e => setEditPrej({ ...editPrej, nom: e.target.value })} required />
              <div className="flex gap-2 justify-end">
                <button type="button" className="px-4 py-2 rounded bg-gray-100" onClick={() => setShowPrejModal(false)}>Annuler</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Enregistrer</button>
              </div>
            </form>
          </Modal>
        )}
      </div>
      {/* Mesures de réparation */}
      <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Mesures de réparation</h2>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow hover:scale-110 transition-transform"
            title="Ajouter une mesure"
            onClick={handleAddMesure}
          >
            <FiPlus size={22} />
          </button>
        </div>
        {/* Barre de recherche Mesures */}
        <div className="mb-4 w-full">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
              <FiSearch size={18} />
            </span>
            <input
              type="text"
              placeholder="Rechercher une mesure..."
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent w-full"
              value={searchMesure}
              onChange={e => setSearchMesure(e.target.value)}
            />
          </div>
        </div>
        <ul className="text-sm">
          {filteredMesures.map((mesure, idx) => (
            <li key={mesure.id} className="py-2 border-b last:border-0 flex items-center justify-between">
              <span><span className="font-semibold text-gray-500 mr-2">{idx + 1}.</span>{mesure.nom}</span>
              <span className="flex gap-2 ml-auto min-w-[90px]">
                <button
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 shadow-sm"
                  title="Éditer"
                  onClick={() => handleEditMesure(mesure)}
                >
                  <FiEdit size={18} />
                </button>
                <button
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-500 shadow-sm"
                  title="Supprimer"
                  onClick={() => handleDeleteMesure(mesure.id)}
                >
                  <FiTrash size={18} />
                </button>
              </span>
            </li>
          ))}
        </ul>
        {/* Modal Mesure */}
        {showMesureModal && (
          <Modal title={editMesure?.id ? "Modifier la mesure" : "Ajouter une mesure"} onClose={() => setShowMesureModal(false)}>
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSaveMesure(editMesure); }}>
              <input className="w-full border rounded px-3 py-2" placeholder="Nom" value={editMesure.nom} onChange={e => setEditMesure({ ...editMesure, nom: e.target.value })} required />
              <div className="flex gap-2 justify-end">
                <button type="button" className="px-4 py-2 rounded bg-gray-100" onClick={() => setShowMesureModal(false)}>Annuler</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Enregistrer</button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
}

// --- Modal générique ---
function Modal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative border border-gray-100 animate-fadein">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-pink-500 text-xl font-bold"
          title="Fermer"
        >×</button>
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export default ReparationsTabs;