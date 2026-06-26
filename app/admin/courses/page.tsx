'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllCourses, deleteCourse } from '@/app/actions/admin';
import { convertBlobUrlToApiUrl } from '@/lib/blob-url';
import { BookOpen, LayoutDashboard, Users, Search } from 'lucide-react';

export default function CoursesList() {
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
        (c) =>
          c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter((c) => (filterStatus === 'published' ? c.isPublished : !c.isPublished));
    }
    setFilteredCourses(filtered);
  }, [searchTerm, filterStatus, courses]);

  const handleDelete = async (courseId: string) => {
    if (!confirm('Delete this course? This cannot be undone.')) return;
    const result = await deleteCourse(courseId);
    if (result.success) {
      setCourses(courses.filter((c) => c.id !== courseId));
    }
  };

  const navLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/courses', label: 'Courses', icon: BookOpen },
    { href: '/admin/users', label: 'Users', icon: Users },
  ];

  if (loading) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3' />
          <p className='text-sm text-muted-foreground'>Loading courses…</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#f9fafb]'>
      {/* Header */}
      <header className='bg-white border-b border-border'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-4'>
          <div className='w-[3px] h-9 bg-primary rounded-full' />
          <div>
            <h1 className='text-xl font-bold text-foreground tracking-tight'>Course Management</h1>
            <p className='text-xs text-muted-foreground mt-0.5'>Obin Finance Learning Platform</p>
          </div>
        </div>
      </header>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>

        {/* Nav tabs */}
        <nav className='flex gap-1 mb-8 bg-white border border-border rounded p-1 w-fit'>
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/admin/courses';
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Icon size={14} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Toolbar */}
        <div className='bg-white border border-border rounded p-5 mb-6'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5'>
            <div>
              <h2 className='text-base font-semibold text-foreground'>All Courses</h2>
              <p className='text-xs text-muted-foreground mt-0.5'>{filteredCourses.length} result{filteredCourses.length !== 1 ? 's' : ''}</p>
            </div>
            <Link
              href='/admin/courses/new'
              className='inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded hover:bg-primary/90 transition-colors'
            >
              + New Course
            </Link>
          </div>

          <div className='flex flex-col sm:flex-row gap-3'>
            <div className='relative flex-1'>
              <Search size={14} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
              <input
                type='text'
                placeholder='Search by title or description…'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-9 pr-4 py-2 text-sm border border-border rounded focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30'
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className='px-3 py-2 text-sm border border-border rounded focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white'
            >
              <option value='all'>All Status</option>
              <option value='published'>Published</option>
              <option value='draft'>Draft</option>
            </select>
          </div>
        </div>

        {/* Course grid */}
        {courses.length === 0 ? (
          <div className='card-accent p-10 text-center'>
            <BookOpen className='w-8 h-8 text-border mx-auto mb-3' />
            <p className='text-sm text-muted-foreground mb-3'>No courses yet.</p>
            <Link href='/admin/courses/new' className='text-sm font-semibold text-primary hover:underline'>
              Create your first course →
            </Link>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className='card-accent p-10 text-center'>
            <p className='text-sm text-muted-foreground'>No courses match your search.</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className='bg-white border border-border rounded overflow-hidden hover:border-primary hover:shadow-md transition-all duration-200 flex flex-col'
              >
                <div className='w-full h-44 bg-secondary overflow-hidden'>
                  {course.thumbnail ? (
                    <img
                      src={convertBlobUrlToApiUrl(course.thumbnail)}
                      alt={course.title}
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center'>
                      <BookOpen className='w-8 h-8 text-border' />
                    </div>
                  )}
                </div>

                <div className='p-4 border-t-[3px] border-t-primary flex-1 flex flex-col'>
                  <div className='flex items-start justify-between gap-2 mb-2'>
                    <h3 className='text-sm font-semibold text-foreground leading-snug'>{course.title}</h3>
                    <span className={`shrink-0 ${course.isPublished ? 'badge-published' : 'badge-draft'}`}>
                      {course.isPublished ? 'Live' : 'Draft'}
                    </span>
                  </div>
                  <p className='text-xs text-muted-foreground line-clamp-2 flex-1'>{course.description || 'No description'}</p>
                  {course.instructor && (
                    <p className='text-xs text-muted-foreground mt-2'>By {course.instructor}</p>
                  )}
                  <div className='mt-4 flex gap-2'>
                    <Link
                      href={`/admin/courses/${course.id}`}
                      className='flex-1 py-2 text-xs font-semibold text-center bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors'
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(course.id)}
                      className='flex-1 py-2 text-xs font-semibold text-center border border-destructive text-destructive rounded hover:bg-destructive/6 transition-colors'
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className='mt-8'>
          <Link href='/admin' className='text-sm font-semibold text-primary hover:underline'>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
