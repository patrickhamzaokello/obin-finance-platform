import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { school, schoolMember, user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { cache } from 'react';

export type School = typeof school.$inferSelect;
export type SchoolMember = typeof schoolMember.$inferSelect;

/**
 * Get the current school for the logged-in creator.
 * Looks up the school via the session user's schoolMember record.
 * Returns null if the user is not logged in or has no school.
 */
export const getCurrentSchool = cache(async (): Promise<School | null> => {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session?.user) return null;

  // Two-step lookup to avoid table-reference shorthand ambiguity in Drizzle select
  const [member] = await db
    .select({ schoolId: schoolMember.schoolId })
    .from(schoolMember)
    .where(eq(schoolMember.userId, session.user.id))
    .limit(1);

  if (!member?.schoolId) return null;

  const [schoolRow] = await db
    .select()
    .from(school)
    .where(eq(school.id, member.schoolId))
    .limit(1);

  return schoolRow ?? null;
});

export async function requireSchool(): Promise<School> {
  const s = await getCurrentSchool();
  if (!s) throw new Error('No school context');
  return s;
}

export async function getCurrentMembership(): Promise<SchoolMember | null> {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session?.user) return null;

  const rows = await db
    .select()
    .from(schoolMember)
    .where(eq(schoolMember.userId, session.user.id))
    .limit(1);

  return rows[0] ?? null;
}

export async function isPlatformOwner(): Promise<boolean> {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session?.user) return false;
  const rows = await db.select({ platformRole: user.platformRole })
    .from(user).where(eq(user.id, session.user.id)).limit(1);
  return rows[0]?.platformRole === 'owner';
}

export async function requirePlatformOwner(): Promise<void> {
  if (!(await isPlatformOwner())) throw new Error('Unauthorized: platform owner only');
}

export async function requireSchoolAdmin(): Promise<SchoolMember> {
  const m = await getCurrentMembership();
  if (!m || m.role !== 'school_admin') throw new Error('Unauthorized: school admin only');
  return m;
}
