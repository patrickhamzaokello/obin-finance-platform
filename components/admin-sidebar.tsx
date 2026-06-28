'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, BookOpen, Users, PanelLeftClose, PanelLeft, Home } from 'lucide-react';

const menuItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Courses',   href: '/admin/courses', icon: BookOpen },
  { label: 'Users',     href: '/admin/users', icon: Users },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => pathname === href || (href !== '/admin' && pathname.startsWith(href));

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-56'} bg-white border-r border-border min-h-screen flex flex-col transition-all duration-200`}
    >
      {/* Logo row */}
      <div className='flex items-center justify-between px-4 py-5 border-b border-border'>
        {!collapsed && (
          <span className='text-sm font-bold text-primary tracking-tight'>Obin Admin</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className='p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors'
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className='flex-1 px-2 py-4 space-y-0.5'>
        {menuItems.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Icon size={16} className='shrink-0' />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className='px-2 py-4 border-t border-border'>
        <Link
          href='/'
          className='flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors'
        >
          <Home size={16} className='shrink-0' />
          {!collapsed && <span>Back to App</span>}
        </Link>
      </div>
    </aside>
  );
}
