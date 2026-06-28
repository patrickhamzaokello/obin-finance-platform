import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { school, course } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { convertBlobUrlToApiUrl } from '@/lib/blob-url';
import Link from 'next/link';
import { BookOpen, Play, ArrowRight, Link2, Globe, Heart } from 'lucide-react';
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

  return (
    <div className='min-h-screen bg-[#F5F5F7]'>

      {/* Top nav */}
      <header className='sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]'>
        <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between'>
          <div className='flex items-center gap-2.5'>
            {logoUrl
              ? <img src={logoUrl} alt={s.name} className='h-7 w-7 rounded-full object-cover' />
              : <div className='w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[11px] font-bold text-primary-foreground'>{s.name[0]}</div>
            }
            <span className='text-sm font-bold text-foreground'>{s.name}</span>
            {category && (
              <span className='hidden sm:inline-flex text-[10px] font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full'>{category}</span>
            )}
          </div>
          <div className='flex items-center gap-2'>
            {session?.user ? (
              <Link href='/dashboard'
                className='inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors'>
                My Learning
              </Link>
            ) : (
              <>
                <Link href='/sign-in'
                  className='px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'>
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

      {/* Banner + avatar */}
      <div className='relative'>
        {bannerUrl ? (
          <div className='w-full h-48 sm:h-64 overflow-hidden bg-secondary'>
            <img src={bannerUrl} alt='Banner' className='w-full h-full object-cover' />
          </div>
        ) : (
          <div className='w-full h-48 sm:h-64 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5' />
        )}

        {/* Avatar overlapping banner */}
        <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='relative -mt-12 pb-6 flex items-end gap-5'>
            {logoUrl ? (
              <img src={logoUrl} alt={s.name}
                className='w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg shrink-0' />
            ) : (
              <div className='w-24 h-24 rounded-2xl bg-primary flex items-center justify-center text-4xl font-bold text-primary-foreground border-4 border-white shadow-lg shrink-0'>
                {s.name[0]}
              </div>
            )}
            <div className='pb-1'>
              <h1 className='text-2xl font-bold text-foreground'>{s.name}</h1>
              {category && (
                <span className='inline-flex text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary rounded-full mt-1'>{category}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-10'>

        {/* Bio + social */}
        {(bio || socialItems.length > 0) && (
          <div className='bg-white rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row gap-6'>
            {bio && (
              <p className='flex-1 text-sm text-muted-foreground leading-relaxed'>{bio}</p>
            )}
            {socialItems.length > 0 && (
              <div className='flex sm:flex-col gap-2 shrink-0'>
                {socialItems.map(({ icon: Icon, href, label }) => (
                  <a key={label} href={href} target='_blank' rel='noreferrer'
                    className='inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-black/[0.08] text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors'>
                    <Icon size={13} /> <span className='hidden sm:inline'>{label}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className='grid grid-cols-3 gap-4'>
          {[
            { label: 'Courses', value: courses.length },
            { label: 'Published', value: courses.filter((c) => c.isPublished).length },
            { label: 'Free', value: courses.filter((c) => (c.price ?? 0) === 0).length },
          ].map(({ label, value }) => (
            <div key={label} className='bg-white rounded-2xl shadow-sm p-5 text-center'>
              <p className='text-2xl font-bold text-foreground'>{value}</p>
              <p className='text-xs text-muted-foreground mt-0.5'>{label}</p>
            </div>
          ))}
        </div>

        {/* Courses */}
        <div id='courses'>
          <h2 className='text-xl font-bold text-foreground mb-6'>Courses</h2>

          {courses.length === 0 ? (
            <div className='bg-white rounded-2xl shadow-sm py-16 text-center text-muted-foreground'>
              <BookOpen className='w-10 h-10 mx-auto mb-3 opacity-30' />
              <p className='font-medium text-sm'>No courses published yet.</p>
              <p className='text-xs mt-1'>Come back soon for exclusive content.</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
              {courses.map((c) => {
                const isFree    = (c.price ?? 0) === 0;
                const hasDiscount = c.discountActive && (c.discountPercent ?? 0) > 0;
                const finalPrice  = hasDiscount
                  ? Math.round((c.price ?? 0) * (1 - (c.discountPercent ?? 0) / 100))
                  : (c.price ?? 0);
                return (
                  <Link key={c.id} href={`/course/${c.id}`}
                    className='group bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col'>
                    {c.thumbnail ? (
                      <div className='aspect-video overflow-hidden bg-black'>
                        <img src={convertBlobUrlToApiUrl(c.thumbnail)} alt={c.title}
                          className='w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-300' />
                      </div>
                    ) : (
                      <div className='aspect-video bg-primary/8 flex items-center justify-center'>
                        <Play className='w-10 h-10 text-primary/30' />
                      </div>
                    )}
                    <div className='p-5 flex-1 flex flex-col'>
                      <h3 className='font-semibold text-foreground leading-snug group-hover:text-primary transition-colors mb-1'>{c.title}</h3>
                      {c.description && (
                        <p className='text-xs text-muted-foreground line-clamp-2 flex-1'>{c.description}</p>
                      )}
                      <div className='mt-4 flex items-center justify-between'>
                        {isFree ? (
                          <span className='text-sm font-bold text-primary'>Free</span>
                        ) : (
                          <div className='flex items-center gap-1.5'>
                            <span className='text-sm font-bold text-foreground'>UGX {finalPrice.toLocaleString()}</span>
                            {hasDiscount && (
                              <span className='text-xs text-muted-foreground line-through'>UGX {(c.price ?? 0).toLocaleString()}</span>
                            )}
                          </div>
                        )}
                        <span className='inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all'>
                          View <ArrowRight size={11} />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA if not signed in */}
        {!session?.user && (
          <div className='bg-primary rounded-2xl p-8 text-center text-primary-foreground'>
            <h2 className='text-xl font-bold mb-2'>Join {s.name}&apos;s community</h2>
            <p className='text-sm text-primary-foreground/80 mb-6'>Get access to exclusive courses and earn certificates</p>
            <Link href='/sign-up'
              className='inline-flex items-center gap-2 px-6 py-3 bg-white text-primary text-sm font-bold rounded-xl hover:bg-white/90 transition-colors'>
              <Heart size={15} /> Become a fan — it&apos;s free
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
