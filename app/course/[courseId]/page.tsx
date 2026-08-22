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
  CheckCircle2, GraduationCap, Loader2, ChevronDown, ChevronUp,
  Users, Star, Smartphone, X, CheckCheck, Shield,
} from 'lucide-react';
import { ReviewsSection } from './reviews';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const ACCENT  = '#0B00FF';
const INK     = '#0E0E1A';
const MUTED   = '#6B6B8A';
const IVORY   = '#F7F5F0';
const RULE    = '#E2DDD6';
const WHITE   = '#FFFFFF';
const RED     = '#DC2626';
const REDBG   = '#FEF2F2';
const HERO_BG = '#0A0A16'; // near-black for hero

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
    <div style={{ minHeight: '100vh', background: IVORY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: `2.5px solid ${ACCENT}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!course) return (
    <div style={{ minHeight: '100vh', background: IVORY, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: WHITE, border: `1px solid ${RULE}`, padding: '56px 48px', maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <BookOpen size={40} style={{ color: RULE, margin: '0 auto 16px', display: 'block' }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, color: INK, margin: '0 0 8px' }}>Course not found</h2>
        <p style={{ fontSize: 15, color: MUTED, margin: '0 0 24px', lineHeight: 1.7 }}>{error || "This course doesn't exist."}</p>
        <Link href="/courses" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: ACCENT, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
          <ArrowLeft size={14} /> All Courses
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
    <div style={{ minHeight: '100vh', background: IVORY, fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .course-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 0;
          max-width: 1200px;
          margin: 0 auto;
          padding: 56px 32px 96px;
          align-items: start;
        }
        .course-main { padding-right: 56px; }
        .course-sidebar { position: sticky; top: 24px; }
        .mobile-cta { display: none; }
        @media (max-width: 900px) {
          .course-grid { grid-template-columns: 1fr; padding: 32px 20px 80px; }
          .course-main { padding-right: 0; }
          .desktop-cta { display: none; }
          .mobile-cta { display: block; margin: 32px 0; }
        }
        .cta-btn {
          width: 100%; padding: 16px; border: none; font-size: 15px;
          font-weight: 700; cursor: pointer; display: flex;
          align-items: center; justify-content: center; gap: 9px;
          font-family: system-ui, sans-serif; transition: opacity .15s, transform .1s;
          letter-spacing: 0.01em;
        }
        .cta-btn:hover:not(:disabled) { opacity: .92; transform: translateY(-1px); }
        .cta-btn:disabled { opacity: .45; cursor: not-allowed; }
        .module-row:hover { background: rgba(11,0,255,0.025); }
        .pg-input:focus { outline: 2px solid ${ACCENT}; outline-offset: -2px; }
      `}</style>

      {/* ── TOP NAV ── */}
      <nav style={{ background: WHITE, borderBottom: `1px solid ${RULE}`, position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/courses" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: MUTED, textDecoration: 'none' }}>
            <ArrowLeft size={14} /> All Courses
          </Link>
          <div style={{ flex: 1 }} />
          {isEnrolled && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#059669', background: '#D1FAE5', padding: '5px 12px', letterSpacing: '0.04em' }}>
              <CheckCircle2 size={12} /> Enrolled
            </span>
          )}
          {isLoggedIn ? (
            <Link href="/learn/dashboard" style={{ fontSize: 13, fontWeight: 600, color: MUTED, textDecoration: 'none' }}>My Learning</Link>
          ) : (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Link href="/sign-in" style={{ fontSize: 13, fontWeight: 500, color: MUTED, textDecoration: 'none' }}>Sign in</Link>
              <Link href="/sign-up" style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: ACCENT, padding: '8px 18px', textDecoration: 'none' }}>Get started</Link>
            </div>
          )}
        </div>
      </nav>

      {/* ── HERO BANNER ── */}
      <div style={{ background: HERO_BG, padding: '0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 32px 52px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 0, alignItems: 'center' }}>

          {/* Left: course info */}
          <div style={{ paddingRight: 56 }}>

            {/* Breadcrumb badges */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {course.level && (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#A5B4FC', background: 'rgba(99,102,241,0.15)', padding: '4px 10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {course.level}
                </span>
              )}
              {discountActive && !isEnrolled && (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#FCA5A5', background: 'rgba(239,68,68,0.15)', padding: '4px 10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {course.discountPercent}% off
                </span>
              )}
              {course.language && (
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.08)', padding: '4px 10px' }}>
                  {course.language}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(28px, 4vw, 48px)',
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              margin: '0 0 20px',
            }}>
              {course.title}
            </h1>

            {/* Description preview */}
            {course.description && (
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: '0 0 28px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {course.description}
              </p>
            )}

            {/* Rating */}
            {avgRating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={14} style={{ fill: i <= Math.round(avgRating) ? '#FBBF24' : 'transparent', color: '#FBBF24' }} />
                  ))}
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#FBBF24' }}>{avgRating.toFixed(1)}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>({totalReviews} review{totalReviews !== 1 ? 's' : ''})</span>
              </div>
            )}

            {/* Instructor */}
            {course.instructor && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={14} color="rgba(255,255,255,0.5)" />
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
                  Instructor: <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{course.instructor}</span>
                </span>
              </div>
            )}

            {/* Meta chips */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { icon: BookOpen, label: `${course.modules.length} module${course.modules.length !== 1 ? 's' : ''}` },
                { icon: Play,     label: `${totalVideos} video${totalVideos !== 1 ? 's' : ''}` },
                { icon: FileText, label: `${totalPdfs} PDF${totalPdfs !== 1 ? 's' : ''}` },
                { icon: Clock,    label: 'Self-paced' },
              ].map(({ icon: Icon, label }) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                  <Icon size={13} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} /> {label}
                </span>
              ))}
            </div>
          </div>

          {/* Right: thumbnail */}
          <div style={{ position: 'relative' }}>
            <div style={{ width: '100%', aspectRatio: '16/9', background: '#111', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
              {thumbnailUrl ? (
                <img src={thumbnailUrl} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a1a2e, #0d0d1a)' }}>
                  <BookOpen size={48} style={{ color: 'rgba(255,255,255,0.15)' }} />
                </div>
              )}
              {/* Play overlay hint */}
              {thumbnailUrl && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.1)', opacity: 0, transition: 'opacity .2s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Play size={22} fill={ACCENT} color={ACCENT} style={{ marginLeft: 3 }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY GRID ── */}
      <div className="course-grid">

        {/* ── LEFT: content ── */}
        <div className="course-main">

          {/* Mobile CTA */}
          <div className="mobile-cta">
            <CtaCard {...ctaProps} />
          </div>

          {/* ── What you'll learn ── */}
          {course.whatYoullLearn && (() => {
            try {
              const items: string[] = JSON.parse(course.whatYoullLearn);
              if (!items.length) return null;
              return (
                <section style={{ marginBottom: 48 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: MUTED, margin: '0 0 10px' }}>What you'll learn</p>
                  <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: INK, margin: '0 0 24px', lineHeight: 1.2 }}>
                    Skills you'll walk away with
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                    {items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', background: WHITE, border: `1px solid ${RULE}` }}>
                        <CheckCircle2 size={16} style={{ color: ACCENT, flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 14, color: INK, lineHeight: 1.55 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </section>
              );
            } catch { return null; }
          })()}

          {/* ── Description ── */}
          {course.description && (
            <section style={{ marginBottom: 48 }}>
              <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: 40 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: MUTED, margin: '0 0 10px' }}>About this course</p>
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: INK, margin: '0 0 20px', lineHeight: 1.2 }}>
                  Course overview
                </h2>
                <p
                  ref={descRef}
                  style={{
                    fontSize: 16, color: '#3A3A5C', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap',
                    ...(!descExpanded ? { display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}),
                  }}
                >
                  {course.description}
                </p>
                {(descOverflows || descExpanded) && (
                  <button onClick={() => setDescExpanded(!descExpanded)}
                    style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 14, fontWeight: 600, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {descExpanded ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Read more</>}
                  </button>
                )}
              </div>
            </section>
          )}

          {/* ── Curriculum ── */}
          {course.modules.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: 40 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: MUTED, margin: '0 0 10px' }}>Curriculum</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 28 }}>
                  <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: INK, margin: 0, lineHeight: 1.2 }}>
                    Course content
                  </h2>
                  <span style={{ fontSize: 13, color: MUTED }}>
                    {course.modules.length} modules · {totalVideos + totalPdfs} resources
                  </span>
                </div>
                <div style={{ border: `1px solid ${RULE}`, background: WHITE, overflow: 'hidden' }}>
                  {course.modules.map((mod: any, index: number) => {
                    const vc = mod.videos.length;
                    const pc = mod.pdfs.length;
                    return (
                      <div
                        key={mod.id}
                        className="module-row"
                        style={{
                          padding: '22px 28px',
                          borderBottom: index < course.modules.length - 1 ? `1px solid ${RULE}` : 'none',
                          display: 'flex', gap: 20, alignItems: 'flex-start',
                          transition: 'background .15s',
                        }}
                      >
                        {/* Index */}
                        <div style={{
                          width: 36, height: 36, flexShrink: 0,
                          border: `1px solid ${RULE}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'system-ui, sans-serif',
                          fontSize: 11, fontWeight: 700, color: MUTED,
                          letterSpacing: '0.06em', marginTop: 2,
                        }}>
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 16, fontWeight: 600, color: INK, margin: '0 0 5px', lineHeight: 1.4 }}>{mod.title}</p>
                          {mod.description && (
                            <p style={{ fontSize: 14, color: MUTED, margin: '0 0 12px', lineHeight: 1.6 }}>{mod.description}</p>
                          )}
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            {vc > 0 && (
                              <span style={{ fontSize: 13, color: MUTED, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Play size={11} style={{ color: ACCENT }} /> {vc} video{vc !== 1 ? 's' : ''}
                              </span>
                            )}
                            {pc > 0 && (
                              <span style={{ fontSize: 13, color: MUTED, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <FileText size={11} style={{ color: ACCENT }} /> {pc} PDF{pc !== 1 ? 's' : ''}
                              </span>
                            )}
                            {vc === 0 && pc === 0 && (
                              <span style={{ fontSize: 13, color: MUTED, fontStyle: 'italic' }}>No resources yet</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* ── Reviews ── */}
          <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: 40 }}>
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

        {/* ── RIGHT: sticky CTA ── */}
        <div className="course-sidebar desktop-cta">
          <CtaCard {...ctaProps} />
        </div>
      </div>

      {/* ── PAYMENT MODAL ── */}
      {paymentOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,22,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: WHITE, width: '100%', maxWidth: 440, overflow: 'hidden', animation: 'fadeUp .2s ease' }}>

            {/* Modal header */}
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${RULE}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: INK }}>
                {paymentStatus === 'success' ? 'Payment confirmed' : paymentStatus === 'failed' ? 'Payment failed' : paymentStatus === 'pending' ? 'Awaiting payment' : 'Pay with Mobile Money'}
              </span>
              <button onClick={closePayment} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 4, display: 'flex' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 28 }}>
              {paymentStatus === 'success' ? (
                <div style={{ textAlign: 'center', padding: '24px 0 12px' }}>
                  <CheckCheck size={48} style={{ color: '#059669', margin: '0 auto 20px', display: 'block' }} />
                  <h3 style={{ fontSize: 24, fontWeight: 800, color: INK, margin: '0 0 8px' }}>Payment confirmed!</h3>
                  <p style={{ fontSize: 15, color: MUTED }}>Taking you to your course…</p>
                </div>
              ) : paymentStatus === 'failed' ? (
                <div>
                  <p style={{ fontSize: 15, color: MUTED, margin: '0 0 24px', lineHeight: 1.7 }}>
                    {paymentMessage ?? 'The payment was declined or timed out. Please try again.'}
                  </p>
                  <button className="cta-btn" onClick={() => { setPaymentStatus('idle'); setPaymentId(null); setPaymentMessage(null); }}
                    style={{ background: ACCENT, color: '#fff' }}>
                    Try again
                  </button>
                </div>
              ) : paymentStatus === 'pending' ? (
                <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
                  <Smartphone size={44} style={{ color: ACCENT, margin: '0 auto 20px', display: 'block' }} />
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: INK, margin: '0 0 12px' }}>Check your phone</h3>
                  <p style={{ fontSize: 15, color: MUTED, margin: '0 0 24px', lineHeight: 1.7 }}>
                    A prompt was sent to <strong style={{ color: INK }}>{phone}</strong>. Enter your mobile money PIN to approve.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: MUTED, fontSize: 14, fontWeight: 500 }}>
                    <Loader2 size={16} style={{ animation: 'spin 0.9s linear infinite', color: ACCENT }} />
                    Waiting for confirmation…
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ padding: '18px 20px', background: IVORY, border: `1px solid ${RULE}`, marginBottom: 24 }}>
                    <p style={{ fontSize: 13, color: MUTED, margin: '0 0 6px', lineHeight: 1.45 }}>{course.title}</p>
                    <p style={{ fontSize: 36, fontWeight: 800, color: INK, margin: 0, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                      UGX {discountedPrice.toLocaleString()}
                    </p>
                    {discountActive && (
                      <p style={{ fontSize: 13, color: MUTED, textDecoration: 'line-through', margin: '6px 0 0' }}>
                        UGX {price.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: INK, marginBottom: 8, letterSpacing: '0.02em' }}>
                      Mobile money number
                    </label>
                    <div style={{ display: 'flex', border: `1.5px solid ${RULE}`, overflow: 'hidden', background: WHITE }}>
                      <div style={{ padding: '0 14px', borderRight: `1px solid ${RULE}`, background: IVORY, height: 52, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        <Smartphone size={15} style={{ color: MUTED }} />
                      </div>
                      <input type="tel" placeholder="0711 234 567" value={phone} onChange={e => setPhone(e.target.value)}
                        className="pg-input"
                        style={{ flex: 1, padding: '14px 16px', border: 'none', outline: 'none', fontSize: 16, color: INK, background: 'transparent', fontFamily: 'system-ui, sans-serif' }} />
                    </div>
                    <p style={{ fontSize: 12, color: MUTED, margin: '6px 0 0' }}>MTN or Airtel Uganda</p>
                  </div>
                  {error && (
                    <div style={{ fontSize: 14, color: RED, background: REDBG, border: '1px solid #FECACA', padding: '10px 14px', marginBottom: 16 }}>
                      {error}
                    </div>
                  )}
                  <button className="cta-btn" onClick={handlePay} disabled={paying || !phone.trim()}
                    style={{ background: paying || !phone.trim() ? RULE : ACCENT, color: paying || !phone.trim() ? MUTED : '#fff' }}>
                    {paying ? <><Loader2 size={16} style={{ animation: 'spin 0.9s linear infinite' }} /> Sending prompt…</> : 'Pay now'}
                  </button>
                  <p style={{ fontSize: 12, color: MUTED, textAlign: 'center', margin: '12px 0 0' }}>
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
    <div style={{ background: WHITE, border: `1px solid ${RULE}`, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>

      {/* Price */}
      {!isEnrolled && (
        <div style={{ padding: '28px 28px 24px', borderBottom: `1px solid ${RULE}`, background: IVORY }}>
          {isFree ? (
            <p style={{ fontSize: 44, fontWeight: 900, color: ACCENT, lineHeight: 1, margin: 0, fontVariantNumeric: 'tabular-nums' }}>Free</p>
          ) : (
            <>
              <p style={{ fontSize: 44, fontWeight: 900, color: INK, lineHeight: 1, margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                UGX {discountedPrice.toLocaleString()}
              </p>
              {discountActive && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                  <span style={{ fontSize: 15, color: MUTED, textDecoration: 'line-through' }}>UGX {price.toLocaleString()}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: RED, background: REDBG, padding: '3px 8px', letterSpacing: '0.06em' }}>
                    -{discountPercent}%
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Action */}
      <div style={{ padding: '24px 28px', borderBottom: `1px solid ${RULE}` }}>
        {isEnrolled ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: '#059669', marginBottom: 16, letterSpacing: '0.02em' }}>
              <CheckCircle2 size={14} /> You're enrolled
            </div>
            <button className="cta-btn" onClick={onContinue} style={{ background: ACCENT, color: '#fff' }}>
              <Play size={15} fill="white" /> Continue Learning
            </button>
          </>
        ) : isLoggedIn ? (
          <>
            {isFree ? (
              <button className="cta-btn" onClick={onEnroll} disabled={enrolling}
                style={{ background: enrolling ? RULE : ACCENT, color: enrolling ? MUTED : '#fff', marginBottom: 0 }}>
                {enrolling
                  ? <><Loader2 size={15} style={{ animation: 'spin 0.9s linear infinite' }} /> Enrolling…</>
                  : <><GraduationCap size={15} /> Enroll for free</>}
              </button>
            ) : (
              <button className="cta-btn" onClick={onPay} style={{ background: ACCENT, color: '#fff' }}>
                <Smartphone size={15} /> Pay with Mobile Money
              </button>
            )}
            {error && <p style={{ fontSize: 13, color: RED, margin: '10px 0 0', textAlign: 'center' }}>{error}</p>}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href={signUpHref} className="cta-btn" style={{ background: ACCENT, color: '#fff', textDecoration: 'none' }}>
              <GraduationCap size={15} /> {isFree ? 'Sign up & enroll free' : 'Sign up to enroll'}
            </Link>
            <p style={{ fontSize: 13, color: MUTED, textAlign: 'center', margin: 0 }}>
              Already have an account?{' '}
              <Link href={signInHref} style={{ color: ACCENT, fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>
        )}
      </div>

      {/* Includes */}
      <div style={{ padding: '22px 28px' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.16em', margin: '0 0 16px' }}>
          This course includes
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { icon: BookOpen,      label: `${modules} module${modules !== 1 ? 's' : ''}` },
            { icon: Play,          label: `${videos} video${videos !== 1 ? 's' : ''}` },
            { icon: FileText,      label: `${pdfs} PDF resource${pdfs !== 1 ? 's' : ''}` },
            { icon: Clock,         label: 'Self-paced learning' },
            { icon: GraduationCap, label: 'Certificate on completion' },
            { icon: Shield,        label: 'Full lifetime access' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: INK }}>
              <Icon size={14} style={{ color: ACCENT, flexShrink: 0 }} /> {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
