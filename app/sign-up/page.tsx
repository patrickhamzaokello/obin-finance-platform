'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Zap, Shield, CreditCard } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

const PERKS = [
  { icon: Zap,        text: 'Start learning immediately',   sub: 'Access classes the moment you enroll' },
  { icon: CreditCard, text: 'Pay with MTN or Airtel Money', sub: 'No bank card required' },
  { icon: Shield,     text: 'Certificates included',        sub: 'Earn proof of completion for every class' },
];

export default function SignUpPage() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors]     = useState<{ name?: string; email?: string; password?: string; server?: string }>({});
  const [loading, setLoading]   = useState(false);

  function validate() {
    const e: typeof errors = {};
    if (!name.trim())     e.name     = 'Your name is required';
    if (!email.trim())    e.email    = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    if (password.length < 8) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { error: authErr } = await authClient.signUp.email({ email, password, name });
    if (authErr) {
      setLoading(false);
      setErrors({ server: authErr.message ?? 'Something went wrong' });
      return;
    }
    window.location.href = '/learn/dashboard';
  }

  const inp = (fieldErr?: string): React.CSSProperties => ({
    width: '100%', boxSizing: 'border-box',
    padding: '11px 14px', fontSize: 14, borderRadius: 10,
    border: `1.5px solid ${fieldErr ? '#EF4444' : '#E0E0F0'}`,
    background: fieldErr ? '#FFF5F5' : '#FAFAFA',
    color: '#111', outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  });

  const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#222', display: 'block', marginBottom: 6 };
  const errTxt: React.CSSProperties = { fontSize: 12, color: '#EF4444', margin: '5px 0 0' };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { font-family: var(--font-geist-sans), system-ui, sans-serif; margin: 0; }
        input:focus { border-color: #0B00FF !important; background: #fff !important; box-shadow: 0 0 0 3px rgba(11,0,255,0.08) !important; outline: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .auth-grid  { flex-direction: column !important; }
          .auth-left  { display: none !important; }
          .auth-right { padding: 32px 20px !important; min-height: 100vh; }
          .auth-card  { max-width: 100% !important; }
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
            {/* Pill */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(205,251,94,0.12)', border: '1px solid rgba(205,251,94,0.25)', borderRadius: 999, padding: '5px 12px', marginBottom: 20 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#CDFB5E', display: 'block' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#CDFB5E', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Free to join</span>
            </div>

            <h1 style={{ fontWeight: 900, fontSize: 'clamp(28px, 3vw, 40px)', letterSpacing: '-0.03em', color: '#fff', margin: '0 0 14px', lineHeight: 1.1 }}>
              Learn from Uganda&apos;s top creators.
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,0.65)', margin: 0, maxWidth: 320 }}>
              Join thousands of learners discovering finance, tech, and business — taught by East Africa&apos;s best.
            </p>
          </div>

          {/* Perks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, marginBottom: 52 }}>
            {PERKS.map(({ icon: Icon, text, sub }) => (
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

          {/* Learner count strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Avatar stack */}
            <div style={{ display: 'flex' }}>
              {['#CDFB5E', '#A78BFA', '#F472B6', '#34D399'].map((bg, i) => (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: bg, border: '2px solid #0B00FF',
                  marginLeft: i === 0 ? 0 : -8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 10, color: '#0B00FF',
                  zIndex: 4 - i,
                }}>
                  {['A', 'B', 'C', 'D'][i]}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              <strong style={{ color: '#CDFB5E' }}>1,200+</strong> learners already enrolled
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="auth-right" style={{ flex: 1, background: '#F8F8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' }}>
          <div className="auth-card" style={{ width: '100%', maxWidth: 420 }}>

            <h2 style={{ fontWeight: 800, fontSize: 26, letterSpacing: '-0.025em', color: '#111', margin: '0 0 6px' }}>Create your account</h2>
            <p style={{ fontSize: 14, color: '#666', margin: '0 0 32px', lineHeight: 1.5 }}>
              Already have an account?{' '}
              <Link href="/sign-in" style={{ color: '#0B00FF', fontWeight: 600, textDecoration: 'none' }}>Sign in →</Link>
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Name */}
              <div>
                <label style={lbl}>Full name</label>
                <input
                  value={name}
                  onChange={e => { setName(e.target.value); setErrors(v => ({ ...v, name: '' })); }}
                  placeholder="Your full name"
                  required
                  autoComplete="name"
                  style={inp(errors.name)}
                />
                {errors.name && <p style={errTxt}>{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label style={lbl}>Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(v => ({ ...v, email: '', server: '' })); }}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  style={inp(errors.email)}
                />
                {errors.email && <p style={errTxt}>{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label style={lbl}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(v => ({ ...v, password: '' })); }}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    style={{ ...inp(errors.password), paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 2 }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p style={errTxt}>{errors.password}</p>}

                {/* Strength hint */}
                {password.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                    {[1, 2, 3, 4].map(i => {
                      const strength = password.length >= 12 ? 4 : password.length >= 10 ? 3 : password.length >= 8 ? 2 : 1;
                      return (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? (strength >= 3 ? '#22C55E' : strength === 2 ? '#F59E0B' : '#EF4444') : '#E5E5F0', transition: 'background 0.2s' }} />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Server error */}
              {errors.server && (
                <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px' }}>
                  <p style={{ fontSize: 13, color: '#DC2626', margin: 0 }}>{errors.server}</p>
                </div>
              )}

              {/* Submit */}
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
                  ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Creating account…</>
                  : 'Create account'
                }
              </button>
            </form>

            <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', margin: '20px 0 0', lineHeight: 1.6 }}>
              By creating an account you agree to our{' '}
              <Link href="/contact" style={{ color: '#888', textDecoration: 'underline' }}>terms</Link>
              {' '}and{' '}
              <Link href="/contact" style={{ color: '#888', textDecoration: 'underline' }}>privacy policy</Link>.
            </p>

            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #E5E5F0', textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
                Already have an account?{' '}
                <Link href="/sign-in" style={{ color: '#0B00FF', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
