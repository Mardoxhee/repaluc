import React from "react";
import { FiInfo, FiFolder, FiBarChart2, FiSettings, FiUsers, FiUser, FiMapPin, FiHome, FiPhone, FiFileText, FiEye, FiEdit, FiTrash, FiPlus, FiCheck, FiX } from "react-icons/fi";
import { mockCategories, mockPrejudices, mockProgrammes } from "../mockPartenaires";
import Modal from "./Modal";

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
    age = 28,
    sexe = 'M',
  } = victim;
  const [tab, setTab] = React.useState<'infos' | 'dossier' | 'progression' | 'reglages'>('infos');
  const [selectedFile, setSelectedFile] = React.useState<any | null>(null);
  const defaultFiles = [
    { id: 1, name: "rapport-medical.pdf", label: "Rapport médical" },
    { id: 2, name: "plainte.pdf", label: "Plainte officielle" },
    { id: 3, name: "photo-blessure.jpg", label: "Photo de la blessure" },
    { id: 4, name: "certificat-psy.pdf", label: "Certificat psychologique" },
  ];
  const [files, setFiles] = React.useState<any[]>(defaultFiles);
  const [editFileIdx, setEditFileIdx] = React.useState<number|null>(null);
  const [editFileLabel, setEditFileLabel] = React.useState('');
  const [editFileName, setEditFileName] = React.useState('');
  const [addFileMode, setAddFileMode] = React.useState(false);
  const [newFileLabel, setNewFileLabel] = React.useState('');
  const [newFileName, setNewFileName] = React.useState('');
  const tabs = [
    { key: 'infos', label: 'Infos', icon: <FiInfo className="mr-2" /> },
    { key: 'dossier', label: 'Dossier', icon: <FiFolder className="mr-2" /> },
    { key: 'progression', label: 'Progression', icon: <FiBarChart2 className="mr-2" /> },
    { key: 'reglages', label: 'Réglages', icon: <FiSettings className="mr-2" /> },
  ];
  return (
    <Modal title={"Details de la victime " + fullname || "Détail victime"} onClose={onClose}>

      <div className="flex flex-col md:flex-row gap-6">
        <img src={avatar} alt="avatar" className="w-24 h-24 rounded-full object-cover border-2 border-pink-200 mx-auto md:mx-0" />
        <div className="flex-1">
          <div className="flex gap-4 items-center mb-4">
            <h3 className="text-2xl font-bold text-gray-900">{fullname}</h3>
            <span className={`px-3 py-1 rounded text-sm font-semibold ${sexe === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>{sexe}</span>
            <span className="ml-auto text-base text-gray-400">{age} ans</span>
          </div>
          <div className="text-base text-gray-600 mb-2">{province}, {territoire}</div>
          <div className="text-sm text-gray-400 mb-4">{secteur} / {groupement} / {village}</div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
            <span><b>Adresse:</b> {adresse}</span>
            <span><b>Contact:</b> {contact}</span>
          </div>
          <div className="flex gap-2 text-sm mb-6">
            <span className={`px-3 py-1 rounded-full font-semibold ${status === 'Pris en charge' ? 'bg-green-100 text-green-700' : status === 'En attente' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{status}</span>
          </div>
          {/* Section Préjudices subis déplacée ici */}
          <div className="mb-6">

          </div>
          <hr className="my-4 border-gray-200 print:hidden" />
        </div>
      </div>
      <div className="mt-6">
        <div className="flex gap-2 border-b mb-4">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`flex items-center px-4 py-2 text-sm font-semibold border-b-2 transition-all ${tab === t.key ? 'border-pink-500 text-pink-600 bg-pink-50' : 'border-transparent text-gray-500 hover:text-pink-500'}`}
              onClick={() => setTab(t.key as any)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        {/* Tab content (à adapter selon besoins) */}
        {tab === 'infos' && (
          <div className="text-sm text-gray-700">
            <div className="mb-2"><b>Sexe :</b> {sexe}</div>
            <div className="mb-2"><b>Âge :</b> {age}</div>
            <div className="mb-2"><b>Status :</b> {status}</div>
            <div className="mb-2"><b>Province :</b> {province}</div>
            <div className="mb-2"><b>Territoire :</b> {territoire}</div>
            <div className="mb-2"><b>Secteur a :</b> {secteur}</div>
            <div className="mb-2"><b>Groupement :</b> {groupement}</div>
            <div className="mb-2"><b>Village :</b> {village}</div>
            <div className="mb-2"><b>Adresse :</b> {adresse}</div>
            <div className="mb-6"><b>Contact :</b> {contact}</div>
            {/* Préjudices subis stylés */}
            <div className="mb-6">
              <h4 className="text-base font-bold text-pink-700 mb-2 flex items-center"><FiInfo className="mr-2" /> Préjudices subis</h4>
              <div className="space-y-4">
                {((victim.prejudices && victim.prejudices.length > 0) ? victim.prejudices : [
                  {
                    id: 1,
                    label: 'Violences physiques',
                    isMain: true,
                    mesures: [
                      { id: 1, label: 'Prise en charge médicale' },
                      { id: 2, label: 'Soutien psychologique' },
                    ],
                    programme: { id: 1, label: 'Programme Femmes & Enfants' }
                  },
                  {
                    id: 2,
                    label: 'Déplacement forcé',
                    isMain: false,
                    mesures: [
                      { id: 3, label: 'Aide au relogement' },
                      { id: 4, label: 'Assistance alimentaire' },
                    ],
                    programme: { id: 2, label: 'Programme Réintégration Sociale' }
                  },
                  {
                    id: 3,
                    label: 'Pertes matérielles',
                    isMain: false,
                    mesures: [
                      { id: 5, label: 'Indemnisation financière' }
                    ],
                    programme: { id: 3, label: 'Programme Réparation Matérielle' }
                  }
                ]).map((prej: any, idx: number) => (
                  <div key={prej.id || idx} className="p-4 rounded-lg border bg-gray-50 flex flex-col md:flex-row md:items-center md:gap-6 shadow-sm print:border-black print:bg-white">
                    <div className="flex items-center gap-2 mb-2 md:mb-0">
                      <span className="font-semibold text-gray-800 text-base">{prej.label}</span>
                      {prej.isMain && <span className="ml-2 px-2 py-1 rounded bg-pink-100 text-pink-700 text-xs font-bold border border-pink-300 flex items-center"><span className="mr-1">★</span> Prépondérant</span>}
                    </div>
                    <div className="flex-1 flex flex-col md:flex-row md:items-center md:gap-4">
                      <span className="text-xs text-gray-500 md:w-1/3"><b>Programme :</b> {prej.programme?.label || '-'}</span>
                      <span className="text-xs text-gray-500 md:w-1/3"><b>Mesures de réparation :</b> {prej.mesures && prej.mesures.length > 0 ? prej.mesures.map((m: any) => m.label).join(', ') : '-'}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Espace commentaire */}
              <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200 flex items-start gap-2">
                <FiFileText className="mt-1 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500 mb-1 font-semibold">Commentaire :</div>
                  <div className="text-sm text-gray-700 italic">
                    {victim.comment || victim.commentaire || "Aucun commentaire pour cette victime."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {tab === 'dossier' && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Fichiers</h4>
            <ul className="text-sm">
              {files.map(file => (
                <li key={file.id} className="py-1 flex items-center gap-2">
                  <span className="text-gray-500">{file.label}</span>
                  <span className="text-gray-400 text-xs">({file.name})</span>
                  <button
                    className="ml-auto px-2 py-1 rounded bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100"
                    onClick={() => setSelectedFile(file)}
                  >Voir</button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {tab === 'progression' && (
          <div className="text-sm text-gray-700">Progression du dossier (à implémenter)</div>
        )}
        {tab === 'reglages' && (
  <div>
    <h4 className="font-semibold text-gray-700 mb-2">Gestion du dossier</h4>
    <ul className="text-sm mb-4">
      {files.map((file, idx) => (
        <li key={file.id} className="py-1 flex items-center gap-2">
          {editFileIdx === idx ? (
            <>
              <input
                className="border px-2 py-1 rounded text-xs mr-2"
                value={editFileLabel}
                onChange={e => setEditFileLabel(e.target.value)}
                placeholder="Label"
              />
              <input
                className="border px-2 py-1 rounded text-xs mr-2"
                value={editFileName}
                onChange={e => setEditFileName(e.target.value)}
                placeholder="Nom du fichier"
              />
              <button
                className="px-2 py-1 bg-green-500 text-white text-xs rounded mr-1 flex items-center gap-1"
                onClick={() => {
                  const updated = [...files];
                  updated[idx] = { ...file, label: editFileLabel, name: editFileName };
                  setFiles(updated);
                  setEditFileIdx(null);
                }}
              ><FiCheck /> Valider</button>
              <button
                className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded flex items-center gap-1"
                onClick={() => setEditFileIdx(null)}
              ><FiX /> Annuler</button>
            </>
          ) : (
            <>
              <span className="text-gray-500">{file.label}</span>
              <span className="text-gray-400 text-xs">({file.name})</span>
              <button
                className="ml-2 px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded hover:bg-blue-100 flex items-center gap-1"
                onClick={() => {
                  setEditFileIdx(idx);
                  setEditFileLabel(file.label);
                  setEditFileName(file.name);
                }}
              ><FiEdit /> Modifier</button>
              <button
                className="ml-1 px-2 py-1 bg-red-50 text-red-600 text-xs rounded hover:bg-red-100 flex items-center gap-1"
                onClick={() => {
                  if (window.confirm('Supprimer ce fichier ?')) {
                    setFiles(files.filter((_, i) => i !== idx));
                  }
                }}
              ><FiTrash /> Supprimer</button>
            </>
          )}
        </li>
      ))}
    </ul>
    {addFileMode ? (
      <div className="mb-2 flex items-center gap-2">
        <input
          className="border px-2 py-1 rounded text-xs"
          value={newFileLabel}
          onChange={e => setNewFileLabel(e.target.value)}
          placeholder="Label du fichier"
        />
        <input
          className="border px-2 py-1 rounded text-xs"
          value={newFileName}
          onChange={e => setNewFileName(e.target.value)}
          placeholder="Nom du fichier"
        />
        <button
          className="px-2 py-1 bg-green-500 text-white text-xs rounded flex items-center gap-1"
          onClick={() => {
            if (newFileLabel && newFileName) {
              setFiles([
                ...files,
                { id: Math.random(), label: newFileLabel, name: newFileName }
              ]);
              setNewFileLabel('');
              setNewFileName('');
              setAddFileMode(false);
            }
          }}
        ><FiPlus /> Ajouter</button>
        <button
          className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded flex items-center gap-1"
          onClick={() => setAddFileMode(false)}
        ><FiX /> Annuler</button>
      </div>
    ) : (
      <button
        className="px-3 py-1 bg-pink-600 text-white text-xs rounded font-semibold hover:bg-pink-700 flex items-center gap-1"
        onClick={() => setAddFileMode(true)}
      ><FiPlus /> Ajouter un fichier</button>
    )}
  </div>
)}
      </div>
      {/* Aperçu fichier (dossier) */}
      {selectedFile && (
        <Modal title={selectedFile.label} onClose={() => setSelectedFile(null)}>
          <div className="text-center text-gray-700">Aperçu du fichier : <b>{selectedFile.name}</b></div>
        </Modal>
      )}
    </Modal>
  );
};

export default VictimDetailModal;
