'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FiSmartphone } from 'react-icons/fi';

const FloatingOrientationButton: React.FC = () => {
  const [isLandscape, setIsLandscape] = useState(false);
  const [requestedFullscreen, setRequestedFullscreen] = useState(false);

  const canLock = useMemo(() => {
    const orientationApi = (screen as any)?.orientation;
    return Boolean(orientationApi?.lock);
  }, []);

  useEffect(() => {
    const mql = window.matchMedia?.('(orientation: landscape)');
    const update = () => {
      if (mql) setIsLandscape(mql.matches);
    };

    update();

    if (!mql) return;

    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', update);
      return () => mql.removeEventListener('change', update);
    }

    mql.addListener(update);
    return () => mql.removeListener(update);
  }, []);

  const toggleLandscape = async () => {
    const orientationApi = (screen as any)?.orientation;

    if (!orientationApi?.lock) {
      alert("La rotation n'est pas supportée sur cet appareil/navigateur.");
      return;
    }

    if (isLandscape) {
      try {
        if (orientationApi?.unlock) orientationApi.unlock();
      } catch { }

      try {
        if (requestedFullscreen && document.fullscreenElement) {
          await document.exitFullscreen();
        }
      } catch { }

      setRequestedFullscreen(false);
      return;
    }

    try {
      if (!document.fullscreenElement && document.documentElement?.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setRequestedFullscreen(true);
      }

      await orientationApi.lock('landscape');
    } catch {
      try {
        if (requestedFullscreen && document.fullscreenElement) {
          await document.exitFullscreen();
        }
      } catch { }

      setRequestedFullscreen(false);
      alert("Impossible d'activer le mode paysage (autorisation requise ou non supporté).");
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[9998]">
      <button
        onClick={toggleLandscape}
        disabled={!canLock}
        className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg border bg-white text-gray-800 transition-transform ${canLock ? 'hover:scale-105' : 'opacity-50 cursor-not-allowed'}`}
        title={isLandscape ? 'Revenir en portrait' : 'Passer en paysage'}
        aria-label={isLandscape ? 'Revenir en portrait' : 'Passer en paysage'}
      >
        <FiSmartphone
          size={18}
          className={`${isLandscape ? 'rotate-90' : 'rotate-0'} transition-transform duration-300 animate-bounce`}
        />
      </button>
    </div>
  );
};

export default FloatingOrientationButton;
