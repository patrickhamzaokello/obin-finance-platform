'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { BookOpen, Trophy, LayoutDashboard, LogOut, Users } from 'lucide-react';

export default function LearnNav({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const pathname = usePathname();

  const links = [
    { href: '/learn/dashboard',    label: 'My Learning',  icon: LayoutDashboard },
    { href: '/courses',            label: 'Courses',      icon: BookOpen },
    { href: '/learn/creators',     label: 'Creators',     icon: Users },
    { href: '/learn/achievements', label: 'Achievements', icon: Trophy },
  ];

  const initials = userName
    ? userName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : (userEmail?.[0] ?? 'U').toUpperCase();

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = '/sign-in';
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-black/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          <Link href="/learn/dashboard" className="font-extrabold text-base text-primary tracking-tight">
            Pkasemer
          </Link>

          <nav className="hidden sm:flex items-center gap-0.5">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  pathname === href || pathname.startsWith(href + '/')
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-black/[0.04]'
                }`}
              >
                <Icon size={13} />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                {initials}
              </div>
              <span className="text-xs font-medium text-foreground">{userName || userEmail}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-black/[0.04] transition-all"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="sm:hidden flex gap-0.5 pb-2 overflow-x-auto">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                pathname === href ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={12} /> {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
