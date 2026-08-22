'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { activateAccessCode, resendAccessCode } from '@/app/actions/access-codes';
import { BookOpen, Lock, ArrowLeft, CheckCircle2, AlertCircle, Mail, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Props {
  courseId: string;
  courseTitle: string;
  courseThumbnail?: string | null;
  userEmail?: string | null;
}

export default function AccessGate({ courseId, courseTitle, courseThumbnail, userEmail }: Props) {
  const router  = useRouter();
  const [code,        setCode]        = useState('');
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [resending,   setResending]   = useState(false);
  const [resendState, setResendState] = useState<'idle' | 'sent' | 'error'>('idle');
  const [resendError, setResendError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || loading) return;
    setError('');
    setLoading(true);

    const result = await activateAccessCode(code.trim(), courseId);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      // Brief success state, then reload as server component to re-check access
      setTimeout(() => router.refresh(), 1200);
    } else {
      setError(result.error ?? 'Something went wrong. Please try again.');
      inputRef.current?.select();
    }
  };

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    setResendState('idle');
    setResendError('');
    const result = await resendAccessCode(courseId);
    setResending(false);
    if (result.success) {
      setResendState('sent');
    } else {
      setResendState('error');
      setResendError(result.error ?? 'Could not resend. Please try again.');
    }
  };

  // Format code as user types: auto-insert dashes after every 4 chars
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let formatted = raw;
    if (raw.length > 4)  formatted = raw.slice(0, 4) + '-' + raw.slice(4);
    if (raw.length > 8)  formatted = raw.slice(0, 4) + '-' + raw.slice(4, 8) + '-' + raw.slice(8, 12);
    setCode(formatted);
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">

      {/* Minimal header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          <Link href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft size={14} /> Back to courses
          </Link>
        </div>
      </header>

      {/* Gate card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Course thumbnail / icon */}
          <div className="mb-8 text-center">
            {courseThumbnail ? (
              <img src={courseThumbnail} alt={courseTitle}
                className="w-24 h-24 rounded-2xl object-cover mx-auto shadow-md" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <BookOpen className="w-10 h-10 text-primary" />
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-8">
            {/* Lock icon + heading */}
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                {success
                  ? <CheckCircle2 className="w-6 h-6 text-primary" />
                  : <Lock className="w-5 h-5 text-primary" />
                }
              </div>
            </div>

            {success ? (
              <div className="text-center space-y-2">
                <h1 className="text-xl font-bold text-foreground">Access granted!</h1>
                <p className="text-sm text-muted-foreground">Unlocking your course…</p>
                <div className="mt-4 flex justify-center">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-xl font-bold text-foreground mb-1">Enter your access code</h1>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{courseTitle}</span> requires an access code to view.
                  </p>
                </div>

                {/* Email hint */}
                {userEmail && (
                  <div className="flex items-start gap-3 bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 mb-5 text-sm">
                    <Mail size={15} className="text-primary shrink-0 mt-0.5" />
                    <p className="text-muted-foreground leading-snug">
                      Your access code was sent to{' '}
                      <span className="font-semibold text-foreground">{userEmail}</span>.
                      {' '}Check your inbox (and spam folder).
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <input
                      ref={inputRef}
                      type="text"
                      value={code}
                      onChange={handleCodeChange}
                      placeholder="XXXX-XXXX-XXXX"
                      maxLength={14}
                      autoFocus
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      className={`w-full px-4 py-3.5 text-center text-lg font-mono font-semibold tracking-widest rounded-xl border bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/40 placeholder:font-sans placeholder:text-sm placeholder:tracking-normal ${
                        error ? 'border-destructive bg-destructive/5 ring-2 ring-destructive/20' : 'border-border focus:border-primary'
                      }`}
                    />
                    {error && (
                      <div className="flex items-start gap-2 mt-2 text-sm text-destructive">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || code.replace(/-/g, '').length < 12}
                    className="w-full py-3 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2 justify-center">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Verifying…
                      </span>
                    ) : 'Unlock Course'}
                  </button>
                </form>

                {/* Resend section */}
                <div className="mt-5 pt-5 border-t border-border">
                  <p className="text-xs text-center text-muted-foreground mb-3 leading-relaxed">
                    Can&apos;t find your email? We can resend your code.
                  </p>

                  {resendState === 'sent' ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                      <CheckCircle2 size={15} />
                      Code resent! Check your inbox{userEmail ? ` (${userEmail})` : ''}.
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                        className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl border border-primary/30 text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                      >
                        {resending
                          ? <><span className="w-3.5 h-3.5 border-2 border-primary/40 border-t-primary rounded-full animate-spin" /> Sending…</>
                          : <><RefreshCw size={13} /> Resend access code to email</>
                        }
                      </button>
                      {resendState === 'error' && (
                        <div className="flex items-start gap-2 mt-2 text-xs text-destructive">
                          <AlertCircle size={13} className="shrink-0 mt-0.5" />
                          <span>{resendError}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
