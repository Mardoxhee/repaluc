'use client';

import React, { useState, useEffect } from 'react';
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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
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
      
      <div className={`flex-1 ${!isMobile ? 'md:ml-64' : ''} transition-all duration-300`}>
        <Header onMenuToggle={toggleMenu} isMobile={isMobile} />
        <main className={`${noZoom ? '' : 'zoom-90 pt-20'} transition-all duration-300`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
