"use client"
import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiLogOut, FiMail, FiBell, FiSettings, FiUser, FiShield, FiClock, FiDownload } from 'react-icons/fi';
import Image from 'next/image';

const LOGOUT_URL = process.env.NEXT_PUBLIC_LOGOUT_URL || 'http://10.140.0.106:4201/login';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const user = {
  name: 'Mardox',
  email: 'mardox@justice.gov.cd',
  avatar: '/avatar.jpg',
  role: 'Administrateur Système',
  department: 'FONAREV OPERATIONAL'
};

const Header = () => {
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fermer les menus si clic en dehors
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Gérer le prompt d'installation PWA
  useEffect(() => {
    // Vérifier si l'app est déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setShowInstallButton(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] Installation acceptée');
    }

    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const notifications = [
    { id: 1, title: 'Nouvelle victime enregistrée', time: '5 min', type: 'info' },
    { id: 2, title: 'Rapport mensuel disponible', time: '1h', type: 'success' },
    { id: 3, title: 'Maintenance programmée', time: '2h', type: 'warning' }
  ];

  const currentTime = new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <header className="h-20 bg-white/98 backdrop-blur-md shadow-sm border-b border-gray-200/80 flex items-center justify-between px-8 fixed top-0 left-64 right-0 z-20">
      {/* Section gauche - Informations système */}
      <div className="flex items-center gap-6">
        {/* Logo République */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
            <FiShield className="text-white text-lg" />
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-bold text-gray-800 tracking-wide">FONAREV OPERATIONAL</div>
            <div className="text-xs text-primary-600 font-medium">Système de Suivi des Victimes</div>
          </div>
        </div>

        {/* Séparateur */}
        <div className="hidden lg:block w-px h-8 bg-gray-300"></div>

        {/* Informations de session */}
        <div className="hidden lg:flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <FiClock className="text-primary-500" size={16} />
            <span className="font-mono">{currentTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600 text-xs font-medium">Système opérationnel</span>
          </div>
        </div>
      </div>

      {/* Section droite - Actions utilisateur */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors group"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <FiBell className="text-gray-600 group-hover:text-primary-600 transition-colors" size={20} />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {notifications.length}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-fadeInUp">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Notifications</h3>
                <p className="text-xs text-gray-500">{notifications.length} nouvelles notifications</p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map(notif => (
                  <div key={notif.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${notif.type === 'info' ? 'bg-blue-500' :
                        notif.type === 'success' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                        <p className="text-xs text-gray-500 mt-1">Il y a {notif.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-gray-100">
                <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                  Voir toutes les notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bouton d'installation PWA */}
        {showInstallButton && (
          <button 
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-white font-medium transition-all hover:shadow-md"
            style={{ backgroundColor: '#901c67' }}
            title="Installer l'application"
          >
            <FiDownload size={18} />
            <span className="hidden lg:inline text-sm">Installer</span>
          </button>
        )}

        {/* Paramètres rapides */}
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors group">
          <FiSettings className="text-gray-600 group-hover:text-primary-600 transition-colors" size={20} />
        </button>

        {/* Séparateur */}
        <div className="w-px h-8 bg-gray-300"></div>

        {/* Profil utilisateur */}
        <div className="relative" ref={menuRef}>
          <button
            className="flex items-center gap-3 px-4 py-2 rounded-full hover:bg-gray-50 transition-all group border border-transparent hover:border-gray-200"
            onClick={() => setOpen(!open)}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-200 group-hover:border-primary-300 transition-colors">
                <Image
                  src={user.avatar}
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="rounded-full object-cover w-full h-full"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>

            <div className="hidden md:block text-left">
              <div className="text-sm font-semibold text-gray-800">{user.name}</div>
              <div className="text-xs text-gray-500">{user.role}</div>
            </div>

            <FiChevronDown className={`text-gray-400 group-hover:text-primary-600 transition-all duration-200 ${open ? 'rotate-180' : ''}`} size={16} />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-3 z-50 animate-fadeInUp">
              {/* En-tête profil */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-200">
                    <Image
                      src={user.avatar}
                      alt="Avatar"
                      width={48}
                      height={48}
                      className="rounded-full object-cover w-full h-full"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-800">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.role}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <FiMail size={12} />
                      {user.email}
                    </div>
                  </div>
                </div>
              </div>


              {/* Actions */}
              <div className="pointer">


                <button
                  className="flex items-center gap-3 w-full text-left px-6 py-3 text-red-600 hover:bg-red-50 font-medium transition-colors bg-red-100"
                  onClick={() => {
                    window.location.href = LOGOUT_URL;
                  }}
                >
                  <FiLogOut size={18} />
                  Se déconnecter
                </button>
              </div>

              {/* Pied de page */}
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
                <div className="text-xs text-gray-500 text-center">
                  Version 2.1.0 • Build 2025.01.27
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;