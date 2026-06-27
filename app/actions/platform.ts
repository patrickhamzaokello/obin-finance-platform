'use server';

import { db } from '@/lib/db';
import { school, schoolMember, user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requirePlatformOwner } from '@/lib/school-context';
import { revalidatePath } from 'next/cache';

/** Add an existing user as school_admin for a school. Creates the membership. */
export async function addSchoolAdmin(schoolId: string, email: string) {
  try {
    await requirePlatformOwner();

    const userRows = await db.select().from(user).where(eq(user.email, email)).limit(1);
    if (!userRows.length) return { success: false, error: `No user found with email ${email}` };

    const u = userRows[0];

    // Upsert membership
    const existing = await db.select().from(schoolMember).where(eq(schoolMember.userId, u.id)).limit(1);
    if (existing.length) {
      await db.update(schoolMember)
        .set({ schoolId, role: 'school_admin' })
        .where(eq(schoolMember.userId, u.id));
    } else {
      await db.insert(schoolMember).values({
        id:       `sm-${Date.now()}`,
        userId:   u.id,
        schoolId,
        role:     'school_admin',
      });
    }

    revalidatePath(`/platform/schools/${schoolId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/** Promote a user to platform owner. */
export async function setUserPlatformRole(userId: string, platformRole: 'owner' | 'user') {
  try {
    await requirePlatformOwner();
    await db.update(user).set({ platformRole }).where(eq(user.id, userId));
    revalidatePath('/platform');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
