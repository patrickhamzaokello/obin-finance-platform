import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Revenue' };

import { getOrgRevenue } from '@/app/actions/org-admin';
import { TrendingUp, Building2, DollarSign, Users } from 'lucide-react';

export default async function OrgRevenuePage() {
  const result = await getOrgRevenue();
  if (!result.success) return <div className='px-8 py-8 text-sm text-destructive'>{result.error}</div>;

  const { schools, totals } = result.data!;
  const org = result.org!;

  const fmt = (n: number) => `UGX ${n.toLocaleString()}`;

  return (
    <div className='px-8 py-8 space-y-8'>
      <div>
        <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1'>{org.name}</p>
        <h1 className='text-2xl font-bold text-foreground'>Revenue</h1>
        <p className='text-sm text-muted-foreground mt-1'>Your organization's earnings after the platform's 20% fee</p>
      </div>

      {/* Totals — 4 cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {[
          { label: 'Total Collected',   value: fmt(totals.gross),           icon: TrendingUp, color: 'bg-blue-50 text-blue-600',     sub: 'gross from students'         },
          { label: 'Creator Earnings',  value: fmt(totals.creatorEarnings), icon: Users,      color: 'bg-green-50 text-green-600',   sub: 'after org commission'        },
          { label: 'Your Org Keeps',    value: fmt(totals.orgKeeps),        icon: Building2,  color: 'bg-indigo-50 text-indigo-600', sub: '80% of your commission'      },
          { label: 'Platform Fee',      value: fmt(totals.ownerTakes),      icon: DollarSign, color: 'bg-orange-50 text-orange-600', sub: '20% of your commission'      },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className='bg-white rounded-2xl shadow-sm p-5'>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={16} />
            </div>
            <p className='text-xl font-bold text-foreground'>{value}</p>
            <p className='text-xs text-muted-foreground mt-0.5'>{label}</p>
            <p className='text-[10px] text-muted-foreground/70 mt-0.5'>{sub}</p>
          </div>
        ))}
      </div>

      {/* Per-creator breakdown */}
      <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
        <div className='px-6 py-4 border-b border-black/[0.06]'>
          <h2 className='text-sm font-semibold text-foreground'>By Creator</h2>
          <p className='text-xs text-muted-foreground mt-0.5'>
            Commission % is what your org charges. Platform takes 20% of that commission; your org keeps 80%.
          </p>
        </div>

        {schools.length === 0 ? (
          <div className='px-6 py-16 text-center text-muted-foreground text-sm'>
            <Building2 className='w-8 h-8 mx-auto mb-3 opacity-30' />
            No creators in this organization yet.
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-secondary text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                <tr>
                  <th className='px-6 py-3 text-left'>Creator</th>
                  <th className='px-6 py-3 text-right'>Comm %</th>
                  <th className='px-6 py-3 text-right'>Payments</th>
                  <th className='px-6 py-3 text-right'>Gross</th>
                  <th className='px-6 py-3 text-right'>Creator Keeps</th>
                  <th className='px-6 py-3 text-right'>Your Org Keeps</th>
                  <th className='px-6 py-3 text-right'>Platform Fee</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border'>
                {schools.map((s) => (
                  <tr key={s.schoolId} className='hover:bg-secondary/40 transition-colors'>
                    <td className='px-6 py-4 font-medium text-foreground'>{s.name}</td>
                    <td className='px-6 py-4 text-right text-muted-foreground'>{s.commission}%</td>
                    <td className='px-6 py-4 text-right text-muted-foreground'>{s.txCount}</td>
                    <td className='px-6 py-4 text-right font-semibold text-foreground'>{fmt(s.gross)}</td>
                    <td className='px-6 py-4 text-right font-semibold text-green-700'>{fmt(s.creatorEarnings)}</td>
                    <td className='px-6 py-4 text-right font-bold text-indigo-700'>{fmt(s.orgKeeps)}</td>
                    <td className='px-6 py-4 text-right text-muted-foreground'>{fmt(s.ownerTakes)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className='bg-secondary/60 text-xs font-bold text-foreground uppercase'>
                <tr>
                  <td className='px-6 py-3' colSpan={3}>Total</td>
                  <td className='px-6 py-3 text-right'>{fmt(totals.gross)}</td>
                  <td className='px-6 py-3 text-right text-green-700'>{fmt(totals.creatorEarnings)}</td>
                  <td className='px-6 py-3 text-right text-indigo-700'>{fmt(totals.orgKeeps)}</td>
                  <td className='px-6 py-3 text-right text-muted-foreground'>{fmt(totals.ownerTakes)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
