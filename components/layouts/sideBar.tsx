"use client"

import React from 'react';
import { FiBarChart2, FiDatabase, FiSettings, FiShield, FiUsers } from 'react-icons/fi';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SideBarProps {
  onNavigate?: () => void;
}

const navItems = [
  {
    label: 'Dashboard',
    description: 'Indicateurs par mention',
    icon: <FiBarChart2 size={20} />,
    href: '/reparations/dashboard',
  },
  {
    label: 'Victimes',
    description: 'Registre et filtres',
    icon: <FiUsers size={20} />,
    href: '/reparations/victimes',
  },
  {
    label: 'Source de données',
    description: 'Import et historique',
    icon: <FiDatabase size={20} />,
    href: '/reparations/sources',
    developerOnly: true,
  },
];

const SideBar: React.FC<SideBarProps> = ({ onNavigate }) => {
  const pathname = usePathname();
  const [userFunction, setUserFunction] = React.useState('');

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('usr');
      const user = raw ? JSON.parse(raw) : null;
      const fonction = user?.fonction?.fonction || user?.fonction || '';
      setUserFunction(typeof fonction === 'string' ? fonction : '');
    } catch {
      setUserFunction('');
    }
  }, []);

  const normalizedFunction = userFunction
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
  const canSeeDeveloperMenus = normalizedFunction === 'developpeur';
  const visibleNavItems = navItems.filter((item) => !item.developerOnly || canSeeDeveloperMenus);

  const handleNavigation = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <aside className="h-screen w-64 min-w-64 max-w-64 bg-white border-r border-primary-100 flex flex-col shadow-[18px_0_45px_-38px_rgba(0,127,186,0.65)] fixed top-0 left-0 z-30">
      {/* En-tête institutionnel */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 px-5 py-4 h-20 flex items-center">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-white/12 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20">
            <FiShield className="text-white text-xl" />
          </div>
          <div>
            <div className="text-sm font-black tracking-wide text-white">FONOPS</div>
            <div className="text-[11px] font-semibold text-white/75">Réparations</div>
          </div>
        </div>
      </div>

      {/* Navigation principale */}
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="mb-3 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-primary-600">
          Modules
        </div>
        <nav className="space-y-2">
          {visibleNavItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            return (
              <Link
                href={item.href}
                key={item.label}
                onClick={handleNavigation}
                className={`
                  flex items-start gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 group relative
                  ${isActive
                    ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-100 shadow-sm'
                    : 'text-slate-700 hover:bg-primary-50/60 hover:text-primary-700'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-primary-500"></div>
                )}
                <span className={`
                  rounded-md p-2 -mt-1
                  transition-colors duration-200
                  ${isActive ? 'bg-white text-primary-600' : 'bg-slate-50 text-slate-500 group-hover:bg-white group-hover:text-primary-600'}
                `}>
                  {item.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-black">{item.label}</span>
                  <span className={`mt-0.5 block text-[11px] leading-snug ${isActive ? 'text-primary-700/75' : 'text-slate-500'}`}>
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Section inférieure */}
      <div className="border-t border-gray-200 p-4">
        {/* Informations système */}
        <div className="bg-primary-50/70 rounded-lg p-3 mb-4 border border-primary-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-primary-800">Système opérationnel</span>
          </div>
          <div className="text-xs text-primary-700/70">
            Version 2.1.0 • Dernière sync: 14:32
          </div>
        </div>

        {/* Lien réglages */}
        <Link
          href="/reglages"
          onClick={handleNavigation}
          className={`
            flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-all duration-200 group relative
            ${pathname === '/reglages'
              ? 'bg-primary-50 text-primary-700 shadow-sm'
              : 'text-slate-600 hover:bg-primary-50 hover:text-primary-600'
            }
          `}
        >
          {pathname === '/reglages' && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-r"></div>
          )}
          <FiSettings size={18} className={`transition-colors ${pathname === '/reglages' ? 'text-primary-600' : 'text-gray-500 group-hover:text-primary-500'
            }`} />
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
