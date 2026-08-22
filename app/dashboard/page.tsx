import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { isPlatformOwner, getCurrentMembership } from '@/lib/school-context';

/**
 * Role-based router:
 *   Platform owner  → /admin
 *   Creator         → /studio
 *   Learner / guest → /learn/dashboard
 */
export default async function DashboardRouter() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/sign-in');

  const [isOwner, membership] = await Promise.all([
    isPlatformOwner(),
    getCurrentMembership(),
  ]);

  if (isOwner) redirect('/admin');
  if (membership?.role === 'school_admin') redirect('/studio');
  redirect('/learn/dashboard');
}
