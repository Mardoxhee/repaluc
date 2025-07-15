import React from "react";

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-5xl relative border border-gray-100 animate-fadein">
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

export default Modal;
