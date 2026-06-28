'use server';

import { db } from '@/lib/db';
import { courseAccessCode, course, schoolMember, user } from '@/lib/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getCurrentSchool, isPlatformOwner } from '@/lib/school-context';
import { revalidatePath } from 'next/cache';

// ── Helpers ────────────────────────────────────────────────────────────────────

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error('Not authenticated');
  return session;
}

async function isSchoolAdmin() {
  if (await isPlatformOwner()) return true;
  const session = await getSession();
  const s = await getCurrentSchool();
  if (!s) throw new Error('No school context');
  const [m] = await db.select().from(schoolMember)
    .where(and(eq(schoolMember.userId, session.user.id), eq(schoolMember.schoolId, s.id)))
    .limit(1);
  if (!m || m.role !== 'school_admin') throw new Error('Unauthorized');
  return true;
}

/** Generates a human-friendly code like K4M9-P2L7-X8Q3 (avoids ambiguous chars). */
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${seg()}-${seg()}-${seg()}`;
}

// ── Admin actions ──────────────────────────────────────────────────────────────

export async function generateAccessCode(courseId: string, opts: {
  label?: string;
  codeExpiresInDays?: number;   // days until the code itself expires if unused
  accessDurationDays?: number;  // days of access after activation (null = permanent)
  count?: number;               // how many codes to generate at once (max 50)
}) {
  try {
    await isSchoolAdmin();
    const session = await getSession();

    const count = Math.min(opts.count ?? 1, 50);
    const now   = new Date();

    const codeExpiresAt = opts.codeExpiresInDays
      ? new Date(now.getTime() + opts.codeExpiresInDays * 86_400_000)
      : null;

    const codes = Array.from({ length: count }, (_, i) => ({
      id:            `ac-${Date.now()}-${i}`,
      courseId,
      code:          generateCode(),
      createdBy:     session.user.id,
      createdAt:     now,
      codeExpiresAt,
      label:         opts.label ?? null,
      // accessDurationDays is not stored — it's applied at activation time
      // We encode it in a metadata-like way: store as negative days in label if needed
      // Simpler: store access duration on the code itself
      usedBy:        null,
      usedAt:        null,
      accessExpiresAt: null, // set when activated
    }));

    // Re-generate if collision (rare but safe)
    const inserted: typeof codes = [];
    for (const c of codes) {
      let attempts = 0;
      let code = c.code;
      while (attempts < 5) {
        try {
          await db.insert(courseAccessCode).values({
            ...c,
            code,
            // Encode access duration in the record — store it for use at activation
            // We use a convention: prefix label with "[Xd]" to encode days
            label: [
              opts.accessDurationDays ? `[${opts.accessDurationDays}d]` : null,
              opts.label ?? null,
            ].filter(Boolean).join(' ') || null,
          });
          inserted.push({ ...c, code });
          break;
        } catch {
          code = generateCode(); // retry on unique collision
          attempts++;
        }
      }
    }

    revalidatePath('/admin/courses');
    return { success: true, data: inserted };
  } catch (error) {
    console.error('generateAccessCode:', error);
    return { success: false, error: String(error) };
  }
}

export async function listAccessCodes(courseId: string) {
  try {
    await isSchoolAdmin();
    const codes = await db.select().from(courseAccessCode)
      .where(eq(courseAccessCode.courseId, courseId))
      .orderBy(desc(courseAccessCode.createdAt));

    // Enrich with user email if used
    const enriched = await Promise.all(codes.map(async (c) => {
      if (!c.usedBy) return { ...c, usedByEmail: null };
      const [u] = await db.select({ email: user.email, name: user.name })
        .from(user).where(eq(user.id, c.usedBy)).limit(1);
      return { ...c, usedByEmail: u?.email ?? null, usedByName: u?.name ?? null };
    }));

    return { success: true, data: enriched };
  } catch (error) {
    console.error('listAccessCodes:', error);
    return { success: false, error: String(error) };
  }
}

export async function revokeAccessCode(codeId: string) {
  try {
    await isSchoolAdmin();
    await db.delete(courseAccessCode).where(eq(courseAccessCode.id, codeId));
    revalidatePath('/admin/courses');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ── Learner actions ────────────────────────────────────────────────────────────

/**
 * Checks whether the current user has valid (non-expired) access to a course.
 * Called server-side on every learning page load.
 */
export async function checkCourseAccess(courseId: string): Promise<boolean> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return false;

    const now = new Date();
    const [access] = await db.select().from(courseAccessCode)
      .where(and(
        eq(courseAccessCode.courseId, courseId),
        eq(courseAccessCode.usedBy, session.user.id),
        // Access must not be expired
      ))
      .limit(1);

    if (!access) return false;
    if (access.accessExpiresAt && access.accessExpiresAt < now) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Activates an access code for the current user.
 * The UPDATE uses a WHERE usedBy IS NULL guard — atomic protection against
 * two users activating the same code simultaneously.
 */
export async function activateAccessCode(rawCode: string, courseId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, error: 'You must be signed in to activate a code.' };

    // Normalize: uppercase, strip whitespace, allow input without dashes
    const normalized = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    // Re-insert dashes if user typed without them (12 chars → X-X-X)
    const formatted = normalized.length === 12
      ? `${normalized.slice(0,4)}-${normalized.slice(4,8)}-${normalized.slice(8,12)}`
      : rawCode.trim().toUpperCase();

    const [found] = await db.select().from(courseAccessCode)
      .where(eq(courseAccessCode.code, formatted))
      .limit(1);

    if (!found)                                         return { success: false, error: 'Invalid access code. Please check and try again.' };
    if (found.courseId !== courseId)                    return { success: false, error: 'This code is for a different course.' };
    if (found.usedBy === session.user.id)               return { success: false, error: 'You have already activated this code.' };
    if (found.usedBy)                                   return { success: false, error: 'This code has already been used.' };
    if (found.codeExpiresAt && found.codeExpiresAt < new Date()) return { success: false, error: 'This code has expired.' };

    // Parse access duration from label prefix "[Xd]"
    let accessExpiresAt: Date | null = null;
    if (found.label) {
      const match = found.label.match(/^\[(\d+)d\]/);
      if (match) {
        const days = parseInt(match[1], 10);
        accessExpiresAt = new Date(Date.now() + days * 86_400_000);
      }
    }

    const now = new Date();

    // Atomic bind: WHERE usedBy IS NULL ensures only one user wins a race
    const result = await db.update(courseAccessCode)
      .set({ usedBy: session.user.id, usedAt: now, accessExpiresAt })
      .where(and(
        eq(courseAccessCode.id, found.id),
        isNull(courseAccessCode.usedBy),
      ));

    // Drizzle with pg driver: check rowCount
    const affected = (result as any).rowCount ?? (result as any).count ?? 1;
    if (affected === 0) return { success: false, error: 'This code was just used by someone else. Please request a new one.' };

    return { success: true, accessExpiresAt };
  } catch (error) {
    console.error('activateAccessCode:', error);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}
