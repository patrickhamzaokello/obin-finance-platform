import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { school, schoolMember, user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { cache } from 'react';

export type School = typeof school.$inferSelect;
export type SchoolMember = typeof schoolMember.$inferSelect;

/** Get the current school from the x-school-slug header (set by middleware). */
export const getCurrentSchool = cache(async (): Promise<School | null> => {
  const h = await headers();
  const slug = h.get('x-school-slug');
  if (!slug) return null;
  const rows = await db.select().from(school).where(eq(school.slug, slug)).limit(1);
  return rows[0] ?? null;
});

/** Get the current school or throw if not found. Use inside school routes. */
export async function requireSchool(): Promise<School> {
  const s = await getCurrentSchool();
  if (!s) throw new Error('No school context');
  return s;
}

/** Get the current user's school membership for the active school. */
export async function getCurrentMembership(): Promise<SchoolMember | null> {
  const [h, s] = await Promise.all([headers(), getCurrentSchool()]);
  if (!s) return null;

  const session = await auth.api.getSession({ headers: h });
  if (!session?.user) return null;

  const rows = await db
    .select()
    .from(schoolMember)
    .where(eq(schoolMember.userId, session.user.id))
    .limit(1);

  // Only return the membership if it belongs to the current school
  const m = rows[0];
  if (!m || m.schoolId !== s.id) return null;
  return m;
}

/** True if the current session user is the platform owner. */
export async function isPlatformOwner(): Promise<boolean> {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session?.user) return false;
  const rows = await db.select({ platformRole: user.platformRole })
    .from(user).where(eq(user.id, session.user.id)).limit(1);
  return rows[0]?.platformRole === 'owner';
}

/** Require platform owner or throw. */
export async function requirePlatformOwner(): Promise<void> {
  if (!(await isPlatformOwner())) throw new Error('Unauthorized: platform owner only');
}

/** Require school_admin role for the current school or throw. */
export async function requireSchoolAdmin(): Promise<SchoolMember> {
  const m = await getCurrentMembership();
  if (!m || m.role !== 'school_admin') throw new Error('Unauthorized: school admin only');
  return m;
}
