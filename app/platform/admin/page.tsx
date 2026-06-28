import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Platform Overview' };

import { db } from '@/lib/db';
import { school, user, schoolMember, courseEnrollment, course } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { Building2, Users, BookOpen, GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default async function PlatformDashboard() {
  const [schools, totalUsers, totalCourses, totalEnrollments] = await Promise.all([
    db.select().from(school).orderBy(school.createdAt),
    db.select({ count: sql<number>`count(*)` }).from(user),
    db.select({ count: sql<number>`count(*)` }).from(course),
    db.select({ count: sql<number>`count(*)` }).from(courseEnrollment),
  ]);

  const stats = [
    { label: 'Schools',     value: schools.length,                   icon: Building2 },
    { label: 'Users',       value: Number(totalUsers[0]?.count ?? 0), icon: Users },
    { label: 'Courses',     value: Number(totalCourses[0]?.count ?? 0), icon: BookOpen },
    { label: 'Enrollments', value: Number(totalEnrollments[0]?.count ?? 0), icon: GraduationCap },
  ];

  return (
    <div className='px-8 py-8'>
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-foreground'>Platform Overview</h1>
        <p className='text-sm text-muted-foreground mt-1'>All schools and activity across the platform</p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10'>
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className='bg-white rounded-2xl shadow-sm p-5'>
            <div className='flex items-center justify-between mb-2'>
              <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>{label}</p>
              <Icon size={15} className='text-primary' />
            </div>
            <p className='text-3xl font-bold text-foreground'>{value}</p>
          </div>
        ))}
      </div>

      {/* Schools list */}
      <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
        <div className='px-6 py-4 border-b border-black/[0.06] flex items-center justify-between'>
          <h2 className='text-sm font-semibold text-foreground'>Schools</h2>
          <Link href='/platform/admin/schools/new'
            className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors'
          >
            + Add school
          </Link>
        </div>
        {schools.length === 0 ? (
          <div className='px-6 py-12 text-center text-muted-foreground text-sm'>
            No schools yet. <Link href='/platform/admin/schools/new' className='text-primary underline'>Create the first one.</Link>
          </div>
        ) : (
          <table className='w-full text-sm'>
            <thead className='bg-secondary text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              <tr>
                <th className='px-6 py-3 text-left'>School</th>
                <th className='px-6 py-3 text-left'>Slug</th>
                <th className='px-6 py-3 text-left'>Created</th>
                <th className='px-6 py-3 text-left'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border'>
              {schools.map((s) => (
                <tr key={s.id} className='hover:bg-secondary/40 transition-colors'>
                  <td className='px-6 py-4 font-medium text-foreground'>{s.name}</td>
                  <td className='px-6 py-4 text-muted-foreground font-mono text-xs'>{s.slug}</td>
                  <td className='px-6 py-4 text-muted-foreground'>
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className='px-6 py-4 text-right'>
                    <Link href={`/platform/admin/schools/${s.id}`}
                      className='text-primary text-xs font-semibold hover:underline'
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
