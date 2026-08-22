import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Browse Creators' };

import { db } from '@/lib/db';
import { school, course, courseEnrollment } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import Link from 'next/link';
import { convertBlobUrlToApiUrl } from '@/lib/blob-url';
import { BookOpen, Users, Search } from 'lucide-react';

const CATEGORIES = ['All', 'Finance', 'Tech', 'Fitness', 'Business', 'Cooking', 'Music', 'Art', 'Education', 'Lifestyle', 'Other'];
const PAGE_SIZE  = 12;

interface Props {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}

export default async function BrowseCreators({ searchParams }: Props) {
  const params   = await searchParams;
  const q        = params.q?.trim() ?? '';
  const category = params.category ?? 'All';
  const page     = Math.max(1, parseInt(params.page ?? '1', 10));

  const creators = await db
    .select({
      id:        school.id,
      slug:      school.slug,
      name:      school.name,
      logoUrl:   school.logoUrl,
      bannerUrl: school.bannerUrl,
      bio:       school.bio,
      category:  school.category,
      tagline:   school.tagline,
    })
    .from(school)
    .orderBy(school.name);

  // Per-school published course counts
  const courseCounts = await db
    .select({ schoolId: course.schoolId, cnt: count() })
    .from(course)
    .where(eq(course.isPublished, true))
    .groupBy(course.schoolId);
  const courseCountMap = Object.fromEntries(courseCounts.map(r => [r.schoolId, Number(r.cnt)]));

  // Per-school total enrolled learners (via course join)
  const enrollCounts = await db
    .select({ schoolId: course.schoolId, cnt: count() })
    .from(courseEnrollment)
    .innerJoin(course, eq(courseEnrollment.courseId, course.id))
    .groupBy(course.schoolId);
  const enrollMap = Object.fromEntries(enrollCounts.map(r => [r.schoolId, Number(r.cnt)]));

  // Filter — only creators with ≥1 published course
  const filtered = creators.filter((c) => {
    if (!courseCountMap[c.id]) return false;
    if (q && !c.name.toLowerCase().includes(q.toLowerCase()) &&
        !(c.bio ?? '').toLowerCase().includes(q.toLowerCase()) &&
        !(c.tagline ?? '').toLowerCase().includes(q.toLowerCase())) return false;
    if (category !== 'All' && c.category !== category) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function filterUrl(extra: Record<string, string>) {
    const p = new URLSearchParams({
      ...(q ? { q } : {}),
      ...(category !== 'All' ? { category } : {}),
      ...extra,
    });
    const s = p.toString();
    return `/learn/creators${s ? `?${s}` : ''}`;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Browse Creators</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {filtered.length} creator{filtered.length !== 1 ? 's' : ''} on ObinAcademy
        </p>
      </div>

      {/* Search */}
      <form action="/learn/creators" method="GET" className="flex gap-2">
        {category !== 'All' && <input type="hidden" name="category" value={category} />}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search creators…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-black/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
        >
          Search
        </button>
      </form>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={filterUrl({ category: cat === 'All' ? '' : cat, page: '1' })}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              category === cat
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-white text-muted-foreground border-black/[0.08] hover:border-primary/30 hover:text-foreground'
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* Grid */}
      {paginated.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
          <Users className="w-8 h-8 text-border mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No creators found. Try a different search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginated.map((creator) => {
            const numCourses  = courseCountMap[creator.id] ?? 0;
            const numLearners = enrollMap[creator.id] ?? 0;
            const logo   = creator.logoUrl   ? convertBlobUrlToApiUrl(creator.logoUrl)   : null;
            const banner = creator.bannerUrl ? convertBlobUrlToApiUrl(creator.bannerUrl) : null;

            return (
              <Link
                key={creator.id}
                href={`/creator/${creator.slug}`}
                className="group bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col"
              >
                {/* Banner */}
                <div className="h-28 overflow-hidden relative">
                  {banner ? (
                    <img src={banner} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full" style={{
                      background: `linear-gradient(135deg, hsl(${(creator.name.charCodeAt(0) * 7) % 360},60%,80%), hsl(${(creator.name.charCodeAt(0) * 7 + 60) % 360},60%,90%))`,
                    }} />
                  )}
                  {/* Logo */}
                  <div className="absolute -bottom-6 left-4">
                    {logo ? (
                      <img src={logo} alt={creator.name} className="w-12 h-12 rounded-xl border-2 border-white object-cover shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl border-2 border-white bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">
                        {creator.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="pt-8 px-4 pb-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-sm font-bold text-foreground leading-tight">{creator.name}</h3>
                    {creator.category && (
                      <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {creator.category}
                      </span>
                    )}
                  </div>

                  {(creator.tagline || creator.bio) && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
                      {creator.tagline ?? creator.bio}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-auto">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <BookOpen size={11} /> {numCourses} course{numCourses !== 1 ? 's' : ''}
                    </span>
                    {numLearners > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Users size={11} /> {numLearners.toLocaleString()} learner{numLearners !== 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="ml-auto text-xs font-semibold text-primary group-hover:underline">
                      View →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          {page > 1 && (
            <Link href={filterUrl({ page: String(page - 1) })} className="px-4 py-2 text-sm font-semibold border border-black/[0.08] rounded-xl bg-white hover:bg-black/[0.02] transition-colors">
              ← Prev
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
            <Link
              key={pg}
              href={filterUrl({ page: String(pg) })}
              className={`px-3.5 py-2 text-sm font-semibold border rounded-xl transition-colors ${
                pg === page ? 'bg-primary text-primary-foreground border-primary' : 'bg-white border-black/[0.08] hover:bg-black/[0.02]'
              }`}
            >
              {pg}
            </Link>
          ))}
          {page < totalPages && (
            <Link href={filterUrl({ page: String(page + 1) })} className="px-4 py-2 text-sm font-semibold border border-black/[0.08] rounded-xl bg-white hover:bg-black/[0.02] transition-colors">
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
