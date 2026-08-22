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

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  ink:     '#0a0a14',
  ink2:    '#1e1e30',
  muted:   '#5c5c8a',
  muted2:  '#9898b8',
  green:   '#0B00FF',
  greenBg: '#EEEEFF',
  greenBd: '#BBBBFF',
  surface: '#F4F4FB',
  border:  '#D0D0E8',
  white:   '#FFFFFF',
  red:     '#DC2626',
  redBg:   '#FEF2F2',
} as const;

const FONT_DISPLAY = "'Barlow Condensed', system-ui, sans-serif";
const FONT_BODY    = "'DM Sans', system-ui, sans-serif";

// ─── Page ────────────────────────────────────────────────────────────────────
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

  const [paymentOpen,    setPaymentOpen]    = useState(false);
  const [phone,          setPhone]          = useState('');
  const [paying,         setPaying]         = useState(false);
  const [paymentId,      setPaymentId]      = useState<string | null>(null);
  const [paymentStatus,  setPaymentStatus]  = useState<'idle'|'pending'|'success'|'failed'>('idle');
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup — must precede all early returns
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
    <div style={{ minHeight: '100vh', background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: `2px solid ${T.green}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!course) return (
    <div style={{ minHeight: '100vh', background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: FONT_BODY }}>
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, padding: '48px 40px', maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <BookOpen size={40} style={{ color: T.border, margin: '0 auto 16px', display: 'block' }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, color: T.ink, margin: '0 0 8px' }}>Course not found</h2>
        <p style={{ fontSize: 15, color: T.muted, margin: '0 0 24px', lineHeight: 1.6 }}>{error || "This course doesn't exist."}</p>
        <Link href="/courses" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: T.green, color: '#fff', borderRadius: 6, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Back to Courses
        </Link>
      </div>
    </div>
  );

  const totalVideos    = course.modules.reduce((s: number, m: any) => s + m.videos.length, 0);
  const totalPdfs      = course.modules.reduce((s: number, m: any) => s + m.pdfs.length, 0);
  const isEnrolled     = course.isEnrolled;
  const isLoggedIn     = course.isLoggedIn ?? false;
  const price          = course.price ?? 0;
  const discountActive = course.discountActive && (course.discountPercent ?? 0) > 0;
  const discountedPrice = discountActive ? Math.round(price * (1 - (course.discountPercent ?? 0) / 100)) : price;
  const isFree         = price === 0;
  const thumbnailUrl   = course.thumbnail ? convertBlobUrlToApiUrl(course.thumbnail) : null;

  const handleEnroll = async () => {
    if (!courseId) return;
    setEnrolling(true); setError(null);
    const result = await enrollCourse(courseId);
    if (result.success) router.push(`/learn/${courseId}`);
    else { setError(result.error || 'Enrollment failed'); setEnrolling(false); }
  };

  const handlePay = async () => {
    if (!courseId || !phone.trim()) return;
    setPaying(true); setError(null); setPaymentStatus('idle');
    const result = await initiateCoursePayment(courseId, phone.trim());
    if (!result.success) { setError(result.error || 'Payment failed to start'); setPaying(false); return; }
    const pid = result.data!.paymentId;
    setPaymentId(pid); setPaymentStatus('pending');
    setPaymentMessage('Check your phone — enter your PIN to confirm payment.');
    pollRef.current = setInterval(async () => {
      const sr = await getPaymentStatus(pid);
      if (!sr.success) return;
      const s = sr.data!.status as 'pending'|'success'|'failed';
      setPaymentStatus(s); setPaymentMessage(sr.data!.statusMessage ?? null);
      if (s === 'success') { clearInterval(pollRef.current!); setPaying(false); setTimeout(() => router.push(`/learn/${courseId}`), 2000); }
      else if (s === 'failed') { clearInterval(pollRef.current!); setPaying(false); }
    }, 4000);
  };

  const closePayment = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setPaymentOpen(false); setPaying(false); setPaymentStatus('idle');
    setPaymentId(null); setPaymentMessage(null); setPhone('');
  };

  const ctaProps = {
    title: course.title, isFree, isEnrolled, isLoggedIn, enrolling,
    price, discountedPrice, discountActive, discountPercent: course.discountPercent,
    error, onEnroll: handleEnroll, onContinue: () => router.push(`/learn/${courseId}`),
    onPay: () => setPaymentOpen(true),
    modules: course.modules.length, videos: totalVideos, pdfs: totalPdfs,
  };

  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: FONT_BODY }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box}
        @keyframes spin{to{transform:rotate(360deg)}}
        .pg-grid{display:grid;grid-template-columns:1fr 360px;gap:48px;max-width:1160px;margin:0 auto;padding:40px 24px 96px;align-items:start}
        .pg-mobile-cta{display:none}
        @media(max-width:860px){
          .pg-grid{grid-template-columns:1fr}
          .pg-desktop-cta{display:none}
          .pg-mobile-cta{display:block;margin:24px 0}
        }
        .meta-chip{display:flex;align-items:center;gap:8px;font-size:15px;color:${T.muted}}
        .section-heading{font-family:${FONT_BODY};font-size:20px;font-weight:700;color:${T.ink};margin:0 0 16px}
        .pg-btn{width:100%;padding:17px;border:none;border-radius:6px;font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;font-family:${FONT_BODY};transition:opacity .15s}
        .pg-btn:hover{opacity:.9}
        .pg-btn:disabled{opacity:.5;cursor:not-allowed}
        .pg-input:focus{outline:2px solid ${T.green};outline-offset:-2px}
      `}</style>

      {/* ── NAV ── */}
      <header style={{ background: T.white, borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, background: T.green, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>
              <Play size={12} fill="white" color="white" />
            </div>
            <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 16, color: T.ink }}>ObinAcademy</span>
          </Link>
          <div style={{ width: 1, height: 18, background: T.border }} />
          <Link href="/courses" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: T.muted, textDecoration: 'none' }}>
            <ArrowLeft size={14} /> All Courses
          </Link>
          {isEnrolled && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: T.green, background: T.greenBg, padding: '4px 10px', borderRadius: 20, border: `1px solid ${T.greenBd}` }}>
              <CheckCircle2 size={11} /> Enrolled
            </span>
          )}
          <div style={{ flex: 1 }} />
          {isLoggedIn ? (
            <Link href="/learn/dashboard" style={{ fontSize: 14, fontWeight: 600, color: T.muted, textDecoration: 'none', padding: '7px 14px', border: `1px solid ${T.border}`, borderRadius: 6 }}>
              My Learning
            </Link>
          ) : (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Link href="/sign-in" style={{ fontSize: 14, fontWeight: 500, color: T.muted, textDecoration: 'none' }}>Sign in</Link>
              <Link href="/sign-up" style={{ fontSize: 14, fontWeight: 700, color: '#fff', background: T.green, padding: '8px 18px', borderRadius: 6, textDecoration: 'none' }}>Get started</Link>
            </div>
          )}
        </div>
      </header>

      {/* ── MAIN GRID ── */}
      <div className="pg-grid">

        {/* ── LEFT COLUMN ── */}
        <div>
          {/* Thumbnail */}
          <div style={{ width: '100%', aspectRatio: '16/9', background: T.border, borderRadius: 8, overflow: 'hidden', border: `1px solid ${T.border}`, marginBottom: 28 }}>
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000', display: 'block' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                <BookOpen size={52} style={{ color: T.muted2 }} />
              </div>
            )}
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {course.level && (
              <span style={{ fontSize: 11, fontWeight: 700, color: T.green, background: T.greenBg, padding: '4px 10px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.07em', border: `1px solid ${T.greenBd}` }}>
                {course.level}
              </span>
            )}
            {discountActive && !isEnrolled && (
              <span style={{ fontSize: 11, fontWeight: 700, color: T.red, background: T.redBg, padding: '4px 10px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {course.discountPercent}% OFF
              </span>
            )}
            {course.language && (
              <span style={{ fontSize: 11, fontWeight: 600, color: T.muted, background: T.surface, padding: '4px 10px', borderRadius: 4, border: `1px solid ${T.border}` }}>
                {course.language}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(36px,5vw,54px)', fontWeight: 800, color: T.ink, lineHeight: 1.04, letterSpacing: '-0.01em', margin: '0 0 18px', textWrap: 'balance' }}>
            {course.title}
          </h1>

          {/* Instructor */}
          {course.instructor && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.greenBg, border: `1px solid ${T.greenBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users size={14} style={{ color: T.green }} />
              </div>
              <span style={{ fontSize: 15, color: T.muted }}>
                Instructor: <span style={{ fontWeight: 600, color: T.ink }}>{course.instructor}</span>
              </span>
            </div>
          )}

          {/* Meta row */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
            {[
              { icon: BookOpen, label: `${course.modules.length} Module${course.modules.length !== 1 ? 's' : ''}` },
              { icon: Play,     label: `${totalVideos} Video${totalVideos !== 1 ? 's' : ''}` },
              { icon: FileText, label: `${totalPdfs} PDF${totalPdfs !== 1 ? 's' : ''}` },
              { icon: Clock,    label: 'Self-paced' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="meta-chip">
                <Icon size={15} style={{ color: T.green, flexShrink: 0 }} /> {label}
              </span>
            ))}
            {avgRating && (
              <span className="meta-chip" style={{ color: '#92400E' }}>
                <Star size={14} style={{ fill: '#F59E0B', color: '#F59E0B', flexShrink: 0 }} />
                {avgRating} ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
              </span>
            )}
          </div>

          {/* Mobile CTA */}
          <div className="pg-mobile-cta">
            <CtaCard {...ctaProps} />
          </div>

          {/* ── DESCRIPTION ── */}
          {course.description && (
            <section style={{ marginTop: 36 }}>
              <div style={{ height: 1, background: T.border, marginBottom: 28 }} />
              <h2 className="section-heading">About this course</h2>
              <p
                ref={descRef}
                style={{
                  fontSize: 16, color: T.ink2, lineHeight: 1.75, margin: 0,
                  whiteSpace: 'pre-wrap',
                  ...(!descExpanded
                    ? { display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
                    : {}),
                }}
              >
                {course.description}
              </p>
              {(descOverflows || descExpanded) && (
                <button
                  onClick={() => setDescExpanded(!descExpanded)}
                  style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 14, fontWeight: 600, color: T.green, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: FONT_BODY }}
                >
                  {descExpanded ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Read more</>}
                </button>
              )}
            </section>
          )}

          {/* ── CURRICULUM ── */}
          {course.modules.length > 0 && (
            <section style={{ marginTop: 36 }}>
              <div style={{ height: 1, background: T.border, marginBottom: 28 }} />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
                <h2 className="section-heading" style={{ margin: 0 }}>Curriculum</h2>
                <span style={{ fontSize: 14, color: T.muted, fontWeight: 400 }}>
                  {course.modules.length} modules · {totalVideos + totalPdfs} resources
                </span>
              </div>
              <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', background: T.white }}>
                {course.modules.map((mod: any, index: number) => {
                  const vc = mod.videos.length;
                  const pc = mod.pdfs.length;
                  return (
                    <div
                      key={mod.id}
                      style={{
                        padding: '20px 22px',
                        borderBottom: index < course.modules.length - 1 ? `1px solid ${T.border}` : 'none',
                        display: 'flex', gap: 16, alignItems: 'flex-start',
                      }}
                    >
                      {/* Number */}
                      <div style={{
                        width: 34, height: 34, flexShrink: 0, borderRadius: 4,
                        background: T.surface, border: `1px solid ${T.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: T.muted,
                        marginTop: 1,
                      }}>
                        {index + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 16, fontWeight: 600, color: T.ink, margin: '0 0 4px', lineHeight: 1.35 }}>{mod.title}</p>
                        {mod.description && (
                          <p style={{ fontSize: 14, color: T.muted, margin: '0 0 10px', lineHeight: 1.55 }}>{mod.description}</p>
                        )}
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                          {vc > 0 && (
                            <span style={{ fontSize: 13, fontWeight: 500, color: T.muted, display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Play size={12} style={{ color: T.green }} /> {vc} video{vc !== 1 ? 's' : ''}
                            </span>
                          )}
                          {pc > 0 && (
                            <span style={{ fontSize: 13, fontWeight: 500, color: T.muted, display: 'flex', alignItems: 'center', gap: 5 }}>
                              <FileText size={12} style={{ color: T.green }} /> {pc} PDF{pc !== 1 ? 's' : ''}
                            </span>
                          )}
                          {vc === 0 && pc === 0 && (
                            <span style={{ fontSize: 13, color: T.muted2, fontStyle: 'italic' }}>No resources yet</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── REVIEWS ── */}
          <div style={{ marginTop: 36 }}>
            <div style={{ height: 1, background: T.border, marginBottom: 28 }} />
            <ReviewsSection
              courseId={courseId!}
              isEnrolled={isEnrolled}
              reviews={reviews}
              avgRating={avgRating}
              totalReviews={totalReviews}
              myReview={myReview}
            />
          </div>
        </div>

        {/* ── RIGHT COLUMN: sticky CTA ── */}
        <div className="pg-desktop-cta" style={{ position: 'sticky', top: 70 }}>
          <CtaCard {...ctaProps} />
        </div>
      </div>

      {/* ── PAYMENT MODAL ── */}
      {paymentOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, width: '100%', maxWidth: 440, overflow: 'hidden' }}>

            {/* Modal header */}
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: FONT_BODY, fontSize: 16, fontWeight: 700, color: T.ink }}>
                {paymentStatus === 'success' ? 'Confirmed' : paymentStatus === 'failed' ? 'Payment failed' : paymentStatus === 'pending' ? 'Waiting for payment' : 'Pay with Mobile Money'}
              </span>
              <button onClick={closePayment} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 4, display: 'flex' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 24 }}>
              {paymentStatus === 'success' ? (
                <div style={{ textAlign: 'center', padding: '20px 0 12px' }}>
                  <CheckCheck size={52} style={{ color: T.green, margin: '0 auto 16px', display: 'block' }} />
                  <p style={{ fontFamily: FONT_DISPLAY, fontSize: 36, fontWeight: 800, color: T.ink, margin: '0 0 8px', lineHeight: 1.1 }}>Payment confirmed!</p>
                  <p style={{ fontSize: 15, color: T.muted }}>Taking you to your course…</p>
                </div>
              ) : paymentStatus === 'failed' ? (
                <div>
                  <p style={{ fontSize: 15, color: T.muted, margin: '0 0 24px', lineHeight: 1.65 }}>
                    {paymentMessage ?? 'The payment was declined or timed out. Please try again.'}
                  </p>
                  <button
                    className="pg-btn"
                    onClick={() => { setPaymentStatus('idle'); setPaymentId(null); setPaymentMessage(null); }}
                    style={{ background: T.green, color: '#fff' }}
                  >
                    Try again
                  </button>
                </div>
              ) : paymentStatus === 'pending' ? (
                <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
                  <Smartphone size={44} style={{ color: T.green, margin: '0 auto 16px', display: 'block' }} />
                  <p style={{ fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 800, color: T.ink, margin: '0 0 12px', lineHeight: 1.1 }}>Check your phone</p>
                  <p style={{ fontSize: 15, color: T.muted, margin: '0 0 22px', lineHeight: 1.65 }}>
                    A prompt was sent to <strong style={{ color: T.ink }}>{phone}</strong>.{' '}
                    Enter your mobile money PIN to approve.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: T.muted, fontSize: 14, fontWeight: 500 }}>
                    <Loader2 size={16} style={{ animation: 'spin 0.9s linear infinite', color: T.green }} />
                    Waiting for confirmation…
                  </div>
                </div>
              ) : (
                <div>
                  {/* Summary */}
                  <div style={{ padding: '16px 18px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, marginBottom: 22 }}>
                    <p style={{ fontSize: 13, color: T.muted, margin: '0 0 6px', fontWeight: 500, lineHeight: 1.4, maxWidth: 340 }}>{course.title}</p>
                    <p style={{ fontFamily: FONT_DISPLAY, fontSize: 42, fontWeight: 800, color: T.ink, margin: 0, lineHeight: 1 }}>
                      UGX {discountedPrice.toLocaleString()}
                    </p>
                    {discountActive && (
                      <p style={{ fontSize: 13, color: T.muted, textDecoration: 'line-through', margin: '5px 0 0' }}>
                        UGX {price.toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Phone input */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: T.ink, marginBottom: 8 }}>
                      Mobile money number
                    </label>
                    <div style={{ display: 'flex', border: `1.5px solid ${T.border}`, borderRadius: 6, overflow: 'hidden', background: T.white }}>
                      <div style={{ padding: '0 14px', borderRight: `1px solid ${T.border}`, background: T.surface, height: 52, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        <Smartphone size={16} style={{ color: T.muted }} />
                      </div>
                      <input
                        type="tel"
                        placeholder="0711 234 567"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="pg-input"
                        style={{ flex: 1, padding: '14px 16px', border: 'none', outline: 'none', fontSize: 16, color: T.ink, background: 'transparent', fontFamily: FONT_BODY }}
                      />
                    </div>
                    <p style={{ fontSize: 12, color: T.muted, margin: '6px 0 0' }}>MTN or Airtel Uganda</p>
                  </div>

                  {error && (
                    <div style={{ fontSize: 14, color: T.red, background: T.redBg, border: '1px solid #FECACA', padding: '10px 14px', borderRadius: 6, marginBottom: 16 }}>
                      {error}
                    </div>
                  )}

                  <button
                    className="pg-btn"
                    onClick={handlePay}
                    disabled={paying || !phone.trim()}
                    style={{ background: paying || !phone.trim() ? T.border : T.green, color: paying || !phone.trim() ? T.muted : '#fff' }}
                  >
                    {paying
                      ? <><Loader2 size={16} style={{ animation: 'spin 0.9s linear infinite' }} /> Sending prompt…</>
                      : 'Pay now'}
                  </button>
                  <p style={{ fontSize: 12, color: T.muted2, textAlign: 'center', margin: '12px 0 0' }}>
                    You'll receive a USSD prompt on your phone.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CTA Card ────────────────────────────────────────────────────────────────
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
  const returnPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const ctaParam   = `?next=${encodeURIComponent(returnPath)}&courseTitle=${encodeURIComponent(title)}`;
  const signInHref = `/sign-in${ctaParam}`;
  const signUpHref = `/sign-up${ctaParam}`;

  return (
    <div style={{ border: `1.5px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', background: T.white }}>

      {/* Price */}
      {!isEnrolled && (
        <div style={{ padding: '26px 24px 22px', borderBottom: `1px solid ${T.border}` }}>
          {isFree ? (
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 56, fontWeight: 800, color: T.green, lineHeight: 1 }}>Free</div>
          ) : (
            <>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 56, fontWeight: 800, color: T.ink, lineHeight: 1 }}>
                UGX {discountedPrice.toLocaleString()}
              </div>
              {discountActive && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                  <span style={{ fontSize: 15, color: T.muted, textDecoration: 'line-through' }}>UGX {price.toLocaleString()}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.red, background: T.redBg, padding: '3px 8px', borderRadius: 4 }}>
                    -{discountPercent}%
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Action */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}` }}>
        {isEnrolled ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 600, color: T.green, marginBottom: 14 }}>
              <CheckCircle2 size={15} /> You&apos;re enrolled
            </div>
            <button className="pg-btn" onClick={onContinue} style={{ background: T.green, color: '#fff' }}>
              <Play size={16} fill="white" /> Continue Learning
            </button>
          </>
        ) : isLoggedIn ? (
          <div>
            {isFree ? (
              <button className="pg-btn" onClick={onEnroll} disabled={enrolling} style={{ background: enrolling ? T.border : T.green, color: enrolling ? T.muted : '#fff' }}>
                {enrolling
                  ? <><Loader2 size={16} style={{ animation: 'spin 0.9s linear infinite' }} /> Enrolling…</>
                  : <><GraduationCap size={16} /> Enroll for free</>}
              </button>
            ) : (
              <button className="pg-btn" onClick={onPay} style={{ background: T.green, color: '#fff' }}>
                <Smartphone size={16} /> Pay with Mobile Money
              </button>
            )}
            {error && <p style={{ fontSize: 13, color: T.red, margin: '10px 0 0', textAlign: 'center' }}>{error}</p>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href={signUpHref} className="pg-btn" style={{ background: T.green, color: '#fff', textDecoration: 'none' }}>
              <GraduationCap size={16} /> {isFree ? 'Sign up & enroll free' : 'Sign up to enroll'}
            </Link>
            <p style={{ fontSize: 14, color: T.muted, textAlign: 'center', margin: 0 }}>
              Already have an account?{' '}
              <Link href={signInHref} style={{ color: T.green, fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>
        )}
      </div>

      {/* Includes */}
      <div style={{ padding: '20px 24px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.muted2, textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 16px' }}>
          This course includes
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {[
            { icon: BookOpen,      label: `${modules} module${modules !== 1 ? 's' : ''}` },
            { icon: Play,          label: `${videos} video${videos !== 1 ? 's' : ''}` },
            { icon: FileText,      label: `${pdfs} PDF resource${pdfs !== 1 ? 's' : ''}` },
            { icon: Clock,         label: 'Self-paced learning' },
            { icon: GraduationCap, label: 'Certificate on completion' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: T.ink2 }}>
              <Icon size={15} style={{ color: T.green, flexShrink: 0 }} /> {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
