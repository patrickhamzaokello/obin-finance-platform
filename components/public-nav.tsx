import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { isPlatformOwner, getCurrentMembership } from '@/lib/school-context';
import Link from 'next/link';
import { BookOpen, Play, Users } from 'lucide-react';
import { UserMenu } from '@/components/user-menu';

/**
 * Server-rendered nav for public pages (/courses, /course/[id], etc.)
 * Detects session and shows appropriate CTAs.
 */
export async function PublicNav({ activePath }: { activePath?: 'courses' | 'creators' }) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user ?? null;

  let dashboardHref = '/learn/dashboard';
  let dashboardLabel = 'My Learning';

  if (user) {
    const [isOwner, membership] = await Promise.all([
      isPlatformOwner(),
      getCurrentMembership(),
    ]);
    if (isOwner) { dashboardHref = '/admin'; dashboardLabel = 'Admin'; }
    else if (membership?.role === 'school_admin') { dashboardHref = '/studio'; dashboardLabel = 'Studio'; }
  }

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-black/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 mr-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Play size={13} fill="white" color="white" />
            </div>
            <span className="font-extrabold text-base text-foreground tracking-tight">ObinAcademy</span>
          </Link>

          {/* Centre links */}
          <nav className="hidden sm:flex items-center gap-0.5 flex-1">
            <Link
              href="/courses"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activePath === 'courses'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-black/[0.04]'
              }`}
            >
              <BookOpen size={13} /> Courses
            </Link>
            <Link
              href="/learn/creators"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activePath === 'creators'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-black/[0.04]'
              }`}
            >
              <Users size={13} /> Creators
            </Link>
          </nav>

          {/* Right CTAs */}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {user ? (
              <UserMenu
                name={user.name ?? ''}
                email={user.email ?? ''}
                dashboardHref={dashboardHref}
                dashboardLabel={dashboardLabel}
              />
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile nav strip */}
        <div className="sm:hidden flex gap-1 pb-2">
          <Link href="/courses" className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activePath === 'courses' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
            <BookOpen size={12} /> Courses
          </Link>
          <Link href="/learn/creators" className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activePath === 'creators' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
            <Users size={12} /> Creators
          </Link>
        </div>
      </div>
    </header>
  );
}
