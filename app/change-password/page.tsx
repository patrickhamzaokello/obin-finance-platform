'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';

export default function ChangePasswordPage() {
  const [current, setCurrent]   = useState('');
  const [next, setNext]         = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showCur, setShowCur]   = useState(false);
  const [showNew, setShowNew]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (next.length < 8) { setError('New password must be at least 8 characters'); return; }
    if (next !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    const { error: err } = await authClient.changePassword({
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: false,
    });
    setLoading(false);
    if (err) { setError(err.message ?? 'Failed to change password'); return; }

    // Clear the mustChangePassword flag via API
    await fetch('/api/auth/clear-must-change', { method: 'POST' });
    setDone(true);
    setTimeout(() => { window.location.href = '/studio'; }, 2000);
  }

  const inp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '11px 14px', fontSize: 14, borderRadius: 10,
    border: '1.5px solid #E0E0F0', background: '#FAFAFA',
    color: '#111', outline: 'none', fontFamily: 'inherit',
  };

  if (done) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F8FF' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <CheckCircle size={48} color="#059669" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: '0 0 8px' }}>Password updated!</h2>
          <p style={{ color: '#666', fontSize: 15 }}>Taking you to your studio…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        input:focus { border-color: #0B00FF !important; background: #fff !important; box-shadow: 0 0 0 3px rgba(11,0,255,0.08) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{ minHeight: '100vh', background: '#F8F8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Icon */}
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#EEEEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Lock size={24} color="#0B00FF" />
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', margin: '0 0 6px', letterSpacing: '-0.025em' }}>Set your password</h1>
          <p style={{ fontSize: 14, color: '#666', margin: '0 0 32px', lineHeight: 1.6 }}>
            You signed in with a temporary password. Please set a permanent one before continuing.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#222', display: 'block', marginBottom: 6 }}>Current (temporary) password</label>
              <div style={{ position: 'relative' }}>
                <input type={showCur ? 'text' : 'password'} value={current} onChange={e => setCurrent(e.target.value)}
                  placeholder="Your temp password" required autoComplete="current-password"
                  style={{ ...inp, paddingRight: 44 }} />
                <button type="button" onClick={() => setShowCur(s => !s)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                  {showCur ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#222', display: 'block', marginBottom: 6 }}>New password</label>
              <div style={{ position: 'relative' }}>
                <input type={showNew ? 'text' : 'password'} value={next} onChange={e => setNext(e.target.value)}
                  placeholder="At least 8 characters" required autoComplete="new-password"
                  style={{ ...inp, paddingRight: 44 }} />
                <button type="button" onClick={() => setShowNew(s => !s)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#222', display: 'block', marginBottom: 6 }}>Confirm new password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat new password" required autoComplete="new-password" style={inp} />
            </div>

            {/* Strength hint */}
            {next.length > 0 && (
              <div style={{ display: 'flex', gap: 4 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: next.length >= i * 3 ? (next.length >= 12 ? '#059669' : next.length >= 8 ? '#D97706' : '#EF4444') : '#E5E5F0' }} />
                ))}
              </div>
            )}

            {error && (
              <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px' }}>
                <p style={{ fontSize: 13, color: '#DC2626', margin: 0 }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '13px 24px', background: loading ? '#9EA0FF' : '#0B00FF', color: '#fff', borderRadius: 11, fontSize: 15, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: loading ? 'none' : '0 4px 20px rgba(11,0,255,0.28)', fontFamily: 'inherit', marginTop: 4 }}>
              {loading
                ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Saving…</>
                : 'Set password & continue →'
              }
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
