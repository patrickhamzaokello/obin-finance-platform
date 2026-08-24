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
  Users, Star, Smartphone, X, CheckCheck, Shield, Lock,
  Globe, Tag,
} from 'lucide-react';
import { ReviewsSection } from './reviews';

// ─── Design tokens ────────────────────────────────────────────────────────────
const ACCENT  = '#0B00FF';
const INK     = '#111111';
const MUTED   = '#666666';
const BG      = '#EEECEA';   // warm light grey ground (like Skool's #F2F2F2)
const WHITE   = '#FFFFFF';
const BORDER  = '#E5E5E5';
const RED     = '#DC2626';
const REDBG   = '#FEF2F2';
const CHIPBG  = '#F2F2F2';

// ─── Page ─────────────────────────────────────────────────────────────────────
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
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: `2.5px solid ${ACCENT}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!course) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: WHITE, borderRadius: 16, padding: '56px 48px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
        <BookOpen size={40} style={{ color: BORDER, margin: '0 auto 16px', display: 'block' }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, color: INK, margin: '0 0 8px' }}>Course not found</h2>
        <p style={{ fontSize: 18, color: MUTED, margin: '0 0 24px', lineHeight: 1.7 }}>{error || "This course doesn't exist."}</p>
        <Link href="/courses" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: ACCENT, color: '#fff', fontSize: 18, fontWeight: 700, textDecoration: 'none', borderRadius: 10 }}>
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

  const returnPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const ctaParam   = `?next=${encodeURIComponent(returnPath)}&courseTitle=${encodeURIComponent(course.title)}`;

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { transform:translateY(100%); opacity:0; } to { transform:translateY(0); opacity:1; } }

        .pg-grid {
          max-width: 1140px; margin: 0 auto; padding: 32px 20px 80px;
          display: grid; grid-template-columns: 1fr 320px; gap: 24px; align-items: start;
        }
        @media (max-width: 860px) {
          .pg-grid { grid-template-columns: 1fr; padding: 16px 12px 80px; gap: 16px; }
          .sidebar-col { order: -1; }
        }
        .card { background: ${WHITE}; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.04); }
        .module-row { transition: background .12s; cursor: default; }
        .module-row:hover { background: #FAFAFA; }
        .cta-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 15px 20px; border: none; border-radius: 12px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          font-family: inherit; transition: opacity .15s, transform .1s; letter-spacing: 0.01em;
        }
        .cta-btn:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
        .cta-btn:disabled { opacity: .45; cursor: not-allowed; }
        .inp:focus { outline: 2px solid ${ACCENT}; outline-offset: -2px; }
        .chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 11px; border-radius: 999px;
          background: ${CHIPBG}; font-size: 12px; color: ${MUTED}; font-weight: 500;
        }
        .check-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; border-bottom: 1px solid ${BORDER}; }
        .check-item:last-child { border-bottom: none; }

        /* Payment modal — centered on desktop, bottom sheet on mobile */
        .pay-modal-wrap {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50;
          display: flex; align-items: center; justify-content: center;
          padding: 20px; backdrop-filter: blur(4px);
        }
        .pay-modal {
          background: ${WHITE}; border-radius: 20px; width: 100%; max-width: 420px;
          overflow: hidden; animation: fadeUp .2s ease; box-shadow: 0 24px 80px rgba(0,0,0,0.2);
        }
        @media (max-width: 540px) {
          .pay-modal-wrap { align-items: flex-end; padding: 0; }
          .pay-modal { border-radius: 24px 24px 0 0; max-width: 100%; animation: slideUp .25s ease; }
        }
      `}</style>

      {/* ── TOP NAV ── */}
      <nav style={{ background: WHITE, borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/courses" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: MUTED, textDecoration: 'none', padding: '6px 12px', borderRadius: 8, background: CHIPBG, whiteSpace: 'nowrap' }}>
            <ArrowLeft size={13} /> <span style={{ display: 'none' }} className="sm-show">All Courses</span>
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: INK, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.title}</p>
          </div>
          {isLoggedIn ? (
            <Link href="/learn/dashboard" style={{ fontSize: 13, fontWeight: 600, color: MUTED, textDecoration: 'none', whiteSpace: 'nowrap' }}>My Learning</Link>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <Link href="/sign-in" style={{ fontSize: 13, fontWeight: 600, color: MUTED, textDecoration: 'none', padding: '7px 12px', borderRadius: 8 }}>Sign in</Link>
              <Link href="/sign-up" style={{ fontSize: 13, fontWeight: 700, color: WHITE, background: ACCENT, padding: '7px 14px', textDecoration: 'none', borderRadius: 8, whiteSpace: 'nowrap' }}>Get started</Link>
            </div>
          )}
        </div>
      </nav>

      {/* ── MAIN GRID ── */}
      <div className="pg-grid">

        {/* ── LEFT: main content card ── */}
        <div className="card">

          {/* Thumbnail / video preview */}
          <div style={{ position: 'relative', background: '#0D0D1A' }}>
            <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
              {thumbnailUrl ? (
                <img src={thumbnailUrl} alt={course.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={52} style={{ color: 'rgba(255,255,255,0.12)' }} />
                </div>
              )}
            </div>
            {/* Enrolled ribbon */}
            {isEnrolled && (
              <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 6, background: '#059669', color: WHITE, fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 999 }}>
                <CheckCircle2 size={12} /> Enrolled
              </div>
            )}
            {/* Discount ribbon */}
            {discountActive && !isEnrolled && (
              <div style={{ position: 'absolute', top: 16, right: 16, background: RED, color: WHITE, fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999, letterSpacing: '0.04em' }}>
                -{course.discountPercent}% OFF
              </div>
            )}
          </div>

          {/* Title + meta */}
          <div style={{ padding: 'clamp(16px, 4vw, 28px)' }}>
            <h1 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800, color: INK, margin: '0 0 16px', lineHeight: 1.25, letterSpacing: '-0.02em' }}>
              {course.title}
            </h1>

            {/* Meta chips row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              <span className="chip"><Lock size={12} /> Private</span>
              {course.instructor && (
                <span className="chip"><Users size={12} /> {course.instructor}</span>
              )}
              {isFree ? (
                <span className="chip" style={{ color: '#059669', background: '#D1FAE5', fontWeight: 700 }}><Tag size={12} /> Free</span>
              ) : (
                <span className="chip" style={{ color: INK, fontWeight: 700 }}>
                  <Tag size={12} />
                  {discountActive
                    ? <><span style={{ textDecoration: 'line-through', fontWeight: 400, color: MUTED }}>UGX {price.toLocaleString()}</span>{' '}UGX {discountedPrice.toLocaleString()}</>
                    : `UGX ${price.toLocaleString()}`
                  }
                </span>
              )}
              {course.level && (
                <span className="chip"><Globe size={12} /> {course.level}</span>
              )}
              {avgRating && (
                <span className="chip" style={{ color: '#92400E', background: '#FEF3C7' }}>
                  <Star size={12} style={{ fill: '#F59E0B', color: '#F59E0B' }} /> {avgRating.toFixed(1)} ({totalReviews})
                </span>
              )}
            </div>

            <div style={{ height: 1, background: BORDER, marginBottom: 24 }} />

            {/* Description */}
            {course.description && (
              <div style={{ marginBottom: 28 }}>
                <p
                  ref={descRef}
                  style={{
                    fontSize: 15, color: '#333', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap',
                    ...(!descExpanded ? { display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}),
                  }}
                >
                  {course.description}
                </p>
                {(descOverflows || descExpanded) && (
                  <button onClick={() => setDescExpanded(!descExpanded)}
                    style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 18, fontWeight: 600, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {descExpanded ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> Read more</>}
                  </button>
                )}
              </div>
            )}

            {/* What you'll learn */}
            {course.whatYoullLearn && (() => {
              try {
                const items: string[] = JSON.parse(course.whatYoullLearn);
                if (!items.length) return null;
                return (
                  <div style={{ marginBottom: 28 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED, margin: '0 0 12px' }}>What's inside</p>
                    <div>
                      {items.map((item, i) => (
                        <div key={i} className="check-item">
                          <CheckCircle2 size={16} style={{ color: '#059669', flexShrink: 0, marginTop: 1 }} />
                          <span style={{ fontSize: 14, color: INK, lineHeight: 1.55 }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              } catch { return null; }
            })()}
          </div>

          {/* Curriculum */}
          {course.modules.length > 0 && (
            <div style={{ borderTop: `1px solid ${BORDER}`, padding: 'clamp(16px, 4vw, 28px)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED, margin: 0 }}>Curriculum</p>
                <span style={{ fontSize: 12, color: MUTED }}>{course.modules.length} modules · {totalVideos + totalPdfs} resources</span>
              </div>
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
                {course.modules.map((mod: any, index: number) => {
                  const vc = mod.videos.length;
                  const pc = mod.pdfs.length;
                  return (
                    <div key={mod.id} className="module-row"
                      style={{ padding: '16px 20px', borderBottom: index < course.modules.length - 1 ? `1px solid ${BORDER}` : 'none', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: CHIPBG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: MUTED, flexShrink: 0, marginTop: 1 }}>
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: INK, margin: '0 0 4px', lineHeight: 1.4 }}>{mod.title}</p>
                        {mod.description && (
                          <p style={{ fontSize: 13, color: MUTED, margin: '0 0 6px', lineHeight: 1.55 }}>{mod.description}</p>
                        )}
                        <div style={{ display: 'flex', gap: 12 }}>
                          {vc > 0 && <span style={{ fontSize: 12, color: MUTED, display: 'flex', alignItems: 'center', gap: 4 }}><Play size={10} style={{ color: ACCENT }} /> {vc} video{vc !== 1 ? 's' : ''}</span>}
                          {pc > 0 && <span style={{ fontSize: 12, color: MUTED, display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={10} style={{ color: ACCENT }} /> {pc} PDF{pc !== 1 ? 's' : ''}</span>}
                          {vc === 0 && pc === 0 && <span style={{ fontSize: 12, color: MUTED, fontStyle: 'italic' }}>No resources yet</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div style={{ borderTop: `1px solid ${BORDER}`, padding: 'clamp(16px, 4vw, 28px)' }}>
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

        {/* ── RIGHT: sidebar ── */}
        <div className="sidebar-col" style={{ position: 'sticky', top: 68 }}>
          <div className="card">

            {/* Thumbnail */}
            <div style={{ aspectRatio: '16/9', background: '#0D0D1A', overflow: 'hidden' }}>
              {thumbnailUrl
                ? <img src={thumbnailUrl} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={36} style={{ color: 'rgba(255,255,255,0.12)' }} /></div>}
            </div>

            <div style={{ padding: '20px 20px 24px' }}>
              {/* Course name + tag */}
              <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, margin: '0 0 4px', lineHeight: 1.3 }}>{course.title}</h2>
              {course.instructor && (
                <p style={{ fontSize: 12, color: MUTED, margin: '0 0 16px' }}>by {course.instructor}</p>
              )}

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderRadius: 10, overflow: 'hidden', border: `1px solid ${BORDER}`, marginBottom: 20 }}>
                {[
                  { label: 'Modules',  value: course.modules.length },
                  { label: 'Videos',   value: totalVideos },
                  { label: 'PDFs',     value: totalPdfs },
                ].map((s, i) => (
                  <div key={s.label} style={{ textAlign: 'center', padding: '12px 8px', borderRight: i < 2 ? `1px solid ${BORDER}` : 'none', background: CHIPBG }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: INK, margin: '0 0 2px', lineHeight: 1 }}>{s.value}</p>
                    <p style={{ fontSize: 11, color: MUTED, margin: 0, fontWeight: 500 }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Price */}
              {!isEnrolled && (
                <div style={{ marginBottom: 16, textAlign: 'center' }}>
                  {isFree ? (
                    <p style={{ fontSize: 32, fontWeight: 900, color: ACCENT, margin: 0, letterSpacing: '-0.02em' }}>Free</p>
                  ) : (
                    <div>
                      <p style={{ fontSize: 32, fontWeight: 900, color: INK, margin: 0, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                        UGX {discountedPrice.toLocaleString()}
                      </p>
                      {discountActive && (
                        <p style={{ fontSize: 13, color: MUTED, textDecoration: 'line-through', margin: '4px 0 0', fontVariantNumeric: 'tabular-nums' }}>
                          UGX {price.toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* CTA */}
              {isEnrolled ? (
                <button className="cta-btn" onClick={() => router.push(`/learn/${courseId}`)}
                  style={{ background: ACCENT, color: WHITE, marginBottom: 12 }}>
                  <Play size={15} fill="white" /> Continue Learning
                </button>
              ) : isLoggedIn ? (
                <>
                  {isFree ? (
                    <button className="cta-btn" onClick={handleEnroll} disabled={enrolling}
                      style={{ background: enrolling ? '#DDD' : ACCENT, color: enrolling ? MUTED : WHITE, marginBottom: 12 }}>
                      {enrolling
                        ? <><Loader2 size={14} style={{ animation: 'spin .9s linear infinite' }} /> Enrolling…</>
                        : <><GraduationCap size={15} /> Enroll for free</>}
                    </button>
                  ) : (
                    <button className="cta-btn" onClick={() => setPaymentOpen(true)}
                      style={{ background: ACCENT, color: WHITE, marginBottom: 12 }}>
                      <Smartphone size={15} /> Pay with Mobile Money
                    </button>
                  )}
                  {error && <p style={{ fontSize: 13, color: RED, textAlign: 'center', margin: '0 0 8px' }}>{error}</p>}
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                  <Link href={`/sign-up${ctaParam}`} className="cta-btn" style={{ background: ACCENT, color: WHITE, textDecoration: 'none' }}>
                    <GraduationCap size={15} /> {isFree ? 'Sign up & enroll free' : 'Sign up to enroll'}
                  </Link>
                  <p style={{ fontSize: 13, color: MUTED, textAlign: 'center', margin: 0 }}>
                    Have an account? <Link href={`/sign-in${ctaParam}`} style={{ color: ACCENT, fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
                  </p>
                </div>
              )}

              {/* Includes list */}
              <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16, marginTop: 4 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 12px' }}>Includes</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {[
                    { icon: BookOpen,      t: `${course.modules.length} module${course.modules.length !== 1 ? 's' : ''}` },
                    { icon: Play,          t: `${totalVideos} video lesson${totalVideos !== 1 ? 's' : ''}` },
                    { icon: FileText,      t: `${totalPdfs} PDF resource${totalPdfs !== 1 ? 's' : ''}` },
                    { icon: Clock,         t: 'Self-paced' },
                    { icon: GraduationCap, t: 'Certificate on completion' },
                    { icon: Shield,        t: 'Full lifetime access' },
                  ].map(({ icon: Icon, t }) => (
                    <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#444' }}>
                      <Icon size={13} style={{ color: ACCENT, flexShrink: 0 }} /> {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PAYMENT MODAL ── */}
      {paymentOpen && (
        <div className="pay-modal-wrap">
          <div className="pay-modal">

            {/* Handle bar on mobile */}
            <div style={{ padding: '12px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${BORDER}`, paddingBottom: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: INK }}>
                {paymentStatus === 'success' ? 'Payment confirmed' : paymentStatus === 'failed' ? 'Payment failed' : paymentStatus === 'pending' ? 'Awaiting payment' : 'Pay with Mobile Money'}
              </span>
              <button onClick={closePayment} style={{ background: CHIPBG, border: 'none', cursor: 'pointer', color: MUTED, padding: 8, display: 'flex', borderRadius: 8 }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: 24 }}>
              {paymentStatus === 'success' ? (
                <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <CheckCheck size={28} style={{ color: '#059669' }} />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: INK, margin: '0 0 8px' }}>Payment confirmed!</h3>
                  <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>Taking you to your course…</p>
                </div>
              ) : paymentStatus === 'failed' ? (
                <div>
                  <p style={{ fontSize: 14, color: MUTED, margin: '0 0 24px', lineHeight: 1.7 }}>
                    {paymentMessage ?? 'The payment was declined or timed out. Please try again.'}
                  </p>
                  <button className="cta-btn" onClick={() => { setPaymentStatus('idle'); setPaymentId(null); setPaymentMessage(null); }}
                    style={{ background: ACCENT, color: WHITE }}>Try again</button>
                </div>
              ) : paymentStatus === 'pending' ? (
                <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Smartphone size={28} style={{ color: ACCENT }} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: INK, margin: '0 0 10px' }}>Check your phone</h3>
                  <p style={{ fontSize: 14, color: MUTED, margin: '0 0 20px', lineHeight: 1.7 }}>
                    A prompt was sent to <strong style={{ color: INK }}>{phone}</strong>. Enter your PIN to approve.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: MUTED, fontSize: 13 }}>
                    <Loader2 size={15} style={{ animation: 'spin 0.9s linear infinite', color: ACCENT }} />
                    Waiting for confirmation…
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ padding: '14px 16px', background: CHIPBG, borderRadius: 12, marginBottom: 20 }}>
                    <p style={{ fontSize: 12, color: MUTED, margin: '0 0 4px' }}>{course.title}</p>
                    <p style={{ fontSize: 26, fontWeight: 900, color: INK, margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                      UGX {discountedPrice.toLocaleString()}
                    </p>
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: INK, marginBottom: 8 }}>Mobile Money number</label>
                    <div style={{ display: 'flex', border: `1.5px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden', background: WHITE }}>
                      <div style={{ padding: '0 14px', borderRight: `1px solid ${BORDER}`, background: CHIPBG, height: 50, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        <Smartphone size={15} style={{ color: MUTED }} />
                      </div>
                      <input type="tel" placeholder="0711 234 567" value={phone} onChange={e => setPhone(e.target.value)}
                        className="inp"
                        style={{ flex: 1, padding: '13px 14px', border: 'none', outline: 'none', fontSize: 15, color: INK, background: 'transparent', fontFamily: 'inherit' }} />
                    </div>
                    <p style={{ fontSize: 12, color: MUTED, margin: '5px 0 0' }}>MTN or Airtel Uganda</p>
                  </div>
                  {error && <div style={{ fontSize: 13, color: RED, background: REDBG, border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>{error}</div>}
                  <button className="cta-btn" onClick={handlePay} disabled={paying || !phone.trim()}
                    style={{ background: paying || !phone.trim() ? '#DDD' : ACCENT, color: paying || !phone.trim() ? MUTED : WHITE }}>
                    {paying ? <><Loader2 size={15} style={{ animation: 'spin .9s linear infinite' }} /> Sending prompt…</> : 'Pay now'}
                  </button>
                  <p style={{ fontSize: 12, color: MUTED, textAlign: 'center', margin: '10px 0 0' }}>You'll receive a USSD prompt on your phone.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
