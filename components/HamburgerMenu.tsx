'use client';

import { useEffect } from 'react';
import { Menu, X } from 'lucide-react';

interface HamburgerMenuProps {
  isOpen: boolean;
  toggleMenu: () => void;
  children: React.ReactNode;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ isOpen, toggleMenu, children }) => {
  // Empêcher le défilement du corps lorsque le menu est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  return (
    <div className="relative">
      {/* Bouton du menu hamburger */}
      <button 
        onClick={toggleMenu}
        className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 z-50 fixed top-4 right-4 bg-white shadow-md"
        aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay sombre */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleMenu}
        />
      )}

      {/* Menu latéral */}
      <div 
        className={`
          fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative md:w-auto
        `}
      >
        <div className="p-4 h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default HamburgerMenu;
