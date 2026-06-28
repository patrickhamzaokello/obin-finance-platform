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
  ArrowLeft, ChevronDown, ChevronUp,
  Play, FileText, CheckCircle2, Lock,
  ChevronRight, Loader2,
} from 'lucide-react';

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

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-white/50">Loading course…</p>
      </div>
    </div>
  );

  if (!course) return null;

  const currentModule  = course.modules.find((m: any) => m.id === currentModuleId);
  const currentVideo   = currentType === 'video' && currentModule ? currentModule.videos.find((v: any) => v.id === currentContentId) : null;
  const currentPdf     = currentType === 'pdf'   && currentModule ? currentModule.pdfs.find((p: any) => p.id === currentContentId)   : null;

  const youtubeUrl   = currentVideo ? resolveYouTubeEmbed(currentVideo)  : null;
  const fileVideoUrl = currentVideo ? resolveFileVideoUrl(currentVideo)   : null;
  const pdfUrl       = currentPdf   ? resolvePdfUrl(currentPdf)           : null;
  const hasContent   = !!(youtubeUrl || fileVideoUrl || pdfUrl);

  const totalModules = course.modules.length;
  const doneCount    = completedModules.size;
  const progressPct  = totalModules > 0 ? Math.round((doneCount / totalModules) * 100) : 0;

  const currentModuleIdx = course.modules.findIndex((m: any) => m.id === currentModuleId);
  const hasNextModule    = currentModuleIdx < totalModules - 1;
  const isCurrentDone    = currentModuleId ? completedModules.has(currentModuleId) : false;
  const allDone          = doneCount === totalModules && totalModules > 0;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-[#0f0f0f]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="flex items-center gap-3 px-4 py-3 max-w-screen-2xl mx-auto">
          <Link href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-white transition-colors shrink-0">
            <ArrowLeft size={15} /> Back
          </Link>
          <div className="w-px h-4 bg-white/10 shrink-0" />
          <h1 className="text-sm font-semibold text-white truncate flex-1">{course.title}</h1>
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <span className="text-xs text-white/40">{doneCount}/{totalModules} modules</span>
            <div className="w-28 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#4F46E5] rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-xs font-semibold text-[#818cf8]">{progressPct}%</span>
          </div>
        </div>
      </header>

      {/* ── Two-column layout — single scroll ── */}
      <div className="max-w-screen-2xl mx-auto flex gap-0 lg:gap-6 px-0 lg:px-6 py-0 lg:py-6 items-start">

        {/* ── Left: player + info ── */}
        <div className="flex-1 min-w-0">

          {/* Player */}
          <div className="bg-black lg:rounded-2xl overflow-hidden">
            {youtubeUrl ? (
              <div className="aspect-video">
                <iframe key={youtubeUrl} src={youtubeUrl}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen title={currentVideo?.title || 'Video'} />
              </div>
            ) : fileVideoUrl ? (
              <div className="aspect-video">
                <video key={fileVideoUrl} src={fileVideoUrl} controls controlsList="nodownload"
                  className="w-full h-full"
                  poster={course.thumbnail ? convertBlobUrlToApiUrl(course.thumbnail) : undefined} />
              </div>
            ) : pdfUrl ? (
              <div style={{ height: '72vh' }}>
                <iframe key={pdfUrl} src={pdfUrl} className="w-full h-full border-0" title={currentPdf?.title || 'PDF'} />
              </div>
            ) : (
              <div className="aspect-video flex items-center justify-center bg-[#1a1a1a]">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                    <Play className="w-6 h-6 text-white/60 ml-1" />
                  </div>
                  <p className="text-sm font-medium text-white/60">Select a resource to begin</p>
                  <p className="text-xs text-white/30 mt-1">Choose from the panel on the right</p>
                </div>
              </div>
            )}
          </div>

          {/* Info panel below player */}
          <div className="px-4 lg:px-0 py-5 space-y-4">

            {/* Title + status */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {currentModule && (
                  <p className="text-xs font-semibold text-[#818cf8] uppercase tracking-wider mb-1.5">
                    {currentModule.title}
                  </p>
                )}
                <h2 className="text-lg font-bold text-white leading-snug">
                  {currentVideo?.title ?? currentPdf?.title ?? course.title}
                </h2>
              </div>
              {isCurrentDone && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 shrink-0 mt-1 bg-emerald-400/10 px-2.5 py-1 rounded-full">
                  <CheckCircle2 size={13} /> Completed
                </span>
              )}
            </div>

            {/* Actions */}
            {hasContent && (
              <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-white/[0.06]">
                {pdfUrl && (
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-xl transition-colors">
                    <FileText size={13} /> Open PDF
                  </a>
                )}

                {!isCurrentDone ? (
                  <button onClick={handleMarkComplete} disabled={marking}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#4F46E5] hover:bg-[#4338ca] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
                    {marking
                      ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                      : <><CheckCircle2 size={14} /> Mark module complete</>}
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                    <CheckCircle2 size={15} /> Module complete
                  </span>
                )}

                {(isCurrentDone || justCompleted) && hasNextModule && (
                  <button onClick={goToNextModule}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-white/20 hover:border-white/40 text-white text-sm font-semibold rounded-xl transition-colors ml-auto">
                    Next module <ChevronRight size={14} />
                  </button>
                )}

                {allDone && (
                  <span className="text-sm font-semibold text-[#818cf8] ml-auto">🎉 Course complete!</span>
                )}
              </div>
            )}

            {/* Module description */}
            {currentModule?.description && (
              <div className="bg-white/[0.04] rounded-xl px-4 py-3.5 border border-white/[0.06]">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">About this module</p>
                <p className="text-sm text-white/70 leading-relaxed">{currentModule.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: module playlist ── */}
        <aside className="hidden lg:block w-96 shrink-0">
          <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/[0.06]">

            {/* Playlist header */}
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-0.5">Course content</p>
              <p className="text-sm font-semibold text-white">{course.title}</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#4F46E5] rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                </div>
                <span className="text-xs text-white/40 shrink-0">{doneCount}/{totalModules}</span>
              </div>
            </div>

            {/* Module list */}
            <div className="divide-y divide-white/[0.04]">
              {course.modules.map((mod: any, index: number) => {
                const isExpanded = expandedModules.has(mod.id);
                const isActive   = currentModuleId === mod.id;
                const isDone     = completedModules.has(mod.id);
                const videoCount = mod.videos.length;
                const pdfCount   = mod.pdfs.length;

                return (
                  <div key={mod.id}>
                    {/* Module row */}
                    <button
                      onClick={() => toggleExpanded(mod.id)}
                      className={`w-full text-left flex items-start gap-3 px-5 py-4 transition-colors ${
                        isActive ? 'bg-[#4F46E5]/20' : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* Index / done indicator */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                        isDone
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isActive
                          ? 'bg-[#4F46E5] text-white'
                          : 'bg-white/10 text-white/50'
                      }`}>
                        {isDone ? <CheckCircle2 size={13} /> : index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold leading-snug ${isActive ? 'text-white' : isDone ? 'text-white/60' : 'text-white/80'}`}>
                          {mod.title}
                        </p>
                        <p className="text-xs text-white/30 mt-0.5">
                          {[videoCount > 0 && `${videoCount} video${videoCount !== 1 ? 's' : ''}`, pdfCount > 0 && `${pdfCount} PDF${pdfCount !== 1 ? 's' : ''}`].filter(Boolean).join(' · ') || 'No resources'}
                        </p>
                      </div>

                      <div className="shrink-0 mt-1">
                        {isExpanded
                          ? <ChevronUp size={14} className="text-white/30" />
                          : <ChevronDown size={14} className="text-white/30" />}
                      </div>
                    </button>

                    {/* Expanded resources */}
                    {isExpanded && (
                      <div className="bg-black/20 border-t border-white/[0.04] px-4 py-2 space-y-0.5">
                        {mod.videos.map((v: any, idx: number) => {
                          const active = currentContentId === v.id && currentType === 'video';
                          return (
                            <button key={v.id} onClick={() => selectContent(mod.id, 'video', v.id)}
                              className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                                active
                                  ? 'bg-[#4F46E5] text-white'
                                  : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                              }`}>
                              <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${active ? 'bg-white/20' : 'bg-white/[0.06]'}`}>
                                <Play size={10} className={active ? 'text-white ml-0.5' : 'text-white/40 ml-0.5'} />
                              </div>
                              <span className="truncate flex-1">{v.title || `Video ${idx + 1}`}</span>
                            </button>
                          );
                        })}
                        {mod.pdfs.map((p: any, idx: number) => {
                          const active = currentContentId === p.id && currentType === 'pdf';
                          return (
                            <button key={p.id} onClick={() => selectContent(mod.id, 'pdf', p.id)}
                              className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                                active
                                  ? 'bg-[#4F46E5] text-white'
                                  : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                              }`}>
                              <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${active ? 'bg-white/20' : 'bg-white/[0.06]'}`}>
                                <FileText size={10} className={active ? 'text-white' : 'text-white/40'} />
                              </div>
                              <span className="truncate flex-1">{p.title || `PDF ${idx + 1}`}</span>
                            </button>
                          );
                        })}
                        {videoCount === 0 && pdfCount === 0 && (
                          <div className="flex items-center gap-2 px-3 py-2 text-xs text-white/30">
                            <Lock size={11} /> No resources yet
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* ── Mobile playlist ── */}
      <div className="lg:hidden px-4 pb-8">
        <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/[0.06]">
          <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Course content</p>
            <span className="text-xs font-semibold text-[#818cf8]">{progressPct}%</span>
          </div>
          {course.modules.map((mod: any, index: number) => {
            const isExpanded = expandedModules.has(mod.id);
            const isActive   = currentModuleId === mod.id;
            const isDone     = completedModules.has(mod.id);
            return (
              <div key={mod.id} className="border-b border-white/[0.04] last:border-0">
                <button onClick={() => toggleExpanded(mod.id)}
                  className={`w-full text-left flex items-center gap-3 px-5 py-4 transition-colors ${isActive ? 'bg-[#4F46E5]/20' : 'hover:bg-white/[0.04]'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${isDone ? 'bg-emerald-500/20 text-emerald-400' : isActive ? 'bg-[#4F46E5] text-white' : 'bg-white/10 text-white/50'}`}>
                    {isDone ? <CheckCircle2 size={11} /> : index + 1}
                  </div>
                  <span className={`text-sm font-semibold flex-1 truncate ${isActive ? 'text-white' : 'text-white/70'}`}>{mod.title}</span>
                  {isExpanded ? <ChevronUp size={13} className="text-white/30 shrink-0" /> : <ChevronDown size={13} className="text-white/30 shrink-0" />}
                </button>
                {isExpanded && (
                  <div className="bg-black/20 border-t border-white/[0.04] px-4 py-2 space-y-0.5">
                    {mod.videos.map((v: any, idx: number) => {
                      const active = currentContentId === v.id && currentType === 'video';
                      return (
                        <button key={v.id} onClick={() => selectContent(mod.id, 'video', v.id)}
                          className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? 'bg-[#4F46E5] text-white' : 'text-white/60 hover:text-white hover:bg-white/[0.06]'}`}>
                          <Play size={11} className="shrink-0" />
                          <span className="truncate">{v.title || `Video ${idx + 1}`}</span>
                        </button>
                      );
                    })}
                    {mod.pdfs.map((p: any, idx: number) => {
                      const active = currentContentId === p.id && currentType === 'pdf';
                      return (
                        <button key={p.id} onClick={() => selectContent(mod.id, 'pdf', p.id)}
                          className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? 'bg-[#4F46E5] text-white' : 'text-white/60 hover:text-white hover:bg-white/[0.06]'}`}>
                          <FileText size={11} className="shrink-0" />
                          <span className="truncate">{p.title || `PDF ${idx + 1}`}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
