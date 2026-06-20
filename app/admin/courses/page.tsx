'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAllCourses } from '@/app/actions/admin';

export default function CoursesList() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      const result = await getAllCourses();
      if (result.success) {
        setCourses(result.data);
      }
      setLoading(false);
    };

    loadCourses();
  }, []);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-lg text-gray-600'>Loading courses...</div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='bg-white shadow'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <h1 className='text-3xl font-bold text-gray-900'>Course Management</h1>
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='flex justify-between items-center mb-6'>
          <h2 className='text-2xl font-bold text-gray-900'>All Courses</h2>
          <Link
            href='/admin/courses/new'
            className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition'
          >
            Create New Course
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className='bg-white rounded-lg shadow p-8 text-center'>
            <p className='text-gray-600 mb-4'>No courses yet.</p>
            <Link
              href='/admin/courses/new'
              className='text-blue-600 hover:text-blue-700 font-semibold'
            >
              Create your first course →
            </Link>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {courses.map((course) => (
              <div key={course.id} className='bg-white rounded-lg shadow hover:shadow-lg transition'>
                {course.thumbnail && (
                  <img src={course.thumbnail} alt={course.title} className='w-full h-48 object-cover' />
                )}
                <div className='p-4'>
                  <h3 className='text-lg font-semibold text-gray-900'>{course.title}</h3>
                  <p className='text-gray-600 text-sm mt-2 line-clamp-2'>{course.description}</p>
                  {course.instructor && <p className='text-gray-500 text-xs mt-3'>Instructor: {course.instructor}</p>}

                  <div className='mt-4 flex items-center justify-between'>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        course.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                    <Link
                      href={`/admin/courses/${course.id}`}
                      className='text-blue-600 hover:text-blue-700 font-semibold text-sm'
                    >
                      Edit →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className='mt-8'>
          <Link href='/admin' className='text-blue-600 hover:text-blue-700 font-semibold'>
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
