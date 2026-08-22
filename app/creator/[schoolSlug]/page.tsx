import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { school, course } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { convertBlobUrlToApiUrl } from '@/lib/blob-url';
import Link from 'next/link';
import { ArrowRight, BookOpen, GraduationCap, Globe, Link2, Check } from 'lucide-react';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { Sora } from 'next/font/google';

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sora',
  display: 'swap',
});

function hex2rgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

function priceDisplay(p: number | null, dp: number | null, da: boolean | null) {
  const base = p ?? 0;
  if (base === 0) return { label: 'Free', original: null, isFree: true };
  const discounted = da && dp ? Math.round(base * (1 - dp / 100)) : base;
  return {
    label: `UGX ${discounted.toLocaleString()}`,
    original: da && dp ? `UGX ${base.toLocaleString()}` : null,
    isFree: false,
  };
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

  // Derive a deeper shade of primary for the hero background
  const deepBg    = '#06007A'; // always deep navy for strong identity
  const pRgb      = hex2rgb(primaryColor);

  const socialItems = [
    { href: social.website,   label: 'Website',   icon: Globe },
    { href: social.twitter,   label: 'Twitter',   icon: Link2 },
    { href: social.instagram, label: 'Instagram', icon: Link2 },
    { href: social.youtube,   label: 'YouTube',   icon: Link2 },
  ].filter((x) => x.href);

  const freeCourses = courses.filter((c) => (c.price ?? 0) === 0).length;

  return (
    <div className={sora.variable} style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: '#fff', color: '#0A0A1A' }}>

      {/* ─── GLOBAL STYLES ─── */}
      <style>{`
        .cp-card { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .cp-card:hover { transform: translateY(-4px); box-shadow: 0 20px 48px -12px rgba(${pRgb},0.22); }
        .cp-btn-outline { transition: background 0.15s, color 0.15s; }
        .cp-btn-outline:hover { background: rgba(255,255,255,0.12) !important; }
        .cp-nav-link { transition: color 0.12s; }
        .cp-nav-link:hover { color: #fff !important; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        .hero-in { animation: fadeUp 0.55s ease both; }
        .hero-in-2 { animation: fadeUp 0.55s 0.1s ease both; }
        .hero-in-3 { animation: fadeUp 0.55s 0.22s ease both; }
      `}</style>

      {/* ─── 1. NAV ─── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: `rgba(6,0,122,0.96)`,
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between' }}>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {logoUrl
              ? <img src={logoUrl} alt={s.name} style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.2)' }} />
              : <div style={{ width: 32, height: 32, borderRadius: 8, background: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 13, border: '1.5px solid rgba(255,255,255,0.2)' }}>{s.name[0]}</div>
            }
            <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 15, color: '#fff' }}>{s.name}</span>
          </div>

          {/* Center nav */}
          <nav style={{ display: 'flex', gap: 2, flex: 1, justifyContent: 'center' }}>
            <Link href="/learn/creators" className="cp-nav-link" style={{ padding: '6px 14px', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.55)', borderRadius: 8, textDecoration: 'none' }}>
              ← All creators
            </Link>
            {[['#courses', 'Courses'], ['#about', 'About']].map(([href, label]) => (
              <a key={href} href={href} className="cp-nav-link" style={{ padding: '6px 14px', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.55)', borderRadius: 8, textDecoration: 'none' }}>
                {label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div style={{ flexShrink: 0 }}>
            {session?.user ? (
              <Link href="/learn/dashboard" style={{ padding: '8px 18px', background: accentColor, color: deepBg, borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--font-sora)' }}>
                My Learning →
              </Link>
            ) : (
              <Link href="/sign-up" style={{ padding: '8px 18px', background: accentColor, color: deepBg, borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--font-sora)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <GraduationCap size={13} /> Get started
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ─── 2. HERO ─── */}
      <section style={{ position: 'relative', background: deepBg, minHeight: 580, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>

        {/* Banner as subtle background texture */}
        {bannerUrl && (
          <img
            src={bannerUrl} alt="" aria-hidden
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.12 }}
          />
        )}

        {/* Radial glow */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 900, height: 600, background: `radial-gradient(ellipse at center, rgba(${pRgb},0.35) 0%, transparent 70%)`, pointerEvents: 'none' }} />

        {/* Grid pattern */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '80px 24px', width: '100%', display: 'flex', flexWrap: 'wrap', gap: 56, alignItems: 'center' }}>

          {/* Left — text */}
          <div style={{ flex: '1 1 400px', minWidth: 280 }}>
            {/* Eyebrow pill */}
            <div className="hero-in" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '6px 14px', marginBottom: 28, backdropFilter: 'blur(8px)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{category} · {courses.length} {courses.length === 1 ? 'Course' : 'Courses'}</span>
            </div>

            {/* Headline */}
            <h1 className="hero-in-2" style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 'clamp(36px,5.5vw,62px)', lineHeight: 1.04, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 24px', textWrap: 'balance' }}>
              {heroHeadline ? (
                heroHeadline.includes(s.name)
                  ? heroHeadline.split(s.name).map((part, i, arr) =>
                      i < arr.length - 1
                        ? <span key={i}>{part}<span style={{ color: accentColor }}>{s.name}</span></span>
                        : <span key={i}>{part}</span>
                    )
                  : heroHeadline
              ) : (
                <>Learn <span style={{ color: accentColor }}>{category}</span><br />from {s.name}</>
              )}
            </h1>

            {/* Sub */}
            <p className="hero-in-3" style={{ fontSize: 17, lineHeight: 1.65, color: 'rgba(255,255,255,0.65)', margin: '0 0 36px', maxWidth: 460 }}>
              {tagline ?? bio?.slice(0, 160) ?? `Expert-led ${category.toLowerCase()} courses designed to give you real, actionable skills — and a verified certificate.`}
            </p>

            {/* CTAs */}
            <div className="hero-in-3" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 40 }}>
              {session?.user ? (
                <Link href="/learn/dashboard" style={{ padding: '14px 28px', background: accentColor, color: deepBg, borderRadius: 10, fontSize: 15, fontWeight: 800, textDecoration: 'none', fontFamily: 'var(--font-sora)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  Go to My Learning →
                </Link>
              ) : (
                <>
                  <Link href="/sign-up" style={{ padding: '14px 28px', background: accentColor, color: deepBg, borderRadius: 10, fontSize: 15, fontWeight: 800, textDecoration: 'none', fontFamily: 'var(--font-sora)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <GraduationCap size={16} /> Enroll for free →
                  </Link>
                  <a href="#courses" className="cp-btn-outline" style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                    Browse courses
                  </a>
                </>
              )}
            </div>

            {/* Trust items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {[
                'Self-paced — learn on your schedule',
                'Earn a verified certificate',
                `Content created directly by ${s.name}`,
              ].map((t) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={10} color={accentColor} strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — logo card */}
          <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            {/* Logo square */}
            <div style={{
              width: 220, height: 220, borderRadius: 32, overflow: 'hidden',
              background: logoUrl ? '#000' : primaryColor,
              border: '3px solid rgba(255,255,255,0.15)',
              boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 40px 80px -20px rgba(0,0,0,0.6)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {logoUrl
                ? <img src={logoUrl} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontFamily: 'var(--font-sora)', fontSize: 80, fontWeight: 800, color: '#fff', opacity: 0.85 }}>{s.name[0]}</span>
              }
            </div>

            {/* Name + category */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 17, color: '#fff', margin: '0 0 6px' }}>{s.name}</p>
              {category && (
                <span style={{ fontSize: 11, fontWeight: 700, color: deepBg, background: accentColor, borderRadius: 999, padding: '4px 12px', letterSpacing: '0.06em', display: 'inline-block' }}>{category}</span>
              )}
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 24, color: '#fff', margin: '0 0 2px' }}>{courses.length}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Courses</p>
              </div>
              {freeCourses > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 24, color: accentColor, margin: '0 0 2px' }}>{freeCourses}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Free</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom wave fade */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to bottom, transparent, #fff)', pointerEvents: 'none' }} />
      </section>

      {/* ─── 3. STAT STRIP ─── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EBEBF0', padding: '20px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '6px 0' }}>
          {[category, 'Expert-led', 'Self-paced', 'Certified', `${courses.length} Course${courses.length !== 1 ? 's' : ''}`].map((pill, i, arr) => (
            <span key={pill} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#888' }}>{pill}</span>
              {i < arr.length - 1 && <span style={{ width: 4, height: 4, borderRadius: '50%', background: primaryColor, margin: '0 6px', flexShrink: 0, opacity: 0.3 }} />}
            </span>
          ))}
        </div>
      </div>

      {/* ─── 4. COURSES ─── */}
      <section id="courses" style={{ padding: '96px 24px', background: '#FAFAFA' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 48 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: `rgba(${pRgb},0.08)`, borderRadius: 999, padding: '5px 13px', marginBottom: 14 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: primaryColor }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: primaryColor, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {courses.length} {courses.length === 1 ? 'Course' : 'Courses'} available
                </span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 'clamp(28px,3.5vw,40px)', letterSpacing: '-0.025em', color: '#0A0A1A', margin: 0, lineHeight: 1.1 }}>
                Everything {s.name} has to teach
              </h2>
            </div>
          </div>

          {courses.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 20, padding: '72px 24px', textAlign: 'center', border: '1px solid #EBEBF0' }}>
              <BookOpen size={40} color="#DDD" style={{ margin: '0 auto 16px', display: 'block' }} />
              <p style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 16, color: '#0A0A1A', margin: '0 0 6px' }}>No courses published yet.</p>
              <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Come back soon for exclusive content from {s.name}.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
              {courses.map((c, idx) => {
                const p = priceDisplay(c.price, c.discountPercent, c.discountActive);
                const thumb = c.thumbnail ? convertBlobUrlToApiUrl(c.thumbnail) : null;
                const isFeatured = idx === 0;
                return (
                  <Link key={c.id} href={`/course/${c.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div className="cp-card" style={{
                      background: '#fff',
                      borderRadius: 18,
                      overflow: 'hidden',
                      border: isFeatured ? `2px solid ${primaryColor}` : '1px solid #EBEBF0',
                      position: 'relative',
                      boxShadow: isFeatured ? `0 8px 32px -8px rgba(${pRgb},0.2)` : '0 2px 12px rgba(0,0,0,0.04)',
                    }}>
                      {/* Featured badge */}
                      {isFeatured && (
                        <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 2, background: primaryColor, color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 999, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          ★ Featured
                        </div>
                      )}

                      {/* Thumbnail */}
                      <div style={{ height: isFeatured ? 200 : 170, background: '#0A0A1A', overflow: 'hidden', position: 'relative' }}>
                        {thumb
                          ? <img src={thumb} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${deepBg} 0%, ${primaryColor} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontFamily: 'var(--font-sora)', fontSize: 48, fontWeight: 800, color: 'rgba(255,255,255,0.15)' }}>{s.name[0]}</span>
                            </div>
                        }
                        {/* Price badge */}
                        <div style={{ position: 'absolute', bottom: 12, right: 12, background: p.isFree ? accentColor : 'rgba(0,0,0,0.75)', color: p.isFree ? deepBg : '#fff', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8, backdropFilter: 'blur(4px)', fontFamily: 'var(--font-sora)' }}>
                          {p.label}
                        </div>
                      </div>

                      {/* Card body */}
                      <div style={{ padding: '20px 20px 22px' }}>
                        {c.level && (
                          <div style={{ marginBottom: 10 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', background: '#F4F4F8', padding: '3px 8px', borderRadius: 6 }}>{c.level}</span>
                          </div>
                        )}
                        <h3 style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 16, color: '#0A0A1A', margin: '0 0 8px', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {c.title}
                        </h3>
                        {c.description && (
                          <p style={{ fontSize: 13, color: '#666', lineHeight: 1.55, margin: '0 0 14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {c.description}
                          </p>
                        )}
                        {c.instructor && (
                          <p style={{ fontSize: 12, color: '#888', margin: '0 0 16px', fontWeight: 500 }}>By {c.instructor}</p>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                            <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 17, color: p.isFree ? primaryColor : '#0A0A1A' }}>{p.label}</span>
                            {p.original && <span style={{ fontSize: 12, color: '#AAA', textDecoration: 'line-through' }}>{p.original}</span>}
                          </div>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: primaryColor }}>
                            View <ArrowRight size={12} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── 5. IS THIS FOR YOU ─── */}
      <section style={{ padding: '96px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 64, alignItems: 'flex-start' }}>

          <div style={{ flex: '1 1 360px', minWidth: 260 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: `rgba(${pRgb},0.08)`, borderRadius: 999, padding: '5px 13px', marginBottom: 18 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: primaryColor }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: primaryColor, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Who is this for?</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 'clamp(26px,3vw,38px)', letterSpacing: '-0.022em', color: '#0A0A1A', margin: '0 0 18px', lineHeight: 1.1 }}>
              This is for you if…
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: '#666', margin: 0 }}>
              {s.name}&apos;s courses are built for people who want real, actionable knowledge — not textbook theory.
            </p>
          </div>

          <div style={{ flex: '1 1 360px', minWidth: 260, paddingTop: 8 }}>
            {[
              `You want practical ${category.toLowerCase()} skills you can apply immediately`,
              `You prefer learning from someone actively working in ${category.toLowerCase()}`,
              'You want a certificate that validates your effort',
            ].map((item, i, arr) => (
              <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '20px 0', borderBottom: i < arr.length - 1 ? '1px solid #EBEBF0' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `rgba(${pRgb},0.08)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 13, color: primaryColor }}>
                  {i + 1}
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#1A1A2E', lineHeight: 1.55, margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── 6. ABOUT ─── */}
      {bio && (
        <section id="about" style={{ padding: '96px 24px', background: '#FAFAFA', borderTop: '1px solid #EBEBF0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 56, alignItems: 'center' }}>

            {/* Logo / avatar */}
            <div style={{ flexShrink: 0 }}>
              {logoUrl
                ? <img src={logoUrl} alt={s.name} style={{ width: 180, height: 180, borderRadius: 24, objectFit: 'cover', border: '3px solid #fff', boxShadow: '0 24px 60px -20px rgba(0,0,0,0.18)' }} />
                : <div style={{ width: 180, height: 180, borderRadius: 24, background: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 24px 60px -20px rgba(${pRgb},0.4)` }}>
                    <span style={{ fontFamily: 'var(--font-sora)', fontSize: 72, fontWeight: 800, color: '#fff' }}>{s.name[0]}</span>
                  </div>
              }
            </div>

            {/* Text */}
            <div style={{ flex: '1 1 320px', minWidth: 260 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: `rgba(${pRgb},0.08)`, borderRadius: 999, padding: '5px 13px', marginBottom: 16 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: primaryColor }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: primaryColor, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Your creator</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 'clamp(22px,2.5vw,32px)', letterSpacing: '-0.02em', color: '#0A0A1A', margin: '0 0 16px', lineHeight: 1.15 }}>{s.name}</h2>
              <p style={{ fontSize: 16, lineHeight: 1.75, color: '#555', margin: '0 0 24px' }}>{bio}</p>

              {socialItems.length > 0 && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {socialItems.map(({ href, label, icon: Icon }) => (
                    <a key={label} href={href} target="_blank" rel="noreferrer"
                      style={{ padding: '8px 16px', background: '#fff', border: '1px solid #EBEBF0', borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#0A0A1A', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Icon size={12} /> {label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─── 7. CTA PANEL (guests only) ─── */}
      {!session?.user && (
        <section style={{ padding: '40px 24px 96px', background: '#fff' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ background: deepBg, borderRadius: 28, padding: 'clamp(48px,6vw,72px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              {/* Decorative glow blobs */}
              <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: accentColor, opacity: 0.06, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -80, left: -60, width: 280, height: 280, borderRadius: '50%', background: primaryColor, opacity: 0.12, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'linear-gradient(rgba(255,255,255,0.7) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.7) 1px,transparent 1px)', backgroundSize: '50px 50px', pointerEvents: 'none' }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 'clamp(26px,3.5vw,44px)', letterSpacing: '-0.025em', color: '#fff', margin: '0 0 16px', lineHeight: 1.08 }}>
                  Ready to learn from <span style={{ color: accentColor }}>{s.name}</span>?
                </h2>
                <p style={{ fontSize: 17, lineHeight: 1.65, color: 'rgba(255,255,255,0.6)', margin: '0 auto 36px', maxWidth: 440 }}>
                  Learn {category.toLowerCase()} at your own pace — with a verified certificate to show for it.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                  <Link href="/sign-up" style={{ padding: '15px 32px', background: accentColor, color: deepBg, borderRadius: 12, fontSize: 15, fontWeight: 800, textDecoration: 'none', fontFamily: 'var(--font-sora)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <GraduationCap size={16} /> Create free account →
                  </Link>
                  <a href="#courses" style={{ padding: '15px 28px', background: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: 12, fontSize: 15, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.18)' }}>
                    Browse courses
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── 8. FOOTER ─── */}
      <footer style={{ borderTop: '1px solid #EBEBF0', padding: '28px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {logoUrl
              ? <img src={logoUrl} alt={s.name} style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'cover' }} />
              : <div style={{ width: 26, height: 26, borderRadius: 6, background: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 11, fontFamily: 'var(--font-sora)' }}>{s.name[0]}</div>
            }
            <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 14, color: '#0A0A1A' }}>{s.name}</span>
          </div>
          {socialItems.length > 0 && (
            <div style={{ display: 'flex', gap: 20 }}>
              {socialItems.map(({ href, label }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 600, color: '#999', textDecoration: 'none' }}>{label}</a>
              ))}
            </div>
          )}
          <p style={{ fontSize: 11, color: '#bbb', margin: 0 }}>© {new Date().getFullYear()} {s.name}. All rights reserved.</p>
          <Link href="/" style={{ fontSize: 11, color: '#bbb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, opacity: 0.7 }}>
            ⚡ Powered by <strong style={{ fontWeight: 700 }}>ObinAcademy</strong>
          </Link>
        </div>
      </footer>

    </div>
  );
}
