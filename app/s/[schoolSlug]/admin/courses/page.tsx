'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllCourses, deleteCourse } from '@/app/actions/admin';
import { BookOpen, Search, Plus, Trash2 } from 'lucide-react';

export default function CoursesList() {
  const [courses, setCourses]             = useState<any[]>([]);
  const [filteredCourses, setFiltered]    = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [searchTerm, setSearchTerm]       = useState('');
  const [filterStatus, setFilterStatus]   = useState('all');

  useEffect(() => {
    getAllCourses().then((r) => {
      if (r.success) { setCourses(r.data); setFiltered(r.data); }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let f = courses;
    if (searchTerm) f = f.filter((c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filterStatus !== 'all') f = f.filter((c) => filterStatus === 'published' ? c.isPublished : !c.isPublished);
    setFiltered(f);
  }, [searchTerm, filterStatus, courses]);

  const handleDelete = async (courseId: string) => {
    if (!confirm('Delete this course? This cannot be undone.')) return;
    const result = await deleteCourse(courseId);
    if (result.success) setCourses(courses.filter((c) => c.id !== courseId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Courses</h1>
          <p className="text-sm text-muted-foreground mt-1">{filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/admin/courses/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus size={14} /> New Course
        </Link>
      </div>

      {/* Search + filter */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search courses…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-secondary rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm bg-secondary rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Grid */}
      {courses.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <BookOpen className="w-8 h-8 text-border mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">No courses yet.</p>
          <Link href="/admin/courses/new" className="text-sm font-semibold text-primary hover:underline">
            Create your first course →
          </Link>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <p className="text-sm text-muted-foreground">No courses match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col group">
              <div className="w-full h-44 bg-secondary overflow-hidden">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-border" />
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-foreground leading-snug flex-1">{course.title}</h3>
                  <span className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                    course.isPublished ? 'bg-green-50 text-green-700' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {course.isPublished ? 'Live' : 'Draft'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{course.description || 'No description'}</p>
                {course.instructor && (
                  <p className="text-xs text-muted-foreground mt-2">By {course.instructor}</p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  {(course.price ?? 0) === 0 ? (
                    <span className="text-xs font-semibold text-primary">Free</span>
                  ) : (
                    <>
                      <span className="text-xs font-semibold text-foreground">
                        UGX {(course.discountActive && (course.discountPercent ?? 0) > 0
                          ? Math.round((course.price ?? 0) * (1 - (course.discountPercent ?? 0) / 100))
                          : (course.price ?? 0)
                        ).toLocaleString()}
                      </span>
                      {course.discountActive && (course.discountPercent ?? 0) > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-50 text-red-600 rounded-full">
                          -{course.discountPercent}% off
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="flex-1 py-2 text-xs font-semibold text-center bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="w-9 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/8 rounded-xl transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
