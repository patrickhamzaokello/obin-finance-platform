import { redirect } from 'next/navigation';
import { isPlatformOwner } from '@/lib/school-context';
import Link from 'next/link';
import { LayoutDashboard, Building2, LogOut } from 'lucide-react';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const isOwner = await isPlatformOwner();
  if (!isOwner) redirect('/platform/sign-in');

  return (
    <div className='min-h-screen bg-[#f4f7f5] flex'>
      {/* Sidebar */}
      <aside className='w-56 shrink-0 bg-white border-r border-border flex flex-col'>
        <div className='px-5 py-5 border-b border-border'>
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 rounded-full bg-primary' />
            <span className='text-sm font-bold text-foreground'>Platform Admin</span>
          </div>
        </div>
        <nav className='flex-1 px-3 py-4 space-y-1'>
          {[
            { href: '/platform',         label: 'Dashboard',  icon: LayoutDashboard },
            { href: '/platform/schools', label: 'Schools',    icon: Building2 },
          ].map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className='flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors'
            >
              <Icon size={15} /> {label}
            </Link>
          ))}
        </nav>
        <div className='px-3 py-4 border-t border-border'>
          <Link href='/platform/sign-out'
            className='flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors'
          >
            <LogOut size={15} /> Sign out
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className='flex-1 min-w-0'>{children}</main>
    </div>
  );
}
