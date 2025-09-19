"use client"
import React, { useState, useRef } from 'react';
import { FiChevronDown, FiLogOut, FiMail } from 'react-icons/fi';
import Image from 'next/image';

const user = {
  name: 'Mardox',
  email: 'mardox@email.com',
  avatar: '/avatar.jpg', // à remplacer par l'avatar réel
};

const Header = () => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu si clic en dehors
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="w-full h-20 bg-white/95 shadow-sm flex items-center justify-end px-8 fixed top-0 left-0 z-20 backdrop-blur-md border-b border-gray-200">
      <div className="relative" ref={menuRef}>
        <button
          className="flex items-center gap-3 px-4 py-2 rounded-full hover:bg-primary-50 transition group"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative w-11 h-11 rounded-full aspect-square overflow-hidden">
            <Image
              src={user.avatar}
              alt="Avatar"
              width={44}
              height={44}
              className="rounded-full object-cover w-full h-full"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
          </span>
          <span className="text-base font-semibold text-gray-800">Hi {user.name}</span>
          <FiChevronDown className="text-gray-400 group-hover:text-primary-600 transition" />
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-3 z-50 border border-gray-100 animate-fadeInUp">
            <div className="flex items-center gap-3 px-5 py-2">
              <span className="w-9 h-9 rounded-full aspect-square overflow-hidden">
                <Image src={user.avatar} alt="Avatar" width={36} height={36} className="rounded-full object-cover w-full h-full" />
              </span>
              <div>
                <div className="font-bold text-gray-800">{user.name}</div>
                <div className="flex items-center text-xs text-gray-500 gap-1"><FiMail />{user.email}</div>
              </div>
            </div>
            <hr className="my-2 border-gray-100" />
            <button
              className="flex items-center gap-2 w-full text-left px-5 py-2 text-secondary-600 hover:bg-secondary-50 font-medium transition"
              onClick={() => {
                window.location.href = 'http://10.140.0.106:4201/login';
              }}
            >
              <FiLogOut /> Se déconnecter
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;