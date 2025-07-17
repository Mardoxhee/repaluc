import React from "react";

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

import { useEffect } from "react";

const Modal: React.FC<ModalProps> = ({ title, children, onClose }) => {
  useEffect(() => {
    // Empêche tout scroll sur body et html
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.documentElement.style.overflow = "hidden";
    // Pour mobile, empêche le scroll tactile
    document.body.style.width = "100vw";
    document.body.style.top = `-${window.scrollY}px`;
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.width = "";
      // Remet le scroll à la position d'origine
      const scrollY = document.body.style.top;
      if (scrollY) window.scrollTo(0, -parseInt(scrollY || "0"));
      document.body.style.top = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm touch-none">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-[99vw] max-w-7xl relative border border-gray-100 animate-fadein my-6 md:my-24 mt-24">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-pink-500 text-xl font-bold"
          title="Fermer"
        >×</button>
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">{title}</h2>
        {children}
      </div>
    </div>
  );
};

export default Modal;
