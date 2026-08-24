'use server';

import { db } from '@/lib/db';
import { school, payment, withdrawal } from '@/lib/db/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';
import {
  getCurrentSchool,
  requireOwnerOrOrgAdmin,
  requirePlatformOwner,
} from '@/lib/school-context';
import { revalidatePath } from 'next/cache';

const MIN_WITHDRAWAL = 50_000; // UGX

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Creator's total earned = gross − org commission, from successful payments. */
async function creatorTotalEarned(schoolId: string, commissionPercent: number): Promise<number> {
  const payments = await db
    .select({ amount: payment.amount })
    .from(payment)
    .where(and(eq(payment.schoolId, schoolId), eq(payment.status, 'success')));
  return payments.reduce((s, p) => s + Math.round(p.amount * (1 - commissionPercent / 100)), 0);
}

/** Amount locked in active (non-rejected, non-cancelled) withdrawals. */
async function lockedAmount(schoolId: string): Promise<number> {
  const active = await db
    .select({ amount: withdrawal.amount })
    .from(withdrawal)
    .where(
      and(
        eq(withdrawal.schoolId, schoolId),
        inArray(withdrawal.status, ['pending', 'org_approved', 'owner_approved', 'sent']),
      ),
    );
  return active.reduce((s, w) => s + w.amount, 0);
}

// ─── Creator: update phone number ─────────────────────────────────────────────

export async function updateSchoolPhone(phone: string) {
  try {
    const s = await getCurrentSchool();
    if (!s) return { success: false, error: 'No school found' };

    const trimmed = phone.trim().replace(/\s+/g, '');
    if (!trimmed) return { success: false, error: 'Phone number is required' };

    await db.update(school).set({ phone: trimmed, updatedAt: new Date() }).where(eq(school.id, s.id));
    revalidatePath('/studio/revenue');
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Creator: get balance + withdrawal history ────────────────────────────────

export async function getCreatorWithdrawals() {
  try {
    const s = await getCurrentSchool();
    if (!s) return { success: false, error: 'No school found' };

    const [totalEarned, locked, history] = await Promise.all([
      creatorTotalEarned(s.id, s.commissionPercent ?? 10),
      lockedAmount(s.id),
      db.select().from(withdrawal).where(eq(withdrawal.schoolId, s.id)).orderBy(desc(withdrawal.requestedAt)),
    ]);

    const available = totalEarned - locked;

    return {
      success: true,
      data: {
        school:       s,
        totalEarned,
        locked,
        available,
        canWithdraw:  available >= MIN_WITHDRAWAL,
        minAmount:    MIN_WITHDRAWAL,
        history,
      },
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Creator: request withdrawal ──────────────────────────────────────────────

export async function requestWithdrawal(amount: number) {
  try {
    const s = await getCurrentSchool();
    if (!s) return { success: false, error: 'No school found' };

    if (!s.phone) return { success: false, error: 'Add a phone number first before requesting a withdrawal.' };

    if (!Number.isInteger(amount) || amount < MIN_WITHDRAWAL) {
      return { success: false, error: `Minimum withdrawal is UGX ${MIN_WITHDRAWAL.toLocaleString()}` };
    }

    const [totalEarned, locked] = await Promise.all([
      creatorTotalEarned(s.id, s.commissionPercent ?? 10),
      lockedAmount(s.id),
    ]);
    const available = totalEarned - locked;

    if (amount > available) {
      return { success: false, error: `You only have UGX ${available.toLocaleString()} available.` };
    }

    await db.insert(withdrawal).values({
      id:       `wd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      schoolId: s.id,
      amount,
      phone:    s.phone,
      status:   'pending',
    });

    revalidatePath('/studio/revenue');
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Org-admin: list withdrawals for their org ────────────────────────────────

export async function getOrgWithdrawals(orgIdOverride?: string) {
  try {
    const { role, orgId: callerOrgId } = await requireOwnerOrOrgAdmin();
    const orgId = role === 'owner' ? orgIdOverride! : callerOrgId!;

    const orgSchools = await db
      .select({ id: school.id, name: school.name, slug: school.slug })
      .from(school)
      .where(eq(school.organizationId, orgId));

    if (!orgSchools.length) return { success: true, data: [] };

    const schoolIds = orgSchools.map(s => s.id);
    const schoolMap = Object.fromEntries(orgSchools.map(s => [s.id, s]));

    const rows = await db
      .select()
      .from(withdrawal)
      .where(inArray(withdrawal.schoolId, schoolIds))
      .orderBy(desc(withdrawal.requestedAt));

    return {
      success: true,
      data: rows.map(w => ({ ...w, school: schoolMap[w.schoolId] })),
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Org-admin: approve a pending withdrawal ──────────────────────────────────

export async function orgApproveWithdrawal(id: string) {
  try {
    await requireOwnerOrOrgAdmin();

    const rows = await db.select().from(withdrawal).where(eq(withdrawal.id, id)).limit(1);
    if (!rows[0]) return { success: false, error: 'Withdrawal not found' };
    if (rows[0].status !== 'pending') return { success: false, error: 'Only pending withdrawals can be approved here' };

    await db.update(withdrawal)
      .set({ status: 'org_approved', orgApprovedAt: new Date() })
      .where(eq(withdrawal.id, id));

    revalidatePath('/org-admin/withdrawals');
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Shared: reject a withdrawal (org-admin or owner) ────────────────────────

export async function rejectWithdrawal(id: string, notes?: string) {
  try {
    const { role } = await requireOwnerOrOrgAdmin();

    const rows = await db.select().from(withdrawal).where(eq(withdrawal.id, id)).limit(1);
    if (!rows[0]) return { success: false, error: 'Withdrawal not found' };

    const { status } = rows[0];
    if (role === 'org_admin' && status !== 'pending') {
      return { success: false, error: 'You can only reject pending withdrawals' };
    }
    if (role === 'owner' && !['pending', 'org_approved'].includes(status)) {
      return { success: false, error: 'This withdrawal cannot be rejected' };
    }

    await db.update(withdrawal)
      .set({
        status:     'rejected',
        notes:      notes ?? null,
        rejectedBy: role,
        rejectedAt: new Date(),
      })
      .where(eq(withdrawal.id, id));

    revalidatePath('/org-admin/withdrawals');
    revalidatePath('/admin/withdrawals');
    revalidatePath('/studio/revenue');
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Owner: list all org_approved withdrawals awaiting final sign-off ─────────

export async function getOwnerWithdrawals() {
  try {
    await requirePlatformOwner();

    const rows = await db
      .select()
      .from(withdrawal)
      .orderBy(desc(withdrawal.requestedAt));

    // Enrich with school name
    const schoolIds = [...new Set(rows.map(w => w.schoolId))];
    const schools = schoolIds.length
      ? await db.select({ id: school.id, name: school.name, slug: school.slug }).from(school).where(inArray(school.id, schoolIds))
      : [];
    const schoolMap = Object.fromEntries(schools.map(s => [s.id, s]));

    return {
      success: true,
      data: rows.map(w => ({ ...w, school: schoolMap[w.schoolId] })),
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Owner: final approve + mark as sent ──────────────────────────────────────

export async function ownerApproveWithdrawal(id: string) {
  try {
    await requirePlatformOwner();

    const rows = await db.select().from(withdrawal).where(eq(withdrawal.id, id)).limit(1);
    if (!rows[0]) return { success: false, error: 'Withdrawal not found' };
    if (rows[0].status !== 'org_approved') {
      return { success: false, error: 'Withdrawal must be org-approved first' };
    }

    // Mark owner_approved then immediately sent (manual Mobile Money disbursement)
    const now = new Date();
    await db.update(withdrawal)
      .set({ status: 'sent', ownerApprovedAt: now, sentAt: now })
      .where(eq(withdrawal.id, id));

    revalidatePath('/admin/withdrawals');
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
