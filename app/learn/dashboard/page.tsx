import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'My Learning' };

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { courseEnrollment, course, school, userProgress, module, schoolMember } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';
import Link from 'next/link';
import { BookOpen, Play, ChevronRight, GraduationCap, LayoutDashboard, ArrowRight } from 'lucide-react';

export default async function LearnDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  // Check if user is a school admin
  const membership = await db
    .select()
    .from(schoolMember)
    .where(and(eq(schoolMember.userId, userId), eq(schoolMember.role, 'school_admin')))
    .limit(1);
  const isSchoolAdmin = membership.length > 0;

  // My classes with school name and module count
  const enrolled = await db
    .select({
      enrollmentId:    courseEnrollment.id,
      enrolledAt:      courseEnrollment.enrolledAt,
      completedAt:     courseEnrollment.completedAt,
      courseId:        course.id,
      courseTitle:     course.title,
      courseDesc:      course.description,
      courseThumbnail: course.thumbnail,
      instructor:      course.instructor,
      schoolName:      school.name,
      schoolSlug:      school.slug,
    })
    .from(courseEnrollment)
    .innerJoin(course, eq(courseEnrollment.courseId, course.id))
    .leftJoin(school, eq(course.schoolId, school.id))
    .where(eq(courseEnrollment.userId, userId))
    .orderBy(courseEnrollment.enrolledAt);

  // Module counts per course
  const moduleCounts = await db
    .select({ courseId: module.courseId, count: count() })
    .from(module)
    .groupBy(module.courseId);
  const moduleCountMap = Object.fromEntries(moduleCounts.map((r) => [r.courseId, Number(r.count)]));

  // Completed modules per course (progress)
  const progress = await db
    .select({ courseId: userProgress.courseId, count: count() })
    .from(userProgress)
    .where(and(eq(userProgress.userId, userId), eq(userProgress.isModuleCompleted, true)))
    .groupBy(userProgress.courseId);
  const progressMap = Object.fromEntries(progress.map((r) => [r.courseId, Number(r.count)]));

  return (
    <div className="space-y-8">

      {/* Studio banner — school admins only */}
      {isSchoolAdmin && (
        <Link
          href="/studio"
          className="flex items-center justify-between gap-4 px-5 py-4 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <LayoutDashboard size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Go to Creator Studio</p>
              <p className="text-xs text-primary-foreground/70 mt-0.5">Manage your courses, learners and profile</p>
            </div>
          </div>
          <ArrowRight size={16} className="shrink-0 opacity-70 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">My Learning</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {enrolled.length === 0
            ? 'You haven\'t enrolled in any courses yet.'
            : `${enrolled.length} class${enrolled.length !== 1 ? 'es' : ''} enrolled`}
        </p>
      </div>

      {enrolled.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={24} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Start learning today</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
            Browse classes from Uganda's top creators and enroll to begin your learning journey.
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            Browse Classes <ChevronRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {enrolled.map((e) => {
            const total     = moduleCountMap[e.courseId] ?? 0;
            const completed = progressMap[e.courseId]   ?? 0;
            const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;
            const done      = e.completedAt != null;

            return (
              <Link
                key={e.enrollmentId}
                href={`/learn/${e.courseId}`}
                className="group bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col"
              >
                {/* Thumbnail */}
                <div className="relative h-40 bg-secondary overflow-hidden">
                  {e.courseThumbnail ? (
                    <img
                      src={e.courseThumbnail}
                      alt={e.courseTitle}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
                      <BookOpen size={32} className="text-primary/40" />
                    </div>
                  )}
                  {done && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <GraduationCap size={10} /> Completed
                    </div>
                  )}
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                      <Play size={18} className="text-foreground ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col">
                  <p className="text-xs text-muted-foreground mb-1">{e.schoolName ?? 'Creator'}</p>
                  <h3 className="text-sm font-semibold text-foreground leading-snug mb-1 line-clamp-2 flex-1">
                    {e.courseTitle}
                  </h3>
                  {e.instructor && (
                    <p className="text-xs text-muted-foreground">by {e.instructor}</p>
                  )}

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span>{completed}/{total} modules</span>
                      <span className="font-semibold">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Browse more */}
      {enrolled.length > 0 && (
        <div className="flex justify-center">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-black/[0.08] bg-white text-sm font-semibold text-foreground rounded-xl hover:bg-black/[0.02] transition-colors"
          >
            <BookOpen size={14} /> Browse more classes
          </Link>
        </div>
      )}
    </div>
  );
}
