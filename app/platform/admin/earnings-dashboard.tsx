'use client';

import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type Row = {
  enrollmentId: string;
  enrolledAt: Date | null;
  priceAtEnrollment: number;
  platformFee: number;
  courseId: string;
  courseTitle: string;
  schoolId: string;
  schoolName: string;
  schoolSlug: string;
  commissionPercent: number;
  learnerId: string;
  learnerName: string | null;
  learnerEmail: string;
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function EarningsDashboard({ rows }: { rows: Row[] }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  // Available years from data
  const years = useMemo(() => {
    const s = new Set<number>();
    rows.forEach((r) => { if (r.enrolledAt) s.add(new Date(r.enrolledAt).getFullYear()); });
    s.add(currentYear);
    return Array.from(s).sort((a, b) => b - a);
  }, [rows, currentYear]);

  // Monthly breakdown for selected year
  const monthlyData = useMemo(() => {
    return MONTHS.map((month, i) => {
      const monthRows = rows.filter((r) => {
        if (!r.enrolledAt) return false;
        const d = new Date(r.enrolledAt);
        return d.getFullYear() === year && d.getMonth() === i;
      });
      return {
        month,
        earnings:    monthRows.reduce((s, r) => s + (r.platformFee ?? 0), 0),
        enrollments: monthRows.length,
      };
    });
  }, [rows, year]);

  // Per-user breakdown (all time)
  const byUser = useMemo(() => {
    const map = new Map<string, { name: string; email: string; schoolName: string; enrollments: number; revenue: number; earnings: number; courses: string[] }>();
    rows.forEach((r) => {
      const e = map.get(r.learnerId) ?? { name: r.learnerName ?? r.learnerEmail, email: r.learnerEmail, schoolName: r.schoolName, enrollments: 0, revenue: 0, earnings: 0, courses: [] };
      map.set(r.learnerId, {
        ...e,
        enrollments: e.enrollments + 1,
        revenue:     e.revenue + (r.priceAtEnrollment ?? 0),
        earnings:    e.earnings + (r.platformFee ?? 0),
        courses:     e.courses.includes(r.courseTitle) ? e.courses : [...e.courses, r.courseTitle],
      });
    });
    return Array.from(map.values()).sort((a, b) => b.earnings - a.earnings);
  }, [rows]);

  // Per-school breakdown (all time)
  const bySchool = useMemo(() => {
    const map = new Map<string, { name: string; slug: string; commission: number; enrollments: number; revenue: number; earnings: number }>();
    rows.forEach((r) => {
      const e = map.get(r.schoolId) ?? { name: r.schoolName, slug: r.schoolSlug, commission: r.commissionPercent, enrollments: 0, revenue: 0, earnings: 0 };
      map.set(r.schoolId, {
        ...e,
        enrollments: e.enrollments + 1,
        revenue:     e.revenue + (r.priceAtEnrollment ?? 0),
        earnings:    e.earnings + (r.platformFee ?? 0),
      });
    });
    return Array.from(map.values()).sort((a, b) => b.earnings - a.earnings);
  }, [rows]);

  const yearTotal = monthlyData.reduce((s, m) => s + m.earnings, 0);

  if (rows.length === 0) return null;

  const fmt = (n: number) => `UGX ${n.toLocaleString()}`;

  return (
    <div className='space-y-6'>

      {/* Monthly chart */}
      <div className='bg-white rounded-2xl shadow-sm p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h2 className='text-sm font-semibold text-foreground'>Monthly Earnings</h2>
            <p className='text-xs text-muted-foreground mt-0.5'>{year} · {fmt(yearTotal)}</p>
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
              formatter={(value: any) => [`UGX ${Number(value).toLocaleString()}`, 'Earnings']}
              labelStyle={{ fontSize: 12, fontWeight: 600, color: '#0f0f1a' }}
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 12 }}
              cursor={{ fill: '#f5f5f7', radius: 6 }}
            />
            <Bar dataKey='earnings' fill='#4F46E5' radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {/* Month totals strip */}
        <div className='grid grid-cols-6 gap-2 mt-4'>
          {monthlyData.filter((_, i) => i < 6).map((m) => (
            <div key={m.month} className='text-center'>
              <p className='text-[10px] font-semibold text-muted-foreground'>{m.month}</p>
              <p className='text-xs font-bold text-foreground'>{m.enrollments > 0 ? `${(m.earnings/1000).toFixed(0)}k` : '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Per-school earnings table */}
      {bySchool.length > 0 && (
        <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
          <div className='px-6 py-4 border-b border-black/[0.06]'>
            <h2 className='text-sm font-semibold text-foreground'>Earnings by school</h2>
            <p className='text-xs text-muted-foreground mt-0.5'>All time</p>
          </div>
          <table className='w-full text-sm'>
            <thead className='bg-secondary text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              <tr>
                <th className='px-6 py-3 text-left'>School</th>
                <th className='px-6 py-3 text-left'>Commission</th>
                <th className='px-6 py-3 text-right'>Enrollments</th>
                <th className='px-6 py-3 text-right'>School Revenue</th>
                <th className='px-6 py-3 text-right'>My Earnings</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-black/[0.04]'>
              {bySchool.map((s) => (
                <tr key={s.slug} className='hover:bg-secondary/40 transition-colors'>
                  <td className='px-6 py-4'>
                    <p className='font-medium text-foreground'>{s.name}</p>
                    <p className='text-xs text-muted-foreground font-mono'>{s.slug}</p>
                  </td>
                  <td className='px-6 py-4 text-muted-foreground'>{s.commission}%</td>
                  <td className='px-6 py-4 text-right font-medium text-foreground'>{s.enrollments}</td>
                  <td className='px-6 py-4 text-right text-muted-foreground'>{fmt(s.revenue)}</td>
                  <td className='px-6 py-4 text-right font-bold text-primary'>{fmt(s.earnings)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className='border-t-2 border-black/[0.08] bg-secondary/40'>
              <tr>
                <td colSpan={2} className='px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide'>Total</td>
                <td className='px-6 py-3 text-right font-bold text-foreground'>{rows.length}</td>
                <td className='px-6 py-3 text-right font-bold text-muted-foreground'>{fmt(rows.reduce((s, r) => s + r.priceAtEnrollment, 0))}</td>
                <td className='px-6 py-3 text-right font-bold text-primary'>{fmt(rows.reduce((s, r) => s + r.platformFee, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      {/* Per-user earnings table */}
      {byUser.length > 0 && (
        <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
          <div className='px-6 py-4 border-b border-black/[0.06]'>
            <h2 className='text-sm font-semibold text-foreground'>Earnings by learner</h2>
            <p className='text-xs text-muted-foreground mt-0.5'>All time · {byUser.length} learners</p>
          </div>
          <table className='w-full text-sm'>
            <thead className='bg-secondary text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              <tr>
                <th className='px-6 py-3 text-left'>Learner</th>
                <th className='px-6 py-3 text-left'>School</th>
                <th className='px-6 py-3 text-left'>Courses</th>
                <th className='px-6 py-3 text-right'>Enrollments</th>
                <th className='px-6 py-3 text-right'>Paid</th>
                <th className='px-6 py-3 text-right'>My Earnings</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-black/[0.04]'>
              {byUser.map((u) => (
                <tr key={u.email} className='hover:bg-secondary/40 transition-colors'>
                  <td className='px-6 py-4'>
                    <p className='font-medium text-foreground'>{u.name}</p>
                    <p className='text-xs text-muted-foreground'>{u.email}</p>
                  </td>
                  <td className='px-6 py-4 text-muted-foreground text-xs'>{u.schoolName}</td>
                  <td className='px-6 py-4 max-w-[220px]'>
                    <p className='text-xs text-muted-foreground truncate' title={u.courses.join(', ')}>{u.courses.join(', ')}</p>
                  </td>
                  <td className='px-6 py-4 text-right font-medium text-foreground'>{u.enrollments}</td>
                  <td className='px-6 py-4 text-right text-muted-foreground'>{fmt(u.revenue)}</td>
                  <td className='px-6 py-4 text-right font-bold text-primary'>{fmt(u.earnings)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className='border-t-2 border-black/[0.08] bg-secondary/40'>
              <tr>
                <td colSpan={3} className='px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide'>Total</td>
                <td className='px-6 py-3 text-right font-bold text-foreground'>{rows.length}</td>
                <td className='px-6 py-3 text-right font-bold text-muted-foreground'>{fmt(rows.reduce((s, r) => s + r.priceAtEnrollment, 0))}</td>
                <td className='px-6 py-3 text-right font-bold text-primary'>{fmt(rows.reduce((s, r) => s + r.platformFee, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
