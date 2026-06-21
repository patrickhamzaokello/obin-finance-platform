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
      console.log('[v0] getAllCourses result:', result);
      if (result.success) {
        setCourses(result.data);
        setFilteredCourses(result.data);
      } else {
        console.error('[v0] Failed to fetch courses:', result.error);
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
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='text-lg text-foreground'>Loading courses...</div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white'>
      {/* Header */}
      <header className='border-b-2 border-border bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <h1 className='text-3xl font-semibold text-foreground'>Course Management</h1>
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        {/* Controls Section */}
        <div className='border-2 border-border bg-white p-6 mb-6'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-2xl font-semibold text-foreground'>All Courses ({filteredCourses.length})</h2>
            <Link
              href='/admin/courses/new'
              className='px-4 py-2 bg-primary text-primary-foreground border-2 border-primary font-semibold hover:bg-primary/90 transition'
            >
              + Create New Course
            </Link>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-semibold text-foreground mb-2'>Search Courses</label>
              <input
                type='text'
                placeholder='Search by title or description...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full px-4 py-2 border-2 border-border rounded focus:border-primary focus:outline-none'
              />
            </div>
            <div>
              <label className='block text-sm font-semibold text-foreground mb-2'>Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className='w-full px-4 py-2 border-2 border-border rounded focus:border-primary focus:outline-none'
              >
                <option value='all'>All Courses</option>
                <option value='published'>Published</option>
                <option value='draft'>Draft</option>
              </select>
            </div>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className='border-2 border-border bg-white p-8 text-center'>
            <p className='text-muted-foreground mb-4'>No courses yet.</p>
            <Link
              href='/admin/courses/new'
              className='text-primary hover:text-primary/80 font-semibold'
            >
              Create your first course →
            </Link>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className='border-2 border-border bg-white p-8 text-center'>
            <p className='text-muted-foreground mb-4'>No courses match your search.</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredCourses.map((course) => (
              <div key={course.id} className='border-2 border-border bg-white overflow-hidden hover:border-primary transition'>
                <div className='w-full h-48 bg-secondary flex items-center justify-center overflow-hidden'>
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className='w-full h-full object-cover' />
                  ) : (
                    <span className='text-muted-foreground font-semibold'>No Image</span>
                  )}
                </div>
                <div className='p-4'>
                  <h3 className='text-lg font-semibold text-foreground'>{course.title}</h3>
                  <p className='text-muted-foreground text-sm mt-2 line-clamp-2'>{course.description || 'No description'}</p>
                  {course.instructor && <p className='text-muted-foreground text-xs mt-3'>By {course.instructor}</p>}

                  <div className='mt-4 space-y-3'>
                    <div className='flex items-center justify-between'>
                      <span
                        className={`px-3 py-1 border-2 font-semibold text-xs whitespace-nowrap ${
                          course.isPublished
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-secondary text-foreground'
                        }`}
                      >
                        {course.isPublished ? '✓ Published' : 'Draft'}
                      </span>
                    </div>
                    <div className='flex gap-2'>
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className='flex-1 px-3 py-2 text-xs bg-primary text-primary-foreground border-2 border-primary font-semibold hover:bg-primary/90 transition text-center'
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className='flex-1 px-3 py-2 text-xs bg-white text-destructive border-2 border-destructive font-semibold hover:bg-destructive/10 transition'
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
          <Link href='/admin' className='text-primary hover:text-primary/80 font-semibold'>
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
