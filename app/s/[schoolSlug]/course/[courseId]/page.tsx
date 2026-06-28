'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCourseWithEnrollmentStatus, enrollCourse } from '@/app/actions/courses';
import { convertBlobUrlToApiUrl } from '@/lib/blob-url';
import Link from 'next/link';
import {
  ArrowLeft, BookOpen, Play, FileText, Clock,
  CheckCircle2, GraduationCap, Loader2, ChevronDown, ChevronUp, Users,
} from 'lucide-react';

export default function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const router = useRouter();
  const [course,    setCourse]    = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [courseId,  setCourseId]  = useState<string | null>(null);

  const [descExpanded,  setDescExpanded]  = useState(false);
  const [descOverflows, setDescOverflows] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);

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

  useEffect(() => {
    if (descRef.current) {
      setDescOverflows(descRef.current.scrollHeight > descRef.current.clientHeight + 2);
    }
  }, [course?.description]);

  if (loading) return (
    <div className='min-h-screen bg-[#F5F5F7] flex items-center justify-center'>
      <div className='w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin' />
    </div>
  );

  if (!course) return (
    <div className='min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4'>
      <div className='bg-white rounded-2xl shadow-sm p-10 max-w-md w-full text-center'>
        <h2 className='text-xl font-semibold text-foreground mb-2'>Course not found</h2>
        <p className='text-sm text-muted-foreground mb-6'>{error || "This course doesn't exist."}</p>
        <Link href='/dashboard' className='inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors'>
          <ArrowLeft size={14} /> Back to Courses
        </Link>
      </div>
    </div>
  );

  const totalVideos     = course.modules.reduce((s: number, m: any) => s + m.videos.length, 0);
  const totalPdfs       = course.modules.reduce((s: number, m: any) => s + m.pdfs.length, 0);
  const isEnrolled      = course.isEnrolled;
  const price           = course.price ?? 0;
  const discountActive  = course.discountActive && (course.discountPercent ?? 0) > 0;
  const discountedPrice = discountActive ? Math.round(price * (1 - (course.discountPercent ?? 0) / 100)) : price;
  const isFree          = price === 0;
  const thumbnailUrl    = course.thumbnail ? convertBlobUrlToApiUrl(course.thumbnail) : null;

  const handleEnroll = async () => {
    if (!courseId) return;
    setEnrolling(true);
    setError(null);
    const result = await enrollCourse(courseId);
    if (result.success) router.push(`/learning/${courseId}`);
    else { setError(result.error || 'Enrollment failed'); setEnrolling(false); }
  };

  // ── CTA Card — shared between hero (desktop) and body (mobile) ──
  const CtaCard = ({ className = '' }: { className?: string }) => (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${className}`}>
      {thumbnailUrl && (
        <div className='aspect-video overflow-hidden'>
          <img src={thumbnailUrl} alt={course.title} className='w-full h-full object-cover' />
        </div>
      )}
      <div className='p-6 space-y-5'>
        {/* Price */}
        {!isEnrolled && (
          <div>
            {isFree ? (
              <span className='text-3xl font-bold text-primary'>Free</span>
            ) : (
              <div className='flex items-end gap-2.5'>
                <span className='text-3xl font-bold text-foreground'>UGX {discountedPrice.toLocaleString()}</span>
                {discountActive && (
                  <div className='flex items-center gap-1.5 mb-1'>
                    <span className='text-sm text-muted-foreground line-through'>UGX {price.toLocaleString()}</span>
                    <span className='text-xs font-bold px-2 py-0.5 bg-red-50 text-red-600 rounded-full'>-{course.discountPercent}%</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* CTA button */}
        {isEnrolled ? (
          <div className='space-y-3'>
            <div className='flex items-center gap-2 text-sm font-semibold text-primary'>
              <CheckCircle2 size={15} /> You&apos;re enrolled
            </div>
            <button onClick={() => router.push(`/learning/${courseId}`)}
              className='w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors'>
              <Play size={15} /> Continue Learning
            </button>
          </div>
        ) : (
          <div className='space-y-3'>
            <button onClick={handleEnroll} disabled={enrolling}
              className='w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60'>
              {enrolling
                ? <><Loader2 size={15} className='animate-spin' /> Enrolling…</>
                : <><GraduationCap size={15} /> {isFree ? 'Enroll for Free' : 'Enroll Now'}</>}
            </button>
            {error && <p className='text-xs text-destructive text-center'>{error}</p>}
          </div>
        )}

        {/* Course includes */}
        <div className='space-y-2.5 pt-4 border-t border-black/[0.06]'>
          <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>This course includes</p>
          {[
            { icon: BookOpen,      text: `${course.modules.length} module${course.modules.length !== 1 ? 's' : ''}` },
            { icon: Play,          text: `${totalVideos} video${totalVideos !== 1 ? 's' : ''}` },
            { icon: FileText,      text: `${totalPdfs} PDF resource${totalPdfs !== 1 ? 's' : ''}` },
            { icon: Clock,         text: 'Self-paced' },
            { icon: GraduationCap, text: 'Certificate on completion' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className='flex items-center gap-2.5 text-sm text-muted-foreground'>
              <Icon size={13} className='text-primary shrink-0' /> {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className='min-h-screen bg-[#F5F5F7]'>

      {/* ── Hero ── */}
      <div className='relative bg-[#0f0f1a] overflow-hidden'>
        {/* Blurred thumbnail as background */}
        {thumbnailUrl && (
          <div className='absolute inset-0'>
            <img src={thumbnailUrl} alt='' className='w-full h-full object-cover opacity-20 blur-sm scale-105' />
          </div>
        )}
        <div className='absolute inset-0 bg-gradient-to-r from-[#0f0f1a] via-[#0f0f1a]/95 to-transparent' />

        <div className='relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          {/* Back link */}
          <Link href='/dashboard'
            className='inline-flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-white transition-colors mb-8'>
            <ArrowLeft size={14} /> Back to Courses
          </Link>

          <div className='flex gap-10 items-start'>
            {/* Left: course info */}
            <div className='flex-1 min-w-0 max-w-2xl py-4'>
              {/* Published badge */}
              <div className='flex items-center gap-2 mb-4'>
                <span className='inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/20 text-[#818cf8] text-xs font-semibold rounded-full'>
                  <BookOpen size={11} /> Course
                </span>
                {discountActive && !isEnrolled && (
                  <span className='inline-flex items-center px-2.5 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full'>
                    {course.discountPercent}% OFF
                  </span>
                )}
              </div>

              <h1 className='text-3xl sm:text-4xl font-bold text-white leading-tight tracking-tight mb-4'>
                {course.title}
              </h1>

              {course.description && (
                <p className='text-white/60 text-base leading-relaxed line-clamp-2 mb-6'>
                  {course.description}
                </p>
              )}

              {/* Stats row */}
              <div className='flex flex-wrap items-center gap-5 text-sm text-white/50'>
                {course.instructor && (
                  <div className='flex items-center gap-2'>
                    <div className='w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center'>
                      <Users size={11} className='text-[#818cf8]' />
                    </div>
                    <span className='text-white/80 font-medium'>{course.instructor}</span>
                  </div>
                )}
                <span className='flex items-center gap-1.5'><BookOpen size={13} /> {course.modules.length} modules</span>
                <span className='flex items-center gap-1.5'><Play size={13} /> {totalVideos} videos</span>
                <span className='flex items-center gap-1.5'><FileText size={13} /> {totalPdfs} PDFs</span>
                <span className='flex items-center gap-1.5'><Clock size={13} /> Self-paced</span>
              </div>

              {/* Enrolled badge (mobile visible) */}
              {isEnrolled && (
                <div className='mt-6 inline-flex items-center gap-2 px-3.5 py-2 bg-primary/20 text-[#818cf8] text-sm font-semibold rounded-xl'>
                  <CheckCircle2 size={14} /> You&apos;re enrolled
                </div>
              )}
            </div>

            {/* Right: sticky CTA — desktop only in hero */}
            <div className='hidden lg:block w-80 shrink-0'>
              <CtaCard />
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='flex gap-8 items-start'>

          {/* Left column */}
          <div className='flex-1 min-w-0 space-y-6'>

            {/* Description */}
            {course.description && (
              <div className='bg-white rounded-2xl shadow-sm px-6 py-5'>
                <h2 className='text-base font-bold text-foreground mb-3'>About this course</h2>
                <p
                  ref={descRef}
                  className={`text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap ${descExpanded ? '' : 'line-clamp-4'}`}
                >
                  {course.description}
                </p>
                {(descOverflows || descExpanded) && (
                  <button onClick={() => setDescExpanded(!descExpanded)}
                    className='mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline'>
                    {descExpanded ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> Read more</>}
                  </button>
                )}
              </div>
            )}

            {/* Curriculum */}
            {course.modules.length > 0 && (
              <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
                <div className='px-6 py-4 border-b border-black/[0.06]'>
                  <h2 className='text-base font-bold text-foreground'>Course curriculum</h2>
                  <p className='text-xs text-muted-foreground mt-0.5'>
                    {course.modules.length} module{course.modules.length !== 1 ? 's' : ''} · {totalVideos + totalPdfs} resources
                  </p>
                </div>
                <div className='divide-y divide-black/[0.04]'>
                  {course.modules.map((mod: any, index: number) => {
                    const videoCount = mod.videos.length;
                    const pdfCount   = mod.pdfs.length;
                    return (
                      <div key={mod.id} className='flex items-start gap-4 px-6 py-4 hover:bg-secondary/40 transition-colors'>
                        <div className='w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5'>
                          {index + 1}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm font-semibold text-foreground'>{mod.title}</p>
                          {mod.description && (
                            <p className='text-xs text-muted-foreground mt-1 leading-relaxed'>{mod.description}</p>
                          )}
                          <div className='flex items-center gap-3 mt-2'>
                            {videoCount > 0 && (
                              <span className='inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-lg'>
                                <Play size={10} className='text-primary' /> {videoCount} video{videoCount !== 1 ? 's' : ''}
                              </span>
                            )}
                            {pdfCount > 0 && (
                              <span className='inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-lg'>
                                <FileText size={10} className='text-primary' /> {pdfCount} PDF{pdfCount !== 1 ? 's' : ''}
                              </span>
                            )}
                            {videoCount === 0 && pdfCount === 0 && (
                              <span className='text-xs text-muted-foreground italic'>No resources yet</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: sticky CTA — desktop, scrolls with page body */}
          <div className='hidden lg:block w-80 shrink-0 sticky top-6'>
            <CtaCard />
          </div>
        </div>

        {/* Mobile CTA — below content */}
        <div className='lg:hidden mt-6'>
          <CtaCard />
        </div>
      </div>
    </div>
  );
}
