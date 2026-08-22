'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { schoolMember } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { isPlatformOwner } from '@/lib/school-context';

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect('/');
}

/**
 * After sign-in, determine where to send the user:
 *  - Platform owner  → /admin
 *  - School admin    → /studio
 *  - Everyone else   → /learn/dashboard
 */
export async function getPostSignInRedirect(): Promise<{ redirect: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { redirect: '/sign-in' };

  const [isOwner, membership] = await Promise.all([
    isPlatformOwner(),
    db.select()
      .from(schoolMember)
      .where(and(eq(schoolMember.userId, session.user.id), eq(schoolMember.role, 'school_admin')))
      .limit(1),
  ]);

  if (isOwner)              return { redirect: '/admin' };
  if (membership.length > 0) return { redirect: '/studio' };
  return { redirect: '/learn/dashboard' };
}
