import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { school, course, courseReview } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { convertBlobUrlToApiUrl } from '@/lib/blob-url';
import Link from 'next/link';
import { BookOpen, Play, ArrowRight, Link2, Globe, Heart, Check, Star } from 'lucide-react';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { Sora, Manrope } from 'next/font/google';

const sora    = Sora({ subsets: ['latin'], weight: ['500','600','700','800'], variable: '--font-sora',    display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], weight: ['400','500','600','700','800'], variable: '--font-manrope', display: 'swap' });

// Colors are derived per-request from creator's saved theme
function buildC(primary: string, accent: string) {
  return {
    ink:      '#0B1411',
    ink2:     '#1A2620',
    muted:    '#57655D',
    muted2:   '#8A968F',
    green:    primary,
    deepBg:   '#0A3D2E',
    deepCard: '#0C4836',
    greenText: primary,
    lime:     accent,
    surface2: '#F4F7F5',
    surface3: '#F0F7F3',
    border:   '#E6ECE8',
    border2:  '#D9EAE1',
  };
}

function price(p: number | null, dp: number | null, da: boolean | null) {
  const base = p ?? 0;
  if (base === 0) return { label: 'Free', original: null };
  const discounted = da && dp ? Math.round(base * (1 - dp / 100)) : base;
  return { label: `UGX ${discounted.toLocaleString()}`, original: (da && dp) ? `UGX ${base.toLocaleString()}` : null };
}

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;

  const [schoolRows, session] = await Promise.all([
    db.select().from(school).where(eq(school.slug, schoolSlug)).limit(1),
    auth.api.getSession({ headers: await headers() }),
  ]);

  if (!schoolRows.length) notFound();
  const s = schoolRows[0];

  const [courses, reviews] = await Promise.all([
    db.select().from(course).where(and(eq(course.schoolId, s.id), eq(course.isPublished, true))),
    db.select().from(courseReview).where(eq(courseReview.schoolId, s.id)).orderBy(desc(courseReview.createdAt)).limit(3),
  ]);

  let social: Record<string, string> = {};
  try { social = JSON.parse((s as any).socialLinks ?? '{}'); } catch { /* empty */ }

  const logoUrl      = (s as any).logoUrl      ? convertBlobUrlToApiUrl((s as any).logoUrl)      : null;
  const bannerUrl    = (s as any).bannerUrl     ? convertBlobUrlToApiUrl((s as any).bannerUrl)    : null;
  const category     = ((s as any).category     as string | null) ?? 'Creator';
  const bio          = (s as any).bio           as string | null;
  const primaryColor = ((s as any).primaryColor as string | null) ?? '#0E9F6E';
  const accentColor  = ((s as any).accentColor  as string | null) ?? '#CDFB5E';
  const tagline      = (s as any).tagline       as string | null;
  const heroHeadline = (s as any).heroHeadline  as string | null;

  const C = buildC(primaryColor, accentColor);

  const socialItems = [
    { icon: Globe, href: social.website,   label: 'Website' },
    { icon: Link2, href: social.twitter,   label: 'Twitter' },
    { icon: Link2, href: social.instagram, label: 'Instagram' },
    { icon: Link2, href: social.youtube,   label: 'YouTube' },
  ].filter((x) => x.href);

  const featured = courses[0] ?? null;
  const rest     = courses.slice(1);
  const fonts    = `${sora.variable} ${manrope.variable}`;

  return (
    <div className={fonts} style={{ fontFamily: 'var(--font-manrope), system-ui, sans-serif', color: C.ink, background: '#fff' }}>

      {/* ── 1. NAV ───────────────────────────────────────────────────── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* Logo + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flexShrink: 0 }}>
            {logoUrl
              ? <img src={logoUrl} alt={s.name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              : <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{s.name[0]}</div>
            }
            <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 15, color: C.ink }}>{s.name}</span>
            {category && (
              <span style={{ fontSize: 11, fontWeight: 800, color: C.greenText, background: C.surface3, border: `1px solid ${C.border2}`, borderRadius: 999, padding: '3px 9px', letterSpacing: '0.06em' }}>{category}</span>
            )}
          </div>

          {/* Center anchors */}
          <nav style={{ display: 'flex', gap: 4 }}>
            {[['#courses','Courses'],['#about','About'],['#reviews','Reviews']].map(([href, label]) => (
              <a key={href} href={href} style={{ padding: '6px 13px', fontSize: 13, fontWeight: 600, color: C.muted, borderRadius: 8, textDecoration: 'none' }}>{label}</a>
            ))}
          </nav>

          {/* Right CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {session?.user ? (
              <Link href='/dashboard' style={{ padding: '10px 20px', background: C.green, color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: `0 4px 14px rgba(14,159,110,.3)` }}>
                My Learning →
              </Link>
            ) : (
              <>
                <Link href='/sign-in' style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: C.muted, textDecoration: 'none' }}>Sign in</Link>
                <Link href='/sign-up' style={{ padding: '10px 20px', background: C.green, color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: `0 4px 14px rgba(14,159,110,.3)` }}>
                  <Heart size={13} fill='#fff' /> Become a fan
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. HERO — full-bleed banner bg, logo as identity anchor ─── */}
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: 560 }}>

        {/* Full-bleed banner image as background */}
        {bannerUrl && (
          <img
            src={bannerUrl}
            alt=''
            aria-hidden
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
        )}

        {/* Gradient overlay — left side stays readable, right fades to show image */}
        <div style={{
          position: 'absolute', inset: 0,
          background: bannerUrl
            ? 'linear-gradient(100deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.92) 38%, rgba(255,255,255,0.6) 62%, rgba(255,255,255,0.08) 100%)'
            : `linear-gradient(135deg, ${C.surface2} 0%, ${C.border} 100%)`,
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '80px 24px 80px', display: 'flex', flexWrap: 'wrap', gap: 56, alignItems: 'center' }}>

          {/* Left col — text */}
          <div style={{ flex: '1 1 380px', minWidth: 280 }}>
            {/* Eyebrow */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.85)', border: `1px solid ${C.border2}`, borderRadius: 999, padding: '6px 14px', marginBottom: 28, backdropFilter: 'blur(8px)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: C.greenText, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{category} creator</span>
            </div>

            {/* H1 */}
            <h1 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 'clamp(34px,5vw,54px)', lineHeight: 1.06, letterSpacing: '-0.025em', color: C.ink, margin: '0 0 22px' }}>
              {heroHeadline
                ? (
                  <>
                    {heroHeadline.includes(s.name)
                      ? heroHeadline.split(s.name).map((part, i, arr) =>
                          i < arr.length - 1
                            ? <span key={i}>{part}<span style={{ position: 'relative', display: 'inline-block' }}><span style={{ position: 'relative', zIndex: 1 }}>{s.name}</span><span style={{ position: 'absolute', bottom: 3, left: -3, right: -3, height: '34%', background: C.lime, zIndex: 0, borderRadius: 4 }} /></span></span>
                            : <span key={i}>{part}</span>
                        )
                      : heroHeadline
                    }
                  </>
                )
                : (
                  <>
                    Learn {category}<br />from{' '}
                    <span style={{ position: 'relative', display: 'inline-block' }}>
                      <span style={{ position: 'relative', zIndex: 1 }}>{s.name}</span>
                      <span style={{ position: 'absolute', bottom: 3, left: -3, right: -3, height: '34%', background: C.lime, zIndex: 0, borderRadius: 4 }} />
                    </span>
                  </>
                )
              }
            </h1>

            {/* Subhead */}
            <p style={{ fontSize: 17, lineHeight: 1.65, color: C.muted, margin: '0 0 36px', maxWidth: 440 }}>
              {tagline ?? bio ?? `Exclusive courses and content from ${s.name}. Learn at your own pace and earn a certificate.`}
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 40 }}>
              {session?.user ? (
                <Link href='/dashboard' style={{ padding: '14px 28px', background: C.green, color: '#fff', borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: `0 6px 20px rgba(14,159,110,.28)` }}>
                  Go to My Learning →
                </Link>
              ) : (
                <>
                  <Link href='/sign-up' style={{ padding: '14px 28px', background: C.green, color: '#fff', borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: `0 6px 20px rgba(14,159,110,.28)` }}>
                    <Heart size={15} fill='#fff' /> Become a fan →
                  </Link>
                  <a href='#courses' style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.9)', color: C.ink, borderRadius: 12, fontSize: 15, fontWeight: 600, textDecoration: 'none', border: `1px solid ${C.border2}`, backdropFilter: 'blur(8px)' }}>
                    Browse courses
                  </a>
                </>
              )}
            </div>

            {/* Trust checkmarks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Expert-led courses you can learn at your own pace', 'Earn a verified certificate on completion', 'Exclusive content straight from the creator'].map((t) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: `1px solid ${C.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={11} color={C.green} strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.ink2 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right col — large logo square as identity anchor */}
          <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {/* Logo square */}
            <div style={{
              width: 200, height: 200,
              borderRadius: 28,
              overflow: 'hidden',
              background: logoUrl ? '#000' : C.green,
              border: '4px solid rgba(255,255,255,0.9)',
              boxShadow: '0 32px 64px -20px rgba(11,20,17,0.45), 0 0 0 1px rgba(0,0,0,0.06)',
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {logoUrl
                ? <img src={logoUrl} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontFamily: 'var(--font-sora)', fontSize: 72, fontWeight: 800, color: '#fff' }}>{s.name[0]}</span>
              }
            </div>

            {/* Name + category below logo */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 18, color: C.ink, margin: '0 0 6px' }}>{s.name}</p>
              {category && (
                <span style={{ fontSize: 11, fontWeight: 800, color: C.greenText, background: 'rgba(255,255,255,0.9)', border: `1px solid ${C.border2}`, borderRadius: 999, padding: '4px 12px', letterSpacing: '0.06em', display: 'inline-block' }}>{category}</span>
              )}
            </div>

            {/* Floating featured badge below */}
            {featured && (
              <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: '12px 18px', boxShadow: '0 16px 40px -16px rgba(11,20,17,0.25)', border: `1px solid ${C.border}`, maxWidth: 200, textAlign: 'center', backdropFilter: 'blur(8px)' }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: C.green, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 3px' }}>Featured course</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.ink, margin: 0, lineHeight: 1.3 }}>{featured.title}</p>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ── 3. VALUE STRIP ───────────────────────────────────────────── */}
      <div style={{ background: C.surface2, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '18px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '8px 0' }}>
          {[category, 'Expert-led', 'Self-paced', 'Certificates', 'Exclusive Content', `${courses.length} Course${courses.length !== 1 ? 's' : ''}`].map((pill, i, arr) => (
            <span key={pill} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>{pill}</span>
              {i < arr.length - 1 && <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.green, margin: '0 8px', flexShrink: 0 }} />}
            </span>
          ))}
        </div>
      </div>

      {/* ── 5. COURSES ───────────────────────────────────────────────── */}
      <section id='courses' style={{ background: C.surface2, padding: '88px 24px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${C.border2}`, borderRadius: 999, padding: '6px 14px', marginBottom: 18 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: C.greenText, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Courses</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 'clamp(26px,3.5vw,38px)', letterSpacing: '-0.02em', color: C.ink, margin: '0 0 12px' }}>
              Exclusive content from {s.name}
            </h2>
            <p style={{ fontSize: 16, color: C.muted, maxWidth: 480, margin: '0 auto' }}>
              Each course is crafted to give you practical knowledge you can apply immediately.
            </p>
          </div>

          {courses.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 20, padding: '64px 24px', textAlign: 'center', border: `1px solid ${C.border}` }}>
              <BookOpen size={40} color={C.border} style={{ margin: '0 auto 14px' }} />
              <p style={{ fontWeight: 700, color: C.ink, margin: '0 0 6px' }}>No courses published yet.</p>
              <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Come back soon for exclusive content.</p>
            </div>
          ) : (
            <>
              {/* Featured — large 2-col card */}
              {featured && (() => {
                const p = price(featured.price, featured.discountPercent, featured.discountActive);
                const thumb = featured.thumbnail ? convertBlobUrlToApiUrl(featured.thumbnail) : null;
                return (
                  <div style={{ background: '#fff', borderRadius: 24, border: `1px solid ${C.border}`, overflow: 'hidden', display: 'flex', flexWrap: 'wrap', marginBottom: 24, boxShadow: '0 24px 50px -28px rgba(11,20,17,.12)' }}>
                    {/* Image */}
                    <div style={{ flex: '1 1 340px', minWidth: 280, minHeight: 300, background: '#000', position: 'relative' }}>
                      {thumb
                        ? <img src={thumb} alt={featured.title} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', minHeight: 300 }} />
                        : <div style={{ width: '100%', height: '100%', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.surface3 }}><Play size={48} color={C.green} style={{ opacity: 0.3 }} /></div>
                      }
                    </div>
                    {/* Content */}
                    <div style={{ flex: '1 1 340px', minWidth: 280, padding: '44px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <span style={{ display: 'inline-block', background: C.surface3, color: C.greenText, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 999, padding: '5px 12px', marginBottom: 18, border: `1px solid ${C.border2}`, width: 'fit-content' }}>Most popular</span>
                      <h3 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 'clamp(20px,2.5vw,28px)', letterSpacing: '-0.02em', color: C.ink, margin: '0 0 12px', lineHeight: 1.2 }}>{featured.title}</h3>
                      {featured.description && <p style={{ fontSize: 15, lineHeight: 1.65, color: C.muted, margin: '0 0 12px' }}>{featured.description}</p>}
                      {featured.instructor && <p style={{ fontSize: 12, fontWeight: 600, color: C.muted2, margin: '0 0 28px' }}>By {featured.instructor}</p>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
                        <div>
                          <p style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 26, color: C.ink, margin: 0, lineHeight: 1 }}>{p.label}</p>
                          {p.original && <p style={{ fontSize: 12, color: C.muted2, textDecoration: 'line-through', margin: '4px 0 0' }}>{p.original}</p>}
                          <p style={{ fontSize: 11, color: C.muted2, margin: '4px 0 0' }}>One-time payment</p>
                        </div>
                        <Link href={`/course/${featured.id}`} style={{ padding: '13px 26px', background: C.green, color: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: `0 6px 20px rgba(14,159,110,.28)`, whiteSpace: 'nowrap' }}>
                          Enroll now →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Rest — grid */}
              {rest.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                  {rest.map((c) => {
                    const p = price(c.price, c.discountPercent, c.discountActive);
                    return (
                      <Link key={c.id} href={`/course/${c.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 18, border: `1px solid ${C.border}`, overflow: 'hidden', color: 'inherit' }}>
                        <div style={{ aspectRatio: '16/9', background: '#000', overflow: 'hidden' }}>
                          {c.thumbnail
                            ? <img src={convertBlobUrlToApiUrl(c.thumbnail)} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                            : <div style={{ width: '100%', height: '100%', background: C.surface3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Play size={32} color={C.green} style={{ opacity: 0.25 }} /></div>
                          }
                        </div>
                        <div style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <h3 style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 16, color: C.ink, margin: '0 0 8px', lineHeight: 1.3 }}>{c.title}</h3>
                          {c.description && <p style={{ fontSize: 13, lineHeight: 1.55, color: C.muted, margin: '0 0 16px', flex: 1 }}>{c.description.slice(0, 110)}{c.description.length > 110 ? '…' : ''}</p>}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: `1px solid ${C.border}`, marginTop: 'auto' }}>
                            <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 16, color: C.ink }}>{p.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: C.green, display: 'flex', alignItems: 'center', gap: 4 }}>View course <ArrowRight size={12} /></span>
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

      {/* ── 6. IS THIS FOR YOU ───────────────────────────────────────── */}
      <section style={{ padding: '88px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 64, alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 380px', minWidth: 280 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.surface3, border: `1px solid ${C.border2}`, borderRadius: 999, padding: '6px 14px', marginBottom: 20 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: C.greenText, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Who is this for?</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 'clamp(24px,3vw,36px)', letterSpacing: '-0.02em', color: C.ink, margin: '0 0 16px', lineHeight: 1.12 }}>
              This is for you if…
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.65, color: C.muted, margin: 0 }}>
              {s.name}&apos;s courses are for people who want more than theory — real, actionable knowledge from someone who has done it.
            </p>
          </div>
          <div style={{ flex: '1 1 380px', minWidth: 280 }}>
            {[
              `You want practical ${category.toLowerCase()} skills — not just theory`,
              'You learn better from creators who walk the talk',
              "You're ready to invest in knowledge that pays for itself",
            ].map((item, i, arr) => (
              <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '22px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: C.surface3, border: `1px solid ${C.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ArrowRight size={15} color={C.green} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: C.ink2, lineHeight: 1.55, margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. REVIEWS (dark green, only if reviews exist) ───────────── */}
      {reviews.length > 0 && (
        <section id='reviews' style={{ background: C.deepBg, padding: '88px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(205,251,94,.12)', border: '1px solid rgba(205,251,94,.25)', borderRadius: 999, padding: '6px 14px', marginBottom: 18 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.lime }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: C.lime, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Reviews</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 'clamp(24px,3vw,36px)', letterSpacing: '-0.02em', color: '#fff', margin: 0 }}>
                What fans are saying
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {reviews.map((r) => (
                <div key={r.id} style={{ background: C.deepCard, borderRadius: 20, padding: '28px 26px', border: '1px solid rgba(255,255,255,.07)' }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 18 }}>
                    {[1,2,3,4,5].map((i) => <Star key={i} size={14} fill={i <= r.rating ? C.lime : 'none'} color={i <= r.rating ? C.lime : 'rgba(255,255,255,.2)'} />)}
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,.8)', margin: '0 0 22px', fontStyle: 'italic' }}>
                    &ldquo;{r.comment ?? 'Great course, highly recommended!'}&rdquo;
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(205,251,94,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: C.lime, flexShrink: 0 }}>
                      {(r.learnerName ?? 'F')[0].toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0 }}>{r.learnerName ?? 'Fan'}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', margin: 0 }}>{r.courseTitle ?? 'Course'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 8. ABOUT / INSTRUCTOR (only if bio exists) ───────────────── */}
      {bio && (
        <section id='about' style={{ padding: '88px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 56, alignItems: 'center' }}>
            {logoUrl
              ? <img src={logoUrl} alt={s.name} style={{ width: 180, height: 180, borderRadius: 22, objectFit: 'cover', border: `1px solid ${C.border}`, boxShadow: '0 24px 50px -28px rgba(11,20,17,.2)', flexShrink: 0 }} />
              : <div style={{ width: 180, height: 180, borderRadius: 22, background: C.surface3, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--font-sora)', fontSize: 64, fontWeight: 800, color: C.green, opacity: 0.25 }}>{s.name[0]}</span>
                </div>
            }
            <div style={{ flex: '1 1 320px', minWidth: 260 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.surface3, border: `1px solid ${C.border2}`, borderRadius: 999, padding: '6px 14px', marginBottom: 18 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: C.greenText, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Your creator</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 'clamp(22px,2.5vw,32px)', letterSpacing: '-0.02em', color: C.ink, margin: '0 0 14px', lineHeight: 1.15 }}>{s.name}</h2>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: C.muted, margin: '0 0 24px' }}>{bio}</p>
              {socialItems.length > 0 && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {socialItems.map(({ href, label }) => (
                    <a key={label} href={href} target='_blank' rel='noreferrer'
                      style={{ padding: '8px 16px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, fontWeight: 700, color: C.ink, textDecoration: 'none' }}>
                      {label} →
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── 10. FINAL CTA (dark green panel) ─────────────────────────── */}
      {!session?.user && (
        <section style={{ padding: '40px 24px 88px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ background: C.deepBg, borderRadius: 28, padding: 'clamp(48px,6vw,72px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: C.lime, opacity: 0.06, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: C.lime, opacity: 0.04, pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 'clamp(26px,3.5vw,42px)', letterSpacing: '-0.02em', color: '#fff', margin: '0 0 14px', lineHeight: 1.1 }}>
                  Ready to learn from {s.name}?
                </h2>
                <p style={{ fontSize: 17, lineHeight: 1.65, color: 'rgba(255,255,255,.7)', margin: '0 auto 36px', maxWidth: 480 }}>
                  Join fans learning {category.toLowerCase()} skills at their own pace — with a certificate to show for it.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                  <Link href='/sign-up' style={{ padding: '15px 30px', background: C.lime, color: C.deepBg, borderRadius: 12, fontSize: 14, fontWeight: 800, textDecoration: 'none', fontFamily: 'var(--font-sora)' }}>
                    Become a fan — it&apos;s free →
                  </Link>
                  <a href='#courses' style={{ padding: '15px 30px', background: 'rgba(255,255,255,.08)', color: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,255,255,.2)' }}>
                    Browse courses
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 11. FOOTER ───────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '28px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {logoUrl
              ? <img src={logoUrl} alt={s.name} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 26, height: 26, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 11 }}>{s.name[0]}</div>
            }
            <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 14, color: C.ink }}>{s.name}</span>
          </div>
          {socialItems.length > 0 && (
            <div style={{ display: 'flex', gap: 20 }}>
              {socialItems.map(({ href, label }) => (
                <a key={label} href={href} target='_blank' rel='noreferrer' style={{ fontSize: 12, fontWeight: 600, color: C.muted2, textDecoration: 'none' }}>{label}</a>
              ))}
            </div>
          )}
          <p style={{ fontSize: 11, color: C.muted2, margin: 0 }}>© {new Date().getFullYear()} {s.name}. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
