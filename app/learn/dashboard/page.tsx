import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'My Learning — ObinAcademy' };

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import {
  courseEnrollment, course, school, userProgress,
  module as moduleTable, schoolMember, certificate,
} from '@/lib/db/schema';
import { eq, and, count, desc, sql } from 'drizzle-orm';
import Link from 'next/link';
import {
  BookOpen, Play, ChevronRight, GraduationCap, LayoutDashboard,
  ArrowRight, Trophy, Flame, Target, TrendingUp, Clock, CheckCircle2,
} from 'lucide-react';
import { convertBlobUrlToApiUrl } from '@/lib/blob-url';

// ─── helpers ──────────────────────────────────────────────────────────────────
function greeting(name: string) {
  // We're server-side so we use UTC+3 (EAT)
  const h = new Date(Date.now() + 3 * 60 * 60 * 1000).getUTCHours();
  const tod = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const first = name.split(' ')[0];
  return `${tod}, ${first} 👋`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-UG', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default async function LearnDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId  = session!.user.id;
  const userName = session!.user.name ?? 'Learner';

  // ── is school admin? ──
  const membership = await db.select().from(schoolMember)
    .where(and(eq(schoolMember.userId, userId), eq(schoolMember.role, 'school_admin')))
    .limit(1);
  const isSchoolAdmin = membership.length > 0;

  // ── enrolled courses ──
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
    .orderBy(desc(courseEnrollment.enrolledAt));

  // ── module counts per course ──
  const moduleCounts = await db
    .select({ courseId: moduleTable.courseId, count: count() })
    .from(moduleTable)
    .groupBy(moduleTable.courseId);
  const moduleCountMap = Object.fromEntries(moduleCounts.map(r => [r.courseId, Number(r.count)]));

  // ── completed modules per course ──
  const progress = await db
    .select({ courseId: userProgress.courseId, count: count(), lastUpdated: sql<Date>`max(${userProgress.updatedAt})` })
    .from(userProgress)
    .where(and(eq(userProgress.userId, userId), eq(userProgress.isModuleCompleted, true)))
    .groupBy(userProgress.courseId);
  const progressMap     = Object.fromEntries(progress.map(r => [r.courseId, Number(r.count)]));
  const lastUpdatedMap  = Object.fromEntries(progress.map(r => [r.courseId, r.lastUpdated]));

  // ── certificates ──
  const certs = await db.select({ id: certificate.id }).from(certificate).where(eq(certificate.userId, userId));

  // ── derived stats ──
  const totalEnrolled   = enrolled.length;
  const totalCompleted  = enrolled.filter(e => e.completedAt != null).length;
  const totalCerts      = certs.length;
  const inProgress      = enrolled.filter(e => {
    const done = progressMap[e.courseId] ?? 0;
    return done > 0 && e.completedAt == null;
  }).length;

  // ── "continue learning" — most recently active course ──
  const continueCourse = enrolled
    .filter(e => e.completedAt == null)
    .map(e => ({ ...e, lastActive: lastUpdatedMap[e.courseId] ?? e.enrolledAt }))
    .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())[0] ?? null;

  // ── learning streak: count distinct days with userProgress updates ──
  const allProgress = await db
    .select({ updatedAt: userProgress.updatedAt })
    .from(userProgress)
    .where(eq(userProgress.userId, userId))
    .orderBy(desc(userProgress.updatedAt));

  let streak = 0;
  if (allProgress.length) {
    const days = [...new Set(allProgress.map(p =>
      new Date(p.updatedAt).toISOString().slice(0, 10)
    ))].sort().reverse();

    const today     = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    if (days[0] === today || days[0] === yesterday) {
      let prev = days[0];
      for (const d of days) {
        const diff = (new Date(prev).getTime() - new Date(d).getTime()) / 864e5;
        if (diff <= 1) { streak++; prev = d; }
        else break;
      }
    }
  }

  // ── total modules completed (across all courses) ──
  const totalModulesCompleted = Object.values(progressMap).reduce((s, v) => s + v, 0);

  const continueThumb = continueCourse?.courseThumbnail
    ? convertBlobUrlToApiUrl(continueCourse.courseThumbnail) : null;

  return (
    <div className="space-y-8">

      {/* ── Studio banner (school admins) ── */}
      {isSchoolAdmin && (
        <Link href="/studio"
          className="flex items-center justify-between gap-4 px-5 py-4 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-colors group">
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

      {/* ── Greeting ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{greeting(userName)}</h1>
          <p className="text-sm text-muted-foreground mt-1">{formatDate(new Date())}</p>
        </div>
        {streak > 1 && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 px-3 py-2 rounded-xl shrink-0">
            <Flame size={16} className="text-orange-500" />
            <div className="text-right">
              <p className="text-sm font-bold text-orange-700 leading-none">{streak}</p>
              <p className="text-[10px] text-orange-500 mt-0.5">day streak</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Enrolled',         value: totalEnrolled,        icon: BookOpen,       color: 'bg-blue-50 text-blue-600' },
          { label: 'In Progress',      value: inProgress,           icon: TrendingUp,     color: 'bg-amber-50 text-amber-600' },
          { label: 'Completed',        value: totalCompleted,       icon: CheckCircle2,   color: 'bg-green-50 text-green-600' },
          { label: 'Certificates',     value: totalCerts,           icon: Trophy,         color: 'bg-purple-50 text-purple-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={16} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground leading-none">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Continue Learning hero ── */}
      {continueCourse && (() => {
        const total     = moduleCountMap[continueCourse.courseId] ?? 0;
        const completed = progressMap[continueCourse.courseId]   ?? 0;
        const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;
        return (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Continue learning</p>
            <Link href={`/learn/${continueCourse.courseId}`}
              className="group relative flex flex-col sm:flex-row overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
              {/* Thumbnail */}
              <div className="relative sm:w-72 h-44 sm:h-auto bg-black shrink-0 overflow-hidden">
                {continueThumb ? (
                  <img src={continueThumb} alt={continueCourse.courseTitle}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300 opacity-90" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40">
                    <BookOpen size={40} className="text-primary/40" />
                  </div>
                )}
                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play size={20} className="text-primary ml-1" />
                  </div>
                </div>
                {pct > 0 && (
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-black/30">
                    <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{continueCourse.schoolName ?? continueCourse.instructor ?? 'Creator'}</p>
                  <h2 className="text-lg font-bold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors">
                    {continueCourse.courseTitle}
                  </h2>
                  {continueCourse.courseDesc && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {continueCourse.courseDesc}
                    </p>
                  )}
                </div>

                {/* Progress */}
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1.5"><Target size={11} /> {completed}/{total} modules complete</span>
                    <span className="font-bold text-primary">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl">
                      <Play size={13} fill="white" /> Resume course
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        );
      })()}

      {/* ── My Courses ── */}
      {enrolled.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={24} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Start learning today</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
            Browse classes from Uganda's top creators and enroll to begin your journey.
          </p>
          <Link href="/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors">
            Browse Classes <ChevronRight size={14} />
          </Link>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              All courses ({totalEnrolled})
            </p>
            <Link href="/courses" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              Browse more <ChevronRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolled.map((e) => {
              const total     = moduleCountMap[e.courseId] ?? 0;
              const completed = progressMap[e.courseId]   ?? 0;
              const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;
              const done      = e.completedAt != null;
              const thumb     = e.courseThumbnail ? convertBlobUrlToApiUrl(e.courseThumbnail) : null;

              return (
                <Link key={e.enrollmentId} href={`/learn/${e.courseId}`}
                  className="group bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col">
                  {/* Thumbnail */}
                  <div className="relative h-40 bg-secondary overflow-hidden">
                    {thumb ? (
                      <img src={thumb} alt={e.courseTitle}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
                        <BookOpen size={32} className="text-primary/40" />
                      </div>
                    )}
                    {/* Progress bar on image */}
                    {pct > 0 && (
                      <div className="absolute bottom-0 inset-x-0 h-1 bg-black/20">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                    {done && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <GraduationCap size={10} /> Completed
                      </div>
                    )}
                    {!done && pct === 0 && (
                      <div className="absolute top-3 left-3 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Not started
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

                    {/* Progress */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                        <span>{completed}/{total} modules</span>
                        <span className={`font-bold ${pct === 100 ? 'text-green-600' : 'text-primary'}`}>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-500' : 'bg-primary'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    {/* Enrolled date */}
                    <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock size={9} />
                      Enrolled {new Date(e.enrolledAt).toLocaleDateString('en-UG', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Milestone card — modules completed ── */}
      {totalModulesCompleted > 0 && (
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Target size={22} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">
              You've completed <span className="text-primary">{totalModulesCompleted} module{totalModulesCompleted !== 1 ? 's' : ''}</span> so far
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Keep going — every module gets you closer to your certificate.
            </p>
          </div>
          <Link href="/learn/achievements"
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors">
            Achievements <ChevronRight size={11} />
          </Link>
        </div>
      )}

      {/* ── Browse prompt (few enrollments) ── */}
      {totalEnrolled < 3 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
            <BookOpen size={22} className="text-amber-600" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-bold text-foreground">Discover more classes</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Explore finance, business, and creator courses from Uganda's top educators.
            </p>
          </div>
          <Link href="/courses"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors">
            Browse Classes <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
