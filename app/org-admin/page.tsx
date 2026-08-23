import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Org Dashboard' };

import { getOrgDashboard } from '@/app/actions/org-admin';
import { Building2, Users, BookOpen, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function OrgDashboardPage() {
  const result = await getOrgDashboard();
  if (!result.success) return <div className='px-8 py-8 text-sm text-destructive'>{result.error}</div>;

  const { org, creators, courses, enrollments, revenue } = result.data!;

  const stats = [
    { label: 'Creators',    value: creators,                              icon: Building2,  color: 'bg-blue-50 text-blue-600'   },
    { label: 'Classes',     value: courses,                               icon: BookOpen,   color: 'bg-orange-50 text-orange-600'},
    { label: 'Enrollments', value: enrollments,                           icon: Users,      color: 'bg-purple-50 text-purple-600'},
    { label: 'Total Revenue',value: `UGX ${revenue.toLocaleString()}`,   icon: TrendingUp, color: 'bg-green-50 text-green-600'  },
  ];

  return (
    <div className='px-8 py-8 space-y-8'>
      <div>
        <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1'>Organization</p>
        <h1 className='text-2xl font-bold text-foreground'>{org.name}</h1>
        <p className='text-sm text-muted-foreground mt-1'>{org.domain}</p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className='bg-white rounded-2xl shadow-sm p-5'>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={16} />
            </div>
            <p className='text-xl font-bold text-foreground'>{value}</p>
            <p className='text-xs text-muted-foreground mt-0.5'>{label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        {[
          { href: '/org-admin/creators',     title: 'Manage Creators',     desc: 'View and manage creators in your organization', icon: Building2  },
          { href: '/org-admin/applications', title: 'Review Applications', desc: 'Approve or reject creator applications',         icon: Users      },
          { href: '/org-admin/revenue',      title: 'Revenue Report',      desc: 'See detailed earnings by creator',               icon: TrendingUp },
        ].map(({ href, title, desc, icon: Icon }) => (
          <Link key={href} href={href}
            className='bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col gap-3 group'>
            <div className='w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center'>
              <Icon size={16} className='text-primary' />
            </div>
            <div>
              <p className='text-sm font-semibold text-foreground group-hover:text-primary transition-colors'>{title}</p>
              <p className='text-xs text-muted-foreground mt-0.5 leading-relaxed'>{desc}</p>
            </div>
            <ArrowRight size={14} className='text-muted-foreground group-hover:text-primary transition-colors mt-auto' />
          </Link>
        ))}
      </div>
    </div>
  );
}
