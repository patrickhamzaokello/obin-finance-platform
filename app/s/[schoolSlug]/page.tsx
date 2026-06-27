import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { school, course } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { convertBlobUrlToApiUrl } from '@/lib/blob-url';
import Link from 'next/link';
import { BookOpen, Play, ArrowRight, GraduationCap } from 'lucide-react';

export default async function SchoolLandingPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;

  const schoolRows = await db.select().from(school).where(eq(school.slug, schoolSlug)).limit(1);
  if (!schoolRows.length) notFound();
  const s = schoolRows[0];

  const courses = await db
    .select()
    .from(course)
    .where(and(eq(course.schoolId, s.id), eq(course.isPublished, true)));

  return (
    <div className='min-h-screen bg-[#f4f7f5]'>
      {/* Header */}
      <header className='bg-white border-b border-border'>
        <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            {s.logoUrl && (
              <img src={convertBlobUrlToApiUrl(s.logoUrl)} alt={s.name} className='h-9 w-auto object-contain' />
            )}
            <span className='text-lg font-bold text-foreground'>{s.name}</span>
          </div>
          <Link
            href='/sign-in'
            className='inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded hover:bg-primary/90 transition-colors'
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className='bg-white border-b border-border'>
        <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center'>
          <h1 className='text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-tight'>
            Learn with <span className='text-primary'>{s.name}</span>
          </h1>
          <p className='text-lg text-muted-foreground mt-4 max-w-xl mx-auto'>
            Expert-led courses designed to help you grow. Enroll today and start learning at your own pace.
          </p>
          <div className='flex items-center justify-center gap-3 mt-8'>
            <Link
              href='/sign-up'
              className='inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded hover:bg-primary/90 transition-colors'
            >
              <GraduationCap size={16} /> Get started free
            </Link>
            <Link
              href='#courses'
              className='inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground font-semibold rounded hover:bg-secondary transition-colors'
            >
              Browse courses <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Courses */}
      <section id='courses' className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        <h2 className='text-2xl font-bold text-foreground mb-8 flex items-center gap-2'>
          <div className='w-[3px] h-6 bg-primary rounded-full' />
          Available Courses
        </h2>

        {courses.length === 0 ? (
          <div className='text-center py-16 text-muted-foreground'>
            <BookOpen className='w-10 h-10 mx-auto mb-3 opacity-40' />
            <p className='font-medium'>No courses available yet.</p>
            <p className='text-sm mt-1'>Check back soon.</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
            {courses.map((c) => (
              <Link
                key={c.id}
                href={`/course/${c.id}`}
                className='bg-white border border-border rounded overflow-hidden hover:shadow-md hover:border-primary/30 transition-all group block'
              >
                {c.thumbnail ? (
                  <div className='aspect-video overflow-hidden bg-muted'>
                    <img
                      src={convertBlobUrlToApiUrl(c.thumbnail)}
                      alt={c.title}
                      className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                    />
                  </div>
                ) : (
                  <div className='aspect-video bg-primary/8 flex items-center justify-center'>
                    <Play className='w-10 h-10 text-primary/40' />
                  </div>
                )}
                <div className='p-4'>
                  <h3 className='font-semibold text-foreground leading-snug group-hover:text-primary transition-colors'>
                    {c.title}
                  </h3>
                  {c.instructor && (
                    <p className='text-xs text-muted-foreground mt-1'>by {c.instructor}</p>
                  )}
                  {c.description && (
                    <p className='text-sm text-muted-foreground mt-2 line-clamp-2'>{c.description}</p>
                  )}
                  <div className='mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary'>
                    View course <ArrowRight size={11} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
