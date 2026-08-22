'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Eye, EyeOff, Lock, CheckCircle, AlertTriangle } from 'lucide-react';

function ResetPasswordForm() {
  const params = useSearchParams();
  const token  = params.get('token') ?? '';

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [done, setDone]           = useState(false);

  useEffect(() => {
    if (!token) setError('Invalid or missing reset link. Please request a new one.');
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    const { error: err } = await authClient.resetPassword({ newPassword: password, token });
    setLoading(false);
    if (err) { setError(err.message ?? 'Reset failed. The link may have expired — request a new one.'); return; }
    setDone(true);
    setTimeout(() => { window.location.href = '/sign-in'; }, 2500);
  }

  const inp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '11px 14px', fontSize: 14, borderRadius: 10,
    border: '1.5px solid #E0E0F0', background: '#FAFAFA',
    color: '#111', outline: 'none', fontFamily: 'inherit',
  };

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={28} color="#059669" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: '0 0 8px' }}>Password reset!</h2>
        <p style={{ color: '#666', fontSize: 15 }}>Taking you to sign in…</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <AlertTriangle size={40} color="#D97706" style={{ marginBottom: 16 }} />
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: '0 0 8px' }}>Invalid reset link</h2>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>This link is invalid or has expired.</p>
        <a href="/forgot-password" style={{ display: 'inline-block', background: '#0B00FF', color: '#fff', textDecoration: 'none', fontWeight: 700, padding: '12px 28px', borderRadius: 10, fontSize: 14 }}>Request a new link →</a>
      </div>
    );
  }

  return (
    <>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: '#EEEEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Lock size={24} color="#0B00FF" />
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', margin: '0 0 6px', letterSpacing: '-0.025em' }}>Set new password</h1>
      <p style={{ fontSize: 14, color: '#666', margin: '0 0 32px', lineHeight: 1.6 }}>
        Choose a strong password you haven't used before.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#222', display: 'block', marginBottom: 6 }}>New password</label>
          <div style={{ position: 'relative' }}>
            <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters" required autoComplete="new-password"
              style={{ ...inp, paddingRight: 44 }} />
            <button type="button" onClick={() => setShowPw(s => !s)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {password.length > 0 && (
          <div style={{ display: 'flex', gap: 4 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: password.length >= i * 3 ? (password.length >= 12 ? '#059669' : password.length >= 8 ? '#D97706' : '#EF4444') : '#E5E5F0' }} />
            ))}
          </div>
        )}

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#222', display: 'block', marginBottom: 6 }}>Confirm password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat your new password" required autoComplete="new-password" style={inp} />
        </div>

        {error && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px' }}>
            <p style={{ fontSize: 13, color: '#DC2626', margin: 0 }}>{error}</p>
          </div>
        )}

        <button type="submit" disabled={loading || !token}
          style={{ width: '100%', padding: '13px 24px', background: loading ? '#9EA0FF' : '#0B00FF', color: '#fff', borderRadius: 11, fontSize: 15, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: loading ? 'none' : '0 4px 20px rgba(11,0,255,0.28)', fontFamily: 'inherit' }}>
          {loading
            ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Saving…</>
            : 'Save new password →'
          }
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <style>{`
        input:focus { border-color: #0B00FF !important; background: #fff !important; box-shadow: 0 0 0 3px rgba(11,0,255,0.08) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{ minHeight: '100vh', background: '#F8F8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <Suspense fallback={<div style={{ color: '#666', fontSize: 14 }}>Loading…</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </>
  );
}
