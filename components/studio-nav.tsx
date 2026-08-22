'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpen, Users, MessageCircle, UserCircle } from 'lucide-react';
import { UserMenu } from '@/components/user-menu';

interface StudioNavProps {
  schoolName: string;
  userName: string;
  userEmail: string;
  role: string;
}

export function StudioNav({ schoolName, userName, userEmail, role }: StudioNavProps) {
  const pathname = usePathname();

  const links = [
    { href: '/studio',          label: 'Studio',    icon: LayoutDashboard },
    { href: '/studio/courses',  label: 'Courses',   icon: BookOpen },
    { href: '/studio/learners', label: 'Learners',  icon: Users },
    { href: '/studio/messages', label: 'Feedback',  icon: MessageCircle },
    { href: '/studio/profile',  label: 'Profile',   icon: UserCircle },
  ];

  const isActive = (href: string) =>
    href === '/studio'
      ? pathname === '/studio'
      : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
              {schoolName?.[0]?.toUpperCase() ?? 'S'}
            </div>
            <div className="leading-tight">
              <p className="text-xs font-bold text-foreground tracking-tight">{schoolName}</p>
              <p className="text-[10px] text-muted-foreground">Creator Studio</p>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-0.5 flex-1 justify-center">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive(href)
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
              dashboardHref="/studio"
              dashboardLabel="Creator Studio"
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
                isActive(href)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-black/[0.04]'
              }`}
            >
              <Icon size={12} />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
