import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { school, course } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { convertBlobUrlToApiUrl } from '@/lib/blob-url';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, GraduationCap, Globe, Link2 } from 'lucide-react';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { Shippori_Mincho } from 'next/font/google';

const shippori = Shippori_Mincho({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-shippori',
  display: 'swap',
});

function hex2rgb(hex: string): string {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',');
}

function priceDisplay(p: number | null, dp: number | null, da: boolean | null) {
  const base = p ?? 0;
  if (base === 0) return { label: 'Free', original: null, isFree: true };
  const disc = da && dp ? Math.round(base * (1 - dp / 100)) : base;
  return { label: `UGX ${disc.toLocaleString()}`, original: da && dp ? `UGX ${base.toLocaleString()}` : null, isFree: false };
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

  const courses = await db
    .select()
    .from(course)
    .where(and(eq(course.schoolId, s.id), eq(course.isPublished, true)));

  let social: Record<string, string> = {};
  try { social = JSON.parse((s as any).socialLinks ?? '{}'); } catch { /* empty */ }

  const logoUrl      = (s as any).logoUrl      ? convertBlobUrlToApiUrl((s as any).logoUrl)      : null;
  const bannerUrl    = (s as any).bannerUrl     ? convertBlobUrlToApiUrl((s as any).bannerUrl)    : null;
  const category     = ((s as any).category     as string | null) ?? 'Creator';
  const bio          = (s as any).bio           as string | null;
  const primaryColor = ((s as any).primaryColor as string | null) ?? '#0B00FF';
  const accentColor  = ((s as any).accentColor  as string | null) ?? '#CDFB5E';
  const tagline      = (s as any).tagline       as string | null;
  const heroHeadline = (s as any).heroHeadline  as string | null;

  const pRgb = hex2rgb(primaryColor);

  const socialItems = [
    { href: social.website,   label: 'Website',   icon: Globe },
    { href: social.twitter,   label: 'Twitter',   icon: Link2 },
    { href: social.instagram, label: 'Instagram', icon: Link2 },
    { href: social.youtube,   label: 'YouTube',   icon: Link2 },
  ].filter((x) => x.href);

  const C = {
    bg:      '#F7F5F0',
    ink:     '#18170F',
    ink2:    '#3A3830',
    muted:   '#796F62',
    rule:    '#DDD8CF',
    surface: '#EFEDE8',
    accent:  primaryColor,
    accentR: pRgb,
    lime:    accentColor,
  };

  return (
    <div className={shippori.variable} style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: C.bg, color: C.ink, minHeight: '100vh' }}>

      <style>{`
        :root { --accent: ${C.accent}; }
        .jp-hover-line { position: relative; }
        .jp-hover-line::after { content:''; position:absolute; bottom:-2px; left:0; right:100%; height:1px; background:var(--accent); transition:right 0.3s ease; }
        .jp-hover-line:hover::after { right:0; }
        .course-row { transition: background 0.15s; }
        .course-row:hover { background: ${C.surface}; }
        .nav-link { transition: color 0.12s; }
        .nav-link:hover { color: ${C.ink} !important; }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .fade-in { animation: fadeIn 0.7s ease both; }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: `rgba(247,245,240,0.95)`, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.rule}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Left — creator mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {logoUrl
              ? <img src={logoUrl} alt={s.name} style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover', border: `1px solid ${C.rule}` }} />
              : <div style={{ width: 28, height: 28, borderRadius: 4, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-shippori)', fontWeight: 700, fontSize: 12 }}>{s.name[0]}</div>
            }
            <span style={{ fontFamily: 'var(--font-shippori)', fontWeight: 600, fontSize: 14, color: C.ink, letterSpacing: '0.01em' }}>{s.name}</span>
            <span style={{ width: 1, height: 12, background: C.rule, flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 500, color: C.muted, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{category}</span>
          </div>

          {/* Right — nav + CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <Link href="/learn/creators" className="nav-link" style={{ fontSize: 12, fontWeight: 500, color: C.muted, textDecoration: 'none', letterSpacing: '0.04em' }}>
              All creators
            </Link>
            {[['#courses', 'Courses'], ['#about', 'About']].map(([href, label]) => (
              <a key={href} href={href} className="nav-link" style={{ fontSize: 12, fontWeight: 500, color: C.muted, textDecoration: 'none', letterSpacing: '0.04em' }}>{label}</a>
            ))}
            <span style={{ width: 1, height: 14, background: C.rule }} />
            {session?.user ? (
              <Link href="/learn/dashboard" style={{ fontSize: 12, fontWeight: 600, color: C.accent, textDecoration: 'none', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4 }}>
                My Learning <ArrowUpRight size={11} />
              </Link>
            ) : (
              <Link href="/sign-up" style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: C.ink, padding: '7px 18px', borderRadius: 2, textDecoration: 'none', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5 }}>
                Enroll <ArrowUpRight size={11} />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '88vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>

        {/* No banner in hero — plain background */}
        <div style={{ position: 'absolute', inset: 0, background: C.bg }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', width: '100%', padding: '0 40px 80px' }}>

          {/* Section label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: C.muted, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              {category} · {courses.length} {courses.length === 1 ? 'course' : 'courses'}
            </span>
            <span style={{ flex: 1, height: 1, background: C.rule, maxWidth: 80 }} />
          </div>

          {/* Creator name — H1 */}
          <h1 className="fade-in" style={{ fontFamily: 'var(--font-shippori)', fontWeight: 700, fontSize: 'clamp(48px, 7.5vw, 110px)', lineHeight: 0.96, letterSpacing: '-0.04em', color: C.ink, margin: '0 0 20px', maxWidth: '85%', textWrap: 'balance' }}>
            {s.name}
          </h1>

          {/* Hero headline — below the name */}
          {(heroHeadline || tagline) && (
            <p className="fade-in" style={{ fontFamily: 'var(--font-shippori)', fontWeight: 500, fontSize: 'clamp(18px, 2.2vw, 28px)', lineHeight: 1.3, letterSpacing: '-0.015em', color: C.ink2, margin: '0 0 36px', maxWidth: 640 }}>
              {heroHeadline ?? tagline}
            </p>
          )}

          {/* Sub / tagline + logo in a row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32 }}>
            <div style={{ maxWidth: 480 }}>
              {!(heroHeadline || tagline) && (
                <p style={{ fontSize: 16, lineHeight: 1.75, color: C.muted, margin: '0 0 32px' }}>
                  {bio?.slice(0, 160) ?? `Expert-led ${category.toLowerCase()} courses designed for real results. Learn at your pace and earn a verified certificate.`}
                </p>
              )}
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {session?.user ? (
                  <Link href="/learn/dashboard" style={{ padding: '12px 28px', background: C.ink, color: C.bg, fontSize: 13, fontWeight: 600, textDecoration: 'none', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    My Learning <ArrowUpRight size={13} />
                  </Link>
                ) : (
                  <>
                    <Link href="/sign-up" style={{ padding: '12px 28px', background: C.ink, color: C.bg, fontSize: 13, fontWeight: 600, textDecoration: 'none', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <GraduationCap size={13} /> Enroll free
                    </Link>
                    <a href="#courses" style={{ padding: '12px 24px', background: 'transparent', color: C.ink, fontSize: 13, fontWeight: 500, textDecoration: 'none', border: `1px solid ${C.rule}`, letterSpacing: '0.04em' }}>
                      Browse courses
                    </a>
                  </>
                )}
              </div>
            </div>

            
          </div>
        </div>
      </section>

      {/* ── THIN RULE ─── */}
      <div style={{ height: 1, background: C.rule }} />

      {/* ── COURSES ─────────────────────────────────────────────────────── */}
      <section id="courses" style={{ padding: '0 0 120px', background: C.bg }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px' }}>

          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 24, padding: '56px 0 40px', borderBottom: `1px solid ${C.rule}` }}>
            <span aria-hidden style={{ fontFamily: 'var(--font-shippori)', fontWeight: 800, fontSize: 11, color: C.rule, letterSpacing: '0.04em', userSelect: 'none' }}>02</span>
            <h2 style={{ fontFamily: 'var(--font-shippori)', fontWeight: 700, fontSize: 'clamp(22px, 2.8vw, 34px)', letterSpacing: '-0.025em', color: C.ink, margin: 0, lineHeight: 1 }}>
              Courses
            </h2>
            <span style={{ fontSize: 11, color: C.muted, letterSpacing: '0.12em', textTransform: 'uppercase', marginLeft: 'auto' }}>
              {courses.length} available
            </span>
          </div>

          {courses.length === 0 ? (
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
              <BookOpen size={32} color={C.rule} style={{ margin: '0 auto 16px', display: 'block' }} />
              <p style={{ fontFamily: 'var(--font-shippori)', fontWeight: 600, fontSize: 15, color: C.muted, margin: 0 }}>No courses published yet</p>
            </div>
          ) : (
            <div>
              {courses.map((c, idx) => {
                const p = priceDisplay(c.price, c.discountPercent, c.discountActive);
                const thumb = c.thumbnail ? convertBlobUrlToApiUrl(c.thumbnail) : null;
                return (
                  <Link key={c.id} href={`/course/${c.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div className="course-row" style={{ display: 'flex', alignItems: 'center', gap: 32, padding: '28px 0', borderBottom: `1px solid ${C.rule}`, cursor: 'pointer' }}>

                      {/* Index */}
                      <span style={{ fontFamily: 'var(--font-shippori)', fontWeight: 700, fontSize: 12, color: C.rule, letterSpacing: '0.06em', flexShrink: 0, width: 28, textAlign: 'right' }}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>

                      {/* Thumbnail */}
                      <div style={{ width: 350, aspectRatio: '16/9', borderRadius: 3, overflow: 'hidden', background: C.surface, flexShrink: 0, border: `1px solid ${C.rule}` }}>
                        {thumb
                          ? <img src={thumb} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontFamily: 'var(--font-shippori)', fontSize: 20, fontWeight: 700, color: C.rule }}>{s.name[0]}</span>
                            </div>
                        }
                      </div>

                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          {idx === 0 && (
                            <span style={{ fontSize: 9, fontWeight: 600, color: C.accent, letterSpacing: '0.14em', textTransform: 'uppercase', border: `1px solid rgba(${C.accentR},0.3)`, padding: '2px 7px', borderRadius: 1 }}>Featured</span>
                          )}
                          {p.isFree && (
                            <span style={{ fontSize: 9, fontWeight: 600, color: C.muted, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Free</span>
                          )}
                          {c.level && (
                            <span style={{ fontSize: 9, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{c.level}</span>
                          )}
                        </div>
                        <h3 className="jp-hover-line" style={{ fontFamily: 'var(--font-shippori)', fontWeight: 600, fontSize: 'clamp(15px, 1.6vw, 19px)', color: C.ink, margin: '0 0 6px', lineHeight: 1.25, letterSpacing: '-0.015em', display: 'inline-block' }}>
                          {c.title}
                        </h3>
                        {c.description && (
                          <p style={{ fontSize: 13, color: C.muted, margin: '0', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {c.description}
                          </p>
                        )}
                      </div>

                      {/* Price + arrow */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontFamily: 'var(--font-shippori)', fontWeight: 700, fontSize: 15, color: p.isFree ? C.accent : C.ink, margin: '0 0 2px', letterSpacing: '-0.01em' }}>{p.label}</p>
                          {p.original && <p style={{ fontSize: 11, color: C.muted, margin: 0, textDecoration: 'line-through' }}>{p.original}</p>}
                        </div>
                        <ArrowUpRight size={16} color={C.muted} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── THIN RULE ─── */}
      <div style={{ height: 1, background: C.rule }} />

      {/* ── FOR YOU ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '120px 40px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 80, alignItems: 'flex-start' }}>

          {/* Left heading */}
          <div style={{ flex: '0 0 auto', width: 280 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 24 }}>
              <span aria-hidden style={{ fontFamily: 'var(--font-shippori)', fontWeight: 800, fontSize: 11, color: C.rule, letterSpacing: '0.04em' }}>03</span>
              <h2 style={{ fontFamily: 'var(--font-shippori)', fontWeight: 700, fontSize: 'clamp(22px,2.4vw,30px)', letterSpacing: '-0.022em', color: C.ink, margin: 0, lineHeight: 1.05 }}>
                This is for you if…
              </h2>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.75, color: C.muted, margin: 0, paddingLeft: 25 }}>
              {s.name}&apos;s courses are for people who want real, actionable knowledge — not textbook theory.
            </p>
          </div>

          {/* Right — items */}
          <div style={{ flex: '1 1 320px', minWidth: 260 }}>
            {[
              `You want practical ${category.toLowerCase()} skills you can apply immediately`,
              `You prefer learning from someone actively working in ${category.toLowerCase()}`,
              `You want a certificate that validates your effort`,
            ].map((item, i, arr) => (
              <div key={item} style={{ display: 'flex', gap: 24, padding: '28px 0', borderTop: `1px solid ${C.rule}`, borderBottom: i === arr.length - 1 ? `1px solid ${C.rule}` : 'none' }}>
                <span style={{ fontFamily: 'var(--font-shippori)', fontWeight: 700, fontSize: 12, color: `rgba(${C.accentR},0.5)`, flexShrink: 0, width: 20, paddingTop: 3 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p style={{ fontSize: 15, fontWeight: 500, color: C.ink2, lineHeight: 1.6, margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ───────────────────────────────────────────────────────── */}
      {bio && (
        <>
          <div style={{ height: 1, background: C.rule }} />
          <section id="about" style={{ padding: '120px 40px', maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 72, alignItems: 'flex-start' }}>

              {/* Logo / avatar */}
              <div style={{ flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 24 }}>
                  <span aria-hidden style={{ fontFamily: 'var(--font-shippori)', fontWeight: 800, fontSize: 11, color: C.rule, letterSpacing: '0.04em' }}>04</span>
                  <h2 style={{ fontFamily: 'var(--font-shippori)', fontWeight: 700, fontSize: 'clamp(22px,2.4vw,30px)', letterSpacing: '-0.022em', color: C.ink, margin: 0, lineHeight: 1.05 }}>About</h2>
                </div>
                {logoUrl
                  ? <img src={logoUrl} alt={s.name} style={{ width: 160, height: 160, objectFit: 'cover', display: 'block', border: `1px solid ${C.rule}` }} />
                  : <div style={{ width: 160, height: 160, background: C.surface, border: `1px solid ${C.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-shippori)', fontSize: 64, fontWeight: 700, color: C.rule }}>{s.name[0]}</span>
                    </div>
                }
              </div>

              {/* Text */}
              <div style={{ flex: '1 1 320px', minWidth: 260, paddingTop: 50 }}>
                <p style={{ fontFamily: 'var(--font-shippori)', fontWeight: 600, fontSize: 20, color: C.ink, margin: '0 0 16px', letterSpacing: '-0.01em' }}>{s.name}</p>
                <div style={{ width: 32, height: 2, background: C.accent, marginBottom: 24 }} />
                <p style={{ fontSize: 15, lineHeight: 1.8, color: C.muted, margin: '0 0 28px'}}>{bio}</p>

                {socialItems.length > 0 && (
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    {socialItems.map(({ href, label, icon: Icon }) => (
                      <a key={label} href={href} target="_blank" rel="noreferrer" className="jp-hover-line"
                        style={{ fontSize: 12, fontWeight: 500, color: C.muted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, letterSpacing: '0.04em' }}>
                        <Icon size={11} /> {label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── CTA PANEL (guests only) ──────────────────────────────────────── */}
      {!session?.user && (
        <>
          <div style={{ height: 1, background: C.rule }} />
          <section style={{ padding: '0 40px 100px', maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ marginTop: 80, background: C.ink, padding: 'clamp(52px,6vw,80px) clamp(32px,5vw,72px)', display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>

              {/* Decorative numerals */}
              <span aria-hidden style={{ position: 'absolute', right: -20, bottom: -40, fontFamily: 'var(--font-shippori)', fontWeight: 800, fontSize: 220, lineHeight: 1, color: '#fff', opacity: 0.03, userSelect: 'none', letterSpacing: '-0.06em', pointerEvents: 'none' }}>05</span>

              <div style={{ flex: '1 1 320px', minWidth: 260 }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: `rgba(255,255,255,0.35)`, letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 20px' }}>Begin learning</p>
                <h2 style={{ fontFamily: 'var(--font-shippori)', fontWeight: 700, fontSize: 'clamp(28px,3.5vw,46px)', letterSpacing: '-0.03em', color: '#fff', margin: '0 0 16px', lineHeight: 1.05 }}>
                  Ready to learn from {s.name}?
                </h2>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.45)', margin: 0, maxWidth: 380 }}>
                  Learn {category.toLowerCase()} at your own pace — with a verified certificate to show for it.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
                <Link href="/sign-up" style={{ padding: '14px 32px', background: C.bg, color: C.ink, fontSize: 13, fontWeight: 600, textDecoration: 'none', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <GraduationCap size={14} /> Create free account
                </Link>
                <a href="#courses" style={{ padding: '14px 32px', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)', letterSpacing: '0.04em', textAlign: 'center' }}>
                  Browse courses
                </a>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── BANNER IMAGE ────────────────────────────────────────────────── */}
      {bannerUrl && (
        <div style={{ borderTop: `1px solid ${C.rule}` }}>
          <img
            src={bannerUrl}
            alt={`${s.name} banner`}
            style={{ width: '100%', maxHeight: 480, objectFit: 'cover', objectPosition: 'center', display: 'block' }}
          />
        </div>
      )}

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${C.rule}`, padding: '24px 40px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {logoUrl
              ? <img src={logoUrl} alt={s.name} style={{ width: 22, height: 22, objectFit: 'cover', border: `1px solid ${C.rule}` }} />
              : <div style={{ width: 22, height: 22, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-shippori)', fontWeight: 700, fontSize: 10 }}>{s.name[0]}</div>
            }
            <span style={{ fontFamily: 'var(--font-shippori)', fontWeight: 600, fontSize: 13, color: C.ink }}>{s.name}</span>
          </div>

          {socialItems.length > 0 && (
            <div style={{ display: 'flex', gap: 20 }}>
              {socialItems.map(({ href, label }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontWeight: 500, color: C.muted, textDecoration: 'none', letterSpacing: '0.06em' }}>{label}</a>
              ))}
            </div>
          )}

          <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>© {new Date().getFullYear()} {s.name}</p>

          <Link href="/" style={{ fontSize: 11, color: C.muted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, opacity: 0.6, letterSpacing: '0.04em' }}>
            ⚡ ObinAcademy
          </Link>
        </div>
      </footer>

    </div>
  );
}
