'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Trophy, LayoutDashboard, Users } from 'lucide-react';
import { UserMenu } from '@/components/user-menu';

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

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-black/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          <Link href="/learn/dashboard" className="font-extrabold text-base text-primary tracking-tight shrink-0">
            ObinAcademy
          </Link>

          <nav className="hidden sm:flex items-center gap-0.5 flex-1 justify-center">
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

          <div className="shrink-0">
            <UserMenu
              name={userName}
              email={userEmail}
              dashboardHref="/learn/dashboard"
              dashboardLabel="My Learning"
            />
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
