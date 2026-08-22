'use client';

import { useState, useRef, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { LogOut, User, LayoutDashboard, Settings } from 'lucide-react';
import Link from 'next/link';

interface UserMenuProps {
  name: string;
  email: string;
  dashboardHref: string;
  dashboardLabel: string;
}

export function UserMenu({ name, email, dashboardHref, dashboardLabel }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : (email?.[0] ?? 'U').toUpperCase();

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = '/sign-in';
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-black/[0.04] transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[11px] font-bold text-primary-foreground shrink-0">
          {initials}
        </div>
        <div className="hidden sm:block text-left leading-tight">
          <p className="text-xs font-semibold text-foreground max-w-[120px] truncate">{name || email}</p>
          <p className="text-[10px] text-muted-foreground max-w-[120px] truncate">{email}</p>
        </div>
        <svg className={`w-3 h-3 text-muted-foreground transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-black/[0.06] py-1.5 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-black/[0.06]">
            <p className="text-xs font-semibold text-foreground truncate">{name || 'Account'}</p>
            <p className="text-[11px] text-muted-foreground truncate">{email}</p>
          </div>

          {/* Items */}
          <div className="py-1">
            <Link
              href={dashboardHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-black/[0.04] transition-colors"
            >
              <LayoutDashboard size={14} className="text-muted-foreground" />
              {dashboardLabel}
            </Link>
          </div>

          <div className="border-t border-black/[0.06] py-1">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-black/[0.04] transition-colors text-left"
            >
              <LogOut size={14} className="text-muted-foreground" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
