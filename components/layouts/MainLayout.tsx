'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hasLocalSession } from '@/app/utils/authSession';
import SideBar from './sideBar';
import Header from './header';
import HamburgerMenu from '../HamburgerMenu';

interface MainLayoutProps {
  children: React.ReactNode;
  noZoom?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, noZoom }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [session, setSession] = useState<'checking' | 'ready' | 'unavailable'>('checking');
  const router = useRouter();

  // Vérifier si on est sur mobile au chargement et au redimensionnement
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Vérifier au chargement
    checkIfMobile();

    // Écouter les changements de taille d'écran
    window.addEventListener('resize', checkIfMobile);

    // Nettoyer l'écouteur d'événement
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    try {
      if (hasLocalSession(window.localStorage)) setSession('ready');
      else router.replace('/login');
    } catch {
      setSession('unavailable');
    }
  }, [router]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  if (session === 'unavailable') return <main className="p-6" role="alert">
    <p>Le navigateur ne permet pas de lire la session sur cet appareil.</p>
    <button type="button" className="mt-3 text-primary underline" onClick={() => window.location.reload()}>Réessayer</button>
  </main>;
  if (session !== 'ready') return null;

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Sidebar avec menu hamburger sur mobile */}
      {isMobile ? (
        <HamburgerMenu isOpen={isMenuOpen} toggleMenu={toggleMenu}>
          <SideBar onNavigate={() => setIsMenuOpen(false)} />
        </HamburgerMenu>
      ) : (
        <div className="hidden md:block">
          <SideBar />
        </div>
      )}

      <div className={`flex-1 min-w-0 ${!isMobile ? 'md:pl-64' : ''} transition-all duration-300 overflow-x-hidden`}>
        <Header onMenuToggle={toggleMenu} isMobile={isMobile} />
        <main className={`${noZoom ? '' : 'pt-24'} transition-all duration-300 w-full min-w-0 overflow-x-hidden`}>
          <div className={noZoom ? 'w-full min-w-0 overflow-x-hidden' : 'zoom-90'}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
