'use client';

import { useState, useMemo } from 'react';
import { Search, Download, TrendingUp, Users, BookOpen, Building2 } from 'lucide-react';

type Row = {
  codeId: string;
  code: string;
  label: string | null;
  usedAt: Date | null;
  accessExpiresAt: Date | null;
  courseId: string;
  courseTitle: string;
  coursePrice: number | null;
  discountPercent: number | null;
  discountActive: boolean;
  schoolId: string;
  schoolName: string;
  schoolSlug: string;
  learnerId: string;
  learnerName: string | null;
  learnerEmail: string;
};

function effectivePrice(row: Row): number {
  const price = row.coursePrice ?? 0;
  if (row.discountActive && (row.discountPercent ?? 0) > 0) {
    return Math.round(price * (1 - (row.discountPercent ?? 0) / 100));
  }
  return price;
}

export function RevenueReportClient({ rows }: { rows: Row[] }) {
  const [search, setSearch]           = useState('');
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
          r.schoolName.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q) ||
          (r.label ?? '').toLowerCase().includes(q),
      );
    }
    return f;
  }, [rows, filterSchool, search]);

  // Summary totals (for filtered view)
  const totalRevenue  = filtered.reduce((s, r) => s + effectivePrice(r), 0);
  const bySchool      = useMemo(() => {
    const map = new Map<string, { name: string; slug: string; count: number; revenue: number }>();
    filtered.forEach((r) => {
      const existing = map.get(r.schoolId) ?? { name: r.schoolName, slug: r.schoolSlug, count: 0, revenue: 0 };
      map.set(r.schoolId, {
        ...existing,
        count:   existing.count + 1,
        revenue: existing.revenue + effectivePrice(r),
      });
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  const handleExportCsv = () => {
    const header = ['School', 'Course', 'Price (UGX)', 'Discount', 'Effective Price (UGX)', 'Learner Name', 'Learner Email', 'Access Code', 'Label', 'Activated At', 'Access Expires'];
    const csvRows = filtered.map((r) => [
      r.schoolName,
      r.courseTitle,
      r.coursePrice ?? 0,
      r.discountActive ? `${r.discountPercent}%` : '—',
      effectivePrice(r),
      r.learnerName ?? '—',
      r.learnerEmail,
      r.code,
      r.label ?? '—',
      r.usedAt ? new Date(r.usedAt).toLocaleString() : '—',
      r.accessExpiresAt ? new Date(r.accessExpiresAt).toLocaleString() : 'Permanent',
    ]);
    const csv = [header, ...csvRows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
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
          <p className='text-sm text-muted-foreground mt-1'>All access code activations across schools</p>
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
          { label: 'Total Activations', value: filtered.length,          icon: Users,      color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Revenue',     value: fmt(totalRevenue),        icon: TrendingUp, color: 'bg-green-50 text-green-600' },
          { label: 'Schools',           value: bySchool.length,          icon: Building2,  color: 'bg-purple-50 text-purple-600' },
          { label: 'Courses',           value: new Set(filtered.map(r => r.courseId)).size, icon: BookOpen, color: 'bg-orange-50 text-orange-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className='bg-white rounded-2xl shadow-sm p-5'>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={16} />
            </div>
            <p className='text-xl font-bold text-foreground'>{value}</p>
            <p className='text-xs text-muted-foreground mt-0.5'>{label}</p>
          </div>
        ))}
      </div>

      {/* Per-school breakdown */}
      {bySchool.length > 1 && (
        <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
          <div className='px-6 py-4 border-b border-black/[0.05]'>
            <h2 className='text-sm font-semibold text-foreground'>Revenue by school</h2>
          </div>
          <div className='divide-y divide-black/[0.04]'>
            {bySchool.map((s) => (
              <div key={s.slug} className='px-6 py-4 flex items-center gap-4'>
                <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0'>
                  {s.name[0].toUpperCase()}
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-semibold text-foreground'>{s.name}</p>
                  <p className='text-xs text-muted-foreground'>{s.count} activation{s.count !== 1 ? 's' : ''}</p>
                </div>
                <div className='text-right shrink-0'>
                  <p className='text-sm font-bold text-foreground'>{fmt(s.revenue)}</p>
                  <p className='text-[10px] text-muted-foreground uppercase tracking-wide'>to collect</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className='bg-white rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row gap-3'>
        <div className='relative flex-1'>
          <Search size={14} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <input
            type='text'
            placeholder='Search by learner, course, code, school…'
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
            ? 'No access codes have been activated yet.'
            : 'No results match your search.'}
        </div>
      ) : (
        <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-secondary text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                <tr>
                  <th className='px-6 py-3 text-left'>Learner</th>
                  <th className='px-6 py-3 text-left'>School</th>
                  <th className='px-6 py-3 text-left'>Course</th>
                  <th className='px-6 py-3 text-left'>Code</th>
                  <th className='px-6 py-3 text-right'>Amount (UGX)</th>
                  <th className='px-6 py-3 text-left'>Activated</th>
                  <th className='px-6 py-3 text-left'>Access expires</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-black/[0.04]'>
                {filtered.map((r) => {
                  const price    = r.coursePrice ?? 0;
                  const effPrice = effectivePrice(r);
                  const hasDisc  = r.discountActive && (r.discountPercent ?? 0) > 0;
                  return (
                    <tr key={r.codeId} className='hover:bg-secondary/40 transition-colors'>
                      <td className='px-6 py-4'>
                        <p className='font-medium text-foreground'>{r.learnerName || '—'}</p>
                        <p className='text-xs text-muted-foreground'>{r.learnerEmail}</p>
                      </td>
                      <td className='px-6 py-4'>
                        <p className='font-medium text-foreground'>{r.schoolName}</p>
                        <p className='text-xs text-muted-foreground font-mono'>{r.schoolSlug}</p>
                      </td>
                      <td className='px-6 py-4 max-w-[180px]'>
                        <p className='font-medium text-foreground truncate'>{r.courseTitle}</p>
                      </td>
                      <td className='px-6 py-4'>
                        <p className='font-mono text-xs text-foreground bg-secondary px-2 py-1 rounded-lg inline-block'>{r.code}</p>
                        {r.label && <p className='text-xs text-muted-foreground mt-0.5'>{r.label}</p>}
                      </td>
                      <td className='px-6 py-4 text-right'>
                        <p className='font-semibold text-foreground'>{effPrice.toLocaleString()}</p>
                        {hasDisc && (
                          <p className='text-xs text-muted-foreground line-through'>{price.toLocaleString()}</p>
                        )}
                        {hasDisc && (
                          <span className='text-[10px] font-bold text-red-600'>-{r.discountPercent}%</span>
                        )}
                      </td>
                      <td className='px-6 py-4 text-muted-foreground whitespace-nowrap'>
                        {r.usedAt ? new Date(r.usedAt).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className='px-6 py-4 text-muted-foreground whitespace-nowrap'>
                        {r.accessExpiresAt
                          ? new Date(r.accessExpiresAt).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })
                          : <span className='text-xs text-green-600 font-medium'>Permanent</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className='border-t-2 border-black/[0.08] bg-secondary/50'>
                <tr>
                  <td colSpan={4} className='px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
                    Total ({filtered.length} activation{filtered.length !== 1 ? 's' : ''})
                  </td>
                  <td className='px-6 py-3 text-right font-bold text-foreground'>
                    {totalRevenue.toLocaleString()}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
