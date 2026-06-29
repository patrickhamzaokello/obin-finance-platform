'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Play, Check, ArrowLeft, Loader2, Video } from 'lucide-react';
import { submitCreatorApplication } from '@/app/actions/applications';

const C = {
  ink:       '#0B1411',
  muted:     '#57655D',
  green:     '#0E9F6E',
  deepBg:    '#0A3D2E',
  greenText: '#0A6B4A',
  lime:      '#CDFB5E',
  surface2:  '#F4F7F5',
  surface3:  '#F0F7F3',
  border:    '#E6ECE8',
  border2:   '#D9EAE1',
};

type Field = { name: string; email: string; phone: string; socialLink: string; channelName: string; bio: string };
const EMPTY: Field = { name: '', email: '', phone: '', socialLink: '', channelName: '', bio: '' };

export default function CreatorApplyPage() {
  const [form, setForm]       = useState<Field>(EMPTY);
  const [errors, setErrors]   = useState<Partial<Field>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
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
    if (!form.channelName.trim()) e.channelName = 'Channel / creator name is required';
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
    if (res.success) {
      setDone(true);
    } else {
      setServerErr(res.error ?? 'Something went wrong — please try again.');
    }
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.surface3, border: `2px solid ${C.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
            <Check size={32} color={C.green} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontFamily: 'Sora, system-ui, sans-serif', fontWeight: 800, fontSize: 32, letterSpacing: '-0.02em', color: C.ink, margin: '0 0 14px' }}>
            Application received!
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: C.muted, margin: '0 0 32px' }}>
            Thank you, <strong style={{ color: C.ink }}>{form.name.split(' ')[0]}</strong>. We&apos;ll review your details and get back to you at <strong style={{ color: C.ink }}>{form.email}</strong> within 2–3 business days.
          </p>
          <div style={{ background: C.surface2, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, textAlign: 'left', marginBottom: 32 }}>
            <p style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.greenText, margin: '0 0 12px' }}>What happens next?</p>
            {['We review your application and social presence','If approved, your creator channel is set up and we send you the link','You sign up, set your password, and start building your first course'].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: i < 2 ? 12 : 0 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <span style={{ fontFamily: 'Sora, system-ui', fontWeight: 800, fontSize: 11, color: '#fff' }}>{i + 1}</span>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: C.muted, margin: 0 }}>{step}</p>
              </div>
            ))}
          </div>
          <Link href="/" style={{ fontSize: 14, fontWeight: 600, color: C.greenText, textDecoration: 'none' }}>← Back to home</Link>
        </div>
      </div>
    );
  }

  const inputStyle = (err?: string): React.CSSProperties => ({
    width: '100%', boxSizing: 'border-box',
    padding: '12px 14px', fontSize: 15, borderRadius: 10,
    border: `1px solid ${err ? '#E53E3E' : C.border2}`,
    background: err ? '#FFF5F5' : '#fff',
    color: C.ink, outline: 'none',
    fontFamily: 'Manrope, system-ui, sans-serif',
  });
  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: C.ink, display: 'block', marginBottom: 6 };
  const errStyle: React.CSSProperties  = { fontSize: 12, color: '#E53E3E', marginTop: 4 };

  return (
    <div style={{ minHeight: '100vh', background: C.surface2 }}>

      {/* Mini nav */}
      <header style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Play size={13} fill="#fff" color="#fff" />
          </div>
          <span style={{ fontFamily: 'Sora, system-ui', fontWeight: 800, fontSize: 15, color: C.ink }}>Pkasemer</span>
        </Link>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: C.muted, textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Back
        </Link>
      </header>

      <main style={{ maxWidth: 620, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.surface3, border: `1px solid ${C.border2}`, borderRadius: 999, padding: '5px 12px', marginBottom: 16 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: C.greenText, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Creator application</span>
          </div>
          <h1 style={{ fontFamily: 'Sora, system-ui, sans-serif', fontWeight: 800, fontSize: 32, letterSpacing: '-0.02em', color: C.ink, margin: '0 0 12px', lineHeight: 1.1 }}>
            Apply to become a creator
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: C.muted, margin: 0 }}>
            We review every application personally. If you&apos;re approved, we&apos;ll set up your creator channel and send you the link to get started.
          </p>
        </div>

        {/* Form card */}
        <form onSubmit={submit} style={{ background: '#fff', borderRadius: 20, border: `1px solid ${C.border}`, padding: 32 }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Full name <span style={{ color: '#E53E3E' }}>*</span></label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your full name" style={inputStyle(errors.name)} />
              {errors.name && <p style={errStyle}>{errors.name}</p>}
            </div>
            <div>
              <label style={labelStyle}>Email address <span style={{ color: '#E53E3E' }}>*</span></label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" style={inputStyle(errors.email)} />
              {errors.email && <p style={errStyle}>{errors.email}</p>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Phone number <span style={{ color: '#E53E3E' }}>*</span></label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+256 7xx xxx xxx" style={inputStyle(errors.phone)} />
              {errors.phone && <p style={errStyle}>{errors.phone}</p>}
            </div>
            <div>
              <label style={labelStyle}>Creator / channel name <span style={{ color: '#E53E3E' }}>*</span></label>
              <input value={form.channelName} onChange={e => set('channelName', e.target.value)} placeholder="e.g. Alex Finance" style={inputStyle(errors.channelName)} />
              {errors.channelName && <p style={errStyle}>{errors.channelName}</p>}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              TikTok or YouTube link <span style={{ color: '#E53E3E' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Video size={15} color={C.muted} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input value={form.socialLink} onChange={e => set('socialLink', e.target.value)}
                placeholder="https://tiktok.com/@yourchannel or https://youtube.com/@..."
                style={{ ...inputStyle(errors.socialLink), paddingLeft: 36 }} />
            </div>
            {errors.socialLink && <p style={errStyle}>{errors.socialLink}</p>}
            <p style={{ fontSize: 12, color: C.muted, margin: '6px 0 0' }}>We use this to verify your creator presence.</p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Tell us about yourself <span style={{ fontSize: 12, fontWeight: 500, color: C.muted }}>(optional)</span></label>
            <textarea value={form.bio} onChange={e => set('bio', e.target.value)}
              placeholder="What do you create? Who is your audience? What courses do you want to offer?"
              rows={4}
              style={{ ...inputStyle(), resize: 'vertical', verticalAlign: 'top', lineHeight: 1.6 }} />
          </div>

          {serverErr && (
            <div style={{ background: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
              <p style={{ fontSize: 14, color: '#C53030', margin: 0 }}>{serverErr}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '15px 24px', background: loading ? C.muted : C.green, color: '#fff', borderRadius: 12, fontSize: 15, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Manrope, system-ui', boxShadow: loading ? 'none' : '0 6px 20px rgba(14,159,110,.28)', transition: 'background 0.2s' }}>
            {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</> : 'Submit my application →'}
          </button>

          <p style={{ fontSize: 12, color: C.muted, textAlign: 'center', margin: '16px 0 0' }}>
            By submitting you agree that we may review your public social profile as part of the vetting process.
          </p>
        </form>

        {/* Trust strip */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20, marginTop: 28 }}>
          {['We review within 2–3 business days','No payment required to apply','Your own channel, your rules'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Check size={12} color={C.green} strokeWidth={3} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>{t}</span>
            </div>
          ))}
        </div>
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
