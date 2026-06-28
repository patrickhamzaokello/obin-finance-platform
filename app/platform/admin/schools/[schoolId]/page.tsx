import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { school, schoolMember, user, course } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowLeft, Users, BookOpen, ExternalLink } from 'lucide-react';
import { AddSchoolAdminForm } from './add-admin-form';

export default async function PlatformSchoolDetailPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;

  const schoolRows = await db.select().from(school).where(eq(school.id, schoolId)).limit(1);
  if (!schoolRows.length) notFound();
  const s = schoolRows[0];

  const [members, courses] = await Promise.all([
    db
      .select({ member: schoolMember, user })
      .from(schoolMember)
      .innerJoin(user, eq(schoolMember.userId, user.id))
      .where(eq(schoolMember.schoolId, schoolId)),
    db.select().from(course).where(eq(course.schoolId, schoolId)),
  ]);

  return (
    <div className='px-8 py-8 max-w-4xl'>
      <Link href="/platform/admin/schools" className='inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors'>
        <ArrowLeft size={14} /> All schools
      </Link>

      {(() => {
        const base = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000';
        const schoolUrl = base.startsWith('localhost')
          ? `http://${s.slug}.${base}`
          : `https://${s.slug}.${base}`;
        return (
          <div className='flex items-start justify-between mb-8'>
            <div>
              <h1 className='text-2xl font-bold text-foreground'>{s.name}</h1>
              <p className='text-sm text-muted-foreground font-mono mt-1'>{s.slug}.{base}</p>
            </div>
            <a href={schoolUrl} target='_blank' rel='noreferrer'
              className='inline-flex items-center gap-2 px-4 py-2 border border-border text-sm font-semibold rounded hover:bg-secondary transition-colors'>
              <ExternalLink size={14} /> Open school
            </a>
          </div>
        );
      })()}

      <div className='grid grid-cols-2 gap-4 mb-8'>
        <div className='bg-white border border-border border-l-[3px] border-l-primary rounded p-5'>
          <div className='flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1'>
            <Users size={13} /> Members
          </div>
          <p className='text-3xl font-bold text-foreground'>{members.length}</p>
        </div>
        <div className='bg-white border border-border border-l-[3px] border-l-primary rounded p-5'>
          <div className='flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1'>
            <BookOpen size={13} /> Courses
          </div>
          <p className='text-3xl font-bold text-foreground'>{courses.length}</p>
        </div>
      </div>

      {/* Members */}
      <div className='bg-white border border-border rounded overflow-hidden mb-6'>
        <div className='px-6 py-4 border-b border-border flex items-center justify-between'>
          <h2 className='text-sm font-semibold text-foreground'>Members</h2>
          <AddSchoolAdminForm schoolId={schoolId} />
        </div>
        {members.length === 0 ? (
          <p className='px-6 py-8 text-sm text-muted-foreground text-center'>No members yet.</p>
        ) : (
          <table className='w-full text-sm'>
            <thead className='bg-secondary text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              <tr>
                <th className='px-6 py-3 text-left'>Name</th>
                <th className='px-6 py-3 text-left'>Email</th>
                <th className='px-6 py-3 text-left'>Role</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border'>
              {members.map(({ member, user: u }) => (
                <tr key={member.id} className='hover:bg-secondary/40'>
                  <td className='px-6 py-3 font-medium'>{u.name || '—'}</td>
                  <td className='px-6 py-3 text-muted-foreground'>{u.email}</td>
                  <td className='px-6 py-3'>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                      member.role === 'school_admin'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-secondary text-muted-foreground'
                    }`}>
                      {member.role === 'school_admin' ? 'Admin' : 'Learner'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Courses */}
      <div className='bg-white border border-border rounded overflow-hidden'>
        <div className='px-6 py-4 border-b border-border'>
          <h2 className='text-sm font-semibold text-foreground'>Courses</h2>
        </div>
        {courses.length === 0 ? (
          <p className='px-6 py-8 text-sm text-muted-foreground text-center'>No courses yet.</p>
        ) : (
          <ul className='divide-y divide-border'>
            {courses.map((c) => (
              <li key={c.id} className='px-6 py-3 flex items-center justify-between hover:bg-secondary/40'>
                <span className='text-sm font-medium text-foreground'>{c.title}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${c.isPublished ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                  {c.isPublished ? 'Published' : 'Draft'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
