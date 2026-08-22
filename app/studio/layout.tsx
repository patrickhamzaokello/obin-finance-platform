import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { isPlatformOwner, getCurrentMembership, getCurrentSchool } from '@/lib/school-context';
import { StudioNav } from '@/components/studio-nav';

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const [session, isOwner, membership, school] = await Promise.all([
    auth.api.getSession({ headers: h }),
    isPlatformOwner(),
    getCurrentMembership(),
    getCurrentSchool(),
  ]);

  const isAdmin = isOwner || membership?.role === 'school_admin';
  if (!session?.user || !isAdmin) redirect('/sign-in');

  const role = isOwner ? 'Platform Owner' : 'Creator';

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <StudioNav
        schoolName={school?.name ?? 'Studio'}
        userName={session.user.name ?? ''}
        userEmail={session.user.email ?? ''}
        role={role}
      />
      <main>{children}</main>
    </div>
  );
}
