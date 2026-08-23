import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { school, schoolMember, user, organization } from '@/lib/db/schema';
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

/** True for both owner AND org_admin — use for layout guards that admit both */
export async function isPlatformAdminOrOwner(): Promise<boolean> {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session?.user) return false;
  const rows = await db.select({ platformRole: user.platformRole })
    .from(user).where(eq(user.id, session.user.id)).limit(1);
  const role = rows[0]?.platformRole;
  return role === 'owner' || role === 'org_admin';
}

export async function isOrgAdmin(): Promise<boolean> {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session?.user) return false;
  const rows = await db.select({ platformRole: user.platformRole })
    .from(user).where(eq(user.id, session.user.id)).limit(1);
  return rows[0]?.platformRole === 'org_admin';
}

/** Returns the organization the current org_admin manages, or null */
export async function getOrgAdminOrganization() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session?.user) return null;
  const rows = await db.select({ platformRole: user.platformRole, organizationId: user.organizationId })
    .from(user).where(eq(user.id, session.user.id)).limit(1);
  if (rows[0]?.platformRole !== 'org_admin' || !rows[0]?.organizationId) return null;
  const orgRows = await db.select().from(organization).where(eq(organization.id, rows[0].organizationId)).limit(1);
  return orgRows[0] ?? null;
}

export async function requirePlatformOwner(): Promise<void> {
  if (!(await isPlatformOwner())) throw new Error('Unauthorized: platform owner only');
}

export async function requireOrgAdmin() {
  const org = await getOrgAdminOrganization();
  if (!org) throw new Error('Unauthorized: org admin only');
  return org;
}

export async function requireSchoolAdmin(): Promise<SchoolMember> {
  const m = await getCurrentMembership();
  if (!m || m.role !== 'school_admin') throw new Error('Unauthorized: school admin only');
  return m;
}
