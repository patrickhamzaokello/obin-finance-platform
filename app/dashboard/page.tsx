import { auth } from '@/lib/auth';
import { redirect, headers as getHeaders } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { getPublishedCourses, getUserEnrolledCourses } from '@/app/actions/courses';

export default async function Dashboard() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect('/sign-in');
  }

  if (session.user.role === 'admin') {
    redirect('/admin');
  }

  const allCoursesResult = await getPublishedCourses();
  const enrolledCoursesResult = await getUserEnrolledCourses();

  const allCourses = allCoursesResult.success ? allCoursesResult.data : [];
  const enrolledCourses = enrolledCoursesResult.success ? enrolledCoursesResult.data : [];
  const enrolledCourseIds = new Set(enrolledCourses.map((c: any) => c.id));

  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='bg-white shadow'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Obin Finance</h1>
            <p className='text-gray-600 mt-1'>Welcome, {session.user.name || session.user.email}</p>
          </div>
          <button
            onClick={async () => {
              'use server';
              await auth.api.signOut({ headers: await headers() });
              redirect('/');
            }}
            className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition'
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        {/* Enrolled Courses Section */}
        {enrolledCourses.length > 0 && (
          <section className='mb-12'>
            <h2 className='text-2xl font-bold text-gray-900 mb-6'>My Courses</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {enrolledCourses.map((c: any) => (
                <Link href={`/learning/${c.id}`} key={c.id}>
                  <div className='bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden cursor-pointer h-full'>
                    {c.thumbnail && (
                      <img src={c.thumbnail} alt={c.title} className='w-full h-48 object-cover' />
                    )}
                    <div className='p-4'>
                      <h3 className='text-lg font-semibold text-gray-900'>{c.title}</h3>
                      <p className='text-gray-600 text-sm mt-2 line-clamp-2'>{c.description}</p>
                      <div className='mt-4 flex justify-between items-center'>
                        <span className='text-blue-600 font-semibold text-sm'>Continue Learning</span>
                        <span className='text-gray-400'>→</span>
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
          <h2 className='text-2xl font-bold text-gray-900 mb-6'>
            {enrolledCourses.length > 0 ? 'Explore More Courses' : 'Available Courses'}
          </h2>
          {allCourses.length === 0 ? (
            <p className='text-gray-600'>No courses available yet.</p>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {allCourses
                .filter((c: any) => !enrolledCourseIds.has(c.id))
                .map((c: any) => (
                  <div key={c.id} className='bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden'>
                    {c.thumbnail && (
                      <img src={c.thumbnail} alt={c.title} className='w-full h-48 object-cover' />
                    )}
                    <div className='p-4'>
                      <h3 className='text-lg font-semibold text-gray-900'>{c.title}</h3>
                      <p className='text-gray-600 text-sm mt-2 line-clamp-2'>{c.description}</p>
                      {c.instructor && <p className='text-gray-500 text-xs mt-3'>Instructor: {c.instructor}</p>}
                      <button
                        onClick={async () => {
                          'use server';
                          const { enrollCourse } = await import('@/app/actions/courses');
                          await enrollCourse(c.id);
                          redirect(`/learning/${c.id}`);
                        }}
                        className='mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition'
                      >
                        Enroll Now
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
