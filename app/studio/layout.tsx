import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getCurrentMembership, getCurrentSchool } from '@/lib/school-context';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { StudioNav } from '@/components/studio-nav';

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  // Call getSession once, then fan out the rest in parallel
  const session = await auth.api.getSession({ headers: h });
  if (!session?.user) redirect('/sign-in');

  const [membership, school, userRows] = await Promise.all([
    getCurrentMembership(),
    getCurrentSchool(),
    db.select({ platformRole: user.platformRole }).from(user).where(eq(user.id, session.user.id)).limit(1),
  ]);

  const isOwner = userRows[0]?.platformRole === 'owner';
  const isAdmin = isOwner || membership?.role === 'school_admin';
  if (!isAdmin) redirect('/sign-in');

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
