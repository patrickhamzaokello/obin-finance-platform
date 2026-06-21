import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getPublishedCourses, getUserEnrolledCourses } from '@/app/actions/courses';
import { getUserWithRole } from '@/lib/user-utils';
import { SignOutButton } from '@/components/sign-out-button';

export default async function Dashboard() {
  const userWithRole = await getUserWithRole();

  if (!userWithRole) {
    redirect('/sign-in');
  }

  if (userWithRole.role === 'admin') {
    redirect('/admin');
  }

  const allCoursesResult = await getPublishedCourses();
  const enrolledCoursesResult = await getUserEnrolledCourses();

  const allCourses = allCoursesResult.success ? allCoursesResult.data : [];
  const enrolledCourses = enrolledCoursesResult.success ? enrolledCoursesResult.data : [];
  const enrolledCourseIds = new Set(enrolledCourses.map((c: any) => c.id));

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='border-b border-border bg-card'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-semibold text-foreground'>Obin Finance</h1>
            <p className='text-muted-foreground mt-1'>Welcome, {userWithRole.name || userWithRole.email}</p>
          </div>
          <SignOutButton className='px-4 py-2 bg-destructive text-primary-foreground rounded-md hover:bg-destructive/90 transition-colors font-medium border-2 border-destructive' />
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        {/* Enrolled Courses Section */}
        {enrolledCourses.length > 0 && (
          <section className='mb-16'>
            <h2 className='text-2xl font-semibold text-foreground mb-6'>My Courses</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {enrolledCourses.map((c: any) => (
                <Link href={`/learning/${c.id}`} key={c.id}>
                  <div className='group bg-card border border-border rounded-lg overflow-hidden hover:border-primary hover:shadow-md transition-all cursor-pointer h-full'>
                    <div className='relative overflow-hidden h-48 bg-muted'>
                      {c.thumbnail && (
                        <img src={c.thumbnail} alt={c.title} className='w-full h-full object-cover group-hover:scale-105 transition-transform' />
                      )}
                      <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors'></div>
                    </div>
                    <div className='p-4'>
                      <div className='mb-2 inline-block px-2 py-1 bg-accent/10 text-accent rounded text-xs font-medium'>In Progress</div>
                      <h3 className='text-lg font-semibold text-foreground'>{c.title}</h3>
                      <p className='text-muted-foreground text-sm mt-2 line-clamp-2'>{c.description}</p>
                      <div className='mt-4 flex justify-between items-center'>
                        <span className='text-primary font-medium text-sm'>Continue Learning</span>
                        <span className='text-muted-foreground group-hover:text-primary transition-colors'>→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Available Courses Section */}
        <section>
          <h2 className='text-2xl font-semibold text-foreground mb-6'>
            {enrolledCourses.length > 0 ? 'Explore More Courses' : 'Available Courses'}
          </h2>
          {allCourses.length === 0 ? (
            <div className='text-center py-12 bg-card rounded-lg border border-border'>
              <p className='text-muted-foreground'>No courses available yet.</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {allCourses
                .filter((c: any) => !enrolledCourseIds.has(c.id))
                .map((c: any) => (
                  <Link href={`/course/${c.id}`} key={c.id}>
                    <div className='group bg-card border border-border rounded-lg overflow-hidden hover:border-primary hover:shadow-md transition-all cursor-pointer h-full flex flex-col'>
                      <div className='relative overflow-hidden h-48 bg-muted'>
                        {c.thumbnail && (
                          <img src={c.thumbnail} alt={c.title} className='w-full h-full object-cover group-hover:scale-105 transition-transform' />
                        )}
                        <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors'></div>
                      </div>
                      <div className='p-4 flex-1 flex flex-col'>
                        <h3 className='text-lg font-semibold text-foreground'>{c.title}</h3>
                        <p className='text-muted-foreground text-sm mt-2 line-clamp-2 flex-1'>{c.description}</p>
                        {c.instructor && <p className='text-muted-foreground text-xs mt-3'>Taught by {c.instructor}</p>}
                        <div className='mt-4 flex justify-between items-center'>
                          <span className='text-primary font-medium text-sm'>View Course</span>
                          <span className='text-muted-foreground group-hover:text-primary transition-colors'>→</span>
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
