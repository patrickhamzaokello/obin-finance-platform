'use client';

import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Users, BookOpen, ArrowUpRight,
  Phone, Wallet, Clock, CheckCircle2, XCircle, Send, AlertCircle,
} from 'lucide-react';
import {
  updateSchoolPhone,
  requestWithdrawal,
} from '@/app/actions/withdrawals';

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
  phone:             string | null;
};

type WithdrawalRow = {
  id:              string;
  amount:          number;
  phone:           string;
  status:          string;
  notes:           string | null;
  requestedAt:     Date | null;
  orgApprovedAt:   Date | null;
  ownerApprovedAt: Date | null;
  sentAt:          Date | null;
  rejectedAt:      Date | null;
  rejectedBy:      string | null;
};

type WithdrawalData = {
  school:      School;
  totalEarned: number;
  locked:      number;
  available:   number;
  canWithdraw: boolean;
  minAmount:   number;
  history:     WithdrawalRow[];
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:       { label: 'Pending',        color: 'bg-amber-50 text-amber-700',  icon: Clock        },
  org_approved:  { label: 'Org Approved',   color: 'bg-blue-50 text-blue-700',   icon: CheckCircle2 },
  owner_approved:{ label: 'Owner Approved', color: 'bg-indigo-50 text-indigo-700', icon: CheckCircle2 },
  sent:          { label: 'Sent',           color: 'bg-green-50 text-green-700', icon: Send         },
  rejected:      { label: 'Rejected',       color: 'bg-red-50 text-red-700',     icon: XCircle      },
};

export function CreatorRevenueClient({
  rows,
  school,
  withdrawalData,
}: {
  rows: Payment[];
  school: School;
  withdrawalData: WithdrawalData | null;
}) {
  const currentYear  = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const [year, setYear] = useState(currentYear);

  // ── phone edit state ──
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue]     = useState(school.phone ?? '');
  const [phoneSaving, setPhoneSaving]   = useState(false);
  const [phoneError, setPhoneError]     = useState('');

  // ── withdrawal request state ──
  const [wdAmount, setWdAmount]     = useState('');
  const [wdSubmitting, setWdSubmitting] = useState(false);
  const [wdError, setWdError]       = useState('');
  const [wdSuccess, setWdSuccess]   = useState(false);

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
        earnings: monthRows.reduce((s, r) => s + r.creatorEarns, 0),
        payments: monthRows.length,
      };
    }),
    [rows, year]
  );

  const byCourse = useMemo(() => {
    const map = new Map<string, { title: string; payments: number; gross: number; earnings: number }>();
    rows.forEach((r) => {
      const e = map.get(r.courseId) ?? { title: r.courseTitle, payments: 0, gross: 0, earnings: 0 };
      map.set(r.courseId, { ...e, payments: e.payments + 1, gross: e.gross + r.amount, earnings: e.earnings + r.creatorEarns });
    });
    return Array.from(map.values()).sort((a, b) => b.earnings - a.earnings);
  }, [rows]);

  const thisMonthEarnings = year === currentYear ? monthlyData[currentMonth]?.earnings ?? 0 : 0;
  const lastMonthEarnings = year === currentYear && currentMonth > 0 ? monthlyData[currentMonth - 1]?.earnings ?? 0 : 0;
  const momPct = lastMonthEarnings === 0 ? null : Math.round(((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100);

  const totalEarnings = rows.reduce((s, r) => s + r.creatorEarns, 0);
  const totalGross    = rows.reduce((s, r) => s + r.amount, 0);
  const yearEarnings  = monthlyData.reduce((s, m) => s + m.earnings, 0);
  const commission    = school.commissionPercent ?? 10;

  const fmt = (n: number) => `UGX ${n.toLocaleString()}`;

  async function handlePhoneSave() {
    setPhoneSaving(true); setPhoneError('');
    const res = await updateSchoolPhone(phoneValue);
    setPhoneSaving(false);
    if (res.success) { setEditingPhone(false); }
    else setPhoneError(res.error ?? 'Failed to save');
  }

  async function handleWithdrawRequest() {
    const amt = parseInt(wdAmount.replace(/,/g, ''), 10);
    if (!amt || amt < 50000) { setWdError('Minimum withdrawal is UGX 50,000'); return; }
    setWdSubmitting(true); setWdError(''); setWdSuccess(false);
    const res = await requestWithdrawal(amt);
    setWdSubmitting(false);
    if (res.success) { setWdSuccess(true); setWdAmount(''); }
    else setWdError(res.error ?? 'Failed to submit request');
  }

  const wd = withdrawalData;
  const hasPhone = !!(school.phone ?? wd?.school?.phone);

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
          { label: 'All-Time Earnings', value: fmt(totalEarnings), icon: DollarSign, color: 'bg-green-50 text-green-600', sub: `${100 - commission}% of gross` },
          { label: 'This Year',         value: fmt(yearEarnings),  icon: TrendingUp, color: 'bg-blue-50 text-blue-600',  sub: year.toString() },
          { label: 'This Month',        value: fmt(thisMonthEarnings), icon: ArrowUpRight,
            color: momPct !== null && momPct >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500',
            sub: momPct !== null ? `${momPct >= 0 ? '+' : ''}${momPct}% vs last month` : 'no prior month data' },
          { label: 'Total Payments',    value: rows.length, icon: Users, color: 'bg-purple-50 text-purple-600',
            sub: `from ${new Set(rows.map(r => r.learnerId)).size} learners` },
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
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}
              className='px-3 py-1.5 text-xs bg-secondary rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20'>
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
                formatter={(value: any) => [`UGX ${Number(value).toLocaleString()}`, 'My Earnings']}
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
                  <td className='px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide' colSpan={2}>Total</td>
                  <td className='px-6 py-3 text-right font-bold text-muted-foreground'>{fmt(totalGross)}</td>
                  <td className='px-6 py-3 text-right font-bold text-muted-foreground'>{fmt(totalGross - totalEarnings)}</td>
                  <td className='px-6 py-3 text-right font-bold text-green-700'>{fmt(totalEarnings)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════ WITHDRAWALS ══════════════════ */}
      <div className='pt-2'>
        <h2 className='text-lg font-bold text-foreground mb-4 flex items-center gap-2'>
          <Wallet size={18} className='text-primary' /> Withdrawals
        </h2>

        {/* Phone number block */}
        <div className='bg-white rounded-2xl shadow-sm p-6 mb-4'>
          <div className='flex items-center justify-between gap-4 flex-wrap'>
            <div className='flex items-center gap-3'>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${hasPhone ? 'bg-green-50' : 'bg-amber-50'}`}>
                <Phone size={16} className={hasPhone ? 'text-green-600' : 'text-amber-600'} />
              </div>
              <div>
                <p className='text-sm font-semibold text-foreground'>Payout Phone Number</p>
                {hasPhone
                  ? <p className='text-xs text-muted-foreground mt-0.5'>Mobile Money: <span className='font-mono font-semibold'>{school.phone ?? wd?.school?.phone}</span></p>
                  : <p className='text-xs text-amber-600 mt-0.5 font-medium'>⚠ Add a phone number to enable withdrawals</p>
                }
              </div>
            </div>
            {!editingPhone && (
              <button onClick={() => { setEditingPhone(true); setPhoneValue(school.phone ?? ''); }}
                className='px-4 py-2 text-xs font-semibold bg-secondary rounded-xl hover:bg-secondary/80 transition-colors'>
                {hasPhone ? 'Change' : 'Add phone'}
              </button>
            )}
          </div>

          {editingPhone && (
            <div className='mt-4 flex items-center gap-3 flex-wrap'>
              <input
                type='tel'
                value={phoneValue}
                onChange={(e) => setPhoneValue(e.target.value)}
                placeholder='e.g. 256701234567'
                className='flex-1 min-w-[200px] px-4 py-2 text-sm bg-secondary rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono'
              />
              <button onClick={handlePhoneSave} disabled={phoneSaving}
                className='px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-colors'>
                {phoneSaving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setEditingPhone(false)}
                className='px-4 py-2 text-xs font-semibold bg-secondary rounded-xl hover:bg-secondary/80 transition-colors'>
                Cancel
              </button>
              {phoneError && <p className='w-full text-xs text-destructive mt-1'>{phoneError}</p>}
            </div>
          )}
        </div>

        {/* Balance + request block */}
        {wd && (
          <div className='bg-white rounded-2xl shadow-sm p-6 mb-4'>
            <div className='grid grid-cols-3 gap-4 mb-6'>
              {[
                { label: 'Total Earned',   value: fmt(wd.totalEarned), color: 'text-foreground' },
                { label: 'In Progress',    value: fmt(wd.locked),      color: 'text-amber-600'  },
                { label: 'Available Now',  value: fmt(wd.available),   color: wd.canWithdraw ? 'text-green-700' : 'text-muted-foreground' },
              ].map(({ label, value, color }) => (
                <div key={label} className='text-center'>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className='text-xs text-muted-foreground mt-0.5'>{label}</p>
                </div>
              ))}
            </div>

            {!hasPhone ? (
              <div className='flex items-center gap-3 p-4 bg-amber-50 rounded-xl text-sm text-amber-700'>
                <AlertCircle size={16} className='shrink-0' />
                Add a phone number above before requesting a withdrawal.
              </div>
            ) : !wd.canWithdraw ? (
              <div className='flex items-center gap-3 p-4 bg-secondary rounded-xl text-sm text-muted-foreground'>
                <AlertCircle size={16} className='shrink-0 text-muted-foreground/60' />
                Minimum balance of {fmt(wd.minAmount)} required. You currently have {fmt(wd.available)}.
              </div>
            ) : (
              <div className='space-y-3'>
                <p className='text-sm font-semibold text-foreground'>Request a withdrawal</p>
                <div className='flex items-center gap-3 flex-wrap'>
                  <div className='relative flex-1 min-w-[160px]'>
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold'>UGX</span>
                    <input
                      type='number'
                      value={wdAmount}
                      onChange={(e) => setWdAmount(e.target.value)}
                      placeholder='50000'
                      min={wd.minAmount}
                      max={wd.available}
                      className='w-full pl-12 pr-4 py-2.5 text-sm bg-secondary rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary/20'
                    />
                  </div>
                  <button
                    onClick={() => setWdAmount(String(wd.available))}
                    className='px-3 py-2.5 text-xs font-semibold bg-secondary rounded-xl hover:bg-secondary/80 transition-colors whitespace-nowrap'>
                    Max ({fmt(wd.available)})
                  </button>
                  <button
                    onClick={handleWithdrawRequest}
                    disabled={wdSubmitting}
                    className='px-5 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-colors whitespace-nowrap'>
                    {wdSubmitting ? 'Submitting…' : 'Request Withdrawal'}
                  </button>
                </div>
                {wdError   && <p className='text-xs text-destructive'>{wdError}</p>}
                {wdSuccess  && <p className='text-xs text-green-600 font-medium'>✓ Withdrawal request submitted! Your org admin will review it.</p>}
                <p className='text-xs text-muted-foreground'>
                  Funds will be sent to <span className='font-mono font-semibold'>{school.phone ?? wd.school.phone}</span> via Mobile Money after approval by your org admin and the platform.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Withdrawal history */}
        {wd && wd.history.length > 0 && (
          <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
            <div className='px-6 py-4 border-b border-black/[0.06]'>
              <h3 className='text-sm font-semibold text-foreground'>Withdrawal History</h3>
            </div>
            <div className='divide-y divide-black/[0.04]'>
              {wd.history.map((w) => {
                const cfg = STATUS_CONFIG[w.status] ?? { label: w.status, color: 'bg-secondary text-foreground', icon: Clock };
                const Icon = cfg.icon;
                return (
                  <div key={w.id} className='px-6 py-4 flex items-center gap-4'>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${cfg.color}`}>
                      <Icon size={11} /> {cfg.label}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-bold text-foreground'>{fmt(w.amount)}</p>
                      <p className='text-xs text-muted-foreground font-mono'>{w.phone}</p>
                    </div>
                    <div className='text-right shrink-0'>
                      <p className='text-xs text-muted-foreground'>
                        {w.requestedAt ? new Date(w.requestedAt).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </p>
                      {w.status === 'rejected' && w.notes && (
                        <p className='text-xs text-red-600 mt-0.5 max-w-[200px] truncate' title={w.notes}>{w.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {wd && wd.history.length === 0 && (
          <div className='bg-white rounded-2xl shadow-sm py-12 text-center text-sm text-muted-foreground'>
            No withdrawal requests yet.
          </div>
        )}
      </div>

      {/* Payment log */}
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
                      {r.paidAt ? new Date(r.paidAt).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
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
