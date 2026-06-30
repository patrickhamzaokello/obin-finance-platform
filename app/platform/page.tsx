import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Pkasemer — The Creator Course Platform' };

import { isPlatformOwner } from '@/lib/school-context';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Sora, Manrope } from 'next/font/google';
import { Check, ArrowRight, Star, Play, Award, TrendingUp, Users, Zap, Globe, Shield } from 'lucide-react';

const sora    = Sora({ subsets: ['latin'], weight: ['500','600','700','800'], variable: '--font-sora',    display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], weight: ['400','500','600','700','800'], variable: '--font-manrope', display: 'swap' });

const C = {
  ink:       '#0B1411',
  ink2:      '#1A2620',
  muted:     '#57655D',
  muted2:    '#8A968F',
  green:     '#0E9F6E',
  deepBg:    '#0A3D2E',
  deepCard:  '#0C4836',
  greenText: '#0A6B4A',
  lime:      '#CDFB5E',
  surface2:  '#F4F7F5',
  surface3:  '#F0F7F3',
  border:    '#E6ECE8',
  border2:   '#D9EAE1',
};

export default async function PlatformLandingPage() {
  if (await isPlatformOwner()) redirect('/platform/admin');

  const fonts = `${sora.variable} ${manrope.variable}`;

  const features = [
    { icon: Globe,      title: 'Your own creator channel',    desc: 'Get a branded subdomain (you.pkasemer.app) with your logo, bio, and course catalogue — all in one link.' },
    { icon: Play,       title: 'Video & PDF courses',         desc: 'Upload videos or embed YouTube. Attach PDFs. Organise everything into modules your learners can follow step by step.' },
    { icon: Award,      title: 'Auto certificates',           desc: 'Learners who complete your course automatically receive a branded certificate — zero admin on your end.' },
    { icon: TrendingUp, title: 'Built-in monetisation',       desc: 'Set prices in your local currency, apply discounts, and get paid — the platform handles the rest.' },
    { icon: Users,      title: 'Learner management',          desc: 'See who your learners are, track their progress, and manage access codes for gifted or promotional enrolments.' },
    { icon: Zap,        title: 'Instant creator studio',      desc: 'A clean Creator Studio dashboard gives you live stats, course drafts, and learner activity — no setup required.' },
  ];

  const steps = [
    { n: '01', title: 'Create your channel', body: 'Sign up, choose your slug, upload your logo and banner. Your public profile is live in minutes.' },
    { n: '02', title: 'Build your course',   body: 'Add modules, upload videos, attach PDFs. Set a price or make it free. Publish when ready.' },
    { n: '03', title: 'Grow your audience',  body: 'Share your channel link. Learners sign up, enrol, and earn certificates — you earn revenue.' },
  ];

  const testimonials = [
    { quote: 'I launched my first paid course in one afternoon. The Creator Studio is genuinely the simplest tool I have ever used.', name: 'Alex M.', role: 'Finance creator' },
    { quote: 'My students love getting a certificate at the end. Completion rates went up the moment I turned that feature on.', name: 'Priya K.', role: 'Tech educator' },
    { quote: 'Having my own subdomain makes the whole thing feel professional — learners take it more seriously than a generic link.', name: 'David O.', role: 'Business coach' },
  ];

  return (
    <div className={fonts} style={{ fontFamily: 'var(--font-manrope), system-ui, sans-serif', color: C.ink, background: '#fff' }}>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Play size={16} fill="#fff" color="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 17, color: C.ink, letterSpacing: '-0.02em' }}>Pkasemer</span>
          </div>

          {/* Center links */}
          <nav style={{ display: 'flex', gap: 4 }} className="hidden sm:flex">
            {[['#features','Features'],['#how-it-works','How it works'],['#testimonials','Stories']].map(([href, label]) => (
              <a key={href} href={href} style={{ padding: '6px 14px', fontSize: 14, fontWeight: 600, color: C.muted, borderRadius: 8, textDecoration: 'none' }}>{label}</a>
            ))}
          </nav>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/sign-in" style={{ padding: '9px 16px', fontSize: 14, fontWeight: 600, color: C.muted, textDecoration: 'none' }}>Creator login</Link>
            <Link href="/platform/apply" style={{ padding: '9px 20px', background: C.green, color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: `0 6px 20px rgba(14,159,110,.28)` }}>
              Apply to create →
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 80px', display: 'flex', flexWrap: 'wrap', gap: 64, alignItems: 'center' }}>
        {/* Left */}
        <div style={{ flex: '1 1 420px', minWidth: 300 }}>
          {/* Eyebrow */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.surface3, border: `1px solid ${C.border2}`, borderRadius: 999, padding: '6px 14px', marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: C.greenText, letterSpacing: '0.08em', textTransform: 'uppercase' }}>The creator course platform</span>
          </div>

          {/* H1 */}
          <h1 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 'clamp(38px,5.5vw,60px)', lineHeight: 1.03, letterSpacing: '-0.03em', color: C.ink, margin: '0 0 24px' }}>
            Share your knowledge.<br />
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{ position: 'relative', zIndex: 1 }}>Earn from what you know.</span>
              <span style={{ position: 'absolute', bottom: 4, left: -2, right: -2, height: '32%', background: C.lime, zIndex: 0, borderRadius: 4 }} />
            </span>
          </h1>

          {/* Sub */}
          <p style={{ fontSize: 18, lineHeight: 1.65, color: C.muted, margin: '0 0 36px', maxWidth: 500 }}>
            Pkasemer gives creators their own branded channel, course builder, and learning community — with payments and certificates built in.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 40 }}>
            <Link href="/platform/apply"
              style={{ padding: '15px 32px', background: C.green, color: '#fff', borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: `0 6px 20px rgba(14,159,110,.28)`, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Apply to become a creator →
            </Link>
            <a href="#features"
              style={{ padding: '15px 32px', background: '#fff', color: C.ink, borderRadius: 12, fontSize: 15, fontWeight: 600, textDecoration: 'none', border: `1px solid ${C.border2}` }}>
              See how it works
            </a>
          </div>

          {/* Trust */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Free to start — no credit card required','Your own subdomain in minutes','Learners earn certificates, you earn revenue'].map((t) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.surface3, border: `1px solid ${C.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={11} color={C.green} strokeWidth={3} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.ink2 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: creator character illustration */}
        <div style={{ flex: '1 1 440px', minWidth: 320, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img src="/images/creator-hero.png" alt="Happy creator with laptop pointing at a course" style={{ width: '100%', maxWidth: 600, height: 'auto', display: 'block' }} />
        </div>
      </section>

      {/* ── VALUE STRIP ─────────────────────────────────────────────────── */}
      <div style={{ background: C.surface2, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '18px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '8px 0' }}>
          {['Creator-first','Built-in payments','Custom subdomain','Auto certificates','Learner management','Video & PDF courses'].map((pill, i, arr) => (
            <span key={pill} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>{pill}</span>
              {i < arr.length - 1 && <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.green, margin: '0 8px' }} />}
            </span>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.surface3, border: `1px solid ${C.border2}`, borderRadius: 999, padding: '6px 14px', marginBottom: 20 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: C.greenText, letterSpacing: '0.08em', textTransform: 'uppercase' }}>How it works</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 'clamp(28px,4vw,40px)', letterSpacing: '-0.02em', color: C.ink, margin: 0 }}>
              From creator to earning in three steps
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24 }}>
            {steps.map(({ n, title, body }) => (
              <div key={n} style={{ background: C.surface2, borderRadius: 20, padding: '36px 32px', border: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 64, color: C.green, opacity: .08, lineHeight: 1, position: 'absolute', top: 16, right: 24 }}>{n}</div>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: C.surface3, border: `1px solid ${C.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 14, color: C.greenText }}>{n}</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 20, color: C.ink, margin: '0 0 12px' }}>{title}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: C.muted, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section id="features" style={{ background: C.surface2, padding: '96px 24px', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${C.border2}`, borderRadius: 999, padding: '6px 14px', marginBottom: 20 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: C.greenText, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Features</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 'clamp(28px,4vw,40px)', letterSpacing: '-0.02em', color: C.ink, margin: '0 0 16px' }}>
              Everything a creator needs
            </h2>
            <p style={{ fontSize: 17, color: C.muted, maxWidth: 500, margin: '0 auto' }}>
              One platform, zero plugins. Everything to build, sell, and grow your course business.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ background: '#fff', borderRadius: 20, padding: '28px 28px', border: `1px solid ${C.border}` }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: C.surface3, border: `1px solid ${C.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <Icon size={19} color={C.green} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 17, color: C.ink, margin: '0 0 10px' }}>{title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: C.muted, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IS THIS FOR YOU ─────────────────────────────────────────────── */}
      <section style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 64, alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 380px', minWidth: 280 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.surface3, border: `1px solid ${C.border2}`, borderRadius: 999, padding: '6px 14px', marginBottom: 20 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: C.greenText, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Who is this for?</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 'clamp(26px,3.5vw,38px)', letterSpacing: '-0.02em', color: C.ink, margin: '0 0 18px', lineHeight: 1.1 }}>
              Built for people who have something to teach
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: C.muted }}>
              Whether you&apos;re a coach, educator, influencer, or subject-matter expert — if you have knowledge worth sharing, Pkasemer gives you the infrastructure to turn it into income.
            </p>
          </div>
          <div style={{ flex: '1 1 380px', minWidth: 280 }}>
            {[
              'You create content but have no structured way to monetise your knowledge',
              'You want a professional course platform without months of setup or a developer',
              'You want your learners to walk away with a tangible certificate — not just a video watched',
            ].map((item, i, arr) => (
              <div key={item} style={{ display: 'flex', gap: 18, padding: '22px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: C.surface3, border: `1px solid ${C.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <ArrowRight size={15} color={C.green} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: C.ink2, lineHeight: 1.55, margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
      <section id="testimonials" style={{ background: C.deepBg, padding: '96px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(205,251,94,.12)', border: `1px solid rgba(205,251,94,.25)`, borderRadius: 999, padding: '6px 14px', marginBottom: 20 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.lime }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: C.lime, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Creator stories</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 'clamp(26px,3.5vw,38px)', letterSpacing: '-0.02em', color: '#fff', margin: 0 }}>
              Creators who made the switch
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
            {testimonials.map(({ quote, name, role }) => (
              <div key={name} style={{ background: C.deepCard, borderRadius: 20, padding: '32px 28px', border: '1px solid rgba(255,255,255,.07)' }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 20 }}>
                  {[1,2,3,4,5].map((i) => <Star key={i} size={14} fill={C.lime} color={C.lime} />)}
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,.8)', margin: '0 0 24px', fontStyle: 'italic' }}>
                  &ldquo;{quote}&rdquo;
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(205,251,94,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: C.lime, flexShrink: 0 }}>
                    {name[0]}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>{name}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', margin: 0 }}>{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ background: C.deepBg, borderRadius: 28, padding: 'clamp(48px,6vw,80px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: C.lime, opacity: .06, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: C.lime, opacity: .04, pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 'clamp(28px,4vw,46px)', letterSpacing: '-0.02em', color: '#fff', margin: '0 0 18px', lineHeight: 1.08 }}>
                Ready to launch your creator channel?
              </h2>
              <p style={{ fontSize: 18, lineHeight: 1.65, color: 'rgba(255,255,255,.7)', margin: '0 auto 40px', maxWidth: 520 }}>
                Join creators already building learning communities and earning from their knowledge on Pkasemer.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
                <Link href="/platform/apply"
                  style={{ padding: '16px 32px', background: C.lime, color: C.deepBg, borderRadius: 12, fontSize: 15, fontWeight: 800, textDecoration: 'none', fontFamily: 'var(--font-sora)' }}>
                  Apply now →
                </Link>
                <a href="#features"
                  style={{ padding: '16px 32px', background: 'rgba(255,255,255,.08)', color: '#fff', borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,255,255,.2)' }}>
                  See all features
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '32px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Play size={12} fill="#fff" color="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 15, color: C.ink }}>Pkasemer</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[['#features','Features'],['#how-it-works','How it works'],['#testimonials','Stories'],'/sign-in'].map((item) => {
              if (Array.isArray(item)) {
                const [href, label] = item;
                return <a key={href} href={href} style={{ fontSize: 13, fontWeight: 600, color: C.muted2, textDecoration: 'none' }}>{label}</a>;
              }
              return <Link key={item} href={item} style={{ fontSize: 13, fontWeight: 600, color: C.muted2, textDecoration: 'none' }}>Creator login</Link>;
            })}
          </div>
          <p style={{ fontSize: 12, color: C.muted2, margin: 0 }}>© {new Date().getFullYear()} Pkasemer. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
