'use client';

import { useEffect, useState } from 'react';
import { getCreatorProfile, updateCreatorProfile } from '@/app/actions/admin';
import { Loader2, Save, User, Globe, Link2 } from 'lucide-react';

const CATEGORIES = [
  'Finance', 'Tech', 'Fitness', 'Cooking', 'Music', 'Art', 'Business',
  'Education', 'Gaming', 'Lifestyle', 'Comedy', 'Travel', 'Science', 'Other',
];

export default function CreatorProfilePage() {
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState('');

  const [name,       setName]       = useState('');
  const [bio,        setBio]        = useState('');
  const [category,   setCategory]   = useState('');
  const [logoUrl,    setLogoUrl]    = useState('');
  const [bannerUrl,  setBannerUrl]  = useState('');
  const [website,    setWebsite]    = useState('');
  const [twitter,    setTwitter]    = useState('');
  const [instagram,  setInstagram]  = useState('');
  const [youtube,    setYoutube]    = useState('');

  useEffect(() => {
    getCreatorProfile().then((r) => {
      if (r.success && r.data) {
        const p = r.data as any;
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
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true); setSaved(false); setError('');
    const socialLinks = JSON.stringify({ website, twitter, instagram, youtube });
    const r = await updateCreatorProfile({ name, bio, category, logoUrl, bannerUrl, socialLinks });
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
              <button key={c} onClick={() => setCategory(c)}
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
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-bold text-foreground">Visuals</h2>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Profile Logo URL</label>
          <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className={inputCls} placeholder="https://…" />
          {logoUrl && (
            <img src={logoUrl} alt="Logo preview" className="mt-3 w-16 h-16 rounded-full object-cover border border-black/[0.08]" />
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Banner Image URL</label>
          <input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} className={inputCls} placeholder="https://… (recommended 1500×500)" />
          {bannerUrl && (
            <img src={bannerUrl} alt="Banner preview" className="mt-3 w-full h-24 rounded-xl object-cover border border-black/[0.08]" />
          )}
        </div>
      </div>

      {/* Social links */}
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Globe size={14} className="text-primary" />
          <h2 className="text-sm font-bold text-foreground">Social Links</h2>
        </div>

        {[
          { icon: Globe,  label: 'Website',     value: website,   set: setWebsite,   placeholder: 'https://yoursite.com' },
          { icon: Link2,  label: 'Twitter / X', value: twitter,   set: setTwitter,   placeholder: '@handle or full URL' },
          { icon: Link2,  label: 'Instagram',   value: instagram, set: setInstagram, placeholder: '@handle or full URL' },
          { icon: Link2,  label: 'YouTube',     value: youtube,   set: setYoutube,   placeholder: 'Channel URL' },
        ].map(({ icon: Icon, label, value, set, placeholder }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <Icon size={14} className="text-muted-foreground" />
            </div>
            <input value={value} onChange={(e) => set(e.target.value)}
              className={`${inputCls} flex-1`} placeholder={placeholder} />
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {saved && <p className="text-xs text-primary font-semibold">✓ Profile saved</p>}

      <button onClick={handleSave} disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60">
        {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save Profile</>}
      </button>
    </div>
  );
}
