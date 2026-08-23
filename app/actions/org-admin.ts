'use server';

/**
 * Server actions scoped to a single organization.
 * All functions call requireOrgAdmin() first — owners get a guard error here,
 * they should use /admin actions instead.
 */

import { db } from '@/lib/db';
import {
  school, course, courseEnrollment, creatorApplication, payment,
  user, organization,
} from '@/lib/db/schema';
import { eq, and, asc, desc, sql } from 'drizzle-orm';
import { requireOrgAdmin, requirePlatformOwner, isPlatformOwner } from '@/lib/school-context';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

// ─── helper: get org for current user (owner can pass an orgId override) ──────
async function resolveOrg(orgIdOverride?: string) {
  if (await isPlatformOwner()) {
    if (!orgIdOverride) throw new Error('Owner must pass orgId');
    const rows = await db.select().from(organization).where(eq(organization.id, orgIdOverride)).limit(1);
    if (!rows[0]) throw new Error('Organization not found');
    return rows[0];
  }
  return requireOrgAdmin(); // returns the org row
}

// ─── Creators (schools) in this org ──────────────────────────────────────────

export async function getOrgCreators(orgId?: string) {
  try {
    const org = await resolveOrg(orgId);
    const schools = await db
      .select()
      .from(school)
      .where(eq(school.organizationId, org.id))
      .orderBy(asc(school.name));
    return { success: true, data: schools, org };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Applications for schools in this org ────────────────────────────────────

export async function getOrgApplications(orgId?: string) {
  try {
    const org = await resolveOrg(orgId);
    // Get school ids in this org
    const schools = await db
      .select({ id: school.id })
      .from(school)
      .where(eq(school.organizationId, org.id));
    const schoolIds = schools.map(s => s.id);

    if (!schoolIds.length) return { success: true, data: [], org };

    // Applications where schoolId is one of ours OR pending (no school yet — visible to any org admin)
    const apps = await db
      .select()
      .from(creatorApplication)
      .orderBy(desc(creatorApplication.createdAt));

    // Filter: approved apps linked to our schools, or all pending
    const filtered = apps.filter(a =>
      a.status === 'pending' ||
      (a.schoolId && schoolIds.includes(a.schoolId))
    );

    return { success: true, data: filtered, org };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Revenue for this org ─────────────────────────────────────────────────────

export async function getOrgRevenue(orgId?: string) {
  try {
    const org = await resolveOrg(orgId);
    const schools = await db
      .select({ id: school.id, name: school.name, commissionPercent: school.commissionPercent })
      .from(school)
      .where(eq(school.organizationId, org.id));

    if (!schools.length) return { success: true, data: { schools: [], payments: [], totals: { gross: 0, orgCommission: 0, ownerTakes: 0, orgKeeps: 0, creatorEarnings: 0 } }, org };

    const schoolIds = schools.map(s => s.id);

    // Get successful payments for these schools
    const payments = await db
      .select({
        id:        payment.id,
        amount:    payment.amount,
        status:    payment.status,
        schoolId:  payment.schoolId,
        courseId:  payment.courseId,
        createdAt: payment.createdAt,
      })
      .from(payment)
      .where(eq(payment.status, 'success'))
      .orderBy(desc(payment.createdAt));

    const orgPayments = payments.filter(p => p.schoolId && schoolIds.includes(p.schoolId));

    // Per-school totals with correct 3-way split:
    //   orgCommission = gross * commissionPercent / 100
    //   ownerTakes    = orgCommission * 0.20  (platform owner's cut)
    //   orgKeeps      = orgCommission * 0.80  (org's actual take)
    //   creatorEarns  = gross - orgCommission
    const bySchool  = schools.map(s => {
      const sp    = orgPayments.filter(p => p.schoolId === s.id);
      const gross = sp.reduce((sum, p) => sum + p.amount, 0);
      const commission = s.commissionPercent ?? 10;
      const orgCommission  = Math.round(gross * commission / 100);
      const ownerTakes     = Math.round(orgCommission * 0.20);
      const orgKeeps       = orgCommission - ownerTakes;
      const creatorEarnings = gross - orgCommission;
      return { schoolId: s.id, name: s.name, gross, orgCommission, ownerTakes, orgKeeps, creatorEarnings, commission, txCount: sp.length };
    });

    const totals = bySchool.reduce(
      (acc, s) => ({
        gross:            acc.gross            + s.gross,
        orgCommission:    acc.orgCommission    + s.orgCommission,
        ownerTakes:       acc.ownerTakes       + s.ownerTakes,
        orgKeeps:         acc.orgKeeps         + s.orgKeeps,
        creatorEarnings:  acc.creatorEarnings  + s.creatorEarnings,
      }),
      { gross: 0, orgCommission: 0, ownerTakes: 0, orgKeeps: 0, creatorEarnings: 0 }
    );

    return { success: true, data: { schools: bySchool, payments: orgPayments, totals }, org };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Org dashboard stats ───────────────────────────────────────────────────────

export async function getOrgDashboard(orgId?: string) {
  try {
    const org = await resolveOrg(orgId);
    const schools = await db
      .select()
      .from(school)
      .where(eq(school.organizationId, org.id));

    const schoolIds = schools.map(s => s.id);

    if (!schoolIds.length) {
      return { success: true, data: { org, creators: 0, courses: 0, enrollments: 0, revenue: 0 } };
    }

    const [coursesRes, enrollmentsRes, paymentsRes] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(course).where(
        sql`${course.schoolId} = ANY(ARRAY[${sql.raw(schoolIds.map(id => `'${id}'`).join(','))}])`
      ),
      db.select({ count: sql<number>`count(*)` }).from(courseEnrollment).where(
        sql`EXISTS (SELECT 1 FROM course c WHERE c.id = ${courseEnrollment.courseId} AND c."schoolId" = ANY(ARRAY[${sql.raw(schoolIds.map(id => `'${id}'`).join(','))}]))`
      ),
      db.select({ amount: payment.amount, schoolId: payment.schoolId, status: payment.status })
        .from(payment).where(eq(payment.status, 'success')),
    ]);

    const orgPayments = paymentsRes.filter(p => p.schoolId && schoolIds.includes(p.schoolId));
    const revenue = orgPayments.reduce((s, p) => s + p.amount, 0);

    return {
      success: true,
      data: {
        org,
        creators:    schools.length,
        courses:     Number(coursesRes[0]?.count ?? 0),
        enrollments: Number(enrollmentsRes[0]?.count ?? 0),
        revenue,
      },
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Owner: assign/remove org_admin role on a user ───────────────────────────

export async function setOrgAdminRole(targetUserId: string, orgId: string | null) {
  try {
    await requirePlatformOwner();

    if (orgId) {
      await db.update(user)
        .set({ platformRole: 'org_admin', organizationId: orgId })
        .where(eq(user.id, targetUserId));
    } else {
      // Revoke org_admin → back to plain user
      await db.update(user)
        .set({ platformRole: 'user', organizationId: null })
        .where(eq(user.id, targetUserId));
    }

    revalidatePath('/admin/organizations');
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Owner: seed all users that have no organizationId ───────────────────────
//     Assigns them to the single org (or first org) on the platform.

const FREE_DOMAINS = new Set([
  'gmail.com','yahoo.com','hotmail.com','outlook.com','live.com',
  'icloud.com','me.com','aol.com','protonmail.com','yandex.com',
  'mail.com','zoho.com','gmx.com','inbox.com',
]);

export async function seedUsersToOrganization() {
  try {
    await requirePlatformOwner();

    let orgs = await db.select().from(organization).orderBy(asc(organization.createdAt));
    if (!orgs.length) return { success: false, error: 'No organizations found. Create one first.' };

    const { isNull } = await import('drizzle-orm');
    const unassigned = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(isNull(user.organizationId));

    if (!unassigned.length) return { success: true, data: { updated: 0, orgName: orgs[0].name } };

    let updated = 0;
    for (const u of unassigned) {
      const emailDomain = u.email?.split('@')[1]?.toLowerCase() ?? '';
      const matched = orgs.find(o => o.domain.toLowerCase() === emailDomain);
      let targetOrgId: string;

      if (matched) {
        targetOrgId = matched.id;
      } else if (!FREE_DOMAINS.has(emailDomain) && emailDomain.includes('.')) {
        // Custom domain with no org yet — create one
        const orgName = emailDomain
          .split('.')[0]
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
        const newOrgId = `org-${emailDomain.replace(/\./g, '-')}-${Date.now()}`;
        await db.insert(organization).values({ id: newOrgId, name: orgName, domain: emailDomain });
        // Re-fetch orgs so subsequent users with the same domain reuse this new one
        orgs = await db.select().from(organization).orderBy(asc(organization.createdAt));
        targetOrgId = newOrgId;
      } else {
        // Free email → platform default (first org)
        targetOrgId = orgs[0].id;
      }

      await db.update(user).set({ organizationId: targetOrgId }).where(eq(user.id, u.id));
      updated++;
    }

    return { success: true, data: { updated, orgName: orgs[0].name } };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Owner: find a user by email to assign as org admin ──────────────────────

export async function findUserByEmail(email: string) {
  try {
    await requirePlatformOwner();
    const rows = await db
      .select({ id: user.id, name: user.name, email: user.email, platformRole: user.platformRole, organizationId: user.organizationId })
      .from(user)
      .where(eq(user.email, email.trim().toLowerCase()))
      .limit(1);
    if (!rows[0]) return { success: false, error: 'No user found with that email' };
    return { success: true, data: rows[0] };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Owner: list users who are org_admins ─────────────────────────────────────

export async function getOrgAdmins() {
  try {
    await requirePlatformOwner();
    const admins = await db
      .select({
        id:             user.id,
        name:           user.name,
        email:          user.email,
        organizationId: user.organizationId,
      })
      .from(user)
      .where(eq(user.platformRole, 'org_admin'))
      .orderBy(asc(user.name));
    return { success: true, data: admins };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
