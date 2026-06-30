'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { course, courseEnrollment, module, video, pdf, userProgress, schoolMember, school, certificate } from '@/lib/db/schema';
import { eq, and, desc, count, inArray } from 'drizzle-orm';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getCurrentSchool } from '@/lib/school-context';

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error('Unauthorized');
  return session.user.id;
}

// Course queries
export async function getPublishedCourses() {
  try {
    const s = await getCurrentSchool();
    const where = s
      ? and(eq(course.isPublished, true), eq(course.schoolId, s.id))
      : eq(course.isPublished, true);
    const courses = await db.select().from(course).where(where).orderBy(desc(course.createdAt));
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
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

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

    let isEnrolled = false;
    if (userId) {
      const enrollment = await db
        .select()
        .from(courseEnrollment)
        .where(and(eq(courseEnrollment.userId, userId), eq(courseEnrollment.courseId, courseId)))
        .limit(1);
      isEnrolled = enrollment.length > 0;
    }

    return {
      success: true,
      data: {
        ...courseData[0],
        modules: modulesWithContent,
        isEnrolled,
        isLoggedIn: !!userId,
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

    // Snapshot effective price and platform fee at time of enrollment
    const c = courseData[0];
    const rawPrice = c.price ?? 0;
    const effectivePrice = (c.discountActive && (c.discountPercent ?? 0) > 0)
      ? Math.round(rawPrice * (1 - (c.discountPercent ?? 0) / 100))
      : rawPrice;

    let platformFee = 0;
    if (effectivePrice > 0 && c.schoolId) {
      const schoolRows = await db.select({ commissionPercent: school.commissionPercent }).from(school).where(eq(school.id, c.schoolId)).limit(1);
      if (schoolRows.length) {
        platformFee = Math.round(effectivePrice * (schoolRows[0].commissionPercent ?? 0) / 100);
      }
    }

    await db.insert(courseEnrollment).values({
      id: `enrollment-${Date.now()}`,
      userId,
      courseId,
      priceAtEnrollment: effectivePrice,
      platformFee,
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

    if (!enrollments.length) return { success: true, data: [] };

    const courseIds = enrollments.map((e) => e.courseId);

    const [courses, moduleCounts, completedCounts] = await Promise.all([
      db.select().from(course).where(inArray(course.id, courseIds)),
      db
        .select({ courseId: module.courseId, total: count() })
        .from(module)
        .where(inArray(module.courseId, courseIds))
        .groupBy(module.courseId),
      db
        .select({ courseId: userProgress.courseId, done: count() })
        .from(userProgress)
        .where(and(
          eq(userProgress.userId, userId),
          inArray(userProgress.courseId, courseIds),
          eq(userProgress.isModuleCompleted, true),
        ))
        .groupBy(userProgress.courseId),
    ]);

    const totalMap    = Object.fromEntries(moduleCounts.map((r) => [r.courseId, Number(r.total)]));
    const completedMap = Object.fromEntries(completedCounts.map((r) => [r.courseId, Number(r.done)]));

    return {
      success: true,
      data: courses.map((c) => ({
        ...c,
        moduleCount:          totalMap[c.id]     ?? 0,
        completedModuleCount: completedMap[c.id] ?? 0,
      })),
    };
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
      .where(and(eq(userProgress.userId, session.user.id), eq(userProgress.courseId, courseId)))
      .orderBy(desc(userProgress.updatedAt));

    return { success: true, data: progress };
  } catch (error) {
    console.error('Error fetching progress:', error);
    return { success: true, data: [] };
  }
}

export async function markModuleComplete(courseId: string, moduleId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error('Unauthorized');
    const userId = session.user.id;

    const existing = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.moduleId, moduleId)))
      .limit(1);

    if (existing.length) {
      await db
        .update(userProgress)
        .set({ isModuleCompleted: true, completedAt: new Date(), updatedAt: new Date() })
        .where(eq(userProgress.id, existing[0].id));
    } else {
      await db.insert(userProgress).values({
        id: `progress-${Date.now()}`,
        userId,
        courseId,
        moduleId,
        isModuleCompleted: true,
        completedAt: new Date(),
      });
    }

    // Check if all modules are now complete → issue certificate
    const [allModules, completedRows] = await Promise.all([
      db.select({ id: module.id }).from(module).where(eq(module.courseId, courseId)),
      db.select({ moduleId: userProgress.moduleId }).from(userProgress)
        .where(and(eq(userProgress.userId, userId), eq(userProgress.courseId, courseId), eq(userProgress.isModuleCompleted, true))),
    ]);

    if (allModules.length > 0 && completedRows.length >= allModules.length) {
      const alreadyCerted = await db.select({ id: certificate.id })
        .from(certificate)
        .where(and(eq(certificate.userId, userId), eq(certificate.courseId, courseId)))
        .limit(1);

      if (!alreadyCerted.length) {
        const courseRow = await db.select().from(course).where(eq(course.id, courseId)).limit(1);
        const s         = await getCurrentSchool();
        await db.insert(certificate).values({
          id:             `cert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          userId,
          courseId,
          learnerName:    session.user.name ?? session.user.email ?? 'Learner',
          courseTitle:    courseRow[0]?.title ?? 'Course',
          instructorName: courseRow[0]?.instructor ?? null,
          schoolName:     s?.name ?? null,
        });
        // Mark enrollment completed
        await db.update(courseEnrollment)
          .set({ completedAt: new Date() })
          .where(and(eq(courseEnrollment.userId, userId), eq(courseEnrollment.courseId, courseId)));
      }
    }

    revalidatePath(`/learning/${courseId}`);
    return { success: true };
  } catch (error) {
    console.error('Error marking module complete:', error);
    return { success: false, error: 'Failed to mark module complete' };
  }
}

export async function getMyAchievements() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, error: 'Not authenticated' };
    const rows = await db
      .select()
      .from(certificate)
      .where(eq(certificate.userId, session.user.id))
      .orderBy(desc(certificate.issuedAt));
    return { success: true, data: rows };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getCertificate(certId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, error: 'Not authenticated' };
    const rows = await db.select().from(certificate)
      .where(and(eq(certificate.id, certId), eq(certificate.userId, session.user.id)))
      .limit(1);
    if (!rows.length) return { success: false, error: 'Certificate not found' };
    return { success: true, data: rows[0] };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/** Upsert a schoolMember row for the current user on the current school subdomain.
 *  Called client-side after a successful sign-up so the user appears in the admin members list. */
export async function joinSchool() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, error: 'Not authenticated' };

    const s = await getCurrentSchool();
    if (!s) return { success: false, error: 'No school context' };

    // Skip if already a member (userId is UNIQUE on schoolMember)
    const existing = await db
      .select({ id: schoolMember.id })
      .from(schoolMember)
      .where(eq(schoolMember.userId, session.user.id))
      .limit(1);

    if (existing.length) return { success: true };

    await db.insert(schoolMember).values({
      id:       `member-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId:   session.user.id,
      schoolId: s.id,
      role:     'learner',
    });

    return { success: true };
  } catch (error) {
    console.error('Error joining school:', error);
    return { success: false, error: 'Failed to join school' };
  }
}
