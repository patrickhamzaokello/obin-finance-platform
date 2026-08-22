'use client';

import { useState } from 'react';
import { sendSupportMessage } from '@/app/actions/feedback';
import Link from 'next/link';
import { ArrowLeft, Send, CheckCircle2, Loader2, MessageCircle } from 'lucide-react';

const SUBJECTS = [
  'Question about a course',
  'Technical issue',
  'Billing / payment',
  'Certificate issue',
  'Account problem',
  'Other',
];

export default function ContactPage() {
  const [subject, setSubject] = useState('');
  const [body,    setBody]    = useState('');
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  const handleSend = async () => {
    if (!subject) { setError('Please select a subject'); return; }
    if (!body.trim()) { setError('Please describe your issue'); return; }
    setSending(true); setError('');
    const r = await sendSupportMessage(subject, body);
    setSending(false);
    if (r.success) setSent(true);
    else setError(r.error ?? 'Failed to send');
  };

  const inputCls = 'w-full px-4 py-2.5 text-sm bg-white border border-black/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground/50';

  return (
    <div className='min-h-screen bg-[#F5F5F7]'>
      <header className='bg-white/80 backdrop-blur-xl border-b border-black/[0.06] sticky top-0 z-10'>
        <div className='max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-3'>
          <Link href='/dashboard' className='inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors'>
            <ArrowLeft size={14} /> Dashboard
          </Link>
        </div>
      </header>

      <div className='max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-10'>
        <div className='flex items-center gap-3 mb-8'>
          <div className='w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center'>
            <MessageCircle size={20} className='text-primary' />
          </div>
          <div>
            <h1 className='text-xl font-bold text-foreground'>Contact Support</h1>
            <p className='text-sm text-muted-foreground mt-0.5'>We typically respond within 24 hours</p>
          </div>
        </div>

        {sent ? (
          <div className='bg-white rounded-2xl shadow-sm px-8 py-12 text-center'>
            <div className='w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4'>
              <CheckCircle2 size={26} className='text-primary' />
            </div>
            <h2 className='text-base font-bold text-foreground mb-1'>Message sent</h2>
            <p className='text-sm text-muted-foreground mb-6'>Your message has been received. We&apos;ll get back to you shortly.</p>
            <Link href='/dashboard'
              className='inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors'>
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className='bg-white rounded-2xl shadow-sm p-7 space-y-5'>
            {/* Subject */}
            <div>
              <label className='block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider'>Subject</label>
              <div className='grid grid-cols-2 gap-2'>
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSubject(s)}
                    className={`text-left px-3.5 py-2.5 text-sm rounded-xl border transition-colors ${
                      subject === s
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-black/[0.08] text-foreground hover:bg-secondary'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className='block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider'>Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder='Describe your issue in as much detail as possible…'
                className={`${inputCls} resize-none`}
              />
            </div>

            {error && <p className='text-xs text-destructive'>{error}</p>}

            <button onClick={handleSend} disabled={sending}
              className='w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60'>
              {sending ? <><Loader2 size={15} className='animate-spin' /> Sending…</> : <><Send size={14} /> Send message</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
