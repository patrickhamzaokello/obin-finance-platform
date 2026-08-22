'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forget-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectTo: `${window.location.origin}/reset-password` }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? 'Something went wrong. Please try again.');
      }
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '11px 14px', fontSize: 14, borderRadius: 10,
    border: '1.5px solid #E0E0F0', background: '#FAFAFA',
    color: '#111', outline: 'none', fontFamily: 'inherit',
  };

  return (
    <>
      <style>{`
        input:focus { border-color: #0B00FF !important; background: #fff !important; box-shadow: 0 0 0 3px rgba(11,0,255,0.08) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{ minHeight: '100vh', background: '#F8F8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          <Link href="/sign-in" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#666', textDecoration: 'none', marginBottom: 28 }}>
            <ArrowLeft size={14} /> Back to sign in
          </Link>

          {sent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle size={28} color="#059669" />
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: '0 0 10px' }}>Check your inbox</h1>
              <p style={{ fontSize: 15, color: '#555', lineHeight: 1.6, margin: '0 0 24px' }}>
                We sent a password reset link to <strong>{email}</strong>. It expires in 1 hour.
              </p>
              <p style={{ fontSize: 13, color: '#999' }}>
                Didn't get it? Check spam, or{' '}
                <button onClick={() => setSent(false)} style={{ background: 'none', border: 'none', color: '#0B00FF', fontWeight: 600, cursor: 'pointer', fontSize: 13, padding: 0 }}>
                  try again
                </button>.
              </p>
            </div>
          ) : (
            <>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: '#EEEEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Mail size={24} color="#0B00FF" />
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', margin: '0 0 6px', letterSpacing: '-0.025em' }}>Forgot password?</h1>
              <p style={{ fontSize: 14, color: '#666', margin: '0 0 32px', lineHeight: 1.6 }}>
                Enter the email you signed up with and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#222', display: 'block', marginBottom: 6 }}>Email address</label>
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="you@example.com" required autoComplete="email" style={inp} />
                </div>

                {error && (
                  <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px' }}>
                    <p style={{ fontSize: 13, color: '#DC2626', margin: 0 }}>{error}</p>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '13px 24px', background: loading ? '#9EA0FF' : '#0B00FF', color: '#fff', borderRadius: 11, fontSize: 15, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: loading ? 'none' : '0 4px 20px rgba(11,0,255,0.28)', fontFamily: 'inherit' }}>
                  {loading
                    ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Sending…</>
                    : 'Send reset link →'
                  }
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
