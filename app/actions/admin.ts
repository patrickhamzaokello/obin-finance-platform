'use server';

import { db } from '@/lib/db';
import { course, module, video, pdf, user, school, schoolMember, courseAccessCode, courseEnrollment } from '@/lib/db/schema';
import { eq, desc, and, isNotNull } from 'drizzle-orm';
import { isYouTubeUrl, extractYouTubeId } from '@/lib/video-url';
import { revalidatePath } from 'next/cache';
import { getCurrentSchool, isPlatformOwner, requirePlatformOwner } from '@/lib/school-context';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

/** Returns true if the current user is a school_admin for the active school OR the platform owner. */
async function isSchoolAdmin() {
  if (await isPlatformOwner()) return true;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error('Unauthorized');

  const s = await getCurrentSchool();
  if (!s) throw new Error('No school context');

  const membership = await db.select().from(schoolMember)
    .where(and(eq(schoolMember.userId, session.user.id), eq(schoolMember.schoolId, s.id)))
    .limit(1);

  if (!membership.length || membership[0].role !== 'school_admin') {
    throw new Error('Unauthorized: school admin required');
  }
  return true;
}

// Course management
export async function getAllCourses() {
  try {
    await isSchoolAdmin();
    const s = await getCurrentSchool();
    const courses = s
      ? await db.select().from(course).where(eq(course.schoolId, s.id)).orderBy(desc(course.createdAt))
      : await db.select().from(course).orderBy(desc(course.createdAt)); // platform owner sees all
    return { success: true, data: courses };
  } catch (error) {
    console.error('Error fetching courses:', error);
    return { success: false, error: 'Failed to fetch courses' };
  }
}

export async function createCourse(data: {
  title: string;
  description?: string;
  thumbnail?: string;
  instructor?: string;
  schoolId?: string | null;
  price?: number;
  discountPercent?: number;
  discountActive?: boolean;
  }) {
  try {
    await isSchoolAdmin();
    // If no schoolId passed, auto-assign from current school context
    const s = await getCurrentSchool();
    const resolvedSchoolId = data.schoolId || s?.id || null;
    const newCourse = {
      id: `course-${Date.now()}`,
      ...data,
      schoolId: resolvedSchoolId,
      isPublished: false,
    };
    await db.insert(course).values(newCourse);
    revalidatePath('/admin/courses');
    return { success: true, data: newCourse };
  } catch (error) {
    console.error('[v0] Error creating course:', error);
    return { success: false, error: String(error) || 'Failed to create course' };
  }
}

export async function updateCourse(
  courseId: string,
  data: {
    title?: string;
    description?: string;
    thumbnail?: string;
    instructor?: string;
    isPublished?: boolean;
    schoolId?: string | null;
    price?: number;
    discountPercent?: number;
    discountActive?: boolean;
  }
) {
  try {
    await isSchoolAdmin();
    await db.update(course).set(data).where(eq(course.id, courseId));
    revalidatePath('/admin/courses');
    return { success: true };
  } catch (error) {
    console.error('Error updating course:', error);
    return { success: false, error: 'Failed to update course' };
  }
}

export async function deleteCourse(courseId: string) {
  try {
    await isSchoolAdmin();
    await db.delete(course).where(eq(course.id, courseId));
    revalidatePath('/admin/courses');
    return { success: true };
  } catch (error) {
    console.error('Error deleting course:', error);
    return { success: false, error: 'Failed to delete course' };
  }
}

// Course detail (admin view — returns full course with modules, videos, pdfs)
export async function getAdminCourse(courseId: string) {
  try {
    await isSchoolAdmin();

    const courseRows = await db.select().from(course).where(eq(course.id, courseId)).limit(1);
    if (!courseRows.length) return { success: false, error: 'Course not found' };

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

    return { success: true, data: { ...courseRows[0], modules: modulesWithContent } };
  } catch (error) {
    console.error('Error fetching admin course:', error);
    return { success: false, error: String(error) };
  }
}

// Module management
export async function createModule(courseId: string, data: { title: string; description?: string; order: number }) {
  try {
    await isSchoolAdmin();
    const newModule = {
      id: `module-${Date.now()}`,
      courseId,
      ...data,
    };
    await db.insert(module).values(newModule);
    revalidatePath('/admin/courses');
    return { success: true, data: newModule };
  } catch (error) {
    console.error('Error creating module:', error);
    return { success: false, error: 'Failed to create module' };
  }
}

export async function updateModule(
  moduleId: string,
  data: { title?: string; description?: string; order?: number }
) {
  try {
    await isSchoolAdmin();
    await db.update(module).set(data).where(eq(module.id, moduleId));
    revalidatePath('/admin/courses');
    return { success: true };
  } catch (error) {
    console.error('Error updating module:', error);
    return { success: false, error: 'Failed to update module' };
  }
}

export async function deleteModule(moduleId: string) {
  try {
    await isSchoolAdmin();
    await db.delete(module).where(eq(module.id, moduleId));
    revalidatePath('/admin/courses');
    return { success: true };
  } catch (error) {
    console.error('Error deleting module:', error);
    return { success: false, error: 'Failed to delete module' };
  }
}

// Video management
export async function createVideo(
  moduleId: string,
  data: { title: string; url: string; duration?: number; order: number }
) {
  try {
    await isSchoolAdmin();
    
    // Separate YouTube URL from regular URL
    let videoUrl = null;
    let youtubeUrl = null;
    
    if (isYouTubeUrl(data.url)) {
      youtubeUrl = data.url;
    } else {
      videoUrl = data.url;
    }
    
    const newVideo = {
      id: `video-${Date.now()}`,
      moduleId,
      title: data.title,
      url: videoUrl,
      youtubeUrl: youtubeUrl,
      duration: data.duration,
      order: data.order,
    };
    await db.insert(video).values(newVideo);
    revalidatePath('/admin/courses');
    return { success: true, data: newVideo };
  } catch (error) {
    console.error('Error creating video:', error);
    return { success: false, error: 'Failed to create video' };
  }
}

export async function updateVideo(
  videoId: string,
  data: { title?: string; url?: string; duration?: number; order?: number }
) {
  try {
    await isSchoolAdmin();
    
    // Handle YouTube URL separation
    const updateData: any = { ...data };
    if (data.url !== undefined) {
      if (isYouTubeUrl(data.url)) {
        updateData.youtubeUrl = data.url;
        updateData.url = null;
      } else {
        updateData.url = data.url;
        updateData.youtubeUrl = null;
      }
    }
    
    await db.update(video).set(updateData).where(eq(video.id, videoId));
    revalidatePath('/admin/courses');
    return { success: true };
  } catch (error) {
    console.error('Error updating video:', error);
    return { success: false, error: 'Failed to update video' };
  }
}

export async function deleteVideo(videoId: string) {
  try {
    await isSchoolAdmin();
    await db.delete(video).where(eq(video.id, videoId));
    revalidatePath('/admin/courses');
    return { success: true };
  } catch (error) {
    console.error('Error deleting video:', error);
    return { success: false, error: 'Failed to delete video' };
  }
}

// PDF management
export async function createPdf(
  moduleId: string,
  data: { title: string; url: string; order: number }
) {
  try {
    await isSchoolAdmin();
    const newPdf = {
      id: `pdf-${Date.now()}`,
      moduleId,
      ...data,
    };
    await db.insert(pdf).values(newPdf);
    revalidatePath('/admin/courses');
    return { success: true, data: newPdf };
  } catch (error) {
    console.error('Error creating PDF:', error);
    return { success: false, error: 'Failed to create PDF' };
  }
}

export async function updatePdf(pdfId: string, data: { title?: string; url?: string; order?: number }) {
  try {
    await isSchoolAdmin();
    await db.update(pdf).set(data).where(eq(pdf.id, pdfId));
    revalidatePath('/admin/courses');
    return { success: true };
  } catch (error) {
    console.error('Error updating PDF:', error);
    return { success: false, error: 'Failed to update PDF' };
  }
}

export async function deletePdf(pdfId: string) {
  try {
    await isSchoolAdmin();
    await db.delete(pdf).where(eq(pdf.id, pdfId));
    revalidatePath('/admin/courses');
    return { success: true };
  } catch (error) {
    console.error('Error deleting PDF:', error);
    return { success: false, error: 'Failed to delete PDF' };
  }
}

// User management — school-scoped
export async function getAllUsers() {
  try {
    await isSchoolAdmin();
    const s = await getCurrentSchool();
    if (!s) return { success: false, error: 'No school context' };

    const members = await db
      .select({
        id: schoolMember.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        role: schoolMember.role,
        createdAt: schoolMember.createdAt,
      })
      .from(schoolMember)
      .innerJoin(user, eq(schoolMember.userId, user.id))
      .where(eq(schoolMember.schoolId, s.id))
      .orderBy(desc(schoolMember.createdAt));

    return { success: true, data: members };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, error: 'Failed to fetch users' };
  }
}

export async function updateUserRole(memberId: string, role: 'school_admin' | 'learner') {
  try {
    await isSchoolAdmin();
    await db.update(schoolMember).set({ role }).where(eq(schoolMember.id, memberId));
    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: 'Failed to update user role' };
  }
}

// ─── School management ────────────────────────────────────────────────────────

export async function getSchools() {
  try {
    await requirePlatformOwner();
    const schools = await db.select().from(school).orderBy(school.name);
    return { success: true, data: schools };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function createSchool(data: { name: string; slug: string; logoUrl?: string; commissionPercent?: number }) {
  try {
    await requirePlatformOwner();
    const slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const id   = `school-${Date.now()}`;
    await db.insert(school).values({
      id, slug, name: data.name, logoUrl: data.logoUrl || null,
      commissionPercent: Math.min(100, Math.max(0, data.commissionPercent ?? 0)),
    });
    revalidatePath('/admin/schools');
    return { success: true, data: { id, slug, name: data.name } };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateSchool(schoolId: string, data: { name?: string; slug?: string; logoUrl?: string; commissionPercent?: number }) {
  try {
    await requirePlatformOwner();
    const updates: any = { updatedAt: new Date() };
    if (data.name)    updates.name    = data.name;
    if (data.slug)    updates.slug    = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (data.logoUrl !== undefined) updates.logoUrl = data.logoUrl;
    if (data.commissionPercent !== undefined) updates.commissionPercent = Math.min(100, Math.max(0, data.commissionPercent));
    await db.update(school).set(updates).where(eq(school.id, schoolId));
    revalidatePath('/admin/schools');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function deleteSchool(schoolId: string) {
  try {
    await requirePlatformOwner();
    await db.delete(school).where(eq(school.id, schoolId));
    revalidatePath('/admin/schools');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/** Platform-owner only: full access-code activation report across all schools. */
export async function getRevenueReport() {
  try {
    await requirePlatformOwner();

    // All activated access codes joined with course, school, and the learner user
    const rows = await db
      .select({
        codeId:          courseAccessCode.id,
        code:            courseAccessCode.code,
        label:           courseAccessCode.label,
        usedAt:          courseAccessCode.usedAt,
        accessExpiresAt: courseAccessCode.accessExpiresAt,
        courseId:        course.id,
        courseTitle:     course.title,
        coursePrice:     course.price,
        discountPercent: course.discountPercent,
        discountActive:  course.discountActive,
        schoolId:        school.id,
        schoolName:      school.name,
        schoolSlug:      school.slug,
        learnerId:       user.id,
        learnerName:     user.name,
        learnerEmail:    user.email,
      })
      .from(courseAccessCode)
      .innerJoin(course, eq(courseAccessCode.courseId, course.id))
      .innerJoin(school, eq(course.schoolId, school.id))
      .innerJoin(user, eq(courseAccessCode.usedBy, user.id))
      .where(isNotNull(courseAccessCode.usedBy))
      .orderBy(desc(courseAccessCode.usedAt));

    return { success: true, data: rows };
  } catch (error) {
    console.error('Error fetching revenue report:', error);
    return { success: false, error: String(error) };
  }
}

/** Platform-owner only: earnings from enrollment commissions. */
export async function getEarningsReport() {
  try {
    await requirePlatformOwner();

    const rows = await db
      .select({
        enrollmentId:      courseEnrollment.id,
        enrolledAt:        courseEnrollment.enrolledAt,
        priceAtEnrollment: courseEnrollment.priceAtEnrollment,
        platformFee:       courseEnrollment.platformFee,
        courseId:          course.id,
        courseTitle:       course.title,
        schoolId:          school.id,
        schoolName:        school.name,
        schoolSlug:        school.slug,
        commissionPercent: school.commissionPercent,
        learnerId:         user.id,
        learnerName:       user.name,
        learnerEmail:      user.email,
      })
      .from(courseEnrollment)
      .innerJoin(course, eq(courseEnrollment.courseId, course.id))
      .innerJoin(school, eq(course.schoolId, school.id))
      .innerJoin(user, eq(courseEnrollment.userId, user.id))
      .where(isNotNull(course.schoolId))
      .orderBy(desc(courseEnrollment.enrolledAt));

    return { success: true, data: rows };
  } catch (error) {
    console.error('Error fetching earnings report:', error);
    return { success: false, error: String(error) };
  }
}
