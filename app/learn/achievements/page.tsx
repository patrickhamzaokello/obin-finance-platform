import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Achievements' };

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { certificate, courseEnrollment, course } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { Trophy, GraduationCap, BookOpen } from 'lucide-react';

export default async function AchievementsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  const [certs, enrollments] = await Promise.all([
    db.select().from(certificate).where(eq(certificate.userId, userId)),
    db.select({ id: courseEnrollment.id, completedAt: courseEnrollment.completedAt })
      .from(courseEnrollment)
      .where(eq(courseEnrollment.userId, userId)),
  ]);

  const completedCourses = enrollments.filter((e) => e.completedAt != null).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Achievements</h1>
        <p className="text-sm text-muted-foreground mt-1">Your learning milestones and certificates</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Enrolled',   value: enrollments.length, icon: BookOpen,       color: 'bg-blue-50 text-blue-600' },
          { label: 'Completed',  value: completedCourses,   icon: GraduationCap,  color: 'bg-green-50 text-green-600' },
          { label: 'Certificates', value: certs.length,    icon: Trophy,          color: 'bg-amber-50 text-amber-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm p-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={17} />
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Certificates */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Certificates</h2>
        {certs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <Trophy className="w-8 h-8 text-border mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Complete a class to earn your first certificate.
            </p>
            <Link href="/courses" className="text-sm font-semibold text-primary hover:underline">
              Browse classes →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {certs.map((cert) => (
              <div key={cert.id} className="bg-white rounded-2xl shadow-sm p-5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
                  <Trophy size={18} className="text-amber-600" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1 line-clamp-2">{cert.courseTitle}</h3>
                <p className="text-xs text-muted-foreground mb-1">{cert.schoolName ?? cert.instructorName}</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Issued {new Date(cert.issuedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <Link
                  href={`/certificate/${cert.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <GraduationCap size={12} /> View Certificate
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
