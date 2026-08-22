'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Play, Check, ArrowLeft, Loader2, Video, Users, DollarSign, Zap, Globe } from 'lucide-react';
import { submitCreatorApplication } from '@/app/actions/applications';

type Field = { name: string; email: string; phone: string; socialLink: string; channelName: string; bio: string };
const EMPTY: Field = { name: '', email: '', phone: '', socialLink: '', channelName: '', bio: '' };

const BENEFITS = [
  { icon: Users,       text: 'Your own community page',          sub: 'Branded profile at /creator/you' },
  { icon: DollarSign,  text: 'Keep 90% of every sale',          sub: 'Platform takes just 10%' },
  { icon: Zap,         text: 'Go live in 24 hours',             sub: 'We set everything up for you' },
  { icon: Globe,       text: 'Built for East Africa',           sub: 'MTN & Airtel Money payments built in' },
];

export default function CreatorApplyPage() {
  const [form, setForm]           = useState<Field>(EMPTY);
  const [errors, setErrors]       = useState<Partial<Field>>({});
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [serverErr, setServerErr] = useState('');

  function set(k: keyof Field, v: string) {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
    setServerErr('');
  }

  function validate() {
    const e: Partial<Field> = {};
    if (!form.name.trim())        e.name        = 'Full name is required';
    if (!form.email.trim())       e.email       = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.phone.trim())       e.phone       = 'Phone number is required';
    if (!form.socialLink.trim())  e.socialLink  = 'Add your TikTok or YouTube link';
    if (!form.channelName.trim()) e.channelName = 'Community name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerErr('');
    const res = await submitCreatorApplication(form);
    setLoading(false);
    if (res.success) setDone(true);
    else setServerErr(res.error ?? 'Something went wrong — please try again.');
  }

  /* ── SUCCESS STATE ───────────────────────────────────────────── */
  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F8FF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {/* mini nav */}
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 56, background: '#fff', borderBottom: '1px solid #E5E5F0', display: 'flex', alignItems: 'center', padding: '0 24px', zIndex: 10 }}>
          <Link href="/platform" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src="/images/white-logo.png" alt="ObinAcademy" style={{ height: 28, width: 'auto', filter: 'brightness(0)', opacity: 0.8 }} />
          </Link>
        </div>

        <div style={{ maxWidth: 520, width: '100%', textAlign: 'center', paddingTop: 56 }}>
          {/* Check ring */}
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#0B00FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 8px 32px rgba(11,0,255,0.25)' }}>
            <Check size={34} color="#fff" strokeWidth={2.5} />
          </div>

          <h1 style={{ fontWeight: 800, fontSize: 32, letterSpacing: '-0.03em', color: '#111', margin: '0 0 12px', lineHeight: 1.1 }}>
            Application received!
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: '#555', margin: '0 0 36px' }}>
            Thank you, <strong style={{ color: '#111' }}>{form.name.split(' ')[0]}</strong>. We&apos;ll review your details and reply to{' '}
            <strong style={{ color: '#111' }}>{form.email}</strong> within 2–3 business days.
          </p>

          {/* Steps */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E5E5F0', padding: 28, textAlign: 'left', marginBottom: 32 }}>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0B00FF', margin: '0 0 20px' }}>What happens next</p>
            {[
              'We review your application and social presence',
              'If approved, your community is created and we send you the link',
              'You sign up, set your price, and publish your first class',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: i < 2 ? 16 : 0 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#0B00FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontWeight: 800, fontSize: 12, color: '#fff' }}>{i + 1}</span>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: '#444', margin: 0, paddingTop: 3 }}>{step}</p>
              </div>
            ))}
          </div>

          <Link href="/platform" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: '#0B00FF', textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Back to ObinAcademy
          </Link>
        </div>
      </div>
    );
  }

  /* ── FORM STATE ──────────────────────────────────────────────── */
  const inp = (err?: string): React.CSSProperties => ({
    width: '100%', boxSizing: 'border-box',
    padding: '11px 14px', fontSize: 14, borderRadius: 10,
    border: `1.5px solid ${err ? '#EF4444' : '#E0E0F0'}`,
    background: err ? '#FFF5F5' : '#FAFAFA',
    color: '#111', outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  });

  const label: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#222', display: 'block', marginBottom: 6 };
  const err:   React.CSSProperties = { fontSize: 12, color: '#EF4444', marginTop: 5 };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { font-family: var(--font-geist-sans), system-ui, sans-serif; }
        input:focus, textarea:focus { border-color: #0B00FF !important; background: #fff !important; box-shadow: 0 0 0 3px rgba(11,0,255,0.08); }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .apply-grid { flex-direction: column !important; }
          .apply-left { min-height: auto !important; padding: 32px 24px !important; }
          .apply-right { padding: 28px 20px !important; }
          .apply-right-inner { max-width: 100% !important; }
          .two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* ── NAV ── */}
        <header style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 56, background: '#fff', borderBottom: '1px solid #E5E5F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 50 }}>
          <Link href="/platform" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src="/images/white-logo.png" alt="ObinAcademy" style={{ height: 28, width: 'auto', filter: 'brightness(0)', opacity: 0.8 }} />
          </Link>
          <Link href="/platform" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: '#777', textDecoration: 'none' }}>
            <ArrowLeft size={13} /> Back
          </Link>
        </header>

        {/* ── SPLIT LAYOUT ── */}
        <div className="apply-grid" style={{ flex: 1, display: 'flex', marginTop: 56, minHeight: 'calc(100vh - 56px)' }}>

          {/* LEFT — brand panel */}
          <div className="apply-left" style={{
            width: '42%', flexShrink: 0,
            background: 'linear-gradient(160deg, #0B00FF 0%, #06007A 100%)',
            padding: '60px 48px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            position: 'sticky', top: 56, alignSelf: 'flex-start',
            minHeight: 'calc(100vh - 56px)',
          }}>
            {/* Tag */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(205,251,94,0.15)', border: '1px solid rgba(205,251,94,0.3)', borderRadius: 999, padding: '5px 14px', marginBottom: 28, width: 'fit-content' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#CDFB5E', display: 'block' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#CDFB5E', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Creator application</span>
            </div>

            <h1 style={{ fontWeight: 900, fontSize: 'clamp(28px, 3.5vw, 40px)', letterSpacing: '-0.03em', color: '#fff', margin: '0 0 14px', lineHeight: 1.1 }}>
              Teach on your own terms.
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,0.72)', margin: '0 0 44px', maxWidth: 340 }}>
              Build your community, publish classes, and earn — all on Uganda&apos;s creator platform.
            </p>

            {/* Benefits */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 48 }}>
              {BENEFITS.map(({ icon: Icon, text, sub }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color="#CDFB5E" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#fff', margin: '0 0 2px' }}>{text}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: 0 }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust line */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24 }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                No upfront cost. We review every application personally.
              </p>
            </div>
          </div>

          {/* RIGHT — form */}
          <div className="apply-right" style={{ flex: 1, background: '#F8F8FF', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '52px 40px 80px' }}>
            <div className="apply-right-inner" style={{ width: '100%', maxWidth: 480 }}>

              <h2 style={{ fontWeight: 800, fontSize: 24, letterSpacing: '-0.02em', color: '#111', margin: '0 0 6px' }}>
                Apply to teach
              </h2>
              <p style={{ fontSize: 14, color: '#666', margin: '0 0 32px', lineHeight: 1.6 }}>
                Fill in your details below and we&apos;ll get back to you within 2–3 business days.
              </p>

              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

                {/* Name + Email */}
                <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={label}>Full name <span style={{ color: '#EF4444' }}>*</span></label>
                    <input
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      placeholder="Your full name"
                      style={inp(errors.name)}
                    />
                    {errors.name && <p style={err}>{errors.name}</p>}
                  </div>
                  <div>
                    <label style={label}>Email address <span style={{ color: '#EF4444' }}>*</span></label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      placeholder="you@example.com"
                      style={inp(errors.email)}
                    />
                    {errors.email && <p style={err}>{errors.email}</p>}
                  </div>
                </div>

                {/* Phone + Community name */}
                <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={label}>Phone number <span style={{ color: '#EF4444' }}>*</span></label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                      placeholder="+256 7xx xxx xxx"
                      style={inp(errors.phone)}
                    />
                    {errors.phone && <p style={err}>{errors.phone}</p>}
                  </div>
                  <div>
                    <label style={label}>Community name <span style={{ color: '#EF4444' }}>*</span></label>
                    <input
                      value={form.channelName}
                      onChange={e => set('channelName', e.target.value)}
                      placeholder="e.g. Alex Finance"
                      style={inp(errors.channelName)}
                    />
                    {errors.channelName && <p style={err}>{errors.channelName}</p>}
                  </div>
                </div>

                {/* Social link */}
                <div style={{ marginBottom: 14 }}>
                  <label style={label}>
                    TikTok or YouTube link <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Video size={14} color="#999" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                      value={form.socialLink}
                      onChange={e => set('socialLink', e.target.value)}
                      placeholder="https://tiktok.com/@you  or  https://youtube.com/@you"
                      style={{ ...inp(errors.socialLink), paddingLeft: 36 }}
                    />
                  </div>
                  {errors.socialLink
                    ? <p style={err}>{errors.socialLink}</p>
                    : <p style={{ fontSize: 12, color: '#888', margin: '5px 0 0' }}>We use this to verify your creator presence.</p>
                  }
                </div>

                {/* Bio */}
                <div style={{ marginBottom: 24 }}>
                  <label style={label}>
                    About you{' '}
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#888' }}>(optional)</span>
                  </label>
                  <textarea
                    value={form.bio}
                    onChange={e => set('bio', e.target.value)}
                    placeholder="What do you create? Who is your audience? What classes do you want to offer?"
                    rows={4}
                    style={{ ...inp(), resize: 'vertical', verticalAlign: 'top', lineHeight: 1.6 }}
                  />
                </div>

                {/* Server error */}
                {serverErr && (
                  <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                    <p style={{ fontSize: 14, color: '#DC2626', margin: 0 }}>{serverErr}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '14px 24px',
                    background: loading ? '#9EA0FF' : '#0B00FF',
                    color: '#fff', borderRadius: 12, fontSize: 15, fontWeight: 700,
                    border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: loading ? 'none' : '0 4px 20px rgba(11,0,255,0.3)',
                    transition: 'background 0.2s, box-shadow 0.2s',
                    fontFamily: 'inherit',
                  }}
                >
                  {loading
                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</>
                    : 'Submit application →'
                  }
                </button>

                <p style={{ fontSize: 12, color: '#888', textAlign: 'center', margin: '14px 0 0', lineHeight: 1.5 }}>
                  By submitting you agree that we may review your public social profile as part of our vetting process.
                </p>
              </form>

              {/* Trust strip */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 20px', marginTop: 28, paddingTop: 24, borderTop: '1px solid #E5E5F0' }}>
                {['Free to apply', 'Reply in 2–3 days', 'No upfront cost'].map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#0B00FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={9} color="#fff" strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
