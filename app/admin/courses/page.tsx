'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAllCourses, deleteCourse } from '@/app/actions/admin';

export default function CoursesList() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const loadCourses = async () => {
      const result = await getAllCourses();
      if (result.success) {
        setCourses(result.data);
        setFilteredCourses(result.data);
      }
      setLoading(false);
    };

    loadCourses();
  }, []);

  useEffect(() => {
    let filtered = courses;

    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(
        (course) => (filterStatus === 'published' ? course.isPublished : !course.isPublished)
      );
    }

    setFilteredCourses(filtered);
  }, [searchTerm, filterStatus, courses]);

  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    const result = await deleteCourse(courseId);
    if (result.success) {
      setCourses(courses.filter((c) => c.id !== courseId));
      alert('Course deleted successfully');
    }
  };

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
        <div className='bg-white rounded-lg shadow p-6 mb-6'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-2xl font-bold text-gray-900'>All Courses ({filteredCourses.length})</h2>
            <Link
              href='/admin/courses/new'
              className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold'
            >
              + Create New Course
            </Link>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <div>
              <label className='block text-sm font-semibold text-gray-900 mb-2'>Search Courses</label>
              <input
                type='text'
                placeholder='Search by title or description...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
              />
            </div>
            <div>
              <label className='block text-sm font-semibold text-gray-900 mb-2'>Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
              >
                <option value='all'>All Courses</option>
                <option value='published'>Published</option>
                <option value='draft'>Draft</option>
              </select>
            </div>
          </div>

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
        ) : filteredCourses.length === 0 ? (
          <div className='bg-white rounded-lg shadow p-8 text-center'>
            <p className='text-gray-600 mb-4'>No courses match your search.</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredCourses.map((course) => (
              <div key={course.id} className='bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden'>
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className='w-full h-48 object-cover' />
                ) : (
                  <div className='w-full h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center'>
                    <span className='text-white text-xl font-bold'>No Image</span>
                  </div>
                )}
                <div className='p-4'>
                  <h3 className='text-lg font-semibold text-gray-900'>{course.title}</h3>
                  <p className='text-gray-600 text-sm mt-2 line-clamp-2'>{course.description || 'No description'}</p>
                  {course.instructor && <p className='text-gray-500 text-xs mt-3'>By {course.instructor}</p>}

                  <div className='mt-4 flex items-center justify-between gap-2'>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        course.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                    <div className='flex gap-2'>
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className='px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition'
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className='px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition'
                      >
                        Delete
                      </button>
                    </div>
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
