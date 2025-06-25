"use client"
import React from 'react';
import { FiGrid, FiBox, FiUsers, FiRepeat, FiSettings } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', icon: <FiGrid size={22} />, href: '/' },
  { label: 'LUC', icon: <FiBox size={22} />, href: '/luc' },
  { label: 'Réparations', icon: <FiRepeat size={22} />, href: '/reparations' },
  { label: 'Accès à la justice', icon: <FiUsers size={22} />, href: '/acces-justice' },
];

const SideBar = () => {
  const pathname = usePathname();
  return (
    <aside className="h-screen w-64 min-w-64 max-w-64 bg-white/95 border-r border-gray-100 flex flex-col justify-between shadow-xl px-4 py-6 fixed top-0 left-0 z-30">
      {/* Logo en haut */}
      <div>
        <div className="flex flex-col items-center justify-center mb-12 px-2">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 via-pink-400 to-purple-500 flex items-center justify-center shadow-lg border-6 border-white/90">
            <span className="text-white text-xl font-extrabold tracking-tight drop-shadow-lg select-none">LUC</span>
          </div>
          <div className="h-4" />
        </div>
        <nav className="flex flex-col gap-2 w-full">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                href={item.href}
                key={item.label}
                className={
                  'flex items-center gap-3 px-4 py-3 rounded-lg font-medium group w-full transition-colors duration-150 ' +
                  (isActive
                    ? 'bg-gradient-to-r from-blue-100 via-pink-100 to-purple-100 text-pink-600 shadow-md'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-pink-50')
                }
              >
                <span className={isActive ? 'text-blue-500' : 'text-pink-500 group-hover:text-blue-500 transition-colors'}>{item.icon}</span>
                <span className="truncate w-full">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      {/* Réglages en bas */}
      <div className="mb-2">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-pink-50 transition"
        >
          <span className="text-blue-400"><FiSettings size={22} /></span>
          <span>Réglages</span>
        </Link>
      </div>
    </aside>
  );
};

export default SideBar;