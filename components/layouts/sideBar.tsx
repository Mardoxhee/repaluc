"use client"
import React from 'react';
import { FiGrid, FiBox, FiUsers, FiRepeat, FiSettings, FiShield } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'LUC', icon: <FiBox size={20} />, href: '/luc' },
  { label: 'Réparations', icon: <FiRepeat size={20} />, href: '/reparations' },
  { label: 'Accès à la justice', icon: <FiUsers size={20} />, href: '/#' },
];

const SideBar = () => {
  const pathname = usePathname();

  return (
    <aside className="h-screen w-64 min-w-64 max-w-64 bg-white border-r border-gray-200 flex flex-col shadow-lg fixed top-0 left-0 z-30">
      {/* En-tête institutionnel */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 h-20 flex items-center justify-center">
        <div className="flex flex-col items-center text-center">
          {/* Logo institutionnel */}
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20 mb-2">
            <FiShield className="text-white text-xl" />
          </div>
          {/* <div className="text-white text-xs font-bold tracking-wide">SYSTÈME LUC</div> */}
        </div>
      </div>

      {/* Navigation principale */}
      <div className="flex-1 px-4 py-6">
        <nav className="space-y-2">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                href={item.href}
                key={item.label}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 group relative
                  ${isActive
                    ? 'bg-primary-50 text-primary-700 border-r-3 border-primary-500 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                  }
                `}
              >
                {/* Indicateur actif */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500"></div>
                )}

                <span className={`
                  transition-colors duration-200
                  ${isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-primary-500'}
                `}>
                  {item.icon}
                </span>

                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Section inférieure */}
      <div className="border-t border-gray-200 p-4">
        {/* Informations système */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-gray-700">Système opérationnel</span>
          </div>
          <div className="text-xs text-gray-500">
            Version 2.1.0 • Dernière sync: 14:32
          </div>
        </div>

        {/* Lien réglages */}
        <Link
          href="/#"
          className="flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-50 hover:text-primary-600 transition-all duration-200 group"
        >
          <FiSettings size={18} className="text-gray-500 group-hover:text-primary-500 transition-colors" />
          <span className="text-sm">Paramètres</span>
        </Link>
      </div>

      {/* Pied de page institutionnel */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-500 font-medium">
            République Démocratique du Congo
          </p>
          <p className="text-xs text-gray-400 mt-1">
            FONAREV RDC
          </p>
        </div>
      </div>
    </aside>
  );
};

export default SideBar;