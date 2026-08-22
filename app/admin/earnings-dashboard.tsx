'use client';

import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingDown } from 'lucide-react';

/** One activated access code = one confirmed payment. */
type Row = {
  activationId:      string;
  activatedAt:       Date | null;
  accessExpiresAt:   Date | null;
  courseId:          string;
  courseTitle:       string;
  coursePrice:       number | null;
  discountPercent:   number | null;
  discountActive:    boolean;
  schoolId:          string;
  schoolName:        string;
  schoolSlug:        string;
  commissionPercent: number;
  learnerId:         string;
  learnerName:       string | null;
  learnerEmail:      string;
};

type FunnelRow = {
  courseId:    string;
  courseTitle: string;
  schoolId:    string;
  schoolName:  string;
  enrollments: number;
};

/** Effective price after any active discount. */
function effectivePrice(r: Row): number {
  const base = r.coursePrice ?? 0;
  if (r.discountActive && (r.discountPercent ?? 0) > 0) {
    return Math.round(base * (1 - (r.discountPercent ?? 0) / 100));
  }
  return base;
}

/** Platform commission on one activation. */
function platformFee(r: Row): number {
  return Math.round(effectivePrice(r) * r.commissionPercent / 100);
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function EarningsDashboard({ rows, enrollmentFunnel }: { rows: Row[]; enrollmentFunnel: FunnelRow[] }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const years = useMemo(() => {
    const s = new Set<number>();
    rows.forEach((r) => { if (r.activatedAt) s.add(new Date(r.activatedAt).getFullYear()); });
    s.add(currentYear);
    return Array.from(s).sort((a, b) => b - a);
  }, [rows, currentYear]);

  const monthlyData = useMemo(() => {
    return MONTHS.map((month, i) => {
      const monthRows = rows.filter((r) => {
        if (!r.activatedAt) return false;
        const d = new Date(r.activatedAt);
        return d.getFullYear() === year && d.getMonth() === i;
      });
      return {
        month,
        earnings:     monthRows.reduce((s, r) => s + platformFee(r), 0),
        activations:  monthRows.length,
      };
    });
  }, [rows, year]);

  const bySchool = useMemo(() => {
    const map = new Map<string, { name: string; slug: string; commission: number; activations: number; revenue: number; earnings: number }>();
    rows.forEach((r) => {
      const e = map.get(r.schoolId) ?? { name: r.schoolName, slug: r.schoolSlug, commission: r.commissionPercent, activations: 0, revenue: 0, earnings: 0 };
      map.set(r.schoolId, {
        ...e,
        activations: e.activations + 1,
        revenue:     e.revenue + effectivePrice(r),
        earnings:    e.earnings + platformFee(r),
      });
    });
    return Array.from(map.values()).sort((a, b) => b.earnings - a.earnings);
  }, [rows]);

  const byUser = useMemo(() => {
    const map = new Map<string, { name: string; email: string; schoolName: string; activations: number; paid: number; earnings: number; courses: string[] }>();
    rows.forEach((r) => {
      const e = map.get(r.learnerId) ?? { name: r.learnerName ?? r.learnerEmail, email: r.learnerEmail, schoolName: r.schoolName, activations: 0, paid: 0, earnings: 0, courses: [] };
      map.set(r.learnerId, {
        ...e,
        activations: e.activations + 1,
        paid:        e.paid + effectivePrice(r),
        earnings:    e.earnings + platformFee(r),
        courses:     e.courses.includes(r.courseTitle) ? e.courses : [...e.courses, r.courseTitle],
      });
    });
    return Array.from(map.values()).sort((a, b) => b.earnings - a.earnings);
  }, [rows]);

  // Funnel: merge enrollment counts with activation counts per course
  const funnelData = useMemo(() => {
    const activationsByCourse = new Map<string, number>();
    rows.forEach((r) => {
      activationsByCourse.set(r.courseId, (activationsByCourse.get(r.courseId) ?? 0) + 1);
    });
    return enrollmentFunnel
      .map((f) => ({
        ...f,
        activations: activationsByCourse.get(f.courseId) ?? 0,
        dropOff: f.enrollments - (activationsByCourse.get(f.courseId) ?? 0),
      }))
      .filter((f) => f.enrollments > 0)
      .sort((a, b) => b.dropOff - a.dropOff);
  }, [rows, enrollmentFunnel]);

  const yearTotal = monthlyData.reduce((s, m) => s + m.earnings, 0);
  const totalRevenue = rows.reduce((s, r) => s + effectivePrice(r), 0);
  const totalEarnings = rows.reduce((s, r) => s + platformFee(r), 0);

  if (rows.length === 0 && enrollmentFunnel.length === 0) return null;

  const fmt = (n: number) => `UGX ${n.toLocaleString()}`;
  const pct = (a: number, b: number) => b === 0 ? '—' : `${Math.round((a / b) * 100)}%`;

  return (
    <div className='space-y-6'>

      {/* Monthly chart */}
      <div className='bg-white rounded-2xl shadow-sm p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h2 className='text-sm font-semibold text-foreground'>Monthly Earnings</h2>
            <p className='text-xs text-muted-foreground mt-0.5'>{year} · {fmt(yearTotal)} · based on access code activations</p>
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
                name === 'earnings' ? 'My Earnings' : name,
              ]}
              labelStyle={{ fontSize: 12, fontWeight: 600, color: '#0f0f1a' }}
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 12 }}
              cursor={{ fill: '#f5f5f7', radius: 6 }}
            />
            <Bar dataKey='earnings' fill='#4F46E5' radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-school earnings table */}
      {bySchool.length > 0 && (
        <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
          <div className='px-6 py-4 border-b border-black/[0.06]'>
            <h2 className='text-sm font-semibold text-foreground'>Earnings by school</h2>
            <p className='text-xs text-muted-foreground mt-0.5'>All time · from activated access codes only</p>
          </div>
          <table className='w-full text-sm'>
            <thead className='bg-secondary text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              <tr>
                <th className='px-6 py-3 text-left'>School</th>
                <th className='px-6 py-3 text-left'>Commission</th>
                <th className='px-6 py-3 text-right'>Activations</th>
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
                  <td className='px-6 py-4 text-right font-medium text-foreground'>{s.activations}</td>
                  <td className='px-6 py-4 text-right text-muted-foreground'>{fmt(s.revenue)}</td>
                  <td className='px-6 py-4 text-right font-bold text-primary'>{fmt(s.earnings)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className='border-t-2 border-black/[0.08] bg-secondary/40'>
              <tr>
                <td colSpan={2} className='px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide'>Total</td>
                <td className='px-6 py-3 text-right font-bold text-foreground'>{rows.length}</td>
                <td className='px-6 py-3 text-right font-bold text-muted-foreground'>{fmt(totalRevenue)}</td>
                <td className='px-6 py-3 text-right font-bold text-primary'>{fmt(totalEarnings)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Enrollment → Activation funnel */}
      {funnelData.length > 0 && (
        <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
          <div className='px-6 py-4 border-b border-black/[0.06] flex items-center gap-2'>
            <TrendingDown size={14} className='text-orange-500' />
            <div>
              <h2 className='text-sm font-semibold text-foreground'>Enrollment funnel</h2>
              <p className='text-xs text-muted-foreground mt-0.5'>Enrolled (intent) vs activated code (paid) — drop-off = enrolled but never paid</p>
            </div>
          </div>
          <table className='w-full text-sm'>
            <thead className='bg-secondary text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              <tr>
                <th className='px-6 py-3 text-left'>Course</th>
                <th className='px-6 py-3 text-left'>School</th>
                <th className='px-6 py-3 text-right'>Enrolled</th>
                <th className='px-6 py-3 text-right'>Paid (got code)</th>
                <th className='px-6 py-3 text-right'>Conversion</th>
                <th className='px-6 py-3 text-right'>Drop-off</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-black/[0.04]'>
              {funnelData.map((f) => {
                const convPct = f.enrollments === 0 ? 0 : Math.round((f.activations / f.enrollments) * 100);
                return (
                  <tr key={f.courseId} className='hover:bg-secondary/40 transition-colors'>
                    <td className='px-6 py-4'>
                      <p className='font-medium text-foreground truncate max-w-[200px]'>{f.courseTitle}</p>
                    </td>
                    <td className='px-6 py-4 text-xs text-muted-foreground'>{f.schoolName}</td>
                    <td className='px-6 py-4 text-right font-medium text-foreground'>{f.enrollments}</td>
                    <td className='px-6 py-4 text-right font-medium text-primary'>{f.activations}</td>
                    <td className='px-6 py-4 text-right'>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        convPct >= 70 ? 'bg-green-50 text-green-700' :
                        convPct >= 40 ? 'bg-yellow-50 text-yellow-700' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {pct(f.activations, f.enrollments)}
                      </span>
                    </td>
                    <td className='px-6 py-4 text-right'>
                      {f.dropOff > 0
                        ? <span className='text-sm font-semibold text-orange-600'>{f.dropOff}</span>
                        : <span className='text-xs text-green-600 font-medium'>None</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Per-user earnings table */}
      {byUser.length > 0 && (
        <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
          <div className='px-6 py-4 border-b border-black/[0.06]'>
            <h2 className='text-sm font-semibold text-foreground'>Earnings by learner</h2>
            <p className='text-xs text-muted-foreground mt-0.5'>All time · {byUser.length} paying learners</p>
          </div>
          <table className='w-full text-sm'>
            <thead className='bg-secondary text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              <tr>
                <th className='px-6 py-3 text-left'>Learner</th>
                <th className='px-6 py-3 text-left'>School</th>
                <th className='px-6 py-3 text-left'>Courses</th>
                <th className='px-6 py-3 text-right'>Activations</th>
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
                  <td className='px-6 py-4 text-right font-medium text-foreground'>{u.activations}</td>
                  <td className='px-6 py-4 text-right text-muted-foreground'>{fmt(u.paid)}</td>
                  <td className='px-6 py-4 text-right font-bold text-primary'>{fmt(u.earnings)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className='border-t-2 border-black/[0.08] bg-secondary/40'>
              <tr>
                <td colSpan={3} className='px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide'>Total</td>
                <td className='px-6 py-3 text-right font-bold text-foreground'>{rows.length}</td>
                <td className='px-6 py-3 text-right font-bold text-muted-foreground'>{fmt(totalRevenue)}</td>
                <td className='px-6 py-3 text-right font-bold text-primary'>{fmt(totalEarnings)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
