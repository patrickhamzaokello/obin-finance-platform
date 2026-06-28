'use server';

import { db } from '@/lib/db';
import { courseReview, supportMessage, courseEnrollment, course, school, schoolMember, user } from '@/lib/db/schema';
import { eq, and, desc, avg, count } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getCurrentSchool } from '@/lib/school-context';
import { revalidatePath } from 'next/cache';

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error('Unauthorized');
  return session;
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export async function submitReview(courseId: string, rating: number, comment: string) {
  try {
    const session = await getSession();
    const userId  = session.user.id;

    // Must be enrolled
    const enrollment = await db.select({ id: courseEnrollment.id })
      .from(courseEnrollment)
      .where(and(eq(courseEnrollment.userId, userId), eq(courseEnrollment.courseId, courseId)))
      .limit(1);
    if (!enrollment.length) return { success: false, error: 'You must be enrolled to review this course' };

    const courseRow = await db.select({ title: course.title, schoolId: course.schoolId })
      .from(course).where(eq(course.id, courseId)).limit(1);

    const existing = await db.select({ id: courseReview.id })
      .from(courseReview)
      .where(and(eq(courseReview.userId, userId), eq(courseReview.courseId, courseId)))
      .limit(1);

    if (existing.length) {
      await db.update(courseReview)
        .set({ rating, comment: comment.trim() || null, updatedAt: new Date() })
        .where(eq(courseReview.id, existing[0].id));
    } else {
      await db.insert(courseReview).values({
        id:          `review-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId,
        courseId,
        schoolId:    courseRow[0]?.schoolId ?? null,
        rating,
        comment:     comment.trim() || null,
        learnerName: session.user.name ?? session.user.email ?? 'Learner',
        courseTitle: courseRow[0]?.title ?? '',
      });
    }

    revalidatePath(`/course/${courseId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getCourseReviews(courseId: string) {
  try {
    const rows = await db.select().from(courseReview)
      .where(eq(courseReview.courseId, courseId))
      .orderBy(desc(courseReview.createdAt));
    const stats = await db.select({ avg: avg(courseReview.rating), total: count() })
      .from(courseReview).where(eq(courseReview.courseId, courseId));
    return {
      success: true,
      data: rows,
      avgRating: stats[0]?.avg ? Number(Number(stats[0].avg).toFixed(1)) : null,
      totalReviews: Number(stats[0]?.total ?? 0),
    };
  } catch (error) {
    return { success: false, error: String(error), data: [], avgRating: null, totalReviews: 0 };
  }
}

export async function getMyReview(courseId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: true, data: null };
    const rows = await db.select().from(courseReview)
      .where(and(eq(courseReview.userId, session.user.id), eq(courseReview.courseId, courseId)))
      .limit(1);
    return { success: true, data: rows[0] ?? null };
  } catch {
    return { success: true, data: null };
  }
}

// ── Admin: all reviews for a school ──────────────────────────────────────────

export async function getSchoolReviews() {
  try {
    const s = await getCurrentSchool();
    if (!s) return { success: false, error: 'No school context' };
    const rows = await db.select().from(courseReview)
      .where(eq(courseReview.schoolId, s.id))
      .orderBy(desc(courseReview.createdAt));
    return { success: true, data: rows };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ── Support messages ──────────────────────────────────────────────────────────

export async function sendSupportMessage(subject: string, body: string) {
  try {
    const session = await getSession();
    const s = await getCurrentSchool();
    if (!s) return { success: false, error: 'No school context' };

    await db.insert(supportMessage).values({
      id:          `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId:      session.user.id,
      schoolId:    s.id,
      subject:     subject.trim(),
      body:        body.trim(),
      senderName:  session.user.name ?? null,
      senderEmail: session.user.email,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getSupportMessages() {
  try {
    const s = await getCurrentSchool();
    if (!s) return { success: false, error: 'No school context' };
    const rows = await db.select().from(supportMessage)
      .where(eq(supportMessage.schoolId, s.id))
      .orderBy(desc(supportMessage.createdAt));
    return { success: true, data: rows };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateMessageStatus(messageId: string, status: 'open' | 'resolved') {
  try {
    await db.update(supportMessage).set({ status }).where(eq(supportMessage.id, messageId));
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
