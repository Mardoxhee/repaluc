import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { FiUsers, FiLayers, FiGrid, FiAward } from 'react-icons/fi';
import { GiInjustice } from "react-icons/gi";
import { FaHospitalSymbol } from "react-icons/fa";
import { BsFillHousesFill } from "react-icons/bs";
import { FaHouseUser } from "react-icons/fa";
import { FaUserCheck } from "react-icons/fa";

// Ces mocks doivent être passés en props ou importés selon l'usage réel
// Ici on met des exemples pour la démo
const victims = [
  { id: 1, fullname: "Alice Moke", age: 24, sexe: "F", programme: 1, prejudices: [1, 2], categorie: 2, letter: "A", province: "Kinshasa", priseEnCharge: true },
  { id: 2, fullname: "Benoît Kamba", age: 42, sexe: "M", programme: 2, prejudices: [3], categorie: 1, letter: "B", province: "Kasaï", priseEnCharge: false },
  { id: 3, fullname: "Clara Moke", age: 17, sexe: "F", programme: 1, prejudices: [2, 5], categorie: 1, letter: "C", province: "Kinshasa", priseEnCharge: true },
];
const mockCategories = [
  { id: 1, nom: "Femme" },
  { id: 2, nom: "Homme" },
];
const mockProgrammes = [
  { id: 1, nom: "Programme A" },
  { id: 2, nom: "Programme B" },
];
const mockPrejudices = [
  { id: 1, nom: "Violences" },
  { id: 2, nom: "Spoliation" },
  { id: 3, nom: "Discrimination" },
  { id: 5, nom: "Autre" },
];

const COLORS = ["#f472b6", "#a78bfa", "#fbbf24", "#34d399", "#60a5fa", "#f87171", "#6366f1", "#f59e42", "#10b981"];

function statBy(key: string, items: any[], labelSource: any[] = []) {
  const map = new Map();
  items.forEach(v => {
    let k = v[key];
    if (Array.isArray(k)) {
      k.forEach(sub => map.set(sub, (map.get(sub) || 0) + 1));
    } else {
      map.set(k, (map.get(k) || 0) + 1);
    }
  });
  return Array.from(map.entries()).map(([id, count], i) => ({
    name: labelSource.find(l => l.id === id)?.nom || id,
    value: count,
    id,
    color: COLORS[i % COLORS.length],
  }));
}

const DashboardVictims = () => {
  // Stats
  const totalVictims = victims.length;
  const victimsByCat = statBy('categorie', victims, mockCategories);;
  const victimsByProg = statBy('programme', victims, mockProgrammes);
  const victimsByPrej = statBy('prejudices', victims, mockPrejudices);
  const victimsByProvince = statBy('province', victims);
  const totalPrisEnCharge = victims.filter(v => v.priseEnCharge).length;

  // Pour la courbe, on simule une évolution mensuelle (exemple)
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
  const curveData = months.map((m, i) => ({
    month: m,
    victimes: Math.floor(2 + Math.random() * 5),
  }));

  return (
    <div className="w-full px-6 py-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Tableau de bord des victimes</h2>
      {/* Cartes stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center justify-center border border-gray-100">
          <FiUsers className="text-pink-400 text-3xl mb-2" />
          <span className="text-3xl font-bold text-gray-900">{totalVictims}</span>
          <span className="text-xs text-gray-500 mt-1">Total victimes enregistrées</span>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center justify-center border border-gray-100">
          <FaHouseUser className="text-purple-400 text-3xl mb-2" />
          <span className="text-3xl font-bold text-gray-900">{victimsByCat.reduce((a, b) => a + b.value, 0)}</span>
          <span className="text-xs text-gray-500 mt-1 text-center">Victimes des ménages ordinaires</span>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center justify-center border border-gray-100">
          <BsFillHousesFill className="text-blue-400 text-3xl mb-2" />
          <span className="text-3xl font-bold text-gray-900">{victimsByProg.reduce((a, b) => a + b.value, 0)}</span>
          <span className="text-xs text-gray-500 mt-1 text-center">Victimes des menages collectifs</span>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center justify-center border border-gray-100">
          <GiInjustice className="text-yellow-400 text-3xl mb-2" />
          <span className="text-3xl font-bold text-gray-900">{victimsByPrej.reduce((a, b) => a + b.value, 0)}</span>
          <span className="text-xs text-gray-500 mt-1 text-center">Victimes detenant les décisions de justice</span>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center justify-center border border-gray-100">

          <FaHospitalSymbol className="text-red-600 text-3xl mb-2" />

          <span className="text-3xl font-bold text-gray-900">{totalPrisEnCharge}</span>
          <span className="text-xs text-gray-500 mt-1 text-center">Victimes en situation d'urgence medicale</span>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center justify-center border border-gray-100">
          <span className="inline-block bg-green-100 text-green-700 rounded-full px-2 py-1 text-xl mb-2"><FaUserCheck className="text-green-700" /></span>
          <span className="text-3xl font-bold text-gray-900">{totalPrisEnCharge}</span>
          <span className="text-xs text-gray-500 mt-1 text-center">Victimes confirmées</span>
        </div>
      </div>
      {/* Graphiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">Répartition par catégorie</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={victimsByCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label>
                {victimsByCat.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">Victimes par programme</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={victimsByProg}>
              <XAxis dataKey="name" stroke="#888" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#a78bfa">
                {victimsByProg.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Courbe comparative */}
      <div className="bg-white rounded-2xl shadow p-6 border border-gray-100 mb-8">
        <h3 className="font-semibold text-gray-700 mb-4">Évolution mensuelle (exemple)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={curveData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" stroke="#888" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="victimes" stroke="#f472b6" strokeWidth={3} dot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Badges victimes par préjudice */}
      <div className="bg-white rounded-2xl shadow p-4 border border-gray-100 mb-8">
        <h3 className="font-semibold text-gray-700 mb-4">Victimes par préjudice</h3>
        <div className="flex flex-wrap gap-2">
          {victimsByPrej.map(pj => (
            <div key={pj.id} className="flex items-center gap-2 bg-pink-50 border border-pink-200 rounded-full px-4 py-1 text-sm font-semibold text-pink-700">
              <span>{pj.name}</span>
              <span className="bg-pink-200 text-pink-800 rounded-full px-2 py-0.5 text-xs font-bold">{pj.value}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Victimes par province */}
      <div className="bg-white rounded-2xl shadow p-4 border border-gray-100 mb-8">
        <h3 className="font-semibold text-gray-700 mb-4">Victimes par province</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={victimsByProvince} layout="vertical" margin={{ left: 20, right: 20 }}>
            <XAxis type="number" allowDecimals={false} hide />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 13, fill: '#555' }} />
            <Tooltip />
            <Bar dataKey="value" radius={[0, 12, 12, 0]} fill="#60a5fa">
              {victimsByProvince.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardVictims;