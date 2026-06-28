'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { LayoutDashboard, BookOpen, Users, LogOut } from 'lucide-react';

interface AdminNavProps {
  schoolName: string;
  userName: string;
  userEmail: string;
  role: string;
}

export function AdminNav({ schoolName, userName, userEmail, role }: AdminNavProps) {
  const pathname = usePathname();

  const links = [
    { href: '/admin',         label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/courses', label: 'Courses',   icon: BookOpen },
    { href: '/admin/users',   label: 'Members',   icon: Users },
  ];

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' || pathname.endsWith('/admin')
    : pathname.includes(href);

  const initials = userName
    ? userName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : (userEmail?.[0] ?? 'U').toUpperCase();

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = '/sign-in';
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* School name */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
              {schoolName?.[0]?.toUpperCase() ?? 'S'}
            </div>
            <span className="text-sm font-semibold text-foreground tracking-tight">{schoolName}</span>
          </div>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-0.5">
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

          {/* User info + sign out */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                {initials}
              </div>
              <div className="text-right leading-tight">
                <p className="text-xs font-semibold text-foreground">{userName || userEmail}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{role}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-black/[0.04] transition-all duration-150"
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
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
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
