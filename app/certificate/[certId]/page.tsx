import { getCertificate } from '@/app/actions/courses';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CertificateView } from './certificate-view';

export default async function CertificatePage({ params }: { params: Promise<{ certId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/sign-in');

  const { certId } = await params;
  const result = await getCertificate(certId);

  if (!result.success || !result.data) {
    return (
      <div className='min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4'>
        <div className='bg-white rounded-2xl shadow-sm p-10 max-w-md w-full text-center'>
          <h2 className='text-lg font-semibold text-foreground mb-2'>Certificate not found</h2>
          <p className='text-sm text-muted-foreground mb-6'>This certificate doesn&apos;t exist or doesn&apos;t belong to you.</p>
          <Link href='/achievements' className='inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors'>
            <ArrowLeft size={14} /> Achievements
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#F5F5F7]'>
      <header className='bg-white/80 backdrop-blur-xl border-b border-black/[0.06] print:hidden'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-3'>
          <Link href='/achievements' className='inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors'>
            <ArrowLeft size={14} /> Achievements
          </Link>
        </div>
      </header>
      <CertificateView cert={result.data} />
    </div>
  );
}
