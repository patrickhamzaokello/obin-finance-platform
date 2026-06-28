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
  const [course,        setCourse]        = useState<any>(null);
  const [loading,       setLoading]       = useState(true);
  const [enrolling,     setEnrolling]     = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [courseId,      setCourseId]      = useState<string | null>(null);
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
    if (descRef.current)
      setDescOverflows(descRef.current.scrollHeight > descRef.current.clientHeight + 2);
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

  return (
    <div className='min-h-screen bg-[#F5F5F7]'>

      {/* ── Nav ── */}
      <header className='bg-white/80 backdrop-blur-xl border-b border-black/[0.06] sticky top-0 z-20'>
        <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3'>
          <Link href='/dashboard' className='inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors'>
            <ArrowLeft size={14} /> Courses
          </Link>
          {isEnrolled && (
            <>
              <div className='w-px h-4 bg-border' />
              <span className='inline-flex items-center gap-1.5 text-xs font-semibold text-primary'>
                <CheckCircle2 size={12} /> Enrolled
              </span>
            </>
          )}
        </div>
      </header>

      <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='flex gap-7 items-start'>

          {/* ── Left: main content ── */}
          <div className='flex-1 min-w-0 space-y-5'>

            {/* Thumbnail — full 16:9, nothing cropped */}
            <div className='w-full aspect-video rounded-2xl overflow-hidden bg-secondary shadow-sm'>
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={course.title}
                  className='w-full h-full object-contain bg-black'
                />
              ) : (
                <div className='w-full h-full flex items-center justify-center'>
                  <BookOpen size={48} className='text-muted-foreground/30' />
                </div>
              )}
            </div>

            {/* Title + meta */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2 flex-wrap'>
                <span className='inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full'>
                  <BookOpen size={10} /> Course
                </span>
                {discountActive && !isEnrolled && (
                  <span className='inline-flex items-center px-2.5 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full'>
                    {course.discountPercent}% OFF
                  </span>
                )}
              </div>

              <h1 className='text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-snug'>
                {course.title}
              </h1>

              {course.instructor && (
                <div className='flex items-center gap-2'>
                  <div className='w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0'>
                    <Users size={13} className='text-primary' />
                  </div>
                  <span className='text-sm text-muted-foreground'>
                    by <span className='font-semibold text-foreground'>{course.instructor}</span>
                  </span>
                </div>
              )}

              <div className='flex flex-wrap gap-2 pt-1'>
                {[
                  { icon: BookOpen, label: `${course.modules.length} module${course.modules.length !== 1 ? 's' : ''}` },
                  { icon: Play,     label: `${totalVideos} video${totalVideos !== 1 ? 's' : ''}` },
                  { icon: FileText, label: `${totalPdfs} PDF${totalPdfs !== 1 ? 's' : ''}` },
                  { icon: Clock,    label: 'Self-paced' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl text-xs font-medium text-muted-foreground shadow-sm'>
                    <Icon size={11} className='text-primary' /> {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Mobile CTA */}
            <div className='lg:hidden'>
              <CtaCard
                isFree={isFree} isEnrolled={isEnrolled} enrolling={enrolling}
                price={price} discountedPrice={discountedPrice}
                discountActive={discountActive} discountPercent={course.discountPercent}
                error={error} onEnroll={handleEnroll}
                onContinue={() => router.push(`/learning/${courseId}`)}
                modules={course.modules.length} videos={totalVideos} pdfs={totalPdfs}
              />
            </div>

            {/* Description */}
            {course.description && (
              <div className='bg-white rounded-2xl shadow-sm px-6 py-5'>
                <h2 className='text-sm font-bold text-foreground mb-2.5'>About this course</h2>
                <p
                  ref={descRef}
                  className={`text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap ${descExpanded ? '' : 'line-clamp-4'}`}
                >
                  {course.description}
                </p>
                {(descOverflows || descExpanded) && (
                  <button onClick={() => setDescExpanded(!descExpanded)}
                    className='mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline'>
                    {descExpanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Read more</>}
                  </button>
                )}
              </div>
            )}

            {/* Curriculum */}
            {course.modules.length > 0 && (
              <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
                <div className='px-6 py-4 border-b border-black/[0.06]'>
                  <h2 className='text-sm font-bold text-foreground'>Course curriculum</h2>
                  <p className='text-xs text-muted-foreground mt-0.5'>
                    {course.modules.length} modules · {totalVideos + totalPdfs} resources
                  </p>
                </div>
                <div className='divide-y divide-black/[0.04]'>
                  {course.modules.map((mod: any, index: number) => {
                    const vc = mod.videos.length;
                    const pc = mod.pdfs.length;
                    return (
                      <div key={mod.id} className='flex items-start gap-4 px-6 py-4 hover:bg-[#F5F5F7] transition-colors'>
                        <div className='w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5'>
                          {index + 1}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm font-semibold text-foreground'>{mod.title}</p>
                          {mod.description && (
                            <p className='text-xs text-muted-foreground mt-1 leading-relaxed'>{mod.description}</p>
                          )}
                          <div className='flex items-center gap-2 mt-2'>
                            {vc > 0 && (
                              <span className='inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg'>
                                <Play size={9} className='text-primary' /> {vc} video{vc !== 1 ? 's' : ''}
                              </span>
                            )}
                            {pc > 0 && (
                              <span className='inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg'>
                                <FileText size={9} className='text-primary' /> {pc} PDF{pc !== 1 ? 's' : ''}
                              </span>
                            )}
                            {vc === 0 && pc === 0 && (
                              <span className='text-xs text-muted-foreground/50 italic'>No resources yet</span>
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

          {/* ── Right: sticky CTA ── */}
          <div className='hidden lg:block w-[300px] shrink-0 sticky top-[57px]'>
            <CtaCard
              isFree={isFree} isEnrolled={isEnrolled} enrolling={enrolling}
              price={price} discountedPrice={discountedPrice}
              discountActive={discountActive} discountPercent={course.discountPercent}
              error={error} onEnroll={handleEnroll}
              onContinue={() => router.push(`/learning/${courseId}`)}
              modules={course.modules.length} videos={totalVideos} pdfs={totalPdfs}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CTA card ──────────────────────────────────────────────────────────────────

function CtaCard({
  isFree, isEnrolled, enrolling,
  price, discountedPrice, discountActive, discountPercent,
  error, onEnroll, onContinue,
  modules, videos, pdfs,
}: {
  isFree: boolean; isEnrolled: boolean; enrolling: boolean;
  price: number; discountedPrice: number; discountActive: boolean; discountPercent: number;
  error: string | null; onEnroll: () => void; onContinue: () => void;
  modules: number; videos: number; pdfs: number;
}) {
  return (
    <div className='bg-white rounded-2xl shadow-sm p-6 space-y-5'>

      {/* Price */}
      {!isEnrolled && (
        <div>
          {isFree ? (
            <div className='text-3xl font-bold text-primary'>Free</div>
          ) : (
            <div>
              <div className='text-3xl font-bold text-foreground'>UGX {discountedPrice.toLocaleString()}</div>
              {discountActive && (
                <div className='flex items-center gap-2 mt-1'>
                  <span className='text-sm text-muted-foreground line-through'>UGX {price.toLocaleString()}</span>
                  <span className='text-xs font-bold px-2 py-0.5 bg-red-50 text-red-600 rounded-full'>-{discountPercent}%</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Button */}
      {isEnrolled ? (
        <div className='space-y-2.5'>
          <p className='flex items-center gap-1.5 text-sm font-semibold text-primary'>
            <CheckCircle2 size={14} /> You&apos;re enrolled
          </p>
          <button onClick={onContinue}
            className='w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors'>
            <Play size={15} /> Continue Learning
          </button>
        </div>
      ) : (
        <div className='space-y-2'>
          <button onClick={onEnroll} disabled={enrolling}
            className='w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60'>
            {enrolling
              ? <><Loader2 size={15} className='animate-spin' /> Enrolling…</>
              : <><GraduationCap size={15} /> {isFree ? 'Enroll for Free' : 'Enroll Now'}</>}
          </button>
          {error && <p className='text-xs text-destructive text-center'>{error}</p>}
        </div>
      )}

      {/* Includes */}
      <div className='space-y-2.5 pt-4 border-t border-black/[0.06]'>
        <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>This course includes</p>
        {[
          { icon: BookOpen,      text: `${modules} module${modules !== 1 ? 's' : ''}` },
          { icon: Play,          text: `${videos} video${videos !== 1 ? 's' : ''}` },
          { icon: FileText,      text: `${pdfs} PDF resource${pdfs !== 1 ? 's' : ''}` },
          { icon: Clock,         text: 'Self-paced learning' },
          { icon: GraduationCap, text: 'Certificate on completion' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className='flex items-center gap-2.5 text-sm text-muted-foreground'>
            <Icon size={13} className='text-primary shrink-0' /> {text}
          </div>
        ))}
      </div>
    </div>
  );
}
