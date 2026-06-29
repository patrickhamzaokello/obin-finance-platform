'use client';

import { useState, useTransition } from 'react';
import { approveApplication, rejectApplication } from '@/app/actions/applications';
import { Check, X, ExternalLink, Clock, CheckCircle, XCircle, User, Loader2, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';

type App = {
  id: string; name: string; email: string; phone: string;
  socialLink: string; channelName: string; bio: string | null;
  status: string; notes: string | null; schoolId: string | null;
  createdAt: Date; reviewedAt: Date | null;
};

const statusColor: Record<string, { bg: string; text: string; label: string }> = {
  pending:  { bg: '#FEF3C7', text: '#92400E', label: 'Pending review' },
  approved: { bg: '#D1FAE5', text: '#065F46', label: 'Approved' },
  rejected: { bg: '#FEE2E2', text: '#991B1B', label: 'Rejected' },
};

export default function ApplicationsClient({ applications }: { applications: App[] }) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);
  const [approvedSlug, setApprovedSlug] = useState<{ id: string; slug: string } | null>(null);
  const router = useRouter();

  const visible = filter === 'all' ? applications : applications.filter(a => a.status === filter);

  const counts = {
    all:      applications.length,
    pending:  applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  function handleApprove(id: string) {
    setActionId(id);
    startTransition(async () => {
      const res = await approveApplication(id);
      setActionId(null);
      if (res.success && res.data) {
        setApprovedSlug({ id, slug: res.data.slug });
        router.refresh();
      } else {
        alert(res.error ?? 'Failed to approve');
      }
    });
  }

  function handleReject(id: string) {
    setActionId(id);
    startTransition(async () => {
      const res = await rejectApplication(id, rejectNotes || undefined);
      setActionId(null);
      setRejecting(null);
      setRejectNotes('');
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error ?? 'Failed to reject');
      }
    });
  }

  const tabs: Array<typeof filter> = ['pending', 'approved', 'rejected', 'all'];

  return (
    <div style={{ padding: '32px 32px 64px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0B1411', margin: '0 0 4px', letterSpacing: '-0.01em' }}>Creator Applications</h1>
        <p style={{ fontSize: 14, color: '#57655D', margin: 0 }}>Review and approve creators who want to launch their channel.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Total', value: counts.all,      color: '#4F46E5', bg: '#EEF2FF' },
          { label: 'Pending', value: counts.pending, color: '#D97706', bg: '#FEF3C7' },
          { label: 'Approved', value: counts.approved, color: '#065F46', bg: '#D1FAE5' },
          { label: 'Rejected', value: counts.rejected, color: '#991B1B', bg: '#FEE2E2' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #E6ECE8' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#8A968F', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
            <p style={{ fontSize: 26, fontWeight: 800, color, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            style={{ padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: filter === t ? '#0B1411' : '#F4F7F5',
              color:      filter === t ? '#fff'    : '#57655D',
              textTransform: 'capitalize' }}>
            {t} {t !== 'all' && `(${counts[t]})`}
          </button>
        ))}
      </div>

      {/* Approved slug banner */}
      {approvedSlug && (
        <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#065F46', margin: '0 0 2px' }}>Channel created successfully!</p>
            <p style={{ fontSize: 13, color: '#047857', margin: 0 }}>
              Share this link with the creator to sign up:{' '}
              <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                {typeof window !== 'undefined' ? `${window.location.protocol}//${approvedSlug.slug}.${window.location.host.replace(/^[^.]+\./, '')}/sign-up` : `${approvedSlug.slug}.platform/sign-up`}
              </span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => {
              const host = typeof window !== 'undefined' ? window.location.host.replace(/^[^.]+\./, '') : 'platform';
              const proto = typeof window !== 'undefined' ? window.location.protocol : 'https:';
              navigator.clipboard?.writeText(`${proto}//${approvedSlug.slug}.${host}/sign-up`);
            }} style={{ padding: '7px 14px', background: '#059669', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Copy size={12} /> Copy link
            </button>
            <button onClick={() => setApprovedSlug(null)} style={{ padding: '7px 10px', background: 'transparent', color: '#065F46', border: 'none', cursor: 'pointer', fontSize: 18 }}>×</button>
          </div>
        </div>
      )}

      {/* Table */}
      {visible.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E6ECE8', padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F4F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <User size={20} color="#8A968F" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#0B1411', margin: '0 0 6px' }}>No {filter === 'all' ? '' : filter} applications</p>
          <p style={{ fontSize: 14, color: '#8A968F', margin: 0 }}>Applications submitted through the platform landing page will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {visible.map(app => {
            const sc = statusColor[app.status] ?? statusColor.pending;
            const isActing = actionId === app.id && isPending;
            return (
              <div key={app.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #E6ECE8', padding: '22px 24px' }}>
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <p style={{ fontSize: 16, fontWeight: 800, color: '#0B1411', margin: 0 }}>{app.name}</p>
                      <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: 999, background: sc.bg, color: sc.text }}>{sc.label}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#57655D', margin: '0 0 4px' }}>
                      Wants to launch: <strong style={{ color: '#0B1411' }}>{app.channelName}</strong>
                    </p>
                  </div>
                  <p style={{ fontSize: 12, color: '#8A968F', margin: 0, flexShrink: 0 }}>
                    {new Date(app.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                {/* Details grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '8px 24px', margin: '16px 0', padding: '16px 0', borderTop: '1px solid #F4F7F5', borderBottom: '1px solid #F4F7F5' }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8A968F', margin: '0 0 3px' }}>Email</p>
                    <p style={{ fontSize: 13, color: '#1A2620', margin: 0 }}>{app.email}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8A968F', margin: '0 0 3px' }}>Phone</p>
                    <p style={{ fontSize: 13, color: '#1A2620', margin: 0 }}>{app.phone}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8A968F', margin: '0 0 3px' }}>Social link</p>
                    <a href={app.socialLink} target="_blank" rel="noreferrer"
                      style={{ fontSize: 13, color: '#0E9F6E', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, wordBreak: 'break-all' }}>
                      {app.socialLink.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40)}{app.socialLink.length > 50 ? '…' : ''}
                      <ExternalLink size={11} />
                    </a>
                  </div>
                  {app.schoolId && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8A968F', margin: '0 0 3px' }}>Channel ID</p>
                      <p style={{ fontSize: 12, fontFamily: 'monospace', color: '#1A2620', margin: 0 }}>{app.schoolId}</p>
                    </div>
                  )}
                </div>

                {app.bio && (
                  <div style={{ background: '#F4F7F5', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8A968F', margin: '0 0 6px' }}>About</p>
                    <p style={{ fontSize: 14, color: '#57655D', margin: 0, lineHeight: 1.6 }}>{app.bio}</p>
                  </div>
                )}

                {/* Actions */}
                {app.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={() => handleApprove(app.id)} disabled={isActing}
                      style={{ padding: '9px 18px', background: '#0E9F6E', color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: isActing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: isActing ? 0.7 : 1 }}>
                      {isActing ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
                      Approve & create channel
                    </button>
                    <button onClick={() => { setRejecting(app.id); setRejectNotes(''); }} disabled={isActing}
                      style={{ padding: '9px 18px', background: '#FEE2E2', color: '#991B1B', borderRadius: 10, fontSize: 13, fontWeight: 700, border: '1px solid #FECACA', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <X size={13} /> Reject
                    </button>
                  </div>
                )}

                {/* Reject modal (inline) */}
                {rejecting === app.id && (
                  <div style={{ background: '#FFF5F5', borderRadius: 12, padding: '16px 18px', marginTop: 14, border: '1px solid #FECACA' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#991B1B', margin: '0 0 10px' }}>Rejection reason (optional — internal note)</p>
                    <textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} rows={2} placeholder="Not enough following, content not aligned, duplicate, etc."
                      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', fontSize: 13, borderRadius: 8, border: '1px solid #FECACA', background: '#fff', resize: 'vertical', fontFamily: 'inherit', color: '#0B1411', outline: 'none' }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button onClick={() => handleReject(app.id)} disabled={isPending}
                        style={{ padding: '8px 16px', background: '#C53030', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isPending ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <XCircle size={13} />} Confirm rejection
                      </button>
                      <button onClick={() => setRejecting(null)}
                        style={{ padding: '8px 14px', background: 'transparent', color: '#57655D', border: '1px solid #E6ECE8', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {app.status === 'approved' && app.schoolId && (
                  <p style={{ fontSize: 13, color: '#065F46', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle size={14} /> Channel created — ID: <span style={{ fontFamily: 'monospace' }}>{app.schoolId}</span>
                  </p>
                )}
                {app.status === 'rejected' && (
                  <p style={{ fontSize: 13, color: '#991B1B', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <XCircle size={14} /> Rejected
                    {app.notes && <span style={{ color: '#57655D', fontWeight: 400 }}>— {app.notes}</span>}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
