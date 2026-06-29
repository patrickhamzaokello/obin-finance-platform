import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Platform Overview' };

import { getEarningsReport } from '@/app/actions/admin';
import { db } from '@/lib/db';
import { school, user, courseEnrollment, course } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { User, Users, BookOpen, Heart, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { EarningsDashboard } from './earnings-dashboard';

export default async function PlatformDashboard() {
  const [schools, totalUsers, totalCourses, totalEnrollments, earningsResult] = await Promise.all([
    db.select().from(school).orderBy(school.createdAt),
    db.select({ count: sql<number>`count(*)` }).from(user),
    db.select({ count: sql<number>`count(*)` }).from(course),
    db.select({ count: sql<number>`count(*)` }).from(courseEnrollment),
    getEarningsReport(),
  ]);

  const earningsRows    = earningsResult.success && earningsResult.data ? earningsResult.data : [];
  const enrollmentFunnel = earningsResult.success && (earningsResult as any).enrollmentFunnel ? (earningsResult as any).enrollmentFunnel : [];

  // Earnings are computed from activated codes (effectivePrice * commissionPercent / 100)
  const totalEarnings = earningsRows.reduce((s, r) => {
    const base = r.coursePrice ?? 0;
    const eff  = (r.discountActive && (r.discountPercent ?? 0) > 0)
      ? Math.round(base * (1 - (r.discountPercent ?? 0) / 100))
      : base;
    return s + Math.round(eff * (r.commissionPercent ?? 0) / 100);
  }, 0);

  const stats = [
    { label: 'Creators',    value: schools.length,                          icon: User,      color: 'bg-blue-50 text-blue-600' },
    { label: 'Fans',        value: Number(totalUsers[0]?.count ?? 0),       icon: Users,     color: 'bg-purple-50 text-purple-600' },
    { label: 'Courses',     value: Number(totalCourses[0]?.count ?? 0),     icon: BookOpen,  color: 'bg-orange-50 text-orange-600' },
    { label: 'Enrollments', value: Number(totalEnrollments[0]?.count ?? 0), icon: Heart,     color: 'bg-pink-50 text-pink-600' },
    { label: 'My Earnings', value: `UGX ${totalEarnings.toLocaleString()}`, icon: TrendingUp,color: 'bg-green-50 text-green-600' },
  ];

  return (
    <div className='px-8 py-8 space-y-8'>
      <div>
        <h1 className='text-2xl font-bold text-foreground'>Platform Overview</h1>
        <p className='text-sm text-muted-foreground mt-1'>All creators and earnings across the platform</p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 lg:grid-cols-5 gap-4'>
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className='bg-white rounded-2xl shadow-sm p-5'>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={16} />
            </div>
            <p className='text-xl font-bold text-foreground'>{value}</p>
            <p className='text-xs text-muted-foreground mt-0.5'>{label}</p>
          </div>
        ))}
      </div>

      {/* Earnings dashboard (client — monthly chart + per-school table) */}
      <EarningsDashboard rows={earningsRows} enrollmentFunnel={enrollmentFunnel} />

      {/* Schools list */}
      <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
        <div className='px-6 py-4 border-b border-black/[0.06] flex items-center justify-between'>
          <h2 className='text-sm font-semibold text-foreground'>Creators</h2>
          <Link href='/platform/admin/schools'
            className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors'
          >
            Manage creators
          </Link>
        </div>
        {schools.length === 0 ? (
          <div className='px-6 py-12 text-center text-muted-foreground text-sm'>
            No creators yet. <Link href='/platform/admin/schools' className='text-primary underline'>Add the first one.</Link>
          </div>
        ) : (
          <table className='w-full text-sm'>
            <thead className='bg-secondary text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              <tr>
                <th className='px-6 py-3 text-left'>Creator</th>
                <th className='px-6 py-3 text-left'>Slug</th>
                <th className='px-6 py-3 text-left'>Commission</th>
                <th className='px-6 py-3 text-left'>My Earnings</th>
                <th className='px-6 py-3 text-left'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border'>
              {schools.map((s) => {
                const schoolEarnings = earningsRows
                  .filter((r) => r.schoolId === s.id)
                  .reduce((sum, r) => {
                    const base = r.coursePrice ?? 0;
                    const eff  = (r.discountActive && (r.discountPercent ?? 0) > 0)
                      ? Math.round(base * (1 - (r.discountPercent ?? 0) / 100))
                      : base;
                    return sum + Math.round(eff * (r.commissionPercent ?? 0) / 100);
                  }, 0);
                return (
                  <tr key={s.id} className='hover:bg-secondary/40 transition-colors'>
                    <td className='px-6 py-4 font-medium text-foreground'>{s.name}</td>
                    <td className='px-6 py-4 text-muted-foreground font-mono text-xs'>{s.slug}</td>
                    <td className='px-6 py-4 text-muted-foreground'>{s.commissionPercent ?? 0}%</td>
                    <td className='px-6 py-4 font-semibold text-foreground'>UGX {schoolEarnings.toLocaleString()}</td>
                    <td className='px-6 py-4 text-right'>
                      <Link href={`/platform/admin/schools/${s.id}`} className='text-primary text-xs font-semibold hover:underline'>
                        Manage →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
