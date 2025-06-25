"use client";
import React from "react";
import { FiGrid, FiUsers, FiRepeat, FiDollarSign, FiTrendingUp, FiSettings, FiEye, FiMapPin, FiHome, FiPhone, FiMail, FiFolder, FiBarChart2, FiMoreHorizontal, FiUser, FiInfo, FiFileText } from "react-icons/fi";
import Link from "next/link";
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
            {tab === 'infos' && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FiInfo size={48} className="mb-2" />
                <div className="font-bold">Aucune information complémentaire</div>
                <div className="text-xs mt-2">Les informations complémentaires n'ont pas encore été ajoutées.</div>
              </div>
            )}
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
            <input
              type="text"
              placeholder="Rechercher nom ou email..."
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent w-full md:w-64"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
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
  { label: "Programmes", key: "programme", icon: <FiRepeat size={18} className="mr-2" /> },
  { label: "Partenaires", key: "partenaires", icon: <FiDollarSign size={18} className="mr-2" /> },
  { label: "Statistiques & rapports", key: "stats", icon: <FiTrendingUp size={18} className="mr-2" /> },
  { label: "Paramètres avancés", key: "parametres", icon: <FiSettings size={18} className="mr-2" /> },
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
            ref={el => tabRefs.current[idx] = el}
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
        {activeTab === "parametres" && <div>Contenu paramètres avancés</div>}
      </div>
    </div>
  );
};

export default ReparationsTabs;