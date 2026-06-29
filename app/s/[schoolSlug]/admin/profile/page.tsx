'use client';

import { useEffect, useState, useRef } from 'react';
import { getCreatorProfile, updateCreatorProfile } from '@/app/actions/admin';
import { uploadToBlob } from '@/lib/upload-client';
import { convertBlobUrlToApiUrl } from '@/lib/blob-url';
import { Loader2, Save, User, Globe, Link2, Upload, X, ImageIcon, Palette, Type } from 'lucide-react';

const CATEGORIES = [
  'Finance', 'Tech', 'Fitness', 'Cooking', 'Music', 'Art', 'Business',
  'Education', 'Gaming', 'Lifestyle', 'Comedy', 'Travel', 'Science', 'Other',
];

// ── Reusable image upload field ───────────────────────────────────────────────
function ImageUploadField({
  label,
  hint,
  value,
  onChange,
  schoolSlug,
  shape,         // 'circle' | 'banner'
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  schoolSlug: string;
  shape: 'circle' | 'banner';
}) {
  const [uploading,  setUploading]  = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [uploadErr,  setUploadErr]  = useState('');
  const [dragging,   setDragging]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = value ? convertBlobUrlToApiUrl(value) : '';

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setUploadErr('Please select an image file'); return; }
    if (file.size > 10 * 1024 * 1024)   { setUploadErr('Image must be under 10 MB');    return; }
    setUploading(true); setUploadErr(''); setProgress(0);
    const r = await uploadToBlob(file, 'thumbnail', schoolSlug, setProgress);
    setUploading(false);
    if (r.success) onChange(r.url);
    else setUploadErr(r.error ?? 'Upload failed');
  };

  const onInputChange  = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; };
  const onDrop         = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); };
  const onDragOver     = (e: React.DragEvent) => { e.preventDefault(); setDragging(true);  };
  const onDragLeave    = ()                    => setDragging(false);

  const isBanner = shape === 'banner';

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
      </div>

      {/* Drop zone / preview */}
      <div
        onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative cursor-pointer transition-all border-2 border-dashed overflow-hidden
          ${dragging ? 'border-primary bg-primary/5' : 'border-black/[0.1] hover:border-primary/50 hover:bg-secondary/40'}
          ${isBanner ? 'w-full rounded-2xl h-36' : 'w-24 h-24 rounded-full'}`}
      >
        {displayUrl ? (
          <img src={displayUrl} alt={label}
            className={`w-full h-full ${isBanner ? 'object-cover' : 'object-cover rounded-full'}`} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-3">
            <ImageIcon size={isBanner ? 22 : 18} className="text-muted-foreground/40" />
            {isBanner && <p className="text-[10px] text-muted-foreground text-center">Click or drag image here</p>}
          </div>
        )}

        {/* Upload overlay on hover when image exists */}
        {displayUrl && !uploading && (
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <Upload size={18} className="text-white" />
          </div>
        )}

        {/* Progress overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
            <Loader2 size={18} className="text-white animate-spin" />
            <span className="text-white text-xs font-semibold">{progress}%</span>
          </div>
        )}

        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={onInputChange} className="hidden" />
      </div>

      {/* Progress bar */}
      {uploading && (
        <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Actions row */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => !uploading && inputRef.current?.click()} disabled={uploading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-black/[0.1] rounded-xl hover:bg-secondary transition-colors disabled:opacity-50">
          <Upload size={11} /> {uploading ? `Uploading ${progress}%…` : 'Upload image'}
        </button>
        {value && !uploading && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onChange(''); }}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
            <X size={11} /> Remove
          </button>
        )}
      </div>

      {/* URL fallback */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-black/[0.06]" />
        <span className="text-[10px] text-muted-foreground">or paste URL</span>
        <div className="h-px flex-1 bg-black/[0.06]" />
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://…"
        className="w-full px-4 py-2.5 text-sm bg-white border border-black/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground/50"
      />

      {uploadErr && <p className="text-xs text-destructive">{uploadErr}</p>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CreatorProfilePage() {
  const [schoolSlug, setSchoolSlug] = useState('');
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState('');

  const [name,      setName]      = useState('');
  const [bio,       setBio]       = useState('');
  const [category,  setCategory]  = useState('');
  const [logoUrl,   setLogoUrl]   = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [website,      setWebsite]      = useState('');
  const [twitter,      setTwitter]      = useState('');
  const [instagram,    setInstagram]    = useState('');
  const [youtube,      setYoutube]      = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0E9F6E');
  const [accentColor,  setAccentColor]  = useState('#CDFB5E');
  const [tagline,      setTagline]      = useState('');
  const [heroHeadline, setHeroHeadline] = useState('');

  useEffect(() => {
    getCreatorProfile().then((r) => {
      if (r.success && r.data) {
        const p = r.data as any;
        setSchoolSlug(p.slug ?? '');
        setName(p.name ?? '');
        setBio(p.bio ?? '');
        setCategory(p.category ?? '');
        setLogoUrl(p.logoUrl ?? '');
        setBannerUrl(p.bannerUrl ?? '');
        try {
          const social = JSON.parse(p.socialLinks ?? '{}');
          setWebsite(social.website ?? '');
          setTwitter(social.twitter ?? '');
          setInstagram(social.instagram ?? '');
          setYoutube(social.youtube ?? '');
        } catch { /* empty */ }
        setPrimaryColor(p.primaryColor ?? '#0E9F6E');
        setAccentColor(p.accentColor ?? '#CDFB5E');
        setTagline(p.tagline ?? '');
        setHeroHeadline(p.heroHeadline ?? '');
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true); setSaved(false); setError('');
    const socialLinks = JSON.stringify({ website, twitter, instagram, youtube });
    const r = await updateCreatorProfile({ name, bio, category, logoUrl, bannerUrl, socialLinks, primaryColor, accentColor, tagline, heroHeadline });
    setSaving(false);
    if (r.success) setSaved(true);
    else setError(r.error ?? 'Failed to save');
  };

  const inputCls = 'w-full px-4 py-2.5 text-sm bg-white border border-black/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground/50';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Creator Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">This is your public-facing creator page</p>
      </div>

      {/* Identity */}
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <User size={14} className="text-primary" />
          <h2 className="text-sm font-bold text-foreground">Identity</h2>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Display Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Your creator name" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
            className={`${inputCls} resize-none`}
            placeholder="Tell your fans about yourself and what they'll learn from you…" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" onClick={() => setCategory(c)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                  category === c
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-black/[0.08] text-muted-foreground hover:bg-secondary'
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visuals */}
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-7">
        <h2 className="text-sm font-bold text-foreground">Visuals</h2>

        <ImageUploadField
          label="Profile Logo"
          hint="Shown as your avatar. Square image recommended."
          value={logoUrl}
          onChange={setLogoUrl}
          schoolSlug={schoolSlug}
          shape="circle"
        />

        <div className="h-px bg-black/[0.05]" />

        <ImageUploadField
          label="Cover / Banner"
          hint="Shown at the top of your creator profile. Recommended 1500 × 500 px."
          value={bannerUrl}
          onChange={setBannerUrl}
          schoolSlug={schoolSlug}
          shape="banner"
        />
      </div>

      {/* Social links */}
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Globe size={14} className="text-primary" />
          <h2 className="text-sm font-bold text-foreground">Social Links</h2>
        </div>

        {[
          { icon: Globe, label: 'Website',     value: website,   set: setWebsite,   placeholder: 'https://yoursite.com' },
          { icon: Link2, label: 'Twitter / X', value: twitter,   set: setTwitter,   placeholder: 'https://x.com/yourhandle' },
          { icon: Link2, label: 'Instagram',   value: instagram, set: setInstagram, placeholder: 'https://instagram.com/yourhandle' },
          { icon: Link2, label: 'YouTube',     value: youtube,   set: setYoutube,   placeholder: 'https://youtube.com/@yourchannel' },
        ].map(({ icon: Icon, label, value, set, placeholder }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <Icon size={14} className="text-muted-foreground" />
            </div>
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground/60 pointer-events-none">{label}</span>
              <input value={value} onChange={(e) => set(e.target.value)}
                className={`${inputCls} pl-24`} placeholder={placeholder} />
            </div>
          </div>
        ))}
      </div>

      {/* Page Theme */}
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-2 mb-1">
          <Palette size={14} className="text-primary" />
          <h2 className="text-sm font-bold text-foreground">Page Theme</h2>
        </div>
        <p className="text-xs text-muted-foreground -mt-4">These colors appear on your public creator page — buttons, badges, highlights, and the CTA panel.</p>

        {/* Live preview strip */}
        <div className="rounded-xl overflow-hidden border border-black/[0.06]">
          <div style={{ background: primaryColor, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>Preview — button &amp; banner</span>
            <span style={{ background: accentColor, color: primaryColor, fontSize: 11, fontWeight: 800, borderRadius: 999, padding: '4px 10px' }}>Join now</span>
          </div>
          <div style={{ padding: '12px 16px', background: '#F4F7F5', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ background: primaryColor + '20', color: primaryColor, fontSize: 11, fontWeight: 800, borderRadius: 999, padding: '3px 10px', border: `1px solid ${primaryColor}40` }}>Category badge</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0B1411' }}>Learn from me{' '}
              <span style={{ borderBottom: `3px solid ${accentColor}`, paddingBottom: 1 }}>here</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Brand Color</label>
            <p className="text-[10px] text-muted-foreground mb-2">Buttons, badges, borders</p>
            <div className="flex items-center gap-3">
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-black/[0.08] cursor-pointer p-0.5 bg-white" />
              <input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                className={inputCls + ' flex-1'} placeholder="#0E9F6E" maxLength={7} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Accent / Highlight</label>
            <p className="text-[10px] text-muted-foreground mb-2">Headline underline, CTA lime</p>
            <div className="flex items-center gap-3">
              <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-black/[0.08] cursor-pointer p-0.5 bg-white" />
              <input value={accentColor} onChange={(e) => setAccentColor(e.target.value)}
                className={inputCls + ' flex-1'} placeholder="#CDFB5E" maxLength={7} />
            </div>
          </div>
        </div>

        {/* Presets */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Quick Presets</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Forest',   primary: '#0E9F6E', accent: '#CDFB5E' },
              { label: 'Ocean',    primary: '#0066CC', accent: '#7DF9FF' },
              { label: 'Sunset',   primary: '#E8440A', accent: '#FFD166' },
              { label: 'Midnight', primary: '#6E3CCA', accent: '#E0BBFF' },
              { label: 'Rose',     primary: '#D63384', accent: '#FFB3D1' },
              { label: 'Slate',    primary: '#334155', accent: '#94A3B8' },
            ].map((p) => (
              <button key={p.label} type="button"
                onClick={() => { setPrimaryColor(p.primary); setAccentColor(p.accent); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-black/[0.08] text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors">
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: p.primary, display: 'inline-block', border: '1px solid rgba(0,0,0,0.1)' }} />
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: p.accent, display: 'inline-block', border: '1px solid rgba(0,0,0,0.1)' }} />
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Page Messaging */}
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Type size={14} className="text-primary" />
          <h2 className="text-sm font-bold text-foreground">Hero Messaging</h2>
        </div>
        <p className="text-xs text-muted-foreground -mt-4">Control the big text on your public landing page hero section.</p>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Hero Headline</label>
          <input value={heroHeadline} onChange={(e) => setHeroHeadline(e.target.value)} className={inputCls}
            placeholder={`Learn ${category || 'from me'} — default if left empty`} />
          <p className="text-[10px] text-muted-foreground mt-1">Leave empty to use the default: &ldquo;Learn {category || '[your category]'} from {name || '[your name]'}&rdquo;</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Tagline</label>
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={inputCls}
            placeholder="e.g. I've helped 10,000+ people invest smarter in Uganda" />
          <p className="text-[10px] text-muted-foreground mt-1">Appears below the headline as your personal hook. Replaces your bio in the hero if set.</p>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {saved && <p className="text-xs font-semibold text-primary">✓ Profile saved successfully</p>}

      <button onClick={handleSave} disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60">
        {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save Profile</>}
      </button>
    </div>
  );
}
