import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { isPlatformOwner, getCurrentMembership } from '@/lib/school-context';

/**
 * Smart root: route each user type to the right home.
 * Unauthenticated → /platform (marketing/creator landing)
 * Platform owner  → /admin
 * Creator         → /studio
 * Learner         → /learn/dashboard
 */
export default async function RootPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect('/platform');

  const [isOwner, membership] = await Promise.all([
    isPlatformOwner(),
    getCurrentMembership(),
  ]);

  if (isOwner) redirect('/admin');
  if (membership?.role === 'school_admin') redirect('/studio');
  redirect('/learn/dashboard');
}
