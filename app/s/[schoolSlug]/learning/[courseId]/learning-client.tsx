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
          const last = progressResult.data[progressResult.data.length - 1];
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
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Loading course…</p>
      </div>
    </div>
  );

  if (!course) return null;

  const currentModule  = course.modules.find((m: any) => m.id === currentModuleId);
  const currentVideo   = currentType === 'video' && currentModule ? currentModule.videos.find((v: any) => v.id === currentContentId) : null;
  const currentPdf     = currentType === 'pdf'   && currentModule ? currentModule.pdfs.find((p: any) => p.id === currentContentId)   : null;

  const youtubeUrl     = currentVideo ? resolveYouTubeEmbed(currentVideo)  : null;
  const fileVideoUrl   = currentVideo ? resolveFileVideoUrl(currentVideo)   : null;
  const pdfUrl         = currentPdf   ? resolvePdfUrl(currentPdf)           : null;
  const hasContent     = !!(youtubeUrl || fileVideoUrl || pdfUrl);

  const totalModules   = course.modules.length;
  const doneCount      = completedModules.size;
  const progressPct    = totalModules > 0 ? Math.round((doneCount / totalModules) * 100) : 0;

  const currentModuleIdx = course.modules.findIndex((m: any) => m.id === currentModuleId);
  const hasNextModule    = currentModuleIdx < totalModules - 1;
  const isCurrentDone    = currentModuleId ? completedModules.has(currentModuleId) : false;
  const allDone          = doneCount === totalModules && totalModules > 0;
  const totalItems       = course.modules.reduce((s: number, m: any) => s + m.videos.length + m.pdfs.length, 0);

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">

      {/* Sticky header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-black/[0.06] sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          <Link href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors shrink-0">
            <ArrowLeft size={14} /> Courses
          </Link>
          <div className="w-px h-4 bg-border shrink-0" />
          <h1 className="text-sm font-semibold text-foreground truncate flex-1">{course.title}</h1>

          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <span className="text-xs text-muted-foreground">{doneCount}/{totalModules} modules</span>
            <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-xs font-semibold text-primary">{progressPct}%</span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 gap-5 items-start">

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="bg-black rounded-2xl overflow-hidden shadow-sm">
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
              <div className="bg-white rounded-2xl" style={{ height: '70vh' }}>
                <iframe key={pdfUrl} src={pdfUrl} className="w-full h-full border-0 rounded-2xl" title={currentPdf?.title || 'PDF'} />
              </div>
            ) : (
              <div className="aspect-video flex items-center justify-center bg-[#F5F5F7]">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <Play className="w-6 h-6 text-primary ml-0.5" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Select a lesson to begin</p>
                  <p className="text-xs text-muted-foreground mt-1">Choose from the panel on the right</p>
                </div>
              </div>
            )}
          </div>

          {hasContent && (
            <div className="bg-white rounded-2xl shadow-sm px-5 py-4 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-1">
                    {currentType === 'video' ? 'Video Lesson' : 'PDF Resource'}
                    {currentModule && <span className="text-muted-foreground font-normal normal-case tracking-normal ml-2">· {currentModule.title}</span>}
                  </p>
                  <h2 className="text-base font-semibold text-foreground">{currentVideo?.title ?? currentPdf?.title}</h2>
                </div>
                {isCurrentDone && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary shrink-0 mt-1">
                    <CheckCircle2 size={14} /> Completed
                  </span>
                )}
              </div>

              {pdfUrl && (
                <div className="flex gap-2">
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-lg hover:bg-primary/20 transition-colors">
                    <FileText size={12} /> Open in new tab
                  </a>
                </div>
              )}

              <div className="pt-1 border-t border-black/[0.06] flex flex-wrap items-center gap-3">
                {!isCurrentDone ? (
                  <button onClick={handleMarkComplete} disabled={marking}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 shadow-sm">
                    {marking
                      ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                      : <><CheckCircle2 size={14} /> Mark module complete</>}
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    <CheckCircle2 size={15} /> Module complete
                  </span>
                )}

                {(isCurrentDone || justCompleted) && hasNextModule && (
                  <button onClick={goToNextModule}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-border text-foreground text-sm font-semibold rounded-xl hover:bg-secondary transition-colors">
                    Next module <ChevronRight size={14} />
                  </button>
                )}

                {allDone && (
                  <span className="text-xs font-semibold text-primary ml-auto">Course complete!</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-80 shrink-0 hidden lg:block sticky top-[57px] max-h-[calc(100vh-72px)] overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-black/[0.06] bg-secondary">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Course Content</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {totalModules} module{totalModules !== 1 ? 's' : ''}
                <span className="font-normal text-muted-foreground"> · {totalItems} lessons</span>
              </p>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{doneCount} completed</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            </div>

            <div className="divide-y divide-black/[0.04]">
              {course.modules.map((mod: any, index: number) => {
                const isExpanded = expandedModules.has(mod.id);
                const isActive   = currentModuleId === mod.id;
                const isDone     = completedModules.has(mod.id);
                const itemCount  = mod.videos.length + mod.pdfs.length;

                return (
                  <div key={mod.id}>
                    <button onClick={() => toggleExpanded(mod.id)}
                      className={`w-full text-left flex items-start justify-between gap-3 px-5 py-4 transition-colors ${
                        isActive ? 'bg-primary/6 border-l-[3px] border-l-primary pl-[17px]' : 'hover:bg-secondary border-l-[3px] border-l-transparent'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Module {index + 1}</p>
                        <p className={`text-sm font-semibold leading-snug truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>{mod.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{itemCount} lesson{itemCount !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 shrink-0">
                        {isDone && <CheckCircle2 size={13} className="text-primary" />}
                        {isExpanded ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="bg-[#f9fafb] border-t border-black/[0.04] px-4 py-2.5 space-y-0.5">
                        {mod.videos.map((v: any, idx: number) => {
                          const active = currentContentId === v.id && currentType === 'video';
                          return (
                            <button key={v.id} onClick={() => selectContent(mod.id, 'video', v.id)}
                              className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                                active ? 'bg-primary text-primary-foreground font-semibold' : 'text-foreground hover:bg-white hover:shadow-sm'
                              }`}>
                              <Play size={12} className="shrink-0" />
                              <span className="truncate flex-1">{v.title || `Video ${idx + 1}`}</span>
                            </button>
                          );
                        })}
                        {mod.pdfs.map((p: any, idx: number) => {
                          const active = currentContentId === p.id && currentType === 'pdf';
                          return (
                            <button key={p.id} onClick={() => selectContent(mod.id, 'pdf', p.id)}
                              className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                                active ? 'bg-primary text-primary-foreground font-semibold' : 'text-foreground hover:bg-white hover:shadow-sm'
                              }`}>
                              <FileText size={12} className="shrink-0" />
                              <span className="truncate flex-1">{p.title || `Resource ${idx + 1}`}</span>
                            </button>
                          );
                        })}
                        {itemCount === 0 && (
                          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                            <Lock size={11} /> No content yet
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

      {/* Mobile module list */}
      <div className="lg:hidden px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-black/[0.06] bg-secondary flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Course Content</p>
            <span className="text-xs text-primary font-semibold">{progressPct}% done</span>
          </div>
          {course.modules.map((mod: any, index: number) => {
            const isExpanded = expandedModules.has(mod.id);
            const isActive   = currentModuleId === mod.id;
            const isDone     = completedModules.has(mod.id);
            return (
              <div key={mod.id} className="border-b border-black/[0.04] last:border-0">
                <button onClick={() => toggleExpanded(mod.id)}
                  className={`w-full text-left flex items-center gap-3 px-5 py-3.5 transition-colors ${isActive ? 'bg-primary/6 border-l-[3px] border-l-primary pl-[17px]' : 'border-l-[3px] border-l-transparent'}`}>
                  <span className={`text-sm font-semibold flex-1 truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                    {index + 1}. {mod.title}
                  </span>
                  {isDone && <CheckCircle2 size={13} className="text-primary shrink-0" />}
                  {isExpanded ? <ChevronUp size={13} className="text-muted-foreground shrink-0" /> : <ChevronDown size={13} className="text-muted-foreground shrink-0" />}
                </button>
                {isExpanded && (
                  <div className="bg-[#f9fafb] border-t border-black/[0.04] px-4 py-2 space-y-0.5">
                    {mod.videos.map((v: any, idx: number) => {
                      const active = currentContentId === v.id && currentType === 'video';
                      return (
                        <button key={v.id} onClick={() => selectContent(mod.id, 'video', v.id)}
                          className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-primary text-primary-foreground font-semibold' : 'text-foreground hover:bg-white'}`}>
                          <Play size={11} className="shrink-0" />
                          <span className="truncate">{v.title || `Video ${idx + 1}`}</span>
                        </button>
                      );
                    })}
                    {mod.pdfs.map((p: any, idx: number) => {
                      const active = currentContentId === p.id && currentType === 'pdf';
                      return (
                        <button key={p.id} onClick={() => selectContent(mod.id, 'pdf', p.id)}
                          className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-primary text-primary-foreground font-semibold' : 'text-foreground hover:bg-white'}`}>
                          <FileText size={11} className="shrink-0" />
                          <span className="truncate">{p.title || `Resource ${idx + 1}`}</span>
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
