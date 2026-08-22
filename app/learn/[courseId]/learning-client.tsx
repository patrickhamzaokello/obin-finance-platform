'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getCourseById, getUserProgress,
  updateProgress, markModuleComplete,
} from '@/app/actions/courses';
import { convertBlobUrlToApiUrl, isBlobUrl } from '@/lib/blob-url';
import { extractYouTubeId } from '@/lib/video-url';
import Link from 'next/link';
import {
  ArrowLeft, Play, FileText, CheckCircle2,
  Lock, ChevronRight, Loader2, ChevronDown, ChevronUp,
  BookOpen, ExternalLink,
} from 'lucide-react';

// ─── tokens ──────────────────────────────────────────────────────────────────
const ACCENT = '#0B00FF';
const INK    = '#0E0E1A';
const MUTED  = '#6B6B8A';
const IVORY  = '#F7F5F0';
const RULE   = '#E2DDD6';
const WHITE  = '#FFFFFF';
const NAV_BG = '#0A0A16';

// ─── URL helpers ──────────────────────────────────────────────────────────────
function resolveYouTubeEmbed(v: { url?: string | null; youtubeUrl?: string | null }): string | null {
  const raw = v.youtubeUrl || v.url || '';
  if (!raw.includes('youtube.com') && !raw.includes('youtu.be')) return null;
  const id = extractYouTubeId(raw);
  return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : null;
}

function resolveFileVideoUrl(v: { url?: string | null; youtubeUrl?: string | null }): string | null {
  const url = v.url;
  if (!url || url.includes('youtube.com') || url.includes('youtu.be')) return null;
  return isBlobUrl(url) ? convertBlobUrlToApiUrl(url) : url;
}

function resolvePdfUrl(p: { url?: string | null }): string | null {
  if (!p.url) return null;
  return isBlobUrl(p.url) ? convertBlobUrlToApiUrl(p.url) : p.url;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LearningClient({ courseId }: { courseId: string }) {
  const router = useRouter();

  const [course,           setCourse]           = useState<any>(null);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [currentModuleId,  setCurrentModuleId]  = useState<string | null>(null);
  const [currentType,      setCurrentType]      = useState<'video' | 'pdf' | null>(null);
  const [currentContentId, setCurrentContentId] = useState<string | null>(null);
  const [expandedModules,  setExpandedModules]  = useState<Set<string>>(new Set());
  const [loading,          setLoading]          = useState(true);
  const [marking,          setMarking]          = useState(false);
  const [justCompleted,    setJustCompleted]    = useState(false);
  const [sidebarOpen,      setSidebarOpen]      = useState(false); // mobile

  useEffect(() => {
    (async () => {
      const [courseResult, progressResult] = await Promise.all([
        getCourseById(courseId),
        getUserProgress(courseId),
      ]);

      if (!courseResult.success) { router.push('/dashboard'); return; }

      const data = courseResult.data;
      setCourse(data);

      if (progressResult.success) {
        const done = new Set<string>(
          progressResult.data
            .filter((p: any) => p.isModuleCompleted)
            .map((p: any) => p.moduleId)
        );
        setCompletedModules(done);

        if (progressResult.data.length > 0) {
          const last = progressResult.data[0];
          setCurrentModuleId(last.moduleId);
          setExpandedModules(new Set([last.moduleId]));
          if (last.videoId) { setCurrentType('video'); setCurrentContentId(last.videoId); }
        }
      }

      if (!progressResult.success || progressResult.data?.length === 0) {
        const first = data?.modules?.[0];
        if (first) {
          setCurrentModuleId(first.id);
          setExpandedModules(new Set([first.id]));
          if (first.videos.length > 0)    { setCurrentType('video'); setCurrentContentId(first.videos[0].id); }
          else if (first.pdfs.length > 0) { setCurrentType('pdf');   setCurrentContentId(first.pdfs[0].id); }
        }
      }

      setLoading(false);
    })();
  }, [courseId, router]);

  const selectContent = useCallback((moduleId: string, type: 'video' | 'pdf', contentId: string) => {
    setCurrentModuleId(moduleId);
    setCurrentType(type);
    setCurrentContentId(contentId);
    setJustCompleted(false);
    setSidebarOpen(false);
    setExpandedModules(prev => { const n = new Set(prev); n.add(moduleId); return n; });
  }, []);

  const toggleExpanded = useCallback((moduleId: string) => {
    setExpandedModules(prev => {
      const n = new Set(prev);
      n.has(moduleId) ? n.delete(moduleId) : n.add(moduleId);
      return n;
    });
  }, []);

  const handleMarkComplete = async () => {
    if (!courseId || !currentModuleId) return;
    setMarking(true);
    const result = await markModuleComplete(courseId, currentModuleId);
    if (result.success) {
      setCompletedModules(prev => new Set([...prev, currentModuleId]));
      if (currentContentId) await updateProgress(courseId, currentModuleId, currentContentId);
      setJustCompleted(true);
    }
    setMarking(false);
  };

  const goToNextModule = () => {
    if (!course || !currentModuleId) return;
    const idx  = course.modules.findIndex((m: any) => m.id === currentModuleId);
    const next = course.modules[idx + 1];
    if (!next) return;
    setJustCompleted(false);
    setCurrentModuleId(next.id);
    setExpandedModules(prev => { const n = new Set(prev); n.add(next.id); return n; });
    if (next.videos.length > 0)    { setCurrentType('video'); setCurrentContentId(next.videos[0].id); }
    else if (next.pdfs.length > 0) { setCurrentType('pdf');   setCurrentContentId(next.pdfs[0].id); }
    else                           { setCurrentType(null);    setCurrentContentId(null); }
  };

  // ── loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: NAV_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: `2.5px solid ${ACCENT}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'system-ui, sans-serif' }}>Loading course…</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!course) return null;

  const currentModule  = course.modules.find((m: any) => m.id === currentModuleId);
  const currentVideo   = currentType === 'video' && currentModule ? currentModule.videos.find((v: any) => v.id === currentContentId) : null;
  const currentPdf     = currentType === 'pdf'   && currentModule ? currentModule.pdfs.find((p: any)   => p.id === currentContentId) : null;

  const youtubeUrl   = currentVideo ? resolveYouTubeEmbed(currentVideo)  : null;
  const fileVideoUrl = currentVideo ? resolveFileVideoUrl(currentVideo)   : null;
  const pdfUrl       = currentPdf   ? resolvePdfUrl(currentPdf)           : null;
  const hasContent   = !!(youtubeUrl || fileVideoUrl || pdfUrl);

  const totalModules     = course.modules.length;
  const doneCount        = completedModules.size;
  const progressPct      = totalModules > 0 ? Math.round((doneCount / totalModules) * 100) : 0;
  const currentModuleIdx = course.modules.findIndex((m: any) => m.id === currentModuleId);
  const hasNextModule    = currentModuleIdx < totalModules - 1;
  const isCurrentDone    = currentModuleId ? completedModules.has(currentModuleId) : false;
  const allDone          = doneCount === totalModules && totalModules > 0;

  const contentTitle = currentVideo?.title ?? currentPdf?.title ?? null;

  return (
    <div style={{ minHeight: '100vh', background: IVORY, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

        /* sidebar scroll */
        .lc-sidebar { overflow-y: auto; scrollbar-width: thin; scrollbar-color: ${RULE} transparent; }
        .lc-sidebar::-webkit-scrollbar { width: 4px; }
        .lc-sidebar::-webkit-scrollbar-track { background: transparent; }
        .lc-sidebar::-webkit-scrollbar-thumb { background: ${RULE}; }

        /* content row hover */
        .content-row { transition: background .12s; }
        .content-row:hover { background: rgba(11,0,255,0.04) !important; }

        /* mobile sidebar overlay */
        .mob-overlay { display: none; }
        @media (max-width: 1023px) {
          .mob-overlay { display: block; }
          .desktop-sidebar { display: none !important; }
          .mobile-sidebar-panel {
            position: fixed; inset: 0; z-index: 50;
            display: flex; align-items: stretch;
          }
          .mobile-sidebar-drawer {
            width: min(360px, 90vw);
            background: ${WHITE};
            border-right: 1px solid ${RULE};
            display: flex; flex-direction: column;
            animation: slideIn .2s ease;
          }
          @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
          .mobile-sidebar-scrim {
            flex: 1; background: rgba(10,10,22,0.5);
          }
          .mob-nav-btn { display: flex !important; }
        }
        @media (min-width: 1024px) {
          .mob-nav-btn { display: none !important; }
        }
      `}</style>

      {/* ── NAV BAR ── */}
      <header style={{ background: NAV_BG, borderBottom: `1px solid rgba(255,255,255,0.07)`, position: 'sticky', top: 0, zIndex: 40, flexShrink: 0 }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 16 }}>

          {/* Back */}
          <Link href="/learn/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', flexShrink: 0 }}>
            <ArrowLeft size={14} />
            <span style={{ display: 'none' }} className="sm-inline">Dashboard</span>
          </Link>

          {/* Divider */}
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

          {/* Course title */}
          <h1 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
            {course.title}
          </h1>

          {/* Progress — desktop */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums' }}>
              {doneCount}/{totalModules}
            </span>
            <div style={{ width: 120, height: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: ACCENT, transition: 'width .5s ease' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT, fontVariantNumeric: 'tabular-nums' }}>
              {progressPct}%
            </span>
          </div>

          {/* Mobile: open sidebar */}
          <button className="mob-nav-btn" onClick={() => setSidebarOpen(true)}
            style={{ display: 'none', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
            <BookOpen size={13} /> Contents
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', maxWidth: 1440, margin: '0 auto', width: '100%' }}>

        {/* ── LEFT: player + info ── */}
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

          {/* Player */}
          <div style={{ background: '#000', flexShrink: 0 }}>
            {youtubeUrl ? (
              <div style={{ aspectRatio: '16/9' }}>
                <iframe key={youtubeUrl} src={youtubeUrl} style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen title={currentVideo?.title || 'Video'} />
              </div>
            ) : fileVideoUrl ? (
              <div style={{ aspectRatio: '16/9' }}>
                <video key={fileVideoUrl} src={fileVideoUrl} controls controlsList="nodownload"
                  style={{ width: '100%', height: '100%', display: 'block' }}
                  poster={course.thumbnail ? convertBlobUrlToApiUrl(course.thumbnail) : undefined} />
              </div>
            ) : pdfUrl ? (
              <div style={{ height: '72vh', background: '#1a1a2e' }}>
                <iframe key={pdfUrl} src={pdfUrl} style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} title={currentPdf?.title || 'PDF'} />
              </div>
            ) : (
              <div style={{ aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D0D1A' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 64, height: 64, border: `1px solid rgba(255,255,255,0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Play size={24} style={{ color: 'rgba(255,255,255,0.25)', marginLeft: 3 }} />
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px' }}>No resource selected</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>Choose a lesson from the panel</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Info strip ── */}
          <div style={{ background: WHITE, borderBottom: `1px solid ${RULE}`, padding: '24px 32px', flexShrink: 0 }}>

            {/* Breadcrumb */}
            {currentModule && (
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: MUTED, margin: '0 0 8px' }}>
                {currentModule.title}
              </p>
            )}

            {/* Title + completed badge */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: INK, margin: 0, lineHeight: 1.2, flex: 1 }}>
                {contentTitle ?? course.title}
              </h2>
              {isCurrentDone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#059669', background: '#D1FAE5', padding: '6px 12px', flexShrink: 0, marginTop: 4, letterSpacing: '0.04em' }}>
                  <CheckCircle2 size={12} /> Completed
                </div>
              )}
            </div>

            {/* Action bar */}
            {hasContent && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingTop: 20, borderTop: `1px solid ${RULE}` }}>
                {pdfUrl && (
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', border: `1.5px solid ${RULE}`, color: INK, fontSize: 13, fontWeight: 600, textDecoration: 'none', background: IVORY }}>
                    <ExternalLink size={12} /> Open in new tab
                  </a>
                )}

                {!isCurrentDone ? (
                  <button onClick={handleMarkComplete} disabled={marking}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: marking ? RULE : ACCENT, color: marking ? MUTED : WHITE, border: 'none', fontSize: 13, fontWeight: 700, cursor: marking ? 'not-allowed' : 'pointer', opacity: marking ? 0.6 : 1 }}>
                    {marking
                      ? <><Loader2 size={14} style={{ animation: 'spin .9s linear infinite' }} /> Saving…</>
                      : <><CheckCircle2 size={14} /> Mark module complete</>}
                  </button>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: '#059669' }}>
                    <CheckCircle2 size={14} /> Module complete
                  </span>
                )}

                <div style={{ flex: 1 }} />

                {(isCurrentDone || justCompleted) && hasNextModule && (
                  <button onClick={goToNextModule}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', border: `1.5px solid ${RULE}`, background: WHITE, color: INK, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    Next module <ChevronRight size={14} />
                  </button>
                )}

                {allDone && (
                  <span style={{ fontSize: 14, fontWeight: 700, color: ACCENT }}>
                    🎉 Course complete!
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Module description */}
          {currentModule?.description && (
            <div style={{ padding: '24px 32px', background: IVORY, borderBottom: `1px solid ${RULE}` }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: MUTED, margin: '0 0 8px' }}>About this module</p>
              <p style={{ fontSize: 15, color: INK, lineHeight: 1.75, margin: 0 }}>{currentModule.description}</p>
            </div>
          )}
        </main>

        {/* ── RIGHT: sidebar playlist (desktop) ── */}
        <aside className="desktop-sidebar lc-sidebar" style={{
          width: 340, flexShrink: 0,
          borderLeft: `1px solid ${RULE}`,
          background: WHITE,
          height: 'calc(100vh - 56px)',
          position: 'sticky',
          top: 56,
          overflowY: 'auto',
        }}>
          <SidebarContents
            course={course}
            completedModules={completedModules}
            currentModuleId={currentModuleId}
            currentContentId={currentContentId}
            currentType={currentType}
            expandedModules={expandedModules}
            progressPct={progressPct}
            doneCount={doneCount}
            totalModules={totalModules}
            onSelectContent={selectContent}
            onToggleExpanded={toggleExpanded}
          />
        </aside>
      </div>

      {/* ── MOBILE sidebar overlay ── */}
      {sidebarOpen && (
        <div className="mobile-sidebar-panel mob-overlay">
          <div className="mobile-sidebar-drawer lc-sidebar">
            <div style={{ borderBottom: `1px solid ${RULE}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: MUTED, margin: 0 }}>Course contents</p>
              <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, fontSize: 13, fontWeight: 600 }}>✕</button>
            </div>
            <SidebarContents
              course={course}
              completedModules={completedModules}
              currentModuleId={currentModuleId}
              currentContentId={currentContentId}
              currentType={currentType}
              expandedModules={expandedModules}
              progressPct={progressPct}
              doneCount={doneCount}
              totalModules={totalModules}
              onSelectContent={selectContent}
              onToggleExpanded={toggleExpanded}
            />
          </div>
          <div className="mobile-sidebar-scrim" onClick={() => setSidebarOpen(false)} />
        </div>
      )}
    </div>
  );
}

// ─── Sidebar contents (shared desktop + mobile) ───────────────────────────────
function SidebarContents({
  course, completedModules, currentModuleId, currentContentId, currentType,
  expandedModules, progressPct, doneCount, totalModules,
  onSelectContent, onToggleExpanded,
}: {
  course: any;
  completedModules: Set<string>;
  currentModuleId: string | null;
  currentContentId: string | null;
  currentType: 'video' | 'pdf' | null;
  expandedModules: Set<string>;
  progressPct: number;
  doneCount: number;
  totalModules: number;
  onSelectContent: (moduleId: string, type: 'video' | 'pdf', contentId: string) => void;
  onToggleExpanded: (moduleId: string) => void;
}) {
  return (
    <>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${RULE}`, background: IVORY, flexShrink: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: MUTED, margin: '0 0 8px' }}>
          Your progress
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ flex: 1, height: 3, background: RULE, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: ACCENT, transition: 'width .5s ease' }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
            {progressPct}%
          </span>
        </div>
        <p style={{ fontSize: 12, color: MUTED, margin: 0, fontVariantNumeric: 'tabular-nums' }}>
          {doneCount} of {totalModules} module{totalModules !== 1 ? 's' : ''} complete
        </p>
      </div>

      {/* Module list */}
      <div style={{ flex: 1 }}>
        {course.modules.map((mod: any, index: number) => {
          const isExpanded = expandedModules.has(mod.id);
          const isActive   = currentModuleId === mod.id;
          const isDone     = completedModules.has(mod.id);
          const vc = mod.videos.length;
          const pc = mod.pdfs.length;

          return (
            <div key={mod.id} style={{ borderBottom: `1px solid ${RULE}` }}>
              {/* Module header */}
              <button onClick={() => onToggleExpanded(mod.id)}
                style={{
                  width: '100%', textAlign: 'left', display: 'flex', alignItems: 'flex-start',
                  gap: 14, padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer',
                  borderLeft: isActive ? `3px solid ${ACCENT}` : '3px solid transparent',
                  transition: 'background .12s, border-color .15s',
                }}
                className="content-row">

                {/* Index / check */}
                <div style={{
                  width: 28, height: 28, flexShrink: 0,
                  border: `1px solid ${isDone ? 'transparent' : isActive ? ACCENT : RULE}`,
                  background: isDone ? 'rgba(5,150,105,0.08)' : isActive ? `rgba(11,0,255,0.06)` : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  color: isDone ? '#059669' : isActive ? ACCENT : MUTED,
                  marginTop: 1,
                }}>
                  {isDone ? <CheckCircle2 size={13} /> : String(index + 1).padStart(2, '0')}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: isActive ? ACCENT : isDone ? MUTED : INK, margin: '0 0 3px', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {mod.title}
                  </p>
                  <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>
                    {[vc > 0 && `${vc} video${vc !== 1 ? 's' : ''}`, pc > 0 && `${pc} PDF${pc !== 1 ? 's' : ''}`].filter(Boolean).join(' · ') || 'No resources'}
                  </p>
                </div>

                <div style={{ flexShrink: 0, color: MUTED, paddingTop: 2 }}>
                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </div>
              </button>

              {/* Content items */}
              {isExpanded && (
                <div style={{ background: IVORY, borderTop: `1px solid ${RULE}`, paddingTop: 4, paddingBottom: 4 }}>
                  {mod.videos.map((v: any, idx: number) => {
                    const active = currentContentId === v.id && currentType === 'video';
                    return (
                      <button key={v.id} onClick={() => onSelectContent(mod.id, 'video', v.id)}
                        className="content-row"
                        style={{
                          width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center',
                          gap: 12, padding: '10px 20px 10px 28px',
                          background: active ? `rgba(11,0,255,0.06)` : 'transparent',
                          border: 'none', borderLeft: active ? `3px solid ${ACCENT}` : '3px solid transparent',
                          cursor: 'pointer',
                        }}>
                        <div style={{
                          width: 22, height: 22, flexShrink: 0, border: `1px solid ${active ? ACCENT : RULE}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: active ? ACCENT : WHITE,
                        }}>
                          <Play size={9} style={{ color: active ? WHITE : MUTED, marginLeft: 1 }} />
                        </div>
                        <span style={{ fontSize: 13, color: active ? ACCENT : INK, fontWeight: active ? 600 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {v.title || `Video ${idx + 1}`}
                        </span>
                      </button>
                    );
                  })}
                  {mod.pdfs.map((p: any, idx: number) => {
                    const active = currentContentId === p.id && currentType === 'pdf';
                    return (
                      <button key={p.id} onClick={() => onSelectContent(mod.id, 'pdf', p.id)}
                        className="content-row"
                        style={{
                          width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center',
                          gap: 12, padding: '10px 20px 10px 28px',
                          background: active ? `rgba(11,0,255,0.06)` : 'transparent',
                          border: 'none', borderLeft: active ? `3px solid ${ACCENT}` : '3px solid transparent',
                          cursor: 'pointer',
                        }}>
                        <div style={{
                          width: 22, height: 22, flexShrink: 0, border: `1px solid ${active ? ACCENT : RULE}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: active ? ACCENT : WHITE,
                        }}>
                          <FileText size={9} style={{ color: active ? WHITE : MUTED }} />
                        </div>
                        <span style={{ fontSize: 13, color: active ? ACCENT : INK, fontWeight: active ? 600 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.title || `PDF ${idx + 1}`}
                        </span>
                      </button>
                    );
                  })}
                  {vc === 0 && pc === 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px 10px 28px', fontSize: 12, color: MUTED }}>
                      <Lock size={11} /> No resources yet
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
