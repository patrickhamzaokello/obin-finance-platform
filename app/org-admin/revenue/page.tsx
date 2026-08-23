import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Revenue' };

import { getOrgRevenue } from '@/app/actions/org-admin';
import { TrendingUp, Building2 } from 'lucide-react';

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
        <p className='text-sm text-muted-foreground mt-1'>Earnings breakdown across all creators in your organization</p>
      </div>

      {/* Totals */}
      <div className='grid grid-cols-3 gap-4'>
        {[
          { label: 'Total Collected', value: fmt(totals.gross),           color: 'bg-blue-50 text-blue-600'   },
          { label: 'Creator Earnings', value: fmt(totals.creatorEarnings), color: 'bg-green-50 text-green-600' },
          { label: 'Platform Cut',    value: fmt(totals.platformCut),     color: 'bg-orange-50 text-orange-600'},
        ].map(({ label, value, color }) => (
          <div key={label} className='bg-white rounded-2xl shadow-sm p-5'>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold mb-3 ${color}`}>
              <TrendingUp size={12} /> {label}
            </div>
            <p className='text-xl font-bold text-foreground'>{value}</p>
          </div>
        ))}
      </div>

      {/* Per-creator breakdown */}
      <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
        <div className='px-6 py-4 border-b border-black/[0.06]'>
          <h2 className='text-sm font-semibold text-foreground'>By Creator</h2>
        </div>

        {schools.length === 0 ? (
          <div className='px-6 py-16 text-center text-muted-foreground text-sm'>
            <Building2 className='w-8 h-8 mx-auto mb-3 opacity-30' />
            No creators in this organization yet.
          </div>
        ) : (
          <table className='w-full text-sm'>
            <thead className='bg-secondary text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              <tr>
                <th className='px-6 py-3 text-left'>Creator</th>
                <th className='px-6 py-3 text-right'>Commission</th>
                <th className='px-6 py-3 text-right'>Transactions</th>
                <th className='px-6 py-3 text-right'>Total Collected</th>
                <th className='px-6 py-3 text-right'>Creator Earns</th>
                <th className='px-6 py-3 text-right'>Platform Cut</th>
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
                  <td className='px-6 py-4 text-right text-muted-foreground'>{fmt(s.platformCut)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className='bg-secondary/60 text-xs font-bold text-foreground uppercase'>
              <tr>
                <td className='px-6 py-3' colSpan={3}>Total</td>
                <td className='px-6 py-3 text-right'>{fmt(totals.gross)}</td>
                <td className='px-6 py-3 text-right text-green-700'>{fmt(totals.creatorEarnings)}</td>
                <td className='px-6 py-3 text-right'>{fmt(totals.platformCut)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
