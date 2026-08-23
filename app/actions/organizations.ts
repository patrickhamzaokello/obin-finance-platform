'use server';

import { db } from '@/lib/db';
import { organization, school, schoolMember, user } from '@/lib/db/schema';
import { eq, desc, asc } from 'drizzle-orm';
import { requirePlatformOwner } from '@/lib/school-context';
import { revalidatePath } from 'next/cache';

// ─── List ─────────────────────────────────────────────────────────────────────

export async function getOrganizations() {
  try {
    await requirePlatformOwner();
    const orgs = await db.select().from(organization).orderBy(asc(organization.name));

    // For each org, count how many schools belong to it
    const withCounts = await Promise.all(
      orgs.map(async (org) => {
        const schools = await db
          .select({ id: school.id, name: school.name, slug: school.slug })
          .from(school)
          .where(eq(school.organizationId, org.id));
        return { ...org, schoolCount: schools.length, schools };
      })
    );

    return { success: true, data: withCounts };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createOrganization(data: { name: string; domain: string }) {
  try {
    await requirePlatformOwner();

    const name   = data.name.trim();
    const domain = data.domain.trim().toLowerCase().replace(/^www\./, '').replace(/\/$/, '');

    if (!name)   return { success: false, error: 'Name is required' };
    if (!domain) return { success: false, error: 'Domain is required' };
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain))
      return { success: false, error: 'Enter a valid domain (e.g. myschool.com)' };

    // Check duplicate domain
    const existing = await db.select({ id: organization.id }).from(organization)
      .where(eq(organization.domain, domain)).limit(1);
    if (existing.length) return { success: false, error: 'An organization with that domain already exists' };

    const id = `org-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await db.insert(organization).values({ id, name, domain });

    revalidatePath('/admin/organizations');
    return { success: true, data: { id, name, domain } };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateOrganization(orgId: string, data: { name?: string; domain?: string }) {
  try {
    await requirePlatformOwner();

    const patch: Record<string, any> = {};
    if (data.name)   patch.name   = data.name.trim();
    if (data.domain) patch.domain = data.domain.trim().toLowerCase().replace(/^www\./, '').replace(/\/$/, '');

    if (!Object.keys(patch).length) return { success: false, error: 'Nothing to update' };

    await db.update(organization).set(patch).where(eq(organization.id, orgId));
    revalidatePath('/admin/organizations');
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteOrganization(orgId: string) {
  try {
    await requirePlatformOwner();

    // Detach all schools from this org first (set organizationId to null)
    await db.update(school).set({ organizationId: null }).where(eq(school.organizationId, orgId));
    await db.delete(organization).where(eq(organization.id, orgId));

    revalidatePath('/admin/organizations');
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Assign creator (school) to org ──────────────────────────────────────────

export async function assignSchoolToOrganization(schoolId: string, orgId: string | null) {
  try {
    await requirePlatformOwner();

    await db.update(school)
      .set({ organizationId: orgId })
      .where(eq(school.id, schoolId));

    revalidatePath('/admin/organizations');
    revalidatePath('/admin/schools');
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Get all schools with their org assignment (for the assign dropdown) ─────

export async function getSchoolsWithOrg() {
  try {
    await requirePlatformOwner();

    const schools = await db
      .select({
        id:             school.id,
        name:           school.name,
        slug:           school.slug,
        organizationId: school.organizationId,
      })
      .from(school)
      .orderBy(asc(school.name));

    return { success: true, data: schools };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
