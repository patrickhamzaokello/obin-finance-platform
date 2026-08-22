import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'ObinAcademy',
  description: 'Discover classes from expert creators. Learn finance, tech, business and more — right here in Uganda.',
};

import { isPlatformOwner } from '@/lib/school-context';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { db } from '@/lib/db';
import { course, school, courseEnrollment } from '@/lib/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import { convertBlobUrlToApiUrl } from '@/lib/blob-url';
import {
  Search, Play, Users, Bell, MessageSquare, ChevronRight,
} from 'lucide-react';

const CATEGORIES = [
  'Trending', 'Finance', 'Tech', 'Business', 'Fitness',
  'Music', 'Art', 'Education', 'Lifestyle',
];

const PAGE_SIZE = 12;

interface Props {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}

function effectivePrice(price: number | null, discountActive: boolean | null, discountPercent: number | null) {
  const base = price ?? 0;
  if (discountActive && (discountPercent ?? 0) > 0) {
    return Math.round(base * (1 - (discountPercent ?? 0) / 100));
  }
  return base;
}

export default async function DiscoverPage({ searchParams }: Props) {
  if (await isPlatformOwner()) redirect('/platform/admin');

  const params   = await searchParams;
  const q        = params.q?.trim() ?? '';
  const category = params.category ?? 'Trending';
  const page     = Math.max(1, parseInt(params.page ?? '1', 10));

  // Auth state for nav
  const session = await auth.api.getSession({ headers: await headers() });
  const user    = session?.user ?? null;

  // Fetch all published classes with school info
  const rows = await db
    .select({
      id:              course.id,
      title:           course.title,
      description:     course.description,
      thumbnail:       course.thumbnail,
      price:           course.price,
      discountPercent: course.discountPercent,
      discountActive:  course.discountActive,
      schoolId:        course.schoolId,
      schoolName:      school.name,
      schoolSlug:      school.slug,
      schoolLogo:      school.logoUrl,
      schoolCategory:  school.category,
      createdAt:       course.createdAt,
    })
    .from(course)
    .innerJoin(school, eq(course.schoolId, school.id))
    .where(eq(course.isPublished, true))
    .orderBy(desc(course.createdAt));

  // Enrollment counts
  const enrollCounts = await db
    .select({ courseId: courseEnrollment.courseId, cnt: count() })
    .from(courseEnrollment)
    .groupBy(courseEnrollment.courseId);
  const enrollMap = Object.fromEntries(enrollCounts.map(e => [e.courseId, Number(e.cnt)]));

  // Filter
  const filtered = rows.filter((r) => {
    if (q) {
      const haystack = `${r.title} ${r.description ?? ''} ${r.schoolName}`.toLowerCase();
      if (!haystack.includes(q.toLowerCase())) return false;
    }
    if (category !== 'Trending' && category !== 'All') {
      if ((r.schoolCategory ?? '') !== category) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function filterUrl(extra: Record<string, string>) {
    const p = new URLSearchParams({
      ...(q ? { q } : {}),
      ...(category !== 'Trending' ? { category } : {}),
      ...extra,
    });
    const s = p.toString();
    return `/platform${s ? `?${s}` : ''}`;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', fontFamily: "var(--font-geist-sans), system-ui, sans-serif", color: '#1a1a1a' }}>

      {/* ── NAV ───────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#0B00FF',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        height: 56,
        display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 16,
      }}>
        {/* Logo */}
        <Link href="/platform" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
          <img src="/images/white-logo.png" alt="ObinAcademy" style={{ height: 32, width: 'auto', display: 'block' }} />
        </Link>

        {/* Search — center */}
        <form action="/platform" method="GET" style={{ flex: 1, maxWidth: 560, margin: '0 auto' }}>
          {category !== 'Trending' && <input type="hidden" name="category" value={category} />}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', pointerEvents: 'none' }} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search classes, creators…"
              style={{
                width: '100%', boxSizing: 'border-box',
                paddingLeft: 36, paddingRight: 16, paddingTop: 7, paddingBottom: 7,
                border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 8, fontSize: 14,
                background: 'rgba(255,255,255,0.12)', outline: 'none',
                fontFamily: 'inherit', color: '#fff',
              }}
            />
          </div>
        </form>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {user ? (
            <>
              <Link href="/learn/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
                <MessageSquare size={16} />
              </Link>
              <Link href="/learn/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
                <Bell size={16} />
              </Link>
              <Link href="/learn/dashboard" style={{ width: 34, height: 34, borderRadius: '50%', background: '#CDFB5E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#06007A', textDecoration: 'none' }}>
                {(user.name ?? user.email ?? 'U')[0].toUpperCase()}
              </Link>
            </>
          ) : (
            <>
              <Link href="/sign-in" style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)', textDecoration: 'none', padding: '6px 12px' }}>
                Sign in
              </Link>
              <Link href="/platform/apply" style={{
                fontSize: 13, fontWeight: 700, color: '#06007A',
                background: '#CDFB5E', padding: '7px 16px', borderRadius: 8,
                textDecoration: 'none',
              }}>
                Apply to teach
              </Link>
            </>
          )}
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(160deg, #0B00FF 0%, #06007A 100%)',
        padding: 'clamp(40px, 6vw, 72px) 24px 0',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -60, right: -80, width: 340, height: 340, borderRadius: '50%', background: 'rgba(205,251,94,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 20, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', position: 'relative' }}>

          {/* Eyebrow */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(205,251,94,0.12)', border: '1px solid rgba(205,251,94,0.25)', borderRadius: 999, padding: '5px 14px', marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#CDFB5E', display: 'block', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#CDFB5E', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Uganda&apos;s creator platform</span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontWeight: 900, fontSize: 'clamp(32px, 5.5vw, 58px)',
            letterSpacing: '-0.035em', lineHeight: 1.08,
            color: '#fff', margin: '0 0 18px',
          }}>
            Learn from East Africa&apos;s<br />
            <span style={{ color: '#CDFB5E' }}>best creators.</span>
          </h1>

          {/* Sub */}
          <p style={{ fontSize: 'clamp(14px, 1.8vw, 17px)', color: 'rgba(255,255,255,0.65)', margin: '0 0 36px', lineHeight: 1.6, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
            Finance, tech, and business classes — paid instantly with MTN or Airtel Money.{' '}
            <Link href="/platform/apply" style={{ color: '#CDFB5E', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Want to teach? →
            </Link>
          </p>

          {/* Search bar */}
          <form action="/platform" method="GET" style={{ marginBottom: 28 }}>
            {category !== 'Trending' && <input type="hidden" name="category" value={category} />}
            <div style={{ position: 'relative', maxWidth: 580, margin: '0 auto' }}>
              <Search size={18} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }} />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search classes, creators, topics…"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  paddingLeft: 50, paddingRight: 20, paddingTop: 16, paddingBottom: 16,
                  border: 'none', borderRadius: 14, fontSize: 15,
                  background: '#fff', outline: 'none',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                  fontFamily: 'inherit', color: '#111',
                }}
              />
            </div>
          </form>

          {/* Category pills — on dark bg */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, paddingBottom: 32 }}>
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <Link
                  key={cat}
                  href={filterUrl({ category: cat, page: '1' })}
                  style={{
                    padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                    textDecoration: 'none', transition: 'all 0.15s',
                    background: active ? '#CDFB5E' : 'rgba(255,255,255,0.1)',
                    color: active ? '#06007A' : 'rgba(255,255,255,0.85)',
                    border: active ? '1.5px solid #CDFB5E' : '1.5px solid rgba(255,255,255,0.15)',
                  }}
                >
                  {cat}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Stats strip — sits at the bottom of the hero, fades into page */}
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px 36px',
          padding: '18px 24px',
        }}>
          {[
            { n: '1,200+',     label: 'learners enrolled' },
            { n: '50+',        label: 'classes published' },
            { n: 'MTN & Airtel', label: 'Mobile Money supported' },
            { n: '10+',        label: 'expert creators' },
          ].map(({ n, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: '#CDFB5E' }}>{n}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── COURSE GRID ───────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>

        {/* Result count */}
        {q && (
          <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;<strong style={{ color: '#333' }}>{q}</strong>&rdquo;
          </p>
        )}

        {paginated.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: '#999' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#555', margin: '0 0 8px' }}>No Classes found</p>
            <p style={{ fontSize: 14 }}>Try a different search or category.</p>
            <Link href="/platform" style={{ display: 'inline-block', marginTop: 16, color: '#0B00FF', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
              Clear filters →
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20,
          }}>
            {paginated.map((r) => {
              const price    = effectivePrice(r.price, r.discountActive, r.discountPercent);
              const enrolled = enrollMap[r.id] ?? 0;
              const logo     = r.schoolLogo ? convertBlobUrlToApiUrl(r.schoolLogo) : null;
              const thumb    = r.thumbnail  ? convertBlobUrlToApiUrl(r.thumbnail)  : null;

              return (
                <Link
                  key={r.id}
                  href={`/course/${r.id}`}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}
                >
                  <div className="course-card" style={{
                    background: '#fff',
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid #E8E8E8',
                    flex: 1, display: 'flex', flexDirection: 'column',
                  }}>
                    {/* Thumbnail */}
                    <div style={{ width: '100%', aspectRatio: '16/9', background: '#E8E8F0', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                      {thumb ? (
                        <img src={thumb} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          background: `linear-gradient(135deg, #0B00FF22, #0B00FF44)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Play size={32} color="#0B00FF" style={{ opacity: 0.4 }} />
                        </div>
                      )}
                      {/* Price badge */}
                      <div style={{
                        position: 'absolute', top: 10, right: 10,
                        background: price === 0 ? '#22C55E' : '#1a1a1a',
                        color: '#fff', borderRadius: 6,
                        padding: '3px 9px', fontSize: 12, fontWeight: 700,
                      }}>
                        {price === 0 ? 'Free' : `UGX ${price.toLocaleString()}`}
                      </div>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: '16px 16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* Creator row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {logo ? (
                          <img src={logo} alt={r.schoolName} style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover', border: '1px solid #eee', flexShrink: 0 }} />
                        ) : (
                          <div style={{
                            width: 24, height: 24, borderRadius: 6, background: '#0B00FF',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: 11, color: '#fff', flexShrink: 0,
                          }}>
                            {r.schoolName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.schoolName}
                        </span>
                        {r.schoolCategory && (
                          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#0B00FF', background: '#EEEEFF', padding: '2px 7px', borderRadius: 4, flexShrink: 0 }}>
                            {r.schoolCategory}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h2 style={{
                        fontWeight: 700, fontSize: 15, lineHeight: 1.35,
                        color: '#111', margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {r.title}
                      </h2>

                      {/* Description */}
                      {r.description && (
                        <p style={{
                          fontSize: 13, color: '#777', lineHeight: 1.5, margin: 0,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          flex: 1,
                        }}>
                          {r.description}
                        </p>
                      )}

                      {/* Footer */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto' }}>
                        <Users size={12} color="#aaa" />
                        <span style={{ fontSize: 12, color: '#aaa', fontWeight: 600 }}>
                          {enrolled.toLocaleString()} {enrolled === 1 ? 'learner' : 'learners'}
                        </span>
                        <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 13, color: price === 0 ? '#22C55E' : '#111' }}>
                          {price === 0 ? 'Free' : `UGX ${price.toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── PAGINATION ───────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 48 }}>
            {page > 1 && (
              <Link href={filterUrl({ page: String(page - 1) })} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                color: '#555', border: '1.5px solid #E0E0E0', background: '#fff', textDecoration: 'none',
              }}>
                ← Previous
              </Link>
            )}

            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pg: number;
              if (totalPages <= 7) {
                pg = i + 1;
              } else if (page <= 4) {
                pg = i + 1;
              } else if (page >= totalPages - 3) {
                pg = totalPages - 6 + i;
              } else {
                pg = page - 3 + i;
              }
              return (
                <Link key={pg} href={filterUrl({ page: String(pg) })} style={{
                  width: 36, height: 36, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, textDecoration: 'none',
                  background: pg === page ? '#1a1a1a' : '#fff',
                  color: pg === page ? '#fff' : '#555',
                  border: pg === page ? '1.5px solid #1a1a1a' : '1.5px solid #E0E0E0',
                }}>
                  {pg}
                </Link>
              );
            })}

            {totalPages > 7 && page < totalPages - 3 && (
              <span style={{ fontSize: 13, color: '#aaa' }}>…</span>
            )}
            {totalPages > 7 && (
              <Link href={filterUrl({ page: String(totalPages) })} style={{
                width: 36, height: 36, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, textDecoration: 'none',
                background: '#fff', color: '#555', border: '1.5px solid #E0E0E0',
              }}>
                {totalPages}
              </Link>
            )}

            {page < totalPages && (
              <Link href={filterUrl({ page: String(page + 1) })} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                color: '#555', border: '1.5px solid #E0E0E0', background: '#fff', textDecoration: 'none',
              }}>
                Next →
              </Link>
            )}
          </div>
        )}
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid #E5E5E5', background: '#fff', padding: '20px 24px', marginTop: 40 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/images/white-logo.png" alt="ObinAcademy" style={{ height: 24, width: 'auto', filter: 'brightness(0)', opacity: 0.7 }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
            {[
              ['Community', '/learn/creators'],
              ['Become a teacher', '/platform/apply'],
              ['Sign in', '/sign-in'],
            ].map(([label, href]) => (
              <Link key={label} href={href} style={{ fontSize: 13, fontWeight: 600, color: '#888', textDecoration: 'none' }}>{label}</Link>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#bbb', margin: 0 }}>
            © {new Date().getFullYear()} ObinAcademy
          </p>
        </div>
      </footer>

      <style>{`
        .course-card { transition: box-shadow 0.15s, transform 0.15s; cursor: pointer; }
        .course-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.12); transform: translateY(-2px); }
      `}</style>
    </div>
  );
}
