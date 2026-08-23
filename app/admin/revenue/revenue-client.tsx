'use client';

import { useState, useMemo } from 'react';
import { Search, Download, TrendingUp, Users, BookOpen, Building2, DollarSign } from 'lucide-react';

/**
 * Revenue split (per payment):
 *   orgCommission = amount * commissionPercent / 100
 *   ownerCut      = orgCommission * 0.20
 *   orgKeeps      = orgCommission * 0.80
 *   creatorEarns  = amount - orgCommission
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

function split(row: Row) {
  const commission = row.commissionPercent ?? 0;
  const orgTotal   = Math.round(row.amount * commission / 100);
  const ownerCut   = Math.round(orgTotal * 0.20);
  const orgKeeps   = orgTotal - ownerCut;
  const creator    = row.amount - orgTotal;
  return { orgTotal, ownerCut, orgKeeps, creator };
}

export function RevenueReportClient({ rows }: { rows: Row[] }) {
  const [search, setSearch]             = useState('');
  const [filterSchool, setFilterSchool] = useState('all');

  const schools = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => map.set(r.schoolId, r.schoolName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rows]);

  const filtered = useMemo(() => {
    let f = rows;
    if (filterSchool !== 'all') f = f.filter((r) => r.schoolId === filterSchool);
    if (search.trim()) {
      const q = search.toLowerCase();
      f = f.filter(
        (r) =>
          r.learnerName?.toLowerCase().includes(q) ||
          r.learnerEmail.toLowerCase().includes(q) ||
          r.courseTitle.toLowerCase().includes(q) ||
          r.schoolName.toLowerCase().includes(q),
      );
    }
    return f;
  }, [rows, filterSchool, search]);

  // Summary totals
  const totals = useMemo(() => filtered.reduce(
    (acc, r) => {
      const s = split(r);
      return {
        gross:    acc.gross    + r.amount,
        owner:    acc.owner    + s.ownerCut,
        org:      acc.org      + s.orgKeeps,
        creator:  acc.creator  + s.creator,
      };
    },
    { gross: 0, owner: 0, org: 0, creator: 0 }
  ), [filtered]);

  const bySchool = useMemo(() => {
    const map = new Map<string, { name: string; slug: string; count: number; gross: number; owner: number; org: number; creator: number }>();
    filtered.forEach((r) => {
      const existing = map.get(r.schoolId) ?? { name: r.schoolName, slug: r.schoolSlug, count: 0, gross: 0, owner: 0, org: 0, creator: 0 };
      const s = split(r);
      map.set(r.schoolId, {
        ...existing,
        count:   existing.count   + 1,
        gross:   existing.gross   + r.amount,
        owner:   existing.owner   + s.ownerCut,
        org:     existing.org     + s.orgKeeps,
        creator: existing.creator + s.creator,
      });
    });
    return Array.from(map.values()).sort((a, b) => b.gross - a.gross);
  }, [filtered]);

  const handleExportCsv = () => {
    const header = [
      'School', 'Course', 'Learner Name', 'Learner Email',
      'Gross (UGX)', 'Creator Keeps (UGX)', 'Org Commission (UGX)', 'My Cut 20% (UGX)', 'Org Keeps 80% (UGX)',
      'Commission %', 'Paid At',
    ];
    const csvRows = filtered.map((r) => {
      const s = split(r);
      return [
        r.schoolName, r.courseTitle, r.learnerName ?? '—', r.learnerEmail,
        r.amount, s.creator, s.orgTotal, s.ownerCut, s.orgKeeps,
        `${r.commissionPercent}%`,
        r.paidAt ? new Date(r.paidAt).toLocaleString() : '—',
      ];
    });
    const csv = [header, ...csvRows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `revenue-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmt = (n: number) => `UGX ${n.toLocaleString()}`;

  return (
    <div className='px-8 py-8 space-y-6'>

      {/* Header */}
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-foreground'>Revenue Report</h1>
          <p className='text-sm text-muted-foreground mt-1'>All successful payments · full 3-way split</p>
        </div>
        <button
          onClick={handleExportCsv}
          className='inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shrink-0'
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {[
          { label: 'Total Collected',  value: fmt(totals.gross),   icon: TrendingUp,  color: 'bg-blue-50 text-blue-600',   sub: 'gross from students' },
          { label: 'My Earnings',      value: fmt(totals.owner),   icon: DollarSign,  color: 'bg-green-50 text-green-600', sub: '20% of org commissions' },
          { label: 'Org Keeps',        value: fmt(totals.org),     icon: Building2,   color: 'bg-indigo-50 text-indigo-600', sub: '80% of their commission' },
          { label: 'Creator Earnings', value: fmt(totals.creator), icon: Users,       color: 'bg-purple-50 text-purple-600', sub: 'after org commission' },
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

      {/* Per-school breakdown */}
      {bySchool.length > 1 && (
        <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
          <div className='px-6 py-4 border-b border-black/[0.05]'>
            <h2 className='text-sm font-semibold text-foreground'>Revenue by school</h2>
            <p className='text-xs text-muted-foreground mt-0.5'>Full split per creator</p>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-secondary text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                <tr>
                  <th className='px-6 py-3 text-left'>School</th>
                  <th className='px-6 py-3 text-right'>Payments</th>
                  <th className='px-6 py-3 text-right'>Gross</th>
                  <th className='px-6 py-3 text-right'>Creator Keeps</th>
                  <th className='px-6 py-3 text-right'>My 20%</th>
                  <th className='px-6 py-3 text-right'>Org 80%</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-black/[0.04]'>
                {bySchool.map((s) => (
                  <tr key={s.slug} className='hover:bg-secondary/40 transition-colors'>
                    <td className='px-6 py-4'>
                      <p className='font-semibold text-foreground'>{s.name}</p>
                      <p className='text-xs text-muted-foreground font-mono'>{s.slug}</p>
                    </td>
                    <td className='px-6 py-4 text-right font-medium text-foreground'>{s.count}</td>
                    <td className='px-6 py-4 text-right text-muted-foreground'>{fmt(s.gross)}</td>
                    <td className='px-6 py-4 text-right text-muted-foreground'>{fmt(s.creator)}</td>
                    <td className='px-6 py-4 text-right font-bold text-primary'>{fmt(s.owner)}</td>
                    <td className='px-6 py-4 text-right text-indigo-600 font-medium'>{fmt(s.org)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className='bg-white rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row gap-3'>
        <div className='relative flex-1'>
          <Search size={14} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <input
            type='text'
            placeholder='Search by learner, course, school…'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full pl-9 pr-4 py-2 text-sm bg-secondary rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary/20'
          />
        </div>
        {schools.length > 1 && (
          <select
            value={filterSchool}
            onChange={(e) => setFilterSchool(e.target.value)}
            className='px-3 py-2 text-sm bg-secondary rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary/20'
          >
            <option value='all'>All Schools</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Main table */}
      {filtered.length === 0 ? (
        <div className='bg-white rounded-2xl shadow-sm py-16 text-center text-muted-foreground text-sm'>
          <TrendingUp className='w-8 h-8 mx-auto mb-3 opacity-30' />
          {rows.length === 0
            ? 'No successful payments yet.'
            : 'No results match your search.'}
        </div>
      ) : (
        <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-secondary text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                <tr>
                  <th className='px-6 py-3 text-left'>Learner</th>
                  <th className='px-6 py-3 text-left'>School / Course</th>
                  <th className='px-6 py-3 text-right'>Gross (UGX)</th>
                  <th className='px-6 py-3 text-right'>Creator</th>
                  <th className='px-6 py-3 text-right'>My 20%</th>
                  <th className='px-6 py-3 text-right'>Org 80%</th>
                  <th className='px-6 py-3 text-left'>Paid At</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-black/[0.04]'>
                {filtered.map((r) => {
                  const s = split(r);
                  return (
                    <tr key={r.paymentId} className='hover:bg-secondary/40 transition-colors'>
                      <td className='px-6 py-4'>
                        <p className='font-medium text-foreground'>{r.learnerName || '—'}</p>
                        <p className='text-xs text-muted-foreground'>{r.learnerEmail}</p>
                      </td>
                      <td className='px-6 py-4'>
                        <p className='font-medium text-foreground'>{r.schoolName}</p>
                        <p className='text-xs text-muted-foreground truncate max-w-[200px]'>{r.courseTitle}</p>
                      </td>
                      <td className='px-6 py-4 text-right'>
                        <p className='font-semibold text-foreground'>{r.amount.toLocaleString()}</p>
                        <p className='text-[10px] text-muted-foreground'>{r.commissionPercent}% comm.</p>
                      </td>
                      <td className='px-6 py-4 text-right text-muted-foreground'>{s.creator.toLocaleString()}</td>
                      <td className='px-6 py-4 text-right font-bold text-primary'>{s.ownerCut.toLocaleString()}</td>
                      <td className='px-6 py-4 text-right text-indigo-600 font-medium'>{s.orgKeeps.toLocaleString()}</td>
                      <td className='px-6 py-4 text-muted-foreground whitespace-nowrap'>
                        {r.paidAt ? new Date(r.paidAt).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className='border-t-2 border-black/[0.08] bg-secondary/50'>
                <tr>
                  <td colSpan={2} className='px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
                    Total ({filtered.length} payment{filtered.length !== 1 ? 's' : ''})
                  </td>
                  <td className='px-6 py-3 text-right font-bold text-foreground'>{totals.gross.toLocaleString()}</td>
                  <td className='px-6 py-3 text-right font-bold text-muted-foreground'>{totals.creator.toLocaleString()}</td>
                  <td className='px-6 py-3 text-right font-bold text-primary'>{totals.owner.toLocaleString()}</td>
                  <td className='px-6 py-3 text-right font-bold text-indigo-600'>{totals.org.toLocaleString()}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
