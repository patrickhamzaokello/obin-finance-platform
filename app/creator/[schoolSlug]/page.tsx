import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { school, course } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { convertBlobUrlToApiUrl } from '@/lib/blob-url';
import Link from 'next/link';
import {
  ArrowUpRight, BookOpen, GraduationCap, Globe,
  ExternalLink, Link2,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

function priceDisplay(p: number | null, dp: number | null, da: boolean | null) {
  const base = p ?? 0;
  if (base === 0) return { label: 'Free', original: null, isFree: true };
  const disc = da && dp ? Math.round(base * (1 - dp / 100)) : base;
  return {
    label: `UGX ${disc.toLocaleString()}`,
    original: da && dp ? `UGX ${base.toLocaleString()}` : null,
    isFree: false,
  };
}

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  website:   Globe,
  twitter:   Link2,
  instagram: Link2,
  youtube:   Link2,
};

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
  try { social = JSON.parse(s.socialLinks ?? '{}'); } catch { /* empty */ }

  const logoUrl   = s.logoUrl   ? convertBlobUrlToApiUrl(s.logoUrl)   : null;
  const bannerUrl = s.bannerUrl ? convertBlobUrlToApiUrl(s.bannerUrl) : null;
  const category  = s.category  ?? 'Creator';
  const bio       = s.bio;
  const tagline   = s.tagline;
  const heroLine  = s.heroHeadline ?? tagline;

  const socialItems = (['website', 'twitter', 'instagram', 'youtube'] as const)
    .filter((k) => social[k])
    .map((k) => ({ key: k, href: social[k], label: k[0].toUpperCase() + k.slice(1), Icon: SOCIAL_ICONS[k] }));

  return (
    <div style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)', background: '#F5F5F7', minHeight: '100vh', color: '#111' }}>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

          {/* Brand mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {logoUrl
              ? <img src={logoUrl} alt={s.name} style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(0,0,0,0.08)' }} />
              : <div style={{ width: 30, height: 30, borderRadius: 8, background: '#0B00FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>{s.name[0]}</div>
            }
            <span style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>{s.name}</span>
            <span style={{ width: 1, height: 14, background: 'rgba(0,0,0,0.12)', flexShrink: 0, margin: '0 4px' }} />
            <span style={{ fontSize: 11, fontWeight: 500, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{category}</span>
          </div>

          {/* Right nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <a href="#courses" style={{ padding: '6px 12px', fontSize: 13, fontWeight: 500, color: '#555', textDecoration: 'none', borderRadius: 8 }}>Courses</a>
            {bio && <a href="#about" style={{ padding: '6px 12px', fontSize: 13, fontWeight: 500, color: '#555', textDecoration: 'none', borderRadius: 8 }}>About</a>}
            <span style={{ width: 1, height: 14, background: 'rgba(0,0,0,0.12)', margin: '0 6px' }} />
            {session?.user ? (
              <Link href="/learn/dashboard" style={{ padding: '7px 16px', background: '#0B00FF', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                My Learning <ArrowUpRight size={12} />
              </Link>
            ) : (
              <Link href="/sign-up" style={{ padding: '7px 16px', background: '#0B00FF', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                Get started <ArrowUpRight size={12} />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── PROFILE HERO ────────────────────────────────────────────────── */}
      <section style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        {/* Banner */}
        {bannerUrl && (
          <div style={{ width: '100%', height: 220, overflow: 'hidden', background: '#F5F5F7' }}>
            <img src={bannerUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
          </div>
        )}

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 48px' }}>
          {/* Avatar — overlaps banner bottom edge when banner present */}
          <div style={{ marginTop: bannerUrl ? -44 : 32, marginBottom: 16 }}>
            {logoUrl
              ? <img src={logoUrl} alt={s.name} style={{ width: 88, height: 88, borderRadius: 20, objectFit: 'cover', border: '4px solid #fff', boxShadow: '0 2px 16px rgba(0,0,0,0.10)', display: 'block' }} />
              : <div style={{ width: 88, height: 88, borderRadius: 20, background: '#0B00FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 32, border: '4px solid #fff', boxShadow: '0 2px 16px rgba(0,0,0,0.10)' }}>{s.name[0]}</div>
            }
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
            {/* Name + meta */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <h1 style={{ fontWeight: 700, fontSize: 'clamp(22px, 3vw, 30px)', color: '#111', margin: 0, lineHeight: 1.15 }}>{s.name}</h1>
                <span style={{ padding: '3px 10px', background: '#F0F0FF', color: '#0B00FF', fontSize: 11, fontWeight: 600, borderRadius: 20, letterSpacing: '0.04em' }}>{category}</span>
              </div>
              {heroLine && (
                <p style={{ fontSize: 15, color: '#555', margin: '0 0 12px', lineHeight: 1.5, maxWidth: 560 }}>{heroLine}</p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: '#888' }}>
                  <strong style={{ color: '#111' }}>{courses.length}</strong> {courses.length === 1 ? 'course' : 'courses'}
                </span>
                {socialItems.map(({ key, href, label, Icon }) => (
                  <a key={key} href={href} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#888', textDecoration: 'none' }}>
                    <Icon size={13} /> {label}
                  </a>
                ))}
              </div>
            </div>

            {/* CTA */}
            {!session?.user && (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignSelf: 'flex-end' }}>
                <Link href="/sign-up" style={{ padding: '10px 20px', background: '#0B00FF', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GraduationCap size={14} /> Enroll free
                </Link>
                <a href="#courses" style={{ padding: '10px 20px', background: '#F5F5F7', color: '#333', fontSize: 13, fontWeight: 500, textDecoration: 'none', borderRadius: 12 }}>
                  Browse
                </a>
              </div>
            )}
          </div>

          {/* Bio preview */}
          {bio && (
            <p style={{ fontSize: 14, color: '#666', margin: '20px 0 0', lineHeight: 1.7, maxWidth: 680 }}>{bio}</p>
          )}
        </div>
      </section>

      {/* ── COURSES ─────────────────────────────────────────────────────── */}
      <section id="courses" style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontWeight: 700, fontSize: 18, color: '#111', margin: 0 }}>Courses</h2>
          {courses.length > 0 && (
            <span style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>{courses.length} available</span>
          )}
        </div>

        {courses.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 20, padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <BookOpen size={22} color="#aaa" />
            </div>
            <p style={{ fontWeight: 600, fontSize: 15, color: '#555', margin: '0 0 6px' }}>No courses yet</p>
            <p style={{ fontSize: 13, color: '#aaa', margin: 0 }}>Check back soon</p>
          </div>
        ) : (
          <>
          <style>{`.course-card { transition: box-shadow 0.15s, transform 0.15s; } .course-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.08); transform: translateY(-2px); }`}</style>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {courses.map((c, idx) => {
              const p = priceDisplay(c.price, c.discountPercent, c.discountActive);
              const thumb = c.thumbnail ? convertBlobUrlToApiUrl(c.thumbnail) : null;
              return (
                <Link key={c.id} href={`/course/${c.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div className="course-card" style={{
                    background: '#fff', borderRadius: 20,
                    border: '1px solid rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}>
                    {/* Thumbnail */}
                    <div style={{ aspectRatio: '16/9', background: '#F5F5F7', overflow: 'hidden', position: 'relative' }}>
                      {thumb
                        ? <img src={thumb} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: 32, color: '#ddd' }}>{s.name[0]}</span>
                          </div>
                      }
                      {idx === 0 && (
                        <div style={{ position: 'absolute', top: 10, left: 10, padding: '3px 9px', background: '#0B00FF', color: '#fff', fontSize: 10, fontWeight: 600, borderRadius: 6, letterSpacing: '0.06em' }}>
                          Featured
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ padding: '16px 18px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                        {c.level && (
                          <span style={{ fontSize: 10, fontWeight: 600, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 7px', background: '#F5F5F7', borderRadius: 5 }}>{c.level}</span>
                        )}
                        {p.isFree && (
                          <span style={{ fontSize: 10, fontWeight: 600, color: '#16a34a', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 7px', background: '#f0fdf4', borderRadius: 5 }}>Free</span>
                        )}
                      </div>
                      <h3 style={{ fontWeight: 600, fontSize: 15, color: '#111', margin: '0 0 6px', lineHeight: 1.35 }}>{c.title}</h3>
                      {c.description && (
                        <p style={{ fontSize: 12, color: '#888', margin: '0 0 14px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {c.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: 15, color: p.isFree ? '#16a34a' : '#111' }}>{p.label}</span>
                          {p.original && <span style={{ fontSize: 11, color: '#aaa', marginLeft: 6, textDecoration: 'line-through' }}>{p.original}</span>}
                        </div>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ArrowUpRight size={14} color="#555" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          </>
        )}
      </section>

      {/* ── ABOUT ───────────────────────────────────────────────────────── */}
      {bio && (
        <section id="about" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 48px' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px', border: '1px solid rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontWeight: 700, fontSize: 16, color: '#111', margin: '0 0 20px' }}>About {s.name}</h2>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {logoUrl && (
                <img src={logoUrl} alt={s.name} style={{ width: 64, height: 64, borderRadius: 14, objectFit: 'cover', border: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontSize: 14, color: '#555', margin: '0 0 16px', lineHeight: 1.75 }}>{bio}</p>
                {socialItems.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {socialItems.map(({ key, href, label, Icon }) => (
                      <a key={key} href={href} target="_blank" rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#F5F5F7', color: '#555', fontSize: 12, fontWeight: 500, textDecoration: 'none', borderRadius: 8 }}>
                        <Icon size={12} /> {label} <ExternalLink size={10} color="#aaa" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      {!session?.user && (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 64px' }}>
          <div style={{ background: '#0B00FF', borderRadius: 24, padding: 'clamp(32px, 5vw, 56px) clamp(24px, 4vw, 48px)', display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 12px' }}>Start learning today</p>
              <h2 style={{ fontWeight: 700, fontSize: 'clamp(22px, 3vw, 30px)', color: '#fff', margin: '0 0 8px', lineHeight: 1.2 }}>
                Ready to learn from {s.name}?
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0, maxWidth: 360 }}>
                Join free and earn a verified certificate when you complete a course.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
              <Link href="/sign-up" style={{ padding: '12px 24px', background: '#fff', color: '#0B00FF', fontSize: 13, fontWeight: 700, textDecoration: 'none', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <GraduationCap size={14} /> Create free account
              </Link>
              <a href="#courses" style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontWeight: 500, textDecoration: 'none', borderRadius: 12 }}>
                Browse courses
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: '#fff', padding: '20px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {logoUrl
              ? <img src={logoUrl} alt={s.name} style={{ width: 22, height: 22, borderRadius: 6, objectFit: 'cover', border: '1px solid rgba(0,0,0,0.08)' }} />
              : <div style={{ width: 22, height: 22, borderRadius: 6, background: '#0B00FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 10 }}>{s.name[0]}</div>
            }
            <span style={{ fontWeight: 600, fontSize: 13, color: '#333' }}>{s.name}</span>
            <span style={{ fontSize: 12, color: '#aaa' }}>· © {new Date().getFullYear()}</span>
          </div>

          {socialItems.length > 0 && (
            <div style={{ display: 'flex', gap: 16 }}>
              {socialItems.map(({ key, href, label }) => (
                <a key={key} href={href} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#999', textDecoration: 'none' }}>{label}</a>
              ))}
            </div>
          )}

          <Link href="/" style={{ fontSize: 11, color: '#bbb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            ⚡ Powered by ObinAcademy
          </Link>
        </div>
      </footer>

    </div>
  );
}
