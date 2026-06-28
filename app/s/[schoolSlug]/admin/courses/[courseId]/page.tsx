'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { uploadToBlob } from '@/lib/upload-client';
import { FileOrUrlInput } from '@/components/file-or-url-input';
import {
  getAdminCourse,
  createCourse, updateCourse, deleteCourse,
  createModule, updateModule, deleteModule,
  createVideo, deleteVideo,
  createPdf, deletePdf,
} from '@/app/actions/admin';
import { AccessCodesPanel } from './access-codes-panel';
import {
  ChevronDown, ChevronUp, Play, FileText, Plus, Trash2, Pencil,
  BookOpen, Check, AlertCircle, Video, Upload, Link2, ArrowLeft, Loader2,
} from 'lucide-react';

type Toast = { type: 'success' | 'error'; message: string; id: number };

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((type: Toast['type'], message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { type, message, id }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return { toasts, show };
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-start gap-3 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium bg-white border ${
          t.type === 'success' ? 'border-green-100' : 'border-red-100'
        }`}>
          {t.type === 'success'
            ? <Check size={14} className="text-green-600 mt-0.5 shrink-0" />
            : <AlertCircle size={14} className="text-destructive mt-0.5 shrink-0" />
          }
          <span className="text-foreground">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-secondary rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60';

function isYouTubeLike(url: string) {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

export default function CourseEditor() {
  const router   = useRouter();
  const params   = useParams();
  const courseId = params?.courseId as string;
  const isNew    = courseId === 'new';
  const schoolSlug = (params?.schoolSlug as string) || '';

  const [course, setCourse]           = useState<any>(null);
  const [loading, setLoading]         = useState(!isNew);
  const [loadError, setLoadError]     = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const { toasts, show: showToast }   = useToast();

  useEffect(() => {
    if (!isNew) {
      getAdminCourse(courseId).then((result) => {
        if (result.success) setCourse(result.data);
        else setLoadError((result as any).error || 'Failed to load course');
        setLoading(false);
      });
    } else {
      setCourse({ id: 'new', title: '', description: '', thumbnail: '', instructor: '', isPublished: false, price: 0, discountPercent: 0, discountActive: false, modules: [] });
    }
  }, [courseId, isNew]);

  const handleSaveCourse = async () => {
    if (!course?.title.trim()) { showToast('error', 'Course title is required'); return; }
    setSaving(true);
    const data = {
      title: course.title, description: course.description, thumbnail: course.thumbnail,
      instructor: course.instructor, isPublished: course.isPublished,
      price: Number(course.price) || 0,
      discountPercent: Math.min(100, Math.max(0, Number(course.discountPercent) || 0)),
      discountActive: Boolean(course.discountActive),
    };
    const result = isNew ? await createCourse(data) : await updateCourse(courseId, data);
    setSaving(false);
    if (result.success) {
      showToast('success', isNew ? 'Course created!' : 'Changes saved');
      if (isNew) router.push('/admin/courses');
    } else {
      showToast('error', (result as any).error || 'Failed to save course');
    }
  };

  const handleDeleteCourse = async () => {
    if (!confirm('Delete this course and all its content? This cannot be undone.')) return;
    const result = await deleteCourse(courseId);
    if (result.success) router.push('/admin/courses');
    else showToast('error', (result as any).error || 'Failed to delete course');
  };

  const handleAddModule = async (title: string, description: string) => {
    const order = (course.modules?.length || 0) + 1;
    const result = await createModule(courseId, { title, description, order });
    if (result.success) {
      setCourse((prev: any) => ({ ...prev, modules: [...(prev.modules || []), { ...result.data, videos: [], pdfs: [] }] }));
      setShowModuleForm(false);
      showToast('success', 'Module added');
    } else showToast('error', (result as any).error || 'Failed to add module');
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Delete this module and all its content?')) return;
    const result = await deleteModule(moduleId);
    if (result.success) {
      setCourse((prev: any) => ({ ...prev, modules: prev.modules.filter((m: any) => m.id !== moduleId) }));
      showToast('success', 'Module deleted');
    } else showToast('error', (result as any).error || 'Failed to delete module');
  };

  const handleModuleUpdate = useCallback((updated: any) => {
    setCourse((prev: any) => ({ ...prev, modules: prev.modules.map((m: any) => m.id === updated.id ? updated : m) }));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (loadError) return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
      <h2 className="text-lg font-semibold text-foreground mb-2">Failed to load course</h2>
      <p className="text-xs text-destructive bg-red-50 rounded-xl px-4 py-3 mt-3 mb-6">{loadError}</p>
      <Link href="/admin/courses" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors">
        ← Back to Courses
      </Link>
    </div>
  );

  if (!course) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ToastContainer toasts={toasts} />

      {/* Back link */}
      <Link href="/admin/courses" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={14} /> Courses
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left panel — course details */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-semibold text-foreground">{isNew ? 'New Course' : 'Course Details'}</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Title *</label>
                <input type="text" value={course.title} onChange={(e) => setCourse({ ...course, title: e.target.value })} className={inputCls} placeholder="Enter course title" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Description</label>
                <textarea value={course.description} onChange={(e) => setCourse({ ...course, description: e.target.value })} className={inputCls} placeholder="What will learners gain?" rows={4} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Instructor</label>
                <input type="text" value={course.instructor} onChange={(e) => setCourse({ ...course, instructor: e.target.value })} className={inputCls} placeholder="Instructor name" />
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Price (UGX)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">UGX</span>
                  <input
                    type="number" min="0" step="500"
                    value={course.price ?? 0}
                    onChange={(e) => setCourse({ ...course, price: Number(e.target.value) })}
                    className={`${inputCls} pl-12`}
                    placeholder="0"
                  />
                </div>
                {(course.price ?? 0) === 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1">Set to 0 to mark the course as free</p>
                )}
              </div>

              {/* Discount */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Discount</label>
                  <button
                    type="button"
                    onClick={() => setCourse({ ...course, discountActive: !course.discountActive })}
                    className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${course.discountActive ? 'bg-primary' : 'bg-border'}`}
                    role="switch" aria-checked={course.discountActive}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${course.discountActive ? 'translate-x-4' : ''}`} />
                  </button>
                </div>
                {course.discountActive && (
                  <div className="relative">
                    <input
                      type="number" min="1" max="100" step="1"
                      value={course.discountPercent ?? 0}
                      onChange={(e) => setCourse({ ...course, discountPercent: Math.min(100, Math.max(0, Number(e.target.value))) })}
                      className={`${inputCls} pr-10`}
                      placeholder="e.g. 20"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">%</span>
                  </div>
                )}
                {course.discountActive && (course.price ?? 0) > 0 && (course.discountPercent ?? 0) > 0 && (
                  <p className="text-[10px] text-primary font-semibold">
                    Discounted price: UGX {Math.round((course.price ?? 0) * (1 - (course.discountPercent ?? 0) / 100)).toLocaleString()}
                  </p>
                )}
              </div>

              <FileOrUrlInput
                value={course.thumbnail}
                onChange={(value) => setCourse({ ...course, thumbnail: value })}
                fileType="thumbnail"
                schoolSlug={schoolSlug}
                label="Thumbnail"
                placeholder="https://…"
              />
            </div>

            {/* Publish toggle */}
            <div className="flex items-center justify-between py-3.5 px-4 bg-secondary rounded-xl">
              <div>
                <p className="text-sm font-semibold text-foreground">Publish</p>
                <p className="text-xs text-muted-foreground mt-0.5">Visible to all learners</p>
              </div>
              <button
                onClick={() => setCourse({ ...course, isPublished: !course.isPublished })}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${course.isPublished ? 'bg-primary' : 'bg-border'}`}
                role="switch" aria-checked={course.isPublished}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${course.isPublished ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            <div className="space-y-2 pt-1">
              <button onClick={handleSaveCourse} disabled={saving}
                className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 shadow-sm"
              >
                {saving ? 'Saving…' : isNew ? 'Create Course' : 'Save Changes'}
              </button>
              {!isNew && (
                <button onClick={handleDeleteCourse}
                  className="w-full py-2.5 border border-destructive/30 text-destructive text-sm font-semibold rounded-xl hover:bg-destructive/6 transition-colors"
                >
                  Delete Course
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right panel — curriculum */}
        {!isNew ? (
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Curriculum</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{course.modules?.length || 0} module{course.modules?.length !== 1 ? 's' : ''}</p>
              </div>
              {!showModuleForm && (
                <button onClick={() => setShowModuleForm(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <Plus size={14} /> Add Module
                </button>
              )}
            </div>

            {showModuleForm && (
              <AddModuleForm onSubmit={handleAddModule} onCancel={() => setShowModuleForm(false)} />
            )}

            {course.modules?.length > 0 ? (
              <div className="space-y-3">
                {course.modules.map((mod: any, index: number) => (
                  <ModuleCard
                    key={mod.id}
                    module={mod}
                    index={index}
                    schoolSlug={schoolSlug}
                    onDelete={() => handleDeleteModule(mod.id)}
                    onUpdate={handleModuleUpdate}
                    showToast={showToast}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <BookOpen className="w-8 h-8 text-border mx-auto mb-3" />
                <p className="text-sm font-semibold text-foreground mb-1">No modules yet</p>
                <p className="text-xs text-muted-foreground">Add your first module to build the curriculum.</p>
              </div>
            )}

            {/* Access Codes */}
            <AccessCodesPanel courseId={courseId} showToast={showToast} />
          </div>
        ) : (
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center h-full flex flex-col items-center justify-center gap-3">
              <BookOpen className="w-8 h-8 text-border" />
              <p className="text-sm font-semibold text-foreground">Create the course first</p>
              <p className="text-xs text-muted-foreground">Once saved, you can add modules, videos, and PDFs.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add Module Form ────────────────────────────────────────────────────────────
function AddModuleForm({ onSubmit, onCancel }: { onSubmit: (t: string, d: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setBusy(true);
    await onSubmit(title, description);
    setBusy(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
      <p className="text-xs font-semibold text-primary uppercase tracking-wider">New Module</p>
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls}
        placeholder="Module title" autoFocus onKeyDown={(e) => e.key === 'Enter' && submit()} />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls}
        placeholder="What does this module cover?" rows={2} />
      <div className="flex gap-2">
        <button onClick={submit} disabled={busy || !title.trim()}
          className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
        >
          {busy ? 'Adding…' : 'Add Module'}
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 bg-secondary text-muted-foreground text-sm font-semibold rounded-xl hover:bg-muted transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Module Card ────────────────────────────────────────────────────────────────
function ModuleCard({ module, index, schoolSlug, onDelete, onUpdate, showToast }: {
  module: any; index: number; schoolSlug: string;
  onDelete: () => void; onUpdate: (m: any) => void;
  showToast: (t: 'success' | 'error', m: string) => void;
}) {
  const [expanded, setExpanded]   = useState(false);
  const [editing, setEditing]     = useState(false);
  const [editTitle, setEditTitle] = useState(module.title ?? '');
  const [editDesc, setEditDesc]   = useState(module.description ?? '');
  const [saving, setSaving]       = useState(false);
  const videoCount = module.videos?.length || 0;
  const pdfCount   = module.pdfs?.length || 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    setSaving(true);
    const r = await updateModule(module.id, { title: editTitle.trim(), description: editDesc.trim() || undefined });
    setSaving(false);
    if (r.success) {
      onUpdate({ ...module, title: editTitle.trim(), description: editDesc.trim() || undefined });
      setEditing(false);
      showToast('success', 'Module updated');
    } else {
      showToast('error', 'Failed to update module');
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-150 ${expanded ? 'ring-2 ring-primary/20' : ''}`}>
      <div
        role="button" tabIndex={0}
        onClick={() => { if (!editing) setExpanded(!expanded); }}
        onKeyDown={(e) => !editing && (e.key === 'Enter' || e.key === ' ') && setExpanded(!expanded)}
        className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none group"
      >
        <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{module.title}</p>
          {module.description
            ? <p className="text-xs text-muted-foreground mt-0.5 truncate">{module.description}</p>
            : <p className="text-xs text-muted-foreground mt-0.5">
                {videoCount === 0 && pdfCount === 0
                  ? 'No content yet'
                  : `${videoCount} video${videoCount !== 1 ? 's' : ''}${pdfCount > 0 ? ` · ${pdfCount} PDF${pdfCount !== 1 ? 's' : ''}` : ''}`}
              </p>
          }
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setEditTitle(module.title ?? ''); setEditDesc(module.description ?? ''); setEditing(true); setExpanded(true); }}
            className="p-2 text-muted-foreground hover:text-primary rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            title="Edit module"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 text-muted-foreground hover:text-destructive rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={13} />
          </button>
          {expanded ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
        </div>
      </div>

      {editing && (
        <form onSubmit={handleSave} onClick={(e) => e.stopPropagation()} className="border-t border-black/[0.04] px-5 py-4 space-y-3">
          <div className="space-y-2">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Module title"
              className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:border-primary focus:outline-none bg-white"
              required
              autoFocus
            />
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Module description (optional) — shown to learners"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:border-primary focus:outline-none bg-white resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" disabled={saving || !editTitle.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors">
              {saving ? <><Loader2 size={12} className="animate-spin" /> Saving…</> : 'Save changes'}
            </button>
            <button type="button" onClick={() => setEditing(false)}
              className="px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-secondary transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {expanded && (
        <div className="border-t border-black/[0.04]">
          <VideoSection module={module} schoolSlug={schoolSlug} onUpdate={onUpdate} showToast={showToast} />
          <ResourceSection module={module} schoolSlug={schoolSlug} onUpdate={onUpdate} showToast={showToast} />
        </div>
      )}
    </div>
  );
}

// ── Video Section ──────────────────────────────────────────────────────────────
function VideoSection({ module, schoolSlug, onUpdate, showToast }: {
  module: any; schoolSlug: string;
  onUpdate: (m: any) => void; showToast: (t: 'success' | 'error', m: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="px-5 py-4 border-b border-black/[0.04]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Play size={13} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Videos</span>
          <span className="text-xs text-muted-foreground">({module.videos?.length || 0})</span>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary text-xs font-semibold text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <Plus size={11} /> Add Video
          </button>
        )}
      </div>

      {module.videos?.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {module.videos.map((vid: any) => (
            <ContentRow key={vid.id} icon={Play} title={vid.title}
              subtitle={vid.youtubeUrl || vid.url || ''}
              badge={vid.youtubeUrl ? 'YouTube' : 'Upload'}
              onDelete={async () => {
                const r = await deleteVideo(vid.id);
                if (r.success) { onUpdate({ ...module, videos: module.videos.filter((v: any) => v.id !== vid.id) }); showToast('success', 'Video removed'); }
                else showToast('error', 'Failed to remove video');
              }}
            />
          ))}
        </div>
      )}

      {showForm && (
        <AddVideoForm moduleId={module.id} schoolSlug={schoolSlug}
          onAdd={(video) => { onUpdate({ ...module, videos: [...(module.videos || []), video] }); showToast('success', 'Video added'); setShowForm(false); }}
          onCancel={() => setShowForm(false)} showToast={showToast}
        />
      )}
      {!showForm && module.videos?.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No videos yet</p>
      )}
    </div>
  );
}

// ── Resource (PDF) Section ─────────────────────────────────────────────────────
function ResourceSection({ module, schoolSlug, onUpdate, showToast }: {
  module: any; schoolSlug: string;
  onUpdate: (m: any) => void; showToast: (t: 'success' | 'error', m: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText size={13} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">PDFs</span>
          <span className="text-xs text-muted-foreground">({module.pdfs?.length || 0})</span>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary text-xs font-semibold text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <Plus size={11} /> Add PDF
          </button>
        )}
      </div>

      {module.pdfs?.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {module.pdfs.map((p: any) => (
            <ContentRow key={p.id} icon={FileText} title={p.title} subtitle={p.url}
              onDelete={async () => {
                const r = await deletePdf(p.id);
                if (r.success) { onUpdate({ ...module, pdfs: module.pdfs.filter((x: any) => x.id !== p.id) }); showToast('success', 'PDF removed'); }
                else showToast('error', 'Failed to remove PDF');
              }}
            />
          ))}
        </div>
      )}

      {showForm && (
        <AddPdfForm moduleId={module.id} schoolSlug={schoolSlug}
          onAdd={(pdf) => { onUpdate({ ...module, pdfs: [...(module.pdfs || []), pdf] }); showToast('success', 'PDF added'); setShowForm(false); }}
          onCancel={() => setShowForm(false)} showToast={showToast}
        />
      )}
      {!showForm && module.pdfs?.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No PDFs yet</p>
      )}
    </div>
  );
}

// ── Content Row ────────────────────────────────────────────────────────────────
function ContentRow({ icon: Icon, title, subtitle, badge, onDelete }: {
  icon: any; title: string; subtitle?: string; badge?: string; onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-secondary rounded-xl group">
      <Icon size={13} className="text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">{title}</p>
          {badge && (
            <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>}
      </div>
      <button onClick={onDelete}
        className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

// ── Upload Progress Bar ────────────────────────────────────────────────────────
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Uploading…</span>
        <span>{progress}%</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ── Add Video Form ─────────────────────────────────────────────────────────────
function AddVideoForm({ moduleId, schoolSlug, onAdd, onCancel, showToast }: {
  moduleId: string; schoolSlug: string;
  onAdd: (v: any) => void; onCancel: () => void;
  showToast: (t: 'success' | 'error', m: string) => void;
}) {
  const [title, setTitle]             = useState('');
  const [source, setSource]           = useState<'youtube' | 'upload'>('youtube');
  const [youtubeUrl, setYoutubeUrl]   = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [progress, setProgress]       = useState(0);
  const [uploading, setUploading]     = useState(false);
  const [busy, setBusy]               = useState(false);
  const titleRef                      = useRef<HTMLInputElement>(null);
  // Track pending auto-save URL so we can trigger submit after title is filled
  const pendingUrl                    = useRef<string>('');

  const saveToDb = async (resolvedTitle: string, url: string) => {
    setBusy(true);
    const result = await createVideo(moduleId, { title: resolvedTitle, url, order: 999 });
    setBusy(false);
    if (result.success) onAdd(result.data);
    else showToast('error', (result as any).error || 'Failed to save video');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setProgress(0);
    // Pre-fill title from filename (strip extension)
    const autoTitle = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    if (!title.trim()) setTitle(autoTitle);
    const result = await uploadToBlob(file, 'video', schoolSlug, setProgress);
    setUploading(false);
    e.target.value = '';
    if (!result.success) { showToast('error', result.error); return; }
    // Auto-save: use current title or the auto-filled one
    const resolvedTitle = title.trim() || autoTitle;
    if (resolvedTitle) {
      await saveToDb(resolvedTitle, result.url);
    } else {
      // Title still empty — store url and focus title so user can complete
      setUploadedUrl(result.url);
      pendingUrl.current = result.url;
      setTimeout(() => titleRef.current?.focus(), 50);
      showToast('success', 'Upload done — enter a title and click Save');
    }
  };

  const submit = async () => {
    if (!title.trim()) { showToast('error', 'Video title is required'); titleRef.current?.focus(); return; }
    const url = source === 'youtube' ? youtubeUrl.trim() : (uploadedUrl || pendingUrl.current);
    if (!url) { showToast('error', source === 'youtube' ? 'Paste a YouTube URL' : 'Upload a video first'); return; }
    await saveToDb(title.trim(), url);
  };

  return (
    <div className="mt-3 bg-secondary rounded-2xl overflow-hidden">
      <div className="flex border-b border-black/[0.06]">
        {(['youtube', 'upload'] as const).map((s) => (
          <button key={s} onClick={() => setSource(s)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-colors ${
              source === s ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {s === 'youtube' ? <Video size={13} /> : <Upload size={13} />}
            {s === 'youtube' ? 'YouTube' : 'Upload File'}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        <input ref={titleRef} type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls}
          placeholder="Video title" autoFocus />

        {source === 'youtube' && (
          <div>
            <input type="text" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className={inputCls}
              placeholder="https://youtube.com/watch?v=… or youtu.be/…" />
            {youtubeUrl && (
              <p className={`flex items-center gap-1.5 text-xs mt-1.5 ${isYouTubeLike(youtubeUrl) ? 'text-green-600' : 'text-destructive'}`}>
                {isYouTubeLike(youtubeUrl) ? <Check size={12} /> : <AlertCircle size={12} />}
                {isYouTubeLike(youtubeUrl) ? 'Valid YouTube URL' : 'Must be a youtube.com or youtu.be link'}
              </p>
            )}
          </div>
        )}

        {source === 'upload' && (
          <div>
            <input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
              onChange={handleFileUpload} className="hidden" id={`video-${moduleId}`} />
            {uploading ? (
              <ProgressBar progress={progress} />
            ) : uploadedUrl ? (
              <div className="flex items-center gap-3 px-3 py-2.5 bg-green-50 rounded-xl">
                <Check size={14} className="text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-green-700">Uploaded — add a title and click Save</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{uploadedUrl}</p>
                </div>
                <button onClick={() => { setUploadedUrl(''); pendingUrl.current = ''; }} className="text-muted-foreground hover:text-foreground"><Trash2 size={12} /></button>
              </div>
            ) : busy ? (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-primary/5 rounded-xl">
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                <p className="text-xs text-primary font-medium">Saving to course…</p>
              </div>
            ) : (
              <label htmlFor={`video-${moduleId}`}
                className="flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 hover:bg-white/60 transition-colors"
              >
                <Upload size={20} className="text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Click to choose a video</span>
                <span className="text-xs text-muted-foreground">Uploads and saves automatically · MP4, WebM, MOV</span>
              </label>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={submit} disabled={busy || uploading}
            className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
          >
            {busy ? 'Saving…' : 'Save Video'}
          </button>
          <button onClick={onCancel} disabled={busy || uploading} className="px-4 py-2.5 bg-white text-muted-foreground text-sm font-semibold rounded-xl hover:bg-muted transition-colors disabled:opacity-40">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add PDF Form ───────────────────────────────────────────────────────────────
function AddPdfForm({ moduleId, schoolSlug, onAdd, onCancel, showToast }: {
  moduleId: string; schoolSlug: string;
  onAdd: (p: any) => void; onCancel: () => void;
  showToast: (t: 'success' | 'error', m: string) => void;
}) {
  const [title, setTitle]             = useState('');
  const [source, setSource]           = useState<'url' | 'upload'>('url');
  const [pdfUrl, setPdfUrl]           = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [progress, setProgress]       = useState(0);
  const [uploading, setUploading]     = useState(false);
  const [busy, setBusy]               = useState(false);
  const titleRef                      = useRef<HTMLInputElement>(null);
  const pendingUrl                    = useRef<string>('');

  const saveToDb = async (resolvedTitle: string, url: string) => {
    setBusy(true);
    const result = await createPdf(moduleId, { title: resolvedTitle, url, order: 999 });
    setBusy(false);
    if (result.success) onAdd(result.data);
    else showToast('error', (result as any).error || 'Failed to save PDF');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setProgress(0);
    const autoTitle = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    if (!title.trim()) setTitle(autoTitle);
    const result = await uploadToBlob(file, 'pdf', schoolSlug, setProgress);
    setUploading(false);
    e.target.value = '';
    if (!result.success) { showToast('error', result.error); return; }
    const resolvedTitle = title.trim() || autoTitle;
    if (resolvedTitle) {
      await saveToDb(resolvedTitle, result.url);
    } else {
      setUploadedUrl(result.url);
      pendingUrl.current = result.url;
      setTimeout(() => titleRef.current?.focus(), 50);
      showToast('success', 'Upload done — enter a title and click Save');
    }
  };

  const submit = async () => {
    if (!title.trim()) { showToast('error', 'PDF title is required'); titleRef.current?.focus(); return; }
    const url = source === 'url' ? pdfUrl.trim() : (uploadedUrl || pendingUrl.current);
    if (!url) { showToast('error', source === 'url' ? 'Enter a URL' : 'Upload a PDF first'); return; }
    await saveToDb(title.trim(), url);
  };

  return (
    <div className="mt-3 bg-secondary rounded-2xl overflow-hidden">
      <div className="flex border-b border-black/[0.06]">
        {(['url', 'upload'] as const).map((s) => (
          <button key={s} onClick={() => setSource(s)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-colors ${
              source === s ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {s === 'url' ? <Link2 size={13} /> : <Upload size={13} />}
            {s === 'url' ? 'PDF URL' : 'Upload File'}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        <input ref={titleRef} type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls}
          placeholder="PDF title" autoFocus />

        {source === 'url' && (
          <input type="text" value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} className={inputCls}
            placeholder="https://…" />
        )}

        {source === 'upload' && (
          <div>
            <input type="file" accept="application/pdf,.pdf"
              onChange={handleFileUpload} className="hidden" id={`pdf-${moduleId}`} />
            {uploading ? (
              <ProgressBar progress={progress} />
            ) : uploadedUrl ? (
              <div className="flex items-center gap-3 px-3 py-2.5 bg-green-50 rounded-xl">
                <Check size={14} className="text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-green-700">Uploaded — add a title and click Save</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{uploadedUrl}</p>
                </div>
                <button onClick={() => { setUploadedUrl(''); pendingUrl.current = ''; }} className="text-muted-foreground hover:text-foreground"><Trash2 size={12} /></button>
              </div>
            ) : busy ? (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-primary/5 rounded-xl">
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                <p className="text-xs text-primary font-medium">Saving to course…</p>
              </div>
            ) : (
              <label htmlFor={`pdf-${moduleId}`}
                className="flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 hover:bg-white/60 transition-colors"
              >
                <Upload size={20} className="text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Click to choose a PDF</span>
                <span className="text-xs text-muted-foreground">Uploads and saves automatically · PDF, max 50 MB</span>
              </label>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={submit} disabled={busy || uploading}
            className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
          >
            {busy ? 'Saving…' : 'Save PDF'}
          </button>
          <button onClick={onCancel} disabled={busy || uploading} className="px-4 py-2.5 bg-white text-muted-foreground text-sm font-semibold rounded-xl hover:bg-muted transition-colors disabled:opacity-40">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
