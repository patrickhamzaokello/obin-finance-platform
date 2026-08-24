'use client';

import { useState } from 'react';
import { Clock, CheckCircle2, XCircle, Send, AlertCircle, Banknote } from 'lucide-react';

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
  school:          { id: string; name: string; slug: string };
};

const STATUS = {
  pending:       { label: 'Pending (org)',  color: 'bg-amber-50 text-amber-700',   icon: Clock        },
  org_approved:  { label: 'Needs sign-off', color: 'bg-blue-50 text-blue-700',    icon: CheckCircle2 },
  owner_approved:{ label: 'Sending',        color: 'bg-indigo-50 text-indigo-700', icon: Send         },
  sent:          { label: 'Sent',           color: 'bg-green-50 text-green-700',  icon: Send         },
  rejected:      { label: 'Rejected',       color: 'bg-red-50 text-red-700',      icon: XCircle      },
} as const;

const fmt = (n: number) => `UGX ${n.toLocaleString()}`;
const fmtDate = (d: Date | null) =>
  d ? new Date(d).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export function AdminWithdrawalsClient({
  rows,
  onFinalApprove,
  onReject,
}: {
  rows: WithdrawalRow[];
  onFinalApprove: (id: string) => Promise<{ success: boolean; error?: string }>;
  onReject:       (id: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [loading,     setLoading]     = useState<Record<string, boolean>>({});
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [rejectId,    setRejectId]    = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [localRows,   setLocalRows]   = useState(rows);

  async function doApprove(id: string) {
    setLoading(l => ({ ...l, [id]: true }));
    setErrors(e => ({ ...e, [id]: '' }));
    const res = await onFinalApprove(id);
    setLoading(l => ({ ...l, [id]: false }));
    if (res.success) {
      const now = new Date();
      setLocalRows(r => r.map(w => w.id === id ? { ...w, status: 'sent', ownerApprovedAt: now, sentAt: now } : w));
    } else {
      setErrors(e => ({ ...e, [id]: res.error ?? 'Failed' }));
    }
  }

  async function doReject() {
    if (!rejectId) return;
    setLoading(l => ({ ...l, [rejectId]: true }));
    const res = await onReject(rejectId, rejectNotes || undefined);
    setLoading(l => ({ ...l, [rejectId!]: false }));
    if (res.success) {
      setLocalRows(r => r.map(w => w.id === rejectId ? { ...w, status: 'rejected', notes: rejectNotes || null, rejectedAt: new Date() } : w));
      setRejectId(null); setRejectNotes('');
    } else {
      setErrors(e => ({ ...e, [rejectId!]: res.error ?? 'Failed' }));
      setRejectId(null);
    }
  }

  const orgApproved = localRows.filter(w => w.status === 'org_approved');
  const rest        = localRows.filter(w => w.status !== 'org_approved');

  // Totals for quick stats
  const totalSent    = localRows.filter(w => w.status === 'sent').reduce((s, w) => s + w.amount, 0);
  const totalPending = orgApproved.reduce((s, w) => s + w.amount, 0);

  return (
    <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold text-foreground'>Creator Withdrawals</h1>
        <p className='text-sm text-muted-foreground mt-1'>
          Final approval before Mobile Money disbursement. Org-admins have already reviewed these.
        </p>
      </div>

      {/* Quick stats */}
      <div className='grid grid-cols-2 gap-4'>
        <div className='bg-white rounded-2xl shadow-sm p-5'>
          <p className='text-xl font-bold text-blue-700'>{fmt(totalPending)}</p>
          <p className='text-xs text-muted-foreground mt-0.5'>Awaiting final approval</p>
        </div>
        <div className='bg-white rounded-2xl shadow-sm p-5'>
          <p className='text-xl font-bold text-green-700'>{fmt(totalSent)}</p>
          <p className='text-xs text-muted-foreground mt-0.5'>Total sent to creators</p>
        </div>
      </div>

      {/* Org-approved — needs owner action */}
      <div>
        <h2 className='text-sm font-semibold text-foreground mb-3 flex items-center gap-2'>
          <span className='inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold'>{orgApproved.length}</span>
          Ready for Final Approval
        </h2>

        {orgApproved.length === 0 ? (
          <div className='bg-white rounded-2xl shadow-sm py-10 text-center text-sm text-muted-foreground'>
            No withdrawals pending your approval.
          </div>
        ) : (
          <div className='space-y-3'>
            {orgApproved.map(w => (
              <div key={w.id} className='bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4 flex-wrap'>
                <div className='w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0'>
                  <Banknote size={18} className='text-blue-600' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-bold text-foreground'>{fmt(w.amount)}</p>
                  <p className='text-xs text-muted-foreground'>{w.school.name}</p>
                  <p className='text-xs text-muted-foreground font-mono'>{w.phone}</p>
                  <p className='text-xs text-muted-foreground/60'>
                    Requested {fmtDate(w.requestedAt)} · Org approved {fmtDate(w.orgApprovedAt)}
                  </p>
                  {errors[w.id] && <p className='text-xs text-destructive mt-1'>{errors[w.id]}</p>}
                </div>
                <div className='flex items-center gap-2 shrink-0'>
                  <button
                    onClick={() => doApprove(w.id)}
                    disabled={loading[w.id]}
                    className='px-4 py-2 text-xs font-semibold bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-60 transition-colors'>
                    {loading[w.id] ? '…' : 'Approve & Mark Sent'}
                  </button>
                  <button
                    onClick={() => { setRejectId(w.id); setRejectNotes(''); }}
                    disabled={loading[w.id]}
                    className='px-4 py-2 text-xs font-semibold bg-red-50 text-red-600 rounded-xl hover:bg-red-100 disabled:opacity-60 transition-colors'>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      {rest.length > 0 && (
        <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
          <div className='px-6 py-4 border-b border-black/[0.06]'>
            <h2 className='text-sm font-semibold text-foreground'>All Withdrawal History</h2>
          </div>
          <div className='divide-y divide-black/[0.04]'>
            {rest.map(w => {
              const cfg = STATUS[w.status as keyof typeof STATUS] ?? { label: w.status, color: 'bg-secondary text-foreground', icon: AlertCircle };
              const Icon = cfg.icon;
              return (
                <div key={w.id} className='px-6 py-4 flex items-center gap-4'>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${cfg.color}`}>
                    <Icon size={11} /> {cfg.label}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-bold text-foreground'>{fmt(w.amount)}</p>
                    <p className='text-xs text-muted-foreground'>{w.school.name} · <span className='font-mono'>{w.phone}</span></p>
                    {w.status === 'rejected' && w.notes && (
                      <p className='text-xs text-red-600 mt-0.5 truncate max-w-xs' title={w.notes}>{w.notes}</p>
                    )}
                  </div>
                  <p className='text-xs text-muted-foreground shrink-0'>
                    {w.status === 'sent' ? `Sent ${fmtDate(w.sentAt)}` : fmtDate(w.requestedAt)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectId && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4'>
            <h3 className='text-base font-bold text-foreground'>Reject Withdrawal</h3>
            <p className='text-sm text-muted-foreground'>
              Provide a reason (optional). The creator will see this.
            </p>
            <textarea
              rows={3}
              value={rejectNotes}
              onChange={e => setRejectNotes(e.target.value)}
              placeholder='Reason for rejection…'
              className='w-full px-4 py-2.5 text-sm bg-secondary rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none'
            />
            <div className='flex gap-3'>
              <button onClick={doReject}
                className='flex-1 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors'>
                Reject
              </button>
              <button onClick={() => setRejectId(null)}
                className='flex-1 py-2.5 text-sm font-semibold bg-secondary rounded-xl hover:bg-secondary/80 transition-colors'>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
