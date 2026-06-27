import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getPublishedCourses, getUserEnrolledCourses } from '@/app/actions/courses';
import { getUserWithRole } from '@/lib/user-utils';
import { SignOutButton } from '@/components/sign-out-button';
import { BookOpen, ChevronRight } from 'lucide-react';

export default async function Dashboard() {
  const userWithRole = await getUserWithRole();

  if (!userWithRole) redirect('/sign-in');
  if (userWithRole.role === 'admin') redirect('/admin');

  const allCoursesResult = await getPublishedCourses();
  const enrolledCoursesResult = await getUserEnrolledCourses();

  const allCourses = allCoursesResult.success ? allCoursesResult.data : [];
  const enrolledCourses = enrolledCoursesResult.success ? enrolledCoursesResult.data : [];
  const enrolledCourseIds = new Set(enrolledCourses.map((c: any) => c.id));

  const availableCourses = allCourses.filter((c: any) => !enrolledCourseIds.has(c.id));

  return (
    <div className='min-h-screen bg-[#f9fafb]'>
      {/* Header */}
      <header className='bg-white border-b border-border'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex justify-between items-center'>
          <div className='flex items-center gap-4'>
            <div className='w-[3px] h-9 bg-primary rounded-full' />
            <div>
              <h1 className='text-xl font-bold text-foreground tracking-tight'>Obin Finance</h1>
              <p className='text-xs text-muted-foreground mt-0.5'>
                Welcome back, {userWithRole.name || userWithRole.email}
              </p>
            </div>
          </div>
          <SignOutButton className='px-4 py-2 text-sm font-semibold border border-border text-foreground rounded hover:bg-secondary hover:border-muted-foreground transition-colors' />
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10'>

        {/* My Courses */}
        {enrolledCourses.length > 0 && (
          <section className='mb-14'>
            <div className='flex items-center gap-3 mb-6'>
              <BookOpen className='w-4 h-4 text-primary' />
              <h2 className='text-lg font-semibold text-foreground'>My Courses</h2>
              <span className='ml-auto text-xs text-muted-foreground'>{enrolledCourses.length} enrolled</span>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
              {enrolledCourses.map((c: any) => (
                <Link href={`/learning/${c.id}`} key={c.id}>
                  <div className='group bg-white border border-border border-l-[3px] border-l-primary rounded overflow-hidden hover:shadow-md hover:border-primary transition-all duration-200 h-full flex flex-col cursor-pointer'>
                    <div className='relative overflow-hidden h-44 bg-muted'>
                      {c.thumbnail ? (
                        <img
                          src={c.thumbnail}
                          alt={c.title}
                          className='w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300'
                        />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center'>
                          <BookOpen className='w-8 h-8 text-border' />
                        </div>
                      )}
                    </div>
                    <div className='p-4 flex-1 flex flex-col'>
                      <span className='badge-published self-start mb-3'>In Progress</span>
                      <h3 className='font-semibold text-foreground leading-snug'>{c.title}</h3>
                      <p className='text-muted-foreground text-sm mt-2 line-clamp-2 flex-1'>{c.description}</p>
                      <div className='mt-4 flex items-center justify-between text-sm'>
                        <span className='font-semibold text-primary'>Continue Learning</span>
                        <ChevronRight className='w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors' />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Available Courses */}
        <section>
          <div className='flex items-center gap-3 mb-6'>
            <h2 className='text-lg font-semibold text-foreground'>
              {enrolledCourses.length > 0 ? 'Explore More Courses' : 'Available Courses'}
            </h2>
            {availableCourses.length > 0 && (
              <span className='ml-auto text-xs text-muted-foreground'>{availableCourses.length} available</span>
            )}
          </div>

          {allCourses.length === 0 ? (
            <div className='card-accent p-10 text-center'>
              <p className='text-muted-foreground text-sm'>No courses available yet. Check back soon.</p>
            </div>
          ) : availableCourses.length === 0 && enrolledCourses.length > 0 ? (
            <div className='card-accent p-10 text-center'>
              <p className='text-sm font-semibold text-foreground mb-1'>You&apos;re enrolled in all available courses.</p>
              <p className='text-muted-foreground text-sm'>New courses are added regularly — check back soon.</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
              {availableCourses.map((c: any) => (
                <Link href={`/course/${c.id}`} key={c.id}>
                  <div className='group bg-white border border-border rounded overflow-hidden hover:border-primary hover:shadow-md transition-all duration-200 h-full flex flex-col cursor-pointer'>
                    <div className='relative overflow-hidden h-44 bg-muted'>
                      {c.thumbnail ? (
                        <img
                          src={c.thumbnail}
                          alt={c.title}
                          className='w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300'
                        />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center'>
                          <BookOpen className='w-8 h-8 text-border' />
                        </div>
                      )}
                    </div>
                    <div className='p-4 flex-1 flex flex-col'>
                      <h3 className='font-semibold text-foreground leading-snug'>{c.title}</h3>
                      <p className='text-muted-foreground text-sm mt-2 line-clamp-2 flex-1'>{c.description}</p>
                      {c.instructor && (
                        <p className='text-xs text-muted-foreground mt-3'>By {c.instructor}</p>
                      )}
                      <div className='mt-4 flex items-center justify-between text-sm'>
                        <span className='font-semibold text-primary'>View Course</span>
                        <ChevronRight className='w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors' />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
