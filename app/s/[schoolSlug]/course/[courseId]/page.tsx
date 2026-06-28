'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCourseWithEnrollmentStatus, enrollCourse } from '@/app/actions/courses';
import { convertBlobUrlToApiUrl } from '@/lib/blob-url';
import Link from 'next/link';
import {
  ArrowLeft, BookOpen, Play, FileText, Clock,
  CheckCircle2, ChevronRight, GraduationCap, Loader2,
} from 'lucide-react';

export default function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ courseId: id }) => {
      setCourseId(id);
      getCourseWithEnrollmentStatus(id).then((result) => {
        if (result.success) setCourse(result.data as any);
        else setError(result.error || 'Failed to load course');
        setLoading(false);
      });
    });
  }, [params]);

  const handleEnroll = async () => {
    if (!courseId) return;
    setEnrolling(true);
    setError(null);
    const result = await enrollCourse(courseId);
    if (result.success) {
      router.push(`/learning/${courseId}`);
    } else {
      setError(result.error || 'Enrollment failed');
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin' />
      </div>
    );
  }

  if (!course) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center px-4'>
        <div className='bg-white rounded-2xl shadow-sm p-10 max-w-md w-full text-center'>
          <h2 className='text-xl font-semibold text-foreground mb-2'>Course not found</h2>
          <p className='text-sm text-muted-foreground mb-6'>{error || "This course doesn't exist."}</p>
          <Link href='/dashboard' className='inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded hover:bg-primary/90 transition-colors'>
            <ArrowLeft size={14} /> Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  const totalVideos = course.modules.reduce((s: number, m: any) => s + m.videos.length, 0);
  const totalPdfs   = course.modules.reduce((s: number, m: any) => s + m.pdfs.length, 0);
  const totalItems  = totalVideos + totalPdfs;
  const isEnrolled  = course.isEnrolled;

  return (
    <div className='min-h-screen bg-[#F5F5F7]'>

      {/* Sticky header */}
      <header className='bg-white/80 backdrop-blur-xl border-b border-black/[0.06] sticky top-0 z-10'>
        <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-3'>
          <Link href='/dashboard' className='inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors'>
            <ArrowLeft size={14} /> Back to Courses
          </Link>
          {isEnrolled && (
            <>
              <div className='w-px h-4 bg-border' />
              <span className='inline-flex items-center gap-1.5 text-xs font-semibold text-accent'>
                <CheckCircle2 size={13} /> Enrolled
              </span>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      {course.thumbnail && (
        <div className='w-full bg-[#0f1a13] max-h-72 overflow-hidden'>
          <img
            src={convertBlobUrlToApiUrl(course.thumbnail)}
            alt={course.title}
            className='w-full h-full object-cover opacity-70'
          />
        </div>
      )}

      <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 items-start'>

          {/* ── Left ─────────────────────────────────────────────────────── */}
          <div className='lg:col-span-2 space-y-8'>

            {/* Title */}
            <div>
              <h1 className='text-3xl font-bold text-foreground tracking-tight leading-tight'>{course.title}</h1>
              {course.instructor && (
                <p className='text-sm text-muted-foreground mt-2'>
                  Taught by <span className='font-semibold text-foreground'>{course.instructor}</span>
                </p>
              )}
            </div>

            {/* Stats */}
            <div className='grid grid-cols-3 gap-3'>
              {[
                { icon: BookOpen,  label: 'Modules',   value: course.modules.length },
                { icon: Play,      label: 'Videos',    value: totalVideos },
                { icon: FileText,  label: 'Resources', value: totalPdfs },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className='bg-white rounded-2xl shadow-sm px-4 py-4 text-center'>
                  <div className='text-2xl font-bold text-primary'>{value}</div>
                  <div className='text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1'>
                    <Icon size={11} /> {label}
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            {course.description && (
              <div>
                <h2 className='text-base font-semibold text-foreground mb-3'>About this course</h2>
                <p className='text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap'>{course.description}</p>
              </div>
            )}

            {/* What you'll learn */}
            {course.modules.length > 0 && (
              <div>
                <h2 className='text-base font-semibold text-foreground mb-4'>Course curriculum</h2>
                <div className='space-y-2'>
                  {course.modules.map((mod: any, index: number) => {
                    const itemCount = mod.videos.length + mod.pdfs.length;
                    return (
                      <div key={mod.id} className='bg-white rounded-2xl shadow-sm'>
                        <div className='flex items-start gap-4 px-5 py-4'>
                          <div className='w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5'>
                            {index + 1}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-semibold text-foreground'>{mod.title}</p>
                            {mod.description && (
                              <p className='text-xs text-muted-foreground mt-0.5 leading-relaxed'>{mod.description}</p>
                            )}
                            {itemCount > 0 && (
                              <div className='flex items-center gap-3 mt-2'>
                                {mod.videos.length > 0 && (
                                  <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
                                    <Play size={10} /> {mod.videos.length} video{mod.videos.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                                {mod.pdfs.length > 0 && (
                                  <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
                                    <FileText size={10} /> {mod.pdfs.length} resource{mod.pdfs.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className='text-xs text-muted-foreground shrink-0 mt-1'>{itemCount} lesson{itemCount !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: CTA card ──────────────────────────────────────────── */}
          <div className='lg:col-span-1'>
            <div className='sticky top-[57px] bg-white rounded-2xl shadow-sm overflow-hidden'>

              {/* Course thumbnail (small, inside card) */}
              {course.thumbnail && (
                <div className='aspect-video bg-muted overflow-hidden'>
                  <img
                    src={convertBlobUrlToApiUrl(course.thumbnail)}
                    alt={course.title}
                    className='w-full h-full object-cover'
                  />
                </div>
              )}

              <div className='p-6 space-y-5'>

                {isEnrolled ? (
                  <>
                    <div className='flex items-center gap-2 text-sm text-accent font-semibold'>
                      <CheckCircle2 size={16} />
                      You're enrolled
                    </div>
                    <button
                      onClick={() => router.push(`/learning/${courseId}`)}
                      className='w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-semibold text-sm rounded hover:bg-primary/90 transition-colors'
                    >
                      <Play size={15} />
                      Continue Learning
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <span className='badge-published'>Free Course</span>
                    </div>
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className='w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-semibold text-sm rounded hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
                    >
                      {enrolling ? (
                        <><Loader2 size={15} className='animate-spin' /> Enrolling…</>
                      ) : (
                        <><GraduationCap size={15} /> Enroll &amp; Start Learning</>
                      )}
                    </button>
                    {error && <p className='text-xs text-destructive text-center'>{error}</p>}
                  </>
                )}

                {/* Course details list */}
                <div className='space-y-2.5 pt-1 border-t border-border'>
                  <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-1'>This course includes</p>
                  {[
                    { icon: BookOpen,      text: `${course.modules.length} module${course.modules.length !== 1 ? 's' : ''}` },
                    { icon: Play,          text: `${totalVideos} video lesson${totalVideos !== 1 ? 's' : ''}` },
                    { icon: FileText,      text: `${totalPdfs} PDF resource${totalPdfs !== 1 ? 's' : ''}` },
                    { icon: Clock,         text: 'Self-paced learning' },
                    { icon: GraduationCap, text: 'Certificate on completion' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className='flex items-center gap-2.5 text-sm text-muted-foreground'>
                      <Icon size={14} className='text-primary shrink-0' />
                      {text}
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
