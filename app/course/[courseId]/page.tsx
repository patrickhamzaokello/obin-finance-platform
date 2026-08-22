'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCourseWithEnrollmentStatus, enrollCourse } from '@/app/actions/courses';
import { getCourseReviews, getMyReview } from '@/app/actions/feedback';
import { initiateCoursePayment, getPaymentStatus } from '@/app/actions/payments';
import { convertBlobUrlToApiUrl } from '@/lib/blob-url';
import Link from 'next/link';
import {
  ArrowLeft, BookOpen, Play, FileText, Clock,
  CheckCircle2, GraduationCap, Loader2, ChevronDown, ChevronUp, Users, Star,
  Smartphone, X, CheckCheck,
} from 'lucide-react';
import { ReviewsSection } from './reviews';

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
  const [reviews,      setReviews]      = useState<any[]>([]);
  const [avgRating,    setAvgRating]    = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [myReview,     setMyReview]     = useState<any>(null);

  // Payment modal state
  const [paymentOpen,    setPaymentOpen]    = useState(false);
  const [phone,          setPhone]          = useState('');
  const [paying,         setPaying]         = useState(false);
  const [paymentId,      setPaymentId]      = useState<string | null>(null);
  const [paymentStatus,  setPaymentStatus]  = useState<'idle'|'pending'|'success'|'failed'>('idle');
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount — must be before any early returns (Rules of Hooks)
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  useEffect(() => {
    params.then(({ courseId: id }) => {
      setCourseId(id);
      Promise.all([
        getCourseWithEnrollmentStatus(id),
        getCourseReviews(id),
        getMyReview(id),
      ]).then(([courseResult, reviewsResult, myReviewResult]) => {
        if (courseResult.success) setCourse(courseResult.data as any);
        else setError(courseResult.error || 'Failed to load course');
        if (reviewsResult.success) {
          setReviews(reviewsResult.data ?? []);
          setAvgRating(reviewsResult.avgRating ?? null);
          setTotalReviews(reviewsResult.totalReviews ?? 0);
        }
        setMyReview(myReviewResult.data ?? null);
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
        <Link href='/courses' className='inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors'>
          <ArrowLeft size={14} /> Back to Courses
        </Link>
      </div>
    </div>
  );

  const totalVideos     = course.modules.reduce((s: number, m: any) => s + m.videos.length, 0);
  const totalPdfs       = course.modules.reduce((s: number, m: any) => s + m.pdfs.length, 0);
  const isEnrolled      = course.isEnrolled;
  const isLoggedIn      = course.isLoggedIn ?? false;
  const price           = course.price ?? 0;
  const discountActive  = course.discountActive && (course.discountPercent ?? 0) > 0;
  const discountedPrice = discountActive ? Math.round(price * (1 - (course.discountPercent ?? 0) / 100)) : price;
  const isFree          = price === 0;
  const thumbnailUrl    = course.thumbnail ? convertBlobUrlToApiUrl(course.thumbnail) : null;

  // (polling cleanup moved above early returns)

  const handleEnroll = async () => {
    if (!courseId) return;
    setEnrolling(true);
    setError(null);
    const result = await enrollCourse(courseId);
    if (result.success) router.push(`/learn/${courseId}`);
    else { setError(result.error || 'Enrollment failed'); setEnrolling(false); }
  };

  const handlePay = async () => {
    if (!courseId || !phone.trim()) return;
    setPaying(true);
    setError(null);
    setPaymentStatus('idle');

    const result = await initiateCoursePayment(courseId, phone.trim());
    if (!result.success) {
      setError(result.error || 'Payment failed to start');
      setPaying(false);
      return;
    }

    const pid = result.data!.paymentId;
    setPaymentId(pid);
    setPaymentStatus('pending');
    setPaymentMessage('Check your phone — enter your PIN to confirm payment.');

    // Poll every 4 seconds
    pollRef.current = setInterval(async () => {
      const statusResult = await getPaymentStatus(pid);
      if (!statusResult.success) return;
      const s = statusResult.data!.status as 'pending'|'success'|'failed';
      setPaymentStatus(s);
      setPaymentMessage(statusResult.data!.statusMessage ?? null);

      if (s === 'success') {
        clearInterval(pollRef.current!);
        setPaying(false);
        // Reload course to reflect enrollment
        setTimeout(() => {
          router.push(`/learn/${courseId}`);
        }, 2000);
      } else if (s === 'failed') {
        clearInterval(pollRef.current!);
        setPaying(false);
      }
    }, 4000);
  };

  const closePayment = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setPaymentOpen(false);
    setPaying(false);
    setPaymentStatus('idle');
    setPaymentId(null);
    setPaymentMessage(null);
    setPhone('');
  };

  return (
    <div className='min-h-screen bg-[#F5F5F7]'>

      {/* ── Nav ── */}
      <header className='bg-white/90 backdrop-blur-xl border-b border-black/[0.06] sticky top-0 z-20'>
        <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3'>
          {/* Logo */}
          <Link href='/' className='flex items-center gap-1.5 shrink-0 mr-1'>
            <div className='w-6 h-6 rounded-md bg-primary flex items-center justify-center'>
              <Play size={11} fill='white' color='white' />
            </div>
            <span className='font-extrabold text-sm text-foreground hidden sm:inline'>Pkasemer</span>
          </Link>
          <div className='w-px h-4 bg-border' />
          <Link href='/courses' className='inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors'>
            <ArrowLeft size={13} /> All Courses
          </Link>
          {isEnrolled && (
            <>
              <div className='w-px h-4 bg-border' />
              <span className='inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full'>
                <CheckCircle2 size={11} /> Enrolled
              </span>
            </>
          )}
          <div className='flex-1' />
          {isLoggedIn ? (
            <Link href='/learn/dashboard' className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-black/[0.08] rounded-lg hover:bg-black/[0.03] transition-colors'>
              <GraduationCap size={12} /> My Learning
            </Link>
          ) : (
            <div className='flex items-center gap-2'>
              <Link href='/sign-in' className='text-xs font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline'>Sign in</Link>
              <Link href='/sign-up' className='px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors'>Get started</Link>
            </div>
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
                {avgRating && (
                  <span className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-xl text-xs font-semibold text-amber-700 shadow-sm'>
                    <Star size={11} className='fill-amber-400 text-amber-400' /> {avgRating} ({totalReviews})
                  </span>
                )}
              </div>
            </div>

            {/* Mobile CTA */}
            <div className='lg:hidden'>
              <CtaCard
                title={course.title}
                isFree={isFree} isEnrolled={isEnrolled} isLoggedIn={isLoggedIn} enrolling={enrolling}
                price={price} discountedPrice={discountedPrice}
                discountActive={discountActive} discountPercent={course.discountPercent}
                error={error} onEnroll={handleEnroll}
                onContinue={() => router.push(`/learn/${courseId}`)}
                onPay={() => setPaymentOpen(true)}
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

            {/* Reviews */}
            <ReviewsSection
              courseId={courseId!}
              isEnrolled={isEnrolled}
              reviews={reviews}
              avgRating={avgRating}
              totalReviews={totalReviews}
              myReview={myReview}
            />
          </div>

          {/* ── Right: sticky CTA ── */}
          <div className='hidden lg:block w-[300px] shrink-0 sticky top-[57px]'>
            <CtaCard
              isFree={isFree} isEnrolled={isEnrolled} isLoggedIn={isLoggedIn} enrolling={enrolling}
              price={price} discountedPrice={discountedPrice}
              discountActive={discountActive} discountPercent={course.discountPercent}
              error={error} onEnroll={handleEnroll}
              onContinue={() => router.push(`/learn/${courseId}`)}
              onPay={() => setPaymentOpen(true)}
              modules={course.modules.length} videos={totalVideos} pdfs={totalPdfs}
              title={course.title}
            />
          </div>
        </div>
      </div>

      {/* ── Payment modal ── */}
      {paymentOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 420, position: 'relative' }}>
            <button onClick={closePayment} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#78716C' }}>
              <X size={20} />
            </button>

            {paymentStatus === 'success' ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <CheckCheck size={48} style={{ color: '#0E9F6E', margin: '0 auto 16px' }} />
                <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Payment confirmed!</h2>
                <p style={{ color: '#78716C', fontSize: 14 }}>Taking you to your course…</p>
              </div>
            ) : paymentStatus === 'failed' ? (
              <div>
                <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Payment failed</h2>
                <p style={{ color: '#78716C', fontSize: 14, marginBottom: 20 }}>
                  {paymentMessage ?? 'The payment was declined or timed out. Please try again.'}
                </p>
                <button onClick={() => { setPaymentStatus('idle'); setPaymentId(null); setPaymentMessage(null); }}
                  style={{ background: '#0E9F6E', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 700, cursor: 'pointer', width: '100%' }}>
                  Try again
                </button>
              </div>
            ) : paymentStatus === 'pending' ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <Smartphone size={40} style={{ color: '#0E9F6E', margin: '0 auto 16px' }} />
                <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Check your phone</h2>
                <p style={{ color: '#78716C', fontSize: 14, marginBottom: 20 }}>
                  A payment prompt has been sent to <strong>{phone}</strong>.
                  Enter your mobile money PIN to approve.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#78716C', fontSize: 13 }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Waiting for confirmation…
                </div>
                <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <Smartphone size={24} style={{ color: '#0E9F6E' }} />
                  <div>
                    <h2 style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>Pay with Mobile Money</h2>
                    <p style={{ color: '#78716C', fontSize: 13, margin: 0 }}>MTN or Airtel Uganda</p>
                  </div>
                </div>

                <div style={{ background: '#F0FDF4', border: '1px solid #D1FAE5', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{course.title}</p>
                  <p style={{ margin: '4px 0 0', fontWeight: 800, fontSize: 20, color: '#0E9F6E' }}>
                    UGX {discountedPrice.toLocaleString()}
                  </p>
                </div>

                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Your mobile money number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 0711 234 567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px', border: '1px solid #E4E1DA',
                    borderRadius: 10, fontSize: 15, marginBottom: 16, outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {error && <p style={{ color: '#DC2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}
                <button
                  onClick={handlePay}
                  disabled={paying || !phone.trim()}
                  style={{
                    width: '100%', padding: '14px', background: paying || !phone.trim() ? '#A8A29E' : '#0E9F6E',
                    color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15,
                    cursor: paying || !phone.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {paying ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending prompt…</> : 'Pay now'}
                </button>
                <p style={{ color: '#A8A29E', fontSize: 12, textAlign: 'center', marginTop: 12 }}>
                  You will receive a prompt on your phone to enter your PIN.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── CTA card ──────────────────────────────────────────────────────────────────

function CtaCard({
  isFree, isEnrolled, isLoggedIn, enrolling,
  price, discountedPrice, discountActive, discountPercent,
  error, onEnroll, onContinue, onPay,
  modules, videos, pdfs, title,
}: {
  isFree: boolean; isEnrolled: boolean; isLoggedIn: boolean; enrolling: boolean;
  price: number; discountedPrice: number; discountActive: boolean; discountPercent: number;
  error: string | null; onEnroll: () => void; onContinue: () => void; onPay: () => void;
  modules: number; videos: number; pdfs: number; title: string;
}) {
  const returnPath  = typeof window !== 'undefined' ? window.location.pathname : '';
  const ctaParam    = `?next=${encodeURIComponent(returnPath)}&courseTitle=${encodeURIComponent(title)}`;
  const signInHref  = `/sign-in${ctaParam}`;
  const signUpHref  = `/sign-up${ctaParam}`;

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

      {/* Action area */}
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
      ) : isLoggedIn ? (
        /* Logged in, not yet enrolled */
        <div className='space-y-2'>
          {isFree ? (
            <button onClick={onEnroll} disabled={enrolling}
              className='w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60'>
              {enrolling
                ? <><Loader2 size={15} className='animate-spin' /> Enrolling…</>
                : <><GraduationCap size={15} /> Enroll for Free</>}
            </button>
          ) : (
            <button onClick={onPay}
              className='w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors'>
              <Smartphone size={15} /> Pay with Mobile Money
            </button>
          )}
          {error && <p className='text-xs text-destructive text-center'>{error}</p>}
        </div>
      ) : (
        /* Not logged in — gate enrollment behind account creation */
        <div className='space-y-3'>
          <Link href={signUpHref}
            className='w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors'>
            <GraduationCap size={15} /> {isFree ? 'Sign up & enroll free' : 'Sign up to enroll'}
          </Link>
          <p className='text-center text-xs text-muted-foreground'>
            Already have an account?{' '}
            <Link href={signInHref} className='font-semibold text-primary hover:underline'>Sign in</Link>
          </p>
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
