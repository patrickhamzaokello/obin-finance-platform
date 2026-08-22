import { db } from '@/lib/db';
import { course, school, courseEnrollment } from '@/lib/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import Link from 'next/link';
import type { Metadata } from 'next';
import { PublicNav } from '@/components/public-nav';
import LearnNav from '@/app/learn/learn-nav';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getCurrentOrganizationId } from '@/lib/organization';

export const metadata: Metadata = {
  title: 'Browse Classes',
  description: 'Explore courses from creators across the ObinAcademy platform.',
};

const CATEGORIES = ['All', 'Finance', 'Tech', 'Fitness', 'Business', 'Creative', 'Education'];
const PAGE_SIZE  = 12;

interface Props {
  searchParams: Promise<{ category?: string; level?: string; q?: string; price?: string; page?: string }>;
}

export default async function CoursesMarketplace({ searchParams }: Props) {
  const params      = await searchParams;
  const [session, orgId] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getCurrentOrganizationId(),
  ]);
  const category    = params.category ?? 'All';
  const level       = params.level ?? 'All levels';
  const q           = params.q ?? '';
  const priceFilter = params.price ?? 'all';
  const page        = Math.max(1, parseInt(params.page ?? '1', 10));

  // Fetch published classes + school info
  const rows = await db
    .select({
      id:              course.id,
      title:           course.title,
      description:     course.description,
      thumbnail:       course.thumbnail,
      instructor:      course.instructor,
      price:           course.price,
      discountPercent: course.discountPercent,
      discountActive:  course.discountActive,
      level:           course.level,
      language:        course.language,
      schoolId:        course.schoolId,
      schoolName:      school.name,
      schoolSlug:      school.slug,
      schoolLogo:      school.logoUrl,
      category:        school.category,
      createdAt:       course.createdAt,
    })
    .from(course)
    .innerJoin(school, eq(course.schoolId, school.id))
    .where(
      orgId
        ? and(eq(course.isPublished, true), eq(school.organizationId, orgId))
        : eq(course.isPublished, true)
    )
    .orderBy(desc(course.createdAt));

  // Fetch enrollment counts for all published classes
  const enrollCounts = await db
    .select({ courseId: courseEnrollment.courseId, cnt: count() })
    .from(courseEnrollment)
    .groupBy(courseEnrollment.courseId);
  const enrollMap = Object.fromEntries(enrollCounts.map(e => [e.courseId, Number(e.cnt)]));

  // Server-side filtering
  const filtered = rows.filter(r => {
    if (q && !r.title.toLowerCase().includes(q.toLowerCase()) &&
        !(r.description ?? '').toLowerCase().includes(q.toLowerCase())) return false;
    if (category !== 'All' && r.category !== category) return false;
    if (level !== 'All levels' && r.level?.toLowerCase() !== level.toLowerCase()) return false;
    if (priceFilter === 'free' && (r.price ?? 0) > 0) return false;
    if (priceFilter === 'paid' && (r.price ?? 0) === 0) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function effectivePrice(r: typeof rows[0]) {
    const base = r.price ?? 0;
    if (r.discountActive && (r.discountPercent ?? 0) > 0)
      return Math.round(base * (1 - (r.discountPercent ?? 0) / 100));
    return base;
  }

  function filterUrl(extra: Record<string, string>) {
    const p = new URLSearchParams({
      ...(q ? { q } : {}),
      ...(category !== 'All' ? { category } : {}),
      ...(level !== 'All levels' ? { level } : {}),
      ...(priceFilter !== 'all' ? { price: priceFilter } : {}),
      ...extra,
    });
    const s = p.toString();
    return `/courses${s ? `?${s}` : ''}`;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8F7F4', fontFamily: 'system-ui,sans-serif' }}>
      <style>{`.course-card:hover{box-shadow:0 4px 24px rgba(0,0,0,0.10);transform:translateY(-1px)}.course-card{transition:box-shadow 0.15s,transform 0.15s}`}</style>
      {session?.user ? (
        <LearnNav userName={session.user.name ?? session.user.email} userEmail={session.user.email} />
      ) : (
        <PublicNav activePath="courses" />
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1C1917', marginBottom: 8 }}>
            Browse all courses
          </h1>
          <p style={{ color: '#78716C', fontSize: 15 }}>
            {filtered.length} course{filtered.length !== 1 ? 's' : ''} from Uganda&rsquo;s top creators
          </p>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <form action="/courses" method="GET" style={{ flex: '1 1 260px', display: 'flex', gap: 8 }}>
            {category !== 'All'     && <input type="hidden" name="category" value={category} />}
            {level !== 'All levels' && <input type="hidden" name="level"    value={level}    />}
            {priceFilter !== 'all'  && <input type="hidden" name="price"    value={priceFilter} />}
            <input
              name="q"
              defaultValue={q}
              placeholder="Search courses…"
              style={{ flex: 1, padding: '9px 14px', border: '1px solid #E4E1DA', borderRadius: 8, fontSize: 14, background: '#fff', outline: 'none' }}
            />
            <button type="submit" style={{ padding: '9px 18px', background: '#0B00FF', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              Search
            </button>
          </form>
        </div>

        {/* Category pills + price filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          {CATEGORIES.map(cat => (
            <Link
              key={cat}
              href={filterUrl({ category: cat === 'All' ? '' : cat, page: '1' })}
              style={{
                padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                textDecoration: 'none',
                background: category === cat ? '#0B00FF' : '#fff',
                color:      category === cat ? '#fff' : '#78716C',
                border:     `1px solid ${category === cat ? '#0B00FF' : '#E4E1DA'}`,
              }}
            >{cat}</Link>
          ))}
          <span style={{ width: 1, background: '#E4E1DA', margin: '0 4px' }} />
          {(['all', 'free', 'paid'] as const).map(p => (
            <Link
              key={p}
              href={filterUrl({ price: p === 'all' ? '' : p, page: '1' })}
              style={{
                padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                textDecoration: 'none',
                background: priceFilter === p ? '#1C1917' : '#fff',
                color:      priceFilter === p ? '#fff' : '#78716C',
                border:     `1px solid ${priceFilter === p ? '#1C1917' : '#E4E1DA'}`,
              }}
            >{{ all: 'Any price', free: 'Free', paid: 'Paid' }[p]}</Link>
          ))}
        </div>

        {/* Grid */}
        {paginated.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#A8A29E' }}>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No Classes found</p>
            <p style={{ fontSize: 14 }}>Try a different search or filter.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
            {paginated.map(r => {
              const price   = effectivePrice(r);
              const enrolled = enrollMap[r.id] ?? 0;
              return (
                <Link
                  key={r.id}
                  href={`/course/${r.id}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div className="course-card" style={{
                    background: '#fff', borderRadius: 14, overflow: 'hidden',
                    border: '1px solid #E4E1DA',
                  }}>
                    {/* Thumbnail */}
                    <div style={{ height: 160, background: '#E4E1DA', overflow: 'hidden', position: 'relative' }}>
                      {r.thumbnail ? (
                        <img src={r.thumbnail} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#0B00FF22,#0B00FF44)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                          📚
                        </div>
                      )}
                      {r.level && (
                        <span style={{
                          position: 'absolute', top: 10, left: 10,
                          background: 'rgba(0,0,0,0.65)', color: '#fff',
                          fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                          textTransform: 'capitalize', backdropFilter: 'blur(4px)',
                        }}>{r.level}</span>
                      )}
                      {enrolled > 0 && (
                        <span style={{
                          position: 'absolute', top: 10, right: 10,
                          background: 'rgba(255,255,255,0.92)', color: '#1C1917',
                          fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          👥 {enrolled.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <div style={{ padding: '16px 16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        {r.schoolLogo ? (
                          <img src={r.schoolLogo} alt={r.schoolName} style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 22, height: 22, borderRadius: 4, background: '#0B00FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700 }}>
                            {r.schoolName.charAt(0)}
                          </div>
                        )}
                        <span style={{ fontSize: 12, color: '#78716C', fontWeight: 500 }}>{r.schoolName}</span>
                        {r.category && (
                          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#0B00FF', background: '#EEEEFF', padding: '2px 7px', borderRadius: 6 }}>{r.category}</span>
                        )}
                      </div>

                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1C1917', margin: '0 0 6px', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {r.title}
                      </h3>
                      {r.description && (
                        <p style={{ fontSize: 13, color: '#78716C', margin: '0 0 14px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {r.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          {price === 0 ? (
                            <span style={{ fontSize: 15, fontWeight: 700, color: '#0B00FF' }}>Free</span>
                          ) : (
                            <span style={{ fontSize: 15, fontWeight: 800, color: '#1C1917' }}>
                              UGX {new Intl.NumberFormat('en-UG').format(price)}
                            </span>
                          )}
                          {r.discountActive && (r.discountPercent ?? 0) > 0 && (
                            <span style={{ fontSize: 12, color: '#A8A29E', textDecoration: 'line-through', marginLeft: 6 }}>
                              {new Intl.NumberFormat('en-UG').format(r.price ?? 0)}
                            </span>
                          )}
                        </div>
                        {enrolled > 0 && (
                          <span style={{ fontSize: 12, color: '#A8A29E', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {enrolled.toLocaleString()} enrolled
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 48 }}>
            {page > 1 && (
              <Link href={filterUrl({ page: String(page - 1) })} style={{ padding: '8px 18px', border: '1px solid #E4E1DA', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#1C1917', textDecoration: 'none', background: '#fff' }}>
                ← Prev
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
              <Link
                key={pg}
                href={filterUrl({ page: String(pg) })}
                style={{
                  padding: '8px 14px', border: '1px solid #E4E1DA', borderRadius: 8, fontSize: 14, fontWeight: 600,
                  textDecoration: 'none',
                  background: pg === page ? '#0B00FF' : '#fff',
                  color:      pg === page ? '#fff' : '#1C1917',
                }}
              >
                {pg}
              </Link>
            ))}
            {page < totalPages && (
              <Link href={filterUrl({ page: String(page + 1) })} style={{ padding: '8px 18px', border: '1px solid #E4E1DA', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#1C1917', textDecoration: 'none', background: '#fff' }}>
                Next →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
