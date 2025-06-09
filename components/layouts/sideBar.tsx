"use client"
import React from 'react';
import { FiGrid, FiBox, FiUsers, FiRepeat, FiSettings } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', icon: <FiGrid size={22} />, href: '/' },
  { label: 'Apps', icon: <FiBox size={22} />, href: '/apps' },
  { label: 'Clients', icon: <FiUsers size={22} />, href: '/clients' },
  { label: 'Souscriptions', icon: <FiRepeat size={22} />, href: '/souscriptions' },
];

const SideBar = () => {
  const pathname = usePathname();
  return (
    <aside className="h-screen w-64 bg-white/95 border-r border-gray-100 flex flex-col justify-between shadow-xl px-4 py-6 fixed top-0 left-0 z-30">
      {/* Logo en haut */}
      <div>
        <Link href="/" className="flex items-center gap-3 mb-10 px-2">
          <Image src="/mazaya-logo.svg" alt="Mazaya Logo" width={38} height={38} className="rounded-xl shadow-md" />
          <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-500 to-pink-500 bg-clip-text text-transparent tracking-tight">Mazaya</span>
        </Link>
        <nav className="flex flex-col gap-2">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                href={item.href}
                key={item.label}
                className={
  'flex items-center gap-3 px-4 py-3 rounded-lg font-medium group ' +
  (isActive
    ? 'bg-gradient-to-r from-blue-100 via-pink-100 to-purple-100 text-pink-600 font-bold shadow-md'
    : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-pink-50')
}
              >
                <span className={isActive ? 'text-blue-500' : 'text-pink-500 group-hover:text-blue-500 transition'}>{item.icon}</span>
                <span>{item.label}</span>
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