'use client';

import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, BookOpen, ArrowUpRight } from 'lucide-react';

type Payment = {
  paymentId:         string;
  paidAt:            Date | null;
  amount:            number;
  courseId:          string;
  courseTitle:       string;
  learnerId:         string;
  learnerName:       string | null;
  learnerEmail:      string;
  commissionPercent: number;
  orgCommission:     number;
  creatorEarns:      number;
};

type School = {
  id:                string;
  name:              string;
  commissionPercent: number | null;
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function CreatorRevenueClient({ rows, school }: { rows: Payment[]; school: School }) {
  const currentYear  = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const [year, setYear] = useState(currentYear);

  const years = useMemo(() => {
    const s = new Set<number>();
    rows.forEach((r) => { if (r.paidAt) s.add(new Date(r.paidAt).getFullYear()); });
    s.add(currentYear);
    return Array.from(s).sort((a, b) => b - a);
  }, [rows, currentYear]);

  const monthlyData = useMemo(() =>
    MONTHS.map((month, i) => {
      const monthRows = rows.filter((r) => {
        if (!r.paidAt) return false;
        const d = new Date(r.paidAt);
        return d.getFullYear() === year && d.getMonth() === i;
      });
      return {
        month,
        earnings:  monthRows.reduce((s, r) => s + r.creatorEarns, 0),
        gross:     monthRows.reduce((s, r) => s + r.amount, 0),
        payments:  monthRows.length,
      };
    }),
    [rows, year]
  );

  const byCourse = useMemo(() => {
    const map = new Map<string, { title: string; payments: number; gross: number; earnings: number }>();
    rows.forEach((r) => {
      const e = map.get(r.courseId) ?? { title: r.courseTitle, payments: 0, gross: 0, earnings: 0 };
      map.set(r.courseId, {
        ...e,
        payments: e.payments + 1,
        gross:    e.gross    + r.amount,
        earnings: e.earnings + r.creatorEarns,
      });
    });
    return Array.from(map.values()).sort((a, b) => b.earnings - a.earnings);
  }, [rows]);

  const thisMonthEarnings = year === currentYear ? monthlyData[currentMonth]?.earnings ?? 0 : 0;
  const lastMonthEarnings = year === currentYear && currentMonth > 0
    ? monthlyData[currentMonth - 1]?.earnings ?? 0 : 0;
  const momPct = lastMonthEarnings === 0
    ? null
    : Math.round(((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100);

  const totalEarnings = rows.reduce((s, r) => s + r.creatorEarns, 0);
  const totalGross    = rows.reduce((s, r) => s + r.amount, 0);
  const yearEarnings  = monthlyData.reduce((s, m) => s + m.earnings, 0);
  const commission    = school.commissionPercent ?? 10;

  const fmt = (n: number) => `UGX ${n.toLocaleString()}`;

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6'>

      {/* Header */}
      <div>
        <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1'>{school.name}</p>
        <h1 className='text-2xl font-bold text-foreground'>My Revenue</h1>
        <p className='text-sm text-muted-foreground mt-1'>
          You keep {100 - commission}% of each sale — {commission}% goes to your organization
        </p>
      </div>

      {/* Summary cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {[
          {
            label: 'All-Time Earnings', value: fmt(totalEarnings),
            icon: DollarSign, color: 'bg-green-50 text-green-600',
            sub: `${100 - commission}% of gross`,
          },
          {
            label: 'This Year', value: fmt(yearEarnings),
            icon: TrendingUp, color: 'bg-blue-50 text-blue-600',
            sub: year.toString(),
          },
          {
            label: 'This Month', value: fmt(thisMonthEarnings),
            icon: ArrowUpRight, color: momPct !== null && momPct >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500',
            sub: momPct !== null
              ? `${momPct >= 0 ? '+' : ''}${momPct}% vs last month`
              : 'no prior month data',
          },
          {
            label: 'Total Payments', value: rows.length,
            icon: Users, color: 'bg-purple-50 text-purple-600',
            sub: `from ${new Set(rows.map(r => r.learnerId)).size} learners`,
          },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className='bg-white rounded-2xl shadow-sm p-5'>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={16} />
            </div>
            <p className='text-xl font-bold text-foreground'>{value}</p>
            <p className='text-xs text-muted-foreground mt-0.5'>{label}</p>
            <p className='text-[10px] text-muted-foreground/60 mt-0.5'>{sub}</p>
          </div>
        ))}
      </div>

      {/* Monthly chart */}
      {rows.length > 0 && (
        <div className='bg-white rounded-2xl shadow-sm p-6'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h2 className='text-sm font-semibold text-foreground'>Monthly Earnings</h2>
              <p className='text-xs text-muted-foreground mt-0.5'>
                {year} · {fmt(yearEarnings)}
                {momPct !== null && (
                  <span className={`ml-2 font-semibold ${momPct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {momPct >= 0 ? '▲' : '▼'} {Math.abs(momPct)}% this month
                  </span>
                )}
              </p>
            </div>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className='px-3 py-1.5 text-xs bg-secondary rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20'
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <ResponsiveContainer width='100%' height={220}>
            <BarChart data={monthlyData} barSize={24}>
              <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' vertical={false} />
              <XAxis dataKey='month' tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, name: any) => [
                  `UGX ${Number(value).toLocaleString()}`,
                  name === 'earnings' ? 'My Earnings' : 'Gross',
                ]}
                labelStyle={{ fontSize: 12, fontWeight: 600 }}
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 12 }}
                cursor={{ fill: '#f5f5f7', radius: 6 }}
              />
              <Bar dataKey='earnings' fill='#34C759' radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-course breakdown */}
      {byCourse.length > 0 && (
        <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
          <div className='px-6 py-4 border-b border-black/[0.06]'>
            <h2 className='text-sm font-semibold text-foreground'>Earnings by Course</h2>
            <p className='text-xs text-muted-foreground mt-0.5'>All time</p>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-secondary text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                <tr>
                  <th className='px-6 py-3 text-left'>Course</th>
                  <th className='px-6 py-3 text-right'>Payments</th>
                  <th className='px-6 py-3 text-right'>Gross</th>
                  <th className='px-6 py-3 text-right'>Org Cut ({commission}%)</th>
                  <th className='px-6 py-3 text-right'>My Earnings</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-black/[0.04]'>
                {byCourse.map((c) => (
                  <tr key={c.title} className='hover:bg-secondary/40 transition-colors'>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <div className='w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0'>
                          <BookOpen size={14} className='text-primary' />
                        </div>
                        <p className='font-medium text-foreground truncate max-w-[260px]'>{c.title}</p>
                      </div>
                    </td>
                    <td className='px-6 py-4 text-right text-muted-foreground'>{c.payments}</td>
                    <td className='px-6 py-4 text-right text-muted-foreground'>{fmt(c.gross)}</td>
                    <td className='px-6 py-4 text-right text-muted-foreground'>{fmt(c.gross - c.earnings)}</td>
                    <td className='px-6 py-4 text-right font-bold text-green-700'>{fmt(c.earnings)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className='border-t-2 border-black/[0.08] bg-secondary/40'>
                <tr>
                  <td className='px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide' colSpan={2}>
                    Total
                  </td>
                  <td className='px-6 py-3 text-right font-bold text-muted-foreground'>{fmt(totalGross)}</td>
                  <td className='px-6 py-3 text-right font-bold text-muted-foreground'>{fmt(totalGross - totalEarnings)}</td>
                  <td className='px-6 py-3 text-right font-bold text-green-700'>{fmt(totalEarnings)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Per-payment log */}
      {rows.length > 0 && (
        <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
          <div className='px-6 py-4 border-b border-black/[0.06]'>
            <h2 className='text-sm font-semibold text-foreground'>Payment Log</h2>
            <p className='text-xs text-muted-foreground mt-0.5'>{rows.length} successful payments · newest first</p>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-secondary text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                <tr>
                  <th className='px-6 py-3 text-left'>Learner</th>
                  <th className='px-6 py-3 text-left'>Course</th>
                  <th className='px-6 py-3 text-right'>Gross</th>
                  <th className='px-6 py-3 text-right'>My Earnings</th>
                  <th className='px-6 py-3 text-left'>Date</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-black/[0.04]'>
                {rows.map((r) => (
                  <tr key={r.paymentId} className='hover:bg-secondary/40 transition-colors'>
                    <td className='px-6 py-4'>
                      <p className='font-medium text-foreground'>{r.learnerName || '—'}</p>
                      <p className='text-xs text-muted-foreground'>{r.learnerEmail}</p>
                    </td>
                    <td className='px-6 py-4 text-muted-foreground text-sm truncate max-w-[200px]'>{r.courseTitle}</td>
                    <td className='px-6 py-4 text-right text-muted-foreground'>{r.amount.toLocaleString()}</td>
                    <td className='px-6 py-4 text-right font-semibold text-green-700'>{r.creatorEarns.toLocaleString()}</td>
                    <td className='px-6 py-4 text-muted-foreground whitespace-nowrap'>
                      {r.paidAt
                        ? new Date(r.paidAt).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rows.length === 0 && (
        <div className='bg-white rounded-2xl shadow-sm py-20 text-center'>
          <TrendingDown className='w-10 h-10 mx-auto mb-4 text-muted-foreground/30' />
          <p className='text-sm font-medium text-muted-foreground'>No payments yet</p>
          <p className='text-xs text-muted-foreground/70 mt-1'>Once learners pay for your courses, earnings will appear here.</p>
        </div>
      )}
    </div>
  );
}
