import { notFound } from 'next/navigation';
import PecmuNewCarePage from '../../../PecmuNewCarePage';

export default async function Page({ params }: { params: Promise<{ ficheId: string; mode: string }> }) {
  const { ficheId, mode } = await params;
  if (!/^[1-9]\d*$/.test(ficheId) || !Number.isSafeInteger(Number(ficheId))) notFound();
  if (mode !== 'nouveau' && mode !== 'transfert' && mode !== 'readmission') notFound();
  return <PecmuNewCarePage key={`${ficheId}-${mode}`} ficheId={Number(ficheId)} mode={mode} />;
}
