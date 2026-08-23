import type { Metadata } from "next";
export const metadata: Metadata = { title: "Achievements" };

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
  certificate, courseEnrollment, course, userProgress,
  module as moduleTable,
} from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import Link from "next/link";
import {
  Trophy, GraduationCap, BookOpen, Star, Target,
  ArrowRight, CheckCircle2, Clock, Award, Zap, Lock,
} from "lucide-react";
import { convertBlobUrlToApiUrl } from "@/lib/blob-url";

export default async function AchievementsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId  = session!.user.id;
  const name    = session!.user.name ?? "Learner";

  const [certs, enrollments, progressRows, moduleCounts] = await Promise.all([
    db.select().from(certificate).where(eq(certificate.userId, userId)).orderBy(certificate.issuedAt),
    db.select({
      id: courseEnrollment.id, courseId: courseEnrollment.courseId,
      completedAt: courseEnrollment.completedAt, enrolledAt: courseEnrollment.enrolledAt,
      courseTitle: course.title, thumbnail: course.thumbnail, instructor: course.instructor,
    }).from(courseEnrollment).innerJoin(course, eq(courseEnrollment.courseId, course.id)).where(eq(courseEnrollment.userId, userId)),
    db.select({ courseId: userProgress.courseId, count: count() })
      .from(userProgress).where(and(eq(userProgress.userId, userId), eq(userProgress.isModuleCompleted, true))).groupBy(userProgress.courseId),
    db.select({ courseId: moduleTable.courseId, count: count() }).from(moduleTable).groupBy(moduleTable.courseId),
  ]);

  const progressMap    = Object.fromEntries(progressRows.map(r => [r.courseId, Number(r.count)]));
  const moduleCountMap = Object.fromEntries(moduleCounts.map(r => [r.courseId, Number(r.count)]));
  const completedCourses = enrollments.filter(e => e.completedAt != null).length;
  const totalModulesDone = Object.values(progressMap).reduce((s, v) => s + v, 0);
  const totalEnrolled    = enrollments.length;
  const totalCerts       = certs.length;

  const milestones = [
    { id: "first-enroll",   label: "First Class",      desc: "Enrolled in your first course",  icon: BookOpen,      color: "#34C759", bg: "#F2FBF4", achieved: totalEnrolled >= 1,    threshold: 1, current: totalEnrolled,    detail: "Enroll in your first course" },
    { id: "first-module",   label: "First Module",     desc: "Completed your first module",     icon: CheckCircle2,  color: "#007AFF", bg: "#F0F6FF", achieved: totalModulesDone >= 1, threshold: 1, current: totalModulesDone, detail: "Complete your first module" },
    { id: "five-modules",   label: "Module Streak",    desc: "Completed 5 modules",             icon: Zap,           color: "#FF9500", bg: "#FFF8F0", achieved: totalModulesDone >= 5, threshold: 5, current: totalModulesDone, detail: `${Math.min(totalModulesDone, 5)} of 5 done` },
    { id: "first-complete", label: "Course Complete",  desc: "Finished your first course",      icon: GraduationCap, color: "#AF52DE", bg: "#FAF0FF", achieved: completedCourses >= 1, threshold: 1, current: completedCourses, detail: "Complete your first full course" },
    { id: "first-cert",     label: "Certified",        desc: "Earned your first certificate",   icon: Trophy,        color: "#FF3B30", bg: "#FFF0F0", achieved: totalCerts >= 1,       threshold: 1, current: totalCerts,       detail: "Earn your first certificate" },
    { id: "three-courses",  label: "Lifelong Learner", desc: "Enrolled in 3 or more courses",   icon: Star,          color: "#5856D6", bg: "#F2F2FF", achieved: totalEnrolled >= 3,    threshold: 3, current: totalEnrolled,    detail: `${Math.min(totalEnrolled, 3)} of 3 courses` },
  ];

  const achievedCount = milestones.filter(m => m.achieved).length;
  const milestonePct  = Math.round((achievedCount / milestones.length) * 100);
  const inProgress    = enrollments.filter(e => (progressMap[e.courseId] ?? 0) > 0 && e.completedAt == null);
  const initial       = name.charAt(0).toUpperCase();

  const css = `
    .ap { font-family: -apple-system, "SF Pro Text", "Helvetica Neue", Arial, sans-serif; color: #1d1d1f; }
    .ap *, .ap *::before, .ap *::after { box-sizing: border-box; }

    /* Page header */
    .ap-header {
      display: flex; align-items: center; justify-content: space-between;
      gap: 16px; margin-bottom: 32px; padding-bottom: 24px;
      border-bottom: 1px solid #e5e5e5;
    }
    .ap-header-left {}
    .ap-header-eyebrow { font-size: 12px; font-weight: 600; color: #8e8e93; letter-spacing: 0.04em; text-transform: uppercase; margin: 0 0 6px; }
    .ap-header-title { font-size: 34px; font-weight: 700; color: #1d1d1f; margin: 0; letter-spacing: -0.03em; line-height: 1.05; }
    .ap-avatar {
      width: 52px; height: 52px; border-radius: 50%;
      background: #007AFF; display: flex; align-items: center; justify-content: center;
      font-size: 20px; font-weight: 700; color: #fff; flex-shrink: 0;
    }

    /* Stats */
    .ap-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 40px; }
    @media (max-width: 560px) { .ap-stats { grid-template-columns: repeat(2, 1fr); } }
    .ap-stat {
      background: #ffffff; border: 1px solid #e5e5e5; border-radius: 14px;
      padding: 18px 16px;
    }
    .ap-stat-val { font-size: 30px; font-weight: 700; color: #1d1d1f; margin: 0 0 2px; line-height: 1; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
    .ap-stat-label { font-size: 13px; color: #8e8e93; margin: 0; font-weight: 500; }

    /* Section */
    .ap-section { margin-bottom: 40px; }
    .ap-sh { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
    .ap-sh-title { font-size: 22px; font-weight: 700; color: #1d1d1f; margin: 0; letter-spacing: -0.02em; }
    .ap-sh-meta { font-size: 15px; color: #8e8e93; font-weight: 500; }

    /* Progress row */
    .ap-progress-card {
      background: #fff; border: 1px solid #e5e5e5; border-radius: 14px;
      padding: 16px 18px; margin-bottom: 14px;
      display: flex; align-items: center; gap: 14px;
    }
    .ap-progress-icon { width: 36px; height: 36px; border-radius: 10px; background: #F0F6FF; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ap-progress-inner { flex: 1; }
    .ap-progress-top { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; }
    .ap-progress-label { font-size: 14px; font-weight: 600; color: #1d1d1f; }
    .ap-progress-pct { font-size: 14px; font-weight: 700; color: #007AFF; font-variant-numeric: tabular-nums; }
    .ap-progress-track { height: 5px; border-radius: 3px; background: #f2f2f7; overflow: hidden; }
    .ap-progress-fill { height: 100%; border-radius: 3px; background: #007AFF; transition: width 0.8s cubic-bezier(0.22,1,0.36,1); }

    /* Badge grid */
    .ap-badge-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    @media (max-width: 680px) { .ap-badge-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 420px) { .ap-badge-grid { grid-template-columns: 1fr; } }

    .ap-badge {
      background: #fff; border: 1px solid #e5e5e5; border-radius: 14px;
      padding: 18px 16px; position: relative;
    }
    .ap-badge.locked { background: #fafafa; }
    .ap-badge-icon { width: 40px; height: 40px; border-radius: 11px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
    .ap-badge-name { font-size: 15px; font-weight: 700; color: #1d1d1f; margin: 0 0 3px; }
    .ap-badge.locked .ap-badge-name { color: #8e8e93; }
    .ap-badge-desc { font-size: 13px; color: #8e8e93; margin: 0; line-height: 1.45; }
    .ap-badge.locked .ap-badge-desc { color: #c7c7cc; }
    .ap-badge-done {
      position: absolute; top: 14px; right: 14px;
      width: 20px; height: 20px; border-radius: 50%; background: #34C759;
      display: flex; align-items: center; justify-content: center;
    }
    .ap-badge-sub { margin-top: 10px; }
    .ap-badge-sub-track { height: 3px; border-radius: 2px; background: #f2f2f7; overflow: hidden; margin-bottom: 5px; }
    .ap-badge-sub-fill { height: 100%; border-radius: 2px; background: #007AFF; }
    .ap-badge-sub-label { font-size: 11px; color: #aeaeb2; font-weight: 500; }

    /* Certs */
    .ap-cert-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; }
    .ap-cert-card {
      background: #fff; border: 1px solid #e5e5e5; border-radius: 16px;
      text-decoration: none; color: inherit; display: flex; flex-direction: column;
      overflow: hidden; transition: border-color .15s;
    }
    .ap-cert-card:hover { border-color: #007AFF; }
    .ap-cert-banner {
      height: 96px; background: #f2f2f7; position: relative;
      display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 7px;
      border-bottom: 1px solid #e5e5e5;
    }
    .ap-cert-banner-icon { width: 40px; height: 40px; border-radius: 11px; background: #fff; border: 1px solid #e5e5e5; display: flex; align-items: center; justify-content: center; }
    .ap-cert-banner-label { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #8e8e93; }
    .ap-cert-body { padding: 16px 16px 0; flex: 1; }
    .ap-cert-org { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #8e8e93; margin: 0 0 5px; }
    .ap-cert-title { font-size: 16px; font-weight: 700; color: #1d1d1f; margin: 0; line-height: 1.35; letter-spacing: -0.01em; }
    .ap-cert-date { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #aeaeb2; margin: 8px 0 0; font-weight: 500; }
    .ap-cert-verified { display: flex; align-items: center; gap: 5px; margin: 10px 16px 0; padding: 6px 10px; background: #f2fbf4; border: 1px solid #c6f0d0; border-radius: 8px; width: fit-content; }
    .ap-cert-verified-text { font-size: 11px; font-weight: 600; color: #34C759; }
    .ap-cert-footer { padding: 12px 16px 16px; }
    .ap-cert-cta {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      background: #007AFF; color: #fff; border-radius: 10px; padding: 11px;
      font-size: 14px; font-weight: 600; text-decoration: none; transition: background .15s;
    }
    .ap-cert-cta:hover { background: #0066CC; }

    /* Empty */
    .ap-empty { background: #fff; border: 1px solid #e5e5e5; border-radius: 16px; padding: 60px 40px; text-align: center; }
    .ap-empty-icon { width: 56px; height: 56px; border-radius: 14px; background: #f2f2f7; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
    .ap-empty-h { font-size: 20px; font-weight: 700; color: #1d1d1f; margin: 0 0 8px; letter-spacing: -0.01em; }
    .ap-empty-p { font-size: 15px; color: #8e8e93; margin: 0 auto 24px; line-height: 1.6; max-width: 260px; }
    .ap-btn { display: inline-flex; align-items: center; gap: 6px; background: #007AFF; color: #fff; border-radius: 10px; padding: 11px 20px; font-size: 15px; font-weight: 600; text-decoration: none; transition: background .15s; }
    .ap-btn:hover { background: #0066CC; }

    /* In-progress */
    .ap-inprog { background: #fff; border: 1px solid #e5e5e5; border-radius: 16px; overflow: hidden; }
    .ap-row { display: flex; align-items: center; gap: 14px; padding: 14px 16px; text-decoration: none; color: inherit; transition: background .12s; }
    .ap-row:not(:last-child) { border-bottom: 1px solid #f2f2f7; }
    .ap-row:hover { background: #fafafa; }
    .ap-row-thumb { width: 48px; height: 48px; border-radius: 10px; overflow: hidden; flex-shrink: 0; background: #f2f2f7; display: flex; align-items: center; justify-content: center; }
    .ap-row-info { flex: 1; min-width: 0; }
    .ap-row-title { font-size: 15px; font-weight: 600; color: #1d1d1f; margin: 0 0 7px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ap-row-bar-wrap { display: flex; align-items: center; gap: 8px; }
    .ap-row-track { flex: 1; height: 4px; border-radius: 2px; background: #f2f2f7; overflow: hidden; }
    .ap-row-fill { height: 100%; border-radius: 2px; background: #007AFF; }
    .ap-row-pct { font-size: 13px; font-weight: 700; color: #007AFF; font-variant-numeric: tabular-nums; }
    .ap-row-sub { font-size: 12px; color: #aeaeb2; margin: 4px 0 0; font-weight: 500; }
    .ap-row-arrow { color: #c7c7cc; flex-shrink: 0; }
    .ap-row:hover .ap-row-arrow { color: #007AFF; }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="ap">

        {/* Header */}
        <div className="ap-header">
          <div className="ap-header-left">
            <p className="ap-header-eyebrow">Learning profile</p>
            <h1 className="ap-header-title">Achievements</h1>
          </div>
          <div className="ap-avatar">{initial}</div>
        </div>

        {/* Stats */}
        <div className="ap-stats">
          {[
            { val: totalEnrolled,    label: "Enrolled"     },
            { val: completedCourses, label: "Completed"    },
            { val: totalModulesDone, label: "Modules done" },
            { val: totalCerts,       label: "Certificates" },
          ].map(({ val, label }) => (
            <div key={label} className="ap-stat">
              <p className="ap-stat-val">{val}</p>
              <p className="ap-stat-label">{label}</p>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div className="ap-section">
          <div className="ap-sh">
            <h2 className="ap-sh-title">Badges</h2>
            <span className="ap-sh-meta">{achievedCount} of {milestones.length} unlocked</span>
          </div>

          <div className="ap-progress-card">
            <div className="ap-progress-icon">
              <Target size={18} style={{ color: "#007AFF" }} />
            </div>
            <div className="ap-progress-inner">
              <div className="ap-progress-top">
                <span className="ap-progress-label">Overall progress</span>
                <span className="ap-progress-pct">{milestonePct}%</span>
              </div>
              <div className="ap-progress-track">
                <div className="ap-progress-fill" style={{ width: `${milestonePct}%` }} />
              </div>
            </div>
          </div>

          <div className="ap-badge-grid">
            {milestones.map(({ id, label, desc, icon: Icon, color, bg, achieved, threshold, current, detail }) => {
              const pct = Math.min(100, threshold > 0 ? Math.round((current / threshold) * 100) : 0);
              return (
                <div key={id} className={"ap-badge " + (achieved ? "achieved" : "locked")}>
                  {achieved && (
                    <div className="ap-badge-done">
                      <CheckCircle2 size={12} style={{ color: "#fff" }} />
                    </div>
                  )}
                  <div className="ap-badge-icon" style={{ background: achieved ? bg : "#f2f2f7" }}>
                    {achieved
                      ? <Icon size={19} style={{ color }} />
                      : <Lock size={16} style={{ color: "#c7c7cc" }} />}
                  </div>
                  <p className="ap-badge-name">{label}</p>
                  <p className="ap-badge-desc">{desc}</p>
                  {!achieved && (
                    <div className="ap-badge-sub">
                      {threshold > 1 && (
                        <div className="ap-badge-sub-track">
                          <div className="ap-badge-sub-fill" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                      <p className="ap-badge-sub-label">{detail}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Certificates */}
        <div className="ap-section">
          <div className="ap-sh">
            <h2 className="ap-sh-title">Certificates</h2>
            {totalCerts > 0 && <span className="ap-sh-meta">{totalCerts} earned</span>}
          </div>

          {certs.length === 0 ? (
            <div className="ap-empty">
              <div className="ap-empty-icon"><Award size={24} style={{ color: "#aeaeb2" }} /></div>
              <h3 className="ap-empty-h">No certificates yet</h3>
              <p className="ap-empty-p">Complete a course to earn your first verified certificate.</p>
              <Link href="/courses" className="ap-btn">Browse courses <ArrowRight size={14} /></Link>
            </div>
          ) : (
            <div className="ap-cert-grid">
              {certs.map(cert => {
                const issued = new Date(cert.issuedAt).toLocaleDateString("en-UG", { month: "long", day: "numeric", year: "numeric" });
                return (
                  <Link key={cert.id} href={`/certificate/${cert.id}`} className="ap-cert-card">
                    <div className="ap-cert-banner">
                      <div className="ap-cert-banner-icon"><Trophy size={18} style={{ color: "#FF9500" }} /></div>
                      <p className="ap-cert-banner-label">Certificate of Completion</p>
                    </div>
                    <div className="ap-cert-body">
                      {(cert.schoolName ?? cert.instructorName) && <p className="ap-cert-org">{cert.schoolName ?? cert.instructorName}</p>}
                      <h3 className="ap-cert-title">{cert.courseTitle}</h3>
                      <div className="ap-cert-date"><Clock size={11} /> Issued {issued}</div>
                    </div>
                    <div className="ap-cert-verified">
                      <CheckCircle2 size={11} style={{ color: "#34C759" }} />
                      <span className="ap-cert-verified-text">Verified · {cert.id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="ap-cert-footer">
                      <div className="ap-cert-cta"><GraduationCap size={14} /> View Certificate</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* In-progress */}
        {inProgress.length > 0 && (
          <div className="ap-section">
            <div className="ap-sh">
              <h2 className="ap-sh-title">Keep going</h2>
              <span className="ap-sh-meta">{inProgress.length} in progress</span>
            </div>
            <div className="ap-inprog">
              {inProgress.map(e => {
                const done  = progressMap[e.courseId]    ?? 0;
                const total = moduleCountMap[e.courseId] ?? 0;
                const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
                const thumb = e.thumbnail ? convertBlobUrlToApiUrl(e.thumbnail) : null;
                return (
                  <Link key={e.id} href={`/learn/${e.courseId}`} className="ap-row">
                    <div className="ap-row-thumb">
                      {thumb
                        ? <img src={thumb} alt={e.courseTitle} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        : <BookOpen size={18} style={{ color: "#c7c7cc" }} />}
                    </div>
                    <div className="ap-row-info">
                      <p className="ap-row-title">{e.courseTitle}</p>
                      <div className="ap-row-bar-wrap">
                        <div className="ap-row-track"><div className="ap-row-fill" style={{ width: `${pct}%` }} /></div>
                        <span className="ap-row-pct">{pct}%</span>
                      </div>
                      <p className="ap-row-sub">{done} of {total} modules complete</p>
                    </div>
                    <ArrowRight size={15} className="ap-row-arrow" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </>
  );
}