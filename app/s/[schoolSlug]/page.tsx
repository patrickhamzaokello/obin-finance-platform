import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { school, course } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { convertBlobUrlToApiUrl } from '@/lib/blob-url';
import Link from 'next/link';
import { BookOpen, Play, ArrowRight, Link2, Globe, Heart, Check, Star } from 'lucide-react';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

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

  const logoUrl   = (s as any).logoUrl   ? convertBlobUrlToApiUrl((s as any).logoUrl)   : null;
  const bannerUrl = (s as any).bannerUrl ? convertBlobUrlToApiUrl((s as any).bannerUrl) : null;
  const category  = (s as any).category  as string | null;
  const bio       = (s as any).bio       as string | null;

  const socialItems = [
    { icon: Globe, href: social.website,   label: 'Website' },
    { icon: Link2, href: social.twitter,   label: 'Twitter' },
    { icon: Link2, href: social.instagram, label: 'Instagram' },
    { icon: Link2, href: social.youtube,   label: 'YouTube' },
  ].filter((x) => x.href);

  const featured = courses[0] ?? null;
  const rest     = courses.slice(1);

  return (
    <div className='min-h-screen bg-white'>

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <header className='sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]'>
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4'>
          {/* Brand */}
          <div className='flex items-center gap-2.5 min-w-0'>
            {logoUrl
              ? <img src={logoUrl} alt={s.name} className='h-8 w-8 rounded-full object-cover shrink-0' />
              : <div className='w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0'>{s.name[0]}</div>
            }
            <span className='text-sm font-bold text-foreground truncate'>{s.name}</span>
            {category && (
              <span className='hidden sm:inline-flex text-[10px] font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full shrink-0'>{category}</span>
            )}
          </div>

          {/* Center links */}
          <nav className='hidden md:flex items-center gap-1'>
            {[['#courses','Courses'],['#about','About']].map(([href, label]) => (
              <a key={href} href={href} className='px-3.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-black/[0.04] rounded-lg transition-colors'>{label}</a>
            ))}
          </nav>

          {/* Right */}
          <div className='flex items-center gap-2 shrink-0'>
            {session?.user ? (
              <Link href='/dashboard'
                className='inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors'>
                My Learning →
              </Link>
            ) : (
              <>
                <Link href='/sign-in'
                  className='hidden sm:block px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'>
                  Sign in
                </Link>
                <Link href='/sign-up'
                  className='inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors'>
                  <Heart size={13} /> Become a fan
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className='relative'>
        {/* Banner */}
        <div className='w-full h-52 sm:h-72 overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-secondary'>
          {bannerUrl && <img src={bannerUrl} alt='Banner' className='w-full h-full object-cover' />}
        </div>

        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Avatar row */}
          <div className='flex items-end gap-5 -mt-14 mb-6'>
            {logoUrl
              ? <img src={logoUrl} alt={s.name} className='w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white shadow-lg shrink-0' />
              : <div className='w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-primary flex items-center justify-center text-4xl font-bold text-primary-foreground border-4 border-white shadow-lg shrink-0'>{s.name[0]}</div>
            }
            {/* Join CTA inline on desktop */}
            {!session?.user && (
              <div className='hidden sm:flex items-center gap-3 mb-1 ml-auto'>
                <Link href='/sign-up'
                  className='inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm'>
                  <Heart size={14} /> Become a fan
                </Link>
              </div>
            )}
          </div>

          {/* Name + meta */}
          <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8'>
            <div>
              <h1 className='text-2xl sm:text-3xl font-bold text-foreground tracking-tight'>{s.name}</h1>
              <div className='flex flex-wrap items-center gap-2 mt-2'>
                {category && (
                  <span className='text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary rounded-full'>{category}</span>
                )}
                <span className='text-xs text-muted-foreground'>{courses.length} course{courses.length !== 1 ? 's' : ''}</span>
                {courses.filter(c => (c.price ?? 0) === 0).length > 0 && (
                  <span className='text-xs text-muted-foreground'>· {courses.filter(c => (c.price ?? 0) === 0).length} free</span>
                )}
              </div>
            </div>
            {/* Social links */}
            {socialItems.length > 0 && (
              <div className='flex items-center gap-2'>
                {socialItems.map(({ icon: Icon, href, label }) => (
                  <a key={label} href={href} target='_blank' rel='noreferrer' title={label}
                    className='w-9 h-9 flex items-center justify-center rounded-xl border border-black/[0.08] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors'>
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Bio */}
          {bio && (
            <div id='about' className='max-w-2xl mb-10'>
              <p className='text-base text-muted-foreground leading-relaxed'>{bio}</p>
            </div>
          )}
        </div>
      </section>

      {/* ── TRUST STRIP ──────────────────────────────────────────────── */}
      <div className='border-y border-black/[0.06] bg-[#F5F5F7]'>
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-2'>
          {['Expert-led courses', 'Learn at your own pace', 'Certificate on completion', 'Exclusive fan content'].map((item) => (
            <span key={item} className='flex items-center gap-2 text-xs font-medium text-muted-foreground'>
              <Check size={11} className='text-primary' strokeWidth={3} /> {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── COURSES ──────────────────────────────────────────────────── */}
      <section id='courses' className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14'>
        <h2 className='text-xl font-bold text-foreground mb-8'>Courses</h2>

        {courses.length === 0 ? (
          <div className='bg-[#F5F5F7] rounded-2xl py-20 text-center'>
            <BookOpen className='w-10 h-10 mx-auto mb-3 text-muted-foreground/30' />
            <p className='font-semibold text-sm text-foreground'>No courses published yet.</p>
            <p className='text-xs text-muted-foreground mt-1'>Come back soon for exclusive content.</p>
          </div>
        ) : (
          <>
            {/* Featured course — full-width card */}
            {featured && (() => {
              const isFree     = (featured.price ?? 0) === 0;
              const hasDiscount = featured.discountActive && (featured.discountPercent ?? 0) > 0;
              const finalPrice  = hasDiscount
                ? Math.round((featured.price ?? 0) * (1 - (featured.discountPercent ?? 0) / 100))
                : (featured.price ?? 0);
              const thumb = featured.thumbnail ? convertBlobUrlToApiUrl(featured.thumbnail) : null;
              return (
                <div className='bg-[#F5F5F7] rounded-2xl overflow-hidden flex flex-col sm:flex-row mb-6 border border-black/[0.06]'>
                  {/* Thumbnail */}
                  <div className='sm:w-80 shrink-0 aspect-video sm:aspect-auto bg-black overflow-hidden'>
                    {thumb
                      ? <img src={thumb} alt={featured.title} className='w-full h-full object-contain' />
                      : <div className='w-full h-full min-h-[200px] flex items-center justify-center bg-primary/10'><Play className='w-12 h-12 text-primary/30' /></div>
                    }
                  </div>
                  {/* Content */}
                  <div className='flex-1 p-6 sm:p-8 flex flex-col justify-between'>
                    <div>
                      <span className='inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-primary/10 text-primary rounded-full mb-3'>Most popular</span>
                      <h3 className='text-xl font-bold text-foreground leading-snug mb-2'>{featured.title}</h3>
                      {featured.description && (
                        <p className='text-sm text-muted-foreground leading-relaxed line-clamp-3'>{featured.description}</p>
                      )}
                      {featured.instructor && (
                        <p className='text-xs text-muted-foreground mt-3'>By <span className='font-semibold text-foreground'>{featured.instructor}</span></p>
                      )}
                    </div>
                    <div className='flex items-center justify-between mt-6 pt-5 border-t border-black/[0.06]'>
                      <div>
                        {isFree
                          ? <span className='text-lg font-bold text-primary'>Free</span>
                          : (
                            <div className='flex items-baseline gap-2'>
                              <span className='text-lg font-bold text-foreground'>UGX {finalPrice.toLocaleString()}</span>
                              {hasDiscount && <span className='text-xs text-muted-foreground line-through'>UGX {(featured.price ?? 0).toLocaleString()}</span>}
                            </div>
                          )
                        }
                        <p className='text-[10px] text-muted-foreground mt-0.5'>One-time</p>
                      </div>
                      <Link href={`/course/${featured.id}`}
                        className='inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors'>
                        Enroll now →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Rest of courses — grid */}
            {rest.length > 0 && (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
                {rest.map((c) => {
                  const isFree     = (c.price ?? 0) === 0;
                  const hasDiscount = c.discountActive && (c.discountPercent ?? 0) > 0;
                  const finalPrice  = hasDiscount
                    ? Math.round((c.price ?? 0) * (1 - (c.discountPercent ?? 0) / 100))
                    : (c.price ?? 0);
                  return (
                    <Link key={c.id} href={`/course/${c.id}`}
                      className='group bg-white rounded-2xl border border-black/[0.06] overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col'>
                      <div className='aspect-video bg-black overflow-hidden'>
                        {c.thumbnail
                          ? <img src={convertBlobUrlToApiUrl(c.thumbnail)} alt={c.title} className='w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-300' />
                          : <div className='w-full h-full bg-primary/8 flex items-center justify-center'><Play className='w-8 h-8 text-primary/30' /></div>
                        }
                      </div>
                      <div className='p-5 flex-1 flex flex-col'>
                        <h3 className='font-semibold text-sm text-foreground leading-snug mb-1 group-hover:text-primary transition-colors'>{c.title}</h3>
                        {c.description && <p className='text-xs text-muted-foreground line-clamp-2 flex-1'>{c.description}</p>}
                        <div className='mt-4 flex items-center justify-between pt-3 border-t border-black/[0.04]'>
                          {isFree
                            ? <span className='text-sm font-bold text-primary'>Free</span>
                            : (
                              <div className='flex items-center gap-1.5'>
                                <span className='text-sm font-bold text-foreground'>UGX {finalPrice.toLocaleString()}</span>
                                {hasDiscount && <span className='text-xs text-muted-foreground line-through'>UGX {(c.price ?? 0).toLocaleString()}</span>}
                              </div>
                            )
                          }
                          <span className='text-xs font-semibold text-primary flex items-center gap-1 group-hover:gap-2 transition-all'>View <ArrowRight size={11} /></span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────── */}
      {!session?.user && (
        <section className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16'>
          <div className='bg-primary rounded-2xl px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-primary-foreground'>
            <div>
              <h2 className='text-lg font-bold'>Join {s.name}&apos;s community</h2>
              <p className='text-sm text-primary-foreground/75 mt-1'>Get access to exclusive courses and earn certificates</p>
            </div>
            <Link href='/sign-up'
              className='shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-white text-primary text-sm font-bold rounded-xl hover:bg-white/90 transition-colors'>
              <Heart size={14} /> Become a fan — it&apos;s free
            </Link>
          </div>
        </section>
      )}

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className='border-t border-black/[0.06] py-8'>
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4'>
          <div className='flex items-center gap-2.5'>
            {logoUrl
              ? <img src={logoUrl} alt={s.name} className='w-6 h-6 rounded-full object-cover' />
              : <div className='w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground'>{s.name[0]}</div>
            }
            <span className='text-sm font-semibold text-foreground'>{s.name}</span>
          </div>
          {socialItems.length > 0 && (
            <div className='flex items-center gap-4'>
              {socialItems.map(({ href, label }) => (
                <a key={label} href={href} target='_blank' rel='noreferrer'
                  className='text-xs font-medium text-muted-foreground hover:text-foreground transition-colors'>{label}</a>
              ))}
            </div>
          )}
          <p className='text-xs text-muted-foreground'>© {new Date().getFullYear()} {s.name}</p>
        </div>
      </footer>

    </div>
  );
}
