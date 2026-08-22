'use client';

import { useEffect, useState } from 'react';
import { getSupportMessages, updateMessageStatus, getSchoolReviews } from '@/app/actions/feedback';
import { Inbox, Star, CheckCircle2, Clock, Loader2, MessageCircle } from 'lucide-react';

type Message = {
  id: string; subject: string; body: string; status: string;
  senderName: string | null; senderEmail: string | null; createdAt: Date;
};
type Review = {
  id: string; learnerName: string | null; courseTitle: string | null;
  rating: number; comment: string | null; createdAt: Date;
};

function Stars({ value }: { value: number }) {
  return (
    <div className='flex items-center gap-0.5'>
      {[1,2,3,4,5].map((i) => (
        <Star key={i} size={12}
          className={i <= value ? 'fill-amber-400 text-amber-400' : 'fill-none text-muted-foreground/20'} />
      ))}
    </div>
  );
}

export default function AdminMessagesPage() {
  const [tab,      setTab]      = useState<'messages' | 'reviews'>('messages');
  const [messages, setMessages] = useState<Message[]>([]);
  const [reviews,  setReviews]  = useState<Review[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getSupportMessages(), getSchoolReviews()]).then(([m, r]) => {
      if (m.success && m.data) setMessages(m.data as Message[]);
      if (r.success && r.data) setReviews(r.data as Review[]);
      setLoading(false);
    });
  }, []);

  const toggleStatus = async (id: string, current: string) => {
    setUpdating(id);
    const next = current === 'open' ? 'resolved' : 'open';
    await updateMessageStatus(id, next as 'open' | 'resolved');
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status: next } : m));
    setUpdating(null);
  };

  const openCount     = messages.filter((m) => m.status === 'open').length;
  const avgRating     = reviews.length ? Number((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)) : null;

  return (
    <div className='px-8 py-8 space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold text-foreground'>Feedback</h1>
        <p className='text-sm text-muted-foreground mt-1'>Learner messages and course reviews</p>
      </div>

      {/* Summary cards */}
      <div className='grid grid-cols-3 gap-4'>
        <div className='bg-white rounded-2xl shadow-sm p-5'>
          <div className='flex items-center justify-between mb-2'>
            <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>Open messages</p>
            <Inbox size={14} className='text-primary' />
          </div>
          <p className='text-3xl font-bold text-foreground'>{openCount}</p>
        </div>
        <div className='bg-white rounded-2xl shadow-sm p-5'>
          <div className='flex items-center justify-between mb-2'>
            <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>Total reviews</p>
            <Star size={14} className='text-amber-400' />
          </div>
          <p className='text-3xl font-bold text-foreground'>{reviews.length}</p>
        </div>
        <div className='bg-white rounded-2xl shadow-sm p-5'>
          <div className='flex items-center justify-between mb-2'>
            <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>Avg rating</p>
            <Star size={14} className='fill-amber-400 text-amber-400' />
          </div>
          <p className='text-3xl font-bold text-foreground'>{avgRating ?? '—'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className='flex gap-1 bg-secondary rounded-xl p-1 w-fit'>
        {(['messages', 'reviews'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors capitalize ${
              tab === t ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {t === 'messages' ? `Messages ${openCount > 0 ? `(${openCount})` : ''}` : 'Reviews'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className='flex items-center gap-2 text-muted-foreground text-sm'>
          <Loader2 size={15} className='animate-spin' /> Loading…
        </div>
      ) : tab === 'messages' ? (
        <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
          {messages.length === 0 ? (
            <div className='px-6 py-12 text-center text-sm text-muted-foreground'>
              <MessageCircle size={28} className='text-muted-foreground/30 mx-auto mb-3' />
              No messages yet
            </div>
          ) : (
            <div className='divide-y divide-black/[0.04]'>
              {messages.map((msg) => (
                <div key={msg.id} className={`px-6 py-4 flex items-start gap-4 ${msg.status === 'resolved' ? 'opacity-60' : ''}`}>
                  <div className='w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary'>
                    {(msg.senderName ?? msg.senderEmail ?? 'L')[0].toUpperCase()}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <p className='text-sm font-semibold text-foreground'>{msg.senderName ?? msg.senderEmail}</p>
                      {msg.senderName && <p className='text-xs text-muted-foreground'>{msg.senderEmail}</p>}
                      <span className={`ml-auto inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        msg.status === 'open' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
                      }`}>
                        {msg.status === 'open' ? <Clock size={9} /> : <CheckCircle2 size={9} />}
                        {msg.status}
                      </span>
                    </div>
                    <p className='text-xs font-semibold text-muted-foreground mt-0.5'>{msg.subject}</p>
                    <p className='text-sm text-muted-foreground mt-1.5 leading-relaxed'>{msg.body}</p>
                    <div className='flex items-center gap-3 mt-3'>
                      <p className='text-xs text-muted-foreground/60'>
                        {new Date(msg.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <button onClick={() => toggleStatus(msg.id, msg.status)} disabled={updating === msg.id}
                        className='text-xs font-semibold text-primary hover:underline disabled:opacity-60'>
                        {updating === msg.id ? 'Updating…' : msg.status === 'open' ? 'Mark resolved' : 'Reopen'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
          {reviews.length === 0 ? (
            <div className='px-6 py-12 text-center text-sm text-muted-foreground'>
              <Star size={28} className='text-muted-foreground/30 mx-auto mb-3' />
              No reviews yet
            </div>
          ) : (
            <div className='divide-y divide-black/[0.04]'>
              {reviews.map((rev) => (
                <div key={rev.id} className='px-6 py-4 flex items-start gap-4'>
                  <div className='w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0 text-sm font-bold text-amber-600'>
                    {(rev.learnerName ?? 'L')[0].toUpperCase()}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between gap-2 flex-wrap'>
                      <div>
                        <p className='text-sm font-semibold text-foreground'>{rev.learnerName ?? 'Learner'}</p>
                        <p className='text-xs text-muted-foreground mt-0.5'>{rev.courseTitle}</p>
                      </div>
                      <Stars value={rev.rating} />
                    </div>
                    {rev.comment && (
                      <p className='text-sm text-muted-foreground mt-1.5 leading-relaxed'>{rev.comment}</p>
                    )}
                    <p className='text-xs text-muted-foreground/60 mt-2'>
                      {new Date(rev.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
