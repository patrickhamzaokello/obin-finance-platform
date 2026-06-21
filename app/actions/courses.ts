'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { course, courseEnrollment, module, video, pdf, userProgress } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error('Unauthorized');
  return session.user.id;
}

async function isAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== 'admin') throw new Error('Unauthorized: Admin access required');
  return true;
}

// Course queries
export async function getPublishedCourses() {
  try {
    const courses = await db
      .select()
      .from(course)
      .where(eq(course.isPublished, true))
      .orderBy(desc(course.createdAt));
    return { success: true, data: courses };
  } catch (error) {
    console.error('Error fetching courses:', error);
    return { success: false, error: 'Failed to fetch courses' };
  }
}

export async function getCourseById(courseId: string) {
  try {
    const courseData = await db.select().from(course).where(eq(course.id, courseId)).limit(1);
    if (!courseData.length) return { success: false, error: 'Course not found' };

    const modules = await db
      .select()
      .from(module)
      .where(eq(module.courseId, courseId))
      .orderBy(module.order);

    const modulesWithContent = await Promise.all(
      modules.map(async (mod) => {
        const videos = await db
          .select()
          .from(video)
          .where(eq(video.moduleId, mod.id))
          .orderBy(video.order);

        const pdfs = await db
          .select()
          .from(pdf)
          .where(eq(pdf.moduleId, mod.id))
          .orderBy(pdf.order);

        return { ...mod, videos, pdfs };
      })
    );

    return { success: true, data: { ...courseData[0], modules: modulesWithContent } };
  } catch (error) {
    console.error('Error fetching course:', error);
    return { success: false, error: 'Failed to fetch course' };
  }
}

export async function getCourseWithEnrollmentStatus(courseId: string) {
  try {
    const userId = await getUserId();
    const courseData = await db.select().from(course).where(eq(course.id, courseId)).limit(1);
    if (!courseData.length) return { success: false, error: 'Course not found' };

    const modules = await db
      .select()
      .from(module)
      .where(eq(module.courseId, courseId))
      .orderBy(module.order);

    const modulesWithContent = await Promise.all(
      modules.map(async (mod) => {
        const videos = await db
          .select()
          .from(video)
          .where(eq(video.moduleId, mod.id))
          .orderBy(video.order);

        const pdfs = await db
          .select()
          .from(pdf)
          .where(eq(pdf.moduleId, mod.id))
          .orderBy(pdf.order);

        return { ...mod, videos, pdfs };
      })
    );

    const enrollment = await db
      .select()
      .from(courseEnrollment)
      .where(and(eq(courseEnrollment.userId, userId), eq(courseEnrollment.courseId, courseId)))
      .limit(1);

    return {
      success: true,
      data: {
        ...courseData[0],
        modules: modulesWithContent,
        isEnrolled: enrollment.length > 0,
      },
    };
  } catch (error) {
    console.error('Error fetching course with enrollment status:', error);
    return { success: false, error: 'Failed to fetch course' };
  }
}

// Enrollment
export async function enrollCourse(courseId: string) {
  try {
    const userId = await getUserId();

    // Verify course exists and is published
    const courseData = await db.select().from(course).where(eq(course.id, courseId)).limit(1);
    if (!courseData.length) {
      return { success: false, error: 'Course not found' };
    }
    if (!courseData[0].isPublished) {
      return { success: false, error: 'This course is not available' };
    }

    const existing = await db
      .select()
      .from(courseEnrollment)
      .where(and(eq(courseEnrollment.userId, userId), eq(courseEnrollment.courseId, courseId)))
      .limit(1);

    if (existing.length) {
      return { success: false, error: 'You are already enrolled in this course' };
    }

    await db.insert(courseEnrollment).values({
      id: `enrollment-${Date.now()}`,
      userId,
      courseId,
    });

    revalidatePath('/dashboard');
    revalidatePath(`/course/${courseId}`);
    return { success: true, message: 'Successfully enrolled in course!' };
  } catch (error) {
    console.error('Error enrolling course:', error);
    return { success: false, error: 'Failed to enroll in course. Please try again.' };
  }
}

export async function getUserEnrolledCourses() {
  try {
    const userId = await getUserId();
    const enrollments = await db
      .select({ courseId: courseEnrollment.courseId })
      .from(courseEnrollment)
      .where(eq(courseEnrollment.userId, userId));

    if (!enrollments.length) {
      return { success: true, data: [] };
    }

    const courseIds = enrollments.map((e) => e.courseId);
    const courses = await db.select().from(course).where((c) => {
      const conditions: any[] = [];
      courseIds.forEach((id) => {
        conditions.push(eq(c.id, id));
      });
      return conditions.length > 1 ? conditions.reduce((a, b) => ({ or: [a, b] }) as any) : conditions[0];
    });

    return { success: true, data: courses };
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    return { success: false, error: 'Failed to fetch enrolled courses' };
  }
}

// Progress tracking
export async function updateProgress(courseId: string, moduleId: string, videoId?: string, videoPosition?: number) {
  try {
    const userId = await getUserId();

    const existing = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.moduleId, moduleId)))
      .limit(1);

    if (existing.length) {
      await db
        .update(userProgress)
        .set({
          videoId: videoId || existing[0].videoId,
          videoPosition: videoPosition !== undefined ? videoPosition : existing[0].videoPosition,
          updatedAt: new Date(),
        })
        .where(eq(userProgress.id, existing[0].id));
    } else {
      await db.insert(userProgress).values({
        id: `progress-${Date.now()}`,
        userId,
        courseId,
        moduleId,
        videoId: videoId || null,
        videoPosition: videoPosition || 0,
      });
    }

    revalidatePath('/learning');
    return { success: true };
  } catch (error) {
    console.error('Error updating progress:', error);
    return { success: false, error: 'Failed to update progress' };
  }
}

export async function getUserProgress(courseId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      // User not authenticated, return empty progress
      return { success: true, data: [] };
    }

    const progress = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, session.user.id), eq(userProgress.courseId, courseId)));

    return { success: true, data: progress };
  } catch (error) {
    console.error('Error fetching progress:', error);
    return { success: true, data: [] };
  }
}
