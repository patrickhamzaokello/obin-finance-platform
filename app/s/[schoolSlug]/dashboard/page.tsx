import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = { title: 'My Dashboard' }
import { getPublishedCourses, getUserEnrolledCourses, joinSchool } from '@/app/actions/courses';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getCurrentSchool, getCurrentMembership } from '@/lib/school-context';
import { BookOpen, ChevronRight, LayoutDashboard, Award, MessageCircle } from 'lucide-react';
import { SignOutButton } from '@/components/sign-out-button';

export default async function Dashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/sign-in');

  const [s, membership, allCoursesResult, enrolledCoursesResult] = await Promise.all([
    getCurrentSchool(),
    getCurrentMembership(),
    getPublishedCourses(),
    getUserEnrolledCourses(),
    joinSchool(), // upsert schoolMember row for users who signed up before this fix
  ]);

  const allCourses      = allCoursesResult.success     ? allCoursesResult.data     : [];
  const enrolledCourses = enrolledCoursesResult.success ? enrolledCoursesResult.data : [];
  const enrolledIds     = new Set(enrolledCourses.map((c: any) => c.id));
  const available       = allCourses.filter((c: any) => !enrolledIds.has(c.id));

  const isAdmin    = membership?.role === 'school_admin';
  const schoolName = s?.name ?? 'Learning Platform';
  const userName   = session.user.name || session.user.email || '';
  const initials   = session.user.name
    ? session.user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : (session.user.email?.[0] ?? 'U').toUpperCase();

  return (
    <div className="min-h-screen bg-[#F5F5F7]">

      {/* Top nav */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                {schoolName[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-foreground">{schoolName}</span>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/achievements"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-black/[0.04] transition-all"
              >
                <Award size={13} /> Achievements
              </Link>
              <Link href="/contact"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-black/[0.04] transition-all"
              >
                <MessageCircle size={13} /> Contact
              </Link>
              {isAdmin && (
                <Link href="/admin"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-black/[0.04] transition-all"
                >
                  <LayoutDashboard size={13} /> Admin Panel
                </Link>
              )}
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                  {initials}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-semibold text-foreground">{userName}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{isAdmin ? 'Creator' : 'Fan'}</p>
                </div>
              </div>
              <SignOutButton className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-black/[0.04] transition-all" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        {/* My Courses */}
        {enrolledCourses.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground tracking-tight">My Courses</h2>
              <span className="text-xs text-muted-foreground">{enrolledCourses.length} enrolled</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {enrolledCourses.map((c: any) => {
                const total     = c.moduleCount          ?? 0;
                const done      = c.completedModuleCount ?? 0;
                const pct       = total > 0 ? Math.round((done / total) * 100) : 0;
                const isComplete = total > 0 && done >= total;
                return (
                  <Link href={`/learning/${c.id}`} key={c.id}>
                    <div className="group bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 h-full flex flex-col cursor-pointer">
                      <div className="relative h-44 bg-secondary overflow-hidden">
                        {c.thumbnail
                          ? <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                          : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-border" /></div>
                        }
                        <div className="absolute top-3 left-3">
                          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${isComplete ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground'}`}>
                            {isComplete ? 'Completed' : 'In Progress'}
                          </span>
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-semibold text-foreground leading-snug mb-2">{c.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{c.description}</p>
                        {total > 0 && (
                          <div className="mt-4 space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{done} of {total} module{total !== 1 ? 's' : ''} complete</span>
                              <span className="font-semibold text-primary">{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )}
                        <div className="mt-4 flex items-center justify-between text-sm">
                          <span className="font-semibold text-primary">{isComplete ? 'Review Course' : 'Continue Learning'}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Available Courses */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              {enrolledCourses.length > 0 ? 'Explore More' : 'Available Courses'}
            </h2>
            {available.length > 0 && (
              <span className="text-xs text-muted-foreground">{available.length} available</span>
            )}
          </div>

          {allCourses.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <BookOpen className="w-8 h-8 text-border mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No courses available yet. Check back soon.</p>
            </div>
          ) : available.length === 0 && enrolledCourses.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <p className="text-sm font-semibold text-foreground mb-1">You're enrolled in all available courses.</p>
              <p className="text-sm text-muted-foreground">New courses are added regularly — check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {available.map((c: any) => {
                const price           = c.price ?? 0;
                const hasDiscount     = c.discountActive && (c.discountPercent ?? 0) > 0;
                const discountedPrice = hasDiscount ? Math.round(price * (1 - (c.discountPercent ?? 0) / 100)) : price;
                const isFree          = price === 0;
                return (
                  <Link href={`/course/${c.id}`} key={c.id}>
                    <div className="group bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 h-full flex flex-col cursor-pointer">
                      <div className="relative h-44 bg-secondary overflow-hidden">
                        {c.thumbnail
                          ? <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                          : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-border" /></div>
                        }
                        {hasDiscount && (
                          <div className="absolute top-3 right-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
                              -{c.discountPercent}%
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-semibold text-foreground leading-snug mb-1">{c.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{c.description}</p>
                        {c.instructor && <p className="text-xs text-muted-foreground mt-2">By {c.instructor}</p>}
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isFree ? (
                              <span className="text-sm font-bold text-primary">Free</span>
                            ) : (
                              <>
                                <span className="text-sm font-bold text-foreground">UGX {discountedPrice.toLocaleString()}</span>
                                {hasDiscount && (
                                  <span className="text-xs text-muted-foreground line-through">UGX {price.toLocaleString()}</span>
                                )}
                              </>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
