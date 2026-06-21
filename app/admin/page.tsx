import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAllCourses, getAllUsers } from '@/app/actions/admin';
import { getUserWithRole } from '@/lib/user-utils';

export default async function AdminDashboard() {
  const userWithRole = await getUserWithRole();

  if (!userWithRole || userWithRole.role !== 'admin') {
    redirect('/sign-in');
  }

  const coursesResult = await getAllCourses();
  const usersResult = await getAllUsers();

  const courses = coursesResult.success ? coursesResult.data : [];
  const users = usersResult.success ? usersResult.data : [];

  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='bg-white shadow'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Admin Dashboard</h1>
            <p className='text-gray-600 mt-1'>Obin Finance Learning Platform</p>
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
        {/* Navigation */}
        <nav className='mb-8 flex gap-4'>
          <Link
            href='/admin'
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold'
          >
            Dashboard
          </Link>
          <Link
            href='/admin/courses'
            className='px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-semibold'
          >
            Courses
          </Link>
          <Link
            href='/admin/users'
            className='px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-semibold'
          >
            Users
          </Link>
        </nav>

        {/* Statistics */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12'>
          <div className='bg-white rounded-lg shadow p-6'>
            <h3 className='text-gray-600 text-sm font-semibold'>Total Courses</h3>
            <p className='text-3xl font-bold text-gray-900 mt-2'>{courses.length}</p>
          </div>
          <div className='bg-white rounded-lg shadow p-6'>
            <h3 className='text-gray-600 text-sm font-semibold'>Published Courses</h3>
            <p className='text-3xl font-bold text-gray-900 mt-2'>
              {courses.filter((c: any) => c.isPublished).length}
            </p>
          </div>
          <div className='bg-white rounded-lg shadow p-6'>
            <h3 className='text-gray-600 text-sm font-semibold'>Total Users</h3>
            <p className='text-3xl font-bold text-gray-900 mt-2'>{users.length}</p>
          </div>
          <div className='bg-white rounded-lg shadow p-6'>
            <h3 className='text-gray-600 text-sm font-semibold'>Admin Users</h3>
            <p className='text-3xl font-bold text-gray-900 mt-2'>{users.filter((u: any) => u.role === 'admin').length}</p>
          </div>
        </div>

        {/* Recent Courses */}
        <section className='mb-12'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-2xl font-bold text-gray-900'>Recent Courses</h2>
            <Link
              href='/admin/courses/new'
              className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition'
            >
              Create Course
            </Link>
          </div>

          {courses.length === 0 ? (
            <p className='text-gray-600'>No courses yet. Create your first course!</p>
          ) : (
            <div className='bg-white rounded-lg shadow overflow-hidden'>
              <table className='w-full'>
                <thead className='bg-gray-100 border-b'>
                  <tr>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Title</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Instructor</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Status</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Created</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Actions</th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {courses.slice(0, 5).map((c: any) => (
                    <tr key={c.id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 text-sm text-gray-900'>{c.title}</td>
                      <td className='px-6 py-4 text-sm text-gray-600'>{c.instructor || 'N/A'}</td>
                      <td className='px-6 py-4 text-sm'>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            c.isPublished
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {c.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className='px-6 py-4 text-sm'>
                        <Link
                          href={`/admin/courses/${c.id}`}
                          className='text-blue-600 hover:text-blue-700 font-semibold'
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Quick Links */}
        <section className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='bg-blue-50 rounded-lg shadow p-6 border-l-4 border-blue-600'>
            <h3 className='text-lg font-semibold text-gray-900'>Course Management</h3>
            <p className='text-gray-600 mt-2'>Create, edit, and manage your courses and course content.</p>
            <Link
              href='/admin/courses'
              className='mt-4 inline-block text-blue-600 hover:text-blue-700 font-semibold'
            >
              Go to Courses →
            </Link>
          </div>
          <div className='bg-purple-50 rounded-lg shadow p-6 border-l-4 border-purple-600'>
            <h3 className='text-lg font-semibold text-gray-900'>User Management</h3>
            <p className='text-gray-600 mt-2'>Manage user accounts and assign admin roles.</p>
            <Link
              href='/admin/users'
              className='mt-4 inline-block text-purple-600 hover:text-purple-700 font-semibold'
            >
              Go to Users →
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
