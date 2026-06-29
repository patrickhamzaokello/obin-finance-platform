import { redirect } from 'next/navigation';
import { isPlatformOwner } from '@/lib/school-context';
import Link from 'next/link';
import { LayoutDashboard, Building2, TrendingUp, LogOut, ClipboardList } from 'lucide-react';
import { db } from '@/lib/db';
import { creatorApplication } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const isOwner = await isPlatformOwner();
  if (!isOwner) redirect('/sign-in');

  // Badge count for pending applications
  const pending = await db.select({ id: creatorApplication.id })
    .from(creatorApplication).where(eq(creatorApplication.status, 'pending'));
  const pendingCount = pending.length;

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
            { href: '/platform/admin',                     label: 'Dashboard',    icon: LayoutDashboard, badge: 0 },
            { href: '/platform/admin/applications',        label: 'Applications', icon: ClipboardList,   badge: pendingCount },
            { href: '/platform/admin/schools',             label: 'Creators',     icon: Building2,       badge: 0 },
            { href: '/platform/admin/revenue',             label: 'Revenue',      icon: TrendingUp,      badge: 0 },
          ].map(({ href, label, icon: Icon, badge }) => (
            <Link key={href} href={href}
              className='flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors'
            >
              <Icon size={14} />
              <span className='flex-1'>{label}</span>
              {badge > 0 && (
                <span className='bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none'>
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
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
