'use client';

import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';

/**
 * One successful payment = one row.
 * Revenue split:
 *   orgCommission  = amount * commissionPercent / 100
 *   ownerCut       = orgCommission * 0.20   (platform owner's earnings)
 *   orgKeeps       = orgCommission * 0.80
 *   creatorEarns   = amount - orgCommission
 */
type Row = {
  paymentId:         string;
  paidAt:            Date | null;
  amount:            number;
  courseId:          string;
  courseTitle:       string;
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

/** Owner's cut on one payment = 20% of org commission. */
function ownerCut(r: Row): number {
  const commission = r.commissionPercent ?? 0;
  return Math.round(r.amount * commission / 100 * 0.20);
}

/** Org commission on one payment (what the org takes in total before owner's slice). */
function orgCommission(r: Row): number {
  return Math.round(r.amount * (r.commissionPercent ?? 0) / 100);
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function momGrowth(current: number, prior: number): { pct: number; up: boolean } | null {
  if (prior === 0) return null;
  const pct = Math.round(((current - prior) / prior) * 100);
  return { pct, up: pct >= 0 };
}

export function EarningsDashboard({ rows, enrollmentFunnel }: { rows: Row[]; enrollmentFunnel: FunnelRow[] }) {
  const currentYear  = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const [year, setYear] = useState(currentYear);

  const years = useMemo(() => {
    const s = new Set<number>();
    rows.forEach((r) => { if (r.paidAt) s.add(new Date(r.paidAt).getFullYear()); });
    s.add(currentYear);
    return Array.from(s).sort((a, b) => b - a);
  }, [rows, currentYear]);

  const monthlyData = useMemo(() => {
    return MONTHS.map((month, i) => {
      const monthRows = rows.filter((r) => {
        if (!r.paidAt) return false;
        const d = new Date(r.paidAt);
        return d.getFullYear() === year && d.getMonth() === i;
      });
      return {
        month,
        myEarnings:    monthRows.reduce((s, r) => s + ownerCut(r), 0),
        gross:         monthRows.reduce((s, r) => s + r.amount, 0),
        payments:      monthRows.length,
      };
    });
  }, [rows, year]);

  const bySchool = useMemo(() => {
    const map = new Map<string, {
      name: string; slug: string; commission: number;
      payments: number; gross: number; creatorEarns: number; orgCommission: number; myEarnings: number;
    }>();
    rows.forEach((r) => {
      const e = map.get(r.schoolId) ?? {
        name: r.schoolName, slug: r.schoolSlug, commission: r.commissionPercent,
        payments: 0, gross: 0, creatorEarns: 0, orgCommission: 0, myEarnings: 0,
      };
      const oc = orgCommission(r);
      map.set(r.schoolId, {
        ...e,
        payments:      e.payments + 1,
        gross:         e.gross + r.amount,
        orgCommission: e.orgCommission + oc,
        creatorEarns:  e.creatorEarns + (r.amount - oc),
        myEarnings:    e.myEarnings + ownerCut(r),
      });
    });
    return Array.from(map.values()).sort((a, b) => b.myEarnings - a.myEarnings);
  }, [rows]);

  // Month-over-month for current month
  const thisMonthEarnings = year === currentYear ? monthlyData[currentMonth]?.myEarnings ?? 0 : 0;
  const lastMonthEarnings = year === currentYear && currentMonth > 0 ? monthlyData[currentMonth - 1]?.myEarnings ?? 0 : 0;
  const momResult = momGrowth(thisMonthEarnings, lastMonthEarnings);

  // Funnel: merge enrollment counts with payment counts per course
  const funnelData = useMemo(() => {
    const paidByCourse = new Map<string, number>();
    rows.forEach((r) => {
      paidByCourse.set(r.courseId, (paidByCourse.get(r.courseId) ?? 0) + 1);
    });
    return enrollmentFunnel
      .map((f) => ({
        ...f,
        paid:    paidByCourse.get(f.courseId) ?? 0,
        dropOff: f.enrollments - (paidByCourse.get(f.courseId) ?? 0),
      }))
      .filter((f) => f.enrollments > 0)
      .sort((a, b) => b.dropOff - a.dropOff);
  }, [rows, enrollmentFunnel]);

  const yearOwnerTotal   = monthlyData.reduce((s, m) => s + m.myEarnings, 0);
  const allTimeGross     = rows.reduce((s, r) => s + r.amount, 0);
  const allTimeOwner     = rows.reduce((s, r) => s + ownerCut(r), 0);
  const allTimeCreator   = rows.reduce((s, r) => s + (r.amount - orgCommission(r)), 0);

  if (rows.length === 0 && enrollmentFunnel.length === 0) return null;

  const fmt = (n: number) => `UGX ${n.toLocaleString()}`;
  const pct = (a: number, b: number) => b === 0 ? '—' : `${Math.round((a / b) * 100)}%`;

  return (
    <div className='space-y-6'>

      {/* Platform summary cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {[
          { label: 'Total Collected',    value: fmt(allTimeGross),    sub: 'gross from students',      color: 'bg-blue-50 text-blue-600' },
          { label: 'My Earnings',        value: fmt(allTimeOwner),    sub: '20% of org commissions',   color: 'bg-green-50 text-green-600' },
          { label: 'Creator Earnings',   value: fmt(allTimeCreator),  sub: 'after org commission',     color: 'bg-purple-50 text-purple-600' },
          { label: 'Payments',           value: rows.length,          sub: 'successful transactions',  color: 'bg-orange-50 text-orange-600' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className='bg-white rounded-2xl shadow-sm p-5'>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 text-sm font-bold ${color}`}>
              {label[0]}
            </div>
            <p className='text-xl font-bold text-foreground'>{value}</p>
            <p className='text-xs text-muted-foreground mt-0.5'>{label}</p>
            <p className='text-[10px] text-muted-foreground/70 mt-0.5'>{sub}</p>
          </div>
        ))}
      </div>

      {/* Monthly earnings chart */}
      <div className='bg-white rounded-2xl shadow-sm p-6'>
        <div className='flex items-center justify-between mb-2'>
          <div>
            <h2 className='text-sm font-semibold text-foreground'>Monthly Earnings</h2>
            <p className='text-xs text-muted-foreground mt-0.5'>
              {year} · My cut: {fmt(yearOwnerTotal)}
              {momResult && (
                <span className={`ml-2 font-semibold ${momResult.up ? 'text-green-600' : 'text-red-500'}`}>
                  {momResult.up ? '▲' : '▼'} {Math.abs(momResult.pct)}% vs last month
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
          <BarChart data={monthlyData} barSize={20}>
            <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' vertical={false} />
            <XAxis dataKey='month' tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
              tickFormatter={(v) => v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => [
                `UGX ${Number(value).toLocaleString()}`,
                name === 'myEarnings' ? 'My Earnings (20% cut)' : name === 'gross' ? 'Gross Collected' : name,
              ]}
              labelStyle={{ fontSize: 12, fontWeight: 600 }}
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 12 }}
              cursor={{ fill: '#f5f5f7', radius: 6 }}
            />
            <Legend formatter={(v) => v === 'myEarnings' ? 'My Earnings' : 'Gross'} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey='gross'      fill='#e0e7ff' radius={[4, 4, 0, 0]} />
            <Bar dataKey='myEarnings' fill='#4F46E5' radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-school earnings table */}
      {bySchool.length > 0 && (
        <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
          <div className='px-6 py-4 border-b border-black/[0.06]'>
            <h2 className='text-sm font-semibold text-foreground'>Earnings by school</h2>
            <p className='text-xs text-muted-foreground mt-0.5'>All time · from successful payments</p>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-secondary text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                <tr>
                  <th className='px-6 py-3 text-left'>School</th>
                  <th className='px-6 py-3 text-left'>Commission</th>
                  <th className='px-6 py-3 text-right'>Payments</th>
                  <th className='px-6 py-3 text-right'>Gross</th>
                  <th className='px-6 py-3 text-right'>Creator Keeps</th>
                  <th className='px-6 py-3 text-right'>Org Commission</th>
                  <th className='px-6 py-3 text-right'>My 20% Cut</th>
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
                    <td className='px-6 py-4 text-right font-medium text-foreground'>{s.payments}</td>
                    <td className='px-6 py-4 text-right text-muted-foreground'>{fmt(s.gross)}</td>
                    <td className='px-6 py-4 text-right text-muted-foreground'>{fmt(s.creatorEarns)}</td>
                    <td className='px-6 py-4 text-right text-muted-foreground'>{fmt(s.orgCommission)}</td>
                    <td className='px-6 py-4 text-right font-bold text-primary'>{fmt(s.myEarnings)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className='border-t-2 border-black/[0.08] bg-secondary/40'>
                <tr>
                  <td colSpan={2} className='px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide'>Total</td>
                  <td className='px-6 py-3 text-right font-bold text-foreground'>{rows.length}</td>
                  <td className='px-6 py-3 text-right font-bold text-muted-foreground'>{fmt(allTimeGross)}</td>
                  <td className='px-6 py-3 text-right font-bold text-muted-foreground'>{fmt(allTimeCreator)}</td>
                  <td className='px-6 py-3 text-right font-bold text-muted-foreground'>
                    {fmt(rows.reduce((s, r) => s + orgCommission(r), 0))}
                  </td>
                  <td className='px-6 py-3 text-right font-bold text-primary'>{fmt(allTimeOwner)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Enrollment → Payment funnel */}
      {funnelData.length > 0 && (
        <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
          <div className='px-6 py-4 border-b border-black/[0.06] flex items-center gap-2'>
            <TrendingDown size={14} className='text-orange-500' />
            <div>
              <h2 className='text-sm font-semibold text-foreground'>Enrollment funnel</h2>
              <p className='text-xs text-muted-foreground mt-0.5'>Enrolled (intent) vs paid — drop-off = enrolled but never completed payment</p>
            </div>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-secondary text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                <tr>
                  <th className='px-6 py-3 text-left'>Course</th>
                  <th className='px-6 py-3 text-left'>School</th>
                  <th className='px-6 py-3 text-right'>Enrolled</th>
                  <th className='px-6 py-3 text-right'>Paid</th>
                  <th className='px-6 py-3 text-right'>Conversion</th>
                  <th className='px-6 py-3 text-right'>Drop-off</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-black/[0.04]'>
                {funnelData.map((f) => {
                  const convPct = f.enrollments === 0 ? 0 : Math.round((f.paid / f.enrollments) * 100);
                  return (
                    <tr key={f.courseId} className='hover:bg-secondary/40 transition-colors'>
                      <td className='px-6 py-4'>
                        <p className='font-medium text-foreground truncate max-w-[200px]'>{f.courseTitle}</p>
                      </td>
                      <td className='px-6 py-4 text-xs text-muted-foreground'>{f.schoolName}</td>
                      <td className='px-6 py-4 text-right font-medium text-foreground'>{f.enrollments}</td>
                      <td className='px-6 py-4 text-right font-medium text-primary'>{f.paid}</td>
                      <td className='px-6 py-4 text-right'>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          convPct >= 70 ? 'bg-green-50 text-green-700' :
                          convPct >= 40 ? 'bg-yellow-50 text-yellow-700' :
                          'bg-red-50 text-red-600'
                        }`}>
                          {pct(f.paid, f.enrollments)}
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
        </div>
      )}
    </div>
  );
}
