"use client";
import React from "react";
import { FiUsers, FiBox, FiRepeat, FiDollarSign, FiTrendingUp } from "react-icons/fi";

const stats = [
  {
    label: "Utilisateurs",
    value: 1240,
    icon: <FiUsers className="text-blue-500" size={28} />,
    change: "+4.2%",
    changeType: "up",
  },
  {
    label: "Applications",
    value: 32,
    icon: <FiBox className="text-purple-500" size={28} />,
    change: "+2",
    changeType: "up",
  },
  {
    label: "Souscriptions",
    value: 487,
    icon: <FiRepeat className="text-pink-500" size={28} />,
    change: "+1.5%",
    changeType: "up",
  },
  {
    label: "Revenus mensuels",
    value: 2450000,
    icon: <FiDollarSign className="text-green-500" size={28} />,
    change: "+8.1%",
    changeType: "up",
  },
  {
    label: "Revenus annuels",
    value: 28900000,
    icon: <FiTrendingUp className="text-emerald-500" size={28} />,
    change: "+12.7%",
    changeType: "up",
  },
];

export default function DashboardStats() {
  return (
    <section className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 w-full mb-10">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-start gap-3 border border-gray-50 hover:shadow-xl transition"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-50 via-pink-50 to-purple-50">
              {s.icon}
            </div>
            <span className="text-2xl font-extrabold text-gray-900">
              {typeof s.value === "number" && (s.label.includes('Revenus'))
  ? s.value.toLocaleString('fr-FR') + ' $'
  : typeof s.value === "number"
    ? s.value.toLocaleString('fr-FR')
    : s.value
}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {s.changeType === "up" ? (
              <span className="text-green-500 font-bold">{s.change}</span>
            ) : (
              <span className="text-red-500 font-bold">{s.change}</span>
            )}
            <span>{s.label}</span>
          </div>
        </div>
      ))}
    </section>
  );
}
