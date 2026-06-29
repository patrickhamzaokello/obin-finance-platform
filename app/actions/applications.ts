'use server';

import { db } from '@/lib/db';
import { creatorApplication, school } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requirePlatformOwner } from '@/lib/school-context';
import { revalidatePath } from 'next/cache';

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function uniqueSlug(base: string) {
  let slug = slugify(base).slice(0, 32) || 'creator';
  let suffix = 0;
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const existing = await db.select({ id: school.id }).from(school).where(eq(school.slug, candidate)).limit(1);
    if (!existing.length) return candidate;
    suffix++;
  }
}

export async function submitCreatorApplication(data: {
  name: string;
  email: string;
  phone: string;
  socialLink: string;
  channelName: string;
  bio?: string;
}) {
  try {
    if (!data.name.trim() || !data.email.trim() || !data.phone.trim() || !data.socialLink.trim() || !data.channelName.trim()) {
      return { success: false, error: 'All required fields must be filled in' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    // Prevent duplicate applications from the same email
    const existing = await db.select({ id: creatorApplication.id, status: creatorApplication.status })
      .from(creatorApplication).where(eq(creatorApplication.email, data.email.toLowerCase().trim())).limit(1);

    if (existing.length) {
      const s = existing[0].status;
      if (s === 'pending')  return { success: false, error: 'An application with this email is already under review.' };
      if (s === 'approved') return { success: false, error: 'This email has already been approved. Check your inbox for your channel link.' };
    }

    await db.insert(creatorApplication).values({
      id:          `app-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name:        data.name.trim(),
      email:       data.email.toLowerCase().trim(),
      phone:       data.phone.trim(),
      socialLink:  data.socialLink.trim(),
      channelName: data.channelName.trim(),
      bio:         data.bio?.trim() || null,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getApplications(status?: 'pending' | 'approved' | 'rejected') {
  try {
    await requirePlatformOwner();
    const rows = status
      ? await db.select().from(creatorApplication).where(eq(creatorApplication.status, status)).orderBy(desc(creatorApplication.createdAt))
      : await db.select().from(creatorApplication).orderBy(desc(creatorApplication.createdAt));
    return { success: true, data: rows };
  } catch (error) {
    return { success: false, error: String(error), data: [] };
  }
}

export async function approveApplication(applicationId: string) {
  try {
    await requirePlatformOwner();

    const apps = await db.select().from(creatorApplication).where(eq(creatorApplication.id, applicationId)).limit(1);
    if (!apps.length) return { success: false, error: 'Application not found' };
    const app = apps[0];

    // Create the school/channel
    const slug     = await uniqueSlug(app.channelName);
    const schoolId = `school-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    await db.insert(school).values({
      id:   schoolId,
      slug,
      name: app.channelName,
      bio:  app.bio ?? null,
    });

    // Mark application approved + link to school
    await db.update(creatorApplication)
      .set({ status: 'approved', schoolId, reviewedAt: new Date() })
      .where(eq(creatorApplication.id, applicationId));

    revalidatePath('/platform/admin');
    revalidatePath('/platform/admin/applications');

    return { success: true, data: { slug, schoolId } };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function rejectApplication(applicationId: string, notes?: string) {
  try {
    await requirePlatformOwner();
    await db.update(creatorApplication)
      .set({ status: 'rejected', notes: notes ?? null, reviewedAt: new Date() })
      .where(eq(creatorApplication.id, applicationId));
    revalidatePath('/platform/admin/applications');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
