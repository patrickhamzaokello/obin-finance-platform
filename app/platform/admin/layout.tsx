import { redirect } from 'next/navigation';
import { isPlatformOwner } from '@/lib/school-context';
import Link from 'next/link';
import { LayoutDashboard, Building2, LogOut } from 'lucide-react';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const isOwner = await isPlatformOwner();
  if (!isOwner) redirect('/sign-in');

  return (
    <div className='min-h-screen bg-[#F5F5F7] flex'>
      {/* Sidebar */}
      <aside className='w-56 shrink-0 bg-white border-r border-black/[0.06] flex flex-col'>
        <div className='px-5 py-5 border-b border-black/[0.06]'>
          <div className='flex items-center gap-2.5'>
            <div className='w-6 h-6 rounded-lg bg-primary flex items-center justify-center'>
              <LayoutDashboard size={12} className='text-white' />
            </div>
            <span className='text-sm font-bold text-foreground'>Platform Admin</span>
          </div>
        </div>
        <nav className='flex-1 px-3 py-4 space-y-0.5'>
          {[
            { href: '/platform/admin',         label: 'Dashboard',  icon: LayoutDashboard },
            { href: '/platform/admin/schools', label: 'Schools',    icon: Building2 },
          ].map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className='flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors'
            >
              <Icon size={14} /> {label}
            </Link>
          ))}
        </nav>
        <div className='px-3 py-4 border-t border-black/[0.06]'>
          <Link href='/platform/sign-out'
            className='flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors'
          >
            <LogOut size={14} /> Sign out
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className='flex-1 min-w-0'>{children}</main>
    </div>
  );
}
