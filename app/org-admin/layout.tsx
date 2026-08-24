import { redirect } from 'next/navigation';
import { isPlatformAdminOrOwner, isOrgAdmin, getOrgAdminOrganization } from '@/lib/school-context';
import Link from 'next/link';
import { LayoutDashboard, Building2, TrendingUp, ClipboardList, Globe, Wallet } from 'lucide-react';
import { SignOutButton } from '@/components/sign-out-button';

export default async function OrgAdminLayout({ children }: { children: React.ReactNode }) {
  const allowed = await isPlatformAdminOrOwner();
  if (!allowed) redirect('/sign-in');

  // Platform owners shouldn't be using this portal
  const orgAdmin = await isOrgAdmin();
  if (!orgAdmin) redirect('/admin');

  const org = await getOrgAdminOrganization();
  const orgName = org?.name ?? 'Organization';

  return (
    <div className='min-h-screen bg-[#F5F5F7] flex'>
      {/* Sidebar */}
      <aside className='w-56 shrink-0 bg-white border-r border-black/[0.06] flex flex-col'>
        <div className='px-5 py-5 border-b border-black/[0.06]'>
          <div className='flex items-center gap-2.5'>
            <div className='w-6 h-6 rounded-lg bg-primary flex items-center justify-center'>
              <Globe size={12} className='text-white' />
            </div>
            <div className='min-w-0'>
              <p className='text-xs font-bold text-foreground truncate'>{orgName}</p>
              <p className='text-[10px] text-muted-foreground'>Org Admin</p>
            </div>
          </div>
        </div>

        <nav className='flex-1 px-3 py-4 space-y-0.5'>
          {[
            { href: '/org-admin',              label: 'Dashboard',    icon: LayoutDashboard },
            { href: '/org-admin/creators',     label: 'Creators',     icon: Building2       },
            { href: '/org-admin/applications', label: 'Applications', icon: ClipboardList   },
            { href: '/org-admin/revenue',      label: 'Revenue',      icon: TrendingUp      },
            { href: '/org-admin/withdrawals', label: 'Withdrawals',  icon: Wallet          },
          ].map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className='flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors'>
              <Icon size={14} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className='px-3 py-4 border-t border-black/[0.06]'>
          <SignOutButton className='flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors w-full' />
        </div>
      </aside>

      {/* Main */}
      <main className='flex-1 min-w-0'>{children}</main>
    </div>
  );
}
