import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getPublishedCourses, getUserEnrolledCourses } from '@/app/actions/courses';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getCurrentSchool, getCurrentMembership } from '@/lib/school-context';
import { authClient } from '@/lib/auth-client';
import { BookOpen, ChevronRight, LayoutDashboard, LogOut } from 'lucide-react';
import { SignOutButton } from '@/components/sign-out-button';

export default async function Dashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/sign-in');

  const [s, membership, allCoursesResult, enrolledCoursesResult] = await Promise.all([
    getCurrentSchool(),
    getCurrentMembership(),
    getPublishedCourses(),
    getUserEnrolledCourses(),
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
                  <p className="text-[10px] text-muted-foreground capitalize">{isAdmin ? 'Admin' : 'Learner'}</p>
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
              {enrolledCourses.map((c: any) => (
                <Link href={`/learning/${c.id}`} key={c.id}>
                  <div className="group bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 h-full flex flex-col cursor-pointer">
                    <div className="relative h-44 bg-secondary overflow-hidden">
                      {c.thumbnail
                        ? <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-border" /></div>
                      }
                      <div className="absolute top-3 left-3">
                        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
                          In Progress
                        </span>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-semibold text-foreground leading-snug mb-2">{c.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{c.description}</p>
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="font-semibold text-primary">Continue Learning</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
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
              {available.map((c: any) => (
                <Link href={`/course/${c.id}`} key={c.id}>
                  <div className="group bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 h-full flex flex-col cursor-pointer">
                    <div className="h-44 bg-secondary overflow-hidden">
                      {c.thumbnail
                        ? <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-border" /></div>
                      }
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-semibold text-foreground leading-snug mb-2">{c.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{c.description}</p>
                      {c.instructor && <p className="text-xs text-muted-foreground mt-2">By {c.instructor}</p>}
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="font-semibold text-primary">View Course</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
