'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, BookOpen, Users, Award } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { getPostSignInRedirect } from '@/app/actions/auth';
import type { Metadata } from 'next';

// Note: metadata export won't work in a 'use client' component.
// Title is set via the layout or a separate metadata file.

const FEATURES = [
  { icon: BookOpen, text: 'Access all your classes',       sub: 'Pick up right where you left off' },
  { icon: Users,    text: 'Connect with communities',      sub: 'Learn alongside thousands of others' },
  { icon: Award,    text: 'Track your progress',           sub: 'Earn certificates as you complete classes' },
];

interface Props {
  searchParams?: { next?: string; courseTitle?: string };
}

export default function SignInPage() {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: authErr } = await authClient.signIn.email({ email, password });
    if (authErr) {
      setLoading(false);
      setError(authErr.message ?? 'Invalid email or password');
      return;
    }
    // Redirect school admins to studio, everyone else to dashboard
    const { redirect } = await getPostSignInRedirect();
    window.location.href = redirect;
  }

  const inp = (hasErr = false): React.CSSProperties => ({
    width: '100%', boxSizing: 'border-box',
    padding: '11px 14px', fontSize: 14, borderRadius: 10,
    border: `1.5px solid ${hasErr ? '#EF4444' : '#E0E0F0'}`,
    background: hasErr ? '#FFF5F5' : '#FAFAFA',
    color: '#111', outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  });

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { font-family: var(--font-geist-sans), system-ui, sans-serif; margin: 0; }
        input:focus { border-color: #0B00FF !important; background: #fff !important; box-shadow: 0 0 0 3px rgba(11,0,255,0.08) !important; outline: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .auth-grid   { flex-direction: column !important; }
          .auth-left   { display: none !important; }
          .auth-right  { padding: 32px 20px !important; min-height: 100vh; justify-content: flex-start !important; padding-top: 40px !important; }
          .auth-card   { max-width: 100% !important; }
        }
      `}</style>

      <div className="auth-grid" style={{ display: 'flex', minHeight: '100vh' }}>

        {/* ── LEFT PANEL ── */}
        <div className="auth-left" style={{
          width: '44%', flexShrink: 0,
          background: 'linear-gradient(160deg, #0B00FF 0%, #06007A 100%)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '60px 52px',
          position: 'sticky', top: 0, height: '100vh',
        }}>
          {/* Logo */}
          <Link href="/platform" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', marginBottom: 64 }}>
            <img src="/images/white-logo.png" alt="ObinAcademy" style={{ height: 32, width: 'auto' }} />
          </Link>

          <div style={{ marginBottom: 48 }}>
            <h1 style={{ fontWeight: 900, fontSize: 'clamp(30px, 3vw, 42px)', letterSpacing: '-0.03em', color: '#fff', margin: '0 0 14px', lineHeight: 1.1 }}>
              Welcome back.
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,0.65)', margin: 0, maxWidth: 320 }}>
              Your classes, progress, and community are waiting for you.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {FEATURES.map(({ icon: Icon, text, sub }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(205,251,94,0.12)', border: '1px solid rgba(205,251,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color="#CDFB5E" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#fff', margin: '0 0 2px' }}>{text}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Decorative quote */}
          <div style={{ marginTop: 56, padding: '20px 24px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14 }}>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.7)', margin: '0 0 12px', fontStyle: 'italic' }}>
              &ldquo;I completed three finance classes in a month. The best investment I made this year.&rdquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#CDFB5E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: '#0B00FF' }}>A</div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#fff', margin: 0 }}>Amara K.</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: 0 }}>Learner · Kampala</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="auth-right" style={{ flex: 1, background: '#F8F8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' }}>
          <div className="auth-card" style={{ width: '100%', maxWidth: 420 }}>

            {/* Mobile logo */}
            <div style={{ display: 'none' }} className="mobile-logo">
              <Link href="/platform" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', marginBottom: 32 }}>
                <img src="/images/white-logo.png" alt="ObinAcademy" style={{ height: 28, width: 'auto', filter: 'brightness(0)' }} />
              </Link>
            </div>

            <h2 style={{ fontWeight: 800, fontSize: 26, letterSpacing: '-0.025em', color: '#111', margin: '0 0 6px' }}>Sign in</h2>
            <p style={{ fontSize: 14, color: '#666', margin: '0 0 32px', lineHeight: 1.5 }}>
              New to ObinAcademy?{' '}
              <Link href="/sign-up" style={{ color: '#0B00FF', fontWeight: 600, textDecoration: 'none' }}>Create a free account →</Link>
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#222', display: 'block', marginBottom: 6 }}>Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  style={inp(!!error)}
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>Password</label>
                  <Link href="/forgot-password" style={{ fontSize: 12, color: '#0B00FF', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="Your password"
                    required
                    autoComplete="current-password"
                    style={{ ...inp(!!error), paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 2 }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px' }}>
                  <p style={{ fontSize: 13, color: '#DC2626', margin: 0 }}>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '13px 24px',
                  background: loading ? '#9EA0FF' : '#0B00FF',
                  color: '#fff', borderRadius: 11, fontSize: 15, fontWeight: 700,
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(11,0,255,0.28)',
                  transition: 'background 0.15s',
                  fontFamily: 'inherit',
                  marginTop: 4,
                }}
              >
                {loading
                  ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Signing in…</>
                  : 'Sign in'
                }
              </button>
            </form>

            <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid #E5E5F0', textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
                Don&apos;t have an account?{' '}
                <Link href="/sign-up" style={{ color: '#0B00FF', fontWeight: 600, textDecoration: 'none' }}>Sign up free</Link>
              </p>
            </div>

            <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', margin: '16px 0 0', lineHeight: 1.5 }}>
              By signing in you agree to our{' '}
              <Link href="/contact" style={{ color: '#888', textDecoration: 'underline' }}>terms</Link>
              {' '}and{' '}
              <Link href="/contact" style={{ color: '#888', textDecoration: 'underline' }}>privacy policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
