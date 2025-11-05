'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, FileText, Eraser } from 'lucide-react';

interface Victim {
  id: number;
  nom?: string;
  prenom?: string;
  dateNaissance?: string;
  nationalite?: string;
  nomPere?: string;
  nomMere?: string;
  village?: string;
  groupement?: string;
  territoire?: string;
  secteur?: string;
  province?: string;
  typeViolation?: string;
  prejudicesSubis?: string;
  indemnisation?: number;
}

interface Tranche {
  id: string;
  periode: string;
  montant: string;
}

interface ContratVictimProps {
  victim: Victim;
}

const ContratVictim: React.FC<ContratVictimProps> = ({ victim }) => {
  const [tranches, setTranches] = useState<Tranche[]>([
    { id: '1', periode: 'Nov 2025', montant: '450' },
    { id: '2', periode: 'Janv 2026', montant: '450' },
    { id: '3', periode: 'Mars 2026', montant: '450' },
    { id: '4', periode: 'Mai 2026', montant: '450' },
    { id: '5', periode: 'Juil 2026', montant: '450' },
    { id: '6', periode: 'Sept 2026', montant: '450' },
    { id: '7', periode: 'Nov 2026', montant: '450' },
    { id: '8', periode: 'Déc 2026', montant: '590' }
  ]);

  const [consentements, setConsentements] = useState({
    faireMediateur: false,
    avocat: false,
    exerceDroit: false,
    comprisDroit: false,
    accepteReparation: false,
    refuseReparation: false,
    evaluationJointe: false,
    signataire: false
  });

  const [representant, setRepresentant] = useState({
    nom: '',
    qualite: '',
    organisation: '',
    pieceIdentite: ''
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1e40af'; // Bleu stylo
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.85; // Légère transparence pour effet stylo
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const addTranche = () => {
    const newId = (Math.max(...tranches.map(t => parseInt(t.id)), 0) + 1).toString();
    setTranches([...tranches, { id: newId, periode: '', montant: '' }]);
  };

  const removeTranche = (id: string) => {
    setTranches(tranches.filter(t => t.id !== id));
  };

  const updateTranche = (id: string, field: 'periode' | 'montant', value: string) => {
    setTranches(tranches.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const totalMontant = tranches.reduce((sum, t) => sum + (parseFloat(t.montant) || 0), 0);

  return (
    <div className="bg-white text-gray-900 max-w-5xl mx-auto p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <FileText className="text-white" size={32} />
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">
          Fonds national des réparations des victimes de violences sexuelles liées aux conflits
        </h1>
        <h2 className="text-lg font-bold text-gray-800 mb-1">
          et des victimes des crimes contre la paix et la sécurité de l'humanité
        </h2>
        <h3 className="text-base font-semibold text-gray-700 mt-4">
          FICHE DE CONSENTEMENT À RECEVOIR LES MESURES ADMINISTRATIVES
        </h3>
        <h3 className="text-base font-semibold text-gray-700">
          INDIVIDUELLES DE RÉPARATION
        </h3>
      </div>

      {/* Introduction */}
      <div className="mb-6 text-sm text-gray-700 leading-relaxed">
        <p>
          En vertu de la Loi n°22/065 du 26 décembre 2022 Loi fixant les principes fondamentaux
          relatifs à la protection et à la réparation des victimes de violences sexuelles liées aux
          conflits et des victimes des crimes contre la paix et la sécurité de l'humanité, du décret
          portant mesures d'application de la Loi n°22/06 du 26 décembre 2022 et dans le cadre
          de la stratégie opérationnelle de réparation, le FONAREV atteste que :
        </p>
      </div>

      {/* Informations personnelles */}
      <div className="mb-6">
        <div className="mb-3">
          <span className="font-semibold text-sm mr-2">Nom :</span>
          <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-96">{victim.nom || ''}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <span className="font-semibold text-sm mr-2">Date et lieu de naissance :</span>
            <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-64">{victim.dateNaissance || ''}</span>
          </div>
          <div>
            <span className="font-semibold text-sm mr-2">Pièce d'identité (type et numéro) :</span>
            <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-48"></span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <span className="font-semibold text-sm mr-2">Adresse ou territoire de résidence :</span>
            <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-48">{victim.territoire || ''}</span>
          </div>
          <div>
            <span className="font-semibold text-sm italic mr-2">Nationalité :</span>
            <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-48">{victim.nationalite || ''}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <span className="font-semibold text-sm italic mr-2">Nom du père :</span>
            <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-64">{victim.nomPere || ''}</span>
          </div>
          <div>
            <span className="font-semibold text-sm italic mr-2">Nom de la Mère :</span>
            <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-64">{victim.nomMere || ''}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-3">
          <div>
            <span className="font-semibold text-sm italic mr-2">Village :</span>
            <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-32">{victim.village || ''}</span>
          </div>
          <div>
            <span className="font-semibold text-sm italic mr-2">Groupement :</span>
            <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-32">{victim.groupement || ''}</span>
          </div>
          <div>
            <span className="font-semibold text-sm italic mr-2">Territoire :</span>
            <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-32">{victim.territoire || ''}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <span className="font-semibold text-sm italic mr-2">Secteur :</span>
            <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-64">{victim.secteur || ''}</span>
          </div>
          <div>
            <span className="font-semibold text-sm italic mr-2">Province :</span>
            <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-64">{victim.province || ''}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <span className="font-semibold text-sm mr-2">Type de violation :</span>
            <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-64">{victim.typeViolation || ''}</span>
          </div>
          <div>
            <span className="font-semibold text-sm mr-2">Type de préjudices :</span>
            <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-64">{victim.prejudicesSubis || ''}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <span className="font-semibold text-sm mr-2">Réparation administrative :</span>
            <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-48"></span>
          </div>
          <div>
            <span className="font-semibold text-sm mr-2">Réparation judiciaire :</span>
            <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-48"></span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <span className="font-semibold text-sm mr-2">Code bénéficiaire FONAREV :</span>
            <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-48"></span>
          </div>
          <div>
            <span className="font-semibold text-sm mr-2">Décision de justice (si détient une décision de justice exécutoire) :</span>
            <span className="text-sm border-b border-dotted border-gray-400 inline-block min-w-32"></span>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-sm">Ci-dessous « la victime »</p>
        </div>
      </div>

      {/* Section reconnaissance */}
      <div className="mb-6">
        <p className="font-bold text-sm mb-2">A été reconnue comme victime du préjudice suivant :</p>
        <p className="text-sm italic mb-4">Perte de vie</p>
        <p className="text-sm leading-relaxed mb-4">
          À ce titre, une indemnisation d'un montant de l'équivalent en Francs Congolais de
          4.320 USD (Quatre mille trois cent vingt dollars américains) vous est proposée, en tant
          que mesure de réparation administrative versée par le FONAREV, de manière forfaitaire
          et à titre symbolique en vue de contribuer au soulagement des préjudices subis.
        </p>

        <p className="font-bold text-sm mb-2">Droit à l'accompagnement</p>
        <p className="text-sm mb-2">La victime a été informée de son droit :</p>
        <div className="ml-6 space-y-2 text-sm">
          <div className="flex items-start">
            <span className="mr-2">☐</span>
            <span>À faire recours aux services du Médiateur ;</span>
          </div>
          <div className="flex items-start">
            <span className="mr-2">☐</span>
            <span>
              Et/ou à être accompagnée par un avocat (à ses propres frais) ou une
              organisation de défense des droits des victimes de son choix, y compris une
              organisation qui l'a déjà accompagnée dans son parcours.
            </span>
          </div>
        </div>

        <p className="text-sm mt-4 mb-2">Elle déclare :</p>
        <div className="ml-6 space-y-2 text-sm">
          <div className="flex items-start">
            <span className="mr-2">☐</span>
            <span>Avoir exercé ce droit avant de donner son consentement</span>
          </div>
          <div className="flex items-start">
            <span className="mr-2">☐</span>
            <span>Avoir compris ce droit, mais avoir choisi de ne pas y recourir</span>
          </div>
        </div>
      </div>

      {/* Section représentation */}
      <div className="mb-6">
        <p className="font-bold text-sm mb-3">Cas des personnes incapables de consentir seules</p>
        <p className="text-sm mb-4 leading-relaxed">
          Dans le cas où la victime est reconnue, sur la base d'un avis médical ou d'une évaluation
          psychosociale, comme étant incapable de comprendre ou de consentir de manière
          libre et éclairée à la présente mesure de réparation, le consentement peut être
          valablement donné par l'intermédiaire d'une représentante légale ou d'une
          représentante désignée, conformément au mécanisme ci-dessous :
        </p>

        <p className="font-bold text-sm italic mb-3">Représentation pour consentement</p>
        <div className="ml-6 space-y-2 text-sm mb-4">
          <div className="flex items-start">
            <span className="mr-2">☐</span>
            <span>La victime est en situation d'incapacité permanente ou temporaire à consentir seule.</span>
          </div>
          <div className="flex items-start">
            <span className="mr-2">☐</span>
            <span>Le consentement est donné en ses lieu et place par :</span>
          </div>
        </div>

        <div className="ml-12 space-y-3">
          <div className="flex items-start">
            <span className="mr-2">•</span>
            <div className="flex-1">
              <span className="font-semibold text-sm mr-2">Nom du/de la représentante :</span>
              <input
                type="text"
                value={representant.nom}
                onChange={(e) => setRepresentant({ ...representant, nom: e.target.value })}
                className="border-b border-dotted border-gray-400 outline-none text-sm w-96"
              />
            </div>
          </div>

          <div className="flex items-start">
            <span className="mr-2">•</span>
            <div className="flex-1">
              <span className="font-semibold text-sm mr-2">
                Qualité (parent, tuteur(rice) légale, curateur (rice), représentant(e) désigné(e) par l'organisation accompagnatrice, etc.) :
              </span>
              <input
                type="text"
                value={representant.qualite}
                onChange={(e) => setRepresentant({ ...representant, qualite: e.target.value })}
                className="border-b border-dotted border-gray-400 outline-none text-sm w-full mt-1"
              />
            </div>
          </div>

          <div className="flex items-start">
            <span className="mr-2">•</span>
            <div className="flex-1">
              <span className="font-semibold text-sm mr-2">Organisation accompagnatrice (le cas échéant) :</span>
              <input
                type="text"
                value={representant.organisation}
                onChange={(e) => setRepresentant({ ...representant, organisation: e.target.value })}
                className="border-b border-dotted border-gray-400 outline-none text-sm w-96"
              />
            </div>
          </div>

          <div className="flex items-start">
            <span className="mr-2">•</span>
            <div className="flex-1">
              <span className="font-semibold text-sm mr-2">Pièce d'identité du/de la représentant(e) (type et numéro) :</span>
              <input
                type="text"
                value={representant.pieceIdentite}
                onChange={(e) => setRepresentant({ ...representant, pieceIdentite: e.target.value })}
                className="border-b border-dotted border-gray-400 outline-none text-sm w-72"
              />
            </div>
          </div>
        </div>

        <p className="text-sm mt-4 leading-relaxed">
          Les modalités de versement de la somme ci-dessus s'effectuera en de de la manière suivante :
        </p>
      </div>

      {/* Section Tranches */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">Tranches</h3>
          <button
            onClick={addTranche}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Ajouter une tranche
          </button>
        </div>

        <p className="text-sm mb-2">Nombre : {tranches.length}</p>

        <div className="border border-gray-300 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="border-r border-gray-300 px-3 py-2 text-left font-semibold">Période</th>
                {tranches.map((tranche) => (
                  <th key={tranche.id} className="border-r border-gray-300 px-3 py-2 text-center font-semibold min-w-32">
                    <input
                      type="text"
                      value={tranche.periode}
                      onChange={(e) => updateTranche(tranche.id, 'periode', e.target.value)}
                      className="w-full text-center bg-transparent outline-none font-semibold"
                      placeholder="Période"
                    />
                  </th>
                ))}
                <th className="px-3 py-2 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="border-r border-gray-300 px-3 py-2 font-semibold">Somme (en USD)</td>
                {tranches.map((tranche) => (
                  <td key={tranche.id} className="border-r border-gray-300 px-3 py-2 text-center">
                    <input
                      type="number"
                      value={tranche.montant}
                      onChange={(e) => updateTranche(tranche.id, 'montant', e.target.value)}
                      className="w-full text-center bg-transparent outline-none"
                      placeholder="0"
                    />
                  </td>
                ))}
                <td className="px-3 py-2"></td>
              </tr>
              <tr>
                <td className="px-3 py-2"></td>
                {tranches.map((tranche) => (
                  <td key={tranche.id} className="px-3 py-2 text-center">
                    <button
                      onClick={() => removeTranche(tranche.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                ))}
                <td className="px-3 py-2 text-center font-semibold">Total: {totalMontant} USD</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section accompagnement */}
      <div className="mb-6 text-sm leading-relaxed">
        <p className="mb-3">
          La victime aura accès à un accompagnement psychologique et économique dans le
          cadre du programme, en lien avec des structures partenaires.
        </p>
        <p className="mb-3">
          Selon son cas, la victime pourra également accéder à d'autres mesures disponibles
          prévues par le programme (réinsertion socioéconomique, appui éducatif, soutien
          administratif, prise en charge médicale,).
        </p>
        <p className="mb-3">
          Ce programme de réparation est une mesure de justice, distincte de l'assistance
          humanitaire, qui vise à reconnaître et atténuer les préjudices subis, restaurer la dignité
          et rendre effectif le droit des victimes à réparation administrative tel que garanti par la loi.
        </p>
        <p className="mb-3">
          Afin de s'assurer que la somme reçue ait un effet réparateur, le versement se fera sur
          l'année et en tranches convenues avec la victime lors des entretiens de mise en œuvre.
          Aucun versement en faveur de la victime ci-haut désignée ne sera effectué en cash.
        </p>
        <p className="mb-3">
          La victime déclare avoir été informée de ses droits et des modalités de mise en œuvre
          de la mesure.
        </p>
        <p className="mb-3">
          Elle a pu poser toutes les questions souhaitées et a reçu des réponses complètes et
          compréhensibles.
        </p>
      </div>

      {/* Section consentements */}
      <div className="mb-6">
        <div className="space-y-3">
          <div className="flex items-start">
            <input
              type="checkbox"
              checked={consentements.accepteReparation}
              onChange={(e) => setConsentements({ ...consentements, accepteReparation: e.target.checked })}
              className="mt-1 mr-3"
            />
            <label className="text-sm">J'accepte de bénéficier des mesures de réparation administrative</label>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              checked={consentements.refuseReparation}
              onChange={(e) => setConsentements({ ...consentements, refuseReparation: e.target.checked })}
              className="mt-1 mr-3"
            />
            <label className="text-sm">Je ne souhaite pas bénéficier de cette mesure de réparation administrative</label>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              checked={consentements.evaluationJointe}
              onChange={(e) => setConsentements({ ...consentements, evaluationJointe: e.target.checked })}
              className="mt-1 mr-3"
            />
            <label className="text-sm">
              Une copie de l'évaluation médicale/psychosociale est jointe au présent
              formulaire ou procuration avec documents de la victime
            </label>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              checked={consentements.signataire}
              onChange={(e) => setConsentements({ ...consentements, signataire: e.target.checked })}
              className="mt-1 mr-3"
            />
            <label className="text-sm">
              Le signataire atteste avoir été informé des droits de la victime et s'engage à
              agir dans le seul intérêt de celle-ci et se soumettre de droit à tout contrôle légale
              prévu quant à ce.
            </label>
          </div>
        </div>
      </div>

      {/* Section signatures */}
      <div className="mt-8 grid grid-cols-2 gap-8">
        <div>
          <p className="text-sm mb-2">
            Fait à <span className="border-b border-dotted border-gray-400 inline-block w-32"></span>, le <span className="border-b border-dotted border-gray-400 inline-block w-32"></span>
          </p>
          <div className="mt-6">
            <p className="font-bold text-sm mb-2">Pour le FONAREV</p>
            <p className="text-sm">Nom : FATA MAKUNGA Patrick</p>
            <p className="text-sm">Fonction : Directeur Général</p>
            <p className="text-sm mt-4">Signature :</p>
            <div className="border-b border-gray-400 w-48 mt-8"></div>
          </div>
        </div>

        <div>
          <div className="mt-12">
            <p className="font-bold text-sm mb-2">Le/la bénéficiaire</p>
            <p className="text-sm mb-4">
              Nom : <span className="border-b border-dotted border-gray-400 inline-block w-48">{victim.nom || ''}</span>
            </p>
            <div className="mb-2">
              <p className="text-sm mb-2">Signature ou empreinte :</p>
              <p className="text-xs italic text-gray-600 mb-2">(précédée de la mention LU ET APPROUVÉ)</p>
              <div className="relative inline-block">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="border-2 border-gray-400 rounded cursor-crosshair bg-white"
                />
                <button
                  onClick={clearSignature}
                  className="absolute top-2 right-2 p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                  title="Effacer la signature"
                  type="button"
                >
                  <Eraser size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton de sauvegarde */}
      <div className="mt-8 flex justify-end gap-4">
        <button
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        >
          Annuler
        </button>
        <button
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Sauvegarder le contrat
        </button>
      </div>
    </div>
  );
};

export default ContratVictim;