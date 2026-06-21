'use client';

import { useEffect, useState } from 'react';
import { getCourseWithEnrollmentStatus } from '@/app/actions/courses';
import { EnrollButton } from '@/components/enroll-button';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Play, FileText } from 'lucide-react';

interface CourseDetails {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructor: string;
  isPublished: boolean;
  modules: Array<{
    id: string;
    title: string;
    description: string;
    videos: Array<{ id: string; title: string }>;
    pdfs: Array<{ id: string; title: string }>;
  }>;
  isEnrolled: boolean;
}

export default function CoursePage({ params }: { params: { courseId: string } }) {
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCourse = async () => {
      const result = await getCourseWithEnrollmentStatus(params.courseId);
      if (result.success) {
        setCourse(result.data as any);
      } else {
        setError(result.error || 'Failed to load course');
      }
      setLoading(false);
    };

    loadCourse();
  }, [params.courseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Course Not Found</h2>
          <p className="text-muted-foreground mb-6">{error || 'The course you are looking for does not exist.'}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const totalVideos = course.modules.reduce((sum, mod) => sum + mod.videos.length, 0);
  const totalPdfs = course.modules.reduce((sum, mod) => sum + mod.pdfs.length, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Courses
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Course Info */}
          <div className="lg:col-span-2">
            {/* Thumbnail */}
            {course.thumbnail && (
              <div className="mb-8 rounded-lg overflow-hidden bg-muted h-80">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Course Title and Instructor */}
            <h1 className="text-4xl font-semibold text-foreground mb-2">{course.title}</h1>
            {course.instructor && (
              <p className="text-lg text-muted-foreground mb-6">Taught by {course.instructor}</p>
            )}

            {/* Course Description */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">About This Course</h2>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">{course.description}</p>
            </div>

            {/* Course Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-card rounded-lg border border-border">
              <div className="text-center">
                <div className="text-2xl font-semibold text-primary">{course.modules.length}</div>
                <div className="text-sm text-muted-foreground">Modules</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-primary">{totalVideos}</div>
                <div className="text-sm text-muted-foreground">Videos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-primary">{totalPdfs}</div>
                <div className="text-sm text-muted-foreground">Resources</div>
              </div>
            </div>

            {/* Course Structure */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-6">Course Structure</h2>
              <div className="space-y-4">
                {course.modules.map((mod, index) => (
                  <div key={mod.id} className="p-4 bg-card rounded-lg border border-border">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{mod.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{mod.description}</p>
                      </div>
                    </div>

                    {/* Module Content Preview */}
                    {(mod.videos.length > 0 || mod.pdfs.length > 0) && (
                      <div className="ml-11 mt-4 space-y-2">
                        {mod.videos.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Play size={14} />
                            <span>{mod.videos.length} video{mod.videos.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {mod.pdfs.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText size={14} />
                            <span>{mod.pdfs.length} resource{mod.pdfs.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Enrollment Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 p-6 bg-card rounded-lg border border-border">
              <div className="mb-6">
                <div className="inline-block px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium mb-4">
                  {course.isEnrolled ? 'Enrolled' : 'Available'}
                </div>

                {course.isEnrolled && (
                  <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-md">
                    <p className="text-sm text-primary font-medium">You are enrolled in this course!</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen size={16} />
                    <span>{course.modules.length} modules to complete</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Play size={16} />
                    <span>{totalVideos} videos to watch</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText size={16} />
                    <span>{totalPdfs} resources included</span>
                  </div>
                </div>
              </div>

              <EnrollButton courseId={course.id} isEnrolled={course.isEnrolled} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
