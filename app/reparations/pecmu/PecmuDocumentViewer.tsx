'use client';

import React, { useEffect, useState } from 'react';
import { Modal, ModalBody } from 'flowbite-react';
import { ExternalLink, X } from 'lucide-react';
import { getCertificationFileUrl, getPecmuDocumentUrl } from '../services/pecmuWorkflowApi';
import type { PecmuFetcher } from '../services/pecmuApi';

export type DocumentPreview = { path: string; reference?: string; name: string; mimeType?: string };
export default function PecmuDocumentViewer({ document, fetcher, onClose }: { document: DocumentPreview; fetcher: PecmuFetcher; onClose: () => void }) {
  const [preview, setPreview] = useState<{ url: string; mime: string } | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setPreview(null); setExternalUrl('');
    void (async () => {
      const url = document.reference ? await getCertificationFileUrl(fetcher, document.reference) : await getPecmuDocumentUrl(fetcher, document.path);
      if (!active) return;
      setExternalUrl(url);
      const filename = new URL(url).pathname;
      const imageMime = ['image/png', 'image/jpeg', 'image/webp'].includes(document.mimeType || '')
        ? document.mimeType!
        : /\.png$/i.test(document.name) || /\.png$/i.test(filename) ? 'image/png'
          : /\.jpe?g$/i.test(document.name) || /\.jpe?g$/i.test(filename) ? 'image/jpeg'
            : /\.webp$/i.test(document.name) || /\.webp$/i.test(filename) ? 'image/webp' : '';
      // Same display flow as the victim dossier: the resolved URL goes directly
      // into an image or iframe, without fetching the storage file as a blob.
      setPreview({ url, mime: imageMime || 'application/pdf' });
    })().catch(e => { if (active) setError(e.message || 'Aperçu indisponible.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [document, fetcher, attempt]);
  return <Modal show size="7xl" onClose={onClose} className="!z-[150] !h-dvh !bg-slate-950/70" aria-label={`Visualiser ${document.name}`}><ModalBody className="!p-0">
    <div className="flex items-center justify-between gap-4 border-b bg-white p-4 text-slate-900"><h2 className="break-all font-semibold">{document.name}</h2><button onClick={onClose} aria-label="Fermer l’aperçu" className="p-2"><X /></button></div>
    <div className="flex h-[75vh] flex-col items-center justify-center bg-slate-100 p-4 text-slate-700">
      {loading && <p role="status">Chargement de l’aperçu…</p>}
      {error && <div role="alert" className="space-y-4 text-center"><p>{error}</p><button onClick={() => setAttempt(value => value + 1)} className="border border-primary px-4 py-2 text-primary">Réessayer</button></div>}
      {preview && !error && (preview.mime === 'application/pdf' ? <iframe title={document.name} src={preview.url} className="h-full w-full border-0 bg-white" /> : <img src={preview.url} alt={document.name} onError={() => setError('Impossible de charger l’image. Réessayez ou ouvrez le document dans un nouvel onglet.')} className="max-h-full max-w-full object-contain" />)}
    </div>
    {externalUrl && <div className="border-t bg-white p-3 text-right"><a href={externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><ExternalLink size={16} />Ouvrir dans un nouvel onglet</a></div>}
  </ModalBody></Modal>;
}
