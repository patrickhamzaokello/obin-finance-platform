import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { school, course, courseReview } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { convertBlobUrlToApiUrl } from '@/lib/blob-url';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { Sora, Manrope } from 'next/font/google';
import { Check, Star, ArrowRight, Heart } from 'lucide-react';

const sora    = Sora({ subsets: ['latin'], weight: ['500','600','700','800'], variable: '--font-sora',    display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], weight: ['400','500','600','700','800'], variable: '--font-manrope', display: 'swap' });

// ── colour shorthands ─────────────────────────────────────────────────────────
const C = {
  ink:        '#0B1411',
  ink2:       '#1A2620',
  muted:      '#57655D',
  muted2:     '#8A968F',
  green:      '#0E9F6E',
  deepBg:     '#0A3D2E',
  deepCard:   '#0C4836',
  greenText:  '#0A6B4A',
  lime:       '#CDFB5E',
  surface2:   '#F4F7F5',
  surface3:   '#F0F7F3',
  border:     '#E6ECE8',
  border2:    '#D9EAE1',
};

// ── helpers ───────────────────────────────────────────────────────────────────
function formatPrice(price: number, discountPercent: number | null, discountActive: boolean | null) {
  if (price === 0) return { label: 'Free', sub: null };
  const final = (discountActive && discountPercent)
    ? Math.round(price * (1 - discountPercent / 100))
    : price;
  return { label: `UGX ${final.toLocaleString()}`, sub: (discountActive && discountPercent) ? `UGX ${price.toLocaleString()}` : null };
}

function courseBadge(c: any, idx: number) {
  if ((c.price ?? 0) === 0) return 'Free';
  if (idx === 0) return 'Most popular';
  return 'New';
}

// ── page ──────────────────────────────────────────────────────────────────────
export default async function CreatorLandingPage({ params }: { params: Promise<{ schoolSlug: string }> }) {
  const { schoolSlug } = await params;

  const [schoolRows, session] = await Promise.all([
    db.select().from(school).where(eq(school.slug, schoolSlug)).limit(1),
    auth.api.getSession({ headers: await headers() }),
  ]);
  if (!schoolRows.length) notFound();
  const s = schoolRows[0] as any;

  const [courses, reviews] = await Promise.all([
    db.select().from(course).where(and(eq(course.schoolId, s.id), eq(course.isPublished, true))).orderBy(desc(course.createdAt)),
    db.select().from(courseReview).where(eq(courseReview.schoolId, s.id)).orderBy(desc(courseReview.createdAt)).limit(6),
  ]);

  const logoUrl   = s.logoUrl   ? convertBlobUrlToApiUrl(s.logoUrl)   : null;
  const bannerUrl = s.bannerUrl ? convertBlobUrlToApiUrl(s.bannerUrl) : null;
  const bio       = s.bio       as string | null;
  const category  = (s.category as string | null) ?? 'Creator';
  let social: Record<string, string> = {};
  try { social = JSON.parse(s.socialLinks ?? '{}'); } catch { /* empty */ }

  const featured  = courses[0] ?? null;
  const rest      = courses.slice(1);

  const fonts = `${sora.variable} ${manrope.variable}`;

  const trustItems = [
    'Expert-led courses you can learn at your own pace',
    'Earn a verified certificate on completion',
    'Exclusive content straight from the creator',
  ];

  return (
    <div className={fonts} style={{ fontFamily: 'var(--font-manrope), system-ui, sans-serif', color: C.ink, background: '#fff' }}>

      {/* ── 1. STICKY NAV ─────────────────────────────────────────────────── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          {/* Logo + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {logoUrl
              ? <img src={logoUrl} alt={s.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-sora)' }}>{s.name[0]}</div>
            }
            <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 15, color: C.ink }}>{s.name}</span>
          </div>

          {/* Center nav */}
          <nav style={{ display: 'flex', gap: 6, alignItems: 'center' }} className="hidden sm:flex">
            {[['#courses','Courses'],['#about','About'],['#testimonials','Reviews']].map(([href, label]) => (
              <a key={href} href={href} style={{ padding: '6px 14px', fontSize: 14, fontWeight: 600, color: C.muted, borderRadius: 8, textDecoration: 'none', transition: 'color .15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.ink)} onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}>
                {label}
              </a>
            ))}
          </nav>

          {/* Right CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {session?.user ? (
              <Link href="/dashboard" style={{ padding: '10px 20px', background: C.green, color: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: `0 6px 20px rgba(14,159,110,.28)` }}>
                My Learning →
              </Link>
            ) : (
              <>
                <Link href="/sign-in" style={{ padding: '10px 16px', fontSize: 14, fontWeight: 600, color: C.muted, textDecoration: 'none' }}>Sign in</Link>
                <Link href="/sign-up" style={{ padding: '10px 20px', background: C.green, color: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: `0 6px 20px rgba(14,159,110,.28)` }}>
                  Become a fan →
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. HERO ───────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 24px 80px', display: 'flex', flexWrap: 'wrap', gap: 64, alignItems: 'center' }}>
        {/* Left */}
        <div style={{ flex: '1 1 380px', minWidth: 300 }}>
          {/* Eyebrow */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.surface3, border: `1px solid ${C.border2}`, borderRadius: 999, padding: '6px 14px', marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: C.greenText, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{category} creator</span>
          </div>

          {/* H1 */}
          <h1 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 'clamp(36px,5vw,56px)', lineHeight: 1.04, letterSpacing: '-0.02em', color: C.ink, margin: '0 0 24px' }}>
            Learn {category} from{' '}
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{ position: 'relative', zIndex: 1 }}>{s.name}</span>
              <span style={{ position: 'absolute', bottom: 2, left: -2, right: -2, height: '35%', background: C.lime, zIndex: 0, borderRadius: 4 }} />
            </span>
          </h1>

          {/* Subhead */}
          <p style={{ fontSize: 18, lineHeight: 1.6, color: C.muted, margin: '0 0 36px', maxWidth: 480 }}>
            {bio ?? `Exclusive courses and content from ${s.name}. Learn at your own pace and earn a certificate.`}
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 40 }}>
            <Link href="/sign-up"
              style={{ padding: '15px 32px', background: C.green, color: '#fff', borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: `0 6px 20px rgba(14,159,110,.28)`, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Heart size={15} /> Become a fan →
            </Link>
            <a href="#courses"
              style={{ padding: '15px 32px', background: '#fff', color: C.ink, borderRadius: 12, fontSize: 15, fontWeight: 600, textDecoration: 'none', border: `1px solid ${C.border2}`, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Browse courses →
            </a>
          </div>

          {/* Trust items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {trustItems.map((t) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.surface3, border: `1px solid ${C.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={11} color={C.green} strokeWidth={3} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.ink2 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: cover image */}
        <div style={{ flex: '1 1 380px', minWidth: 300, position: 'relative' }}>
          <div style={{ borderRadius: 24, overflow: 'hidden', background: C.surface2, aspectRatio: '16/13', boxShadow: '0 30px 60px -20px rgba(11,20,17,.35)' }}>
            {bannerUrl
              ? <img src={bannerUrl} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${C.surface3} 0%, ${C.border} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-sora)', fontSize: 72, fontWeight: 800, color: C.green, opacity: .15 }}>{s.name[0]}</div>
                </div>
            }
          </div>
          {/* Floating badge */}
          {featured && (
            <div style={{ position: 'absolute', bottom: -16, left: -16, background: '#fff', borderRadius: 16, padding: '14px 18px', boxShadow: '0 24px 50px -28px rgba(11,20,17,.25)', border: `1px solid ${C.border}`, maxWidth: 240 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: C.green, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Featured course</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, lineHeight: 1.3 }}>{featured.title}</p>
            </div>
          )}
        </div>
      </section>

      {/* ── 3. VALUE STRIP ────────────────────────────────────────────────── */}
      {courses.length > 0 && (
        <section style={{ background: C.surface2, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '20px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '10px 0' }}>
            {[category, 'Expert-led', 'Self-paced', 'Certificates', 'Exclusive Content', `${courses.length} Course${courses.length !== 1 ? 's' : ''}`].map((pill, i, arr) => (
              <span key={pill} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.muted, letterSpacing: '0.02em' }}>{pill}</span>
                {i < arr.length - 1 && <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.green, margin: '0 8px', flexShrink: 0 }} />}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── 5. COURSES ────────────────────────────────────────────────────── */}
      <section id="courses" style={{ background: C.surface2, padding: '96px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.surface3, border: `1px solid ${C.border2}`, borderRadius: 999, padding: '6px 14px', marginBottom: 20 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: C.greenText, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Courses</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 'clamp(28px,4vw,40px)', letterSpacing: '-0.02em', color: C.ink, margin: '0 0 16px' }}>
              Exclusive content from {s.name}
            </h2>
            <p style={{ fontSize: 17, color: C.muted, maxWidth: 520, margin: '0 auto' }}>
              Each course is crafted to give you practical knowledge you can apply immediately.
            </p>
          </div>

          {courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', color: C.muted }}>
              <p style={{ fontSize: 16 }}>No courses published yet — check back soon.</p>
            </div>
          ) : (
            <>
              {/* Featured course */}
              {featured && (() => {
                const price = formatPrice(featured.price ?? 0, featured.discountPercent, featured.discountActive);
                const badge = courseBadge(featured, 0);
                const thumb = featured.thumbnail ? convertBlobUrlToApiUrl(featured.thumbnail) : null;
                return (
                  <div style={{ background: '#fff', borderRadius: 24, border: `1px solid ${C.border}`, overflow: 'hidden', display: 'flex', flexWrap: 'wrap', marginBottom: 32, boxShadow: '0 24px 50px -28px rgba(11,20,17,.15)' }}>
                    {/* Image */}
                    <div style={{ flex: '1 1 380px', minWidth: 300, minHeight: 360, background: C.surface2, position: 'relative' }}>
                      {thumb
                        ? <img src={thumb} alt={featured.title} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000', display: 'block', minHeight: 320 }} />
                        : <div style={{ width: '100%', height: '100%', minHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.surface3 }}>
                            <span style={{ fontFamily: 'var(--font-sora)', fontSize: 48, fontWeight: 800, color: C.green, opacity: .2 }}>{featured.title[0]}</span>
                          </div>
                      }
                    </div>
                    {/* Content */}
                    <div style={{ flex: '1 1 380px', minWidth: 300, padding: '48px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <span style={{ display: 'inline-block', background: C.surface3, color: C.greenText, fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 999, padding: '5px 12px', marginBottom: 20, width: 'fit-content', border: `1px solid ${C.border2}` }}>{badge}</span>
                      <h3 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 'clamp(22px,3vw,30px)', letterSpacing: '-0.02em', color: C.ink, margin: '0 0 14px', lineHeight: 1.15 }}>{featured.title}</h3>
                      {featured.description && (
                        <p style={{ fontSize: 16, lineHeight: 1.65, color: C.muted, margin: '0 0 28px' }}>{featured.description}</p>
                      )}
                      {featured.instructor && (
                        <p style={{ fontSize: 13, fontWeight: 600, color: C.muted2, margin: '0 0 28px' }}>By {featured.instructor}</p>
                      )}
                      {/* Price + CTA */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                        <div>
                          <p style={{ fontSize: 26, fontWeight: 800, color: C.ink, fontFamily: 'var(--font-sora)', margin: 0, lineHeight: 1 }}>{price.label}</p>
                          {price.sub && <p style={{ fontSize: 13, color: C.muted2, textDecoration: 'line-through', margin: '4px 0 0' }}>{price.sub}</p>}
                          <p style={{ fontSize: 12, color: C.muted2, margin: '4px 0 0' }}>One-time payment</p>
                        </div>
                        <Link href={`/course/${featured.id}`}
                          style={{ padding: '14px 28px', background: C.green, color: '#fff', borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: `0 6px 20px rgba(14,159,110,.28)`, whiteSpace: 'nowrap' }}>
                          Enroll now →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Rest of courses grid */}
              {rest.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                  {rest.map((c, i) => {
                    const price = formatPrice(c.price ?? 0, c.discountPercent, c.discountActive);
                    const badge = courseBadge(c, i + 1);
                    const thumb = c.thumbnail ? convertBlobUrlToApiUrl(c.thumbnail) : null;
                    return (
                      <Link key={c.id} href={`/course/${c.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 18, border: `1px solid ${C.border}`, overflow: 'hidden', transition: 'box-shadow .2s', color: 'inherit' }}>
                        <div style={{ aspectRatio: '16/9', background: C.surface2, overflow: 'hidden' }}>
                          {thumb
                            ? <img src={thumb} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000', display: 'block' }} />
                            : <div style={{ width: '100%', height: '100%', background: C.surface3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontFamily: 'var(--font-sora)', fontSize: 32, fontWeight: 800, color: C.green, opacity: .2 }}>{c.title[0]}</span>
                              </div>
                          }
                        </div>
                        <div style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <span style={{ display: 'inline-block', background: C.surface3, color: C.greenText, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 999, padding: '4px 10px', marginBottom: 12, width: 'fit-content', border: `1px solid ${C.border2}` }}>{badge}</span>
                          <h3 style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 17, color: C.ink, margin: '0 0 8px', lineHeight: 1.3 }}>{c.title}</h3>
                          {c.description && <p style={{ fontSize: 13, lineHeight: 1.55, color: C.muted, margin: '0 0 16px', flex: 1 }}>{c.description.slice(0, 120)}{c.description.length > 120 ? '…' : ''}</p>}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                            <span style={{ fontSize: 17, fontWeight: 800, color: C.ink, fontFamily: 'var(--font-sora)' }}>{price.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: C.green, display: 'flex', alignItems: 'center', gap: 4 }}>View course <ArrowRight size={12} /></span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── 6. IS THIS FOR YOU ────────────────────────────────────────────── */}
      <section style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 64, alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 380px', minWidth: 280 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.surface3, border: `1px solid ${C.border2}`, borderRadius: 999, padding: '6px 14px', marginBottom: 20 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: C.greenText, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Who is this for?</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 'clamp(26px,3.5vw,38px)', letterSpacing: '-0.02em', color: C.ink, margin: '0 0 18px', lineHeight: 1.1 }}>
              This is for you if…
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: C.muted }}>
              {s.name}&apos;s courses are for people who want more than theory — they want real, actionable knowledge from someone who has done it.
            </p>
          </div>
          <div style={{ flex: '1 1 380px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              `You want practical ${category.toLowerCase()} skills — not just theory`,
              'You learn better from creators who walk the talk',
              'You\'re ready to invest in knowledge that pays for itself',
            ].map((item, i, arr) => (
              <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 18, padding: '24px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: C.surface3, border: `1px solid ${C.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ArrowRight size={16} color={C.green} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 600, color: C.ink2, lineHeight: 1.5, margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. TESTIMONIALS (only if reviews exist) ───────────────────────── */}
      {reviews.length > 0 && (
        <section id="testimonials" style={{ background: C.deepBg, padding: '96px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(205,251,94,.12)', border: `1px solid rgba(205,251,94,.25)`, borderRadius: 999, padding: '6px 14px', marginBottom: 20 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.lime, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: C.lime, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Reviews</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 'clamp(26px,3.5vw,38px)', letterSpacing: '-0.02em', color: '#fff', margin: 0 }}>
                What fans are saying
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {reviews.slice(0, 3).map((r) => (
                <div key={r.id} style={{ background: C.deepCard, borderRadius: 20, padding: '32px 28px', border: `1px solid rgba(255,255,255,.07)` }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 20 }}>
                    {[1,2,3,4,5].map((i) => (
                      <Star key={i} size={15} fill={i <= r.rating ? C.lime : 'none'} color={i <= r.rating ? C.lime : 'rgba(255,255,255,.2)'} />
                    ))}
                  </div>
                  <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,.8)', margin: '0 0 24px', fontStyle: 'italic' }}>
                    &ldquo;{r.comment ?? 'Great course, highly recommended!'}&rdquo;
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(205,251,94,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: C.lime, flexShrink: 0 }}>
                      {(r.learnerName ?? 'F')[0].toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>{r.learnerName ?? 'Fan'}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', margin: 0 }}>{r.courseTitle ?? 'Course'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 8. ABOUT / INSTRUCTOR ────────────────────────────────────────── */}
      {bio && (
        <section id="about" style={{ padding: '96px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 64, alignItems: 'center' }}>
            {/* Photo */}
            <div style={{ flex: '0 0 auto' }}>
              {logoUrl
                ? <img src={logoUrl} alt={s.name} style={{ width: 200, height: 200, borderRadius: 24, objectFit: 'cover', border: `1px solid ${C.border}`, boxShadow: '0 24px 50px -28px rgba(11,20,17,.2)' }} />
                : <div style={{ width: 200, height: 200, borderRadius: 24, background: C.surface3, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-sora)', fontSize: 72, fontWeight: 800, color: C.green, opacity: .25 }}>{s.name[0]}</span>
                  </div>
              }
            </div>
            {/* Bio */}
            <div style={{ flex: '1 1 380px', minWidth: 280 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.surface3, border: `1px solid ${C.border2}`, borderRadius: 999, padding: '6px 14px', marginBottom: 20 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: C.greenText, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Your creator</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 'clamp(24px,3vw,36px)', letterSpacing: '-0.02em', color: C.ink, margin: '0 0 18px', lineHeight: 1.15 }}>{s.name}</h2>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: C.muted, margin: '0 0 28px' }}>{bio}</p>
              {Object.values(social).some(Boolean) && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[['website','Website'],['twitter','Twitter'],['instagram','Instagram'],['youtube','YouTube']].filter(([k]) => social[k]).map(([k, label]) => (
                    <a key={k} href={social[k]} target="_blank" rel="noreferrer"
                      style={{ padding: '8px 16px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, color: C.ink, textDecoration: 'none' }}>
                      {label} →
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── 10. FINAL CTA ─────────────────────────────────────────────────── */}
      <section style={{ padding: '40px 24px 96px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ background: C.deepBg, borderRadius: 28, padding: 'clamp(48px,6vw,80px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            {/* Decorative lime circle */}
            <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: C.lime, opacity: .06, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: C.lime, opacity: .04, pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 'clamp(28px,4vw,44px)', letterSpacing: '-0.02em', color: '#fff', margin: '0 0 18px', lineHeight: 1.1 }}>
                Ready to learn from {s.name}?
              </h2>
              <p style={{ fontSize: 18, lineHeight: 1.65, color: 'rgba(255,255,255,.7)', margin: '0 0 40px', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
                Join hundreds of fans learning {category.toLowerCase()} skills — at your own pace, with a certificate to show for it.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
                <Link href="/sign-up"
                  style={{ padding: '16px 32px', background: C.lime, color: C.deepBg, borderRadius: 12, fontSize: 15, fontWeight: 800, textDecoration: 'none', fontFamily: 'var(--font-sora)' }}>
                  Become a fan — it&apos;s free →
                </Link>
                <a href="#courses"
                  style={{ padding: '16px 32px', background: 'rgba(255,255,255,.08)', color: '#fff', borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,255,255,.2)' }}>
                  Browse courses
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 11. FOOTER ────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '32px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {logoUrl
              ? <img src={logoUrl} alt={s.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12 }}>{s.name[0]}</div>
            }
            <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 14, color: C.ink }}>{s.name}</span>
          </div>
          {/* Social */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[['website','Website'],['twitter','Twitter'],['instagram','Instagram'],['youtube','YouTube']].filter(([k]) => social[k]).map(([k, label]) => (
              <a key={k} href={social[k]} target="_blank" rel="noreferrer"
                style={{ fontSize: 13, fontWeight: 600, color: C.muted2, textDecoration: 'none' }}>
                {label}
              </a>
            ))}
          </div>
          {/* Copyright */}
          <p style={{ fontSize: 12, color: C.muted2, margin: 0 }}>
            © {new Date().getFullYear()} {s.name}. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
