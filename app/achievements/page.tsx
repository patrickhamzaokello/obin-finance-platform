import { getMyAchievements } from '@/app/actions/courses';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Award, ArrowLeft, GraduationCap } from 'lucide-react';

export default async function AchievementsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/sign-in');

  const result = await getMyAchievements();
  const certs  = result.success && result.data ? result.data : [];

  return (
    <div className='min-h-screen bg-[#F5F5F7]'>
      <header className='bg-white/80 backdrop-blur-xl border-b border-black/[0.06] sticky top-0 z-10'>
        <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-3'>
          <Link href='/dashboard' className='inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors'>
            <ArrowLeft size={14} /> Dashboard
          </Link>
        </div>
      </header>

      <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10'>
        {/* Header */}
        <div className='flex items-center gap-3 mb-8'>
          <div className='w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center'>
            <Award size={22} className='text-primary' />
          </div>
          <div>
            <h1 className='text-xl font-bold text-foreground'>Achievements</h1>
            <p className='text-sm text-muted-foreground mt-0.5'>
              {certs.length === 0 ? 'Complete a course to earn your first certificate' : `${certs.length} certificate${certs.length !== 1 ? 's' : ''} earned`}
            </p>
          </div>
        </div>

        {certs.length === 0 ? (
          <div className='bg-white rounded-2xl shadow-sm px-8 py-14 text-center'>
            <div className='w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4'>
              <GraduationCap size={28} className='text-primary' />
            </div>
            <h2 className='text-base font-semibold text-foreground mb-1'>No certificates yet</h2>
            <p className='text-sm text-muted-foreground mb-6 max-w-xs mx-auto'>
              Finish all modules in a course and a certificate will be issued automatically.
            </p>
            <Link href='/dashboard'
              className='inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors'>
              Browse courses
            </Link>
          </div>
        ) : (
          <div className='space-y-3'>
            {certs.map((cert) => (
              <Link
                key={cert.id}
                href={`/certificate/${cert.id}`}
                className='group flex items-center gap-5 bg-white rounded-2xl shadow-sm px-6 py-5 hover:shadow-md transition-all'
              >
                {/* Certificate icon */}
                <div className='w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors'>
                  <Award size={26} className='text-primary' />
                </div>

                {/* Info */}
                <div className='flex-1 min-w-0'>
                  <p className='text-base font-bold text-foreground truncate'>{cert.courseTitle}</p>
                  {cert.schoolName && (
                    <p className='text-xs text-muted-foreground mt-0.5'>{cert.schoolName}</p>
                  )}
                  <p className='text-xs text-muted-foreground mt-1'>
                    Issued {new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>

                {/* View arrow */}
                <div className='text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0'>
                  View →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
