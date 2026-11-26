import { notFound, redirect } from 'next/navigation';

export default async function Page({ params }: { params: Promise<{ ficheId: string; mode: string }> }) {
  const { ficheId, mode } = await params;
  if (!/^[1-9]\d*$/.test(ficheId) || !Number.isSafeInteger(Number(ficheId))) notFound();
  if (mode !== 'nouveau' && mode !== 'transfert' && mode !== 'readmission') notFound();
  const tab = mode === 'readmission' ? 'readmission' : 'care';
  redirect(`/reparations/pecmu?dossier=${ficheId}&etape=${tab}&soins=${mode}`);
}
